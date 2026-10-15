/* 长线内容（docs/DESIGN_V5.md §2 经济 / 路线图 P4）：深渊夜难度、每日挑战、赛季任务线「百夜行纪」。纯逻辑，无 DOM。
   - 深渊夜 0–10：每级敌人生命 +12%、Boss 破防窗口 −5%；奖励樱花币 ×(1+0.15·级)。通关第 N 级解锁 N+1。
   - 每日挑战：以日期为种子的固定地图 + 当日词条；每日首次完成（到达第 2 层或通关）发奖一次。
   - 赛季（28 天一期）：经验 → 40 级，奖励只有樱花币/称号/头像框（不产镜屑，镜屑仍受周上限约束），没有任何付费轨。 */
(function (global) {
  "use strict";
  var ABYSS_MAX = 10, SEASON_DAYS = 28, LV_MAX = 40, XP_PER = 100;
  var XP = { node: 10, mode: 15, elite: 20, boss: 30, layer: 25, runWin: 80, daily: 50 };
  var MODS = [
    { id: "glass", n: "玻璃大炮", d: "你造成和受到的伤害都 +30%" },
    { id: "nomag", n: "手动拾取", d: "宝石磁吸范围限制为贴身" },
    { id: "rich", n: "奉纳日", d: "节点魂晶 +50%" },
    { id: "giant", n: "大个子祭", d: "敌人与 Boss 生命 +25%，结算樱花币 +25%" }
  ];
  var TITLES = { 10: "夜店常客", 20: "百夜行者", 30: "大食切的朋友", 40: "千夜一闪" };
  function day(now) { var d = new Date(now || Date.now()); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000); } // 本地日期
  function seasonOf(now) { return Math.floor((day(now) - 20734) / SEASON_DAYS) + 1; } // 第 1 期 = 2026-10-09 起
  function blank(now) { return { abyssMax: 0, season: seasonOf(now), xp: 0, claimed: 0, titles: [], dailyDone: 0, dailyBest: 0, runs: 0, wins: 0 }; }
  function sanitize(s, now) {
    var o = blank(now); if (!s || typeof s !== "object") return o;
    o.abyssMax = Math.max(0, Math.min(ABYSS_MAX, s.abyssMax | 0)); o.titles = Array.isArray(s.titles) ? s.titles.filter(function (t, i, a) { return typeof t === "string" && a.indexOf(t) === i; }).slice(0, 20) : [];
    o.dailyDone = s.dailyDone | 0; o.dailyBest = Math.max(0, s.dailyBest | 0); o.runs = Math.max(0, s.runs | 0); o.wins = Math.max(0, s.wins | 0);
    if ((s.season | 0) === o.season) { o.xp = Math.max(0, Math.min(LV_MAX * XP_PER, s.xp | 0)); o.claimed = Math.max(0, Math.min(LV_MAX, s.claimed | 0)); } // 新赛季：经验与领取进度清零，称号保留
    return o;
  }
  function level(s) { return Math.min(LV_MAX, Math.floor(s.xp / XP_PER)); }
  function reward(lv) { return { coins: lv % 5 === 0 ? 300 : 60, title: TITLES[lv] || null }; }
  function addXp(s, kind, now) { if (s.season !== seasonOf(now)) { var t = s.titles; Object.assign(s, blank(now), { abyssMax: s.abyssMax, titles: t, dailyDone: s.dailyDone, runs: s.runs, wins: s.wins }); } var g = XP[kind] || 0; s.xp = Math.min(LV_MAX * XP_PER, s.xp + g); return g; }
  /* 领取所有已达成等级的奖励，返回 {coins, titles[]} 并写入存档对象 */
  function claim(s, save) { var lv = level(s), out = { coins: 0, titles: [] }; while (s.claimed < lv) { s.claimed++; var r = reward(s.claimed); out.coins += r.coins; if (r.title && s.titles.indexOf(r.title) < 0) { s.titles.push(r.title); out.titles.push(r.title); } } save.coins = (save.coins || 0) + out.coins; return out; }
  function abyss(n) { n = Math.max(0, Math.min(ABYSS_MAX, n | 0)); return { n: n, hp: 1 + 0.12 * n, brk: Math.max(0.5, 1 - 0.05 * n), coins: 1 + 0.15 * n, label: n ? "深渊夜 " + n : "常夜" }; }
  function canAbyss(s, n) { return (n | 0) <= Math.min(ABYSS_MAX, s.abyssMax + 1) && n >= 0; }
  function clearAbyss(s, n) { if (n >= s.abyssMax && n < ABYSS_MAX) { s.abyssMax = n + 1; return true; } return false; }
  function rng(seed) { var x = seed >>> 0 || 1; return function () { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
  function daily(now) { var d = day(now), r = rng(d * 2654435761), m = MODS[Math.floor(r() * MODS.length)], ch = ["sayo", "aya", "rion"][Math.floor(r() * 3)]; return { day: d, seed: (d * 7919 + 17) >>> 0, mod: m, character: ch, abyss: 2, reward: 300 }; }
  function dailyDone(s, now) { return s.dailyDone === day(now); }
  function finishDaily(s, save, layerReached, now) { if (dailyDone(s, now) || layerReached < 2) return 0; s.dailyDone = day(now); s.dailyBest = Math.max(s.dailyBest, layerReached); save.coins = (save.coins || 0) + 300; addXp(s, "daily", now); return 300; }
  global.SakurayoSeason = { ABYSS_MAX: ABYSS_MAX, LV_MAX: LV_MAX, XP_PER: XP_PER, XP: XP, MODS: MODS, TITLES: TITLES, blank: blank, sanitize: sanitize, level: level, reward: reward, addXp: addXp, claim: claim, abyss: abyss, canAbyss: canAbyss, clearAbyss: clearAbyss, daily: daily, dailyDone: dailyDone, finishDaily: finishDaily, seasonOf: seasonOf, day: day };
})(typeof window !== "undefined" ? window : globalThis);
