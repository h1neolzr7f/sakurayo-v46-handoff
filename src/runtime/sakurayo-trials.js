/* Sakurayo offline trials: finite first-clear receipts + personal best.
 * Pure rules; index.html wires the real start/level/DP/finish entries. */
(function (root) {
  "use strict";
  var CATALOG = Object.freeze([
    Object.freeze({ id: "solo", name: "独行回收", sub: "SOLO", gate: 2, reward: 120,
      rule: "禁用 DP 干员部署；局内随机构筑照常。", tip: "全程只能靠自己清场。", art: "trials/banner_solo.webp" }),
    Object.freeze({ id: "sealed", name: "封印试炼", sub: "SEALED", gate: 3, reward: 180,
      rule: "升级不弹出局内强化选择；保留自己的开局核心与永久成长。", tip: "等级只回复少量生命。", art: "trials/banner_sealed.webp" }),
    Object.freeze({ id: "flawless", name: "无伤终夜", sub: "FLAWLESS", gate: 4, reward: 240,
      rule: "正常战斗；必须在不受生命伤害的情况下通关。", tip: "护盾吸收的伤害不算受伤。", art: "trials/banner_flawless.webp" })
  ]);
  function find(id) {
    for (var i = 0; i < CATALOG.length; i++) if (CATALOG[i].id === id) return CATALOG[i];
    return null;
  }
  function normalize(raw) {
    var out = { receipts: {}, best: {} };
    if (!raw || typeof raw !== "object") return out;
    CATALOG.forEach(function (t) {
      if (raw.receipts && raw.receipts[t.id]) out.receipts[t.id] = 1;
      var b = raw.best && Number(raw.best[t.id]);
      if (isFinite(b) && b > 0) out.best[t.id] = Math.round(b * 10) / 10;
    });
    return out;
  }
  function store(save) {
    save.shop40 = save.shop40 || {};
    save.shop40.ops = save.shop40.ops || {};
    save.shop40.ops.trials = normalize(save.shop40.ops.trials);
    return save.shop40.ops.trials;
  }
  function available(save, id) {
    var t = find(id);
    return !!t && Number((save && save.unlock) || 1) >= t.gate;
  }
  function status(save, id) {
    var s = store(save);
    return { open: available(save, id), claimed: !!s.receipts[id], best: s.best[id] || 0 };
  }
  function qualifies(id, run) {
    if (!run || !run.win) return false;
    if (id === "flawless") return Number(run.damageTaken || 0) <= 0;
    return true;
  }
  function complete(save, id, run) {
    var t = find(id);
    if (!t) return { success: false, reward: 0, best: 0, reason: "unknown" };
    var s = store(save);
    if (!available(save, id)) return { success: false, reward: 0, best: s.best[id] || 0, reason: "locked" };
    if (!qualifies(id, run)) return { success: false, reward: 0, best: s.best[id] || 0, reason: run && run.win ? "hurt" : "lose" };
    var d = Math.round(Math.max(0, Number(run.duration) || 0) * 10) / 10;
    var newBest = !s.best[id] || d < s.best[id];
    if (newBest) s.best[id] = d;
    var reward = 0;
    if (!s.receipts[id]) { s.receipts[id] = 1; reward = t.reward; save.coins = (save.coins || 0) + reward; }
    return { success: true, reward: reward, best: s.best[id], newBest: newBest };
  }
  function claimable(save) {
    var n = 0;
    CATALOG.forEach(function (t) { if (available(save, t.id) && !store(save).receipts[t.id]) n++; });
    return n;
  }

  var CSS =
    "#trialsDrawer .dbody{padding:0!important;overflow:hidden}" +
    ".trial46{position:relative;display:grid;grid-template-columns:minmax(150px,24%) 1fr;gap:14px;height:100%;min-height:0;padding:12px max(14px,env(safe-area-inset-right)) 12px max(14px,env(safe-area-inset-left));box-sizing:border-box}" +
    ".trialList46{display:flex;flex-direction:column;gap:10px;overflow:auto;min-height:0}" +
    ".trialTab46{position:relative;min-height:64px;padding:10px 12px;border-radius:14px;border:1px solid rgba(150,228,245,.28);background:linear-gradient(90deg,rgba(9,16,32,.92),rgba(9,16,32,.55)),var(--art) center/cover;color:#e8f2ff;text-align:left;font:800 15px/1.2 system-ui;overflow:hidden}" +
    ".trialTab46 small{display:block;margin-top:4px;color:#8fb4cc;font:700 10px/1 system-ui;letter-spacing:.18em}" +
    ".trialTab46.on{border-color:#ffb3d1;box-shadow:0 0 0 1px #ffb3d1,0 8px 22px rgba(255,90,160,.28)}" +
    ".trialTab46.lock{filter:grayscale(.85) brightness(.7)}" +
    ".trialTab46 .dot46{position:absolute;top:8px;right:8px;width:9px;height:9px;border-radius:50%;background:#ff4d6d;box-shadow:0 0 8px #ff4d6d}" +
    ".trialMain46{position:relative;border-radius:18px;overflow:hidden;border:1px solid rgba(150,228,245,.3);background:#0a1224 var(--art) 72% 30%/cover;min-height:0}" +
    ".trialMain46:before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(6,10,22,.94) 0%,rgba(6,10,22,.78) 42%,rgba(6,10,22,.08) 75%)}" +
    ".trialInfo46{position:relative;z-index:1;display:flex;flex-direction:column;gap:8px;height:100%;box-sizing:border-box;padding:18px 20px;max-width:min(470px,62%)}" +
    ".trialInfo46 em{font:900 11px/1 system-ui;letter-spacing:.32em;color:#8fe6f5;font-style:normal}" +
    ".trialInfo46 h3{margin:0;font:900 clamp(22px,4.2vh,30px)/1.1 system-ui;color:#fff;letter-spacing:.06em;text-shadow:0 2px 12px #000}" +
    ".trialInfo46 p{margin:0;color:#d6e4f4;font:600 13px/1.55 system-ui}" +
    ".trialInfo46 .tip46{color:#9fb7cc;font-size:12px}" +
    ".trialMeta46{display:flex;flex-wrap:wrap;gap:6px}" +
    ".trialMeta46 b{padding:5px 10px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(150,228,245,.3);color:#e8f2ff;font:700 11px/1 system-ui}" +
    ".trialMeta46 b.ok{color:#9ff0c0;border-color:#9ff0c066}.trialMeta46 b.gold{color:#ffd77a;border-color:#ffd77a66}" +
    ".trialGo46{margin-top:auto;align-self:flex-start;min-height:48px;min-width:180px;padding:0 26px;border-radius:999px;border:0;background:linear-gradient(90deg,#ff7eb3,#ffb38a);color:#2a0f1e;font:900 16px/1 system-ui;letter-spacing:.12em;box-shadow:0 10px 24px rgba(255,110,160,.38)}" +
    ".trialGo46:disabled{background:#ffffff1a;color:#9fb0c4;box-shadow:none}" +
    "@media (max-height:420px){.trialInfo46{padding:12px 16px;gap:6px}.trialInfo46 p{font-size:12px;line-height:1.45}.trialTab46{min-height:52px}}" +
    "@media (orientation:portrait){.trial46{grid-template-columns:1fr;grid-template-rows:auto 1fr}.trialList46{flex-direction:row}.trialTab46{flex:1}.trialInfo46{max-width:100%}}";
  function fmt(sec) { sec = Math.round(sec); return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0"); }
  function esc(v) { return String(v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function render(host, save, h) {
    if (!host) return;
    h = h || {};
    if (!host.ownerDocument.getElementById("sakurayoTrials46")) {
      var st = host.ownerDocument.createElement("style"); st.id = "sakurayoTrials46"; st.textContent = CSS;
      host.ownerDocument.head.appendChild(st);
    }
    var art = h.art || function (x) { return x; };
    var cur = find(render.pick) || CATALOG[0];
    var tabs = CATALOG.map(function (t) {
      var s = status(save, t.id);
      return '<button type="button" class="trialTab46' + (t.id === cur.id ? " on" : "") + (s.open ? "" : " lock") + '" data-trial="' + t.id + '" style="--art:url(\'' + art(t.art.replace("banner_", "tab_")) + '\')">' +
        esc(t.name) + "<small>" + t.sub + "</small>" + (s.open && !s.claimed ? '<i class="dot46"></i>' : "") + "</button>";
    }).join("");
    var s = status(save, cur.id);
    var active = h.active === cur.id;
    var go = !s.open ? "通关第" + (cur.gate - 1) + "章后开放" : active ? "已选择 · 前往出击" : "前往挑战";
    host.innerHTML = '<div class="trial46"><div class="trialList46" role="tablist">' + tabs + "</div>" +
      '<div class="trialMain46" style="--art:url(\'' + art(cur.art) + '\')"><div class="trialInfo46">' +
      "<em>OFFLINE TRIAL · " + cur.sub + "</em><h3>" + esc(cur.name) + "</h3>" +
      '<div class="trialMeta46"><b>门槛：第' + cur.gate + "章解锁</b>" +
      (s.claimed ? '<b class="ok">首通奖励已领取</b>' : '<b class="gold">首通奖励 樱花币 ' + cur.reward + "</b>") +
      "<b>最佳 " + (s.best ? fmt(s.best) : "—") + "</b></div>" +
      "<p>" + esc(cur.rule) + "</p><p class=\"tip46\">" + esc(cur.tip) + " 角色自由选择，不改变永久整备；失败不发奖励。</p>" +
      '<button type="button" class="trialGo46" id="trialGo46"' + (s.open ? "" : " disabled") + ">" + go + "</button></div></div></div>";
    var list = host.querySelectorAll("[data-trial]");
    for (var i = 0; i < list.length; i++) list[i].onclick = function () { render.pick = this.getAttribute("data-trial"); render(host, save, h); };
    var btn = host.querySelector("#trialGo46");
    if (btn && s.open) btn.onclick = function () { if (h.choose) h.choose(cur.id); };
  }
  render.pick = "solo";
  root.SakurayoTrials = Object.freeze({ render: render, fmt: fmt, catalog: CATALOG, find: find, normalize: normalize, available: available,
    status: status, qualifies: qualifies, complete: complete, claimable: claimable });
})(typeof window !== "undefined" ? window : globalThis);
