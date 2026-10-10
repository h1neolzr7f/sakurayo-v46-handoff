/* SakurayoShmup：纵版射击肉鸽模式（DESIGN_V5 路线图 P2，雷霆战机式）。
   - 独立模块：自带画布、循环、输入、HUD，与割草战斗解耦；只通过 start(opts) / onEnd(result) 与夜行地图交互。
   - 夜行中作为特殊节点「镜空 · 纵版」（两段卷轴 + 段间三选一 + 段末镜卫母舰）和第 2 层层主（纵版弹幕 Boss，3 阶段 + 破防窗口）。
   - 构筑与形态在本模式里换成对应表现（DESIGN_V5 §1.5）：
       构筑卡  spread→扇形副炮 / homing→追踪飞弹 / laser→贯穿光束 / orbit→护身僚机 / pierce→穿透 / explosive→爆裂弹 / ricochet→反弹 / burst→齐射
       形态    guard→机首护盾板反弹子弹 / speed→小判定高机动、擦弹充能炸弹 / burst→热度满放清屏主炮（受伤×1.35） / awaken→Boss 第 3 阶段 10 秒觉醒
   - 角色：小夜＝高速连射；绫＝双枪 + 印记追踪（「连麦」形态带妹妹僚机）；凛音＝移动时剑气、静止蓄力后纵斩。
   - 闪烁安全：炸弹/清屏使用扩散环（峰值透明度 ≤ .35），无全屏白闪。 */
(function (global) {
  "use strict";
  var FW = 540, FH = 960;
  function rng(seed) { var s = (seed >>> 0) || 7; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  var CH = {
    sayo: { name: "月城小夜", rate: 15, dmg: 4.6, spd: 1 },
    aya: { name: "神代绫", rate: 9, dmg: 6.6, spd: 1, mark: 0.7 },
    rion: { name: "黑羽凛音", rate: 8, dmg: 13, spd: 0.95, blade: 1 }
  };
  var ETYPE = {
    pop: { hp: 7, r: 26, spr: ["enemy_a0", "enemy_b0"], size: 64, score: 1 },
    weave: { hp: 16, r: 28, spr: ["enemy_a2", "enemy_b2"], size: 74, score: 2 },
    gun: { hp: 42, r: 34, spr: ["enemy_a1", "enemy_b1"], size: 92, score: 4 },
    turret: { hp: 70, r: 38, spr: ["enemy_a5", "enemy_b5"], size: 100, score: 5 },
    heavy: { hp: 150, r: 46, spr: ["enemy_a3", "enemy_b3", "enemy_a4", "enemy_b4"], size: 124, score: 8 }
  };
  function Game(o) {
    var self = this; this.o = o; this.r = rng(o.seed || 1); this.t = 0; this.done = false;
    var c = CH[o.character] || CH.sayo; this.ch = c; this.cid = CH[o.character] ? o.character : "sayo";
    var f = o.form || {}; this.form = f; var slot = f.slot || "base";
    var up = o.weapons || {}, lv = function (k) { return up[k] ? (up[k].lv || 1) + (up[k].evo ? 2 : 0) : 0; };
    this.lv = lv; this.power = clamp(o.power || 1, 0.7, 2.6);
    this.P = { x: FW / 2, y: FH - 150, r: slot === "speed" ? 4 : 7, spd: 430 * c.spd * (slot === "speed" ? 1.22 : slot === "guard" ? 0.9 : 1),
      hp: clamp(o.hpFrac == null ? 1 : o.hpFrac, 0.05, 1), inv: 1.5, cd: 0, heat: 0, over: 0, charge: 0, bombs: 1 + (slot === "speed" ? 1 : 0), shield: 0, graze: 0,
      dmgTaken: slot === "burst" ? 1.35 : 1, moving: 0, vx: 0, vy: 0, hits: 0, awakenUntil: -1, gauge: 0, homT: 0, burstT: 0, beamOn: lv("laser") > 0 };
    if (this.cid === "aya" && slot === "burst") this.P.hpCap = 0.5;
    this.E = []; this.B = []; this.S = []; this.FX = []; this.picks = []; this.kills = 0; this.score = 0; this.boss = null;
    this.kind = o.kind || "node"; this.layer = o.layer || 1;
    this.plan = this.kind === "boss" ? [{ seg: 18 }, { boss: 1 }] : [{ seg: 24 }, { pick: 1 }, { seg: 24 }, { elite: 1 }];
    this.step_ = 0; this.segT = 0; this.spawnT = 0.6; this.pause = false;
    this.keys = {}; this.drag = null; this.bgY = 0;
  }
  Game.prototype.hpMax = function () { return this.P.hpCap || 1; };
  Game.prototype.cur = function () { return this.plan[this.step_] || null; };
  Game.prototype.next = function () {
    this.step_++; this.segT = 0; var s = this.cur();
    if (!s) return this.end(true);
    if (s.pick) { this.pause = true; this.o.onPick && this.o.onPick(this.pickOptions()); }
    if (s.elite) this.spawnBoss(true);
    if (s.boss) this.spawnBoss(false);
  };
  Game.prototype.pickOptions = function () {
    return [{ k: "power", n: "樱弹增幅", d: "主炮伤害 +20%" }, { k: "shield", n: "镜盾结晶", d: "抵挡 1 次伤害（可叠 2）" }, { k: "heal", n: "灯笼补给", d: "回复 20% 生命，炸弹 +1" }];
  };
  Game.prototype.choose = function (k) {
    var P = this.P; if (k === "power") this.power *= 1.2; else if (k === "shield") P.shield = Math.min(2, P.shield + 1); else { P.hp = Math.min(this.hpMax(), P.hp + 0.2); P.bombs++; }
    this.pause = false; this.next();
  };
  Game.prototype.spawn = function (type, x, y, mv) {
    var T = ETYPE[type], hpMul = 1 + 0.35 * (this.layer - 1);
    var e = { type: type, x: x, y: y, r: T.r, hp: T.hp * hpMul, max: T.hp * hpMul, spr: T.spr[Math.floor(this.r() * T.spr.length)], size: T.size, t: 0, mv: mv || "down", fire: 0.8 + this.r(), flash: 0, x0: x };
    this.E.push(e); return e;
  };
  Game.prototype.wave = function () {
    var r = this.r, k = r(), d = Math.min(1, this.segT / 20);
    if (k < 0.32) { var x = 80 + r() * (FW - 160), n = 4 + Math.floor(d * 3); for (var i = 0; i < n; i++) this.spawn("pop", x + (i - n / 2) * 18, -40 - i * 46, "dive"); }
    else if (k < 0.58) { for (i = 0; i < 5; i++) this.spawn("weave", FW / 2 + (i - 2) * 86, -40 - Math.abs(i - 2) * 50, "sine"); }
    else if (k < 0.8) { this.spawn("gun", 110 + r() * (FW - 220), -60, "hold"); if (d > 0.5) this.spawn("gun", 110 + r() * (FW - 220), -150, "hold"); }
    else if (k < 0.93) { this.spawn("turret", r() < 0.5 ? 100 : FW - 100, -60, "hold"); }
    else this.spawn("heavy", FW / 2, -80, "hold");
    this.spawnT = 2.1 - 0.7 * d;
  };
  Game.prototype.spawnBoss = function (elite) {
    var L = this.layer, hp = elite ? 1500 + 500 * L : 4800 + 1600 * L;
    this.boss = { elite: elite, x: FW / 2, y: -160, ty: 190, r: elite ? 90 : 130, hp: hp, max: hp, phase: 1, t: 0, pat: 0, flash: 0, brk: 0, spr: elite ? "boss3" : (L % 2 ? "boss1" : "boss2"), size: elite ? 300 : 420, name: elite ? "镜卫母舰" : (L % 2 ? "百眼神舆" : "雨伞群舰·唐伞") };
    this.o.onBoss && this.o.onBoss(this.boss);
  };
  /* —— 敌弹 —— */
  Game.prototype.eb = function (x, y, a, v, big) { this.B.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: big ? 9 : 6, big: !!big, g: 0 }); };
  Game.prototype.aim = function (x, y) { return Math.atan2(this.P.y - y, this.P.x - x); };
  Game.prototype.bossFire = function (b, dt) {
    b.pat -= dt; if (b.pat > 0 || b.brk > 0) return;
    var t = b.t, i, n, a0;
    if (b.elite) { n = 10; a0 = t * 0.8; for (i = 0; i < n; i++) this.eb(b.x, b.y + 40, a0 + i * Math.PI * 2 / n, 170); b.pat = 0.9; if ((t | 0) % 3 === 0) { a0 = this.aim(b.x, b.y); for (i = -2; i <= 2; i++) this.eb(b.x, b.y + 50, a0 + i * 0.16, 240, true); } return; }
    if (b.phase === 1) { a0 = this.aim(b.x, b.y); for (i = -3; i <= 3; i++) this.eb(b.x, b.y + 60, a0 + i * 0.13, 250); n = 14; for (i = 0; i < n; i++) this.eb(b.x, b.y, i * Math.PI * 2 / n + t, 150, true); b.pat = 1.05; }
    else if (b.phase === 2) { for (i = 0; i < 4; i++) this.eb(b.x, b.y, t * 2.1 + i * Math.PI / 2, 190); for (i = 0; i < 4; i++) this.eb(b.x, b.y, -t * 1.6 + i * Math.PI / 2 + 0.4, 160, true); b.pat = 0.14; }
    else { var gap = (Math.sin(t * 0.7) * 0.5 + 0.5) * (FW - 200) + 100; for (var x = 20; x < FW; x += 34) if (Math.abs(x - gap) > 70) this.B.push({ x: x, y: b.y + 60, vx: 0, vy: 165, r: 6, g: 0 }); n = 8; for (i = 0; i < n; i++) this.eb(b.x, b.y, i * Math.PI * 2 / n + t * 0.5, 210, true); b.pat = 1.15; }
  };
  /* —— 我方火力 —— */
  Game.prototype.shot = function (x, y, vx, vy, dmg, o) { var s = { x: x, y: y, vx: vx, vy: vy, dmg: dmg * this.power, r: 6, pierce: 0, life: 2 }; for (var k in o) s[k] = o[k]; if (this.lv("pierce")) s.pierce = Math.max(s.pierce, this.lv("pierce")); if (this.lv("ricochet")) s.bounce = 1; if (this.lv("explosive")) s.boom = 30 + 8 * this.lv("explosive"); this.S.push(s); };
  Game.prototype.fire = function (dt) {
    var P = this.P, c = this.ch, slot = this.form.slot || "base", aw = this.t < P.awakenUntil, rateMul = (aw ? 2 : 1) * (slot === "burst" && P.over > 0 ? 1.6 : 1);
    P.cd -= dt; P.homT -= dt; P.burstT -= dt;
    if (this.cid === "rion") {
      var still = !P.moving && slot !== "speed";
      if (still) { P.charge = Math.min(1.2 * (slot === "burst" ? 2 : 1), P.charge + dt); }
      else if (P.charge > 0.5) { var k = P.charge / 1.2; this.shot(P.x, P.y - 30, 0, -900, c.dmg * 26 * k, { w: 70 + 50 * k, pierce: 99, life: 1.3, slash: 1 }); this.ring(P.x, P.y - 60, 60, "#ff6a8c"); P.charge = 0; }
      else P.charge = 0;
      if (P.cd <= 0 && !still) { var cmb = slot === "speed" ? 1 + Math.min(0.75, (P.combo || 0) / 40) : 1; this.shot(P.x, P.y - 24, 0, -780, c.dmg, { w: 38, pierce: 1, life: 0.95, slash: 1 }); P.cd = 1 / (c.rate * rateMul * cmb); }
    } else if (P.cd <= 0) {
      if (this.cid === "sayo") { this.shot(P.x - 8, P.y - 30, -30, -980, c.dmg); this.shot(P.x + 8, P.y - 30, 30, -980, c.dmg); P.heat = Math.min(100, P.heat + 0.9); }
      else { this.shot(P.x - 14, P.y - 26, 0, -900, c.dmg); this.shot(P.x + 14, P.y - 26, 0, -900, c.dmg); }
      var sp = this.lv("spread"); for (var i = 1; i <= Math.min(3, Math.ceil(sp / 2)); i++) { this.shot(P.x, P.y - 20, -170 * i, -900, c.dmg * 0.6); this.shot(P.x, P.y - 20, 170 * i, -900, c.dmg * 0.6); }
      if (this.cid === "aya" && slot === "burst") { var w = this.wing(); this.shot(w.x, w.y - 20, 0, -900, c.dmg * 0.8, { sis: 1 }); }
      P.cd = 1 / (c.rate * rateMul);
    }
    var hom = this.lv("homing") + (this.cid === "aya" ? 2 : 0);
    if (hom && P.homT <= 0) { for (i = 0; i < 1 + (hom > 3 ? 1 : 0); i++) this.shot(P.x + (i ? 20 : -20), P.y, i ? 140 : -140, -380, this.ch.dmg * 1.6, { home: 1, life: 3 }); P.homT = 1.4 / (0.6 + 0.25 * hom); }
    var bu = this.lv("burst"); if (bu && P.burstT <= 0) { for (i = -3; i <= 3; i++) this.shot(P.x, P.y - 20, i * 90, -950, this.ch.dmg * 0.9); P.burstT = 3 - 0.3 * bu; }
    if (slot === "burst" && this.cid === "sayo" && P.heat >= 100 && P.over <= 0) { P.over = 3; P.heat = 0; this.clear(0.12); }
    if (P.over > 0) P.over -= dt;
  };
  Game.prototype.wing = function () { return { x: this.P.x + Math.cos(this.t * 2) * 60, y: this.P.y + 20 + Math.sin(this.t * 2) * 18 }; };
  Game.prototype.ring = function (x, y, r, col) { this.FX.push({ x: x, y: y, r: r, t: 0, life: 0.5, col: col || "#ffd1e6" }); };
  Game.prototype.clear = function (dmgMul) { // 炸弹/清屏：消弹 + 全体伤害（扩散环，非全屏闪）
    var P = this.P; this.B.forEach(function (b) { b.dead = 1; }); this.ring(P.x, P.y, 40, this.form.tint || "#ffd1e6"); this.FX.push({ x: P.x, y: P.y, r: 30, t: 0, life: 0.9, col: this.form.tint || "#ffd1e6", big: 1 });
    var d = 70 * this.power * dmgMul; this.E.forEach(function (e) { e.hp -= d * 3; e.flash = 0.1; }); if (this.boss) this.hurtBoss(d * 6);
  };
  Game.prototype.bomb = function () { if (this.P.bombs <= 0 || this.done || this.pause) return false; this.P.bombs--; this.P.inv = Math.max(this.P.inv, 1.2); this.clear(1); return true; };
  Game.prototype.canAwaken = function () { return this.boss && !this.boss.elite && this.boss.phase >= 3 && this.P.gauge >= 100 && this.t >= this.P.awakenUntil; };
  Game.prototype.awaken = function () { if (!this.canAwaken()) return false; this.P.gauge = 0; this.P.awakenUntil = this.t + 10; this.P.inv = 10; this.o.onAwaken && this.o.onAwaken(); return true; };
  Game.prototype.hurtBoss = function (d) {
    var b = this.boss; if (!b || b.y < 40) return; if (b.brk > 0) d *= 1.5; b.hp -= d; b.flash = 0.06; this.P.gauge = Math.min(100, this.P.gauge + d / b.max * 260);
    if (!b.elite) { var ph = b.hp < b.max * 0.34 ? 3 : b.hp < b.max * 0.67 ? 2 : 1; if (ph > b.phase) { b.phase = ph; b.brk = 3; this.B.forEach(function (q) { q.dead = 1; }); this.ring(b.x, b.y, 120, "#ffe6a3"); this.o.onPhase && this.o.onPhase(ph); } }
    if (b.hp <= 0) { this.ring(b.x, b.y, 200, "#fff3c4"); this.score += b.elite ? 40 : 100; this.boss = null; this.B.forEach(function (q) { q.dead = 1; }); this.next(); }
  };
  Game.prototype.hitPlayer = function (big) {
    var P = this.P; if (P.inv > 0 || this.done) return;
    if (P.shield > 0) { P.shield--; P.inv = 1; this.ring(P.x, P.y, 40, "#7fd8ff"); return; }
    P.hp -= (big ? 0.11 : 0.085) * P.dmgTaken * (0.8 + 0.1 * this.layer); P.hits++; P.inv = 1.4; this.ring(P.x, P.y, 50, "#ff6a6a");
    this.B.forEach(function (b) { if (Math.hypot(b.x - P.x, b.y - P.y) < 120) b.dead = 1; });
    if (P.hp <= 0) { P.hp = 0; this.end(false); }
  };
  Game.prototype.end = function (win) { if (this.done) return; this.done = true; this.win = win; this.o.onEnd && this.o.onEnd(this.result()); };
  Game.prototype.result = function () { return { win: !!this.win, hpFrac: Math.max(0, this.P.hp) / this.hpMax() * (this.P.hpCap ? 1 : 1), time: +this.t.toFixed(1), hits: this.P.hits, kills: this.kills, grazes: this.P.graze | 0, score: this.score }; };
  /* —— 输入 —— */
  Game.prototype.input = function (dt) {
    var P = this.P, k = this.keys, ax = 0, ay = 0;
    if (k.ArrowLeft || k.a || k.A) ax -= 1; if (k.ArrowRight || k.d || k.D) ax += 1; if (k.ArrowUp || k.w || k.W) ay -= 1; if (k.ArrowDown || k.s || k.S) ay += 1;
    var gp = global.navigator && navigator.getGamepads ? (navigator.getGamepads() || [])[0] : null;
    if (gp) { if (Math.abs(gp.axes[0]) > 0.2) ax = gp.axes[0]; if (Math.abs(gp.axes[1]) > 0.2) ay = gp.axes[1]; if (gp.buttons[0] && gp.buttons[0].pressed) this.bomb(); if (gp.buttons[3] && gp.buttons[3].pressed) this.awaken(); }
    if (this.auto) { var a = this.autopilot(); ax = a[0]; ay = a[1]; }
    var mx = 0, my = 0;
    if (ax || ay) { var l = Math.hypot(ax, ay); if (l > 1) { ax /= l; ay /= l; } mx = ax * P.spd * dt; my = ay * P.spd * dt; }
    if (this.dragD) { mx += this.dragD[0]; my += this.dragD[1]; this.dragD = null; }
    P.moving = Math.hypot(mx, my) > 0.4 * dt * 60 ? 1 : 0;
    P.x = clamp(P.x + mx, 24, FW - 24); P.y = clamp(P.y + my, 120, FH - 40);
  };
  /* 自动驾驶（测试/平衡诊断/录像）：躲最近的弹，横向对准目标，凛音停火蓄力。 */
  Game.prototype.autopilot = function () {
    var P = this.P, fx = 0, fy = 0, i, b, dx, dy, d, danger = 0;
    for (i = 0; i < this.B.length; i++) { b = this.B[i]; dx = P.x - b.x; dy = P.y - b.y; d = Math.hypot(dx, dy); var tt = Math.max(0, -(dx * b.vx + dy * b.vy) / (b.vx * b.vx + b.vy * b.vy + 1e-6)); if (d < 150 && tt < 0.9) { var w = (150 - d) / 150; fx += dx / (d + 1) * w * 3; fy += dy / (d + 1) * w * 2; danger += w; } }
    var tg = this.boss || this.E.reduce(function (a, e) { return e.y > 0 && (!a || e.y > a.y) ? e : a; }, null);
    if (tg) fx += clamp((tg.x - P.x) / 120, -1, 1) * (danger > 0.5 ? 0.3 : 1);
    fy += clamp((FH - 170 - P.y) / 120, -1, 1) * 0.6; fx += (P.x < 60 ? 1 : P.x > FW - 60 ? -1 : 0);
    if (danger > 2.2 && P.inv <= 0) this.bomb();
    if (this.canAwaken()) this.awaken();
    if (this.cid === "rion" && this.form.slot !== "speed") { var ph = this.t % (this.form.slot === "burst" ? 2.8 : 2.2); if (danger < 0.3 && ph < (this.form.slot === "burst" ? 1.9 : 1.15)) return [0, 0]; }
    return [clamp(fx, -1, 1), clamp(fy, -1, 1)];
  };
  /* —— 主循环 —— */
  Game.prototype.update = function (dt) {
    if (this.done || this.pause) return;
    var P = this.P, self = this, i, e, b, s; this.t += dt; this.segT += dt; this.bgY += dt * 60;
    if (P.inv > 0) P.inv -= dt;
    this.input(dt); this.fire(dt);
    var st = this.cur(); if (st && st.seg) { this.spawnT -= dt; if (this.spawnT <= 0) this.wave(); if (this.segT >= st.seg) { this.E.forEach(function (q) { if (q.y < 0) q.dead = 1; }); this.next(); } }
    // 敌机
    for (i = 0; i < this.E.length; i++) {
      e = this.E[i]; e.t += dt; if (e.flash > 0) e.flash -= dt;
      if (e.mv === "dive") { e.y += 260 * dt; e.x += Math.sin(e.t * 3) * 40 * dt; }
      else if (e.mv === "sine") { e.y += 120 * dt; e.x = e.x0 + Math.sin(e.t * 2.2) * 70; }
      else { e.y = e.y < 170 + (e.type === "heavy" ? 0 : (e.x0 % 90)) ? e.y + 150 * dt : e.y; if (e.t > 9) e.y += 220 * dt; }
      e.fire -= dt;
      if (e.fire <= 0 && e.y > 30 && e.y < FH * 0.7) {
        var a = this.aim(e.x, e.y);
        if (e.type === "gun") { for (var j = -1; j <= 1; j++) this.eb(e.x, e.y + 30, a + j * 0.2, 230); e.fire = 1.5; }
        else if (e.type === "weave") { this.eb(e.x, e.y, a, 200); e.fire = 2.4; }
        else if (e.type === "turret") { for (j = 0; j < 8; j++) this.eb(e.x, e.y, j * Math.PI / 4 + e.t, 150, true); e.fire = 1.8; }
        else if (e.type === "heavy") { for (j = -3; j <= 3; j++) this.eb(e.x, e.y + 40, a + j * 0.12, 210, j === 0); e.fire = 1.3; }
        else e.fire = 99;
      }
      if (e.y > FH + 80) e.dead = 1;
      if (Math.hypot(e.x - P.x, e.y - P.y) < e.r * 0.6 + P.r) this.hitPlayer(true);
    }
    var B = this.boss; if (B) { B.t += dt; if (B.flash > 0) B.flash -= dt; if (B.brk > 0) B.brk -= dt; B.y += (B.ty - B.y) * Math.min(1, dt * 1.5); B.x = FW / 2 + Math.sin(B.t * 0.5) * (B.elite ? 120 : 90); if (B.y > 60) this.bossFire(B, dt); }
    // 敌弹 + 护盾板（guard）+ 擦弹（speed）
    var guard = this.form.slot === "guard";
    for (i = 0; i < this.B.length; i++) {
      b = this.B[i]; if (b.dead) continue; b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < -20 || b.x > FW + 20 || b.y < -40 || b.y > FH + 20) { b.dead = 1; continue; }
      var dx = b.x - P.x, dy = b.y - P.y, d = Math.hypot(dx, dy);
      if (b.ref) { for (var q = 0; q < this.E.length; q++) if (Math.hypot(this.E[q].x - b.x, this.E[q].y - b.y) < this.E[q].r) { this.E[q].hp -= 12 * this.power; b.dead = 1; } if (B && Math.hypot(B.x - b.x, B.y - b.y) < B.r) { this.hurtBoss(12 * this.power); b.dead = 1; } continue; }
      if (guard && dy < -18 && dy > -60 && Math.abs(dx) < 46 && b.vy > 0) { b.vy = -Math.abs(b.vy) * 1.3; b.vx *= -0.5; b.ref = 1; continue; }
      if (d < b.r + P.r) { b.dead = 1; this.hitPlayer(b.big); continue; }
      if (!b.g && d < b.r + P.r + 20) { b.g = 1; P.graze++; if (this.form.slot === "speed" && P.graze % 30 === 0) P.bombs = Math.min(3, P.bombs + 1); }
    }
    // 我方弹
    for (i = 0; i < this.S.length; i++) {
      s = this.S[i]; s.life -= dt; if (s.life <= 0) { s.dead = 1; continue; }
      if (s.home) { var tg = B || this.E.reduce(function (m, q) { return q.y > 0 && (!m || Math.hypot(q.x - s.x, q.y - s.y) < Math.hypot(m.x - s.x, m.y - s.y)) ? q : m; }, null); if (tg) { var ang = Math.atan2(tg.y - s.y, tg.x - s.x), v = 640; s.vx += (Math.cos(ang) * v - s.vx) * Math.min(1, dt * 5); s.vy += (Math.sin(ang) * v - s.vy) * Math.min(1, dt * 5); } }
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.bounce && (s.x < 8 || s.x > FW - 8)) { s.vx = -s.vx; s.bounce = 0; }
      if (s.y < -40) { s.dead = 1; continue; }
      var hw = (s.w || 12) / 2;
      for (var k = 0; k < this.E.length && !s.dead; k++) { e = this.E[k]; if (e.y > -20 && Math.abs(e.x - s.x) < e.r + hw && Math.abs(e.y - s.y) < e.r + 10 && s.hitIds !== e) { e.hp -= s.dmg; e.flash = 0.06; if (s.boom) this.boom(s); if (s.pierce > 0) { s.pierce--; s.hitIds = e; } else s.dead = 1; P.combo = (P.combo || 0) + 1; } }
      if (!s.dead && B && B.y > 40 && Math.abs(B.x - s.x) < B.r + hw && Math.abs(B.y - s.y) < B.r * 0.7) { this.hurtBoss(s.dmg); if (s.boom) this.boom(s); if (s.slash && s.pierce > 50) s.pierce = 0; else s.dead = 1; }
    }
    // 激光（laser 卡）：贯穿光束，按秒结算
    if (P.beamOn) { var bd = this.ch.dmg * 3.2 * this.lv("laser") * this.power * dt; this.E.forEach(function (q) { if (Math.abs(q.x - P.x) < q.r + 8 && q.y < P.y && q.y > 0) { q.hp -= bd; q.flash = 0.03; } }); if (B && Math.abs(B.x - P.x) < B.r && B.y > 40) this.hurtBoss(bd); }
    // 护身僚机（orbit 卡）
    var ob = this.lv("orbit"); if (ob) for (i = 0; i < Math.min(4, 1 + ob); i++) { var oa = this.t * 3 + i * Math.PI * 2 / Math.min(4, 1 + ob), ox = P.x + Math.cos(oa) * 54, oy = P.y + Math.sin(oa) * 54; this.B.forEach(function (q) { if (!q.ref && Math.hypot(q.x - ox, q.y - oy) < 14) q.dead = 1; }); this.E.forEach(function (q) { if (Math.hypot(q.x - ox, q.y - oy) < q.r + 12) q.hp -= 30 * dt * self.power; }); }
    // 回收
    for (i = 0; i < this.E.length; i++) { e = this.E[i]; if (e.hp <= 0 && !e.dead) { e.dead = 1; this.kills++; this.score += ETYPE[e.type].score; this.ring(e.x, e.y, e.r, "#ffc4dc"); if (this.r() < 0.06) this.picks.push({ x: e.x, y: e.y, k: this.r() < 0.5 ? "heal" : "coin" }); } }
    this.E = this.E.filter(function (q) { return !q.dead; }); this.B = this.B.filter(function (q) { return !q.dead; }); this.S = this.S.filter(function (q) { return !q.dead; });
    this.picks = this.picks.filter(function (p) { p.y += 90 * dt; if (Math.hypot(p.x - P.x, p.y - P.y) < 40) { if (p.k === "heal") P.hp = Math.min(self.hpMax(), P.hp + 0.06); else self.score += 3; return false; } return p.y < FH + 30; });
    this.FX = this.FX.filter(function (f) { f.t += dt; return f.t < f.life; });
  };
  /* —— 渲染 —— */
  Game.prototype.draw = function (g, img, W, H) {
    var sc = Math.min(W / FW, H / FH), ox = (W - FW * sc) / 2, oy = (H - FH * sc) / 2, P = this.P, t = this.t, self = this, i;
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = "#07050d"; g.fillRect(0, 0, W, H);
    var li = (this.layer - 1) % 3 + 1, bg = img["tile_" + li] && img["tile_" + li].width ? img["tile_" + li] : img["bg" + li];
    if (bg && bg.width) { // 侧边：同图放大虚化
      g.globalAlpha = 0.35; var bs = Math.max(W / bg.width, H / bg.height); g.drawImage(bg, (W - bg.width * bs) / 2, (H - bg.height * bs) / 2, bg.width * bs, bg.height * bs); g.globalAlpha = 1;
    }
    g.setTransform(sc, 0, 0, sc, ox, oy); g.save(); g.beginPath(); g.rect(0, 0, FW, FH); g.clip();
    /* 分层视差：地面 = 竖向周期图（tools/shmup_tiles.py 周期化，首尾行像素连续，直接平铺、不镜像）；
       天空层 = 月亮精灵，全程只出现一次、以 1/20 的速度缓慢漂移（远景）。 */
    if (bg && bg.width) { var th = FW / bg.width * bg.height, y0 = this.bgY % th; for (var k = -1; k * th + y0 < FH; k++) g.drawImage(bg, 0, Math.floor(y0 + k * th), FW, Math.ceil(th) + 1); }
    var moon = img.moon; if (moon && moon.width && li !== 2) { var ms = 210, my = -40 + Math.min(FH * 0.5, this.bgY * 0.05); g.globalAlpha = 0.85; g.drawImage(moon, FW * 0.68 - ms / 2, my, ms, ms); g.globalAlpha = 1; }
    else { g.fillStyle = "#120c22"; g.fillRect(0, 0, FW, FH); }
    g.fillStyle = "rgba(6,4,14,.28)"; g.fillRect(0, 0, FW, FH);
    var spr = function (name, x, y, s, flash) { var im = img[name]; if (!im || !im.width) { g.fillStyle = "#c66"; g.beginPath(); g.arc(x, y, s / 3, 0, 7); g.fill(); return; } var w = s, h = s * im.height / im.width; g.drawImage(im, x - w / 2, y - h / 2, w, h); if (flash > 0) { g.globalAlpha = 0.45; g.globalCompositeOperation = "lighter"; g.drawImage(im, x - w / 2, y - h / 2, w, h); g.globalCompositeOperation = "source-over"; g.globalAlpha = 1; } };
    this.picks.forEach(function (p) { spr("pick_" + p.k, p.x, p.y, 34); });
    this.E.forEach(function (e) { spr(e.spr, e.x, e.y, e.size, e.flash); });
    var B = this.boss; if (B) { spr(B.spr, B.x, B.y, B.size, B.flash); if (B.brk > 0) { g.strokeStyle = "rgba(255,230,163," + (0.5 + 0.3 * Math.sin(t * 8)) + ")"; g.lineWidth = 4; g.beginPath(); g.arc(B.x, B.y, B.r + 20, 0, 7); g.stroke(); } }
    // 我方弹
    var tint = this.form.tint || ({ sayo: "#ff8fc0", aya: "#8fd0ff", rion: "#ff5a6e" })[this.cid], core = this.form.core || "#fff4fa";
    g.globalCompositeOperation = "lighter";
    this.S.forEach(function (s) { if (s.slash) { g.fillStyle = tint; g.globalAlpha = 0.55; g.beginPath(); g.ellipse(s.x, s.y, (s.w || 30) / 2, 9, 0, Math.PI, 0); g.fill(); g.globalAlpha = 1; g.fillStyle = core; g.fillRect(s.x - (s.w || 30) / 2 + 4, s.y - 2, (s.w || 30) - 8, 3); } else { g.fillStyle = tint; g.globalAlpha = 0.45; g.beginPath(); g.ellipse(s.x, s.y, 5, 14, 0, 0, 7); g.fill(); g.globalAlpha = 1; g.fillStyle = core; g.beginPath(); g.ellipse(s.x, s.y, 2.4, 8, 0, 0, 7); g.fill(); } });
    if (P.beamOn) { var gr = g.createLinearGradient(P.x - 10, 0, P.x + 10, 0); gr.addColorStop(0, "transparent"); gr.addColorStop(0.5, tint); gr.addColorStop(1, "transparent"); g.globalAlpha = 0.5; g.fillStyle = gr; g.fillRect(P.x - 10, 0, 20, P.y - 30); g.globalAlpha = 1; }
    g.globalCompositeOperation = "source-over";
    // 敌弹（高对比：紫边白芯）
    this.B.forEach(function (b) { g.fillStyle = b.ref ? "#7fd8ff" : b.big ? "#c04cff" : "#ff4f9a"; g.beginPath(); g.arc(b.x, b.y, b.r + 2, 0, 7); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(b.x, b.y, b.r - 2, 0, 7); g.fill(); });
    // 机体
    var ob = this.lv("orbit"); for (i = 0; i < (ob ? Math.min(4, 1 + ob) : 0); i++) { var oa = t * 3 + i * Math.PI * 2 / Math.min(4, 1 + ob); g.fillStyle = tint; g.beginPath(); g.arc(P.x + Math.cos(oa) * 54, P.y + Math.sin(oa) * 54, 8, 0, 7); g.fill(); }
    if (this.cid === "aya" && this.form.slot === "burst") { var w = this.wing(); spr("wingman_aya", w.x, w.y, 46); }
    var aw = t < P.awakenUntil, blink = P.inv > 0 && !aw && Math.floor(t * 6) % 2; // 无敌闪烁 6Hz → 3 次/秒
    if (this.form.tint || aw) { var rg = g.createRadialGradient(P.x, P.y, 6, P.x, P.y, 70); rg.addColorStop(0, (aw ? "#ffd76a" : tint) + "88"); rg.addColorStop(1, "transparent"); g.fillStyle = rg; g.fillRect(P.x - 70, P.y - 70, 140, 140); }
    g.globalAlpha = blink ? 0.45 : 1; spr("ship_" + this.cid, P.x, P.y, 92); g.globalAlpha = 1;
    if (this.form.slot === "guard") { g.strokeStyle = "#9fe6ff"; g.lineWidth = 5; g.globalAlpha = 0.85; g.beginPath(); g.arc(P.x, P.y + 10, 52, -Math.PI * 0.78, -Math.PI * 0.22); g.stroke(); g.globalAlpha = 1; }
    if (P.charge > 0.2) { g.strokeStyle = "#ff5a6e"; g.lineWidth = 3; g.beginPath(); g.arc(P.x, P.y, 36, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, P.charge / 1.2)); g.stroke(); }
    g.fillStyle = "#fff"; g.beginPath(); g.arc(P.x, P.y, P.r, 0, 7); g.fill(); g.strokeStyle = tint; g.lineWidth = 2; g.stroke();
    this.FX.forEach(function (f) { var k = f.t / f.life; g.strokeStyle = f.col; g.globalAlpha = (f.big ? 0.35 : 0.6) * (1 - k); g.lineWidth = f.big ? 16 : 4; g.beginPath(); g.arc(f.x, f.y, f.r + (f.big ? 700 : 60) * k, 0, 7); g.stroke(); g.globalAlpha = 1; });
    g.restore();
  };
  Game.prototype.snapshot = function () { var b = this.boss; return { t: +this.t.toFixed(2), step: this.step_, stage: (this.cur() || {}), hp: +this.P.hp.toFixed(3), bombs: this.P.bombs, shield: this.P.shield, kills: this.kills, enemies: this.E.length, bullets: this.B.length, shots: this.S.length, boss: b ? { name: b.name, hp: Math.round(b.hp), max: b.max, phase: b.phase, brk: b.brk > 0, elite: b.elite } : null, gauge: Math.round(this.P.gauge), awaken: this.t < this.P.awakenUntil, pause: this.pause, done: this.done, win: this.win, form: this.form.slot || "base", ch: this.cid, power: +this.power.toFixed(2), x: Math.round(this.P.x), y: Math.round(this.P.y), heat: Math.round(this.P.heat), graze: this.P.graze }; };

  /* —— DOM 外壳 —— */
  var ART = ["tile_1", "tile_2", "tile_3", "moon", "bg1", "bg2", "bg3", "boss1", "boss2", "boss3", "ship_sayo", "ship_aya", "ship_rion", "wingman_aya", "pick_coin", "pick_heal"];
  ["a", "b"].forEach(function (s) { for (var i = 0; i < 6; i++) ART.push("enemy_" + s + i); });
  var CSS = "#shm46{position:fixed;inset:0;z-index:125;background:#07050d;touch-action:none;user-select:none;font-family:inherit;color:#fff}#shm46 canvas{position:absolute;inset:0;width:100%;height:100%}#shm46 .hud{position:absolute;left:50%;transform:translateX(-50%);top:max(8px,env(safe-area-inset-top));width:min(94vw,56.25vh);display:flex;gap:8px;align-items:center;pointer-events:none;font-size:12px}#shm46 .hp{flex:1;height:10px;border-radius:6px;background:#2a1830;overflow:hidden;border:1px solid #ffffff33}#shm46 .hp i{display:block;height:100%;background:linear-gradient(90deg,#ff5f9e,#ffb2d4);width:calc(var(--v)*100%)}#shm46 .bossbar{position:absolute;left:50%;transform:translateX(-50%);top:calc(max(8px,env(safe-area-inset-top)) + 22px);width:min(90vw,54vh);text-align:center;font-size:12px;pointer-events:none}#shm46 .bossbar div{height:8px;border-radius:5px;background:#2a1830;overflow:hidden;margin-top:2px}#shm46 .bossbar i{display:block;height:100%;width:calc(var(--v)*100%);background:linear-gradient(90deg,#ffd76a,#ff6a3d)}#shm46 .bossbar.brk b:after{content:' · 破防！伤害×1.5';color:#ffe6a3}#shm46 .btns{position:absolute;right:max(14px,env(safe-area-inset-right));bottom:max(18px,env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:10px}#shm46 .btns button{width:66px;height:66px;border-radius:50%;border:2px solid #ffffff44;background:#1a1230cc;color:#fff;font-size:13px;font-weight:700}#shm46 .btns button.ready{border-color:#ffd76a;box-shadow:0 0 16px #ffd76a}#shm46 .btns button.off{opacity:.35}#shm46 .pick,#shm46 .res{position:absolute;inset:0;display:grid;place-items:center;background:#06040ccc}#shm46 .pick .box,#shm46 .res .box{width:min(92vw,560px);text-align:center}#shm46 .pick .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}#shm46 .pick button{padding:14px 8px;border-radius:14px;border:2px solid #ffb2d466;background:#1a1230;color:#fff}#shm46 .pick button b{display:block;font-size:15px}#shm46 .pick button span{font-size:11px;color:#cfc4dc}#shm46 .res button{margin-top:14px;padding:12px 26px;border-radius:999px;border:0;background:#ff5f9e;color:#fff;font-size:15px}#shm46 .tip{position:absolute;bottom:max(14px,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);font-size:11px;color:#ffffffaa;pointer-events:none}";
  var cur = null, raf = 0;
  function start(o) {
    stop(); o = o || {};
    if (!document.getElementById("shm46css")) { var st = document.createElement("style"); st.id = "shm46css"; st.textContent = CSS; document.head.appendChild(st); }
    var root = document.createElement("div"); root.id = "shm46";
    root.innerHTML = '<canvas></canvas><div class="hud"><b class="nm"></b><div class="hp"><i></i></div><span class="sc"></span></div><div class="bossbar" hidden><b></b><div><i></i></div></div><div class="btns"><button class="aw" hidden>觉醒<br><small>F</small></button><button class="bm">炸弹<br><small class="n"></small></button></div><div class="tip">拖动任意位置移动 · 自动射击 · X 炸弹</div>';
    (o.parent || document.body).appendChild(root);
    var cv = root.querySelector("canvas"), g = cv.getContext("2d"), img = {};
    ART.forEach(function (k) { var i = new Image(); i.src = o.art ? o.art("shmup/" + k + ".webp") : "art/shmup/" + k + ".webp"; img[k] = i; });
    var game = new Game(Object.assign({}, o, {
      onPick: function (opts) { if (o.auto) { Promise.resolve().then(function () { game.choose(opts[0].k); }); return; } var el = document.createElement("div"); el.className = "pick"; el.innerHTML = '<div class="box"><small>镜空 · 段间补给</small><h3>三选一</h3><div class="cards">' + opts.map(function (q) { return '<button data-k="' + q.k + '"><b>' + q.n + "</b><span>" + q.d + "</span></button>"; }).join("") + "</div></div>"; root.appendChild(el); el.onclick = function (e) { var b = e.target.closest("[data-k]"); if (!b) return; el.remove(); game.choose(b.dataset.k); }; if (game.auto) setTimeout(function () { if (el.parentNode) { el.remove(); game.choose("power"); } }, 600); },
      onEnd: function (r) { var el = document.createElement("div"); el.className = "res"; el.innerHTML = '<div class="box"><h2>' + (r.win ? "镜空突破" : "坠机") + "</h2><p>用时 " + r.time + " s · 击坠 " + r.kills + " · 受击 " + r.hits + " · 擦弹 " + r.grazes + '</p><button class="ok">' + (o.okText || "继续") + "</button></div>"; root.appendChild(el); el.querySelector(".ok").onclick = function () { stop(); o.onClose && o.onClose(r); }; o.onEnd && o.onEnd(r); }
    }));
    game.auto = !!o.auto; game.root = root; cur = game;
    root.querySelector(".nm").textContent = (CH[game.cid] || {}).name + (o.form && o.form.name ? " · " + o.form.name : "");
    root.querySelector(".bm").onclick = function () { game.bomb(); }; root.querySelector(".aw").onclick = function () { game.awaken(); };
    var last = null;
    root.addEventListener("pointerdown", function (e) { if (e.target.closest("button")) return; last = [e.clientX, e.clientY]; });
    root.addEventListener("pointermove", function (e) { if (!last) return; var r = cv.getBoundingClientRect(), sc = Math.min(r.width / FW, r.height / FH) || 1; game.dragD = [(game.dragD ? game.dragD[0] : 0) + (e.clientX - last[0]) * 1.2 / sc, (game.dragD ? game.dragD[1] : 0) + (e.clientY - last[1]) * 1.2 / sc]; last = [e.clientX, e.clientY]; });
    var up = function () { last = null; }; root.addEventListener("pointerup", up); root.addEventListener("pointercancel", up);
    game.kd = function (e) { game.keys[e.key] = 1; if (e.key === "x" || e.key === "X" || e.key === " ") game.bomb(); if (e.key === "f" || e.key === "F") game.awaken(); };
    game.ku = function (e) { game.keys[e.key] = 0; };
    addEventListener("keydown", game.kd); addEventListener("keyup", game.ku);
    var paint = function () {
      var dpr = Math.min(global.devicePixelRatio || 1, 2), W = Math.round(cv.clientWidth * dpr), H = Math.round(cv.clientHeight * dpr); if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
      game.draw(g, img, W, H); var s = game.snapshot();
      root.querySelector(".hp").style.setProperty("--v", s.hp / game.hpMax()); root.querySelector(".sc").textContent = "💠 " + game.score;
      root.querySelector(".bm .n").textContent = "×" + s.bombs; root.querySelector(".bm").classList.toggle("off", !s.bombs);
      var bb = root.querySelector(".bossbar"); bb.hidden = !s.boss; if (s.boss) { bb.querySelector("b").textContent = s.boss.name + (s.boss.elite ? "" : " · 第 " + s.boss.phase + " 阶段"); bb.style.setProperty("--v", Math.max(0, s.boss.hp / s.boss.max)); bb.classList.toggle("brk", s.boss.brk); }
      var aw = root.querySelector(".aw"); aw.hidden = !(s.boss && !s.boss.elite && s.boss.phase >= 3) && !s.awaken; aw.classList.toggle("ready", game.canAwaken());
    };
    game.paint = paint; var t0 = performance.now();
    var loop = function (now) { raf = requestAnimationFrame(loop); var dt = Math.min(0.05, (now - t0) / 1000); t0 = now; if (global.__shmManual) return; game.update(dt); paint(); };
    raf = requestAnimationFrame(loop); return game;
  }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; if (cur) { removeEventListener("keydown", cur.kd); removeEventListener("keyup", cur.ku); cur.root && cur.root.remove(); } cur = null; }
  /* 无 DOM 的整局模拟（平衡诊断 / 单元测试）。 */
  function simulate(o, maxT) { var g = new Game(Object.assign({}, o, { onPick: function () { setTimeout0(function () { g.choose("power"); }); } })); var q = []; function setTimeout0(f) { q.push(f); } g.auto = true; for (var t = 0; t < (maxT || 400) && !g.done; t += 1 / 60) { g.update(1 / 60); while (q.length) q.shift()(); } return Object.assign(g.result(), { done: g.done, snapshot: g.snapshot() }); }
  global.SakurayoShmup = { Game: Game, start: start, stop: stop, simulate: simulate, current: function () { return cur; }, step: function (dt) { if (cur) { cur.update(dt); cur.paint(); } }, FW: FW, FH: FH, CH: CH };
})(typeof window !== "undefined" ? window : globalThis);
