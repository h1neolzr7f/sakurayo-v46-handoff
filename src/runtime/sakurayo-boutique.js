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
  function svg(inner) {
    return '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">' + inner + "</svg>";
  }
  var ICO = {
    boutique: svg('<path fill="#f2c75d" d="M12 22l20-10 20 10v6H12z"/><path fill="#ffe7a3" d="M28 18h8v6h-8z"/><path fill="none" stroke="#f2c75d" stroke-width="4" d="M18 28v24h28V28"/><path fill="#f35aa6" d="M22 36h20v4H22z"/>'),
    supplies: svg('<path fill="#69ddf2" d="M10 24l22-10 22 10v28L32 62 10 52z"/><path fill="#1a2438" d="M12 26l20-9 20 9v24L32 58 12 50z"/><path fill="#f2c75d" d="M12 26l20 10 20-10v6L32 42 12 32z"/><path fill="#ffe7a3" d="M30 18h4v20h-4z"/>'),
    exchange: svg('<circle cx="24" cy="28" r="14" fill="#f2c75d"/><circle cx="40" cy="38" r="14" fill="#69ddf2"/><circle cx="24" cy="28" r="9" fill="#2a183e"/><circle cx="40" cy="38" r="9" fill="#12202c"/><path fill="#ffe7a3" d="M22 22h4v12h-4z"/><path fill="#b8f4ff" d="M38 32h4v12h-4z"/>'),
    core: svg('<path fill="#ff5b74" d="M32 6l20 12v28L32 58 12 46V18z"/><path fill="#2a1020" d="M32 14l13 8v20l-13 8-13-8V22z"/><circle cx="32" cy="32" r="8" fill="#ff8aa8"/><circle cx="32" cy="32" r="3.5" fill="#fff0f5"/>'),
    ammo: svg('<path fill="#69ddf2" d="M18 10h20l8 8v36H18z"/><path fill="#153040" d="M20 12h16l6 6v34H20z"/><path fill="#b8f4ff" d="M22 28h20v4H22zm0 8h20v4H22zm0 8h20v4H22z"/><path fill="#f2c75d" d="M22 16h12v6H22z"/>'),
    ticket: svg('<path fill="#f2c75d" d="M8 22h48v20H8z"/><path fill="#2a183e" d="M12 26h40v12H12z"/><circle cx="8" cy="32" r="5" fill="#100c1e"/><circle cx="56" cy="32" r="5" fill="#100c1e"/><path fill="#ffe7a3" d="M18 30h10v4H18zm14 0h16v4H32z"/>'),
    prism: svg('<path fill="#69ddf2" d="M32 8l18 28-18 20L14 36z"/><path fill="#b8f4ff" d="M32 8l18 28H32z"/><path fill="#3aa0c8" d="M32 8L14 36h18z"/>'),
    shard: svg('<path fill="#c4b5fd" d="M32 6l16 22-6 30L32 48 22 58l-6-30z"/><path fill="#7c5cbf" d="M32 6L16 28l6 30 10-10z"/><path fill="#efe8ff" d="M32 6l8 22-8 20z"/>'),
    sakura: svg('<circle cx="32" cy="32" r="6" fill="#ffe7a3"/><path fill="#f35aa6" d="M32 8c6 8 6 14 0 18-6-4-6-10 0-18zm0 48c-6-8-6-14 0-18 6 4 6 10 0 18zM8 32c8-6 14-6 18 0-4 6-10 6-18 0zm48 0c-8 6-14 6-18 0 4-6 10-6 18 0z"/><path fill="#ff8ac4" d="M14 14c8 2 12 8 10 14-6-2-12-8-10-14zm36 36c-8-2-12-8-10-14 6 2 12 8 10 14zM50 14c-2 8-8 12-14 10 2-6 8-12 14-10zM14 50c2-8 8-12 14-10-2 6-8 12-14 10z"/>'),
    shield: svg('<path fill="#69ddf2" d="M32 8l20 8v18c0 14-10 22-20 26C22 56 12 48 12 34V16z"/><path fill="#153040" d="M32 14l14 6v16c0 10-7 16-14 19-7-3-14-9-14-19V20z"/><path fill="#b8f4ff" d="M32 22v22c5-2 10-7 10-14V26z"/>'),
    moon: svg('<path fill="#f2c75d" d="M40 10a22 22 0 1 0 8 36 18 18 0 1 1-8-36z"/><circle cx="44" cy="18" r="3" fill="#ffe7a3"/>'),
    orb: svg('<circle cx="32" cy="32" r="20" fill="#c4b5fd"/><circle cx="32" cy="32" r="14" fill="#2a1848"/><circle cx="32" cy="32" r="7" fill="#efe8ff"/><path fill="#a78bfa" d="M18 22h8v4h-8z"/>'),
    bait: svg('<circle cx="32" cy="28" r="14" fill="#7dce6a"/><circle cx="26" cy="26" r="2" fill="#12200f"/><circle cx="36" cy="26" r="2" fill="#12200f"/><path fill="#12200f" d="M26 34h10v3H26z"/><path fill="#5aa24c" d="M20 40h24l-4 12H24z"/>'),
    blade: svg('<path fill="#e8eef8" d="M18 50L46 10l6 4-24 44z"/><path fill="#9aa6b8" d="M20 48L46 12l2 2-24 38z"/><path fill="#f2c75d" d="M14 46l8 8-6 2z"/>'),
    gem: svg('<path fill="#69ddf2" d="M16 20h32l8 14-24 22L8 34z"/><path fill="#b8f4ff" d="M16 20h16v14H8z"/><path fill="#2a6f88" d="M32 20h16l8 14H32z"/>'),
    seal: svg('<rect x="14" y="10" width="36" height="44" rx="4" fill="#f2c75d"/><rect x="18" y="14" width="28" height="36" fill="#2a183e"/><path fill="#f35aa6" d="M24 22h16v4H24zm0 8h16v3H24zm0 8h10v3H24z"/>'),
    gift: svg('<path fill="#f35aa6" d="M14 28h36v24H14z"/><path fill="#f2c75d" d="M12 20h40v10H12z"/><path fill="#ffe7a3" d="M30 20h4v32h-4z"/>'),
  };
  var EMOJI = {
    "🎯": "core",
    "🛡️": "shield",
    "🌙": "moon",
    "🔮": "orb",
    "🧟": "bait",
    "🔩": "ammo",
    "🗡️": "blade",
    "🔷": "gem",
    "符": "seal",
    "📦": "gift",
  };
  var CSS =
    "html.landscape46:not(.portraitFallback46) #shopDrawer.isBoutiqueChrome46>.dhead{display:flex;align-items:center;gap:10px;padding:8px 12px;background:linear-gradient(90deg,#2a183ef2,#0b0818 55%,#120e27);border-bottom:1px solid #f2c75d55}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer.isBoutiqueChrome46>.dhead h2{display:flex;align-items:center;gap:8px;margin:0;letter-spacing:.16em;color:#fff7fb;text-shadow:0 0 16px #f2c75d55}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer>.dhead p.shopSub46{display:block;margin:4px 0 0;color:#ffe7a3;font:700 10px/1.35 system-ui;letter-spacing:.1em}" +
    ".shopMark46{display:grid;place-items:center;width:28px;height:28px;border-radius:8px;background:linear-gradient(180deg,#f2c75d,#c48a18);box-shadow:0 0 12px #f2c75d66}" +
    ".shopMark46 svg{width:18px;height:18px}" +
    "html.landscape46:not(.portraitFallback46) .shopRail46 button{display:grid;grid-template-columns:28px 1fr;align-items:center;gap:8px;min-height:58px;padding:8px 10px;border-radius:14px;border:1px solid #f35aa644;background:linear-gradient(180deg,#1a132cee,#120e27ee);color:#fff7fb;text-align:left;box-shadow:inset 0 1px 0 #ffffff14}" +
    "html.landscape46:not(.portraitFallback46) .shopRail46 button small{display:block;margin-top:4px;color:#cfc4df;font:700 9px/1 system-ui;letter-spacing:.08em}" +
    "html.landscape46:not(.portraitFallback46) .shopRail46 button.on{border-color:#f2c75d;background:linear-gradient(90deg,#f2c75d33,#120e27ee);box-shadow:inset 3px 0 0 #f2c75d,0 0 16px #f2c75d33}" +
    ".shopRailIco46{display:grid;place-items:center;width:28px;height:28px;border-radius:8px;background:#171027;border:1px solid #f2c75d44}" +
    ".shopRailIco46 svg{width:18px;height:18px}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer.isBoutique46 #shopList [data-shop-group=skins]{display:grid!important}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer.isBoutique46 #shopList [data-shop-group=starters],html.landscape46:not(.portraitFallback46) #shopDrawer.isBoutique46 #shopList [data-shop-group=items],html.landscape46:not(.portraitFallback46) #shopDrawer.isBoutique46 #shopList [data-shop-group=talismans],html.landscape46:not(.portraitFallback46) #shopDrawer.isBoutique46 #shopList [data-shop-group=extensions]{display:none!important}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer.isSupplies46 #shopList [data-shop-group=skins]{display:none!important}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer.isSupplies46 #shopList [data-shop-group=starters],html.landscape46:not(.portraitFallback46) #shopDrawer.isSupplies46 #shopList [data-shop-group=items],html.landscape46:not(.portraitFallback46) #shopDrawer.isSupplies46 #shopList [data-shop-group=talismans],html.landscape46:not(.portraitFallback46) #shopDrawer.isSupplies46 #shopList [data-shop-group=extensions]{display:grid!important}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer.isFeatured46 #shopList .shopGroup40{display:grid!important}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer.isBoutique46 #shopList .shopGroup40[data-shop-group=skins]{display:grid!important}" +
    ".shopRunway46{grid-column:1/-1;margin:0 0 8px;padding:7px 12px;border-radius:10px;border:1px solid #f2c75d55;background:linear-gradient(90deg,#f2c75d22,#120e2700);color:#ffe7a3;font:800 12px/1.4 system-ui;letter-spacing:.08em}" +
    ".shopTag46{position:absolute;z-index:2;top:8px;left:8px;padding:4px 9px;border-radius:999px;background:#f35aa6;color:#fff;font:800 9px/1 system-ui;letter-spacing:.12em;box-shadow:0 4px 10px #05020d88}" +
    ".shopTag46.on{background:linear-gradient(90deg,#f2c75d,#f35aa6);color:#2a1608}" +
    ".shopPitch46{display:block;margin:4px 0 0;color:#ffd8e8;font:700 11px/1.35 system-ui}" +
    ".shopHeroKicker46{position:absolute;z-index:2;top:10px;left:10px;padding:5px 12px;border-radius:2px;background:#f2c75d;color:#2a1608;font:900 11px/1 system-ui;letter-spacing:.16em;transform:skewX(-10deg);box-shadow:0 6px 16px #05020daa}" +
    "#shopDrawer .skinCard{position:relative;border-radius:16px;box-shadow:0 10px 24px #05020d66}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer .skinCard p,html.landscape46:not(.portraitFallback46) #shopDrawer .shopPitch46{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin:4px 0 0;color:#e7d7ef;font-size:11px;line-height:1.4}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer .skinBias{display:block;margin:4px 0 0;color:#ffe7a3;font:700 10px/1.3 system-ui}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer .skinPreview{position:relative;height:132px;background:radial-gradient(circle at 50% 20%,#3a2458,#171027 70%)}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer .skinPreview:after{content:\"\";position:absolute;inset:auto 0 0;height:42%;background:linear-gradient(180deg,#17102700,#100c1eee)}" +
    "#shopCounter46{display:none}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer.isBoutique46 #shopFeatured46{display:block!important}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer.isBoutique46 #shopList .shopGroup40{display:none!important}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer.isBoutique46 #shopList [data-shop-group=skins]{display:grid!important}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer.isSupplies46 #shopFeatured46{display:none!important}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer.isSupplies46 #shopCounter46{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:0 0 12px}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer.isExchange46 #shopFeatured46,html.landscape46:not(.portraitFallback46) #shopDrawer.isExchange46 #shopCounter46,html.landscape46:not(.portraitFallback46) #shopDrawer.isExchange46 #shopList .shopGroup40{display:none!important}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer.isExchange46 #shopExchange46{display:grid!important;grid-template-columns:1fr 1fr;gap:10px}" +
    "html.landscape46:not(.portraitFallback46) #shopFeatured46 .shopSkin46{position:relative;display:grid;grid-template-columns:minmax(96px,22%) 1fr minmax(128px,22%);min-height:120px;max-height:136px;margin:0 0 12px;overflow:hidden;border-radius:18px;border:1px solid #f2c75d88;background:linear-gradient(135deg,#3a2158f2,#100c1cee);box-shadow:0 12px 28px #05020d88}" +
    "html.landscape46:not(.portraitFallback46) #shopFeatured46 .shopSkinPrev46{position:relative;width:100%;height:136px;overflow:hidden;background:radial-gradient(circle at 40% 20%,#4a2a6e,#171027 72%)}" +
    "html.landscape46:not(.portraitFallback46) #shopFeatured46 .shopSkinPrev46 img{width:100%;height:100%;object-fit:cover;object-position:center top}" +
    "html.landscape46:not(.portraitFallback46) #shopFeatured46 .shopSkin46>div{padding:10px 12px 0}" +
    "html.landscape46:not(.portraitFallback46) #shopFeatured46 .shopSkin46 h3{margin:0;font-size:16px;letter-spacing:.12em}" +
    "html.landscape46:not(.portraitFallback46) #shopFeatured46 .shopSkin46 p,html.landscape46:not(.portraitFallback46) #shopFeatured46 .shopSkin46 .shopPitch46,html.landscape46:not(.portraitFallback46) #shopFeatured46 .shopSkin46 .skinBias{display:block}" +
    "html.landscape46:not(.portraitFallback46) #shopFeatured46 .shopSkin46 button,html.landscape46:not(.portraitFallback46) #shopDrawer .skinCard button,html.landscape46:not(.portraitFallback46) .shopGood46 button{margin:auto 12px 12px;min-height:42px;border-radius:12px;border:1px solid #f2c75d88;background:linear-gradient(180deg,#ff9ad4,#b02078);color:#fff;box-shadow:0 6px 14px #b0207844}" +
    "#shopDrawer .shopGoodIco46:before,#shopDrawer .shopGoodIco46:after{display:none!important}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer .shopGoodIco46{height:108px!important;background:radial-gradient(circle at 50% 30%,#3a2458,#14101f 72%);border-bottom:1px solid #f2c75d33}" +
    "#shopDrawer .shopGoodIco46 svg{width:56px;height:56px;filter:drop-shadow(0 6px 10px #05020d88)}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer .shopGood46,html.landscape46:not(.portraitFallback46) #shopExchange46 .shopGood46{border-radius:16px;border:1px solid #69ddf255;background:linear-gradient(180deg,#221833f2,#100c1eee);box-shadow:0 10px 22px #05020d66;overflow:hidden}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer .shopIcon40{width:100%;height:72px;border-radius:0;border:0;background:radial-gradient(circle at 50% 30%,#3a2458,#171027 72%);font-size:0}" +
    "#shopDrawer .shopIcon40 svg{width:40px;height:40px;filter:drop-shadow(0 4px 8px #05020d88)}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer .shopItem40{overflow:hidden;border-radius:16px;border:1px solid #f35aa644;box-shadow:0 10px 22px #05020d55}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer .shopChip46 i{display:grid;place-items:center;width:16px;height:16px;font-size:0}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer .shopChip46 i svg{width:14px;height:14px}" +
    "html.shortWindow46 #shopFeatured46 .shopSkin46{grid-template-columns:84px 1fr minmax(110px,24%);min-height:80px;max-height:88px;margin:0 0 8px}" +
    "html.shortWindow46 #shopFeatured46 .shopSkinPrev46,html.shortWindow46 #shopDrawer .skinPreview{height:88px!important}" +
    "html.shortWindow46 #shopFeatured46 .shellHint46,html.shortWindow46 .shopRunway46,html.shortWindow46 .shopSub46,html.shortWindow46 #shopFeatured46 .shopSkin46 p,html.shortWindow46 #shopFeatured46 .shopSkin46 .skinBias,html.shortWindow46 #shopFeatured46 .shopSkin46 .shopPitch46{display:none!important}" +
    "html.landscape46.shortWindow46:not(.portraitFallback46) #shopDrawer.isBoutique46 #shopList [data-shop-group=skins]{display:none!important}" +
    "html.shortWindow46 #shopList .shopTabs40{display:flex!important;flex-wrap:wrap;gap:6px;margin:0 0 8px}" +
    "html.shortWindow46 #shopList .shopTabs40 button{min-height:36px;padding:6px 10px}";

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

  function kindOfIco(el) {
    var keys = ["core", "ammo", "ticket", "prism", "shard", "sakura", "shield", "moon", "orb", "bait", "blade", "gem", "seal", "gift"];
    for (var i = 0; i < keys.length; i++) {
      if (el.classList.contains(keys[i])) return keys[i];
    }
    return "";
  }

  function dressIcons(root) {
    $$(".shopGoodIco46", root).forEach(function (el) {
      var kind = kindOfIco(el) || "gift";
      if (el.getAttribute("data-shop-ico") === kind && el.querySelector("svg")) return;
      el.innerHTML = ICO[kind] || ICO.gift;
      el.setAttribute("data-shop-ico", kind);
    });
    $$(".shopIcon40", root).forEach(function (el) {
      var raw = (el.getAttribute("data-shop-raw") || el.textContent || "").trim();
      if (!el.getAttribute("data-shop-raw")) el.setAttribute("data-shop-raw", raw);
      var kind = EMOJI[raw] || "gift";
      if (el.getAttribute("data-shop-ico") === kind && el.querySelector("svg")) return;
      el.innerHTML = ICO[kind] || ICO.gift;
      el.setAttribute("data-shop-ico", kind);
    });
    $$(".shopChip46", root).forEach(function (chip) {
      var kind = kindOfIco(chip) || "sakura";
      var mark = chip.querySelector("i");
      if (!mark) return;
      if (mark.getAttribute("data-shop-ico") === kind && mark.querySelector("svg")) return;
      mark.innerHTML = ICO[kind] || ICO.sakura;
      mark.setAttribute("data-shop-ico", kind);
    });
  }

  function dressTitle(drawer) {
    var h2 = drawer.querySelector(".dhead h2");
    if (h2) {
      h2.innerHTML = '<i class="shopMark46">' + ICO.boutique + "</i>时装商店";
    }
    var p = drawer.querySelector(".dhead p");
    if (p) {
      p.classList.add("shopSub46");
      p.textContent = "本期全套上架 · 试穿即买 · 穿上就上场";
    }
    drawer.classList.add("isBoutiqueChrome46");
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
    hint.textContent = "橱窗改外观倾向 · 补给柜加伤害 · 寻访叠层火力";
    var counter = list.querySelector("#shopCounter46");
    if (!counter) {
      counter = global.document.createElement("section");
      counter.id = "shopCounter46";
      if (shelf.nextSibling) list.insertBefore(counter, shelf.nextSibling);
      else list.appendChild(counter);
    }
    if (leftoverGoods.length) {
      counter.innerHTML = "";
      leftoverGoods.forEach(function (node) {
        counter.appendChild(node);
      });
    }
    dressIcons(drawer);
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
    var next = global.document.createElement("nav");
    next.className = "shopRail46";
    if (rail && rail.parentNode) rail.parentNode.replaceChild(next, rail);
    else {
      var list = body.querySelector("#shopList");
      if (list) body.insertBefore(next, list);
      else body.appendChild(next);
    }
    next.innerHTML =
      '<button type="button" data-shop-rail="boutique"><i class="shopRailIco46">' + ICO.boutique + "</i><span>橱窗<small>全套上架</small></span></button>" +
      '<button type="button" data-shop-rail="supplies"><i class="shopRailIco46">' + ICO.supplies + "</i><span>补给柜<small>核心加伤</small></span></button>" +
      '<button type="button" data-shop-rail="exchange"><i class="shopRailIco46">' + ICO.exchange + "</i><span>兑换<small>货币柜台</small></span></button>";
    next.onclick = function (ev) {
      var btn = ev.target.closest ? ev.target.closest("[data-shop-rail]") : null;
      if (!btn) return;
      setRail(btn.getAttribute("data-shop-rail"));
      paintRail(drawer);
      fillHero(drawer);
    };
    paintRail(drawer);
    fillHero(drawer);
    if (global.SakurayoChrome && typeof global.SakurayoChrome.dress === "function") {
      global.SakurayoChrome.dress(drawer);
    }
  }

  function hook() {
    var S = global.SakurayoShell;
    if (!S || S.__boutique6106) return !!S;
    S.__boutique6106 = true;
    injectStyle();
    var orig = S.decorateShop;
    var busy = false;
    S.decorateShop = function (drawer, api) {
      if (busy) return;
      busy = true;
      try {
        if (typeof orig === "function") orig(drawer, api);
        decorate(drawer || (global.document && global.document.getElementById("shopDrawer")), api);
      } finally {
        busy = false;
      }
    };
    if (typeof S.setShopRail === "function") {
      var oldSet = S.setShopRail;
      S.setShopRail = function (id) {
        return oldSet(setRail(id));
      };
    }
    if (typeof S.onOpen === "function") {
      var origOpen = S.onOpen;
      S.onOpen = function (name, api) {
        origOpen(name, api);
        if (name === "shop") {
          decorate(global.document && global.document.getElementById("shopDrawer"), api);
        }
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

  global.SakurayoBoutique = { version: "4.7.0", install: install, decorate: decorate };
  if (global.document && global.document.readyState !== "loading") install();
  else if (global.document) global.document.addEventListener("DOMContentLoaded", install);
})(typeof window !== "undefined" ? window : globalThis);
