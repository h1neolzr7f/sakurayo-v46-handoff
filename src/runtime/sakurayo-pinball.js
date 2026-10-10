/* 镜弹（弹珠肉鸽节点，Monster Strike 式回合弹射）。独立模块：自带画布/循环/输入/HUD；只通过 start(opts)/onEnd(result) 与夜行地图交互。
   规则：玩家拖拽反向弹射角色球 → 在场内反弹撞击敌人；每回合结束敌人倒计时 -1，归零时攻击。清空 3 波（最后一波为 Boss）即胜利。
   构筑映射：spread=撞击溅射碎片，bomb=撞击爆炸，laser=每 4 次反弹射出贯穿光束，homing=球轻微追踪，orbit=球体护盾环（撞击额外伤害），pierce=穿透第一个敌人。
   形态：guard=大球+受伤×0.7；speed=摩擦更低+反弹次数多；burst=伤害×1.4、受伤×1.25；觉醒=下一发“友情连击”全屏樱斩。 */
(function (global) {
  "use strict";
  var FW = 540, FH = 860, R0 = 26;
  function rng(s) { s = (s >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  var CH = { sayo: { name: "月城小夜", atk: 92, hp: 1, col: "#ff9ec7", fric: 0.38 }, aya: { name: "神代绫", atk: 66, hp: 1, col: "#8fc8ff", fric: 0.36, bonus: "ricochet" }, rion: { name: "九条凛音", atk: 98, hp: 1, col: "#ff6b6b", fric: 0.44 } };
  function Game(o) {
    this.o = o; this.r = rng(o.seed || 1); var c = CH[o.character] || CH.sayo; this.cid = CH[o.character] ? o.character : "sayo"; this.ch = c;
    var f = o.form || {}; this.slot = f.slot || "base"; var up = o.weapons || {};
    this.lv = function (k) { return up[k] ? (up[k].lv || 1) + (up[k].evo ? 2 : 0) : 0; };
    this.power = clamp(o.power || 1, 0.7, 2.6); this.layer = o.layer || 1;
    this.ball = { x: FW / 2, y: FH - 110, vx: 0, vy: 0, r: R0 * (this.slot === "guard" ? 1.3 : 1), moving: false, bounces: 0, hitT: 0 };
    this.hpMax = 100; this.hp = clamp(o.hpFrac == null ? 1 : o.hpFrac, 0.05, 1) * 100;
    this.dmgTaken = this.slot === "guard" ? 0.7 : this.slot === "burst" ? 1.25 : 1;
    this.fric = c.fric * (this.slot === "speed" ? 0.62 : 1);
    this.atk = c.atk * this.power * (this.slot === "burst" ? 1.4 : 1);
    this.wave = 0; this.E = []; this.fx = []; this.turn = 0; this.t = 0; this.done = false; this.win = false; this.gauge = 0; this.awakenReady = false; this.awakenNext = false;
    this.shots = 0; this.hits = 0; this.dmgTotal = 0; this.nextWave();
  }
  Game.prototype.nextWave = function () {
    this.wave++; var r = this.r, L = this.layer, E = this.E = [];
    if (this.wave === 3) { E.push({ boss: true, x: FW / 2, y: 230, r: 74, hp: 2600 + 900 * L, max: 2600 + 900 * L, cd: 2, cdMax: 2, atk: 11 + 3 * L, weak: 0, kind: "boss", phase: 1 }); return; }
    var n = 4 + this.wave;
    for (var i = 0; i < n; i++) { var hp = (260 + 90 * L) * (1 + this.wave * 0.35); E.push({ x: 70 + r() * (FW - 140), y: 90 + r() * 420, r: 30 + r() * 10, hp: hp, max: hp, cd: 2 + (r() * 3 | 0), cdMax: 3, atk: 4 + 1.5 * L, kind: "e" + (i % 6) }); }
    // 避免重叠
    for (var k = 0; k < 40; k++) for (i = 0; i < E.length; i++) for (var j = i + 1; j < E.length; j++) { var a = E[i], b = E[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, m = a.r + b.r + 8 - d; if (m > 0) { a.x -= dx / d * m / 2; a.y -= dy / d * m / 2; b.x += dx / d * m / 2; b.y += dy / d * m / 2; a.x = clamp(a.x, a.r, FW - a.r); b.x = clamp(b.x, b.r, FW - b.r); a.y = clamp(a.y, 60 + a.r, 560); b.y = clamp(b.y, 60 + b.r, 560); } }
  };
  Game.prototype.canShoot = function () { return !this.done && !this.ball.moving; };
  Game.prototype.shoot = function (ang, pw) {
    if (!this.canShoot()) return false; var b = this.ball, sp = 1500 * clamp(pw == null ? 1 : pw, 0.25, 1);
    b.vx = Math.cos(ang) * sp; b.vy = Math.sin(ang) * sp; b.moving = true; b.bounces = 0; this.shots++; this.pierced = 0;
    this.strike = this.awakenNext; this.awakenNext = false; if (this.strike) this.fx.push({ k: "cut", t: 0, life: 0.6 });
    return true;
  };
  Game.prototype.awaken = function () { if (!this.awakenReady || this.ball.moving) return false; this.awakenReady = false; this.gauge = 0; this.awakenNext = true; return true; };
  Game.prototype.damage = function (e, d, kind) {
    if (e.hp <= 0) return; if (e.boss && e.brk > 0) d *= 1.6; e.hp -= d; this.dmgTotal += d; e.flash = 0.12; this.fx.push({ k: "num", x: e.x, y: e.y - e.r, v: Math.round(d), t: 0, life: 0.7 });
    this.gauge = Math.min(100, this.gauge + d / 90); if (this.gauge >= 100) this.awakenReady = true;
    if (e.boss && e.phase === 1 && e.hp < e.max * 0.5) { e.phase = 2; e.brk = 2; e.cdMax = 1; this.fx.push({ k: "break", t: 0, life: 1 }); }
  };
  Game.prototype.hitEnemy = function (e) {
    var dmg = this.atk * (this.strike ? 2.2 : 1) * (1 + 0.08 * this.lv("orbit"));
    this.damage(e, dmg); this.hits++;
    if (this.lv("bomb")) { var R = 70 + 14 * this.lv("bomb"); this.fx.push({ k: "boom", x: e.x, y: e.y, r: R, t: 0, life: 0.35 }); for (var i = 0; i < this.E.length; i++) { var o = this.E[i]; if (o !== e && Math.hypot(o.x - e.x, o.y - e.y) < R + o.r) this.damage(o, dmg * 0.35 * (1 + 0.1 * this.lv("bomb"))); } }
    if (this.lv("spread")) for (i = 0; i < 2 + this.lv("spread"); i++) { var a = this.r() * 6.28; this.fx.push({ k: "shard", x: e.x, y: e.y, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, t: 0, life: 0.45, d: dmg * 0.18, hit: [e] }); }
  };
  Game.prototype.update = function (dt) {
    if (this.done) return; this.t += dt; var b = this.ball, i, e, self = this;
    for (i = this.fx.length - 1; i >= 0; i--) { var f = this.fx[i]; f.t += dt; if (f.k === "shard") { f.x += f.vx * dt; f.y += f.vy * dt; for (var j = 0; j < this.E.length; j++) { e = this.E[j]; if (f.hit.indexOf(e) < 0 && Math.hypot(e.x - f.x, e.y - f.y) < e.r) { f.hit.push(e); this.damage(e, f.d); } } } if (f.t > f.life) this.fx.splice(i, 1); }
    this.E.forEach(function (q) { q.flash = Math.max(0, (q.flash || 0) - dt); });
    if (!b.moving) return;
    var steps = Math.ceil(Math.hypot(b.vx, b.vy) * dt / 8);
    for (var s = 0; s < steps; s++) {
      var h = dt / steps;
      if (this.lv("homing")) { var tg = this.nearest(b); if (tg) { var ang = Math.atan2(tg.y - b.y, tg.x - b.x), sp = Math.hypot(b.vx, b.vy), cur = Math.atan2(b.vy, b.vx), da = Math.atan2(Math.sin(ang - cur), Math.cos(ang - cur)); cur += clamp(da, -1, 1) * h * (0.6 + 0.3 * this.lv("homing")); b.vx = Math.cos(cur) * sp; b.vy = Math.sin(cur) * sp; } }
      b.x += b.vx * h; b.y += b.vy * h;
      var wall = false;
      if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); wall = true; } if (b.x > FW - b.r) { b.x = FW - b.r; b.vx = -Math.abs(b.vx); wall = true; }
      if (b.y < b.r + 40) { b.y = b.r + 40; b.vy = Math.abs(b.vy); wall = true; } if (b.y > FH - b.r - 20) { b.y = FH - b.r - 20; b.vy = -Math.abs(b.vy); wall = true; }
      if (wall) this.bounce();
      for (i = 0; i < this.E.length; i++) {
        e = this.E[i]; if (e.hp <= 0) continue; var dx = b.x - e.x, dy = b.y - e.y, d = Math.hypot(dx, dy);
        if (d < b.r + e.r) {
          if (e.lastHit === this.shots && e.hitT > this.t - 0.08) continue; e.lastHit = this.shots; e.hitT = this.t;
          this.hitEnemy(e);
          if (this.lv("pierce") && this.pierced < this.lv("pierce")) { this.pierced++; continue; }
          var nx = dx / (d || 1), ny = dy / (d || 1), dot = b.vx * nx + b.vy * ny; if (dot < 0) { b.vx -= 2 * dot * nx; b.vy -= 2 * dot * ny; }
          b.x = e.x + nx * (b.r + e.r + 0.5); b.y = e.y + ny * (b.r + e.r + 0.5); this.bounce();
        }
      }
      var k = Math.exp(-this.fric * h); b.vx *= k; b.vy *= k;
    }
    this.E = this.E.filter(function (q) { if (q.hp <= 0) self.fx.push({ k: "pop", x: q.x, y: q.y, t: 0, life: 0.4 }); return q.hp > 0; });
    if (Math.hypot(b.vx, b.vy) < 70 || this.t - (this.shotT || 0) > 9) this.endTurn();
  };
  Game.prototype.bounce = function () {
    var b = this.ball; b.bounces++;
    if (this.lv("laser") && b.bounces % 4 === 0) { var tg = this.nearest(b); if (tg) { this.fx.push({ k: "beam", x: b.x, y: b.y, x2: tg.x, y2: tg.y, t: 0, life: 0.25 }); this.damage(tg, this.atk * 0.6 * (1 + 0.15 * this.lv("laser"))); } }
    if (this.cid === "aya" && b.bounces % 3 === 0) { var t2 = this.nearest(b); if (t2) { this.fx.push({ k: "beam", x: b.x, y: b.y, x2: t2.x, y2: t2.y, t: 0, life: 0.18 }); this.damage(t2, this.atk * 0.45); } } // 绫：跳弹点射
  };
  Game.prototype.nearest = function (b) { var best = null, bd = 1e9; this.E.forEach(function (e) { var d = Math.hypot(e.x - b.x, e.y - b.y); if (e.hp > 0 && d < bd) { bd = d; best = e; } }); return best; };
  Game.prototype.endTurn = function () {
    var b = this.ball, self = this; b.moving = false; b.vx = b.vy = 0; this.turn++; this.strike = false;
    if (!this.E.length) { if (this.wave >= 3) { this.done = true; this.win = true; this.o.onEnd && this.o.onEnd(this.result()); return; } this.nextWave(); return; }
    this.E.forEach(function (e) { if (e.brk > 0) { e.brk--; return; } e.cd--; if (e.cd <= 0) { e.cd = e.cdMax; self.hp -= e.atk * self.dmgTaken; self.fx.push({ k: "atk", x: e.x, y: e.y, t: 0, life: 0.5 }); } });
    if (this.hp <= 0) { this.hp = 0; this.done = true; this.win = false; this.o.onEnd && this.o.onEnd(this.result()); }
  };
  Game.prototype.result = function () { return { win: !!this.win, hpFrac: Math.max(0, this.hp) / this.hpMax, turns: this.turn, shots: this.shots, hits: this.hits, time: +this.t.toFixed(1), dmg: Math.round(this.dmgTotal) }; };
  /* 自动瞄准：采样若干角度做前向模拟，选总伤害最高的（测试/平衡用，也作为“推荐线”提示）。 */
  Game.prototype.bestShot = function (n) {
    var best = { a: -Math.PI / 2, v: -1 }, N = n || 24;
    for (var i = 0; i < N; i++) {
      var a = -Math.PI + (i + 0.5) / N * Math.PI, g = this.clone(); g.o = {}; g.shoot(a, 1); var t = 0; while (g.ball.moving && t < 9) { g.update(1 / 60); t += 1 / 60; }
      var v = g.dmgTotal - this.dmgTotal + (g.wave > this.wave ? 1e5 : 0); if (v > best.v) best = { a: a, v: v };
    }
    return best.a;
  };
  Game.prototype.clone = function () { var g = Object.create(Game.prototype); for (var k in this) if (Object.prototype.hasOwnProperty.call(this, k)) g[k] = this[k]; g.ball = Object.assign({}, this.ball); g.E = this.E.map(function (e) { return Object.assign({}, e); }); g.fx = []; g.r = rng(7); return g; };
  Game.prototype.snapshot = function () { var B = this.E.find(function (e) { return e.boss; }); return { wave: this.wave, turn: this.turn, hp: +(this.hp / this.hpMax).toFixed(3), enemies: this.E.length, moving: this.ball.moving, gauge: Math.round(this.gauge), awaken: this.awakenReady, done: this.done, win: this.win, ch: this.cid, form: this.slot, boss: B ? { hp: Math.round(B.hp), max: B.max, phase: B.phase, brk: B.brk > 0 } : null }; };
  Game.prototype.draw = function (g, img, W, H) {
    var sc = Math.min(W / FW, H / FH), ox = (W - FW * sc) / 2, oy = (H - FH * sc) / 2, self = this, b = this.ball;
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = "#0b0714"; g.fillRect(0, 0, W, H);
    var bg = img["scene" + ((this.layer - 1) % 2 + 1)];
    if (bg && bg.width) { g.globalAlpha = 0.3; var bs = Math.max(W / bg.width, H / bg.height); g.drawImage(bg, (W - bg.width * bs) / 2, (H - bg.height * bs) / 2, bg.width * bs, bg.height * bs); g.globalAlpha = 1; }
    g.setTransform(sc, 0, 0, sc, ox, oy);
    if (bg && bg.width) { var s2 = Math.max(FW / bg.width, FH / bg.height); g.drawImage(bg, (FW - bg.width * s2) / 2, (FH - bg.height * s2) / 2, bg.width * s2, bg.height * s2); } else { g.fillStyle = "#1a1230"; g.fillRect(0, 0, FW, FH); }
    g.fillStyle = "rgba(8,4,16,.35)"; g.fillRect(0, 0, FW, FH); g.strokeStyle = "#ffd76a88"; g.lineWidth = 4; g.strokeRect(2, 40, FW - 4, FH - 60);
    this.E.forEach(function (e) {
      var im = e.boss ? img["boss" + ((self.layer - 1) % 3 + 1)] : img["enemy_" + (self.layer % 2 ? "a" : "b") + e.kind.slice(1)];
      if (im && im.width) { var s = e.r * 2.3; g.drawImage(im, e.x - s / 2, e.y - s / 2, s, s * im.height / im.width); } else { g.fillStyle = "#c66"; g.beginPath(); g.arc(e.x, e.y, e.r, 0, 7); g.fill(); }
      if (e.flash > 0) { g.fillStyle = "rgba(255,255,255," + e.flash * 4 + ")"; g.beginPath(); g.arc(e.x, e.y, e.r, 0, 7); g.fill(); }
      g.fillStyle = "#0009"; g.fillRect(e.x - e.r, e.y + e.r + 4, e.r * 2, 6); g.fillStyle = e.boss ? "#ff5d8f" : "#7cf29a"; g.fillRect(e.x - e.r, e.y + e.r + 4, e.r * 2 * Math.max(0, e.hp / e.max), 6);
      g.fillStyle = e.cd <= 1 ? "#ff4d6d" : "#fff"; g.font = "bold 20px sans-serif"; g.textAlign = "center"; g.fillText(e.brk > 0 ? "破" : String(e.cd), e.x + e.r * 0.8, e.y - e.r * 0.6);
    });
    this.fx.forEach(function (f) { var a = 1 - f.t / f.life; g.globalAlpha = a;
      if (f.k === "num") { g.fillStyle = "#ffe08a"; g.font = "bold 22px sans-serif"; g.textAlign = "center"; g.fillText(f.v, f.x, f.y - f.t * 50); }
      else if (f.k === "boom") { g.strokeStyle = "#ffb36b"; g.lineWidth = 6; g.beginPath(); g.arc(f.x, f.y, f.r * (0.4 + 0.6 * f.t / f.life), 0, 7); g.stroke(); }
      else if (f.k === "shard") { g.fillStyle = "#ffc1dc"; g.beginPath(); g.arc(f.x, f.y, 5, 0, 7); g.fill(); }
      else if (f.k === "beam") { g.strokeStyle = "#9fe1ff"; g.lineWidth = 5; g.beginPath(); g.moveTo(f.x, f.y); g.lineTo(f.x2, f.y2); g.stroke(); }
      else if (f.k === "pop") { g.fillStyle = "#ffd76a"; g.beginPath(); g.arc(f.x, f.y, 30 * (1 + f.t * 3), 0, 7); g.fill(); }
      else if (f.k === "atk") { g.strokeStyle = "#ff4d6d"; g.lineWidth = 3; g.beginPath(); g.moveTo(f.x, f.y); g.lineTo(b.x, b.y); g.stroke(); }
      else if (f.k === "cut") { g.fillStyle = "#fff"; g.globalAlpha = a * 0.5; g.fillRect(0, FH / 2 - 30 * a, FW, 60 * a); }
      else if (f.k === "break") { g.fillStyle = "#ffd76a"; g.font = "bold 48px sans-serif"; g.textAlign = "center"; g.fillText("BREAK!", FW / 2, 360); }
      g.globalAlpha = 1; });
    var face = img["ball_" + this.cid];
    g.save(); g.beginPath(); g.arc(b.x, b.y, b.r, 0, 7); g.closePath(); g.fillStyle = this.ch.col; g.fill(); if (face && face.width) { g.clip(); g.drawImage(face, b.x - b.r, b.y - b.r, b.r * 2, b.r * 2); } g.restore();
    g.strokeStyle = this.strike ? "#ffd76a" : "#fff"; g.lineWidth = 4; g.beginPath(); g.arc(b.x, b.y, b.r, 0, 7); g.stroke();
    if (this.aim) { var a2 = this.aim; g.setLineDash([10, 10]); g.strokeStyle = "#fffa"; g.lineWidth = 3; g.beginPath(); g.moveTo(b.x, b.y); g.lineTo(b.x + Math.cos(a2.a) * 220 * a2.p, b.y + Math.sin(a2.a) * 220 * a2.p); g.stroke(); g.setLineDash([]); }
    g.setTransform(1, 0, 0, 1, 0, 0);
  };
  var ART = ["scene1", "scene2", "boss1", "boss2", "boss3", "ball_sayo", "ball_aya", "ball_rion"]; ["a", "b"].forEach(function (s) { for (var i = 0; i < 6; i++) ART.push("enemy_" + s + i); });
  var CSS = "#pin46{position:fixed;inset:0;z-index:125;background:#07050d;touch-action:none;user-select:none;color:#fff}#pin46 canvas{position:absolute;inset:0;width:100%;height:100%}#pin46 .hud{position:absolute;left:50%;transform:translateX(-50%);top:8px;display:flex;gap:12px;align-items:center;font-size:13px;background:#0008;padding:4px 12px;border-radius:12px}#pin46 .hp{width:120px;height:8px;background:#fff3;border-radius:4px;overflow:hidden}#pin46 .hp i{display:block;height:100%;width:calc(var(--v,1)*100%);background:#7cf29a}#pin46 .aw{position:absolute;right:16px;bottom:24px;width:70px;height:70px;border-radius:50%;border:2px solid #ffd76a;background:#2a2034;color:#fff}#pin46 .aw.ready{background:#ffd76a;color:#2a2034}#pin46 .res{position:absolute;inset:0;display:grid;place-items:center;background:#000a}#pin46 .res .box{background:#1d1430;padding:20px 28px;border-radius:14px;text-align:center}#pin46 .res button{margin-top:12px;padding:8px 22px;border-radius:10px;border:0;background:#ffd76a;font-weight:bold}";
  var cur = null, raf = 0;
  function start(o) {
    stop(); o = o || {};
    if (!document.getElementById("pin46css")) { var st = document.createElement("style"); st.id = "pin46css"; st.textContent = CSS; document.head.appendChild(st); }
    var root = document.createElement("div"); root.id = "pin46";
    root.innerHTML = '<canvas></canvas><div class="hud"><b class="nm"></b><div class="hp"><i></i></div><span class="wv"></span></div><button class="aw">友情<br>连击</button>';
    (o.parent || document.body).appendChild(root);
    var cv = root.querySelector("canvas"), g = cv.getContext("2d"), img = {};
    ART.forEach(function (k) { var i = new Image(); var p = k.indexOf("ball_") === 0 || k.indexOf("scene") === 0 ? "pinball/" + k + ".webp" : "shmup/" + k + ".webp"; i.src = o.art ? o.art(p) : "art/" + p; img[k] = i; });
    var game = new Game(Object.assign({}, o, { onEnd: function (r) { var el = document.createElement("div"); el.className = "res"; el.innerHTML = '<div class="box"><h2>' + (r.win ? "镜弹突破" : "力竭") + "</h2><p>回合 " + r.turns + " · 命中 " + r.hits + " · 伤害 " + r.dmg + '</p><button class="ok">' + (o.okText || "继续") + "</button></div>"; root.appendChild(el); el.querySelector(".ok").onclick = function () { stop(); o.onClose && o.onClose(r); }; o.onEnd && o.onEnd(r); } }));
    game.root = root; cur = game; root.querySelector(".nm").textContent = CH[game.cid].name + (o.form && o.form.name ? " · " + o.form.name : "");
    root.querySelector(".aw").onclick = function () { game.awaken(); };
    var toF = function (e) { var r = cv.getBoundingClientRect(), sc = Math.min(r.width / FW, r.height / FH), ox = (r.width - FW * sc) / 2, oy = (r.height - FH * sc) / 2; return [(e.clientX - r.left - ox) / sc, (e.clientY - r.top - oy) / sc]; };
    var down = null;
    cv.addEventListener("pointerdown", function (e) { if (!game.canShoot()) return; down = toF(e); });
    cv.addEventListener("pointermove", function (e) { if (!down) return; var p = toF(e), dx = down[0] - p[0], dy = down[1] - p[1]; game.aim = { a: Math.atan2(dy, dx), p: clamp(Math.hypot(dx, dy) / 160, 0.25, 1) }; });
    cv.addEventListener("pointerup", function () { if (down && game.aim) { game.shotT = game.t; game.shoot(game.aim.a, game.aim.p); } down = null; game.aim = null; });
    var paint = function () { var dpr = Math.min(global.devicePixelRatio || 1, 2), W = Math.round(cv.clientWidth * dpr), H = Math.round(cv.clientHeight * dpr); if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; } game.draw(g, img, W, H); var s = game.snapshot(); root.querySelector(".hp").style.setProperty("--v", s.hp); root.querySelector(".wv").textContent = "第 " + s.wave + "/3 波 · 回合 " + s.turn; root.querySelector(".aw").classList.toggle("ready", s.awaken); };
    game.paint = paint; var t0 = performance.now();
    var loop = function (now) { raf = requestAnimationFrame(loop); var dt = Math.min(0.05, (now - t0) / 1000); t0 = now; if (global.__pinManual) return; game.update(dt); paint(); };
    raf = requestAnimationFrame(loop); return game;
  }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; if (cur && cur.root) cur.root.remove(); cur = null; }
  function autoTurn(g) { if (g.awakenReady) g.awaken(); g.shotT = g.t; g.shoot(g.bestShot(18), 1); }
  function simulate(o, maxTurns) { var g = new Game(o); for (var n = 0; n < (maxTurns || 60) && !g.done; n++) { autoTurn(g); var t = 0; while (g.ball.moving && t < 12) { g.update(1 / 60); t += 1 / 60; } } return g.result(); }
  global.SakurayoPinball = { Game: Game, start: start, stop: stop, simulate: simulate, autoTurn: autoTurn, current: function () { return cur; }, step: function (dt) { if (cur) { cur.update(dt); cur.paint(); } }, FW: FW, FH: FH, CH: CH };
})(typeof window !== "undefined" ? window : globalThis);
