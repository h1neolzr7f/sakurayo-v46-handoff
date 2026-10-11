/* 夜行 · 肉鸽一局（docs/DESIGN_V5.md §3.2，路线图 P0）。纯逻辑，无 DOM：
   地图生成（层 × 行 × 2–3 个节点，分支连线）、节点类型、路线推进、局内资源（魂晶）、遗物、
   事件/商店/神社选项、战斗节点 → 关卡规格（复用 SakurayoLevels 的目标类型）、序列化。
   构筑（玩家对象快照）由游戏侧保存进 state.build；本模块只负责保存与筛掉瞬时字段。
   遗物只在本局生效，局外收藏不提供任何战斗属性。 */
(function (global) {
  "use strict";
  var LAYERS = 3, ROWS = 6;
  var NODE = {
    fight: { n: "战斗", i: "⚔", d: "击退尸潮。胜利获得魂晶。" },
    elite: { n: "精英", i: "☠", d: "限时击破强化目标。胜利后三选一遗物。" },
    goal: { n: "委托", i: "📜", d: "护送 / 机关 / 读取 / 限时目标。" },
    event: { n: "事件", i: "❔", d: "镜界里的偶遇，选项有得有失。" },
    shop: { n: "商店", i: "🏮", d: "用魂晶购买治疗、强化与遗物。" },
    shrine: { n: "神社", i: "⛩", d: "休整：回复生命或获得一次强化。" },
    sky: { n: "镜空", i: "✦", d: "弹幕射击：本人飞上镜空，低速显示判定点、擦弹攒符、符卡 Boss。构筑映射为射击方式。" },
    duel: { n: "镜斗", i: "🥋", d: "格斗：与镜中倒影一对一。构筑决定必杀技，形态改变攻防节奏。" },
    mask: { n: "面具摊", i: "🎭", d: "狸老板的面具摊：戴上面具切换形态（每层 1 次）。" },
    boss: { n: "层主", i: "👹", d: "本层 Boss。击破后进入下一层。" }
  };
  /* 路线（开局选择，整局不变）：科技线 / 生物线。决定 Boss 战默认推荐的模式、遗物池、强化倾向与形态的视觉表现。
     Boss 前三种模式（割草 / 格斗 / 弹幕）都可以自由选，路线只决定推荐项。 */
  var ROUTES = {
    tech: { id: "tech", n: "科技线", i: "⚙", rec: "sky", tint: "#5fd8ff", d: "式神机关与符文电路：激光、追踪、浮游炮。Boss 战推荐弹幕射击。",
      relics: ["sake", "mirror", "gear", "coil", "lantern", "coin"], up: { laser: 3, homing: 3, orbit: 3, spread: 1, pierce: 1, bomb: 1 } },
    bio: { id: "bio", n: "生物线", i: "🌿", rec: "duel", tint: "#ff5f7a", d: "血藤、蛊虫与妖化：散射孢子、贯穿荆棘、爆裂瘤。Boss 战推荐格斗。",
      relics: ["petal", "bell", "omamori", "geta", "vine", "fang"], up: { spread: 3, pierce: 3, bomb: 3, laser: 1, homing: 1, orbit: 1 } }
  };
  var BOSS_MODES = [{ k: "mow", n: "割草", i: "⚔", d: "原本的俯视角乱战：走位、拾取、构筑全开。" }, { k: "duel", n: "格斗", i: "🥋", d: "一对一格斗：搓招、连段、超必杀。构筑映射为招式。" }, { k: "sky", n: "弹幕射击", i: "✦", d: "本人飞行的弹幕 STG：低速判定点、擦弹、Bomb、符卡。" }];
  function route(st) { return ROUTES[st && st.route] || ROUTES.tech; }
  function bossModes(st) { var rec = route(st).rec; return BOSS_MODES.map(function (m) { return Object.assign({ rec: m.k === rec }, m); }); }
  var LAYER_NAMES = ["神社外街", "雨夜商圈", "黄泉参道"];
  var RELICS = [
    { id: "petal", n: "樱瓣护符", i: "🌸", d: "攻击力 +12%", fx: { dmgMul: 1.12 } },
    { id: "bell", n: "铃之残响", i: "🔔", d: "最大生命 +20", fx: { maxHp: 20 } },
    { id: "lantern", n: "引魂灯", i: "🏮", d: "拾取范围 +40", fx: { mag: 40 } },
    { id: "geta", n: "疾风木屐", i: "👡", d: "移速 +8%", fx: { spdMul: 1.08 } },
    { id: "mirror", n: "裂镜片", i: "🪞", d: "暴击率 +6%", fx: { crit: 0.06 } },
    { id: "omamori", n: "平安守", i: "🧧", d: "每进入战斗节点回复 8% 生命", fx: { nodeHeal: 0.08 } },
    { id: "sake", n: "御神酒", i: "🍶", d: "射速 +8%", fx: { rateMul: 0.926 } },
    { id: "coin", n: "五円硬币", i: "🪙", d: "魂晶收益 +25%", fx: { shardMul: 1.25 } },
    { id: "gear", n: "式神齿轮", i: "⚙", d: "射速 +10%（科技线）", fx: { rateMul: 0.91 } },
    { id: "coil", n: "雷符线圈", i: "⚡", d: "暴击率 +8%（科技线）", fx: { crit: 0.08 } },
    { id: "vine", n: "血藤心", i: "🌿", d: "最大生命 +30（生物线）", fx: { maxHp: 30 } },
    { id: "fang", n: "妖牙", i: "🦷", d: "攻击力 +10%、移速 +4%（生物线）", fx: { dmgMul: 1.1, spdMul: 1.04 } }
  ];
  var GOALS = [ // objective templates per layer (from SakurayoLevels types)
    [{ type: "escort", goal: { path: [[0.18, 0.5], [0.4, 0.38], [0.62, 0.6], [0.84, 0.48]] }, npc: "miko", n: "送灯" }, { type: "mech", goal: { n: 2 }, n: "符咒机关" }],
    [{ type: "timed", goal: { n: 3, limit: 80 }, n: "回收车" }, { type: "mech", goal: { n: 3 }, n: "监控墙" }],
    [{ type: "channel", goal: { t: 24 }, n: "事故日志" }, { type: "timed", goal: { n: 5, limit: 100, flee: 1 }, n: "无主飞剑" }]
  ];
  var MOVES = ["moveDash", "moveSkill"]; // reserved for P1 forms

  function rng(seed) { var s = (seed >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  function pickW(r, w) { var t = 0, k; for (k in w) t += w[k]; var x = r() * t; for (k in w) { x -= w[k]; if (x <= 0) return k; } return k; }

  function generate(seed) {
    var r = rng(seed), layers = [];
    for (var L = 0; L < LAYERS; L++) {
      var rows = [];
      for (var row = 0; row < ROWS; row++) {
        var n = row === 0 || row === ROWS - 1 ? 1 : row === 1 ? 2 : 2 + (r() < 0.6 ? 1 : 0), nodes = [];
        for (var i = 0; i < n; i++) {
          var t = row === 0 ? "fight" : row === ROWS - 1 ? "boss" : row === ROWS - 2 ? (i === 0 ? "shrine" : pickW(r, { shop: 2, fight: 2, event: 1 }))
            : pickW(r, row === 1 ? { fight: 4, event: 2, goal: 2 } : { fight: 3, elite: row >= 2 ? 2 : 0, goal: 2, event: 2, shop: row === 2 ? 1 : 0.5 });
          nodes.push({ id: L + 1 + "-" + row + "-" + i, layer: L + 1, row: row, col: i, type: t, x: 8 + row * (84 / (ROWS - 1)), y: n === 1 ? 50 : 20 + i * (60 / (n - 1)) + (r() - 0.5) * 6, next: [] });
        }
        rows.push(nodes);
      }
      for (row = 0; row < ROWS - 1; row++) {
        var a = rows[row], b = rows[row + 1];
        for (i = 0; i < a.length; i++) {
          var lo = Math.floor(i * b.length / a.length), hi = Math.ceil((i + 1) * b.length / a.length) - 1;
          for (var j = lo; j <= Math.max(lo, hi); j++) if (a[i].next.indexOf(b[j].id) < 0) a[i].next.push(b[j].id);
        }
        for (j = 0; j < b.length; j++) if (!a.some(function (q) { return q.next.indexOf(b[j].id) >= 0; })) a[Math.min(a.length - 1, Math.round(j * (a.length - 1) / Math.max(1, b.length - 1)))].next.push(b[j].id);
      }
      rows[2][rows[2].length - 1].type = "mask"; // 每层保证一个面具摊（形态切换，DESIGN_V5 §1.3）
      rows[3][0].type = "sky"; rows[2][0].type = "duel"; // 每层各一个弹幕/格斗试炼节点（弹珠已退出夜行地图，改为大厅抽奖小游戏）
      // goal node variant per layer
      rows.forEach(function (rw) { rw.forEach(function (nd) { if (nd.type === "goal") nd.goal = Math.floor(r() * GOALS[L].length); if (nd.type === "fight") nd.fight = r() < 0.5 ? "survive" : "clear"; }); });
      layers.push(rows);
    }
    return layers;
  }
  function create(seed, character, rt) {
    seed = (seed >>> 0) || ((Date.now() ^ (Math.random() * 1e9)) >>> 0);
    return { v: 1, seed: seed, character: character || "sayo", map: generate(seed), layer: 1, at: null, path: [], shards: 0, relics: [], pending: [], build: null, hpFrac: 1, done: false, win: false, started: Date.now(), nodesWon: 0, rerolls: 0, route: ROUTES[rt] ? rt : "tech" };
  }
  function node(st, id) { for (var L = 0; L < st.map.length; L++) for (var r = 0; r < st.map[L].length; r++) for (var i = 0; i < st.map[L][r].length; i++) if (st.map[L][r][i].id === id) return st.map[L][r][i]; return null; }
  function available(st) {
    if (st.done) return [];
    var rows = st.map[st.layer - 1];
    if (!st.at) return rows[0].slice();
    var cur = node(st, st.at);
    if (!cur || cur.layer !== st.layer) return rows[0].slice();
    return cur.next.map(function (id) { return node(st, id); });
  }
  function canEnter(st, id) { return available(st).some(function (n) { return n.id === id; }); }
  function enter(st, id) { if (!canEnter(st, id)) return null; st.at = id; st.path.push(id); return node(st, id); }
  function isSky(t) { return t === "sky"; }
  function isMode(t) { return t === "sky" || t === "duel"; }
  function isCombat(t) { return t === "fight" || t === "elite" || t === "goal" || t === "boss"; }
  // Spec consumed by SakurayoLevels.create/tick/rate (ids are "R…" so they never touch main-line stars).
  function levelSpec(st, nd) {
    var L = nd.layer, base = { id: "R" + nd.id, ch: L, run46: true, map: [nd.x, nd.y], stars: [{ k: "win", d: "通关" }, { k: "hits", v: 6, d: "受击 ≤ 6 次" }, { k: "time", v: 90, d: "90 秒内完成" }] };
    if (nd.type === "boss") return Object.assign(base, { n: LAYER_NAMES[L - 1] + " · 层主", type: "boss", boss: true, goal: { bossAt: 14 } });
    if (nd.type === "elite") return Object.assign(base, { n: "精英 · 镜卫", type: "timed", goal: { n: 2, limit: 70, hp: 420 + 160 * L, kind: "elite" } });
    if (nd.type === "goal") { var g = GOALS[L - 1][nd.goal || 0]; return Object.assign(base, { n: g.n, type: g.type, goal: JSON.parse(JSON.stringify(g.goal)), npc: g.npc }); }
    return Object.assign(base, nd.fight === "clear" ? { n: "尸潮 · 清剿", type: "clear", goal: { n: 26 + 10 * L } } : { n: "尸潮 · 坚守", type: "survive", goal: { t: 40 + 8 * L } });
  }
  function shardMul(st) { return st.relics.reduce(function (m, id) { var r = relic(id); return m * (r && r.fx.shardMul || 1); }, 1); }
  function relic(id) { for (var i = 0; i < RELICS.length; i++) if (RELICS[i].id === id) return RELICS[i]; return null; }
  function relicOffer(st, n) {
    var r = rng(st.seed ^ (st.path.length * 2654435761)), rp = route(st).relics, pool = RELICS.filter(function (q) { return st.relics.indexOf(q.id) < 0 && rp.indexOf(q.id) >= 0; }), out = [];
    while (pool.length && out.length < (n || 3)) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
    return out;
  }
  function gainRelic(st, id) { var q = relic(id); if (!q || st.relics.indexOf(id) >= 0) return false; st.relics.push(id); st.pending.push({ relic: id }); return true; }
  // combat node finished
  function complete(st, nd, win, build) {
    if (!win) { st.done = true; st.win = false; return { over: true }; }
    st.nodesWon++; if (build) st.build = build;
    var gain = Math.round(({ fight: 22, goal: 30, elite: 40, boss: 60, sky: 36, duel: 34 }[nd.type] || 0) * shardMul(st)); st.shards += gain;
    var out = { shards: gain, relicOffer: nd.type === "elite" || nd.type === "boss" || isMode(nd.type) ? relicOffer(st, isMode(nd.type) ? 2 : 3) : null };
    if (nd.type === "boss") { if (st.layer >= LAYERS) { st.done = true; st.win = true; out.runWin = true; } else { st.layer++; st.at = null; out.nextLayer = st.layer; } }
    return out;
  }
  // non-combat node options
  function options(st, nd) {
    var r = rng(st.seed ^ (nd.row * 7919 + nd.col * 104729 + nd.layer * 31));
    if (nd.type === "shrine") return [{ k: "heal", n: "静养", d: "回复 35% 生命" }, { k: "level", n: "祈愿", d: "获得 1 次强化（下场战斗开局三选一）" }];
    if (nd.type === "shop") {
      var rel = relicOffer(st, 1)[0];
      return [{ k: "heal", n: "伤药", d: "回复 30% 生命", cost: 30 }, { k: "level", n: "符纸", d: "获得 1 次强化", cost: 40 }].concat(rel ? [{ k: "relic", id: rel.id, n: rel.i + " " + rel.n, d: rel.d, cost: 55 }] : []).concat([{ k: "leave", n: "离开", d: "" }]);
    }
    if (nd.type === "mask") {
      var FM = global.SakurayoForms; if (!FM) return [{ k: "leave", n: "离开", d: "" }];
      return FM.offer(st).map(function (f) { return { k: "form", id: f.id, n: f.mask + " · " + f.name, d: f.rule }; }).concat([{ k: "leave", n: "不换", d: "保持当前形态" }]);
    }
    if (nd.type === "event") {
      var ev = [
        { t: "无人的手水舍", d: "水面映出的不是你。", o: [{ k: "heal", n: "掬水", d: "回复 25% 生命" }, { k: "shards", v: 35, n: "捞起水底的魂晶", d: "魂晶 +35，生命 -10%", hp: -0.1 }] },
        { t: "迷路的狐面孩子", d: "「姐姐，带我去鸟居好吗？」", o: [{ k: "relic", n: "陪他走一段", d: "获得随机遗物，生命 -15%", hp: -0.15 }, { k: "shards", v: 15, n: "指路", d: "魂晶 +15" }] },
        { t: "镜面裂缝的低语", d: "它说它能让你更强——代价是一部分的你。", o: [{ k: "level", n: "接受", d: "获得 2 次强化，最大生命 -10", lv: 2, maxHp: -10 }, { k: "leave", n: "拒绝", d: "什么也不发生" }] }
      ];
      var e = ev[Math.floor(r() * ev.length)]; nd.eventTitle = e.t; nd.eventText = e.d; return e.o;
    }
    return [];
  }
  function choose(st, nd, opt) {
    if (!opt) return { ok: false };
    if (opt.cost) { if (st.shards < opt.cost) return { ok: false, why: "魂晶不足" }; st.shards -= opt.cost; }
    if (opt.hp) st.pending.push({ heal: opt.hp });
    if (opt.maxHp) st.pending.push({ maxHp: opt.maxHp });
    if (opt.k === "heal") st.pending.push({ heal: nd.type === "shrine" ? 0.35 : nd.type === "shop" ? 0.3 : 0.25 });
    else if (opt.k === "level") st.pending.push({ levels: opt.lv || 1 });
    else if (opt.k === "shards") st.shards += opt.v;
    else if (opt.k === "form") { var FM = global.SakurayoForms, r2 = FM && FM.switchTo(st, opt.id, "node", st.build && st.build.up ? Object.keys(st.build.up) : []); if (!r2) return { ok: false, why: "本层已经换过面具了" }; return { ok: true, form: opt.id }; }
    else if (opt.k === "relic") { var id = opt.id || (relicOffer(st, 1)[0] || {}).id; if (id) gainRelic(st, id); return { ok: true, relic: id }; }
    return { ok: true };
  }
  // apply pending one-shot effects + relic stat effects to a fresh player object (called at combat-node start)
  function applyPending(st, P) {
    var lv = 0, items = st.pending.splice(0);
    items.forEach(function (q) {
      if (q.relic) { var fx = (relic(q.relic) || {}).fx || {}; if (fx.dmgMul) P.dmg *= fx.dmgMul; if (fx.maxHp) { P.maxHp += fx.maxHp; P.hp += fx.maxHp; } if (fx.mag) P.mag += fx.mag; if (fx.spdMul) P.spd *= fx.spdMul; if (fx.crit) P.crit += fx.crit; if (fx.rateMul) P.rate *= fx.rateMul; }
      if (q.heal) P.hp = Math.max(1, Math.min(P.maxHp, P.hp + P.maxHp * q.heal));
      if (q.maxHp) { P.maxHp = Math.max(40, P.maxHp + q.maxHp); P.hp = Math.min(P.hp, P.maxHp); }
      if (q.levels) lv += q.levels;
    });
    if (st.relics.indexOf("omamori") >= 0) P.hp = Math.min(P.maxHp, P.hp + P.maxHp * 0.08);
    return { levels: lv };
  }
  var TRANSIENT = ["x", "y", "vx", "vy", "fire", "inv", "skill", "dash", "banterSeen", "hitStop46", "fx", "fy", "angle", "ultUsed46", "postAvg46", "chestCoins46", "chests46"];
  function snapshot(P) {
    var o = {};
    for (var k in P) {
      if (TRANSIENT.indexOf(k) >= 0) continue; var v = P[k];
      if (typeof v === "function" || v instanceof Set || v instanceof Map) continue;
      if (v && typeof v === "object") { try { o[k] = JSON.parse(JSON.stringify(v)); } catch (e) { } } else o[k] = v;
    }
    return o;
  }
  function restore(P, b) { if (!b) return; for (var k in b) if (TRANSIENT.indexOf(k) < 0) P[k] = b[k] && typeof b[k] === "object" ? JSON.parse(JSON.stringify(b[k])) : b[k]; }
  function sanitize(st) {
    if (!st || typeof st !== "object" || st.v !== 1 || !Array.isArray(st.map) || st.map.length !== LAYERS) return null;
    if (!(st.layer >= 1 && st.layer <= LAYERS)) return null;
    ["path", "relics", "pending"].forEach(function (k) { if (!Array.isArray(st[k])) st[k] = []; });
    st.shards = Math.max(0, Math.floor(+st.shards || 0)); st.relics = st.relics.filter(function (id) { return !!relic(id); });
    if (st.at && !node(st, st.at)) st.at = null;
    if (!ROUTES[st.route]) st.route = "tech"; // 旧存档：没有路线 → 科技线
    st.map.forEach(function (rows) { rows.forEach(function (rw) { rw.forEach(function (nd) { if (nd.type === "pin") nd.type = "fight"; if (nd.mode && !BOSS_MODES.some(function (m) { return m.k === nd.mode; })) delete nd.mode; }); }); }); // 旧存档里的弹珠节点 → 普通战斗
    st.abyss = Math.max(0, Math.min(10, st.abyss | 0)); if (st.daily && (typeof st.daily !== "object" || !(st.daily.day > 0))) st.daily = null;
    if (st.build && typeof st.build !== "object") st.build = null;
    if (st.form) { st.form = global.SakurayoForms ? global.SakurayoForms.sanitize(st.form, st.character || "sayo") : st.form; if (!st.form) delete st.form; }
    return st;
  }
  // meta reward when the run ends (sakura coins); per-node coin rewards are paid by the normal result flow
  function runReward(st) { var won = st.nodesWon || 0; return st.win ? 300 + 60 * LAYERS : Math.round((300 + 60 * (st.layer - 1)) * Math.min(0.9, Math.max(0.4, won / (LAYERS * ROWS)))); }
  global.SakurayoRun = { ROUTES: ROUTES, BOSS_MODES: BOSS_MODES, route: route, bossModes: bossModes, isSky: isSky, isMode: isMode, LAYERS: LAYERS, ROWS: ROWS, NODE: NODE, RELICS: RELICS, LAYER_NAMES: LAYER_NAMES, MOVES: MOVES, generate: generate, create: create, node: node, available: available, canEnter: canEnter, enter: enter, isCombat: isCombat, levelSpec: levelSpec, complete: complete, options: options, choose: choose, relic: relic, relicOffer: relicOffer, gainRelic: gainRelic, applyPending: applyPending, snapshot: snapshot, restore: restore, sanitize: sanitize, runReward: runReward };
})(typeof window !== "undefined" ? window : globalThis);
