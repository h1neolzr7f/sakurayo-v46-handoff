/* 衣橱（外观商店，docs/DESIGN_V5.md §2 / 路线图 P3）。纯逻辑，无 DOM。
   原则：形态玩法局内免费获得；这里只卖“看起来怎样”。外观永远不改任何战斗数值（tests/wardrobe_unit.mjs 断言）。
   货币：樱花币（常规产出）+ 镜屑（传说外观专用，夜行中击破 Boss/精英/玩法节点获得，每周上限 120）。无任何真实付费。
   条目：
   - 形态·华彩（15）：换色——形态光环/弹幕辉光/子弹核心色换成华彩配色。600 币。
   - 形态·传说（15）：重绘立绘 + 变身大招特写 + 专属配色。4500 币 + 120 镜屑 + 该形态在夜行中使用满 3 局。
   - 武器外观（12，每角色 4）：子弹/刀光配色 + 武器图。900 币。
   - 特效包（6，全角色通用）：命中火花与连击数字配色。1200 币。 */
(function (global) {
  "use strict";
  var CHS = ["sayo", "aya", "rion"], SLOTS = ["base", "guard", "speed", "burst", "awaken"];
  var SLOT_N = { base: "本相", guard: "守", speed: "疾", burst: "爆", awaken: "觉醒" };
  var CH_N = { sayo: "小夜", aya: "绫", rion: "凛音" };
  var PRISM = { base: ["#ff9ec7", "#fff2f8"], guard: ["#b28dff", "#f4eeff"], speed: ["#ffe36d", "#fffbe6"], burst: ["#ff3d7f", "#ffe0ec"], awaken: ["#9ff7ff", "#ffffff"] };
  var LEGEND = { base: ["#ffd1e8", "#ffffff"], guard: ["#9fe9ff", "#ffffff"], speed: ["#b6ffcf", "#ffffff"], burst: ["#ffb36b", "#fffbe6"], awaken: ["#fff1a8", "#ffffff"] };
  var WPAL = [["#ffc1dc", "#ffffff"], ["#9fe1ff", "#ffffff"], ["#ffd76a", "#fff8dd"], ["#c69bff", "#f5ecff"]];
  var WNAME = { sayo: ["樱吹雪", "月白", "金鱼祭", "紫藤"], aya: ["蓝调证词", "冰镜", "直播金", "夜鸦"], rion: ["朱漆", "霜刃", "黄泉灯", "鬼百合"] };
  var FX = [["#ffffff", "#ffe08a", "初雪"], ["#ffc1dc", "#ff7fb0", "樱花"], ["#9fe1ff", "#4fb6ff", "镜光"], ["#ffd76a", "#ff9f40", "烟火"], ["#c69bff", "#7e5bff", "狐火"], ["#b6ffcf", "#3fdc8a", "萤火"]];
  var ITEMS = [];
  CHS.forEach(function (c) {
    SLOTS.forEach(function (s) {
      ITEMS.push({ id: "prism_" + c + "_" + s, kind: "prism", ch: c, form: c + "_" + s, n: CH_N[c] + "·" + SLOT_N[s] + " 华彩", price: 600, tint: PRISM[s][0], core: PRISM[s][1] });
      ITEMS.push({ id: "legend_" + c + "_" + s, kind: "legend", ch: c, form: c + "_" + s, n: CH_N[c] + "·" + SLOT_N[s] + " 传说", price: 4500, kyo: 120, uses: 3, tint: LEGEND[s][0], core: LEGEND[s][1], art: "wardrobe/" + c + "_" + s + "_legend.webp", ult: "wardrobe/" + c + "_" + s + "_ult.webp" });
    });
    for (var i = 0; i < 4; i++) ITEMS.push({ id: "weapon_" + c + "_" + i, kind: "weapon", ch: c, n: CH_N[c] + "·" + WNAME[c][i], price: 900, tint: WPAL[i][0], core: WPAL[i][1], art: "wardrobe/" + c + "_w" + i + ".webp" });
  });
  FX.forEach(function (f, i) { ITEMS.push({ id: "fx_" + i, kind: "fx", n: "特效·" + f[2], price: 1200, spark: f[0], num: f[1], art: "wardrobe/fx_" + i + ".webp" }); });
  var BY = {}; ITEMS.forEach(function (q) { BY[q.id] = q; });
  var KYO_WEEK_CAP = 120, KYO_GAIN = { boss: 20, elite: 8, sky: 6, pin: 6, duel: 6 };
  function week(now) { var d = new Date(now || Date.now()); var t = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()); return Math.floor((t / 86400000 + 3) / 7); } // 周一为界
  function blank() { return { owned: [], equip: { form: {}, weapon: {}, fx: null }, kyo: 0, kyoWeek: 0, kyoGot: 0, formUses: {} }; }
  function sanitize(w) {
    var o = blank(); if (!w || typeof w !== "object") return o;
    o.owned = Array.isArray(w.owned) ? w.owned.filter(function (id, i, a) { return BY[id] && a.indexOf(id) === i; }) : [];
    var e = w.equip || {};
    Object.keys(e.form || {}).forEach(function (f) { var id = e.form[f]; if (BY[id] && o.owned.indexOf(id) >= 0 && BY[id].form === f) o.equip.form[f] = id; });
    Object.keys(e.weapon || {}).forEach(function (c) { var id = e.weapon[c]; if (BY[id] && o.owned.indexOf(id) >= 0 && BY[id].ch === c) o.equip.weapon[c] = id; });
    if (BY[e.fx] && o.owned.indexOf(e.fx) >= 0) o.equip.fx = e.fx;
    o.kyo = Math.max(0, Math.min(9999, +w.kyo || 0)); o.kyoWeek = +w.kyoWeek || 0; o.kyoGot = Math.max(0, +w.kyoGot || 0);
    Object.keys(w.formUses || {}).forEach(function (f) { if (/^(sayo|aya|rion)_(base|guard|speed|burst|awaken)$/.test(f)) o.formUses[f] = Math.max(0, Math.min(999, +w.formUses[f] || 0)); });
    return o;
  }
  /* 镜屑：每周上限，返回实际获得量 */
  function gainKyo(w, kind, now) { var n = KYO_GAIN[kind] || 0; if (!n) return 0; var wk = week(now); if (w.kyoWeek !== wk) { w.kyoWeek = wk; w.kyoGot = 0; } var g = Math.max(0, Math.min(n, KYO_WEEK_CAP - w.kyoGot)); w.kyoGot += g; w.kyo += g; return g; }
  function noteFormUse(w, formId) { if (!formId) return; w.formUses[formId] = (w.formUses[formId] || 0) + 1; }
  function why(w, coins, id) {
    var q = BY[id]; if (!q) return "不存在"; if (w.owned.indexOf(id) >= 0) return "已拥有";
    if (q.kind === "legend") { if ((w.formUses[q.form] || 0) < q.uses) return "需在夜行中使用该形态 " + q.uses + " 局（" + (w.formUses[q.form] || 0) + "/" + q.uses + "）"; if (w.kyo < q.kyo) return "镜屑不足（" + w.kyo + "/" + q.kyo + "）"; }
    if (coins < q.price) return "樱花币不足"; return "";
  }
  function buy(w, save, id) { var r = why(w, save.coins, id); if (r) return { ok: false, why: r }; var q = BY[id]; save.coins -= q.price; if (q.kyo) w.kyo -= q.kyo; w.owned.push(id); equip(w, id); return { ok: true, item: q }; }
  function equip(w, id) { var q = BY[id]; if (!q || w.owned.indexOf(id) < 0) return false; if (q.form) w.equip.form[q.form] = id; else if (q.kind === "weapon") w.equip.weapon[q.ch] = id; else if (q.kind === "fx") w.equip.fx = id; return true; }
  function unequip(w, id) { var q = BY[id]; if (!q) return false; if (q.form && w.equip.form[q.form] === id) delete w.equip.form[q.form]; else if (q.kind === "weapon" && w.equip.weapon[q.ch] === id) delete w.equip.weapon[q.ch]; else if (w.equip.fx === id) w.equip.fx = null; return true; }
  /* 战斗/演出读取的“纯视觉”覆盖：形态光环与子弹色、武器配色、命中特效配色、传说立绘/特写。 */
  function look(w, ch, formId) {
    var o = {}; if (!w) return o; var f = formId && w.equip.form[formId] && BY[w.equip.form[formId]];
    if (f) { o.tint = f.tint; o.core = f.core; if (f.art) { o.art = f.art; o.ult = f.ult; } o.form = f.id; }
    var wp = w.equip.weapon[ch] && BY[w.equip.weapon[ch]]; if (wp) { o.bullet = wp.tint; o.bulletCore = wp.core; o.weapon = wp.id; }
    var fx = w.equip.fx && BY[w.equip.fx]; if (fx) { o.spark = fx.spark; o.num = fx.num; o.fx = fx.id; }
    return o;
  }
  function list(kind, ch) { return ITEMS.filter(function (q) { return (!kind || q.kind === kind) && (!ch || !q.ch || q.ch === ch); }); }
  global.SakurayoWardrobe = { ITEMS: ITEMS, KYO_WEEK_CAP: KYO_WEEK_CAP, KYO_GAIN: KYO_GAIN, get: function (id) { return BY[id] || null; }, list: list, blank: blank, sanitize: sanitize, gainKyo: gainKyo, noteFormUse: noteFormUse, why: why, buy: buy, equip: equip, unequip: unequip, look: look, week: week };
})(typeof window !== "undefined" ? window : globalThis);
