(function (global) {
  "use strict";

  var STYLE_ID = "sakurayo-boutique-css";
  var shopRail = "boutique";
  var PITCH = {
    "原初战装": ["常驻", "小队标准剪影，干净上场。"],
    "霓虹战术风衣": ["机枪向", "霓虹夜里最锋利的剪影。"],
    "绯血生体礼服": ["生体向", "礼服下是会呼吸的战场。"],
    "星辉灵能裙装": ["灵能向", "星辉一闪，咒语先到。"],
    "剑道部夜羽织": ["刃道向", "夜色里只听刀出鞘。"],
    "末日舞台演出服": ["舞台向", "灯灭之后，安可才开始。"],
    "炼金防污围裙": ["炼金向", "实验事故也要好看。"],
    "百鬼召唤睡衣": ["召灵向", "睡衣出门，百鬼买单。"],
    "镜夜祭典巫女服": ["本期主推", "祭典今晚开张，神乐先开刃。"],
    "薄樱观测服": ["观测向", "镜外第一套上架的观测服。"],
    "月影怪盗礼服": ["怪盗向", "月影一闪，礼服先到场。"],
  };
  var CSS =
    "html.landscape46:not(.portraitFallback46) #shopDrawer>.dhead p.shopSub46{display:block;margin:4px 0 0;color:#ffe7a3;font:700 10px/1.35 system-ui;letter-spacing:.1em}" +
    "html.landscape46:not(.portraitFallback46) .shopRail46 button{min-height:52px}" +
    "html.landscape46:not(.portraitFallback46) .shopRail46 button small{display:block;margin-top:4px;color:#cfc4df;font:700 9px/1 system-ui;letter-spacing:.08em}" +
    "html.landscape46:not(.portraitFallback46) .shopRail46 button.on{border-color:#f2c75d;background:linear-gradient(90deg,#f2c75d33,#120e27ee);box-shadow:inset 3px 0 0 #f2c75d,0 0 12px #f35aa622}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer.isBoutique46 #shopList [data-shop-group=skins]{display:grid!important}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer.isBoutique46 #shopList [data-shop-group=starters],html.landscape46:not(.portraitFallback46) #shopDrawer.isBoutique46 #shopList [data-shop-group=items],html.landscape46:not(.portraitFallback46) #shopDrawer.isBoutique46 #shopList [data-shop-group=talismans],html.landscape46:not(.portraitFallback46) #shopDrawer.isBoutique46 #shopList [data-shop-group=extensions]{display:none!important}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer.isSupplies46 #shopList [data-shop-group=skins]{display:none!important}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer.isSupplies46 #shopList [data-shop-group=starters],html.landscape46:not(.portraitFallback46) #shopDrawer.isSupplies46 #shopList [data-shop-group=items],html.landscape46:not(.portraitFallback46) #shopDrawer.isSupplies46 #shopList [data-shop-group=talismans],html.landscape46:not(.portraitFallback46) #shopDrawer.isSupplies46 #shopList [data-shop-group=extensions]{display:grid!important}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer.isFeatured46 #shopList .shopGroup40{display:grid!important}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer.isBoutique46 #shopList .shopGroup40[data-shop-group=skins]{display:grid!important}" +
    ".shopRunway46{grid-column:1/-1;margin:0 0 6px;color:#ffe7a3;font:800 12px/1.4 system-ui;letter-spacing:.08em}" +
    ".shopTag46{position:absolute;z-index:2;top:8px;left:8px;padding:3px 8px;border-radius:6px;background:#f35aa6;color:#fff;font:800 9px/1 system-ui;letter-spacing:.12em}" +
    ".shopTag46.on{background:linear-gradient(90deg,#f2c75d,#f35aa6);color:#2a1608}" +
    ".shopPitch46{display:block;margin:4px 0 0;color:#ffd8e8;font:700 11px/1.35 system-ui}" +
    ".shopHeroKicker46{position:absolute;z-index:2;top:10px;left:10px;padding:4px 10px;border-radius:2px;background:#f2c75d;color:#2a1608;font:900 11px/1 system-ui;letter-spacing:.16em;transform:skewX(-10deg)}" +
    "#shopDrawer .skinCard{position:relative}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer .skinCard p,html.landscape46:not(.portraitFallback46) #shopDrawer .shopPitch46{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin:4px 0 0;color:#e7d7ef;font-size:11px;line-height:1.4}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer .skinBias{display:block;margin:4px 0 0;color:#ffe7a3;font:700 10px/1.3 system-ui}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer .skinPreview{height:128px}" +
    "#shopCounter46{display:none}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer.isBoutique46 #shopFeatured46{display:block!important}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer.isBoutique46 #shopList .shopGroup40{display:none!important}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer.isBoutique46 #shopList [data-shop-group=skins]{display:grid!important}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer.isSupplies46 #shopFeatured46{display:none!important}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer.isSupplies46 #shopCounter46{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:0 0 10px}" +
    "html.landscape46:not(.portraitFallback46) #shopFeatured46 .shopSkin46{position:relative;display:grid;grid-template-columns:minmax(96px,22%) 1fr minmax(128px,22%);min-height:112px;max-height:128px;margin:0 0 10px;overflow:hidden;border-radius:18px;border:1px solid #f2c75d66;background:linear-gradient(135deg,#2a183ef2,#100c1cee)}" +
    "html.landscape46:not(.portraitFallback46) #shopFeatured46 .shopSkinPrev46{position:relative;width:100%;height:128px;overflow:hidden;background:#171027}" +
    "html.landscape46:not(.portraitFallback46) #shopFeatured46 .shopSkinPrev46 img{width:100%;height:100%;object-fit:cover;object-position:center top}" +
    "html.landscape46:not(.portraitFallback46) #shopFeatured46 .shopSkin46>div{padding:10px 12px 0}" +
    "html.landscape46:not(.portraitFallback46) #shopFeatured46 .shopSkin46 h3{margin:0;font-size:16px;letter-spacing:.12em}" +
    "html.landscape46:not(.portraitFallback46) #shopFeatured46 .shopSkin46 p,html.landscape46:not(.portraitFallback46) #shopFeatured46 .shopSkin46 .shopPitch46,html.landscape46:not(.portraitFallback46) #shopFeatured46 .shopSkin46 .skinBias{display:block}" +
    "html.landscape46:not(.portraitFallback46) #shopFeatured46 .shopSkin46 button{margin:auto 12px 12px;min-height:42px;border-radius:10px;border:1px solid #f2c75d66;background:linear-gradient(180deg,#ff86cc,#b02078);color:#fff}" +
    "html.shortWindow46 #shopFeatured46 .shopSkin46{grid-template-columns:84px 1fr minmax(110px,24%);min-height:96px;max-height:104px}" +
    "html.shortWindow46 #shopFeatured46 .shopSkinPrev46,html.shortWindow46 #shopDrawer .skinPreview{height:96px!important}" +
    "html.shortWindow46 #shopFeatured46 .shellHint46,html.shortWindow46 .shopRunway46{display:none}" +
    "html.shortWindow46 #shopList [data-shop-group=skins]{grid-template-columns:repeat(2,minmax(0,1fr))!important}";

  function $$(sel, root) {
    var doc = root || global.document;
    return doc ? Array.prototype.slice.call(doc.querySelectorAll(sel)) : [];
  }

  function injectStyle() {
    if (!global.document) return;
    var style = global.document.getElementById(STYLE_ID);
    if (!style) {
      style = global.document.createElement("style");
      style.id = STYLE_ID;
      (global.document.head || global.document.documentElement).appendChild(style);
    }
    style.textContent = CSS;
  }

  function setRail(id) {
    if (id === "featured" || id === "skins") id = "boutique";
    if (id === "starters" || id === "items" || id === "talismans") id = "supplies";
    shopRail = id || "boutique";
    return shopRail;
  }

  function dressTitle(drawer) {
    var h2 = drawer.querySelector(".dhead h2");
    if (h2) h2.textContent = "时装商店";
    var p = drawer.querySelector(".dhead p");
    if (p) {
      p.classList.add("shopSub46");
      p.textContent = "本期全套上架 · 试穿即买 · 穿上就上场";
    }
  }

  function dressCards(list) {
    $$("[data-shop-group=skins] .skinCard", list).forEach(function (card) {
      var name = ((card.querySelector("h3") || {}).textContent || "").trim();
      var pitch = PITCH[name] || ["上架", "本期衣橱现货，试穿即买。"];
      var btn = ((card.querySelector("button") || {}).textContent || "");
      var tag = card.querySelector(".shopTag46");
      if (!tag) {
        tag = global.document.createElement("em");
        tag.className = "shopTag46";
        card.appendChild(tag);
      }
      var label = pitch[0];
      if (btn.indexOf("已装备") >= 0) label = "穿上中";
      else if (btn.indexOf("装备") >= 0) label = "已收入";
      tag.textContent = label;
      tag.classList.toggle("on", label === "穿上中" || label === "本期主推");
      var line = card.querySelector(".shopPitch46");
      if (!line) {
        line = global.document.createElement("small");
        line.className = "shopPitch46";
        var bias = card.querySelector(".skinBias");
        if (bias && bias.parentNode) bias.parentNode.insertBefore(line, bias);
        else (card.querySelector("div") || card).appendChild(line);
      }
      line.textContent = pitch[1];
    });
  }

  function ensureRunway(list) {
    var skins = list.querySelector("[data-shop-group=skins]");
    if (!skins) return;
    var bar = skins.querySelector(".shopRunway46");
    if (!bar) {
      bar = global.document.createElement("p");
      bar.className = "shopRunway46";
      skins.insertBefore(bar, skins.firstChild);
    }
    bar.textContent = "本季衣橱 " + $$(".skinCard", skins).length + " 套全数上架 · 试穿即买 · 只改外观与职业倾向";
  }

  function pickHero(cards) {
    var best = null;
    var score = -1;
    cards.forEach(function (card) {
      var name = ((card.querySelector("h3") || {}).textContent || "").trim();
      var btn = ((card.querySelector("button") || {}).textContent || "");
      var n = 0;
      if (name.indexOf("祭典") >= 0) n += 80;
      if (name.indexOf("怪盗") >= 0) n += 40;
      if (btn.indexOf("已装备") < 0 && btn.indexOf("装备") < 0) n += 28;
      n += Number((btn.match(/\d+/) || [0])[0]) / 10;
      if (n > score) {
        score = n;
        best = card;
      }
    });
    return best || cards[0] || null;
  }

  function fillHero(drawer) {
    var list = drawer.querySelector("#shopList");
    if (!list) return;
    dressTitle(drawer);
    dressCards(list);
    ensureRunway(list);
    var shelf = list.querySelector("#shopFeatured46");
    if (!shelf) {
      shelf = global.document.createElement("section");
      shelf.id = "shopFeatured46";
      list.insertBefore(shelf, list.firstChild);
    }
    var leftoverGoods = $$("#shopFeatured46 .shopGood46", list);
    var cards = $$("[data-shop-group=skins] .skinCard", list);
    var hero = pickHero(cards);
    var old = shelf.querySelector(".shopSkin46");
    if (old && old.parentNode) old.parentNode.removeChild(old);
    if (hero) {
      var clone = hero.cloneNode(true);
      clone.className = "shopSkin46";
      clone.classList.remove("skinCard");
      var preview = clone.querySelector(".skinPreview");
      if (preview) preview.className = "shopSkinPrev46";
      var kicker = clone.querySelector(".shopHeroKicker46") || global.document.createElement("em");
      kicker.className = "shopHeroKicker46";
      kicker.textContent = "本期主推";
      if (!kicker.parentNode) clone.insertBefore(kicker, clone.firstChild);
      var srcBtn = hero.querySelector("button");
      var btn = clone.querySelector("button");
      if (btn && srcBtn) {
        var raw = srcBtn.textContent || "";
        btn.textContent = /已装备|装备/.test(raw) ? raw : "收入衣橱 · " + raw;
        btn.onclick = function () { srcBtn.click(); };
      }
      shelf.insertBefore(clone, shelf.firstChild);
    }
    var hint = shelf.querySelector(".shellHint46");
    if (!hint) {
      hint = global.document.createElement("p");
      hint.className = "shellHint46";
      shelf.appendChild(hint);
    }
    hint.textContent = "衣装只改外观 · 核心/道具写入存档 · 不出售永久伤害";
    var counter = list.querySelector("#shopCounter46");
    if (!counter) {
      counter = global.document.createElement("section");
      counter.id = "shopCounter46";
      if (shelf.nextSibling) list.insertBefore(counter, shelf.nextSibling);
      else list.appendChild(counter);
    }
    leftoverGoods.forEach(function (node) {
      counter.appendChild(node);
    });
  }

  function paintRail(drawer) {
    $$("[data-shop-rail]", drawer).forEach(function (btn) {
      btn.classList.toggle("on", btn.getAttribute("data-shop-rail") === shopRail);
    });
    drawer.classList.toggle("isBoutique46", shopRail === "boutique");
    drawer.classList.toggle("isSupplies46", shopRail === "supplies");
    drawer.classList.toggle("isExchange46", shopRail === "exchange");
    drawer.classList.toggle("isFeatured46", false);
  }

  function decorate(drawer, api) {
    if (!drawer) return;
    injectStyle();
    dressTitle(drawer);
    var body = drawer.querySelector(".dbody");
    if (!body) return;
    var rail = body.querySelector(".shopRail46");
    if (!rail) {
      rail = global.document.createElement("nav");
      rail.className = "shopRail46";
      var list = body.querySelector("#shopList");
      if (list) body.insertBefore(rail, list);
      else body.appendChild(rail);
    }
    rail.innerHTML =
      '<button type="button" data-shop-rail="boutique">橱窗<small>全套上架</small></button>' +
      '<button type="button" data-shop-rail="supplies">补给柜<small>核心道具</small></button>' +
      '<button type="button" data-shop-rail="exchange">兑换<small>货币柜台</small></button>';
    rail.onclick = function (ev) {
      var btn = ev.target.closest ? ev.target.closest("[data-shop-rail]") : null;
      if (!btn) return;
      setRail(btn.getAttribute("data-shop-rail"));
      if (shopRail === "boutique" && api && api.clickTab) api.clickTab("skins");
      if (shopRail === "supplies" && api && api.clickTab) api.clickTab("starters");
      paintRail(drawer);
      fillHero(drawer);
    };
    if (shopRail === "boutique" && api && api.clickTab) api.clickTab("skins");
    paintRail(drawer);
    fillHero(drawer);
  }

  function hook() {
    var S = global.SakurayoShell;
    if (!S || S.__boutique6105) return !!S;
    S.__boutique6105 = true;
    injectStyle();
    var orig = S.decorateShop;
    S.decorateShop = function (drawer, api) {
      if (typeof orig === "function") orig(drawer, api);
      decorate(drawer || (global.document && global.document.getElementById("shopDrawer")), api);
    };
    if (typeof S.setShopRail === "function") {
      var oldSet = S.setShopRail;
      S.setShopRail = function (id) {
        return oldSet(setRail(id));
      };
    }
    var drawer = global.document && global.document.getElementById("shopDrawer");
    if (drawer && !drawer.classList.contains("hidden")) S.decorateShop(drawer, {});
    return true;
  }

  function install() {
    injectStyle();
    if (hook()) return true;
    var n = 0;
    var timer = global.setInterval(function () {
      n += 1;
      if (hook() || n > 40) global.clearInterval(timer);
    }, 120);
    return false;
  }

  global.SakurayoBoutique = { version: "4.6.0", install: install, decorate: decorate };
  if (global.document && global.document.readyState !== "loading") install();
  else if (global.document) global.document.addEventListener("DOMContentLoaded", install);
})(typeof window !== "undefined" ? window : globalThis);
