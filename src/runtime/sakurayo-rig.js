/* SakurayoRig：看板娘网格变形运行时（docs/ANIM_PIPELINE.md）。
   读取 tools/anim-pipeline 产出的 art/live/<id>/{rig.js,base.webp,atlas.webp}；WebGL1 网格变形 + 表情补丁混合。
   参数：头部转向（深度视差）、呼吸（胸/肩）、伸懒腰、头发/裙摆二阶弹簧 + 风、视线、眨眼、口型、表情交叉淡入。
   不做整图平移/弹跳：所有运动都由每顶点权重驱动，脚底权重为 0。无 WebGL 时退回静态 2D（仍有眨眼/表情）。 */
(function (global) {
  "use strict";
  var DATA = global.SakurayoRigData = global.SakurayoRigData || {};
  function dec(b64, n) { var s = atob(b64), a = new Float32Array(n); for (var i = 0; i < n; i++) a[i] = s.charCodeAt(i) / 255; return a; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function damp(c, t, dt, k) { return c + (t - c) * (1 - Math.exp(-dt / k)); }
  function ease(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function bump(t, a, b) { return t <= 0 || t >= 1 ? 0 : ease(Math.min(t / a, 1)) * ease(Math.min((1 - t) / b, 1)); }
  var KEYS = ["head", "hair", "skirt", "chest", "upper", "depth", "eyes"];

  function Rig(canvas, d, baseImg, atlasImg, opts) {
    this.c = canvas; this.d = d; this.opts = opts || {}; this.t = 0;
    var gx = d.grid[0], gy = d.grid[1], n = gx * gy, bb = d.bbox, W = this.W = {}, k;
    for (k = 0; k < KEYS.length; k++) W[KEYS[k]] = d.weights[KEYS[k]] ? dec(d.weights[KEYS[k]], n) : new Float32Array(n);
    this.gx = gx; this.gy = gy;
    var lm = d.landmarks; this.lm = lm;
    this.s = { hx: 0, hy: 0, tx: 0, ty: 0, tilt: 0, gaze: 0, gazeY: 0, hair: 0, hairV: 0, skirt: 0, skirtV: 0, breath: 0, stretch: 0,
      ex: { closed: 0, talk: 0, happy: 0, shy: 0 }, blinkT: -1, blinkWait: 1.6, act: null, actT: 0, talkUntil: 0, prevHx: 0, idleWait: 9 };
    // 网格：主体 + 每个补丁的子网格（权重双线性取样）
    this.meshes = [];
    var self = this;
    function sample(arr, x, y) {
      var fx = clamp((x - bb[0]) / (bb[2] - bb[0]) * (gx - 1), 0, gx - 1), fy = clamp((y - bb[1]) / (bb[3] - bb[1]) * (gy - 1), 0, gy - 1);
      var x0 = Math.floor(fx), y0 = Math.floor(fy), x1 = Math.min(gx - 1, x0 + 1), y1 = Math.min(gy - 1, y0 + 1), u = fx - x0, v = fy - y0;
      return (arr[y0 * gx + x0] * (1 - u) + arr[y0 * gx + x1] * u) * (1 - v) + (arr[y1 * gx + x0] * (1 - u) + arr[y1 * gx + x1] * u) * v;
    }
    function grid(x0, y0, x1, y1, nx, ny, uv) {
      var pos = new Float32Array(nx * ny * 2), w = {}, tex = new Float32Array(nx * ny * 2), idx = [], i, j, q;
      KEYS.forEach(function (kk) { w[kk] = new Float32Array(nx * ny); });
      for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) {
        q = j * nx + i; var x = x0 + (x1 - x0) * i / (nx - 1), y = y0 + (y1 - y0) * j / (ny - 1);
        pos[q * 2] = x; pos[q * 2 + 1] = y; var t = uv(x, y); tex[q * 2] = t[0]; tex[q * 2 + 1] = t[1];
        KEYS.forEach(function (kk) { w[kk][q] = sample(W[kk], x, y); });
        if (i < nx - 1 && j < ny - 1) idx.push(q, q + 1, q + nx, q + 1, q + nx + 1, q + nx);
      }
      return { pos: pos, tex: tex, w: w, idx: new Uint16Array(idx), out: new Float32Array(nx * ny * 2), n: nx * ny };
    }
    this.meshes.push(grid(bb[0], bb[1], bb[2], bb[3], gx, gy, function (x, y) { return [x / d.w, y / d.h]; }));
    this.meshes[0].tex0 = "base";
    var aw = atlasImg ? atlasImg.width : 1, ah = atlasImg ? atlasImg.height : 1;
    Object.keys(d.patches || {}).forEach(function (name) {
      var p = d.patches[name];
      var m = grid(p.x, p.y, p.x + p.w, p.y + p.h, 10, 10, function (x, y) { return [(p.ax + x - p.x) / aw, (p.ay + y - p.y) / ah]; });
      m.tex0 = "atlas"; m.expr = name; self.meshes.push(m);
    });
    this.base = baseImg; this.atlas = atlasImg;
    this.gl = this.opts.no3d ? null : this.initGL();
  }
  Rig.prototype.initGL = function () {
    // 降级：软件渲染（failIfMajorPerformanceCaveat）/ 无 WebGL / ?rig=2d → Canvas2D
    if (/[?&]rig=2d/.test((global.location && global.location.search) || "")) return null;
    var gl = this.c.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: true, failIfMajorPerformanceCaveat: true });
    if (!gl) return null;
    var self0 = this;
    this.c.addEventListener("webglcontextlost", function (e) { e.preventDefault(); self0.lost = 1; }, false);
    function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; }
    var pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, "attribute vec2 p;attribute vec2 u;uniform vec4 m;varying vec2 v;void main(){v=u;gl_Position=vec4(p.x*m.x+m.z,p.y*m.y+m.w,0.,1.);}"));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, "precision mediump float;varying vec2 v;uniform sampler2D t;uniform float a;void main(){vec4 c=texture2D(t,v);gl_FragColor=c*a;}"));
    gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    gl.useProgram(pr);
    this.loc = { p: gl.getAttribLocation(pr, "p"), u: gl.getAttribLocation(pr, "u"), m: gl.getUniformLocation(pr, "m"), a: gl.getUniformLocation(pr, "a") };
    function tex(img) { var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; }
    this.tex = {}; var ti = this.texImgs || { base: this.base, atlas: this.atlas }; for (var tk in ti) this.tex[tk] = ti[tk] ? tex(ti[tk]) : null;
    var self = this;
    this.meshes.forEach(function (m) {
      m.pb = gl.createBuffer(); m.tb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, m.tb); gl.bufferData(gl.ARRAY_BUFFER, m.tex, gl.STATIC_DRAW);
      m.ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, m.idx, gl.STATIC_DRAW);
    });
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    return gl;
  };
  /* —— 动作 —— */
  var ACTS = {
    stretch: { dur: 3.0 }, pin: { dur: 2.6 }, look: { dur: 3.2 },
    head: { dur: 1.6 }, hair: { dur: 1.4 }, chest: { dur: 2.0 }, skirt: { dur: 1.8 }, body: { dur: 1.3 }
  };
  Rig.prototype.play = function (name) { if (!ACTS[name]) return false; var s = this.s; s.act = name; s.actT = 0;
    if (name === "hair") s.hairV += 2.6; if (name === "skirt") s.skirtV += 2.4; if (name === "head") s.hairV += 1.2; return true; };
  Rig.prototype.part = function (ix, iy) { // image-space hit test
    var lm = this.lm, f = lm.face, ed = lm.eyeDist, i = this.at(ix, iy);
    if (ix > f[0] - f[2] * 0.05 && ix < f[0] + f[2] * 1.05 && iy > f[1] - f[3] * 0.35 && iy < f[1] + f[3] * 0.95) return "head";
    if (i && i.hair > 0.45) return "hair";
    if (i && i.skirt > 0.35) return "skirt";
    if (Math.hypot(ix - lm.chest[0], iy - lm.chest[1]) < ed * 1.5) return "chest";
    return "body";
  };
  Rig.prototype.at = function (x, y) { var bb = this.d.bbox, gx = this.gx, gy = this.gy, i = Math.round((x - bb[0]) / (bb[2] - bb[0]) * (gx - 1)), j = Math.round((y - bb[1]) / (bb[3] - bb[1]) * (gy - 1));
    if (i < 0 || j < 0 || i >= gx || j >= gy) return null; var q = j * gx + i, o = {}; for (var k in this.W) o[k] = this.W[k][q]; return o; };
  Rig.prototype.lookAt = function (x, y) { this.s.tx = clamp(x, -1, 1); this.s.ty = clamp(y, -1, 1); this.s.lookHold = 2.5; };
  Rig.prototype.say = function (sec) { this.s.talkUntil = this.t + (sec || 1.6); };
  Rig.prototype.update = function (dt) {
    var s = this.s, t = (this.t += dt), a = s.act ? s.actT / ACTS[s.act].dur : 0, ex = { closed: 0, talk: 0, happy: 0, shy: 0 }, tilt = 0, hy = 0, hx = 0, st = 0;
    if (s.act) { s.actT += dt; if (s.actT >= ACTS[s.act].dur) { s.act = null; a = 0; } }
    // 闲置小动作（伸懒腰 / 整理发夹 / 东张西望）
    if (!s.act) { s.idleWait -= dt; if (s.idleWait <= 0 && !this.opts.test) { this.play(["stretch", "pin", "look"][Math.floor(Math.random() * 3)]); s.idleWait = 12 + Math.random() * 10; } }
    var k = s.act ? bump(a, 0.25, 0.3) : 0;
    switch (s.act) {
      case "stretch": st = bump(a, 0.35, 0.35); ex.happy = bump(a, 0.3, 0.25); hy = -0.7 * st; break;
      case "pin": tilt = -0.07 * k; hx = -0.35 * k; ex.talk = a > 0.35 && a < 0.8 ? 0.5 + 0.5 * Math.sin(t * 18) : 0; if (a > 0.3 && a < 0.6) s.hairV += Math.sin(t * 30) * 0.12; break;
      case "look": hx = Math.sin(a * Math.PI * 2) * 0.8 * k; s.gaze = Math.sin(a * Math.PI * 2) * k; break;
      case "head": ex.happy = k; tilt = Math.sin(a * Math.PI * 4) * 0.045 * k; hy = 0.3 * k; break;
      case "hair": ex.shy = k * 0.8; ex.talk = k * 0.5; hx = 0.3 * k; break;
      case "chest": ex.shy = k; hy = -0.55 * k; tilt = 0.04 * k; break;
      case "skirt": ex.shy = k; hy = 0.35 * k; hx = -0.3 * k; break;
      case "body": ex.talk = k * (0.5 + 0.5 * Math.sin(t * 16)); hy = 0.15 * k; break;
    }
    // 视线跟随（指针/陀螺仪）；无输入时缓慢漂移
    s.lookHold = (s.lookHold || 0) - dt;
    var lx = s.lookHold > 0 ? s.tx : Math.sin(t * 0.23) * 0.25, ly = s.lookHold > 0 ? s.ty : Math.sin(t * 0.31) * 0.12;
    s.hx = damp(s.hx, clamp(lx * 0.8 + hx, -1, 1), dt, 0.35); s.hy = damp(s.hy, clamp(ly * 0.7 + hy, -1, 1), dt, 0.4);
    s.tilt = damp(s.tilt, tilt + s.hx * 0.02, dt, 0.25); s.stretch = damp(s.stretch, st, dt, 0.18);
    if (s.act !== "look") s.gaze = damp(s.gaze, lx, dt, 0.12);
    s.gazeY = damp(s.gazeY, ly, dt, 0.12);
    s.breath = Math.sin(t * Math.PI * 2 / 3.6);
    // 二阶弹簧：头部速度 + 风
    var hv = (s.hx - s.prevHx) / Math.max(dt, 1e-3); s.prevHx = s.hx;
    var wind = 0.18 * Math.sin(t * 0.9) + 0.08 * Math.sin(t * 2.3 + 1.3);
    s.hairV += (-(s.hair - wind) * 18 - s.hairV * 3.2 - hv * 1.4) * dt; s.hair += s.hairV * dt;
    s.skirtV += (-(s.skirt - wind * 0.6) * 22 - s.skirtV * 3.8 - s.stretch * 0.5) * dt; s.skirt += s.skirtV * dt;
    // 眨眼（2–5 s，18% 双眨）
    if (s.blinkT < 0) { s.blinkWait -= dt; if (s.blinkWait <= 0) { s.blinkT = 0; s.blinkWait = 2 + Math.random() * 3; if (Math.random() < 0.18) s.dbl = 1; } }
    var blink = 0;
    if (s.blinkT >= 0) { s.blinkT += dt; var b = s.blinkT; blink = b < 0.07 ? b / 0.07 : b < 0.11 ? 1 : b < 0.23 ? 1 - (b - 0.11) / 0.12 : 0; if (b >= 0.23) { s.blinkT = s.dbl ? -0.0001 : -1; if (s.dbl) { s.dbl = 0; s.blinkT = -1; s.blinkWait = 0.12; } } }
    if (this.t < s.talkUntil) ex.talk = Math.max(ex.talk, 0.5 + 0.5 * Math.sin(t * 17) * Math.sin(t * 5.3));
    ex.closed = Math.max(blink * (1 - ex.happy) * (1 - ex.shy), 0);
    for (var e in s.ex) s.ex[e] = damp(s.ex[e], ex[e] || 0, dt, e === "closed" ? 0.012 : e === "talk" ? 0.04 : 0.12);
    this.deform();
  };
  Rig.prototype.deform = function () {
    var s = this.s, lm = this.lm, ed = lm.eyeDist, nx = lm.neck[0], ny = lm.neck[1], cx = lm.chest[0], sc = this.d.w / 1024;
    var ca = Math.cos(s.tilt), sa = Math.sin(s.tilt);
    for (var mi = 0; mi < this.meshes.length; mi++) {
      var m = this.meshes[mi], P = m.pos, O = m.out, w = m.w;
      for (var q = 0; q < m.n; q++) {
        var x = P[q * 2], y = P[q * 2 + 1], H = w.head[q], D = w.depth[q], dx = 0, dy = 0;
        // 头部：绕颈点旋转 + 深度视差平移（近处移动更多 → 立体感）
        if (H > 0.001) { var rx = x - nx, ry = y - ny; dx += (rx * ca - ry * sa - rx) * H; dy += (rx * sa + ry * ca - ry) * H;
          dx += s.hx * (7 + 16 * D) * H * sc; dy += s.hy * (5 + 9 * D) * H * sc; }
        dx += s.gaze * w.eyes[q] * 4 * sc; dy += s.gazeY * w.eyes[q] * 2.5 * sc;
        // 呼吸：胸口起伏 + 肩膀轻抬（上半身权重），脚底不动
        dy += -s.breath * (3.2 * w.chest[q] + 1.6 * w.upper[q]) * sc; dx += (x - cx) * s.breath * 0.006 * w.chest[q];
        // 伸懒腰
        dy += -s.stretch * 30 * w.upper[q] * sc; dx += -(x - cx) * s.stretch * 0.025 * w.upper[q];
        // 头发 / 裙摆二阶摆动
        dx += s.hair * w.hair[q] * 26 * sc; dy += -Math.abs(s.hair) * w.hair[q] * 3 * sc;
        dx += s.skirt * w.skirt[q] * 16 * sc + (x - cx) * Math.abs(s.skirt) * 0.03 * w.skirt[q];
        O[q * 2] = x + dx; O[q * 2 + 1] = y + dy;
      }
    }
  };
  Rig.prototype.fit = function () { // contain + 底部对齐（与原 object-position:center 8% 一致）
    var c = this.c, dpr = Math.min(global.devicePixelRatio || 1, 2), r = c.getBoundingClientRect(), W = Math.max(1, Math.round(r.width * dpr)), H = Math.max(1, Math.round(r.height * dpr));
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    var sc = Math.min(W / this.d.w, H / this.d.h), ox = (W - this.d.w * sc) / 2, oy = (H - this.d.h * sc) * 0.08;
    this.view = { sc: sc, ox: ox, oy: oy, W: W, H: H, dpr: dpr }; return this.view;
  };
  Rig.prototype.toImage = function (clientX, clientY) { var r = this.c.getBoundingClientRect(), v = this.view || this.fit(); return [((clientX - r.left) * v.dpr - v.ox) / v.sc, ((clientY - r.top) * v.dpr - v.oy) / v.sc]; };
  Rig.prototype.render = function () {
    if (this.lost && this.gl) { var n = this.c.cloneNode(); this.c.parentNode && this.c.parentNode.replaceChild(n, this.c); this.c = n; this.gl = null; }
    var v = this.fit(), gl = this.gl;
    if (!gl) return this.render2d(v);
    gl.viewport(0, 0, v.W, v.H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform4f(this.loc.m, 2 * v.sc / v.W, -2 * v.sc / v.H, 2 * v.ox / v.W - 1, 1 - 2 * v.oy / v.H);
    for (var i = 0; i < this.meshes.length; i++) {
      var m = this.meshes[i], al = m.expr ? this.s.ex[m.expr] || 0 : 1, fr = this.v2 && this.s.seq ? this.seqFrame() : null;
      if (m.action) { if (!fr || fr.A !== m.A || !this.tex[m.tex0]) continue; this.drawSeq(gl, m, fr); continue; }
      if (fr && m.kind === "arm" && m.side === (fr.A.side || this.d.bones.pinSide) && fr.fade > 0.99) continue; // 序列帧里已包含手臂（首帧与静止姿态逐像素一致，切换无跳变）
      if (al < 0.01 || !this.tex[m.tex0]) continue;
      gl.bindTexture(gl.TEXTURE_2D, this.tex[m.tex0]); gl.uniform1f(this.loc.a, al);
      gl.bindBuffer(gl.ARRAY_BUFFER, m.pb); gl.bufferData(gl.ARRAY_BUFFER, m.out, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(this.loc.p); gl.vertexAttribPointer(this.loc.p, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, m.tb); gl.enableVertexAttribArray(this.loc.u); gl.vertexAttribPointer(this.loc.u, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.ib); gl.drawElements(gl.TRIANGLES, m.idx.length, gl.UNSIGNED_SHORT, 0);
    }
  };
  Rig.prototype.drawSeq = function (gl, m, fr) {
    var i0 = Math.floor(fr.pos), i1 = Math.min(fr.n - 1, i0 + 1), k = fr.pos - i0, A = m.A, self = this;
    function uv(dst, i) { var o = A.frames[i]; for (var q = 0; q < m.n; q++) { dst[q * 2] = (o[0] + m.uv0[q * 2] * A.tw) / m.iw; dst[q * 2 + 1] = (o[1] + m.uv0[q * 2 + 1] * A.th) / m.ih; } }
    gl.bindTexture(gl.TEXTURE_2D, this.tex[m.tex0]);
    gl.bindBuffer(gl.ARRAY_BUFFER, m.pb); gl.bufferData(gl.ARRAY_BUFFER, m.out, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(this.loc.p); gl.vertexAttribPointer(this.loc.p, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.ib);
    [[i0, 1], [i1, k]].forEach(function (p) {
      if (p[1] * fr.fade < 0.01) return; uv(m.tex2, p[0]); gl.uniform1f(self.loc.a, p[1] * fr.fade);
      gl.bindBuffer(gl.ARRAY_BUFFER, m.tb); gl.bufferData(gl.ARRAY_BUFFER, m.tex2, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(self.loc.u); gl.vertexAttribPointer(self.loc.u, 2, gl.FLOAT, false, 0, 0);
      gl.drawElements(gl.TRIANGLES, m.idx.length, gl.UNSIGNED_SHORT, 0);
    });
  };
  Rig.prototype.render2d = function (v) {
    // 2D 降级：不做网格，只做以脚底为锚的轻微呼吸缩放（无平移/弹跳）+ 眨眼/表情补丁
    var g = this.c.getContext("2d"), b = 1 + this.s.breath * 0.004 + this.s.stretch * 0.02, fy = v.oy + this.d.bbox[3] * v.sc;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, v.W, v.H); g.setTransform(1, 0, 0, b, 0, fy * (1 - b));
    g.drawImage(this.base, v.ox, v.oy, this.d.w * v.sc, this.d.h * v.sc);
    var fr2 = this.v2 && this.s.seq ? this.seqFrame() : null;
    if (fr2) { var Aq = fr2.A, im = this.texImgs["act_" + this.s.seq.name], i0 = Math.floor(fr2.pos), r = Aq.rect;
      [[i0, 1], [Math.min(fr2.n - 1, i0 + 1), fr2.pos - i0]].forEach(function (p) { if (p[1] < 0.01) return; g.globalAlpha = p[1]; var o = Aq.frames[p[0]]; g.drawImage(im, o[0], o[1], Aq.tw, Aq.th, v.ox + r[0] * v.sc, v.oy + r[1] * v.sc, r[2] * v.sc, r[3] * v.sc); }); g.globalAlpha = 1; }
    else if (this.v2 && this.texImgs.arms) for (var sd in this.d.arms) { var A = this.d.arms[sd]; g.drawImage(this.texImgs.arms, A.ax, A.ay, A.w, A.h, v.ox + A.x * v.sc, v.oy + A.y * v.sc, A.w * v.sc, A.h * v.sc); }
    for (var k in this.d.patches) { var p = this.d.patches[k], al = this.s.ex[k] || 0; if (al < 0.01 || !this.atlas) continue; g.globalAlpha = al;
      g.drawImage(this.atlas, p.ax, p.ay, p.w, p.h, v.ox + p.x * v.sc, v.oy + p.y * v.sc, p.w * v.sc, p.h * v.sc); g.globalAlpha = 1; }
    g.setTransform(1, 0, 0, 1, 0, 0);
  };
  Rig.prototype.snapshot = function () { var s = this.s; return { gl: !!this.gl, act: s.act, hx: +s.hx.toFixed(3), hy: +s.hy.toFixed(3), hair: +s.hair.toFixed(3), skirt: +s.skirt.toFixed(3), breath: +s.breath.toFixed(3), stretch: +s.stretch.toFixed(3), ex: { closed: +s.ex.closed.toFixed(2), talk: +s.ex.talk.toFixed(2), happy: +s.ex.happy.toFixed(2), shy: +s.ex.shy.toFixed(2) }, meshes: this.meshes.length }; };

  /* ===== rig v2：拆层 + 骨骼 + 蒙皮（全身联动） =====
     骨骼：pelvis → waist → chest → neck → head（层级），腿以脚为根随骨盆剪切；双臂 upper/fore 挂在 chest 上。
     转头联动：头 100% / 颈 60% / 胸 30% / 腰 15%，越往下延迟越大。呼吸带胸口/肩/手臂；重心左右交替。
     二级物理：头发←头部运动，裙摆←骨盆运动，饰品←胸部运动（弹簧，非独立正弦）。 */
  var KEYS2 = ["head", "neck", "chest", "waist", "pelvis", "leg", "hair", "skirt", "chestw", "acc", "depth", "eyes", "headf"];
  function M(a, b, c, d, e, f) { return [a, b, c, d, e, f]; }
  function mul(m, n) { return [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]]; }
  function rotAt(th, px, py, sx, sy) { var c = Math.cos(th), s = Math.sin(th); sx = sx || 1; sy = sy || 1; var a = c * sx, b = s * sx, cc = -s * sy, d = c * sy; return [a, b, cc, d, px - a * px - cc * py, py - b * px - d * py]; }
  function tr(x, y) { return [1, 0, 0, 1, x, y]; }
  function ap(m, x, y) { return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]; }
  function Rig2(canvas, d, imgs, opts) {
    this.c = canvas; this.d = d; this.opts = opts || {}; this.t = 0; this.lm = d.landmarks; this.v2 = 1;
    this.base = imgs.body; this.atlas = imgs.atlas; this.texImgs = { body: imgs.body, arms: imgs.arms, atlas: imgs.atlas };
    this.s = { hx: 0, hy: 0, tx: 0, ty: 0, tilt: 0, gaze: 0, gazeY: 0, hair: 0, hairV: 0, skirt: 0, skirtV: 0, acc: 0, accV: 0, breath: 0, stretch: 0,
      ex: { closed: 0, talk: 0, happy: 0, shy: 0 }, blinkT: -1, blinkWait: 1.6, act: null, actT: 0, talkUntil: 0, prevHx: 0, idleWait: 9,
      lag: { neck: 0, chest: 0, waist: 0, neckY: 0, chestY: 0 }, pin: 0, wave: 0, prev: {}, seq: null, armHold: 1 };
    var gx = d.grid[0], gy = d.grid[1], n = gx * gy, bb = d.bbox, W = {}, k; this.gx = gx; this.gy = gy;
    for (k = 0; k < KEYS2.length; k++) W[KEYS2[k]] = d.weights[KEYS2[k]] ? dec(d.weights[KEYS2[k]], n) : new Float32Array(n);
    this.W = W; W.head = W.head; // for part()/at()
    function sample(arr, x, y) {
      var fx = clamp((x - bb[0]) / (bb[2] - bb[0]) * (gx - 1), 0, gx - 1), fy = clamp((y - bb[1]) / (bb[3] - bb[1]) * (gy - 1), 0, gy - 1);
      var x0 = Math.floor(fx), y0 = Math.floor(fy), x1 = Math.min(gx - 1, x0 + 1), y1 = Math.min(gy - 1, y0 + 1), u = fx - x0, v = fy - y0;
      return (arr[y0 * gx + x0] * (1 - u) + arr[y0 * gx + x1] * u) * (1 - v) + (arr[y1 * gx + x0] * (1 - u) + arr[y1 * gx + x1] * u) * v;
    }
    function grid(x0, y0, x1, y1, nx, ny, uv, wsrc) {
      var pos = new Float32Array(nx * ny * 2), w = {}, tex = new Float32Array(nx * ny * 2), idx = [], i, j, q, keys = Object.keys(wsrc);
      keys.forEach(function (kk) { w[kk] = new Float32Array(nx * ny); });
      for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) {
        q = j * nx + i; var x = x0 + (x1 - x0) * i / (nx - 1), y = y0 + (y1 - y0) * j / (ny - 1);
        pos[q * 2] = x; pos[q * 2 + 1] = y; var t = uv(x, y); tex[q * 2] = t[0]; tex[q * 2 + 1] = t[1];
        keys.forEach(function (kk) { w[kk][q] = wsrc[kk](x, y, i, j); });
        if (i < nx - 1 && j < ny - 1) idx.push(q, q + 1, q + nx, q + 1, q + nx + 1, q + nx);
      }
      return { pos: pos, tex: tex, w: w, idx: new Uint16Array(idx), out: new Float32Array(nx * ny * 2), n: nx * ny };
    }
    var bodySrc = {}; KEYS2.forEach(function (kk) { bodySrc[kk] = function (x, y, i, j) { return W[kk][j * gx + i]; }; });
    var body = grid(bb[0], bb[1], bb[2], bb[3], gx, gy, function (x, y) { return [x / d.w, y / d.h]; }, bodySrc); body.tex0 = "body"; body.kind = "body";
    this.meshes = [body];
    var aw = imgs.arms ? imgs.arms.width : 1, ah = imgs.arms ? imgs.arms.height : 1, self = this;
    Object.keys(d.arms || {}).forEach(function (sd) {
      var A = d.arms[sd], g2 = A.grid, n2 = g2[0] * g2[1], AW = {};
      Object.keys(A.weights).forEach(function (kk) { AW[kk] = dec(A.weights[kk], n2); });
      var src = {}; Object.keys(AW).forEach(function (kk) { src[kk] = function (x, y, i, j) { return AW[kk][j * g2[0] + i]; }; });
      var m = grid(A.x, A.y, A.x + A.w, A.y + A.h, g2[0], g2[1], function (x, y) { return [(A.ax + x - A.x) / aw, (A.ay + y - A.y) / ah]; }, src);
      m.tex0 = "arms"; m.kind = "arm"; m.side = sd; m.A = A; self.meshes.push(m);
    });
    var pw = imgs.atlas ? imgs.atlas.width : 1, ph = imgs.atlas ? imgs.atlas.height : 1;
    Object.keys(d.patches || {}).forEach(function (name) {
      var p = d.patches[name];
      var m = grid(p.x, p.y, p.x + p.w, p.y + p.h, 10, 10, function (x, y) { return [(p.ax + x - p.x) / pw, (p.ay + y - p.y) / ph]; }, (function () { var o = {}; KEYS2.forEach(function (kk) { o[kk] = function (x, y) { return sample(W[kk], x, y); }; }); return o; })());
      m.tex0 = "atlas"; m.expr = name; m.kind = "body"; self.meshes.push(m);
    });
    /* 大幅动作：gpt-image-2 关键帧 + RIFE 补帧的序列（tools/anim-pipeline/action.py）。网格只负责让它继续跟随呼吸/重心，不再硬拉手臂。 */
    Object.keys(d.actions || {}).forEach(function (an) {
      var A = d.actions[an], img = imgs["act_" + an]; if (!img) return;
      self.texImgs["act_" + an] = img; var r = A.rect;
      var m = grid(r[0], r[1], r[0] + r[2], r[1] + r[3], 16, 22, function (x, y) { return [(x - r[0]) / r[2], (y - r[1]) / r[3]]; }, (function () { var o = {}; KEYS2.forEach(function (kk) { o[kk] = function (x, y) { return sample(W[kk], x, y); }; }); return o; })());
      m.tex0 = "act_" + an; m.kind = "body"; m.action = an; m.A = A; m.uv0 = m.tex.slice(); m.iw = img.width; m.ih = img.height; m.tex2 = new Float32Array(m.tex.length); self.meshes.push(m);
    });
    // arms are drawn after body, action sequences above arms, expression patches last
    this.meshes.sort(function (a, b) { return (a.expr ? 3 : a.action ? 2 : a.kind === "arm" ? 1 : 0) - (b.expr ? 3 : b.action ? 2 : b.kind === "arm" ? 1 : 0); });
    this.gl = this.opts.no3d ? null : this.initGL();
  }
  Rig2.prototype = Object.create(Rig.prototype);
  Rig2.prototype.at = function (x, y) { var r = Rig.prototype.at.call(this, x, y); if (r) { r.hair = r.hair; r.skirt = r.skirt; } return r; };
  /* 两骨 IK：返回 [θu, θf]（相对静止姿态的旋转量） */
  function ik2(S, E, Wr, T, bendSign) {
    var L1 = Math.hypot(E[0] - S[0], E[1] - S[1]), L2 = Math.hypot(Wr[0] - E[0], Wr[1] - E[1]);
    var dx = T[0] - S[0], dy = T[1] - S[1], dd = clamp(Math.hypot(dx, dy), Math.abs(L1 - L2) + 1, L1 + L2 - 1);
    var base = Math.atan2(dy, dx), a = Math.acos(clamp((L1 * L1 + dd * dd - L2 * L2) / (2 * L1 * dd), -1, 1));
    var up = base + bendSign * a, ex = S[0] + Math.cos(up) * L1, ey = S[1] + Math.sin(up) * L1, fore = Math.atan2(T[1] - ey, T[0] - ex);
    var restU = Math.atan2(E[1] - S[1], E[0] - S[0]), restF = Math.atan2(Wr[1] - E[1], Wr[0] - E[0]);
    var du = up - restU, df = fore - restF - du; while (du > Math.PI) du -= 2 * Math.PI; while (du < -Math.PI) du += 2 * Math.PI; while (df > Math.PI) df -= 2 * Math.PI; while (df < -Math.PI) df += 2 * Math.PI;
    return [du, df];
  }
  Rig2.prototype.deform = function () {
    var s = this.s, d = this.d, B = d.bones, sc = d.w / 1024, t = this.t, dt = this.dtLast || 1 / 60, L = s.lag;
    // 转头联动：每级按比例 + 逐级延迟
    L.neck = damp(L.neck, s.hx, dt, 0.18); L.chest = damp(L.chest, s.hx, dt, 0.32); L.waist = damp(L.waist, s.hx, dt, 0.5);
    L.neckY = damp(L.neckY, s.hy, dt, 0.2); L.chestY = damp(L.chestY, s.hy, dt, 0.4);
    var sw = Math.sin(t * Math.PI * 2 / 7.5) + 0.25 * Math.sin(t * Math.PI * 2 / 3.1), b = s.breath, st = s.stretch;
    var yaw = 0.05; // rad per unit look
    var pel = mul(tr(7 * sw * sc, 0), rotAt(0.010 * sw + L.waist * 0.006, B.pelvis[0], B.pelvis[1]));
    var wai = mul(pel, rotAt(-0.008 * sw + L.waist * yaw * 0.15 - st * 0.02, B.waist[0], B.waist[1]));
    var che = mul(wai, mul(rotAt(-0.004 * sw + L.chest * yaw * 0.3 + s.tilt * 0.3, B.chest[0], B.chest[1]), rotAt(0, B.waist[0], B.waist[1], 1 - 0.004 * b, 1 + 0.010 * b + 0.04 * st)));
    che = mul(tr(0, -1.6 * b * sc), che);
    var nec = mul(che, mul(tr(L.neck * 3 * sc, L.neckY * 1.5 * sc), rotAt(L.neck * yaw * 0.6 + s.tilt * 0.6, B.neck[0], B.neck[1])));
    var hea = mul(nec, rotAt(s.hx * yaw + s.tilt, B.neck[0], B.neck[1]));
    // 二级物理：由骨骼运动驱动
    var hp = ap(hea, B.neck[0], B.neck[1] - 200), pp = ap(pel, B.pelvis[0], B.pelvis[1]), cp = ap(che, B.chest[0], B.chest[1]), P = s.prev;
    function vel(k, p) { var v = P[k] ? (p[0] - P[k][0]) / dt : 0; P[k] = p; return v; }
    var hv = vel("h", hp), pv = vel("p", pp), cv = vel("c", cp), wind = 0.12 * Math.sin(t * 0.9) + 0.05 * Math.sin(t * 2.3 + 1.3);
    s.hairV += (-(s.hair - wind) * 16 - s.hairV * 3.0 - hv * 0.035) * dt; s.hair += s.hairV * dt;
    s.skirtV += (-(s.skirt - wind * 0.5) * 20 - s.skirtV * 3.4 - pv * 0.05) * dt; s.skirt += s.skirtV * dt;
    s.accV += (-(s.acc - wind * 0.7) * 24 - s.accV * 2.4 - cv * 0.06) * dt; s.acc += s.accV * dt;
    // 手臂：呼吸微动 + 整理发夹 IK
    var arms = {};
    for (var sd in d.arms) {
      var A = d.arms[sd], sign = A.S[0] > B.chest[0] ? 1 : -1, ah = s.armHold, tu = (0.012 * b * sign + 0.008 * Math.sin(t * 0.7 + (sign > 0 ? 0 : 2))) * ah, tf = 0.01 * Math.sin(t * 0.9 + 1) * ah;
      tu += -sign * 0.05 * st * ah; // 伸懒腰：手臂外展
      if (sd === B.pinSide && s.pin > 0.001) { var fc = this.lm.face, k = s.pin, L1 = Math.hypot(A.E[0] - A.S[0], A.E[1] - A.S[1]), goal = [A.S[0] + sign * 0.22 * L1, Math.max(fc[1] + fc[3] * 0.1, A.S[1] - 0.9 * L1)], tgt = [A.Wr[0] + (goal[0] - A.Wr[0]) * k, A.Wr[1] + (goal[1] - A.Wr[1]) * k]; var q = ik2(A.S, A.E, A.Wr, tgt, sign), q0 = ik2(A.S, A.E, A.Wr, A.Wr, sign); tu += q[0] - q0[0]; tf += q[1] - q0[1]; }
      if (s.wave > 0.001 && sd !== B.pinSide) { tu += -sign * 0.5 * s.wave; tf += -sign * (0.6 + 0.25 * Math.sin(t * 9)) * s.wave; }
      var up = mul(che, rotAt(tu, A.S[0], A.S[1])), fo = mul(up, rotAt(tf, A.E[0], A.E[1]));
      arms[sd] = { up: up, fo: fo };
    }
    var hipY = B.hip, ed = this.lm.eyeDist;
    for (var mi = 0; mi < this.meshes.length; mi++) {
      var m = this.meshes[mi], Pp = m.pos, O = m.out, w = m.w;
      for (var qi = 0; qi < m.n; qi++) {
        var x = Pp[qi * 2], y = Pp[qi * 2 + 1], X = 0, Y = 0, r;
        if (m.kind === "arm") {
          var a = arms[m.side], fw = w.fore[qi], ro = w.root[qi], r1 = ap(a.up, x, y), r2 = ap(a.fo, x, y), rc = ap(che, x, y);
          X = (r1[0] * (1 - fw) + r2[0] * fw) * (1 - ro) + rc[0] * ro; Y = (r1[1] * (1 - fw) + r2[1] * fw) * (1 - ro) + rc[1] * ro;
          var dxa = (s.acc * w.acc[qi] * 12 + s.hair * w.hair[qi] * 10) * sc; X += dxa;
        } else {
          var wh = w.head[qi], wn = w.neck[qi], wc = w.chest[qi], ww = w.waist[qi], wp = w.pelvis[qi], lg = y < hipY ? 1 : w.leg[qi];
          r = ap(hea, x, y); X += r[0] * wh; Y += r[1] * wh;
          r = ap(nec, x, y); X += r[0] * wn; Y += r[1] * wn;
          r = ap(che, x, y); X += r[0] * wc; Y += r[1] * wc;
          r = ap(wai, x, y); X += r[0] * ww; Y += r[1] * ww;
          r = ap(pel, x, y); X += (x + (r[0] - x) * lg) * wp; Y += (y + (r[1] - y) * lg) * wp;
          var ws = wh + wn + wc + ww + wp; if (ws > 1e-4) { X /= ws; Y /= ws; } else { X = x; Y = y; }
          var D = w.depth[qi], hf = w.headf[qi];
          X += s.hx * (2 + 6 * D) * hf * sc; Y += s.hy * (2 + 4 * D) * hf * sc;   // 头部视差（克制）
          X += s.gaze * w.eyes[qi] * 3 * sc; Y += s.gazeY * w.eyes[qi] * 2 * sc;
          Y += -b * 1.6 * w.chestw[qi] * sc;                                      // 胸口起伏
          var hl = w.hair[qi]; X += s.hair * hl * 20 * sc; Y += -Math.abs(s.hair) * hl * 2 * sc;
          var sk = w.skirt[qi]; X += s.skirt * sk * 14 * sc + (x - B.pelvis[0]) * Math.abs(s.skirt) * 0.02 * sk;
          X += s.acc * w.acc[qi] * 12 * sc;
        }
        O[qi * 2] = X; O[qi * 2 + 1] = Y;
      }
    }
  };
  var _upd = Rig.prototype.update;
  /* 序列播放：先把手臂待机摆动收到 0（0.25s，静止姿态 == 序列首帧），再 正放 → 停顿 → 倒放，最后一帧 == 原图，再放开手臂摆动。 */
  Rig2.prototype.seqFrame = function () {
    var q = this.s.seq; if (!q) return null; var A = this.d.actions[q.name], n = A.frames.length, f = A.fps, t = q.t - 0.25;
    var up = (n - 1) / f, hold = q.hold, pos;
    if (t < 0) pos = 0; else if (t < up) pos = t * f; else if (t < up + hold) pos = n - 1; else pos = Math.max(0, (n - 1) - (t - up - hold) * f);
    var fade = Math.min(1, Math.max(0, (q.t) / 0.25), Math.max(0, (up * 2 + hold + 0.25 - t) / 0.25));
    return { pos: pos, done: t > up * 2 + hold + 0.25, A: A, n: n, fade: fade };
  };
  Rig2.prototype.update = function (dt) {
    this.dtLast = dt; var s = this.s;
    if (s.act && this.d.actions && this.d.actions[s.act] && this.texImgs["act_" + s.act] && !s.seq && s.actT < 0.05) s.seq = { name: s.act, t: 0, hold: s.act === "pin" ? 1.4 : 0.8 };
    if (s.seq) { s.seq.t += dt; var fr = this.seqFrame(); s.armHold = Math.max(0, s.armHold - dt / 0.25); if (fr.done) { s.seq = null; } }
    else s.armHold = Math.min(1, s.armHold + dt / 0.4);
    var a = s.act && !s.seq ? s.actT / ({ pin: 3.2, wave: 2.4 }[s.act] || 1) : 0;
    s.pin = damp(s.pin, s.act === "pin" && !s.seq && !(this.d.actions && this.d.actions.pin) ? bump(a, 0.3, 0.3) : 0, dt, 0.12);
    s.wave = damp(s.wave, s.act === "wave" ? bump(a, 0.25, 0.3) : 0, dt, 0.12);
    return _upd.call(this, dt);
  };
  ACTS.pin.dur = 3.2; ACTS.wave = { dur: 2.4 };

  /* —— 加载 / 挂载 —— */
  var loading = {};
  function loadScript(src) { return loading[src] || (loading[src] = new Promise(function (ok, no) { var e = document.createElement("script"); e.src = src; e.onload = ok; e.onerror = function () { delete loading[src]; no(new Error("rig " + src)); }; document.head.appendChild(e); })); }
  function loadImg(src) { return new Promise(function (ok, no) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = function () { no(new Error(src)); }; i.src = src; }); }
  function load(id, url) {
    return loadScript(url("live/" + id + "/rig.js")).then(function () {
      var d = DATA[id]; if (!d) throw new Error("no rig " + id);
      if (d.v === 2) {
        var acts = Object.keys(d.actions || {});
        return Promise.all([loadImg(url("live/" + id + "/body.webp")), loadImg(url("live/" + id + "/arms.webp")), loadImg(url("live/" + id + "/atlas.webp"))].concat(acts.map(function (a) { return loadImg(url("live/" + id + "/act_" + a + ".webp")).catch(function () { return null; }); })))
          .then(function (r) { var im = { body: r[0], arms: r[1], atlas: r[2] }; acts.forEach(function (a, i) { if (r[3 + i]) im["act_" + a] = r[3 + i]; }); return { d: d, imgs: im }; });
      }
      return Promise.all([loadImg(url("live/" + id + "/base.webp")), Object.keys(d.patches || {}).length ? loadImg(url("live/" + id + "/atlas.webp")) : null]).then(function (r) { return { d: d, base: r[0], atlas: r[1] }; });
    });
  }
  var cur = null, raf = 0, last = 0;
  function mount(canvas, id, url, opts) {
    opts = opts || {};
    return load(id, url).then(function (L) {
      var r = L.imgs ? new Rig2(canvas, L.d, L.imgs, opts) : new Rig(canvas, L.d, L.base, L.atlas, opts); r.id = id; cur = r;
      if (!raf) { last = performance.now(); var loop = function (now) { raf = requestAnimationFrame(loop); var dt = Math.min(0.05, (now - last) / 1000); last = now; if (!cur || global.__rigManual || (opts.hidden && opts.hidden())) return; cur.update(opts.reducedMotion && opts.reducedMotion() ? dt * 0.4 : dt); cur.render(); }; raf = requestAnimationFrame(loop); }
      return r;
    });
  }
  function bindInput(el) {
    if (el.__rig46) return; el.__rig46 = 1;
    global.addEventListener("pointermove", function (e) { if (!cur) return; var r = cur.c.getBoundingClientRect(); if (!r.width) return; cur.lookAt(((e.clientX - r.left) / r.width - 0.5) * 2.2, ((e.clientY - r.top) / r.height - 0.25) * 1.6); }, { passive: true });
    global.addEventListener("deviceorientation", function (e) { if (!cur || e.gamma == null) return; cur.lookAt(clamp(e.gamma / 30, -1, 1), clamp(((e.beta || 45) - 45) / 30, -1, 1)); }, { passive: true });
  }
  global.SakurayoRig = {
    Rig: Rig, Rig2: Rig2, mount: mount, bindInput: bindInput, current: function () { return cur; },
    touch: function (clientX, clientY) { if (!cur) return null; var p = cur.toImage(clientX, clientY), part = cur.part(p[0], p[1]); cur.play(part); return part; },
    play: function (n) { return cur ? cur.play(n) : false; }, say: function (s) { cur && cur.say(s); },
    step: function (dt) { if (cur) { cur.update(dt); cur.render(); } }, // 离线录制：window.__rigManual=1 后逐帧推进
    snapshot: function () { return cur ? cur.snapshot() : null; },
    unmount: function () { cur = null; }
  };
})(typeof window !== "undefined" ? window : globalThis);
