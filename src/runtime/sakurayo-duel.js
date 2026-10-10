/* 镜斗（2D 格斗肉鸽节点，1v1）。独立模块：自带画布/循环/输入/HUD；只通过 start(opts)/onEnd(result) 与夜行地图交互。
   操作：←→ 移动 / ↑ 跳 / ↓ 防御（按住），J 轻攻击（三段连击）、K 重攻击（连击终结时击飞）、L 必杀（消耗 1 格气）、U 觉醒（满 3 格）。触屏有对应按钮。
   规则：限时 60s，一局定胜负；被防住的攻击只吃 15% 伤害但积累破防值，破防时硬直 1s。
   构筑映射（必杀技变体，取等级最高的武器）：spread=扇形符弹，bomb=抛物线爆弹，laser=贯穿光线，homing=追踪狐火，pierce=突进斩，orbit=护身樱环（反击）。
   形态：guard=防御减伤 95%+重攻击霸体；speed=移速/攻速 +25%、轻攻击 4 段；burst=伤害 ×1.35、受伤 ×1.2。 */
(function (global) {
  "use strict";
  var FW = 960, FH = 540, GROUND = 450;
  function rng(s) { s = (s >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  var CH = { sayo: { name: "月城小夜", spd: 310, dmg: 1.1, reach: 1.1, col: "#ff9ec7" }, aya: { name: "神代绫", spd: 330, dmg: 0.92, reach: 1.15, col: "#8fc8ff" }, rion: { name: "九条凛音", spd: 290, dmg: 1.12, reach: 1.05, col: "#ff6b6b" } };
  var MOVES = { L1: { d: 6, s: 0.08, a: 0.1, r: 0.14, reach: 90, kb: 60 }, L2: { d: 7, s: 0.08, a: 0.1, r: 0.15, reach: 95, kb: 70 }, L3: { d: 9, s: 0.1, a: 0.1, r: 0.2, reach: 100, kb: 120 }, L4: { d: 10, s: 0.1, a: 0.1, r: 0.22, reach: 105, kb: 160 },
    H: { d: 16, s: 0.2, a: 0.12, r: 0.32, reach: 115, kb: 260, launch: true } };
  function F(side, o) { return { x: side < 0 ? 260 : 700, y: GROUND, vx: 0, vy: 0, face: -side, hp: 100, max: 100, meter: 0, guard: 0, gbreak: 0, stun: 0, act: null, actT: 0, combo: 0, comboT: 0, block: false, air: false, inv: 0, o: o, hits: 0 }; }
  function Game(o) {
    this.o = o; this.r = rng(o.seed || 1); this.cid = CH[o.character] ? o.character : "sayo"; this.ch = CH[this.cid]; this.layer = o.layer || 1;
    var f = o.form || {}; this.slot = f.slot || "base"; var up = o.weapons || {};
    this.lv = function (k) { return up[k] ? (up[k].lv || 1) + (up[k].evo ? 2 : 0) : 0; };
    var best = "", bl = 0; ["spread", "bomb", "laser", "homing", "pierce", "orbit"].forEach(function (k) { var l = (up[k] ? (up[k].lv || 1) + (up[k].evo ? 2 : 0) : 0); if (l > bl) { bl = l; best = k; } }); this.special = best || "base"; this.spLv = bl;
    this.power = clamp(o.power || 1, 0.7, 2.6);
    this.P = F(-1, { dmg: this.ch.dmg * this.power * (this.slot === "burst" ? 1.35 : 1), taken: this.slot === "burst" ? 1.2 : 1, spd: this.ch.spd * (this.slot === "speed" ? 1.25 : 1), aspd: this.slot === "speed" ? 1.25 : 1, chain: this.slot === "speed" ? 4 : 3, blockK: this.slot === "guard" ? 0.05 : 0.15, armor: this.slot === "guard" });
    this.P.hp = this.P.max = 100 * clamp(o.hpFrac == null ? 1 : o.hpFrac, 0.3, 1) + 0; // 生命按比例带入（最少 30%）
    var L = this.layer, boss = !!o.boss;
    this.E = F(1, { dmg: (0.16 + 0.07 * L) * (boss ? 1.05 : 1), taken: 1, spd: 270 + 15 * L, aspd: 1, chain: 3, blockK: 0.15, armor: boss });
    this.E.hp = this.E.max = (boss ? 460 : 340) + 80 * L; this.E.name = boss ? "镜灵 · 影武者" : "镜卫 · 剑士";
    this.t = 0; this.limit = 60; this.done = false; this.win = false; this.shots = []; this.fx = []; this.keys = {}; this.input = {}; this.hitstop = 0;
  }
  Game.prototype.startMove = function (f, k) {
    if (f.stun > 0 || f.gbreak > 0 || (f.act && f.actT < (f.act.s + f.act.a + f.act.r) / f.o.aspd * 0.8)) return false;
    if (k === "L") { f.combo = f.comboT > 0 ? Math.min(f.o.chain, f.combo + 1) : 1; f.act = Object.assign({ k: "L" + f.combo }, MOVES["L" + f.combo]); }
    else if (k === "H") { f.act = Object.assign({ k: "H" }, MOVES.H, f.combo >= 2 ? { d: 20, kb: 320 } : {}); f.combo = 0; }
    else if (k === "S") { if (f.meter < 1) return false; f.meter -= 1; f.act = { k: "S", d: 0, s: 0.18, a: 0.1, r: 0.3, reach: 0 }; }
    else return false;
    f.actT = 0; f.hitDone = false; f.comboT = 0.6; return true;
  };
  Game.prototype.special_ = function (f, foe) {
    var me = f === this.P, kind = me ? this.special : "base", lv = me ? this.spLv : 1, d = 14 * f.o.dmg * (1 + 0.12 * lv), dir = f.face;
    if (kind === "spread") for (var i = -1; i <= 1; i++) this.shots.push({ x: f.x + dir * 40, y: f.y - 70, vx: dir * 620, vy: i * 140, d: d * 0.55, own: f, life: 1.2, k: "s" });
    else if (kind === "bomb") this.shots.push({ x: f.x + dir * 30, y: f.y - 90, vx: dir * 380, vy: -420, g: 1100, d: d * 1.5, own: f, life: 2, k: "b", aoe: 110 });
    else if (kind === "laser") { this.fx.push({ k: "beam", x: f.x, y: f.y - 70, dir: dir, t: 0, life: 0.3 }); if ((foe.x - f.x) * dir > 0 && Math.abs(foe.y - f.y) < 90) this.hit(f, foe, { d: d * 1.3, kb: 140, unblock: false }); }
    else if (kind === "homing") this.shots.push({ x: f.x, y: f.y - 80, vx: dir * 300, vy: -100, d: d * 1.2, own: f, life: 2.5, k: "h" });
    else if (kind === "pierce") { f.x = clamp(foe.x + dir * 60, 40, FW - 40); this.hit(f, foe, { d: d * 1.3, kb: 200 }); this.fx.push({ k: "dash", x: f.x, y: f.y, t: 0, life: 0.3 }); }
    else if (kind === "orbit") { f.counter = 1.2; this.fx.push({ k: "ring", x: f.x, y: f.y - 60, t: 0, life: 1.2, f: f }); if (Math.abs(foe.x - f.x) < 150) this.hit(f, foe, { d: d, kb: 200 }); }
    else this.shots.push({ x: f.x + dir * 40, y: f.y - 70, vx: dir * 700, vy: 0, d: d, own: f, life: 1.2, k: "s" });
  };
  Game.prototype.hit = function (a, b, m) {
    if (b.inv > 0) return false;
    if (b.counter > 0 && b !== a) { b.counter = 0; this.hit(b, a, { d: 12 * b.o.dmg, kb: 220 }); return false; }
    var facing = (a.x - b.x) * b.face > 0, d = m.d * (a === this.P ? 1 : 1) * b.o.taken;
    if (b.block && facing && !b.air && !m.unblock) {
      d *= b.o.blockK; b.guard += m.d * 1.2; this.fx.push({ k: "guard", x: b.x, y: b.y - 70, t: 0, life: 0.25 });
      if (b.guard >= 60) { b.guard = 0; b.gbreak = 1; b.block = false; this.fx.push({ k: "txt", s: "破防!", x: b.x, y: b.y - 150, t: 0, life: 0.8 }); }
    } else {
      if (!(b.o.armor && b.act && b.act.k === "H")) { b.stun = 0.28 + (m.launch ? 0.4 : 0); b.act = null; b.vx = (b.x > a.x ? 1 : -1) * (m.kb || 60) * 1.6; if (m.launch) { b.vy = -520; b.air = true; } }
      a.hits++; this.fx.push({ k: "spark", x: b.x, y: b.y - 80, t: 0, life: 0.2 }); this.hitstop = 0.05;
    }
    b.hp -= d; a.meter = Math.min(3, a.meter + d / 40); b.meter = Math.min(3, b.meter + d / 80);
    this.fx.push({ k: "num", v: Math.max(1, Math.round(d)), x: b.x, y: b.y - 130, t: 0, life: 0.6 });
    if (b.hp <= 0) { b.hp = 0; this.finish(a === this.P); }
    return true;
  };
  Game.prototype.finish = function (win) { if (this.done) return; this.done = true; this.win = win; this.o.onEnd && this.o.onEnd(this.result()); };
  Game.prototype.result = function () { return { win: !!this.win, hpFrac: Math.max(0, this.P.hp) / this.P.max, time: +this.t.toFixed(1), hits: this.P.hits, taken: Math.round(this.P.max - this.P.hp), special: this.special }; };
  Game.prototype.awaken = function () { var f = this.P; if (f.meter < 3 || this.done) return false; f.meter = 0; this.fx.push({ k: "cut", t: 0, life: 0.8 }); this.hit(f, this.E, { d: 30 * f.o.dmg, kb: 300, launch: true, unblock: true }); return true; };
  Game.prototype.ai = function (f, foe, dt, smart) {
    var dx = foe.x - f.x, ad = Math.abs(dx), r = this.r(), inp = {};
    f.aiT = (f.aiT || 0) - dt; if (f.aiT > 0) return f.aiInp || {}; f.aiT = smart ? 0.12 : 0.2;
    var threat = foe.act && foe.actT < foe.act.s + foe.act.a && ad < (foe.act.reach || 0) + 40;
    if (threat && r < (smart ? 0.55 : 0.45)) inp.block = true;
    else if (ad > 110) inp.move = Math.sign(dx);
    else if (f.meter >= 3 && f === this.P) inp.awaken = true;
    else if (f.meter >= 1 && r < 0.25) inp.S = true;
    else if (f.combo >= 2 && r < 0.7) inp.H = true;
    else if (r < 0.85) inp.L = true; else inp.move = -Math.sign(dx);
    if (ad > 320 && f.meter >= 1 && r < 0.3) inp.S = true;
    f.aiInp = inp; return inp;
  };
  Game.prototype.stepF = function (f, foe, inp, dt) {
    f.face = foe.x > f.x ? 1 : -1; f.inv = Math.max(0, f.inv - dt); f.counter = Math.max(0, (f.counter || 0) - dt); f.comboT -= dt; if (f.comboT <= 0) f.combo = 0;
    f.guard = Math.max(0, f.guard - dt * 10);
    if (f.gbreak > 0) f.gbreak -= dt;
    if (f.stun > 0) f.stun -= dt;
    var free = f.stun <= 0 && f.gbreak <= 0;
    f.block = free && !!inp.block && !f.act;
    if (free && !f.act && !f.block) { var mv = inp.move || 0; f.vx = mv * f.o.spd; if (inp.jump && !f.air) { f.vy = -620; f.air = true; } }
    if (free) { if (inp.L) this.startMove(f, "L"); else if (inp.H) this.startMove(f, "H"); else if (inp.S) this.startMove(f, "S"); if (inp.awaken && f === this.P) this.awaken(); }
    if (f.act) {
      f.actT += dt * f.o.aspd; var a = f.act; f.vx *= 0.8;
      if (!f.hitDone && f.actT >= a.s) { f.hitDone = true; if (a.k === "S") this.special_(f, foe); else if (Math.abs(foe.x - f.x) < a.reach * (f === this.P ? this.ch.reach : 1) && Math.abs(foe.y - f.y) < 120 && (foe.x - f.x) * f.face > 0) this.hit(f, foe, { d: a.d * f.o.dmg, kb: a.kb, launch: a.launch }); }
      if (f.actT >= a.s + a.a + a.r) f.act = null;
    }
    if (f.stun > 0) f.vx *= 0.9;
    f.x = clamp(f.x + f.vx * dt, 40, FW - 40); f.vy += 1500 * dt; f.y += f.vy * dt; if (f.y >= GROUND) { f.y = GROUND; f.vy = 0; f.air = false; }
  };
  Game.prototype.update = function (dt) {
    if (this.done) return; if (this.hitstop > 0) { this.hitstop -= dt; return; }
    this.t += dt; var P = this.P, E = this.E, i, self = this;
    var pin = this.auto ? this.ai(P, E, dt, true) : this.readInput();
    this.stepF(P, E, pin, dt); if (this.done) return; this.stepF(E, P, this.ai(E, P, dt, false), dt); if (this.done) return;
    if (Math.abs(P.x - E.x) < 50 && !P.air && !E.air) { var m = (50 - Math.abs(P.x - E.x)) / 2, s = P.x < E.x ? -1 : 1; P.x = clamp(P.x + s * m, 40, FW - 40); E.x = clamp(E.x - s * m, 40, FW - 40); }
    for (i = this.shots.length - 1; i >= 0; i--) { var q = this.shots[i], foe = q.own === P ? E : P; q.life -= dt;
      if (q.k === "h") { var ang = Math.atan2(foe.y - 80 - q.y, foe.x - q.x), sp = 420; q.vx += (Math.cos(ang) * sp - q.vx) * dt * 3; q.vy += (Math.sin(ang) * sp - q.vy) * dt * 3; }
      if (q.g) q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt;
      var hitq = Math.abs(q.x - foe.x) < 40 && Math.abs(q.y - (foe.y - 70)) < 70;
      if (q.k === "b" && (q.y > GROUND - 10 || hitq)) { this.fx.push({ k: "boom", x: q.x, y: Math.min(q.y, GROUND), r: q.aoe, t: 0, life: 0.35 }); if (Math.abs(foe.x - q.x) < q.aoe) this.hit(q.own, foe, { d: q.d, kb: 200, launch: true }); this.shots.splice(i, 1); continue; }
      if (hitq) { this.hit(q.own, foe, { d: q.d, kb: 90 }); this.shots.splice(i, 1); continue; }
      if (q.life <= 0 || q.x < -50 || q.x > FW + 50) this.shots.splice(i, 1); }
    for (i = this.fx.length - 1; i >= 0; i--) { this.fx[i].t += dt; if (this.fx[i].t > this.fx[i].life) this.fx.splice(i, 1); }
    if (this.t >= this.limit) this.finish(P.hp / P.max >= E.hp / E.max);
  };
  Game.prototype.readInput = function () { var k = this.keys, b = this.input, o = { move: (k.ArrowRight || k.d || b.right ? 1 : 0) - (k.ArrowLeft || k.a || b.left ? 1 : 0), jump: k.ArrowUp || k.w || b.jump, block: k.ArrowDown || k.s || b.block, L: this.tap("L"), H: this.tap("H"), S: this.tap("S"), awaken: this.tap("U") }; return o; };
  Game.prototype.press = function (k) { this.queued = this.queued || {}; this.queued[k] = 1; };
  Game.prototype.tap = function (k) { if (this.queued && this.queued[k]) { this.queued[k] = 0; return true; } return false; };
  Game.prototype.snapshot = function () { var P = this.P, E = this.E; return { t: +this.t.toFixed(2), done: this.done, win: this.win, ch: this.cid, form: this.slot, special: this.special, p: { hp: +(P.hp / P.max).toFixed(3), meter: +P.meter.toFixed(2), x: Math.round(P.x), act: P.act && P.act.k, combo: P.combo, block: P.block }, e: { hp: +(E.hp / E.max).toFixed(3), x: Math.round(E.x), stun: E.stun > 0, gbreak: E.gbreak > 0, name: E.name } }; };
  Game.prototype.draw = function (g, img, W, H) {
    var sc = Math.min(W / FW, H / FH), ox = (W - FW * sc) / 2, oy = (H - FH * sc) / 2, self = this;
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = "#07050d"; g.fillRect(0, 0, W, H); g.setTransform(sc, 0, 0, sc, ox, oy);
    var bg = img.stage; if (bg && bg.width) { var s2 = Math.max(FW / bg.width, FH / bg.height); g.drawImage(bg, (FW - bg.width * s2) / 2, (FH - bg.height * s2) / 2, bg.width * s2, bg.height * s2); } else { g.fillStyle = "#1a1230"; g.fillRect(0, 0, FW, FH); }
    g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(0, GROUND + 4, FW, FH - GROUND);
    var pose = function (f, set) { if (!set) return null; var k = f.stun > 0 || f.gbreak > 0 ? "hit" : f.act ? (f.act.k === "S" ? "skill" : "attack") : f.block ? "skill" : Math.abs(f.vx) > 20 ? "run" + (Math.floor(self.t * 12) % 8) : "idle"; return set[k] && set[k].width ? set[k] : set.idle; };
    [[this.E, pose(this.E, img.foeSet), true], [this.P, pose(this.P, img.meSet), false]].forEach(function (pr) { var f = pr[0], im = pr[1], h = 230, x = f.x, y = f.y, mirror = pr[2];
      g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(x, GROUND + 6, 50, 10, 0, 0, 7); g.fill();
      g.save(); g.translate(x, y); var lean = f.act ? (f.act.k === "H" ? 0.12 : 0.06) * f.face : f.stun > 0 ? -0.15 * f.face : 0; g.rotate(lean); g.scale(f.face, 1);
      if (im && im.width) { var w = h * im.width / im.height; if (mirror) g.filter = "brightness(.62) hue-rotate(210deg) saturate(1.5) contrast(1.15)"; g.drawImage(im, -w / 2, -h, w, h); g.filter = "none"; } else { g.fillStyle = f === self.P ? self.ch.col : "#8a7"; g.fillRect(-30, -h, 60, h); }
      if (f.act && f.actT >= f.act.s && f.actT < f.act.s + f.act.a && f.act.reach) { g.strokeStyle = f.act.k === "H" ? "#ffd76a" : "#fff"; g.lineWidth = f.act.k === "H" ? 10 : 6; g.globalAlpha = 0.8; g.beginPath(); g.arc(20, -100, f.act.reach * 0.8, -0.9, 0.7); g.stroke(); g.globalAlpha = 1; }
      if (f.block) { g.strokeStyle = "#8fd8ff"; g.lineWidth = 5; g.beginPath(); g.arc(30, -100, 70, -1.2, 1.2); g.stroke(); }
      g.restore(); });
    this.shots.forEach(function (q) { g.fillStyle = q.k === "b" ? "#ffb36b" : q.k === "h" ? "#9fe1ff" : "#ffc1dc"; g.beginPath(); g.arc(q.x, q.y, q.k === "b" ? 14 : 10, 0, 7); g.fill(); });
    this.fx.forEach(function (f) { var a = 1 - f.t / f.life; g.globalAlpha = a;
      if (f.k === "num") { g.fillStyle = "#ffe08a"; g.font = "bold 26px sans-serif"; g.textAlign = "center"; g.fillText(f.v, f.x, f.y - f.t * 60); }
      else if (f.k === "spark") { g.fillStyle = "#fff"; g.beginPath(); g.arc(f.x, f.y, 26 * (1 + f.t * 4), 0, 7); g.fill(); }
      else if (f.k === "guard") { g.strokeStyle = "#8fd8ff"; g.lineWidth = 4; g.beginPath(); g.arc(f.x, f.y, 40, 0, 7); g.stroke(); }
      else if (f.k === "boom") { g.strokeStyle = "#ffb36b"; g.lineWidth = 8; g.beginPath(); g.arc(f.x, f.y, f.r * (0.4 + f.t / f.life), 0, 7); g.stroke(); }
      else if (f.k === "beam") { g.fillStyle = "#9fe1ff"; g.fillRect(f.dir > 0 ? f.x : 0, f.y - 10, f.dir > 0 ? FW - f.x : f.x, 20); }
      else if (f.k === "txt") { g.fillStyle = "#ffd76a"; g.font = "bold 34px sans-serif"; g.textAlign = "center"; g.fillText(f.s, f.x, f.y); }
      else if (f.k === "ring") { g.strokeStyle = "#ffc1dc"; g.lineWidth = 4; g.beginPath(); g.arc(f.f.x, f.f.y - 100, 90, 0, 7); g.stroke(); }
      else if (f.k === "cut") { g.fillStyle = "#fff"; g.fillRect(0, FH / 2 - 60 * a, FW, 120 * a); }
      g.globalAlpha = 1; });
    var bar = function (x, v, m, col, right) { g.fillStyle = "#0008"; g.fillRect(x, 20, 380, 18); g.fillStyle = col; var w = 380 * Math.max(0, v); g.fillRect(right ? x + 380 - w : x, 20, w, 18); for (var i = 0; i < 3; i++) { g.fillStyle = m >= i + 1 ? "#ffd76a" : "#fff3"; g.fillRect((right ? x + 380 - 40 - i * 44 : x + i * 44), 44, 38, 8); } };
    bar(30, this.P.hp / this.P.max, this.P.meter, "#7cf29a", false); bar(FW - 410, this.E.hp / this.E.max, this.E.meter, "#ff5d8f", true);
    g.fillStyle = "#fff"; g.font = "bold 30px sans-serif"; g.textAlign = "center"; g.fillText(Math.max(0, Math.ceil(this.limit - this.t)), FW / 2, 44);
    g.font = "15px sans-serif"; g.textAlign = "left"; g.fillText(this.ch.name, 30, 74); g.textAlign = "right"; g.fillText(this.E.name, FW - 30, 74);
    g.setTransform(1, 0, 0, 1, 0, 0);
  };
  var CSS = "#duel46{position:fixed;inset:0;z-index:125;background:#07050d;touch-action:none;user-select:none;color:#fff}#duel46 canvas{position:absolute;inset:0;width:100%;height:100%}#duel46 .pad{position:absolute;left:16px;bottom:16px;display:grid;grid-template-columns:repeat(3,56px);gap:6px}#duel46 .act{position:absolute;right:16px;bottom:16px;display:grid;grid-template-columns:repeat(3,64px);gap:8px}#duel46 button{height:56px;border-radius:14px;border:1px solid #fff4;background:#2a2034cc;color:#fff;font-weight:bold}#duel46 .res{position:absolute;inset:0;display:grid;place-items:center;background:#000a}#duel46 .res .box{background:#1d1430;padding:20px 28px;border-radius:14px;text-align:center}#duel46 .res button{margin-top:12px;padding:0 22px;background:#ffd76a;color:#2a2034}";
  var cur = null, raf = 0;
  function start(o) {
    stop(); o = o || {};
    if (!document.getElementById("duel46css")) { var st = document.createElement("style"); st.id = "duel46css"; st.textContent = CSS; document.head.appendChild(st); }
    var root = document.createElement("div"); root.id = "duel46";
    root.innerHTML = '<canvas></canvas><div class="pad"><span></span><button data-h="jump">↑</button><span></span><button data-h="left">←</button><button data-h="block">防</button><button data-h="right">→</button></div><div class="act"><button data-p="L">轻</button><button data-p="H">重</button><button data-p="S">必杀</button><span></span><span></span><button data-p="U">觉醒</button></div>';
    (o.parent || document.body).appendChild(root);
    var cv = root.querySelector("canvas"), g = cv.getContext("2d"), img = {};
    var art = function (k, p) { var i = new Image(); i.src = o.art ? o.art(p) : "art/" + p; img[k] = i; };
    art("stage", "duel/stage" + (((o.layer || 1) - 1) % 3 + 1) + ".webp");
    /* 角色用战斗动画帧（idle/attack/skill/hit/run_0..7）；对手 = 镜中倒影（另一名角色的帧 + 暗紫滤镜），呼应“镜界复制体”设定。 */
    var cid = CH[o.character] ? o.character : "sayo", foeId = o.foe || ["aya", "rion", "sayo"][["sayo", "aya", "rion"].indexOf(cid)];
    var set = function (c) { var S = {}; ["idle", "attack", "skill", "hit"].forEach(function (k) { var i = new Image(); i.src = (o.art ? o.art("characters/" + c + "/default/anim_" + k + ".webp") : "art/characters/" + c + "/default/anim_" + k + ".webp"); S[k] = i; }); for (var n = 0; n < 8; n++) { var j = new Image(); j.src = o.art ? o.art("characters/" + c + "/default/anim_run_" + n + ".webp") : "art/characters/" + c + "/default/anim_run_" + n + ".webp"; S["run" + n] = j; } return S; };
    img.meSet = set(cid); img.foeSet = set(foeId);
    var game = new Game(Object.assign({}, o, { onEnd: function (r) { var el = document.createElement("div"); el.className = "res"; el.innerHTML = '<div class="box"><h2>' + (r.win ? "镜斗胜利" : "败北") + "</h2><p>用时 " + r.time + " s · 命中 " + r.hits + " · 承伤 " + r.taken + '</p><button class="ok">' + (o.okText || "继续") + "</button></div>"; root.appendChild(el); el.querySelector(".ok").onclick = function () { stop(); o.onClose && o.onClose(r); }; o.onEnd && o.onEnd(r); } }));
    game.auto = !!o.auto; game.root = root; cur = game;
    root.querySelectorAll("[data-h]").forEach(function (b) { var k = b.dataset.h; b.onpointerdown = function () { game.input[k] = 1; }; b.onpointerup = b.onpointerleave = function () { game.input[k] = 0; }; });
    root.querySelectorAll("[data-p]").forEach(function (b) { b.onpointerdown = function () { game.press(b.dataset.p); }; });
    var map = { j: "L", J: "L", k: "H", K: "H", l: "S", L: "S", u: "U", U: "U" };
    game.kd = function (e) { game.keys[e.key] = 1; if (map[e.key]) game.press(map[e.key]); }; game.ku = function (e) { game.keys[e.key] = 0; };
    addEventListener("keydown", game.kd); addEventListener("keyup", game.ku);
    var paint = function () { var dpr = Math.min(global.devicePixelRatio || 1, 2), W = Math.round(cv.clientWidth * dpr), H = Math.round(cv.clientHeight * dpr); if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; } game.draw(g, img, W, H); };
    game.paint = paint; var t0 = performance.now();
    var loop = function (now) { raf = requestAnimationFrame(loop); var dt = Math.min(0.05, (now - t0) / 1000); t0 = now; if (global.__duelManual) return; game.update(dt); paint(); };
    raf = requestAnimationFrame(loop); return game;
  }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; if (cur) { removeEventListener("keydown", cur.kd); removeEventListener("keyup", cur.ku); cur.root && cur.root.remove(); } cur = null; }
  function simulate(o, maxT) { var g = new Game(o); g.auto = true; for (var t = 0; t < (maxT || 90) && !g.done; t += 1 / 60) g.update(1 / 60); return g.result(); }
  global.SakurayoDuel = { Game: Game, start: start, stop: stop, simulate: simulate, current: function () { return cur; }, step: function (dt) { if (cur) { cur.update(dt); cur.paint(); } }, FW: FW, FH: FH, CH: CH };
})(typeof window !== "undefined" ? window : globalThis);
