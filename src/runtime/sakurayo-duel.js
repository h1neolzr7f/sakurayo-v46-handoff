/* 镜斗 · KOF 式 2D 格斗（1v1，三局两胜）。独立模块：自带画布/固定 60fps 帧循环/输入/HUD；只通过 start(opts)/onEnd(result) 与夜行地图交互。
   操作（键盘）：←→ 走 / →→ 冲刺 / ←← 后撤步 / ↑ 跳（↖↗ 斜跳）/ ↓ 蹲；J 轻攻击、K 重攻击、J+K（或 ←/→+K 贴身）投技；
     搓招：↓↘→ + 拳 = 波动（A 技）、→↓↘ + 拳 = 升龙（对空，起手无敌）、↓↙← + 拳 = 突进（B 技）、↓↘→↓↘→ + 拳 = 超必杀（1 气）；
     防御：按住后 = 站防（防中/上段，防不住下段）、按住后下 = 蹲防（防中/下段，防不住跳攻/中段）；防御中 →+J+K = 防御反击（1 气）；
     倒地时按任意键 = 受身快速起身；被投瞬间按 J+K = 拆投。
   触屏：左侧摇杆（8 方向，可直接搓招）+ 轻/重/投/必杀/超必按钮（「必杀」「超必」为一键出招的便捷键）。
   系统：取消（普通技 → 必杀 → 超必）、目押连段（轻 → 轻 → 重）、连击数 + 伤害递减、Counter（打断对手出招）、Hitstop、震屏、受击火花、破防值、气槽 3 格。
   对手 AI（brain）：反应延迟 + 读招（上/下段防御）、对空升龙、确反、连段确认、投/拆投、起身无敌技、远距离波动；Boss 有出招闪光预告与收招破绽。
   构筑映射：A 技（波动）随构筑变形：spread=三向、bomb=抛物线爆弹、laser=贯穿光线、homing=追踪狐火、pierce=多段贯穿、orbit=B 技换成樱环反射。
   路线：科技线 = 气槽增长 +25%、超必杀变「MAX」版；生物线 = 白血（可恢复伤害）在中立时回复、重攻击带 1 次霸体。
   形态：guard = 不吃削血、破防值减半；speed = 走/冲刺 +20%、轻攻击可 4 连；burst = 伤害 ×1.3、受伤 ×1.2。 */
(function (global) {
  "use strict";
  var FW = 960, FH = 540, GROUND = 468, DT = 1 / 60, STAGE_L = 40, STAGE_R = 920;
  function rng(s) { s = (s >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  var CH = {
    sayo: { name: "月城小夜", walk: 190, dmg: 1.0, col: "#ff9ec7", A: "樱弹射", D: "月轮", B: "瞬步突刺", S: "千本樱", proj: 1 },
    aya: { name: "神代绫", walk: 205, dmg: 0.95, col: "#8fc8ff", A: "双枪连射", D: "回旋踢", B: "镜像位移", S: "双生乱舞", proj: 1 },
    rion: { name: "黑羽凛音", walk: 180, dmg: 1.08, col: "#ff6b6b", A: "飞燕斩", D: "昇龙一闪", B: "居合", S: "千夜一闪", proj: 0 }
  };
  /* 招式帧数据（60fps 帧）：st 起手 / ac 判定 / rc 收招；h = 段（mid/low/over/throw）；hs/bs = 受击/防御硬直；c = 可取消等级（1=可取消成必杀，2=可连到轻/重） */
  var MV = {
    lp: { st: 4, ac: 3, rc: 7, dmg: 3, hs: 13, bs: 9, kb: 40, reach: 78, y: 120, h: "mid", c: 2, pose: "lp" },
    hp: { st: 8, ac: 4, rc: 17, dmg: 9, hs: 19, bs: 14, kb: 90, reach: 102, y: 120, h: "mid", c: 1, pose: "hp", shake: 3 },
    clp: { st: 4, ac: 3, rc: 7, dmg: 3, hs: 13, bs: 9, kb: 30, reach: 76, y: 40, h: "low", c: 2, pose: "clp", crouch: 1 },
    chp: { st: 9, ac: 4, rc: 23, dmg: 8, hs: 0, bs: 13, kb: 60, reach: 108, y: 20, h: "low", c: 1, kd: 1, pose: "chp", crouch: 1, shake: 3 },
    jlp: { st: 4, ac: 8, rc: 3, dmg: 4, hs: 14, bs: 10, kb: 30, reach: 66, y: 60, h: "over", air: 1, pose: "jatk" },
    jhp: { st: 7, ac: 6, rc: 4, dmg: 8, hs: 18, bs: 13, kb: 50, reach: 84, y: 40, h: "over", air: 1, pose: "jatk", shake: 2 },
    thr: { st: 3, ac: 2, rc: 22, dmg: 12, reach: 62, y: 120, h: "throw", pose: "throw", kd: 1 },
    gc: { st: 4, ac: 4, rc: 22, dmg: 4, hs: 0, bs: 10, kb: 160, reach: 96, y: 120, h: "mid", kd: 1, inv: 10, pose: "hp", meter: 1 },
    A: { st: 12, ac: 2, rc: 24, dmg: 8, hs: 18, bs: 14, kb: 70, h: "mid", sp: 1, chip: 1, proj: 1, pose: "special" },
    D: { st: 3, ac: 10, rc: 28, dmg: 12, hs: 0, bs: 16, kb: 80, reach: 86, y: 160, h: "mid", sp: 1, inv: 8, kd: 1, rise: 1, chip: 1, pose: "dp", shake: 4 },
    B: { st: 10, ac: 8, rc: 22, dmg: 10, hs: 20, bs: 12, kb: 110, reach: 92, y: 110, h: "mid", sp: 1, dash: 520, chip: 1, pose: "rush", shake: 3 },
    S: { st: 8, ac: 30, rc: 30, dmg: 30, hs: 0, bs: 22, kb: 120, reach: 140, y: 120, h: "mid", su: 1, inv: 14, kd: 1, chip: 4, meter: 1, dash: 640, hits: 6, pose: "super", shake: 8 }
  };
  // 每招的关键帧时间表（前摇 s / 发生 a / 收招 r）。思路取自 MUGEN/Ikemen 的 .air：每段有专门的预备、伸展、过冲、回架势帧，帧间硬切（有限帧动画），不插值
  var ANIM = {
    lp: { s: ["lp_s"], a: ["lp"], r: ["lp_r", "idle"] }, clp: { s: ["crouch"], a: ["clp"], r: ["clp", "crouch"] },
    hp: { s: ["hp_s"], a: ["hp"], r: ["hp_r", "hp_r", "idle_b"] }, chp: { s: ["crouch"], a: ["chp"], r: ["chp", "crouch"] },
    jatk: { s: ["jatk_s"], a: ["jatk"], r: ["jatk", "jump_fall"] }, throw: { s: ["throw_s"], a: ["throw"], r: ["throw", "idle_b"] },
    special: { s: ["special_s", "special_s"], a: ["special"], r: ["special", "idle_b"] }, dp: { s: ["crouch"], a: ["dp"], r: ["dp", "jump_fall", "dp_r"] },
    rush: { s: ["hp_s"], a: ["rush"], r: ["rush_r", "rush_r", "idle_b"] }, super: { s: ["special_s", "special"], a: ["super", "super_r", "super", "super_r"], r: ["super_r", "idle_b"] } };
  var STRONG = { hp: 1, chp: 1, jatk: 1, dp: 1, rush: 1, super: 1, special: 1 };
  var CMD = [ // 按优先级匹配
    { m: "S", seq: [2, 3, 6, 2, 3, 6], win: 34 }, { m: "D", seq: [6, 2, 3], win: 16 }, { m: "A", seq: [2, 3, 6], win: 14 }, { m: "B", seq: [2, 1, 4], win: 14 }];
  function Fighter(side, cid, o) { return { side: side, cid: cid, ch: CH[cid], x: side < 0 ? 300 : 660, y: 0, vx: 0, vy: 0, face: side < 0 ? 1 : -1, hp: 100, max: 100, white: 0, meter: 0, stun: 0, guard: 0, st: "stand", stT: 0, mv: null, mf: 0, hit: false, hitstop: 0, combo: 0, juggle: 0, inv: 0, armor: 0, o: o, buf: [], btn: [], crouch: false, blockH: null, hits: 0, taken: 0, dealt: 0, landed: 0, blocked: 0, thrTech: 0, chain: 0, kdT: 0, wins: 0, cancelOK: 0, aiT: 0, maxCombo: 0 }; }
  function Game(o) {
    this.o = o; this.r = rng(o.seed || 1); this.cid = CH[o.character] ? o.character : "sayo"; this.ch = CH[this.cid]; this.layer = o.layer || 1; this.boss = !!o.boss;
    var f = o.form || {}; this.slot = f.slot || "base"; var up = o.weapons || {};
    this.lv = function (k) { return up[k] ? (up[k].lv || 1) + (up[k].evo ? 2 : 0) : 0; };
    var best = "", bl = 0; ["spread", "bomb", "laser", "homing", "pierce", "orbit"].forEach(function (k) { var l = (up[k] ? (up[k].lv || 1) + (up[k].evo ? 2 : 0) : 0); if (l > bl) { bl = l; best = k; } }); this.special = best || "base"; this.spLv = bl;
    this.route = o.route === "bio" ? "bio" : o.route === "tech" ? "tech" : null;
    this.power = clamp(o.power || 1, 0.7, 2.6); var pw = 1 + 0.35 * (this.power - 1); // 数值成长只折算 35%：构筑主要改变招式形态
    var foe = o.foe && CH[o.foe] ? o.foe : ["aya", "rion", "sayo"][["sayo", "aya", "rion"].indexOf(this.cid)];
    this.P = Fighter(-1, this.cid, { dmg: this.ch.dmg * pw * (this.slot === "burst" ? 1.3 : 1) * (this.spLv ? 1 + 0.03 * this.spLv : 1), taken: this.slot === "burst" ? 1.2 : 1, walk: this.ch.walk * (this.slot === "speed" ? 1.2 : 1), chain: this.slot === "speed" ? 4 : 3, noChip: this.slot === "guard", guardK: this.slot === "guard" ? 0.5 : 1, meterK: this.route === "tech" ? 1.25 : 1, white: this.route === "bio", armorHP: this.route === "bio" });
    this.P.hp = this.P.max = 100; this.hpIn = clamp(o.hpFrac == null ? 1 : o.hpFrac, 0.3, 1); this.P.hp = 100 * this.hpIn;
    var L = this.layer, boss = this.boss;
    this.E = Fighter(1, foe, { dmg: (boss ? 0.8 + 0.1 * L : 0.66 + 0.07 * L), taken: boss ? 0.84 : 1, walk: CH[foe].walk * (0.95 + 0.03 * L), chain: 3, guardK: 1, meterK: 1, boss: boss });
    this.E.name = (boss ? "镜灵 · " : "镜影 · ") + CH[foe].name; this.E.hp = this.E.max = 100;
    this.brainE = brain(boss ? { react: 11 - L, block: 0.55 + 0.08 * L, aa: 0.45 + 0.1 * L, punish: 0.55 + 0.1 * L, combo: 0.6 + 0.1 * L, thr: 0.12, tech: 0.3 + 0.1 * L, jump: 0.012, fb: 0.02, tele: 1 } : { react: 14 - L, block: 0.42 + 0.08 * L, aa: 0.3 + 0.1 * L, punish: 0.4 + 0.1 * L, combo: 0.45 + 0.1 * L, thr: 0.1, tech: 0.2 + 0.1 * L, jump: 0.01, fb: 0.018 });
    var sk = o.skill == null ? 0.75 : o.skill; // 自动驾驶（测试/录像）用的我方大脑
    this.brainP = brain({ react: Math.round(16 - 10 * sk), block: 0.35 + 0.5 * sk, aa: 0.3 + 0.55 * sk, punish: 0.35 + 0.55 * sk, combo: 0.45 + 0.5 * sk, thr: 0.1, tech: 0.2 + 0.5 * sk, jump: 0.012, fb: 0.02 });
    this.frame = 0; this.t = 0; this.acc = 0; this.round = 1; this.roundT = 0; this.limit = 60; this.done = false; this.shots = []; this.fx = []; this.shake = 0; this.freeze = 0; this.banner = { s: "ROUND 1", t: 0, life: 1.2 }; this.pauseT = 1.0;
    this.keys = {}; this.touch = { dir: 5 }; this.hist = [];
  }
  function brain(p) { return p; }
  Game.prototype.opp = function (f) { return f === this.P ? this.E : this.P; };
  /* —— 输入：方向转成相对朝向的数字键盘（6 = 前） —— */
  Game.prototype.dirOf = function (f, ax, ay) { var fx = ax * f.face; return 5 + (fx > 0 ? 1 : fx < 0 ? -1 : 0) + (ay > 0 ? -3 : ay < 0 ? 3 : 0); };
  Game.prototype.readHuman = function () {
    var k = this.keys, t = this.touch, ax = 0, ay = 0;
    if (k.ArrowLeft || k.a || k.A) ax -= 1; if (k.ArrowRight || k.d || k.D) ax += 1; if (k.ArrowUp || k.w || k.W) ay -= 1; if (k.ArrowDown || k.s || k.S) ay += 1;
    if (t.ax || t.ay) { ax = t.ax; ay = t.ay; }
    return { ax: ax, ay: ay };
  };
  Game.prototype.press = function (b, f) { f = f || this.P; f.btn.push({ b: b, fr: this.frame }); };
  Game.prototype.pushDir = function (f, d) { var last = f.buf[f.buf.length - 1]; if (!last || last.d !== d) f.buf.push({ d: d, fr: this.frame }); if (f.buf.length > 40) f.buf.shift(); };
  Game.prototype.matchCmd = function (f) {
    for (var i = 0; i < CMD.length; i++) { var c = CMD[i], seq = c.seq, j = seq.length - 1, k = f.buf.length - 1; for (; k >= 0 && j >= 0; k--) { if (this.frame - f.buf[k].fr > c.win) break; if (f.buf[k].d === seq[j]) j--; } if (j < 0) return c.m; }
    return null;
  };
  Game.prototype.dashCheck = function (f) { var b = f.buf, n = b.length; if (n < 3) return 0; var a = b[n - 3], m = b[n - 2], c = b[n - 1]; if (this.frame - a.fr > 14) return 0; if (a.d === 6 && m.d === 5 && c.d === 6) return 1; if (a.d === 4 && m.d === 5 && c.d === 4) return -1; return 0; };
  /* —— 状态判定 —— */
  Game.prototype.actionable = function (f) { return (f.st === "stand" || f.st === "crouch" || f.st === "walk") && f.hitstop <= 0; };
  Game.prototype.canCancel = function (f, into) { var m = f.mv; if (!m || !f.hit || f.mf < m.st) return false; if (into === "su") return !!m.sp || m.c >= 1; if (into === "sp") return m.c >= 1; if (into === "n") return m.c === 2 && f.chain < f.o.chain; return false; };
  Game.prototype.start = function (f, name) {
    var m = MV[name]; if (!m) return false; var E = this.opp(f);
    if (m.meter && f.meter < 1) return false; if (m.meter) f.meter -= 1;
    if (m.c === 2 && f.mv && f.mv.c === 2) f.chain++; else if (!f.mv || f.mv.c !== 2) f.chain = 1;
    if (m.h && m.h !== "throw") { var Eh = this.opp(f).habit; if (Eh) { if (m.h === "low") Eh.low++; else Eh.high++; } }
    f.mv = m; f.mn = name; f.mf = 0; f.hit = false; f.st = m.air ? "air" : "move"; f.multi = 0;
    if (m.inv) f.inv = m.inv; if (name === "hp" && f.o.armorHP && !f.armorUsed) { f.armor = 1; }
    if (m.su) { this.freeze = 36; this.fx.push({ k: "super", f: f, t: 0, life: 0.9 }); this.banner = { s: f === this.P ? this.ch.S + (this.route === "tech" ? " · MAX" : "") : CH[f.cid].S, t: 0, life: 1.1, side: f.side }; }
    if (f.o.boss && (m.sp || m.su || name === "hp" || name === "chp")) { f.tele = 1; this.fx.push({ k: "glint", f: f, t: 0, life: 0.35 }); f.mf = -6; } // Boss：出招闪光预告（多 6 帧前摇）
    if (name === "B" && f.cid === "aya") { f.tp = 1; }
    if (name === "B" && f.cid === "rion") { f.parry = 1; }
    return true;
  };
  Game.prototype.tryMoves = function (f, dir, btns) {
    var crouch = dir <= 3, cmd = this.matchCmd(f), has = function (b) { return btns.indexOf(b) >= 0; }, E = this.opp(f), dist = Math.abs(E.x - f.x);
    var L = has("L"), H = has("H"), T = has("T") || (L && H), SP = has("SP"), SU = has("SU");
    if (SU) cmd = "S", L = true; if (SP) cmd = cmd || "A", L = true;
    if (!(L || H || T)) return false;
    // 防御反击（防御硬直中 →+J+K）
    if (f.st === "block" && T && f.meter >= 1) { f.st = "stand"; f.stT = 0; return this.start(f, "gc"); }
    var act = this.actionable(f);
    if (cmd && (L || H)) { var nm = cmd === "S" ? "S" : cmd; if (nm === "S" && f.meter < 1) nm = "A"; if (act || (f.st === "move" && this.canCancel(f, nm === "S" ? "su" : "sp"))) { f.buf.length = 0; return this.start(f, nm); } }
    if (f.st === "air") { if (f.mv) return false; return this.start(f, H ? "jhp" : "jlp"); }
    if (T && act && dist < MV.thr.reach + 20 && E.y === 0 && E.st !== "hitstun" && E.st !== "down" && E.inv <= 0) return this.start(f, "thr");
    if (H && act && (dir === 6 || dir === 4) && dist < MV.thr.reach && E.y === 0 && (E.st === "stand" || E.st === "crouch" || E.st === "walk" || E.st === "block")) return this.start(f, "thr");
    var nm2 = crouch ? (H ? "chp" : "clp") : (H ? "hp" : "lp");
    if (act) return this.start(f, nm2);
    if (f.st === "move" && this.canCancel(f, "n") && (nm2 === "lp" || nm2 === "clp" || (H && f.mv.c === 2))) return this.start(f, nm2);
    return false;
  };
  /* —— 每帧控制：人类或 AI —— */
  Game.prototype.control = function (f, human) {
    var E = this.opp(f), inp, dir, btns = [];
    if (human) { var h = this.readHuman(); dir = this.dirOf(f, h.ax, h.ay); btns = f.btn.filter(function (q) { return true; }).map(function (q) { return q.b; }); f.btn.length = 0; }
    else { var a = this.ai(f, f === this.P ? this.brainP : this.brainE); dir = a.dir; btns = a.btns; }
    this.pushDir(f, dir); f.holdDir = dir;
    if (f.hitstop > 0 || this.freeze > 0) { if (btns.length) f.pend = btns; return; }
    if (f.pend) { btns = btns.concat(f.pend); f.pend = null; }
    if (f.st === "thrown" && btns.indexOf("T") >= 0 && f.stT < 12) { f.thrTech = 1; }
    if (f.st === "down" && btns.length && f.stT > 8 && !f.tech) { f.tech = 1; }
    if (btns.length && this.tryMoves(f, dir, btns)) return;
    if (!this.actionable(f)) return;
    var dash = this.dashCheck(f);
    if (dash > 0 && f.st !== "crouch") { f.st = "dash"; f.stT = 0; f.vx = f.face * f.o.walk * 2.6; f.buf.length = 0; return; }
    if (dash < 0) { f.st = "backdash"; f.stT = 0; f.vx = -f.face * 520; f.vy = -260; f.y = -1; f.inv = 8; f.buf.length = 0; return; }
    if (dir >= 7) { f.st = "jsquat"; f.stT = 0; f.jdir = dir === 7 ? -1 : dir === 9 ? 1 : 0; return; }
    if (dir <= 3) { f.st = "crouch"; f.vx = 0; return; }
    f.st = dir === 6 || dir === 4 ? "walk" : "stand"; f.vx = dir === 6 ? f.face * f.o.walk : dir === 4 ? -f.face * f.o.walk * 0.8 : 0;
  };
  /* —— AI —— 读取 react 帧之前的对手状态；输出方向 + 按键（与人类同一套招式判定） */
  Game.prototype.ai = function (f, B) {
    var E = this.opp(f), r = this.r, dist = Math.abs(E.x - f.x), fwd = 6, back = 4, out = { dir: 5, btns: [] };
    var past = this.hist[Math.max(0, this.hist.length - 1 - B.react)] || null, pe = past ? (f === this.P ? past.E : past.P) : null;
    var eAtt = pe && pe.mv && pe.mf < pe.mvst + pe.mvac, eLow = pe && pe.h === "low", eOver = pe && pe.h === "over", eAir = pe && pe.y < -10, eRec = E.mv && E.mf >= E.mv.st + E.mv.ac && !E.hit && E.y === 0;
    var meterOK = f.meter >= 1;
    if (f.st === "thrown") { if (r() < B.tech) out.btns.push("T"); return out; }
    if (f.st === "down") { if (B.tele && dist < 140 && f.stT >= 10 && !f.wake) { f.wake = 1; out.btns.push(f.meter >= 1 && r() < 0.5 ? "SU" : "DP"); return this.aiFix(f, out); } if (r() < 0.3) out.btns.push("L"); return out; } // Boss 起身无敌技（升龙 / 超必）
    f.wake = 0;
    if (f.st === "block" || f.st === "hitstun") { out.dir = f.blockH === "low" ? 1 : 4; if (f.st === "block" && meterOK && f.stT > 3 && r() < 0.012 * (B.tele ? 2 : 1)) { out.dir = 6; out.btns.push("T"); } return out; }
    // 连段确认：命中后在取消窗口里接必杀 / 超必
    if (f.st === "move" && f.hit && f.mv && !f.comboPlan) { f.comboPlan = r() < B.combo ? (meterOK && (f.mv.sp || r() < 0.5) ? "S" : f.mv.c === 2 && f.chain < 2 ? (r() < 0.5 ? "chain" : "hp") : "sp") : "none"; }
    if (f.st === "move" && f.hit && f.comboPlan && f.comboPlan !== "none" && f.mf >= f.mv.st + 1) { var pl = f.comboPlan; f.comboPlan = "none";
      if (pl === "S" && this.canCancel(f, "su")) out.btns.push("SU"); else if (pl === "chain") out.btns.push(f.mn === "clp" ? "L" : "L"), out.dir = f.mn === "clp" ? 2 : 5; else if (pl === "hp") out.btns.push("H"); else if (this.canCancel(f, "sp")) { out.btns.push("SP"); if (dist > 140 || !CH[f.cid].proj) { out.btns.pop(); out.dir = 4; out.btns.push("B_"); } } return this.aiFix(f, out); }
    if (f.st !== "move") f.comboPlan = null;
    if (B.tele && f.st === "move" && f.mv && f.mv.c === 2 && E.st === "block" && f.mf >= f.mv.st + f.mv.ac && !f.trap) { f.trap = 1; out.btns.push(r() < 0.5 ? "H" : "L"); out.dir = r() < 0.4 ? 2 : 5; return this.aiFix(f, out); } // Boss 压制：被防后接打帧陷阱
    if (f.st !== "move") f.trap = 0;
    if (!this.actionable(f) && f.st !== "air") return out;
    if (f.st === "air") { if (!f.mv && dist < 120 && f.vy > -100 && r() < 0.25) out.btns.push(r() < 0.6 ? "H" : "L"); return out; }
    // Boss 识破飞行道具：来弹时跳过去（顺势跳攻）或用无敌升龙穿过；有气时直接超必杀穿弹
    if (B.tele) { var inc = this.shots.find(function (q) { return q.owner !== f && Math.abs(q.x - f.x) < 260 && (q.x - f.x) * q.vx < 0; }); if (inc && r() < 0.5) { if (f.meter >= 1 && dist < 330 && r() < 0.35) out.btns.push("SU"); else if (Math.abs(inc.x - f.x) < 150 && r() < 0.5) out.btns.push("DP"); else out.dir = 9; return this.aiFix(f, out); } }
    // 防御（读段）；Boss 记录玩家出招的高低段习惯，猜段按习惯来（学习型防御），第 2 局起反应更快
    var habit = f.habit || (f.habit = { low: 1, high: 1 }), blk = B.block + (B.tele ? 0.06 * (this.round - 1) : 0);
    if (eAtt && dist < 230 && r() < blk) { out.dir = eLow ? 1 : eOver ? 4 : (B.tele ? (habit.low > habit.high ? 1 : 4) : (r() < 0.5 ? 4 : 1)); if (eOver) out.dir = 4; if (eLow) out.dir = 1; return out; }
    // 对空
    if (eAir && dist < 210 && dist > 30 && E.vy > -200 && (E.x - f.x) * f.face > 0 && r() < B.aa * 0.12) { out.btns.push("DP"); return this.aiFix(f, out); }
    // 确反
    if (eRec && dist < 150 && r() < B.punish * 0.35) { if (meterOK && r() < 0.4) out.btns.push("SU"); else out.btns.push(r() < 0.6 ? "H" : "L"), out.dir = r() < 0.5 ? 2 : 5; return this.aiFix(f, out); }
    // 起身 / 中立
    var tick = r();
    if (dist < 80 && E.y === 0 && (E.st === "block" || E.st === "crouch" || E.st === "stand") && tick < B.thr * 0.3) { out.dir = 6; out.btns.push("H"); return out; }
    if (dist < 110) { if (tick < 0.05) { out.dir = 2; out.btns.push("L"); } else if (tick < 0.075) out.btns.push("L"); else if (tick < 0.09) { out.dir = 2; out.btns.push("H"); } else if (tick < 0.105) out.dir = 4; else if (tick < 0.11) out.dir = 44; else out.dir = r() < 0.5 ? 1 : 4; return this.aiFix(f, out); }
    if (dist < 220) { if (tick < 0.04) out.btns.push("H"); else if (tick < 0.055) { out.dir = 2; out.btns.push("H"); } else if (tick < 0.07) out.dir = 9; else if (tick < 0.09) out.dir = 66; else out.dir = tick < 0.6 ? 6 : 4; return this.aiFix(f, out); }
    if (tick < B.fb && CH[f.cid].proj) out.btns.push("SP"); else if (tick < B.fb + B.jump) out.dir = 9; else if (tick < 0.1) out.dir = 66; else out.dir = 6;
    return this.aiFix(f, out);
  };
  Game.prototype.aiFix = function (f, out) { // 把便捷指令翻译成真实输入
    if (out.dir === 66 || out.dir === 44) { var d = out.dir === 66 ? 6 : 4; this.pushDir(f, d); this.pushDir(f, 5); out.dir = d; }
    if (out.btns[0] === "DP") { [6, 2, 3].forEach(function (d) { this.pushDir(f, d); f.buf[f.buf.length - 1].fr = this.frame; }, this); out.btns = ["H"]; out.dir = 3; }
    else if (out.btns[0] === "B_") { [2, 1, 4].forEach(function (d) { this.pushDir(f, d); }, this); out.btns = ["L"]; out.dir = 4; }
    return out;
  };
  /* —— 命中 —— */
  Game.prototype.hitbox = function (f) { var m = f.mv; if (!m || m.proj || f.mf < m.st || f.mf >= m.st + m.ac) return null; return { x0: f.face > 0 ? f.x + 10 : f.x - 10 - m.reach, x1: f.face > 0 ? f.x + 10 + m.reach : f.x - 10, y: m.y + (f.y < 0 ? -f.y : 0) }; };
  Game.prototype.blocks = function (d, m, f) { // d 受方
    if (!(d.st === "stand" || d.st === "walk" || d.st === "crouch" || d.st === "block") || d.y < 0) return false;
    var back = d.holdDir === 4 || d.holdDir === 1; if (!back) return false; var low = d.holdDir === 1;
    if (m.h === "low" && !low) return false; if (m.h === "over" && low) return false; return true;
  };
  Game.prototype.applyHit = function (a, d, m, proj) {
    var self = this, scale = Math.max(0.3, 1 - 0.1 * a.combo), ctr = d.mv && d.mf < d.mv.st && !proj;
    if (m.h === "throw") { if (d.thrTech) { d.thrTech = 0; d.st = "stand"; a.mv = null; a.st = "stand"; this.fx.push({ k: "txt", s: "拆投", x: (a.x + d.x) / 2, y: 220, t: 0, life: 0.8 }); a.vx = -a.face * 300; d.vx = -d.face * 300; return; }
      d.st = "thrown"; d.stT = 0; d.mv = null; d.thrownBy = a; a.hit = true; this.hitstopAll(10); return; }
    if (d.parry && d.mv && d.mf < 24 && !proj) { d.parry = 0; d.mv = MV.D; d.mn = "D"; d.mf = MV.D.st; d.hit = false; d.inv = 12; this.fx.push({ k: "txt", s: "居合 · 见切", x: d.x, y: 260, t: 0, life: 0.8 }); this.hitstopAll(10); return; }
    if (this.blocks(d, m, a)) {
      var chip = m.chip && !d.o.noChip ? m.chip * a.o.dmg : 0; d.hp -= chip; d.st = "block"; d.stT = 0; d.bs = m.bs; d.blockH = m.h === "low" ? "low" : "high"; d.vx = -d.face * m.kb * 1.6;
      d.guard += (m.su ? 30 : m.sp ? 18 : m.dmg * 2.2) * d.o.guardK; a.blocked++; this.gain(a, 0.06); this.gain(d, 0.04);
      this.fx.push({ k: "guard", x: d.x + d.face * 30, y: GROUND - m.y - (d.y < 0 ? -d.y : 0), t: 0, life: 0.25 }); this.hitstopAll(m.su ? 4 : 7);
      if (d.guard >= 100) { d.guard = 0; d.st = "hitstun"; d.stT = 0; d.hs = 60; this.fx.push({ k: "txt", s: "破防！", x: d.x, y: 240, t: 0, life: 1 }); this.shake = 8; }
      if (!proj) a.hit = true; a.combo = 0; if (d.hp <= 0) this.ko(a, d); return;
    }
    if (d.armor && !proj && !m.su) { d.armor = 0; d.armorUsed = 1; d.hp -= m.dmg * a.o.dmg * 0.5 * d.o.taken; this.fx.push({ k: "txt", s: "霸体", x: d.x, y: 250, t: 0, life: 0.6 }); this.hitstopAll(8); a.hit = true; return; }
    var dmg = m.dmg * a.o.dmg * d.o.taken * scale * (ctr ? 1.25 : 1) * (proj && proj.mul || 1);
    d.hp -= dmg; if (d.o.white) d.white = Math.min(d.max - d.hp, d.white + dmg * 0.35);
    a.dealt += dmg; d.taken += dmg; a.combo++; a.hits++; a.landed++; a.maxCombo = Math.max(a.maxCombo, a.combo); if (!proj) a.hit = true;
    this.gain(a, (m.su ? 0 : 0.1 + dmg * 0.012)); this.gain(d, 0.05);
    var air = d.y < 0 || m.kd || m.rise; d.mv = null; d.parry = 0; d.armor = 0;
    if (air) { d.st = "juggle"; d.stT = 0; d.vy = m.rise ? -520 : -360; d.vx = -d.face * (m.kb * 1.4); d.y = Math.min(d.y, -1); }
    else { d.st = "hitstun"; d.stT = 0; d.hs = m.hs + (ctr ? 8 : 0); d.vx = -d.face * m.kb * 2.2; }
    var hsN = m.su ? 5 : m.dmg >= 8 ? 12 : 8; this.hitstopAll(hsN); this.shake = Math.max(this.shake, m.shake || 0);
    var hx = d.x + d.face * 28, hy = GROUND - m.y - (d.y < 0 ? -d.y : 0); this.fx.push({ k: "spark", x: hx, y: hy, t: 0, life: m.dmg >= 8 ? 0.3 : 0.22, big: m.dmg >= 8 || m.su, col: a === this.P ? CH[a.cid].col : "#c58cff" });
    if (ctr) this.fx.push({ k: "txt", s: "COUNTER", x: d.x, y: 210, t: 0, life: 0.7 });
    if (d.hp <= 0) this.ko(a, d);
  };
  Game.prototype.gain = function (f, v) { f.meter = Math.min(3, f.meter + v * f.o.meterK); };
  Game.prototype.hitstopAll = function (n) { this.P.hitstop = Math.max(this.P.hitstop, n); this.E.hitstop = Math.max(this.E.hitstop, n); };
  Game.prototype.ko = function (a, d) { if (this.koT) return; d.hp = 0; this.koT = 1; this.freeze = 0; this.slowmo = 50; this.banner = { s: "K.O.", t: 0, life: 1.6 }; this.shake = 10; d.st = "juggle"; d.vy = -420; d.vx = -d.face * 260; d.y = Math.min(d.y, -1); this.roundWinner = a; };
  /* —— 波动（A 技）按构筑变形 —— */
  Game.prototype.fireA = function (f) {
    var sp = f === this.P ? this.special : "base", lvl = f === this.P ? this.spLv : 0, y = GROUND - 120, x = f.x + f.face * 60, s = this.shots, o = { owner: f, t: 0, hits: 1, mul: 1 };
    var cid = f.cid, base = cid === "rion" ? { vx: 700, life: 0.32, w: 70, h: 90, k: "slash" } : cid === "aya" ? { vx: 760, life: 1.6, w: 22, h: 14, k: "bullet", n: 2 } : { vx: 430, life: 2.4, w: 40, h: 40, k: "orb" };
    var mk = function (vx, vy, extra) { var q = Object.assign({ x: x, y: y, vx: vx * f.face, vy: vy || 0, w: base.w, h: base.h, life: base.life, k: base.k }, o, extra || {}); s.push(q); return q; };
    if (sp === "spread") { mk(base.vx, -80, { mul: 0.6 }); mk(base.vx, 0, { mul: 0.6 }); mk(base.vx, 80, { mul: 0.6 }); }
    else if (sp === "bomb") mk(380, -420, { grav: 1100, k: "bomb", boom: 90, life: 2, mul: 1.3 });
    else if (sp === "laser") { this.fx.push({ k: "beam", x: x, y: y, dir: f.face, t: 0, life: 0.25, col: f === this.P ? CH[f.cid].col : "#c58cff" }); mk(4000, 0, { w: 900, h: 30, life: 0.05, k: "beam", mul: 1.1 }); }
    else if (sp === "homing") mk(base.vx * 0.8, 0, { home: 1, k: "fox", life: 2.4 });
    else if (sp === "pierce") mk(base.vx, 0, { hits: 3, mul: 0.5, k: "pierce" });
    else { mk(base.vx, 0); if (base.n === 2) { var q2 = mk(base.vx, 0); q2.x -= f.face * 50; } }
  };
  Game.prototype.stepFighter = function (f) {
    var E = this.opp(f), m = f.mv;
    if (f.hitstop > 0) { f.hitstop--; return; }
    f.stT++; if (f.inv > 0) f.inv--;
    if (f.st === "move" || (f.st === "air" && m)) {
      f.mf++;
      if (m === MV.A && f.mf === m.st) this.fireA(f);
      if (m.dash && f.mf >= m.st && f.mf < m.st + m.ac) { f.vx = f.face * m.dash; if (f.tp && f.mf === m.st) { f.tp = 0; f.x = clamp(E.x + f.face * 70, STAGE_L, STAGE_R); f.face = -f.face; } }
      else if (f.st === "move") f.vx *= 0.7;
      if (m.rise && f.mf === m.st) { f.vy = -620; f.y = -1; f.vx = f.face * 120; }
      var hb = this.hitbox(f);
      if (hb && (!f.hit || (m.hits && (f.mf - m.st) % Math.max(1, Math.floor(m.ac / m.hits)) === 0 && f.multi < m.hits)) && E.inv <= 0 && E.st !== "down" && E.st !== "thrown") {
        var ey0 = GROUND + E.y, ylo = E.st === "crouch" ? 90 : 180; var hy = GROUND - hb.y - (f.y < 0 ? f.y : 0);
        if (E.x + 26 > hb.x0 && E.x - 26 < hb.x1 && hy > ey0 - (E.y < 0 ? 200 : ylo) - 20 && hy < ey0 + 20) {
          if (m.h === "throw") { if (E.y === 0 && E.st !== "hitstun" && E.st !== "juggle") this.applyHit(f, E, m); }
          else { if (m.hits) { f.multi++; if (f.multi > 1) { var keep = f.hit; this.applyHit(f, E, Object.assign({}, m, { dmg: m.dmg / m.hits * (this.route === "tech" && f === this.P ? 1.25 : 1), kd: f.multi >= m.hits ? 1 : 0, hs: 30, shake: 2 })); f.hit = keep || f.hit; } else this.applyHit(f, E, Object.assign({}, m, { dmg: m.dmg / m.hits * (this.route === "tech" && f === this.P ? 1.25 : 1), kd: 0, hs: 30 })); }
            else this.applyHit(f, E, m); }
        }
      }
      var tot = m.st + m.ac + m.rc + (f.o.boss && (m.sp || m.su) && !f.hit ? 14 : 0); // Boss 必杀落空/被防：额外破绽
      if (f.mf >= tot && f.y === 0) { f.mv = null; f.st = f.holdDir <= 3 ? "crouch" : "stand"; f.parry = 0; f.armor = 0; f.tele = 0; if (!f.hit) f.combo = 0; }
      if (m.air && f.y === 0) { f.mv = null; f.st = "stand"; }
    }
    if (f.st === "jsquat" && f.stT >= 4) { f.st = "air"; f.vy = -760; f.vx = f.jdir * f.face * 230; f.y = -1; }
    if (f.st === "dash") { if (f.stT > 16 || f.holdDir !== 6 && f.stT > 6) { f.st = "stand"; f.vx = 0; } }
    if (f.st === "backdash" && f.y === 0 && f.stT > 4) { f.st = "stand"; f.vx = 0; }
    if (f.st === "hitstun") { f.vx *= 0.85; if (f.stT >= f.hs) { f.st = "stand"; this.opp(f).combo = 0; } }
    if (f.st === "block") { f.vx *= 0.85; if (f.stT >= f.bs) f.st = f.holdDir <= 3 ? "crouch" : "stand"; }
    if (f.st === "thrown") { var A = f.thrownBy; if (f.stT === 12 && !f.thrTech) { f.thrTech = 0; f.st = "juggle"; f.vy = -380; f.vx = A.face * 380; f.y = -1; f.hp -= MV.thr.dmg * A.o.dmg * f.o.taken; A.dealt += MV.thr.dmg * A.o.dmg; A.landed++; this.shake = 6; this.fx.push({ k: "spark", x: f.x, y: GROUND - 100, t: 0, life: 0.3, big: 1, col: "#fff" }); if (f.hp <= 0) this.ko(A, f); } else if (f.thrTech) { f.thrTech = 0; this.applyHit(A, f, { h: "throw" }); f.st = "stand"; A.st = "stand"; A.mv = null; this.fx.push({ k: "txt", s: "拆投", x: f.x, y: 220, t: 0, life: 0.8 }); A.vx = -A.face * 300; f.vx = -f.face * 300; } }
    if (f.st === "down") { f.vx = 0; var dl = f.tech ? 14 : 40; if (f.stT >= dl) { f.st = "stand"; f.inv = 10; f.tech = 0; this.opp(f).combo = 0; if (f.stT === dl && dl === 14) this.fx.push({ k: "txt", s: "受身", x: f.x, y: 260, t: 0, life: 0.6 }); } }
    // 物理
    if (f.y < 0 || f.vy < 0) { f.vy += 2000 * DT; f.y += f.vy * DT; if (f.y >= 0) { f.y = 0; f.vy = 0; if (f.st === "juggle") { f.st = this.koT ? "dead" : "down"; f.stT = 0; this.shake = Math.max(this.shake, 3); } else if (f.st === "air") { f.st = "stand"; f.mv = null; f.vx = 0; } else if (f.st === "move" && f.mv && f.mv.rise) { } } }
    f.x = clamp(f.x + f.vx * DT, STAGE_L, STAGE_R);
    if (f.st === "stand" || f.st === "walk" || f.st === "crouch") { f.face = E.x > f.x ? 1 : -1; f.armorUsed = 0; }
    if (f.o.white && f.white > 0 && (f.st === "stand" || f.st === "walk") && E.st !== "move") { var rg = Math.min(f.white, 2.5 * DT); f.hp = Math.min(f.max, f.hp + rg); f.white -= rg; }
    if (f.guard > 0 && f.st !== "block") f.guard = Math.max(0, f.guard - 12 * DT);
  };
  Game.prototype.frameStep = function () {
    var P = this.P, E = this.E;
    this.hist.push({ P: snapF(P), E: snapF(E) }); if (this.hist.length > 30) this.hist.shift();
    if (this.pauseT > 0) { this.pauseT -= DT; return; }
    if (this.freeze > 0) { this.freeze--; this.control(P, !this.auto); this.control(E, false); return; }
    if (this.slowmo > 0) { this.slowmo--; if (this.slowmo % 2) return; if (this.slowmo === 0) return this.endRound(); }
    this.frame++; this.roundT += DT; this.t += DT;
    this.control(P, !this.auto); this.control(E, false);
    this.stepFighter(P); this.stepFighter(E);
    // 推挤
    var dx = E.x - P.x; if (Math.abs(dx) < 54 && P.y > -80 && E.y > -80) { var push = (54 - Math.abs(dx)) / 2 * (dx >= 0 ? 1 : -1); P.x = clamp(P.x - push, STAGE_L, STAGE_R); E.x = clamp(E.x + push, STAGE_L, STAGE_R); }
    // 飞行道具
    var self = this; this.shots.forEach(function (q) {
      if (q.dead) return; q.t += DT; q.life -= DT; if (q.life <= 0) { q.dead = 1; return; }
      var tg = self.opp(q.owner); if (q.home) { var ty = GROUND + tg.y - 110; q.vy += clamp(ty - q.y, -1, 1) * 900 * DT; }
      if (q.grav) q.vy += q.grav * DT; q.x += q.vx * DT; q.y += q.vy * DT;
      if (q.grav && q.y > GROUND - 10) { q.dead = 1; self.fx.push({ k: "boom", x: q.x, y: GROUND - 20, r: q.boom, t: 0, life: 0.35 }); if (Math.abs(tg.x - q.x) < q.boom && tg.inv <= 0) self.applyHit(q.owner, tg, Object.assign({}, MV.A, { kd: 1 }), q); return; }
      if (q.x < -100 || q.x > FW + 100) { q.dead = 1; return; }
      if (tg.inv <= 0 && tg.st !== "down" && Math.abs(tg.x - q.x) < 30 + q.w / 2 && q.y > GROUND + tg.y - (tg.st === "crouch" ? 100 : 200) && q.y < GROUND + tg.y + 10 && !(q.lastHit > 0)) {
        if (q.k === "orb" || q.k === "bullet") { var low = tg.st === "crouch" && q.k === "bullet"; if (low) return; }
        self.applyHit(q.owner, tg, MV.A, q); q.hits--; q.lastHit = 0.15; if (q.hits <= 0) q.dead = 1; }
      if (q.lastHit > 0) q.lastHit -= DT;
      self.shots.forEach(function (o2) { if (o2 !== q && !o2.dead && o2.owner !== q.owner && Math.abs(o2.x - q.x) < 30 && Math.abs(o2.y - q.y) < 40) { o2.dead = 1; q.dead = 1; self.fx.push({ k: "spark", x: q.x, y: q.y, t: 0, life: 0.2, col: "#fff" }); } });
    });
    this.shots = this.shots.filter(function (q) { return !q.dead; });
    if (this.roundT >= this.limit && !this.koT) { this.koT = 1; this.roundWinner = P.hp / P.max >= E.hp / E.max ? P : E; this.banner = { s: "TIME UP", t: 0, life: 1.4 }; this.slowmo = 40; }
  };
  function snapF(f) { return { x: f.x, y: f.y, vy: f.vy, st: f.st, mv: !!f.mv, mf: f.mf, mvst: f.mv ? f.mv.st : 0, mvac: f.mv ? f.mv.ac : 0, h: f.mv ? f.mv.h : null }; }
  Game.prototype.endRound = function () {
    var w = this.roundWinner || this.P; w.wins++; this.koT = 0;
    if (this.P.wins >= 2 || this.E.wins >= 2) return this.end(this.P.wins >= 2);
    this.round++; var P = this.P, E = this.E;
    [P, E].forEach(function (f) { f.x = f.side < 0 ? 300 : 660; f.y = 0; f.vx = f.vy = 0; f.st = "stand"; f.mv = null; f.combo = 0; f.guard = 0; f.inv = 0; f.white = 0; });
    P.hp = Math.max(P.hp, P.max * 0.35) + (w === E ? P.max * 0.25 : 0); P.hp = Math.min(P.max, P.hp); E.hp = E.max; // KOF 式：输的一方补一点血；赢家血量保留（夜行带入的伤势仍有影响）
    if (w === P) E.hp = E.max; this.roundT = 0; this.shots = []; this.banner = { s: "ROUND " + this.round, t: 0, life: 1.2 }; this.pauseT = 1.0;
  };
  Game.prototype.end = function (win) { if (this.done) return; this.done = true; this.win = win; this.o.onEnd && this.o.onEnd(this.result()); };
  Game.prototype.result = function () { var P = this.P; return { win: !!this.win, hpFrac: this.win ? clamp(P.hp / P.max * this.hpIn + 0.15, 0.05, 1) : 0, time: +this.t.toFixed(1), hits: P.landed, taken: Math.round(P.taken), special: this.special, maxCombo: P.maxCombo, rounds: [P.wins, this.E.wins], foe: this.E.cid }; };
  Game.prototype.update = function (dt) {
    if (this.done) return; this.acc += dt;
    while (this.acc >= DT && !this.done) { this.acc -= DT; this.frameStep();
      this.fx = this.fx.filter(function (f) { f.t += DT; return f.t < f.life; }); if (this.banner) { this.banner.t += DT; if (this.banner.t > this.banner.life) this.banner = null; } if (this.shake > 0) this.shake = Math.max(0, this.shake - 0.6); }
  };
  /* —— 姿势选择（每个动作 = 关键帧 pose-hold，切换不做混合 → 无重影） —— */
  Game.prototype.pose = function (f) {
    var m = f.mv;
    if (f.st === "dead" || f.st === "down") return "down"; if (f.st === "juggle" || f.st === "thrown") return "hit2"; if (f.st === "hitstun") return f.stT < 6 ? "hit" : "hit2";
    if (f.st === "block") return f.blockH === "low" ? "cblock" : "block";
    if (m) { // AIR 式动作表：按前摇 / 发生 / 收招三段各自的帧数，把关键帧均分到该段（与 MUGEN .air 的 element ticks 同理）
      var ph = f.mf < m.st ? 0 : f.mf < m.st + m.ac ? 1 : 2, A = ANIM[m.pose] || { s: ["idle_b"], a: [m.pose], r: ["idle"] }, seq = ph === 0 ? A.s : ph === 1 ? A.a : A.r,
        len = ph === 0 ? m.st : ph === 1 ? m.ac : m.rc, t0 = ph === 0 ? 0 : ph === 1 ? m.st : m.st + m.ac, k = Math.min(seq.length - 1, Math.floor((f.mf - t0) / Math.max(1, len) * seq.length));
      return seq[Math.max(0, k)]; }
    if (f.st === "air" || f.st === "backdash") return f.vy < -300 ? "jump_up" : f.vy > 250 ? "jump_fall" : "jump"; if (f.st === "jsquat" || f.st === "crouch") return "crouch";
    if (f.st === "dash") return "dash";
    if (f.st === "walk") { var wi = Math.floor(this.frame / 5) % 8; if (f.vx * f.face < 0) wi = 7 - wi; return "walk_" + wi; } // 8 帧走路循环（后退倒放）
    return ["idle", "idle_m", "idle_b", "idle_m"][Math.floor(this.frame / 12) % 4]; // 待机呼吸：两张关键帧 + RIFE 中间帧（位移小，无重影）
  };
  Game.prototype.draw = function (g, img, W, H) {
    var sc = Math.min(W / FW, H / FH), ox = (W - FW * sc) / 2, oy = (H - FH * sc) / 2, self = this, sh = this.shake ? (this.r() - 0.5) * this.shake * 2 : 0;
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = "#07050d"; g.fillRect(0, 0, W, H);
    g.setTransform(sc, 0, 0, sc, ox + sh * sc, oy + (this.shake ? (this.r() - 0.5) * this.shake : 0) * sc);
    var st = img.stage; if (st && st.width) g.drawImage(st, 0, 0, FW, FH); else { g.fillStyle = "#1a1030"; g.fillRect(0, 0, FW, FH); }
    var sup = this.fx.find(function (q) { return q.k === "super"; }); if (sup || this.freeze > 0) { g.fillStyle = "rgba(8,0,20,.72)"; g.fillRect(0, 0, FW, FH); }
    g.fillStyle = "rgba(0,0,0,.22)"; g.fillRect(0, GROUND, FW, FH - GROUND);
    [[this.E, img.foe, true], [this.P, img.me, false]].forEach(function (pr) {
      var f = pr[0], set = pr[1] || {}, ps = self.pose(f), FB = { hp_s: "idle_b", special_s: "idle_b", jump_up: "jump", jump_fall: "jump", dash: "walk1", lp_s: "idle_b", lp_r: "idle", hp_r: "hp", dp_r: "crouch", super_r: "super", rush_r: "rush", throw_s: "throw", jatk_s: "jump" }, im = set[ps] && set[ps].width ? set[ps] : set[FB[ps] || (ps.indexOf("walk_") === 0 ? (+ps.slice(5) < 4 ? "walk1" : "walk2") : "idle")] && set[FB[ps] || (ps.indexOf("walk_") === 0 ? (+ps.slice(5) < 4 ? "walk1" : "walk2") : "idle")].width ? set[FB[ps] || (ps.indexOf("walk_") === 0 ? (+ps.slice(5) < 4 ? "walk1" : "walk2") : "idle")] : set.idle, x = f.x, y = GROUND + f.y + 7, h = 265;
      g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(x, GROUND + 4, 52, 10, 0, 0, 7); g.fill();
      var m = f.mv, ph = m ? (f.mf < m.st ? 0 : f.mf < m.st + m.ac ? 1 : 2) : -1, sx = 1, sy = 1, rot = 0, jit = 0;
      // 程序性补正：发生帧拉伸（stretch）、受击压扁（squash）+ 弹簧式回正、起跳拉伸 / 蹲跳压扁、受击方额外抖动（MUGEN HitDef 的 p2 shaketime）
      if (ph === 1 && f.mf - m.st < 3) { sx = 1.08; sy = 0.95; } else if (ph === 0 && STRONG[m.pose]) { sx = 0.96; sy = 1.03; }
      if (f.st === "hitstun" || f.st === "juggle") { var e = Math.exp(-f.stT / 6); sx = 1 - 0.12 * e; sy = 1 + 0.06 * e; rot = -0.08 * e * Math.cos(f.stT * 0.8); }
      if (f.st === "jsquat") { sx = 1.1; sy = 0.88; } else if (f.st === "air" && f.vy < -300) { sx = 0.94; sy = 1.07; }
      if (f.hitstop > 0 && (f.st === "hitstun" || f.st === "block" || f.st === "juggle")) jit = (f.hitstop % 2 ? 4 : -4);
      // 残影：发生帧、突进、冲刺、超必杀时，画出前几帧位置的半透明拖影
      f.trail = f.trail || []; var ghost = (ph === 1 && STRONG[m.pose]) || f.st === "dash" || (m && m.dash && ph < 2);
      if (ghost && f.hitstop <= 0) f.trail.push({ x: x, y: y, im: im }); else if (!ghost) f.trail.length = 0; if (f.trail.length > 4) f.trail.shift();
      f.trail.forEach(function (q, i) { if (!q.im || !q.im.width) return; var ww = h * q.im.width / q.im.height; g.save(); g.translate(q.x, q.y); g.scale(f.face, 1); g.globalAlpha = 0.12 + 0.07 * i; g.filter = "brightness(1.6) sepia(1) hue-rotate(" + (pr[2] ? 220 : 280) + "deg) saturate(3)"; g.drawImage(q.im, -ww / 2, -h, ww, h); g.restore(); });
      g.save(); g.translate(x + jit, y); g.scale(f.face * sx, sy); g.rotate(rot);
      if (f.st === "down" || f.st === "dead") { g.translate(0, 0); }
      if (im && im.width) { var w = h * im.width / im.height; if (pr[2]) g.filter = "brightness(.8) saturate(.7) contrast(1.1) drop-shadow(0 0 6px " + (self.E.o.boss ? "#ff3355" : "#b06cff") + ")"; if (f.hitstop > 0 && f.st === "hitstun") g.filter = "brightness(1.8)"; g.drawImage(im, -w / 2, -h, w, h); g.filter = "none"; }
      else { g.fillStyle = pr[2] ? "#6a4a9a" : CH[f.cid].col; var crouch = ps === "crouch" || ps === "clp" || ps === "chp" || ps === "cblock"; g.fillRect(-26, crouch ? -120 : -210, 52, crouch ? 120 : 210); if (ps === "lp" || ps === "hp" || ps === "clp" || ps === "chp" || ps === "jatk" || ps === "dp" || ps === "rush" || ps === "super") { g.fillStyle = "#fff"; g.fillRect(20, crouch ? -60 : -140, (f.mv && f.mv.reach) || 60, 14); } }
      if (ph === 1 && STRONG[m.pose]) { // 刀光（程序化的涂抹帧）：沿攻击方向画一道渐隐弧光
        var k = (f.mf - m.st) / Math.max(1, m.ac), cy = -(m.y || 120) - 20, R0 = (m.reach || 90) + 20; g.save(); g.globalCompositeOperation = "lighter";
        for (var j = 0; j < 3; j++) { g.globalAlpha = (0.55 - j * 0.15) * (1 - k * 0.6); g.strokeStyle = j ? (pr[2] ? "#b98cff" : CH[f.cid].col) : "#fff"; g.lineWidth = 14 - j * 4; g.beginPath(); g.arc(0, cy, R0 - j * 10, m.pose === "dp" ? -2.4 : -1.1, m.pose === "dp" ? -0.5 + k : 0.4 + k * 0.6); g.stroke(); }
        g.restore(); }
      if (self.o.clsn || global.__duelClsn) { g.save(); g.scale(1 / sx, 1 / sy); g.lineWidth = 2; g.strokeStyle = "#3b8bff"; g.strokeRect(-30, -(f.st === "crouch" || (m && m.crouch) ? 130 : 220), 60, f.st === "crouch" || (m && m.crouch) ? 130 : 220); // Clsn2（蓝，受击框）
        if (ph === 1 && m.reach) { g.strokeStyle = "#ff3344"; g.strokeRect(20, -(m.y || 120) - 20, m.reach - 20, 40); } g.restore(); } // Clsn1（红，攻击框）
      if (f.tele && f.mv && f.mf < 0) { g.fillStyle = "#ff3355"; g.font = "bold 40px sans-serif"; g.textAlign = "center"; g.fillText("!", 0, -h - 10); }
      g.restore();
      if (f.inv > 0 && f.st === "stand") { g.strokeStyle = "rgba(255,255,255,.4)"; g.beginPath(); g.ellipse(x, y - 120, 60, 130, 0, 0, 7); g.stroke(); }
    });
    this.shots.forEach(function (q) { var col = q.owner === self.P ? CH[q.owner.cid].col : "#b98cff"; g.save(); g.globalCompositeOperation = "lighter"; g.fillStyle = col;
      if (q.k === "slash") { g.globalAlpha = 0.7; g.beginPath(); g.ellipse(q.x, q.y, 22, 46, 0, q.vx > 0 ? -1.4 : 1.7, q.vx > 0 ? 1.4 : 4.6); g.lineWidth = 10; g.strokeStyle = col; g.stroke(); }
      else if (q.k === "beam") { }
      else { var rr = q.k === "bomb" ? 16 : q.k === "bullet" ? 8 : 18; var gr = g.createRadialGradient(q.x, q.y, 2, q.x, q.y, rr * 1.8); gr.addColorStop(0, "#fff"); gr.addColorStop(0.4, col); gr.addColorStop(1, "transparent"); g.fillStyle = gr; g.beginPath(); g.arc(q.x, q.y, rr * 1.8, 0, 7); g.fill(); }
      g.restore(); });
    this.fx.forEach(function (f) { var a = 1 - f.t / f.life; g.globalAlpha = Math.max(0, a);
      if (f.k === "spark") { g.save(); g.translate(f.x, f.y); g.globalCompositeOperation = "lighter"; g.fillStyle = f.col || "#fff"; var n = f.big ? 10 : 7, R = (f.big ? 70 : 44) * (0.5 + f.t / f.life); for (var i = 0; i < n; i++) { g.rotate(Math.PI * 2 / n); g.beginPath(); g.moveTo(0, -4); g.lineTo(R, 0); g.lineTo(0, 4); g.fill(); } g.fillStyle = "#fff"; g.beginPath(); g.arc(0, 0, f.big ? 16 : 10, 0, 7); g.fill(); g.restore(); }
      else if (f.k === "guard") { g.strokeStyle = "#8fd8ff"; g.lineWidth = 5; g.beginPath(); g.arc(f.x, f.y, 34 + f.t * 80, -1.2, 1.2); g.stroke(); }
      else if (f.k === "boom") { g.strokeStyle = "#ffb36b"; g.lineWidth = 10; g.beginPath(); g.arc(f.x, f.y, f.r * (0.4 + f.t / f.life), 0, 7); g.stroke(); }
      else if (f.k === "beam") { g.fillStyle = f.col; g.fillRect(f.dir > 0 ? f.x : 0, f.y - 14, f.dir > 0 ? FW - f.x : f.x, 28); g.fillStyle = "#fff"; g.fillRect(f.dir > 0 ? f.x : 0, f.y - 4, f.dir > 0 ? FW - f.x : f.x, 8); }
      else if (f.k === "txt") { g.fillStyle = "#ffd76a"; g.strokeStyle = "#000"; g.lineWidth = 5; g.font = "bold 30px sans-serif"; g.textAlign = "center"; g.strokeText(f.s, f.x, f.y - f.t * 30); g.fillText(f.s, f.x, f.y - f.t * 30); }
      else if (f.k === "glint") { g.fillStyle = "#fff"; g.save(); g.translate(f.f.x + f.f.face * 30, GROUND + f.f.y - 170); g.rotate(f.t * 6); g.fillRect(-26 * a, -2, 52 * a, 4); g.fillRect(-2, -26 * a, 4, 52 * a); g.restore(); }
      else if (f.k === "super") { var pimg = f.f === self.P ? img.meCut : img.foeCut; g.globalAlpha = Math.min(1, a * 2); g.fillStyle = f.f === self.P ? "rgba(255,120,180,.5)" : "rgba(150,90,255,.5)"; g.fillRect(0, FH * 0.3, FW, FH * 0.32); if (pimg && pimg.width) { var ph = FH * 0.6, pw = ph * pimg.width / pimg.height, px = f.f.side < 0 ? 40 + (1 - a) * 120 : FW - pw - 40 - (1 - a) * 120; g.drawImage(pimg, px, FH * 0.08, pw, ph); } }
      g.globalAlpha = 1; });
    // HUD
    var bar = function (x, f, right) { var v = Math.max(0, f.hp / f.max), wv = Math.max(0, (f.hp + f.white) / f.max); g.fillStyle = "#000a"; g.fillRect(x, 18, 380, 20); g.fillStyle = "#ffffff55"; g.fillRect(right ? x + 380 - 380 * wv : x, 18, 380 * wv, 20); g.fillStyle = v < 0.3 ? "#ff5d5d" : "#ffd76a"; g.fillRect(right ? x + 380 - 380 * v : x, 18, 380 * v, 20); g.strokeStyle = "#fff8"; g.strokeRect(x, 18, 380, 20);
      for (var i = 0; i < 3; i++) { g.fillStyle = f.meter >= i + 1 ? "#5fd8ff" : "#ffffff22"; var mw = 70, mx = right ? x + 380 - (i + 1) * (mw + 6) : x + i * (mw + 6); g.fillRect(mx, FH - 34, mw, 12); if (f.meter > i && f.meter < i + 1) { g.fillStyle = "#5fd8ff88"; g.fillRect(mx, FH - 34, mw * (f.meter - i), 12); } }
      for (i = 0; i < f.wins; i++) { g.fillStyle = "#ff5f9e"; g.beginPath(); g.arc(right ? x + 380 - 10 - i * 22 : x + 10 + i * 22, 50, 7, 0, 7); g.fill(); }
      if (f.guard > 1) { g.fillStyle = "#8fd8ff"; g.fillRect(right ? x + 380 - 120 * f.guard / 100 : x, 40, 120 * f.guard / 100, 4); } };
    bar(30, this.P, false); bar(FW - 410, this.E, true);
    g.fillStyle = "#fff"; g.font = "bold 32px sans-serif"; g.textAlign = "center"; g.fillText(Math.max(0, Math.ceil(this.limit - this.roundT)), FW / 2, 44);
    g.font = "15px sans-serif"; g.textAlign = "left"; g.fillText(this.ch.name, 30, 74); g.textAlign = "right"; g.fillText(this.E.name, FW - 30, 74);
    [this.P, this.E].forEach(function (f) { if (f.combo >= 2) { g.font = "bold 36px sans-serif"; g.textAlign = f.side < 0 ? "left" : "right"; g.fillStyle = "#ffd76a"; g.strokeStyle = "#000"; g.lineWidth = 5; var cx = f.side < 0 ? 30 : FW - 30; g.strokeText(f.combo + " HIT", cx, 150); g.fillText(f.combo + " HIT", cx, 150); } });
    if (this.banner) { var b = this.banner, al = Math.min(1, b.t * 5, (b.life - b.t) * 4); g.globalAlpha = Math.max(0, al); g.font = "bold 60px sans-serif"; g.textAlign = "center"; g.fillStyle = "#fff"; g.strokeStyle = "#ff3d8a"; g.lineWidth = 8; var by = b.side ? FH * 0.72 : FH / 2; g.font = b.side ? "bold 40px sans-serif" : "bold 60px sans-serif"; g.strokeText(b.s, FW / 2, by); g.fillText(b.s, FW / 2, by); g.globalAlpha = 1; }
    g.setTransform(1, 0, 0, 1, 0, 0);
  };
  Game.prototype.snapshot = function () { var P = this.P, E = this.E; return { t: +this.t.toFixed(2), round: this.round, wins: [P.wins, E.wins], hp: +(P.hp / P.max).toFixed(3), foeHp: +(E.hp / E.max).toFixed(3), meter: +P.meter.toFixed(2), foeMeter: +E.meter.toFixed(2), combo: P.combo, maxCombo: P.maxCombo, st: P.st, foeSt: E.st, move: P.mn && P.mv ? P.mn : null, foeMove: E.mn && E.mv ? E.mn : null, x: Math.round(P.x), foeX: Math.round(E.x), done: this.done, win: this.win, special: this.special, ch: this.cid, foe: E.cid, form: this.slot, route: this.route, pose: this.pose(P) }; };
  /* —— DOM 外壳 —— */
  var POSES = ["idle", "idle_m", "idle_b", "walk1", "walk2", "crouch", "jump", "lp", "hp", "clp", "chp", "jatk", "block", "cblock", "hit", "hit2", "down", "throw", "special", "dp", "rush", "super", "win", "walk_0", "walk_1", "walk_2", "walk_3", "walk_4", "walk_5", "walk_6", "walk_7", "hp_s", "special_s", "jump_up", "jump_fall", "dash", "lp_s", "lp_r", "hp_r", "dp_r", "super_r", "rush_r", "throw_s", "jatk_s"];
  var CSS = "#duel46{position:fixed;inset:0;z-index:125;background:#07050d;touch-action:none;user-select:none;color:#fff}#duel46 canvas{position:absolute;inset:0;width:100%;height:100%}#duel46 .dstk46{position:absolute;left:max(18px,env(safe-area-inset-left));bottom:18px;width:150px;height:150px;border-radius:50%;background:#ffffff14;border:2px solid #ffffff33}#duel46 .dstk46 i{position:absolute;left:50%;top:50%;width:60px;height:60px;margin:-30px;border-radius:50%;background:#ffffff44;transform:translate(var(--x,0),var(--y,0))}#duel46 .dact46{position:absolute;right:max(14px,env(safe-area-inset-right));bottom:14px;display:grid;grid-template-columns:repeat(3,64px);gap:8px}#duel46 .dact46 button{width:64px;height:64px;padding:0;line-height:1.1;border-radius:50%;border:2px solid #ffffff44;background:#1a1230cc;color:#fff;font-weight:700;font-size:14px}#duel46 .dact46 button.on{border-color:#5fd8ff;box-shadow:0 0 12px #5fd8ff}#duel46 .res{position:absolute;inset:0;display:grid;place-items:center;background:#06040ccc}#duel46 .res .box{text-align:center}#duel46 .res button{margin-top:14px;padding:12px 26px;border-radius:999px;border:0;background:#ff5f9e;color:#fff;font-size:15px}#duel46 .help{position:absolute;bottom:4px;left:50%;transform:translateX(-50%);font-size:11px;color:#ffffffaa;text-align:center;pointer-events:none;white-space:nowrap}";
  var cur = null, raf = 0;
  function start(o) {
    stop(); o = o || {};
    if (!document.getElementById("duel46css")) { var st = document.createElement("style"); st.id = "duel46css"; st.textContent = CSS; document.head.appendChild(st); }
    var root = document.createElement("div"); root.id = "duel46";
    root.innerHTML = '<canvas></canvas><div class="dstk46"><i></i></div><div class="dact46"><button data-p="L">轻<br><small>J</small></button><button data-p="H">重<br><small>K</small></button><button data-p="T">投<br><small>J+K</small></button><button data-p="SP">必杀<br><small>↓↘→</small></button><button data-p="SU" class="su">超必<br><small>1 气</small></button><button data-p="BK">防<br><small>←</small></button></div><div class="help">↓↘→+拳 波动 · →↓↘+拳 升龙 · ↓↙←+拳 突进 · ↓↘→↓↘→+拳 超必杀 · →→ 冲刺 · 防御中 →+J+K 反击</div>';
    (o.parent || document.body).appendChild(root);
    var cv = root.querySelector("canvas"), g = cv.getContext("2d"), img = {};
    var art = function (p) { var i = new Image(); i.src = o.art ? o.art(p) : "art/" + p; return i; };
    img.stage = art("duel/stage" + (((o.layer || 1) - 1) % 3 + 1) + ".webp");
    var game = new Game(Object.assign({}, o, { onEnd: function (r) { var el = document.createElement("div"); el.className = "res"; el.innerHTML = '<div class="box"><h2>' + (r.win ? "镜斗胜利" : "败北") + "</h2><p>" + r.rounds[0] + " : " + r.rounds[1] + " · 用时 " + r.time + " s · 最大连击 " + r.maxCombo + " · 承伤 " + r.taken + '</p><button class="ok">' + (o.okText || "继续") + "</button></div>"; root.appendChild(el); el.querySelector(".ok").onclick = function () { stop(); o.onClose && o.onClose(r); }; o.onEnd && o.onEnd(r); } }));
    var set = function (c) { var S = {}; POSES.forEach(function (k) { S[k] = art("duel/" + c + "/" + k + ".webp"); }); return S; };
    img.me = set(game.cid); img.foe = set(game.E.cid);
    img.meCut = art("characters/" + game.cid + "/default/avg_resolve.webp"); img.foeCut = art("characters/" + game.E.cid + "/default/avg_angry.webp");
    game.auto = !!o.auto; game.root = root; cur = game;
    // 摇杆
    var stick = root.querySelector(".dstk46"), knob = stick.querySelector("i"), sid = null;
    var mv = function (e) { var r = stick.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), l = Math.hypot(dx, dy), k = Math.min(1, 50 / (l || 1)); knob.style.setProperty("--x", dx * k + "px"); knob.style.setProperty("--y", dy * k + "px"); var a = Math.atan2(dy, dx); game.touch.ax = l < 18 ? 0 : Math.abs(Math.cos(a)) > 0.38 ? Math.sign(dx) : 0; game.touch.ay = l < 18 ? 0 : Math.abs(Math.sin(a)) > 0.38 ? Math.sign(dy) : 0; };
    stick.addEventListener("pointerdown", function (e) { sid = e.pointerId; stick.setPointerCapture(e.pointerId); mv(e); }); stick.addEventListener("pointermove", function (e) { if (e.pointerId === sid) mv(e); });
    var rel = function (e) { if (e.pointerId !== sid) return; sid = null; game.touch.ax = game.touch.ay = 0; knob.style.setProperty("--x", "0px"); knob.style.setProperty("--y", "0px"); }; stick.addEventListener("pointerup", rel); stick.addEventListener("pointercancel", rel);
    root.querySelectorAll("[data-p]").forEach(function (b) { var p = b.dataset.p; b.addEventListener("pointerdown", function (e) { e.preventDefault(); if (p === "BK") { game.touch.ax = -game.P.face; return; } game.press(p); }); if (p === "BK") ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) { b.addEventListener(ev, function () { game.touch.ax = 0; }); }); });
    var map = { j: "L", J: "L", k: "H", K: "H", l: "T", L: "T" };
    game.kd = function (e) { if (e.repeat) return; game.keys[e.key] = 1; if (map[e.key]) game.press(map[e.key]); }; game.ku = function (e) { game.keys[e.key] = 0; };
    addEventListener("keydown", game.kd); addEventListener("keyup", game.ku);
    var paint = function () { var dpr = Math.min(global.devicePixelRatio || 1, 2), W = Math.round(cv.clientWidth * dpr), H = Math.round(cv.clientHeight * dpr); if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; } game.draw(g, img, W, H); root.querySelector(".su").classList.toggle("on", game.P.meter >= 1); };
    game.paint = paint; var t0 = performance.now();
    var loop = function (now) { raf = requestAnimationFrame(loop); var dt = Math.min(0.05, (now - t0) / 1000); t0 = now; if (global.__duelManual) return; game.update(dt); paint(); };
    raf = requestAnimationFrame(loop); return game;
  }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; if (cur) { removeEventListener("keydown", cur.kd); removeEventListener("keyup", cur.ku); cur.root && cur.root.remove(); } cur = null; }
  function simulate(o, maxT) { var g = new Game(o); g.auto = true; for (var t = 0; t < (maxT || 400) && !g.done; t += DT) g.update(DT); return Object.assign(g.result(), { done: g.done }); }
  global.SakurayoDuel = { Game: Game, MV: MV, CMD: CMD, POSES: POSES, start: start, stop: stop, simulate: simulate, current: function () { return cur; }, step: function (dt) { if (cur) { cur.update(dt); cur.paint(); } }, FW: FW, FH: FH, CH: CH };
})(typeof window !== "undefined" ? window : globalThis);
