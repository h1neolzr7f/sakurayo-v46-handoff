/* SakurayoShmup：镜空 · 弹幕射击（东方 Project 式，角色本人飞行）。
   - 独立模块：自带画布/循环/输入/HUD；只通过 start(opts) / onEnd(result) 与夜行地图交互（夜行“镜空”节点 + Boss 战三选一里的「弹幕射击」）。
   - 核心规则：
       低速（Shift / 按住「低速」键 / 双指按住）：移动变慢、显示判定点（红白小点 + 旋转法阵），射击收束为高伤害集中型；
       判定点只有 3px（speed 形态 2px），子弹贴图远大于判定 → 擦弹（弹幕擦过判定外 22px）加分、充能 P 点与符卡槽；
       Bomb（X / 「符卡」键）= 角色专属符卡：无敌 + 消弹 + 伤害；被弹后 0.15 s 内仍可放 Bomb 抵消（决死）；
       残机制：被弹失去 1 残机并掉落部分 P 点；残机耗尽 = 失败。开局残机由带入的生命比例换算；
       Boss = 非符 / 符卡交替，每张符卡有名字、时限、独立几何弹幕；无被弹无 Bomb 击破 = 符卡收取（Spell Card Bonus）。超时也算突破（无奖励）。
   - 三角色射击方式：
       小夜「樱吹雪」：高速扩散针弹 → 低速收束三连针（中等 DPS、覆盖面最好）；符卡「樱符『千本樱吹雪』」
       绫「双枪 · 追踪札」：前向双枪 + 追踪符札 → 低速贯穿细针（单体最高）；符卡「镜符『双生连射』」
       凛音「剑气」：近距离宽幅剑气（贴脸伤害最高）→ 低速前向贯穿剑光（激光型）；符卡「剑符『千夜一闪』」
   - 构筑映射：spread=+副弹道 / homing=追踪札子机 / laser=低速剑光·激光 / orbit=式神子机（高速展开、低速收拢）/ pierce=贯穿 / bomb=Bomb +1 与符卡伤害；
     路线：科技线 = 子机 +1、低速伤害 +15%（机关式神，青色）；生物线 = 擦弹回复残机碎片、被弹掉落 P 更少（血藤，红色）。
     形态：guard=+1 残机、移速 0.9；speed=判定 2px、擦弹范围 +6、擦弹 40 次 +1 Bomb；burst=伤害 ×1.3、残机 -1；觉醒 = 符卡槽满时 Boss 最终符卡 10 秒无敌强化。
   - 闪烁安全：Bomb/击破用扩散环（峰值透明度 ≤ .35），无全屏白闪。 */
(function (global) {
  "use strict";
  var FW = 540, FH = 960, TAU = Math.PI * 2;
  function rng(seed) { var s = (seed >>> 0) || 7; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  var CH = {
    sayo: { name: "月城小夜", spd: 380, slow: 160, dmg: 3.5, card: "樱符「千本樱吹雪」", col: "#ff8fc0" },
    aya: { name: "神代绫", spd: 365, slow: 155, dmg: 3.6, card: "镜符「双生连射」", col: "#8fd0ff" },
    rion: { name: "黑羽凛音", spd: 350, slow: 150, dmg: 3.8, card: "剑符「千夜一闪」", col: "#ff5a6e" }
  };
  var ETYPE = {
    fairy: { hp: 9, r: 22, spr: ["enemy_a0", "enemy_b0"], size: 60, score: 1 },
    fairy2: { hp: 20, r: 24, spr: ["enemy_a2", "enemy_b2"], size: 70, score: 2 },
    gunner: { hp: 46, r: 30, spr: ["enemy_a1", "enemy_b1"], size: 86, score: 4 },
    spinner: { hp: 70, r: 34, spr: ["enemy_a5", "enemy_b5"], size: 96, score: 5 },
    big: { hp: 150, r: 42, spr: ["enemy_a3", "enemy_b3", "enemy_a4", "enemy_b4"], size: 118, score: 8 }
  };
  /* 弹型：hit = 判定半径（远小于贴图），vis = 贴图半径 */
  var BT = { rice: { hit: 3.2, vis: 8 }, orb: { hit: 4.2, vis: 8 }, big: { hit: 10, vis: 18 }, amulet: { hit: 3.5, vis: 9 }, star: { hit: 4, vis: 9 }, knife: { hit: 3, vis: 11 } };
  /* Boss 符卡表：p = 弹幕编号，t = 时限 */
  var BOSS = {
    1: { name: "百目神舆姬", spr: "boss_girl_1", alt: "boss1", cards: [{ non: 1, p: "aimFan", hp: 1, t: 26 }, { n: "眼符「百目回廊」", p: "eyeRose", hp: 1.2, t: 34 }, { non: 1, p: "ringAim", hp: 1, t: 26 }, { n: "舆符「神轿巡游」", p: "spiral2", hp: 1.25, t: 36 }, { n: "「千目之夜」", p: "eyeFinal", hp: 1.4, t: 40, last: 1 }] },
    2: { name: "唐伞雨姬", spr: "boss_girl_2", alt: "boss2", cards: [{ non: 1, p: "rainNon", hp: 1, t: 26 }, { n: "雨符「骤雨回旋伞」", p: "umbrella", hp: 1.2, t: 34 }, { non: 1, p: "aimFan", hp: 1, t: 26 }, { n: "伞符「破伞返雨」", p: "rainReturn", hp: 1.25, t: 36 }, { n: "「百鬼夜雨」", p: "rainFinal", hp: 1.4, t: 40, last: 1 }] },
    3: { name: "黄泉门守", spr: "boss_girl_3", alt: "boss3", cards: [{ non: 1, p: "ringAim", hp: 1, t: 26 }, { n: "门符「千本鸟居」", p: "torii", hp: 1.2, t: 34 }, { non: 1, p: "spiral2", hp: 1, t: 26 }, { n: "冥符「黄泉比良坂」", p: "lattice", hp: 1.25, t: 36 }, { n: "「常夜之门」", p: "yomiFinal", hp: 1.45, t: 42, last: 1 }] },
    mid: { name: "镜卫", spr: "boss3", alt: "boss3", cards: [{ non: 1, p: "aimFan", hp: 1, t: 22 }, { n: "镜符「合わせ鏡」", p: "mirror", hp: 1.1, t: 30 }] }
  };
  function Game(o) {
    this.o = o; this.r = rng(o.seed || 1); this.t = 0; this.done = false;
    var c = CH[o.character] || CH.sayo; this.ch = c; this.cid = CH[o.character] ? o.character : "sayo";
    var f = o.form || {}; this.form = f; var slot = f.slot || "base"; this.slot = slot;
    var up = o.weapons || {}, lv = function (k) { return up[k] ? (up[k].lv || 1) + (up[k].evo ? 2 : 0) : 0; };
    this.lv = lv; this.route = o.route === "bio" ? "bio" : o.route === "tech" ? "tech" : null;
    this.pw = clamp(o.power || 1, 0.7, 2.6) * (slot === "burst" ? 1.3 : 1);
    var hp0 = clamp(o.hpFrac == null ? 1 : o.hpFrac, 0.05, 1); this.hp0 = hp0;
    var lives = Math.max(1, Math.ceil(hp0 * 3)) + (slot === "guard" ? 1 : 0) - (slot === "burst" ? 1 : 0) + (lv("orbit") >= 5 ? 0 : 0);
    lives = Math.max(1, lives); this.lives0 = lives;
    this.P = { x: FW / 2, y: FH - 140, hit: slot === "speed" ? 2 : 3, gr: slot === "speed" ? 28 : 22, spd: c.spd * (slot === "guard" ? 0.9 : 1), slow: c.slow,
      lives: lives, bombs: 2 + (lv("bomb") ? 1 : 0), power: 1 + Math.min(1.5, (o.power || 1) - 1) + 0.25 * Math.min(4, lv("spread") + lv("homing")) / 2, inv: 2, cd: 0, cd2: 0, focus: false,
      graze: 0, gauge: 0, hits: 0, bombsUsed: 0, deathT: -1, bombT: 0, frag: 0, awakenUntil: -1, moving: 0 };
    this.P.power = clamp(this.P.power, 1, 4);
    this.E = []; this.B = []; this.S = []; this.FX = []; this.items = []; this.kills = 0; this.score = 0; this.boss = null; this.caps = 0; this.cardsSeen = 0;
    this.kind = o.kind || "node"; this.layer = o.layer || 1;
    this.plan = this.kind === "boss" ? [{ seg: 16 }, { boss: 1 }] : [{ seg: 22 }, { pick: 1 }, { seg: 18 }, { mid: 1 }];
    this.step_ = 0; this.segT = 0; this.spawnT = 0.8; this.pause = false; this.keys = {}; this.bgY = 0; this.banner = null;
  }
  Game.prototype.cur = function () { return this.plan[this.step_] || null; };
  Game.prototype.next = function () {
    this.step_++; this.segT = 0; var s = this.cur();
    if (!s) return this.end(true);
    if (s.pick) { this.pause = true; this.o.onPick && this.o.onPick(this.pickOptions()); }
    if (s.mid) this.spawnBoss("mid");
    if (s.boss) this.spawnBoss(String(((this.layer - 1) % 3) + 1));
  };
  Game.prototype.pickOptions = function () { return [{ k: "power", n: "P 点结晶", d: "火力等级 +1" }, { k: "bomb", n: "符卡札", d: "Bomb +1" }, { k: "life", n: "残机碎片", d: "残机 +1" }]; };
  Game.prototype.choose = function (k) { var P = this.P; if (k === "power") P.power = Math.min(4, P.power + 1); else if (k === "bomb") P.bombs = Math.min(6, P.bombs + 1); else P.lives = Math.min(8, P.lives + 1); this.pause = false; this.next(); };
  Game.prototype.spawn = function (type, x, y, mv, pat) {
    var T = ETYPE[type], hpMul = 1 + 0.35 * (this.layer - 1);
    var e = { type: type, x: x, y: y, r: T.r, hp: T.hp * hpMul, max: T.hp * hpMul, spr: T.spr[Math.floor(this.r() * T.spr.length)], size: T.size, t: 0, mv: mv || "down", fire: 0.7 + this.r() * 0.6, flash: 0, x0: x, pat: pat || "aim" };
    this.E.push(e); return e;
  };
  Game.prototype.wave = function () {
    var r = this.r, k = r(), d = Math.min(1, this.segT / 18), i, x;
    if (k < 0.3) { x = 80 + r() * (FW - 160); var n = 5 + Math.floor(d * 3), side = r() < 0.5 ? -1 : 1; for (i = 0; i < n; i++) this.spawn("fairy", x, -30 - i * 40, side < 0 ? "curveL" : "curveR", "aim"); }
    else if (k < 0.55) { for (i = 0; i < 5; i++) this.spawn("fairy2", FW / 2 + (i - 2) * 92, -40 - Math.abs(i - 2) * 40, "sine", i % 2 ? "ring" : "aim"); }
    else if (k < 0.78) { this.spawn("gunner", 110 + r() * (FW - 220), -50, "hold", "fan"); if (d > 0.4) this.spawn("gunner", 110 + r() * (FW - 220), -140, "hold", "fan"); }
    else if (k < 0.92) this.spawn("spinner", r() < 0.5 ? 120 : FW - 120, -60, "hold", "spin");
    else this.spawn("big", FW / 2, -80, "hold", "flower");
    this.spawnT = 2.0 - 0.6 * d;
  };
  Game.prototype.spawnBoss = function (key) {
    var D = BOSS[key], L = this.layer, base = key === "mid" ? 1500 + 500 * L : 2000 + 880 * L;
    this.boss = { key: key, mid: key === "mid", name: D.name, spr: D.spr, alt: D.alt, x: FW / 2, y: -140, ty: 200, r: key === "mid" ? 60 : 56, size: key === "mid" ? 260 : 250, cards: D.cards, ci: -1, base: base, t: 0, pt: 0, flash: 0, ang: 0 };
    this.nextCard();
    this.o.onBoss && this.o.onBoss(this.boss);
  };
  Game.prototype.nextCard = function () {
    var b = this.boss; b.ci++; this.B.forEach(function (q) { q.dead = 1; q.toPt = 1; });
    var c = b.cards[b.ci]; if (!c) { this.ring(b.x, b.y, 220, "#fff3c4"); this.score += b.mid ? 40 : 100; this.boss = null; this.banner = null; this.next(); return; }
    b.card = c; if (!c.non) this.cut = { k: "cut_" + b.spr.replace("boss_girl_", "boss"), at: this.t }; b.hp = b.max = b.base * c.hp; b.ct = c.t; b.cardT = 0; b.pt = 1.2; b.capOk = !c.non; b.ang = 0; b.tx = FW / 2;
    if (!c.non) { this.cardsSeen++; this.banner = { n: c.n, t: 0 }; this.o.onPhase && this.o.onPhase(b.ci, c.n); }
  };
  Game.prototype.cardDone = function (timeout) {
    var b = this.boss, c = b.card; if (!c.non && b.capOk && !timeout) { this.caps++; this.score += 30; this.banner = { n: "符卡收取！ " + c.n, t: 0, cap: 1 }; }
    this.ring(b.x, b.y, 140, "#ffe6a3"); this.drop(b.x, b.y, 6, "p"); this.nextCard();
  };
  /* —— 敌弹 —— */
  Game.prototype.eb = function (x, y, a, v, ty, col, o) { var T = BT[ty || "rice"], q = { x: x, y: y, a: a, v: v, vx: Math.cos(a) * v, vy: Math.sin(a) * v, ty: ty || "rice", r: T.hit, vis: T.vis, col: col || "#ff4f9a", g: 0, t: 0 }; if (o) for (var k in o) q[k] = o[k]; this.B.push(q); return q; };
  Game.prototype.aim = function (x, y) { return Math.atan2(this.P.y - y, this.P.x - x); };
  Game.prototype.ringShot = function (x, y, n, a0, v, ty, col, o) { for (var i = 0; i < n; i++) this.eb(x, y, a0 + i * TAU / n, v, ty, col, o); };
  var SLOW = 1.0; // 弹速整体系数（平衡用）
  Game.prototype.pattern = function (b, dt) {
    b.pt -= dt; if (b.pt > 0) return;
    var p = b.card.p, t = b.cardT, L = this.layer, a, i, k, x, dens = 1.15 + 0.2 * L, v = SLOW;
    switch (p) {
      case "aimFan": a = this.aim(b.x, b.y); for (i = -3; i <= 3; i++) this.eb(b.x, b.y, a + i * 0.16, 230 * v, "rice", "#ff5fa2"); if ((b.n = (b.n || 0) + 1) % 3 === 0) this.ringShot(b.x, b.y, Math.round(16 * dens), t, 150 * v, "orb", "#a46bff"); b.pt = 0.55; break;
      case "ringAim": this.ringShot(b.x, b.y, Math.round(20 * dens), this.aim(b.x, b.y) + Math.PI / 20, 190 * v, "orb", "#5fb4ff"); b.pt = 0.7; break;
      case "eyeRose": for (k = 0; k < 2; k++) { var n = Math.round(9 * dens); for (i = 0; i < n; i++) { a = b.ang * (k ? -1 : 1) + i * TAU / n; this.eb(b.x, b.y, a, 150 * v, "rice", k ? "#ffd166" : "#ff7f50", { turn: (k ? -0.35 : 0.35) }); } } b.ang += 0.21; b.pt = 0.2; break;
      case "spiral2": for (k = 0; k < 4; k++) this.eb(b.x, b.y, b.ang + k * TAU / 4, 175 * v, "amulet", "#7af0c0"); for (k = 0; k < 4; k++) this.eb(b.x, b.y, -b.ang * 1.3 + k * TAU / 4, 140 * v, "orb", "#ff6ad5"); b.ang += 0.17; b.pt = 0.075; break;
      case "eyeFinal": this.ringShot(b.x, b.y, Math.round(24 * dens), b.ang, 120 * v, "big", "#ffcf4a", { acc: 18 }); a = this.aim(b.x, b.y); for (i = -1; i <= 1; i++) this.eb(b.x, b.y, a + i * 0.05, 300 * v, "knife", "#ff3b5c"); b.ang += 0.13; b.pt = 0.8; break;
      case "rainNon": for (i = 0; i < Math.round(5 * dens); i++) this.eb(20 + this.r() * (FW - 40), -10, Math.PI / 2 + (this.r() - 0.5) * 0.3, (130 + this.r() * 80) * v, "rice", "#6fc3ff"); if ((b.n = (b.n || 0) + 1) % 8 === 0) { a = this.aim(b.x, b.y); for (i = -2; i <= 2; i++) this.eb(b.x, b.y, a + i * 0.2, 210 * v, "orb", "#3a7bff"); } b.pt = 0.12; break;
      case "umbrella": for (k = 0; k < 3; k++) { var a0 = b.ang + k * TAU / 3; for (i = 0; i < 5; i++) this.eb(b.x, b.y, a0 + i * 0.07, (110 + i * 22) * v, "rice", "#58d1ff"); } b.ang += 0.36; b.pt = 0.24; break;
      case "rainReturn": this.ringShot(b.x, b.y, Math.round(18 * dens), b.ang, 200 * v, "orb", "#9fe2ff", { stopAt: 0.7, reaim: 1, rv: 170 * v }); b.ang += 0.17; b.pt = 0.9; break;
      case "rainFinal": for (i = 0; i < Math.round(4 * dens); i++) this.eb(20 + this.r() * (FW - 40), -10, Math.PI / 2, (110 + this.r() * 70) * v, "rice", "#6fc3ff", { wob: 1 }); if ((b.n = (b.n || 0) + 1) % 6 === 0) this.ringShot(b.x, b.y, Math.round(16 * dens), b.ang += 0.3, 150 * v, "big", "#2f6bff"); b.pt = 0.13; break;
      case "torii": var gap = FW / 2 + Math.sin(t * 0.8) * (FW / 2 - 110); for (x = 16; x < FW; x += 26) if (Math.abs(x - gap) > 66) this.eb(x, b.y - 20, Math.PI / 2, 150 * v, "amulet", "#ff3b3b"); a = this.aim(b.x, b.y); for (i = -2; i <= 2; i++) this.eb(b.x, b.y, a + i * 0.09, 240 * v, "knife", "#ffffff"); for (k = -1; k <= 1; k += 2) for (i = 0; i < 4; i++) this.eb(b.x + k * 60, b.y, Math.PI / 2 + k * (0.5 + i * 0.25), 160 * v, "rice", "#ff9a3b", { turn: -k * 0.5 }); b.pt = 0.95; break;
      case "lattice": for (k = 0; k < 2; k++) for (i = 0; i < 6; i++) { var sx = k ? FW + 5 : -5, sy = 80 + i * 70 + (t * 40 % 70); this.eb(sx, sy, k ? Math.PI * 0.82 : Math.PI * 0.18, 120 * v, "rice", k ? "#c86bff" : "#ff6bd0"); } b.pt = 1.0; this.ringShot(b.x, b.y, 10, this.aim(b.x, b.y), 170 * v, "orb", "#ff3b5c"); break;
      case "yomiFinal": for (k = 0; k < 3; k++) this.eb(b.x, b.y, b.ang + k * TAU / 3, 160 * v, "big", "#ff2a4a"); for (k = 0; k < 3; k++) this.eb(b.x, b.y, -b.ang + k * TAU / 3 + 0.5, 190 * v, "rice", "#ffffff", { turn: 0.25 }); b.ang += 0.19; b.pt = 0.11; if (Math.floor(t * 2) % 7 === 0 && !b.tw) { b.tw = 1; this.ringShot(b.x, b.y, 28, 0, 110 * v, "star", "#ffd166"); } else if (Math.floor(t * 2) % 7) b.tw = 0; break;
      case "mirror": for (k = -1; k <= 1; k += 2) { x = FW / 2 + k * (FW / 2 - 40); this.eb(x, 120, this.aim(x, 120), 200 * v, "knife", "#cfe6ff"); } this.ringShot(b.x, b.y, 12, b.ang += 0.25, 150 * v, "orb", "#8fd0ff"); b.pt = 0.42; break;
    }
    b.pt *= (b.card.non ? 0.8 : 0.62) * (this.o.dens || 1); // 符卡更密
  };
  Game.prototype.enemyFire = function (e) {
    var a = this.aim(e.x, e.y), i;
    if (e.pat === "aim") { this.eb(e.x, e.y, a, 210 * SLOW, "rice", "#ff5fa2"); e.fire = 9; }
    else if (e.pat === "ring") { this.ringShot(e.x, e.y, 10, a, 150 * SLOW, "orb", "#a46bff"); e.fire = 9; }
    else if (e.pat === "fan") { for (i = -2; i <= 2; i++) this.eb(e.x, e.y, a + i * 0.18, 200 * SLOW, "rice", "#ff7f50"); e.fire = 1.6; }
    else if (e.pat === "spin") { for (i = 0; i < 6; i++) this.eb(e.x, e.y, e.t * 1.7 + i * TAU / 6, 140 * SLOW, "amulet", "#7af0c0"); e.fire = 0.3; }
    else { this.ringShot(e.x, e.y, 18, e.t, 120 * SLOW, "big", "#ff6ad5"); e.fire = 1.4; }
  };
  /* —— 我方火力 —— */
  Game.prototype.shot = function (x, y, a, v, dmg, o) { var s = { x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, dmg: dmg * this.pw, r: 8, pierce: this.lv("pierce") ? 1 + (this.lv("pierce") >> 1) : 0, life: 1.6, k: "n" }; if (o) for (var k in o) s[k] = o[k]; this.S.push(s); return s; };
  Game.prototype.options = function () { var n = Math.min(4, (this.lv("orbit") ? 1 + (this.lv("orbit") >> 1) : 0) + (this.route === "tech" ? 1 : 0)), P = this.P, out = []; for (var i = 0; i < n; i++) { var s = (i - (n - 1) / 2); out.push(P.focus ? { x: P.x + s * 22, y: P.y - 34 } : { x: P.x + s * 56, y: P.y + 10 - Math.abs(s) * 8 }); } return out; };
  Game.prototype.fire = function (dt) {
    var P = this.P, c = this.ch, U = -Math.PI / 2, pl = Math.floor(P.power), aw = this.t < P.awakenUntil, rate = aw ? 2 : 1, dm = c.dmg * (aw ? 1.6 : 1), i, n;
    var focusMul = P.focus ? (this.route === "tech" ? 1.15 : 1) : 1; if (this.route === "bio") dm *= 1.2; // 生物线：没有额外子机，本体弹 +20%
    P.cd -= dt * rate; P.cd2 -= dt * rate; if (P.cd > 0) return;
    P.cd = 1 / 20;
    if (this.cid === "sayo") {
      if (P.focus) { for (i = -1; i <= 1; i++) this.shot(P.x + i * 8, P.y - 24, U, 1300, dm * 1.3 * focusMul); if (pl >= 3) { this.shot(P.x - 18, P.y - 20, U - 0.03, 1300, dm * focusMul); this.shot(P.x + 18, P.y - 20, U + 0.03, 1300, dm * focusMul); } }
      else { n = 2 + pl + (this.lv("spread") ? 2 : 0); for (i = 0; i < n; i++) this.shot(P.x, P.y - 24, U + (i - (n - 1) / 2) * 0.13, 1150, dm * (0.85 + 0.12 * (this.cid === "sayo"))); }
    } else if (this.cid === "aya") {
      this.shot(P.x - 10, P.y - 24, U, 1250, dm * (P.focus ? 1.4 : 1.15) * focusMul); this.shot(P.x + 10, P.y - 24, U, 1250, dm * (P.focus ? 1.4 : 1.15) * focusMul);
      if (P.focus) { if (pl >= 2) { this.shot(P.x - 22, P.y - 18, U, 1300, dm * 1.1 * focusMul, { pierce: 2 }); this.shot(P.x + 22, P.y - 18, U, 1300, dm * 1.1 * focusMul, { pierce: 2 }); } }
      else if (P.cd2 <= 0) { n = 1 + pl + (this.lv("spread") ? 1 : 0); for (i = 0; i < n; i++) this.shot(P.x, P.y - 10, U + (i - (n - 1) / 2) * 0.5, 620, dm * 1.25, { home: 1, life: 2.4, k: "amulet" }); P.cd2 = 0.16; }
    } else {
      if (P.focus) { this.shot(P.x, P.y - 30, U, 1600, dm * (2.5 + 0.5 * pl) * focusMul, { pierce: 99, life: 0.6, k: "blade", w: 18 }); }
      else { n = 1 + pl + (this.lv("spread") ? 2 : 0); for (i = 0; i < n; i++) this.shot(P.x, P.y - 24, U + (i - (n - 1) / 2) * 0.22, 820, dm * 1.6, { life: 0.38, k: "slash", w: 34, pierce: 1 }); }
    }
    var self = this, hom = this.lv("homing");
    this.options().forEach(function (op, j) { if (hom && j % 2) self.shot(op.x, op.y, U, 600, dm * 0.8, { home: 1, life: 2.2, k: "amulet" }); else self.shot(op.x, op.y - 8, U, 1200, dm * 0.75 * focusMul); });
    if (this.lv("laser") && P.focus) P.beam = 1; else P.beam = 0;
  };
  Game.prototype.ring = function (x, y, r, col) { this.FX.push({ x: x, y: y, r: r, t: 0, life: 0.5, col: col || "#ffd1e6" }); };
  Game.prototype.drop = function (x, y, n, k) { for (var i = 0; i < n; i++) this.items.push({ x: x + (this.r() - 0.5) * 60, y: y + (this.r() - 0.5) * 30, vy: -120 - this.r() * 80, k: k || "p" }); };
  Game.prototype.bomb = function () {
    var P = this.P; if (P.bombs <= 0 || this.done || this.pause || P.bombT > 0) return false;
    P.bombs--; P.bombsUsed++; this.cut = { k: "cut_" + this.cid, at: this.t, me: 1 }; P.bombT = 3.2 + (this.lv("bomb") ? 0.6 : 0); P.inv = Math.max(P.inv, P.bombT + 0.4); if (P.deathT > 0) P.deathT = -1; // 决死
    if (this.boss) this.boss.capOk = false;
    this.B.forEach(function (b) { b.dead = 1; b.toPt = 1; }); this.FX.push({ x: P.x, y: P.y, r: 30, t: 0, life: 1, col: this.form.tint || this.ch.col, big: 1 });
    this.banner = { n: this.ch.card, t: 0, me: 1 }; this.o.onBomb && this.o.onBomb(); return true;
  };
  Game.prototype.bombTick = function (dt) {
    var P = this.P, self = this; if (P.bombT <= 0) return; P.bombT -= dt;
    var d = (60 + 18 * this.lv("bomb")) * this.pw * dt;
    this.B.forEach(function (b) { if (self.cid === "rion" ? Math.abs(b.y - (P.y - (3.2 - P.bombT) * 400)) < 60 : Math.hypot(b.x - P.x, b.y - P.y) < 80 + (3.2 - P.bombT) * 260) { b.dead = 1; b.toPt = 1; } });
    this.E.forEach(function (e) { e.hp -= d * 3; e.flash = 0.05; }); if (this.boss && this.boss.y > 60) this.hurtBoss(d * 2.2);
  };
  Game.prototype.canAwaken = function () { var b = this.boss; return !!(b && !b.mid && b.card && b.card.last && this.P.gauge >= 100 && this.t >= this.P.awakenUntil); };
  Game.prototype.awaken = function () { if (!this.canAwaken()) return false; this.P.gauge = 0; this.P.awakenUntil = this.t + 10; this.P.inv = 10; this.o.onAwaken && this.o.onAwaken(); return true; };
  Game.prototype.hurtBoss = function (d) {
    var b = this.boss; if (!b || b.y < 60) return; b.hp -= d; b.flash = 0.05; this.P.gauge = Math.min(100, this.P.gauge + d / b.max * 30);
    if (b.hp <= 0) this.cardDone(false);
  };
  Game.prototype.hitPlayer = function () {
    var P = this.P; if (P.inv > 0 || this.done || P.deathT > 0) return;
    P.deathT = 0.15; // 决死窗口
  };
  Game.prototype.die = function () {
    var P = this.P; P.deathT = -1; P.lives--; P.hits++; if (this.boss) this.boss.capOk = false; this.ring(P.x, P.y, 60, "#ff6a6a");
    var lost = this.route === "bio" ? 0.5 : 1; this.drop(P.x, P.y - 40, 4, "p"); P.power = Math.max(1, P.power - lost);
    this.B.forEach(function (b) { b.dead = 1; }); P.inv = 2.6; P.bombs = Math.max(P.bombs, 2);
    if (P.lives <= 0) { P.lives = 0; this.end(false); return; }
    P.x = FW / 2; P.y = FH - 120;
  };
  Game.prototype.end = function (win) { if (this.done) return; this.done = true; this.win = win; this.o.onEnd && this.o.onEnd(this.result()); };
  Game.prototype.result = function () { var P = this.P; return { win: !!this.win, hpFrac: this.win ? clamp(this.hp0 * (P.lives / this.lives0), 0.05, 1) : 0, lives: P.lives, time: +this.t.toFixed(1), hits: P.hits, bombs: P.bombsUsed, kills: this.kills, grazes: P.graze | 0, caps: this.caps, cards: this.cardsSeen, score: this.score }; };
  /* —— 输入 —— */
  Game.prototype.input = function (dt) {
    var P = this.P, k = this.keys, ax = 0, ay = 0;
    if (k.ArrowLeft || k.a || k.A) ax -= 1; if (k.ArrowRight || k.d || k.D) ax += 1; if (k.ArrowUp || k.w || k.W) ay -= 1; if (k.ArrowDown || k.s || k.S) ay += 1;
    var focus = !!(k.Shift || this.focusHold || this.touchFocus);
    var gp = global.navigator && navigator.getGamepads ? (navigator.getGamepads() || [])[0] : null;
    if (gp) { if (Math.abs(gp.axes[0]) > 0.2) ax = gp.axes[0]; if (Math.abs(gp.axes[1]) > 0.2) ay = gp.axes[1]; if (gp.buttons[0] && gp.buttons[0].pressed) this.bomb(); if (gp.buttons[3] && gp.buttons[3].pressed) this.awaken(); if (gp.buttons[5] && gp.buttons[5].pressed || gp.buttons[7] && gp.buttons[7].pressed) focus = true; }
    if (this.auto) { var a = this.autopilot(dt); ax = a[0]; ay = a[1]; focus = a[2]; }
    P.focus = focus; var sp = focus ? P.slow : P.spd, mx = 0, my = 0;
    if (ax || ay) { var l = Math.hypot(ax, ay); if (l > 1) { ax /= l; ay /= l; } mx = ax * sp * dt; my = ay * sp * dt; }
    if (this.dragD) { var dl = Math.hypot(this.dragD[0], this.dragD[1]), mxd = (focus ? P.slow : P.spd * 1.6) * dt; var f = dl > mxd ? mxd / dl : 1; mx += this.dragD[0] * f; my += this.dragD[1] * f; this.dragD = null; }
    P.moving = Math.hypot(mx, my) > 0.3 ? 1 : 0;
    P.x = clamp(P.x + mx, 16, FW - 16); P.y = clamp(P.y + my, 60, FH - 24);
  };
  /* 自动驾驶（测试/平衡/录像）：对 9 个方向 × 高/低速 预测 0.1–0.35 s 内的弹幕，选危险最小的走法；无路可走时放 Bomb。 */
  Game.prototype.autopilot = function (dt) {
    var sk = this.o.skill == null ? 1 : this.o.skill; // 1 = 完美反应；<1 = 模拟人类（反应延迟 + 偶尔判断失误），用于平衡
    if (sk < 1 && this.apNext > this.t && this.apLast) return this.apLast;
    var P = this.P, best = null, B = this.B, tg = this.boss || this.E.reduce(function (a, e) { return e.y > 0 && e.y < FH * 0.7 && (!a || e.y > a.y) ? e : a; }, null);
    var near = []; for (var i = 0; i < B.length; i++) { var q = B[i]; if (Math.abs(q.x - P.x) < 170 && Math.abs(q.y - P.y) < 170) near.push(q); }
    for (var f = 0; f < 2; f++) for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) {
      var l = Math.hypot(dx, dy) || 1, sp = f ? P.slow : P.spd, cost = 0;
      for (var st = 1; st <= 3; st++) { var tt = st * 0.1, x = clamp(P.x + dx / l * sp * tt, 16, FW - 16), y = clamp(P.y + dy / l * sp * tt, 60, FH - 24);
        for (var j = 0; j < near.length; j++) { var b = near[j], bx = b.x + b.vx * tt, by = b.y + b.vy * tt, dd = Math.hypot(bx - x, by - y) - b.r - P.hit; if (dd < 26) cost += (26 - dd) * (26 - dd) / (st === 1 ? 4 : st); }
        for (j = 0; j < this.E.length; j++) { var e = this.E[j]; if (Math.hypot(e.x - x, e.y - y) < e.r + 30) cost += 400; } }
      var fx = clamp(P.x + dx / l * sp * 0.2, 16, FW - 16), fy = clamp(P.y + dy / l * sp * 0.2, 60, FH - 24);
      cost += (tg ? Math.abs(fx - tg.x) * 0.05 : 0) + Math.abs(fy - (FH - 150)) * 0.025 + (fx < 40 || fx > FW - 40 ? 4 : 0) + (f ? 0 : 1.2) + (self_rionFar(this, tg) && !f ? 6 : 0);
      if (sk < 1) cost *= 1 + (this.r() - 0.5) * (1 - sk) * 1.6;
      if (!best || cost < best.c) best = { c: cost, v: [dx / l, dy / l, !!f] };
    }
    this.apNext = this.t + (1 - sk) * 0.22; this.apLast = best.v;
    if ((best.c > 900 || P.deathT > 0) && P.inv <= 0) this.bomb();
    if (this.canAwaken()) this.awaken();
    return best.v;
  };
  function self_rionFar(g, tg) { return g.cid === "rion" && tg && g.P.y - tg.y > 330; }
  /* —— 主循环 —— */
  Game.prototype.update = function (dt) {
    if (this.done || this.pause) return;
    var P = this.P, self = this, i, e, b, s; this.t += dt; this.segT += dt; this.bgY += dt * 70;
    if (P.inv > 0) P.inv -= dt; if (this.banner) { this.banner.t += dt; if (this.banner.t > 2.6) this.banner = null; }
    if (P.deathT > 0) { P.deathT -= dt; if (this.auto && P.bombs > 0) this.bomb(); if (P.deathT <= 0 && P.deathT > -1) this.die(); }
    this.input(dt); this.fire(dt); this.bombTick(dt);
    var stg = this.cur(); if (stg && stg.seg) { this.spawnT -= dt; if (this.spawnT <= 0) this.wave(); if (this.segT >= stg.seg) { this.E.forEach(function (q) { if (q.y < 0) q.dead = 1; }); this.next(); } }
    for (i = 0; i < this.E.length; i++) {
      e = this.E[i]; e.t += dt; if (e.flash > 0) e.flash -= dt;
      if (e.mv === "curveL" || e.mv === "curveR") { e.y += 230 * dt; e.x += (e.mv === "curveL" ? -1 : 1) * Math.max(0, e.t - 0.8) * 160 * dt; }
      else if (e.mv === "sine") { e.y += 110 * dt; e.x = e.x0 + Math.sin(e.t * 2) * 70; }
      else { if (e.y < 150 + (e.x0 % 80)) e.y += 150 * dt; if (e.t > 8) e.y -= 180 * dt; }
      e.fire -= dt; if (e.fire <= 0 && e.y > 30 && e.y < FH * 0.6) this.enemyFire(e);
      if (e.y > FH + 80 || e.y < -260 || e.x < -80 || e.x > FW + 80) e.dead = 1;
      if (Math.hypot(e.x - P.x, e.y - P.y) < e.r * 0.5 + P.hit) this.hitPlayer();
    }
    var Bo = this.boss;
    if (Bo) { Bo.t += dt; Bo.cardT += dt; if (Bo.flash > 0) Bo.flash -= dt; Bo.y += (Bo.ty - Bo.y) * Math.min(1, dt * 2);
      if (Bo.card && !Bo.card.non) Bo.x += (FW / 2 - Bo.x) * Math.min(1, dt * 2); else { if (!Bo.mv || Bo.mv < 0) { Bo.tx = 120 + this.r() * (FW - 240); Bo.mv = 2.6; } Bo.mv -= dt; Bo.x += (Bo.tx - Bo.x) * Math.min(1, dt * 1.2); }
      if (Bo.y > 120 && Bo.cardT > 1) this.pattern(Bo, dt);
      Bo.ct -= dt; if (Bo.ct <= 0) this.cardDone(true); }
    var aw = this.t < P.awakenUntil;
    for (i = 0; i < this.B.length; i++) {
      b = this.B[i]; if (b.dead) continue; b.t += dt;
      if (b.turn) { b.a += b.turn * dt; b.vx = Math.cos(b.a) * b.v; b.vy = Math.sin(b.a) * b.v; }
      if (b.acc) { b.v += b.acc * dt; b.vx = Math.cos(b.a) * b.v; b.vy = Math.sin(b.a) * b.v; }
      if (b.stopAt && b.t > b.stopAt) { if (b.t < b.stopAt + 0.5) { b.vx *= 0.85; b.vy *= 0.85; } else if (b.reaim) { b.reaim = 0; b.a = this.aim(b.x, b.y); b.v = b.rv; b.vx = Math.cos(b.a) * b.v; b.vy = Math.sin(b.a) * b.v; } }
      if (b.wob) b.vx = Math.sin(b.t * 3 + b.x) * 40;
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < -30 || b.x > FW + 30 || b.y < -40 || b.y > FH + 30) { b.dead = 1; continue; }
      var d = Math.hypot(b.x - P.x, b.y - P.y);
      if (d < b.r + P.hit) { if (!aw) { b.dead = 1; this.hitPlayer(); } continue; }
      if (!b.g && d < b.r + P.gr && P.inv <= 0) { b.g = 1; P.graze++; this.score += 1; P.gauge = Math.min(100, P.gauge + 1.6); P.power = Math.min(4, P.power + 0.01); this.FX.push({ x: (b.x + P.x) / 2, y: (b.y + P.y) / 2, r: 2, t: 0, life: 0.25, col: "#ffffff", spark: 1 });
        if (this.slot === "speed" && P.graze % 40 === 0) P.bombs = Math.min(6, P.bombs + 1);
        if (this.route === "bio" && ++P.frag >= 60) { P.frag = 0; P.lives = Math.min(8, P.lives + 1); this.banner = { n: "血藤 · 残机碎片集齐 +1", t: 1.2 }; } }
    }
    for (i = 0; i < this.S.length; i++) {
      s = this.S[i]; s.life -= dt; if (s.life <= 0) { s.dead = 1; continue; }
      if (s.home) { var tgt = Bo && Bo.y > 60 ? Bo : this.E.reduce(function (m, q) { return q.y > 0 && (!m || Math.hypot(q.x - s.x, q.y - s.y) < Math.hypot(m.x - s.x, m.y - s.y)) ? q : m; }, null); if (tgt) { var ang = Math.atan2(tgt.y - s.y, tgt.x - s.x), v = 760; s.vx += (Math.cos(ang) * v - s.vx) * Math.min(1, dt * 7); s.vy += (Math.sin(ang) * v - s.vy) * Math.min(1, dt * 7); } }
      s.x += s.vx * dt; s.y += s.vy * dt; if (s.y < -40 || s.x < -40 || s.x > FW + 40) { s.dead = 1; continue; }
      var hw = (s.w || 10) / 2;
      for (var k = 0; k < this.E.length && !s.dead; k++) { e = this.E[k]; if (e.y > -20 && Math.abs(e.x - s.x) < e.r + hw && Math.abs(e.y - s.y) < e.r + 12 && s.hitE !== e) { e.hp -= s.dmg; e.flash = 0.05; if (s.pierce > 0) { s.pierce--; s.hitE = e; } else s.dead = 1; } }
      if (!s.dead && Bo && Bo.y > 60 && Math.abs(Bo.x - s.x) < Bo.r + hw && Math.abs(Bo.y - s.y) < Bo.r + 14 && s.hitE !== Bo) { this.hurtBoss(s.dmg * (s.k === "blade" ? 1 : 1)); if (s.k === "blade") s.hitE = Bo; else s.dead = 1; }
    }
    if (P.beam) { var bd = this.ch.dmg * 9 * this.lv("laser") * this.pw * dt; this.E.forEach(function (q) { if (Math.abs(q.x - P.x) < q.r + 10 && q.y < P.y && q.y > 0) { q.hp -= bd; q.flash = 0.03; } }); if (Bo && Math.abs(Bo.x - P.x) < Bo.r + 6 && Bo.y > 60) this.hurtBoss(bd); }
    for (i = 0; i < this.E.length; i++) { e = this.E[i]; if (e.hp <= 0 && !e.dead) { e.dead = 1; this.kills++; this.score += ETYPE[e.type].score; this.ring(e.x, e.y, e.r, "#ffc4dc"); this.drop(e.x, e.y, e.type === "big" ? 3 : e.type === "fairy" ? 0 : 1, this.r() < 0.85 ? "p" : "b"); } }
    this.B.forEach(function (q) { if (q.dead && q.toPt && self.items.length < 260) { self.items.push({ x: q.x, y: q.y, vy: 0, k: "pt", auto: 1 }); q.toPt = 0; } });
    this.E = this.E.filter(function (q) { return !q.dead; }); this.B = this.B.filter(function (q) { return !q.dead; }); this.S = this.S.filter(function (q) { return !q.dead; });
    var collect = P.y < FH * 0.3; // 东方式：上部回收线
    this.items = this.items.filter(function (it) {
      if (it.auto || collect) { var a2 = Math.atan2(P.y - it.y, P.x - it.x); it.x += Math.cos(a2) * 700 * dt; it.y += Math.sin(a2) * 700 * dt; } else { it.vy = Math.min(160, it.vy + 300 * dt); it.y += it.vy * dt; }
      if (Math.hypot(it.x - P.x, it.y - P.y) < 30) { if (it.k === "p") P.power = Math.min(4, P.power + 0.05); else if (it.k === "b") P.bombs = Math.min(6, P.bombs + (self.r() < 0.25 ? 1 : 0)); self.score += it.k === "pt" ? 0.1 : 1; return false; }
      return it.y < FH + 20; });
    this.FX = this.FX.filter(function (f) { f.t += dt; return f.t < f.life; });
  };
  /* —— 渲染 —— */
  Game.prototype.draw = function (g, img, W, H) {
    var sc = Math.min(W / FW, H / FH), ox = (W - FW * sc) / 2, oy = (H - FH * sc) / 2, P = this.P, t = this.t, self = this, i;
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = "#07050d"; g.fillRect(0, 0, W, H);
    var li = (this.layer - 1) % 3 + 1, bg = img["tile_" + li] && img["tile_" + li].width ? img["tile_" + li] : img["bg" + li];
    if (bg && bg.width) { g.globalAlpha = 0.3; var bs = Math.max(W / bg.width, H / bg.height); g.drawImage(bg, (W - bg.width * bs) / 2, (H - bg.height * bs) / 2, bg.width * bs, bg.height * bs); g.globalAlpha = 1; }
    g.setTransform(sc, 0, 0, sc, ox, oy); g.save(); g.beginPath(); g.rect(0, 0, FW, FH); g.clip();
    if (bg && bg.width) { var th = FW / bg.width * bg.height, y0 = this.bgY % th; for (var k = -1; k * th + y0 < FH; k++) g.drawImage(bg, 0, Math.floor(y0 + k * th), FW, Math.ceil(th) + 1); } else { g.fillStyle = "#120c22"; g.fillRect(0, 0, FW, FH); }
    var Bo = this.boss, spell = Bo && Bo.card && !Bo.card.non;
    g.fillStyle = spell ? "rgba(10,4,24,.62)" : "rgba(6,4,14,.3)"; g.fillRect(0, 0, FW, FH);
    if (spell) { g.save(); g.translate(Bo.x, Bo.y); g.rotate(t * 0.4); g.strokeStyle = "rgba(255,120,180,.28)"; g.lineWidth = 2; for (k = 0; k < 3; k++) { g.beginPath(); g.arc(0, 0, 90 + k * 40, 0, TAU); g.stroke(); } for (k = 0; k < 6; k++) { g.rotate(TAU / 6); g.beginPath(); g.moveTo(0, -170); g.lineTo(147, 85); g.stroke(); } g.restore(); }
    var spr = function (name, x, y, s, flash, alt) { var im = img[name]; if ((!im || !im.width) && alt) im = img[alt]; if (!im || !im.width) { g.fillStyle = "#c66"; g.beginPath(); g.arc(x, y, s / 3, 0, TAU); g.fill(); return; } var w = s, h = s * im.height / im.width; g.drawImage(im, x - w / 2, y - h / 2, w, h); if (flash > 0) { g.globalAlpha = 0.4; g.globalCompositeOperation = "lighter"; g.drawImage(im, x - w / 2, y - h / 2, w, h); g.globalCompositeOperation = "source-over"; g.globalAlpha = 1; } };
    this.E.forEach(function (e) { spr(e.spr, e.x, e.y, e.size, e.flash); });
    if (Bo) { g.save(); var bob = Math.sin(t * 2) * 6, bk = Bo.spr.replace("boss_girl_", "boss"), bdx = Bo.x - (Bo.lx == null ? Bo.x : Bo.lx); Bo.lx = Bo.x; Bo.sv = (Bo.sv || 0) * 0.85 + bdx * 0.15;
      var bf = Bo.sv < -0.6 ? "left" : Bo.sv > 0.6 ? "right" : (Math.floor(t * 4) % 2 ? "idle1" : "idle0"); spr("chibi_" + bk + "_" + bf, Bo.x, Bo.y + bob, Bo.size, Bo.flash, Bo.spr); g.restore(); }
    // 道具
    this.items.forEach(function (it) { if (it.k === "pt") { g.fillStyle = "#9fe6ff"; g.fillRect(it.x - 2, it.y - 2, 4, 4); return; } g.fillStyle = it.k === "p" ? "#ff4f6a" : "#4fd27a"; g.fillRect(it.x - 7, it.y - 7, 14, 14); g.fillStyle = "#fff"; g.font = "bold 11px sans-serif"; g.textAlign = "center"; g.fillText(it.k === "p" ? "P" : "B", it.x, it.y + 4); });
    // 我方弹
    var tint = this.form.tint || (this.route === "tech" ? "#5fd8ff" : this.route === "bio" ? "#ff5f7a" : this.ch.col), core = this.form.core || "#fff4fa";
    g.globalCompositeOperation = "lighter";
    this.S.forEach(function (s) {
      if (s.k === "slash") { g.fillStyle = tint; g.globalAlpha = 0.5; g.beginPath(); g.ellipse(s.x, s.y, s.w / 2, 8, Math.atan2(s.vy, s.vx) + Math.PI / 2, Math.PI, 0); g.fill(); g.globalAlpha = 1; }
      else if (s.k === "blade") { g.fillStyle = tint; g.globalAlpha = 0.55; g.fillRect(s.x - 6, s.y - 40, 12, 80); g.fillStyle = core; g.globalAlpha = 1; g.fillRect(s.x - 2, s.y - 40, 4, 80); }
      else if (s.k === "amulet") { g.fillStyle = tint; g.globalAlpha = 0.7; g.save(); g.translate(s.x, s.y); g.rotate(Math.atan2(s.vy, s.vx)); g.fillRect(-8, -4, 16, 8); g.restore(); g.globalAlpha = 1; }
      else { g.fillStyle = tint; g.globalAlpha = 0.45; g.beginPath(); g.ellipse(s.x, s.y, 4, 13, Math.atan2(s.vy, s.vx) + Math.PI / 2, 0, TAU); g.fill(); g.globalAlpha = 1; g.fillStyle = core; g.beginPath(); g.ellipse(s.x, s.y, 1.8, 8, Math.atan2(s.vy, s.vx) + Math.PI / 2, 0, TAU); g.fill(); } });
    if (P.beam) { var gr = g.createLinearGradient(P.x - 12, 0, P.x + 12, 0); gr.addColorStop(0, "transparent"); gr.addColorStop(0.5, tint); gr.addColorStop(1, "transparent"); g.globalAlpha = 0.6; g.fillStyle = gr; g.fillRect(P.x - 12, 0, 24, P.y - 30); g.globalAlpha = 1; }
    if (P.bombT > 0) { var k2 = 1 - P.bombT / 3.2; g.globalAlpha = 0.3; g.strokeStyle = tint; g.lineWidth = 14; if (this.cid === "rion") { var ly = P.y - k2 * 1280; g.fillStyle = tint; g.fillRect(0, ly - 20, FW, 40); } else { g.beginPath(); g.arc(P.x, P.y, 80 + k2 * 830, 0, TAU); g.stroke(); for (i = 0; i < 18; i++) { var pa = i * TAU / 18 + t * (this.cid === "aya" ? 3 : 1.4), pr = 60 + ((t * 300 + i * 40) % 500); g.fillStyle = this.cid === "sayo" ? "#ffb3d9" : tint; g.beginPath(); g.ellipse(P.x + Math.cos(pa) * pr, P.y + Math.sin(pa) * pr, 9, 5, pa, 0, TAU); g.fill(); } } g.globalAlpha = 1; }
    g.globalCompositeOperation = "source-over";
    // 子机
    this.options().forEach(function (op) { g.fillStyle = tint; g.globalAlpha = 0.9; g.beginPath(); if (self.route === "bio") g.ellipse(op.x, op.y, 7, 10, 0, 0, TAU); else g.rect(op.x - 7, op.y - 7, 14, 14); g.fill(); g.globalAlpha = 1; g.strokeStyle = "#fff"; g.lineWidth = 1.5; g.stroke(); });
    // 角色本人
    var aw = t < P.awakenUntil, blink = P.inv > 0 && !aw && P.bombT <= 0 && Math.floor(t * 6) % 2;
    if (this.form.tint || aw) { var rg = g.createRadialGradient(P.x, P.y, 6, P.x, P.y, 64); rg.addColorStop(0, (aw ? "#ffd76a" : tint) + "77"); rg.addColorStop(1, "transparent"); g.fillStyle = rg; g.fillRect(P.x - 64, P.y - 64, 128, 128); }
    g.globalAlpha = blink ? 0.45 : 1; var tilt = clamp((this.lastX != null ? P.x - this.lastX : 0) * 0.02, -0.18, 0.18); this.lastX = P.x;
    this.sv = (this.sv || 0) * 0.8 + tilt * 50 * 0.2; // 平滑横移速度 → 选左右倾斜帧（东方式自机：待机飘动 2 帧 + 左/右倾斜帧）
    var fr = this.sv < -1.6 ? "left" : this.sv > 1.6 ? "right" : (Math.floor(t * 6) % 2 ? "idle1" : "idle0");
    g.save(); g.translate(P.x, P.y + Math.sin(t * 5) * 2); g.rotate(tilt * 0.35); spr("chibi_" + this.cid + "_" + fr, 0, -6, 92, 0, "fly_" + this.cid); g.restore(); g.globalAlpha = 1;
    // 敌弹（高对比：彩色外圈 + 白芯；贴图半径 > 判定半径）
    this.B.forEach(function (b) {
      g.fillStyle = b.col;
      if (b.ty === "rice" || b.ty === "knife") { var an = Math.atan2(b.vy, b.vx); g.beginPath(); g.ellipse(b.x, b.y, b.vis, b.vis * 0.5, an, 0, TAU); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.ellipse(b.x, b.y, b.vis * 0.55, b.vis * 0.25, an, 0, TAU); g.fill(); }
      else if (b.ty === "amulet") { g.save(); g.translate(b.x, b.y); g.rotate(Math.atan2(b.vy, b.vx)); g.fillRect(-9, -5, 18, 10); g.fillStyle = "#fff"; g.fillRect(-6, -2, 12, 4); g.restore(); }
      else if (b.ty === "star") { g.save(); g.translate(b.x, b.y); g.rotate(b.t * 4); g.beginPath(); for (var s5 = 0; s5 < 10; s5++) { var rr = s5 % 2 ? 4 : 10; g.lineTo(Math.cos(s5 * Math.PI / 5) * rr, Math.sin(s5 * Math.PI / 5) * rr); } g.fill(); g.restore(); }
      else { g.beginPath(); g.arc(b.x, b.y, b.vis, 0, TAU); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(b.x, b.y, b.vis * 0.55, 0, TAU); g.fill(); } });
    // 低速：判定点 + 旋转法阵
    if (P.focus) { g.save(); g.translate(P.x, P.y); g.rotate(t * 2); g.strokeStyle = tint; g.globalAlpha = 0.75; g.lineWidth = 1.5; g.beginPath(); g.arc(0, 0, 26, 0, TAU); g.stroke(); g.strokeRect(-17, -17, 34, 34); g.restore(); g.globalAlpha = 1; g.fillStyle = "#ff2244"; g.beginPath(); g.arc(P.x, P.y, P.hit + 2.5, 0, TAU); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(P.x, P.y, P.hit, 0, TAU); g.fill(); }
    this.FX.forEach(function (f) { var k3 = f.t / f.life; if (f.spark) { g.fillStyle = "#fff"; g.globalAlpha = 1 - k3; g.fillRect(f.x - 2, f.y - 2, 4, 4); g.globalAlpha = 1; return; } g.strokeStyle = f.col; g.globalAlpha = (f.big ? 0.35 : 0.6) * (1 - k3); g.lineWidth = f.big ? 16 : 4; g.beginPath(); g.arc(f.x, f.y, f.r + (f.big ? 700 : 60) * k3, 0, TAU); g.stroke(); g.globalAlpha = 1; });
    // 符卡 / Bomb 宣言特写（东方式 cut-in）：斜切面板从侧边滑入、停留、淡出，约 1.1s
    if (this.cut && this.t - this.cut.at < 1.1 && img[this.cut.k] && img[this.cut.k].width) { var ce = this.t - this.cut.at, ci = img[this.cut.k], cw = FW * 0.62, chh = cw * ci.height / ci.width, slide = ce < 0.2 ? (1 - ce / 0.2) : 0, ca = ce > 0.8 ? (1.1 - ce) / 0.3 : 1, cx0 = this.cut.me ? -cw * slide : FW - cw + cw * slide, cy0 = this.cut.me ? FH * 0.3 : FH * 0.08;
      g.save(); g.globalAlpha = Math.max(0, ca) * 0.92; g.beginPath(); g.moveTo(cx0 + cw * 0.18, cy0); g.lineTo(cx0 + cw, cy0); g.lineTo(cx0 + cw * 0.82, cy0 + chh * 0.62); g.lineTo(cx0, cy0 + chh * 0.62); g.closePath(); g.clip(); g.drawImage(ci, cx0, cy0 - chh * 0.08, cw, chh); g.restore();
      g.save(); g.globalAlpha = Math.max(0, ca); g.strokeStyle = this.cut.me ? "#ff8ac4" : "#b98cff"; g.lineWidth = 4; g.beginPath(); g.moveTo(cx0 + cw * 0.18, cy0); g.lineTo(cx0 + cw, cy0); g.moveTo(cx0, cy0 + chh * 0.62); g.lineTo(cx0 + cw * 0.82, cy0 + chh * 0.62); g.stroke(); g.restore(); }
    // 符卡名横幅
    if (this.banner) { var bn = this.banner, al = Math.min(1, bn.t * 4, (2.6 - bn.t) * 2); g.globalAlpha = al; g.fillStyle = bn.me ? "rgba(255,90,160,.75)" : bn.cap ? "rgba(255,200,80,.8)" : "rgba(60,20,90,.8)"; var by = bn.me ? FH - 90 : 96; g.fillRect(0, by - 18, FW, 32); g.fillStyle = "#fff"; g.font = "bold 18px sans-serif"; g.textAlign = bn.me ? "left" : "right"; g.fillText(bn.n, bn.me ? 16 : FW - 16, by + 4); g.globalAlpha = 1; }
    if (Bo && Bo.card) { g.fillStyle = "#fff"; g.font = "bold 14px sans-serif"; g.textAlign = "right"; g.fillText(Math.max(0, Bo.ct).toFixed(1), FW - 12, 70); if (spell) { g.textAlign = "left"; g.fillStyle = "#ffd76a"; g.fillText(Bo.capOk ? "收取中" : "", 12, 70); } }
    g.restore();
  };
  Game.prototype.snapshot = function () { var b = this.boss, P = this.P; return { t: +this.t.toFixed(2), step: this.step_, stage: (this.cur() || {}), lives: P.lives, hp: +(P.lives / this.lives0).toFixed(3), bombs: P.bombs, power: +P.power.toFixed(2), focus: P.focus, graze: P.graze, kills: this.kills, enemies: this.E.length, bullets: this.B.length, shots: this.S.length,
    boss: b ? { name: b.name, hp: Math.round(b.hp), max: Math.round(b.max), card: b.card && !b.card.non ? b.card.n : null, ci: b.ci, cards: b.cards.length, time: +b.ct.toFixed(1), cap: b.capOk } : null, caps: this.caps, gauge: Math.round(P.gauge), awaken: this.t < P.awakenUntil, pause: this.pause, done: this.done, win: this.win, form: this.slot, ch: this.cid, route: this.route, x: Math.round(P.x), y: Math.round(P.y), hit: P.hit }; };

  /* —— DOM 外壳 —— */
  var CHB = []; ["sayo", "aya", "rion", "boss1", "boss2", "boss3"].forEach(function (c) { ["idle0", "idle1", "left", "right"].forEach(function (k) { CHB.push("chibi_" + c + "_" + k); }); CHB.push("cut_" + c); });
  var ART = ["tile_1", "tile_2", "tile_3", "bg1", "bg2", "bg3", "boss1", "boss2", "boss3", "boss_girl_1", "boss_girl_2", "boss_girl_3", "ship_sayo", "ship_aya", "ship_rion", "fly_sayo", "fly_aya", "fly_rion"];
  ART = ART.concat(CHB);
  ["a", "b"].forEach(function (s) { for (var i = 0; i < 6; i++) ART.push("enemy_" + s + i); });
  var CSS = "#shm46{position:fixed;inset:0;z-index:125;background:#07050d;touch-action:none;user-select:none;font-family:inherit;color:#fff}#shm46 canvas{position:absolute;inset:0;width:100%;height:100%}#shm46 .hud{position:absolute;left:50%;transform:translateX(-50%);top:max(6px,env(safe-area-inset-top));width:min(94vw,56.25vh);display:flex;gap:10px;align-items:center;pointer-events:none;font-size:12px;text-shadow:0 1px 2px #000}#shm46 .hud .lv{color:#ff8fc0;letter-spacing:1px}#shm46 .hud .bb{color:#7fe0a0}#shm46 .hud .pw{color:#ffd76a}#shm46 .hud .gz{color:#cfd8ff;margin-left:auto}#shm46 .bossbar{position:absolute;left:50%;transform:translateX(-50%);top:calc(max(6px,env(safe-area-inset-top)) + 20px);width:min(90vw,54vh);font-size:12px;pointer-events:none}#shm46 .bossbar div{height:6px;border-radius:4px;background:#2a1830;overflow:hidden;margin-top:2px}#shm46 .bossbar i{display:block;height:100%;width:calc(var(--v)*100%);background:linear-gradient(90deg,#fff,#ff8fc0)}#shm46 .bossbar em{font-style:normal;color:#ffd76a;margin-left:6px}#shm46 .btns{position:absolute;right:max(14px,env(safe-area-inset-right));bottom:max(18px,env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:10px}#shm46 .btns button{width:66px;height:66px;border-radius:50%;border:2px solid #ffffff44;background:#1a1230cc;color:#fff;font-size:13px;font-weight:700}#shm46 .btns button.on,#shm46 .btns button.ready{border-color:#ffd76a;box-shadow:0 0 16px #ffd76a}#shm46 .btns button.off{opacity:.35}#shm46 .pick,#shm46 .res{position:absolute;inset:0;display:grid;place-items:center;background:#06040ccc}#shm46 .pick .box,#shm46 .res .box{width:min(92vw,560px);text-align:center}#shm46 .pick .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}#shm46 .pick button{padding:14px 8px;border-radius:14px;border:2px solid #ffb2d466;background:#1a1230;color:#fff}#shm46 .pick button b{display:block;font-size:15px}#shm46 .pick button span{font-size:11px;color:#cfc4dc}#shm46 .res button{margin-top:14px;padding:12px 26px;border-radius:999px;border:0;background:#ff5f9e;color:#fff;font-size:15px}#shm46 .tip{position:absolute;bottom:max(14px,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);font-size:11px;color:#ffffffaa;pointer-events:none;text-align:center}";
  var cur = null, raf = 0;
  function start(o) {
    stop(); o = o || {};
    if (!document.getElementById("shm46css")) { var st = document.createElement("style"); st.id = "shm46css"; st.textContent = CSS; document.head.appendChild(st); }
    var root = document.createElement("div"); root.id = "shm46";
    root.innerHTML = '<canvas></canvas><div class="hud"><b class="nm"></b><span class="lv"></span><span class="bb"></span><span class="pw"></span><span class="gz"></span></div><div class="bossbar" hidden><b></b><em></em><div><i></i></div></div><div class="btns"><button class="aw" hidden>觉醒<br><small>F</small></button><button class="fc">低速<br><small>Shift</small></button><button class="bm">符卡<br><small class="n"></small></button></div><div class="tip">拖动移动 · 自动射击 · 按住「低速」/ Shift 显示判定点 · X 符卡（Bomb）</div>';
    (o.parent || document.body).appendChild(root);
    var cv = root.querySelector("canvas"), g = cv.getContext("2d"), img = {};
    ART.forEach(function (k) { var i = new Image(); i.src = o.art ? o.art("shmup/" + k + ".webp") : "art/shmup/" + k + ".webp"; img[k] = i; });
    var game = new Game(Object.assign({}, o, {
      onPick: function (opts) { if (o.auto) { Promise.resolve().then(function () { game.choose(opts[0].k); }); return; } var el = document.createElement("div"); el.className = "pick"; el.innerHTML = '<div class="box"><small>镜空 · 道中补给</small><h3>三选一</h3><div class="cards">' + opts.map(function (q) { return '<button data-k="' + q.k + '"><b>' + q.n + "</b><span>" + q.d + "</span></button>"; }).join("") + "</div></div>"; root.appendChild(el); el.onclick = function (e) { var b = e.target.closest("[data-k]"); if (!b) return; el.remove(); game.choose(b.dataset.k); }; },
      onEnd: function (r) { var el = document.createElement("div"); el.className = "res"; el.innerHTML = '<div class="box"><h2>' + (r.win ? "镜空突破" : "满身疮痍") + "</h2><p>用时 " + r.time + " s · 被弹 " + r.hits + " · Bomb " + r.bombs + " · 擦弹 " + r.grazes + (r.cards ? " · 符卡收取 " + r.caps + "/" + r.cards : "") + '</p><button class="ok">' + (o.okText || "继续") + "</button></div>"; root.appendChild(el); el.querySelector(".ok").onclick = function () { stop(); o.onClose && o.onClose(r); }; o.onEnd && o.onEnd(r); }
    }));
    game.auto = !!o.auto; game.root = root; cur = game;
    root.querySelector(".nm").textContent = game.ch.name + (o.form && o.form.name ? " · " + o.form.name : "");
    root.querySelector(".bm").onclick = function () { game.bomb(); }; root.querySelector(".aw").onclick = function () { game.awaken(); };
    var fc = root.querySelector(".fc"); fc.addEventListener("pointerdown", function (e) { e.preventDefault(); game.focusHold = true; }); ["pointerup", "pointercancel", "pointerleave"].forEach(function (ev) { fc.addEventListener(ev, function () { game.focusHold = false; }); });
    var ptrs = {}, last = null;
    root.addEventListener("pointerdown", function (e) { if (e.target.closest("button")) return; ptrs[e.pointerId] = 1; game.touchFocus = Object.keys(ptrs).length >= 2; if (!last) last = { id: e.pointerId, x: e.clientX, y: e.clientY }; });
    root.addEventListener("pointermove", function (e) { if (!last || e.pointerId !== last.id) return; var r = cv.getBoundingClientRect(), sc = Math.min(r.width / FW, r.height / FH) || 1; game.dragD = [(game.dragD ? game.dragD[0] : 0) + (e.clientX - last.x) * 1.15 / sc, (game.dragD ? game.dragD[1] : 0) + (e.clientY - last.y) * 1.15 / sc]; last.x = e.clientX; last.y = e.clientY; });
    var up = function (e) { delete ptrs[e.pointerId]; game.touchFocus = Object.keys(ptrs).length >= 2; if (last && e.pointerId === last.id) last = null; }; root.addEventListener("pointerup", up); root.addEventListener("pointercancel", up);
    game.kd = function (e) { game.keys[e.key] = 1; if (e.key === "x" || e.key === "X" || e.key === " ") game.bomb(); if (e.key === "f" || e.key === "F") game.awaken(); };
    game.ku = function (e) { game.keys[e.key] = 0; };
    addEventListener("keydown", game.kd); addEventListener("keyup", game.ku);
    var paint = function () {
      var dpr = Math.min(global.devicePixelRatio || 1, 2), W = Math.round(cv.clientWidth * dpr), H = Math.round(cv.clientHeight * dpr); if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
      game.draw(g, img, W, H); var s = game.snapshot();
      root.querySelector(".lv").textContent = "残机 " + "★".repeat(Math.min(8, s.lives)); root.querySelector(".bb").textContent = "符卡 " + "✦".repeat(Math.min(6, s.bombs)); root.querySelector(".pw").textContent = "P " + s.power.toFixed(2); root.querySelector(".gz").textContent = "擦弹 " + s.graze;
      root.querySelector(".bm .n").textContent = "×" + s.bombs; root.querySelector(".bm").classList.toggle("off", !s.bombs); fc.classList.toggle("on", s.focus);
      var bb = root.querySelector(".bossbar"); bb.hidden = !s.boss; if (s.boss) { bb.querySelector("b").textContent = s.boss.name; bb.querySelector("em").textContent = "★".repeat(Math.max(0, s.boss.cards - s.boss.ci - 1)); bb.style.setProperty("--v", Math.max(0, s.boss.hp / s.boss.max)); }
      var aw = root.querySelector(".aw"); aw.hidden = !game.canAwaken() && !s.awaken; aw.classList.toggle("ready", game.canAwaken());
    };
    game.paint = paint; var t0 = performance.now();
    var loop = function (now) { raf = requestAnimationFrame(loop); var dt = Math.min(0.05, (now - t0) / 1000); t0 = now; if (global.__shmManual) return; game.update(dt); paint(); };
    raf = requestAnimationFrame(loop); return game;
  }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; if (cur) { removeEventListener("keydown", cur.kd); removeEventListener("keyup", cur.ku); cur.root && cur.root.remove(); } cur = null; }
  function simulate(o, maxT) { var g = new Game(Object.assign({}, o, { onPick: function () { q.push(function () { g.choose("power"); }); } })); var q = []; g.auto = true; for (var t = 0; t < (maxT || 400) && !g.done; t += 1 / 60) { g.update(1 / 60); while (q.length) q.shift()(); } return Object.assign(g.result(), { done: g.done, snapshot: g.snapshot() }); }
  global.SakurayoShmup = { Game: Game, start: start, stop: stop, simulate: simulate, current: function () { return cur; }, step: function (dt) { if (cur) { cur.update(dt); cur.paint(); } }, FW: FW, FH: FH, CH: CH, BOSS: BOSS };
})(typeof window !== "undefined" ? window : globalThis);
