/* 形态系统框架（docs/DESIGN_V5.md §1，路线图 P1；故事包装见 docs/STORY.md v3 §1「面具」）。纯逻辑，无 DOM。
   - 每角色 5 形态：base / guard / speed / burst（分支，一局同时最多 1 个）+ awaken（Boss 第 4 阶段限时 10 秒）。
   - 形态 = 规则改写（rule）+ 构筑卡兼容（compat）+ 外观（art，外观只改视觉，不进入 mods）。
   - mods 只描述「规则参数」，由战斗侧读取 P.form46；收藏/外观永远不会写入 mods（测试断言）。
   - 局内状态挂在 run46.form：{ id, switches:{layer:n}, gauge, awakenUntil, history } */
(function (global) {
  "use strict";
  var AWAKEN_SEC = 10, GAUGE_MAX = 100, SWITCH_PER_LAYER = 1;
  function F(ch, slot, name, mask, rule, mods, compat, ban) { return { id: ch + "_" + slot, ch: ch, slot: slot, name: name, mask: mask, rule: rule, mods: mods, compat: compat || [], ban: ban || [] }; }
  var FORMS = [
    F("sayo", "base", "夜樱射手", "无", "连射累积热度", {}, ["spread", "ricochet", "laser"]),
    F("sayo", "guard", "镜盾哨兵", "狐面", "站定时展开护盾，热度转为护盾值", { standShield: 0.35, moveSpeed: 0.9 }, ["spread", "laser", "orbit"], ["dashTrail"]),
    F("sayo", "speed", "疾风樱刃", "天狗面", "移动射击无惩罚，热度满自动冲刺", { moveSpeed: 1.18, autoDash: 1, dmg: 0.9 }, ["ricochet", "homing", "spread"], ["orbit"]),
    F("sayo", "burst", "过载炮手", "般若面", "主动过热：弹幕翻倍，受伤翻倍", { overheat: 1, fireRate: 1.25, dmgTaken: 1.35 }, ["explosive", "laser", "burst"], ["orbit"]),
    F("sayo", "awaken", "千樱·零式", "纸面具", "10 秒：热度锁满，全屏樱花弹", { fireRate: 2, dmg: 1.4, invuln: 1 }, []),
    F("aya", "base", "枪刀双持", "无", "远程叠印，近身消印", {}, ["burst", "pierce", "homing"]),
    F("aya", "guard", "证人", "狐面", "印记转为护送目标与自身的护盾", { markShield: 0.4, moveSpeed: 0.92 }, ["pierce", "orbit", "spread"], ["explosive"]),
    F("aya", "speed", "乱舞", "天狗面", "枪刀自动交替，切换无硬直", { swapFree: 1, fireRate: 1.15 }, ["burst", "ricochet", "pierce"], ["laser"]),
    F("aya", "burst", "连麦", "般若面", "召唤协同分身，自身生命上限减半", { clone: 1, maxHp: 0.5 }, ["homing", "explosive", "burst"], ["orbit"]),
    F("aya", "awaken", "双生·证词", "纸面具", "10 秒：所有印记同时引爆", { markDetonate: 1, dmg: 1.4, invuln: 1 }, []),
    F("rion", "base", "居合", "无", "静止蓄力，移动释放", {}, ["pierce", "orbit", "explosive"]),
    F("rion", "guard", "守冢", "狐面", "插剑形成剑区：区内减速敌人、近战增伤", { swordZone: 1, moveSpeed: 0.9 }, ["orbit", "explosive", "spread"], ["homing"]),
    F("rion", "speed", "百鬼连斩", "天狗面", "取消蓄力，改为越连越快的连段", { comboChain: 1, chargeTime: 0 }, ["pierce", "ricochet", "burst"], ["laser"]),
    F("rion", "burst", "黄泉一闪", "般若面", "蓄力上限翻倍，蓄满前不能移动", { chargeCap: 2, rootWhileCharge: 1, dmg: 1.15 }, ["explosive", "pierce", "laser"], ["orbit"]),
    F("rion", "awaken", "万剑归坟", "纸面具", "10 秒：每次斩击召唤剑雨", { swordRain: 1, dmg: 1.4, invuln: 1 }, [])
  ];
  /* 视觉：tint = 角色光环/弹幕辉光，core = 子弹核心色；line = 变身台词（STORY v3 §2 面具台词）。只影响画面。 */
  var PAL = { base: null, guard: ["#7fd8ff", "#e9fbff"], speed: ["#6dffb4", "#effff4"], burst: ["#ff6a3d", "#fff0c8"], awaken: ["#ffd76a", "#fffbe6"] };
  var LINES = {
    sayo_guard: "挨打要花药钱的，所以不挨！", sayo_speed: "下一个摊位 5 分钟后收摊——让开让开！", sayo_burst: "房租的仇，今天一起报！", sayo_awaken: "……这张脸，是我七岁时画的。", sayo_base: "今天也要努力打工！",
    aya_guard: "全程录屏，你每一拳我都截图了。", aya_speed: "下面这段请开 0.25 倍速。", aya_burst: "掉粉的怨念，接好！", aya_awaken: "……原来那次直播，第一个观众是你们。", aya_base: "回到正片。",
    rion_guard: "我就站这里。你们过来。", rion_speed: "三分钟后睡觉。一刀一个。", rion_burst: "……谁把我吵醒的。", rion_awaken: "这一次，我想看烟花。", rion_base: "……嗯。"
  };
  FORMS.forEach(function (f) { var p = PAL[f.slot]; f.tint = p ? p[0] : null; f.core = p ? p[1] : null; f.line = LINES[f.id] || ""; f.art = "characters/" + f.ch + "/forms/" + f.slot + ".webp"; });
  var BY = {}; FORMS.forEach(function (f) { BY[f.id] = f; });
  var BRANCH = ["guard", "speed", "burst"];
  function get(id) { return BY[id] || null; }
  function list(ch) { return FORMS.filter(function (f) { return f.ch === ch; }); }
  function base(ch) { return get((ch || "sayo") + "_base"); }
  function init(st) { if (!st.form || !get(st.form.id) || get(st.form.id).ch !== (st.character || "sayo")) st.form = { id: base(st.character).id, switches: {}, gauge: 0, awakenUntil: 0, history: [] }; return st.form; }
  /* 「面具摊」/ 镜面裂缝节点：三选一分支形态（排除当前形态，不足时补基础形态）。 */
  function offer(st) { var f = init(st), ch = st.character || "sayo"; return BRANCH.map(function (s) { return get(ch + "_" + s); }).filter(function (x) { return x.id !== f.id; }).concat(f.id !== base(ch).id ? [base(ch)] : []).slice(0, 3); }
  function canSwitch(st, id, src) { var f = init(st), t = get(id); if (!t || t.slot === "awaken" || t.ch !== (st.character || "sayo") || t.id === f.id) return false; if (src === "boss") return true; return (f.switches[st.layer || 1] || 0) < SWITCH_PER_LAYER; }
  /* src: "node"（面具摊/剧情选择，计入每层 1 次）| "boss"（Boss 阶段应对，不计次）。返回被「通用化」的形态专属卡。 */
  function switchTo(st, id, src, cards) {
    if (!canSwitch(st, id, src)) return null; var f = init(st), t = get(id), L = st.layer || 1;
    if (src !== "boss") f.switches[L] = (f.switches[L] || 0) + 1;
    var lost = (cards || []).filter(function (c) { return t.ban.indexOf(c) >= 0; });
    f.history.push({ layer: L, from: f.id, to: id, src: src || "node" }); f.id = id; return { form: t, generalized: lost };
  }
  function compatible(st, card) { var t = get(init(st).id); return !t || t.ban.indexOf(card) < 0; }
  /* 觉醒槽：伤害与破防累积；Boss 第 4 阶段且满槽时可觉醒 10 秒。 */
  function charge(st, dmg, breaks) { var f = init(st); f.gauge = Math.min(GAUGE_MAX, f.gauge + Math.max(0, dmg || 0) * 0.02 + Math.max(0, breaks || 0) * 25); return f.gauge; }
  function canAwaken(st, bossPhase, now) { var f = init(st); return bossPhase >= 4 && f.gauge >= GAUGE_MAX && !(f.awakenUntil > now); }
  function awaken(st, bossPhase, now) { if (!canAwaken(st, bossPhase, now)) return false; var f = init(st); f.gauge = 0; f.awakenUntil = now + AWAKEN_SEC; return true; }
  function active(st, now) { var f = init(st); return f.awakenUntil > now ? get((st.character || "sayo") + "_awaken") : get(f.id); }
  /* 合成规则参数：分支形态 ×（觉醒时叠加觉醒）。只读形态表，不读收藏。 */
  function mods(st, now) { var f = init(st), out = {}, add = function (m) { for (var k in m) out[k] = (out[k] || 1) * m[k]; }; add(get(f.id).mods); if (f.awakenUntil > now) add(get((st.character || "sayo") + "_awaken").mods); return out; }
  function apply(P, st, now) { P.form46 = { id: active(st, now).id, mods: mods(st, now) }; return P.form46; }
  function sanitize(f, ch) { if (!f || typeof f !== "object" || !get(f.id) || get(f.id).ch !== ch || get(f.id).slot === "awaken") return null; var sw = {}; for (var k in (f.switches || {})) { var n = f.switches[k] | 0; if (n > 0 && +k >= 1 && +k <= 9) sw[k] = Math.min(n, SWITCH_PER_LAYER); } return { id: f.id, switches: sw, gauge: Math.max(0, Math.min(GAUGE_MAX, +f.gauge || 0)), awakenUntil: 0, history: Array.isArray(f.history) ? f.history.slice(-20) : [] }; }
  global.SakurayoForms = { FORMS: FORMS, AWAKEN_SEC: AWAKEN_SEC, GAUGE_MAX: GAUGE_MAX, get: get, list: list, base: base, init: init, offer: offer, canSwitch: canSwitch, switchTo: switchTo, compatible: compatible, charge: charge, canAwaken: canAwaken, awaken: awaken, active: active, mods: mods, apply: apply, sanitize: sanitize };
})(typeof window !== "undefined" ? window : globalThis);
