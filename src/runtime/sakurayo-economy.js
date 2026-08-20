(function (global) {
  "use strict";

  var VERSION = "4.6.6";
  var TABS = ["skins", "starters", "items", "talismans", "extensions"];
  var FIRST_CLEAR = 40;
  var styleInjected = false;

  function injectStyle() {
    if (styleInjected || !global.document) return;
    styleInjected = true;
    var style = global.document.createElement("style");
    style.id = "sakurayo-economy-css";
    style.textContent =
      ".shopWallet44{margin:0 0 12px;padding:11px 12px;border:1px solid #ffb2d455;border-radius:14px;background:linear-gradient(135deg,#1a1028,#120c20);text-align:left}" +
      ".shopWallet44 b{color:#ffe6a3;font-size:16px}" +
      ".shopWallet44 p{margin:6px 0 0;color:#d7cce4;font-size:11px;line-height:1.5}" +
      ".shopWallet44 em{display:block;margin-top:4px;color:#9ee7ff;font-style:normal;font-size:10px}" +
      ".shopItem40.shopRecommend44,.skinCard.shopRecommend44{border-color:#ffe6a388;box-shadow:0 0 18px #ffd36b22}" +
      ".shopItem40.shopShort44 button,.skinCard.shopShort44 button{opacity:.72}" +
      ".coinBreak44{display:block;margin-top:6px;color:#cbbfd8;font-size:10px;font-weight:600}" +
      ".shopNotice b{color:#ffe6a3}";
    global.document.head.appendChild(style);
  }

  function recommend(character) {
    if (character === "rion") return { starterId: "flow", itemId: "whetstone", reason: "太刀角色先买身法核心，再补磨刀石。" };
    if (character === "aya") return { starterId: "flow", itemId: "whetstone", reason: "手枪加太刀：身法核心补走位，磨刀石抬近身。" };
    return { starterId: "assault", itemId: "ammo", reason: "步枪角色先买火控核心。皮肤只改外观和职业倾向。" };
  }

  function affordLabel(cost, coins, ownedText, buyText) {
    var price = Math.max(0, Math.floor(Number(cost) || 0));
    var wallet = Math.max(0, Math.floor(Number(coins) || 0));
    if (ownedText) return ownedText;
    if (wallet >= price) return buyText || ("🌸 " + price);
    return "还差 🌸 " + (price - wallet);
  }

  function cheapestBuy(coins, shop40, starters, items, skins) {
    var wallet = Math.max(0, Math.floor(Number(coins) || 0));
    var hits = [];
    Object.keys(starters || {}).forEach(function (id) {
      var lv = (shop40 && shop40.starter && shop40.starter[id]) || 0;
      if (lv >= 5) return;
      var cost = 65 + lv * 55;
      if (cost <= wallet) hits.push({ kind: "starter", id: id, name: starters[id].n, cost: cost });
    });
    Object.keys(items || {}).forEach(function (id) {
      var u = items[id];
      var lv = (shop40 && shop40.items && shop40.items[id]) || 0;
      if (lv >= u.max) return;
      var cost = u.base + u.step * lv;
      if (cost <= wallet) hits.push({ kind: "item", id: id, name: u.n, cost: cost });
    });
    (skins || []).forEach(function (skin) {
      if (!skin || !skin.price) return;
      if (skin.price <= wallet) hits.push({ kind: "skin", id: skin.id, name: skin.n, cost: skin.price });
    });
    hits.sort(function (a, b) { return a.cost - b.cost; });
    return hits[0] || null;
  }

  function advice(character, coins, shop40, starters, items, skins) {
    injectStyle();
    var rec = recommend(character);
    var starter = starters && starters[rec.starterId];
    var item = items && items[rec.itemId];
    var hasStarter = !!(shop40 && shop40.equippedStarter);
    var wallet = Math.max(0, Math.floor(Number(coins) || 0));
    var next = cheapestBuy(wallet, shop40, starters, items, skins);
    var line = rec.reason;
    if (!hasStarter && starter) {
      line = wallet >= 65
        ? ("先买「" + starter.n + "」🌸 65。衣装稍后再说。")
        : ("先打完第一章。通关后足够买「" + starter.n + "」。");
    } else if (item && !(shop40 && shop40.items && shop40.items[rec.itemId])) {
      line = rec.reason;
    }
    return {
      version: VERSION,
      coins: wallet,
      recommend: rec,
      next: next,
      firstClearBonus: FIRST_CLEAR,
      line: line,
    };
  }

  function walletNode(character, coins, shop40, starters, items, skins) {
    injectStyle();
    var info = advice(character, coins, shop40, starters, items, skins);
    var node = global.document.createElement("div");
    node.className = "shopWallet44";
    node.id = "shopWallet44";
    var next = info.next ? ("本局可买：" + info.next.name + " 🌸 " + info.next.cost) : "当前买不起新补给。先打一章再回来。";
    node.innerHTML = "<b>🌸 " + info.coins + "</b><p>" + info.line + "</p><em>" + next + "</em>";
    return node;
  }

  function normalizeTab(tab, tabsEl) {
    var id = TABS.indexOf(tab) >= 0 ? tab : "skins";
    if (tabsEl && !tabsEl.querySelector('[data-shop="' + id + '"]')) return "skins";
    return id;
  }

  function rewardParts(kills, level, eliteKills, win, stageReward, alreadyCleared) {
    var killPay = Math.floor(Math.max(0, Number(kills) || 0) * 0.32);
    var levelPay = Math.max(0, Math.floor(Number(level) || 0)) * 3;
    var elitePay = Math.max(0, Math.floor(Number(eliteKills) || 0)) * 4;
    var stagePay = win ? Math.max(0, Math.floor(Number(stageReward) || 0)) : 0;
    var firstClear = win && !alreadyCleared ? FIRST_CLEAR : 0;
    return {
      killPay: killPay,
      levelPay: levelPay,
      elitePay: elitePay,
      stagePay: stagePay,
      firstClear: firstClear,
      total: killPay + levelPay + elitePay + stagePay + firstClear,
    };
  }

  function rewardHtml(parts) {
    var bits = ["击破 " + parts.killPay, "等级 " + parts.levelPay, "精英 " + parts.elitePay];
    if (parts.stagePay) bits.push("通关 " + parts.stagePay);
    if (parts.firstClear) bits.push("首通 " + parts.firstClear);
    return '<small class="coinBreak44">' + bits.join(" · ") + "</small>";
  }

  global.SakurayoEconomy = {
    version: VERSION,
    firstClearBonus: FIRST_CLEAR,
    recommend: recommend,
    affordLabel: affordLabel,
    advice: advice,
    walletNode: walletNode,
    normalizeTab: normalizeTab,
    rewardParts: rewardParts,
    rewardHtml: rewardHtml,
  };
})(typeof window !== "undefined" ? window : globalThis);
