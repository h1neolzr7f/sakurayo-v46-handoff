(function (global) {
  "use strict";

  var STYLE_ID = "sakurayo-layout52-css";
  var HIT_CSS =
    "html,body{touch-action:manipulation!important}" +
    "canvas,#hud,#level,#joy{touch-action:none}" +
    "#menu,#menu.homeDock46,#menu.homeDock46 .menu{pointer-events:auto!important}" +
    "#menu.homeDock46 button,#menu.homeDock46 .charCard,#menu.homeDock46 .homeNav46,#menu.homeDock46 .homeRail46,#menu.homeDock46 .homeBanner46,#menu.homeDock46 .charSelectPanel,#menu.homeDock46 .start,#menu.homeDock46 .homeModes46,#menu.homeDock46 .stageMini,#menu.homeDock46 .profile,#menu.homeDock46 .coins,#menu.homeDock46 .homeCoinPlus46,#menu.homeDock46 .heroTap46,.drawer button,.drawer .close,.choice,#pause,#dash,#skill,#resume,#back,#opsDock46,#opsDock46 button{pointer-events:auto!important;touch-action:manipulation!important}" +
    "#menu.homeDock46 .homeDeck46{pointer-events:none!important}" +
    "#menu.homeDock46 .homeDeck46 .stageMini,#menu.homeDock46 .homeDeck46 .homeModes46,#menu.homeDock46 .homeDeck46 #start,#menu.homeDock46 .homeDeck46 button{pointer-events:auto!important}" +
    "#menu.homeDock46 .heroLive46,#menu.homeDock46 .heroLiveBreath46,#menu.homeDock46 .bg,#yeyingDevBadge53{pointer-events:none!important}" +
    "html.landscape46 #menu.homeDock46 .top,html.androidLandscape46 #menu.homeDock46 .top{height:52px!important;max-height:52px!important;overflow:visible!important;z-index:10!important;pointer-events:none!important}" +
    "html.landscape46 #menu.homeDock46 .top .profile,html.landscape46 #menu.homeDock46 .top .coins,html.landscape46 #menu.homeDock46 .top button,html.landscape46 #menu.homeDock46 .top .charSelectPanel,html.landscape46 #menu.homeDock46 .top #homeWallet46,html.landscape46 #menu.homeDock46 .top #homeQuick46,html.androidLandscape46 #menu.homeDock46 .top .profile,html.androidLandscape46 #menu.homeDock46 .top .coins,html.androidLandscape46 #menu.homeDock46 .top button,html.androidLandscape46 #menu.homeDock46 .top .charSelectPanel,html.androidLandscape46 #menu.homeDock46 .top #homeWallet46,html.androidLandscape46 #menu.homeDock46 .top #homeQuick46{pointer-events:auto!important}" +
    "html.androidLandscape46 #menu.homeDock46 .heroLive46,html.landscape46.portraitFallback46 #menu.homeDock46 .heroLive46{width:42%!important;max-width:46%;top:0!important;bottom:96px!important;z-index:1!important;pointer-events:none!important}" +
    "html.androidLandscape46 #menu.homeDock46 .homeDeck46,html.landscape46.portraitFallback46 #menu.homeDock46 .homeDeck46{display:flex!important;flex-direction:column;position:absolute!important;right:max(12px,env(safe-area-inset-right))!important;top:max(58px,calc(env(safe-area-inset-top) + 48px))!important;bottom:max(78px,calc(env(safe-area-inset-bottom) + 68px))!important;width:min(36vw,300px)!important;z-index:12!important;pointer-events:none!important}" +
    "html.androidLandscape46 #menu.homeDock46 .nav.homeNav46,html.landscape46.portraitFallback46 #menu.homeDock46 .nav.homeNav46{position:absolute!important;left:50%!important;bottom:max(8px,env(safe-area-inset-bottom))!important;transform:translateX(-50%)!important;z-index:13!important;pointer-events:auto!important}" +
    "html.androidLandscape46 #menu.homeDock46 .homeRail46,html.landscape46.portraitFallback46 #menu.homeDock46 .homeRail46{position:absolute!important;z-index:12!important;pointer-events:auto!important}" +
    "html.androidLandscape46 #menu.homeDock46 .homeBanner46,html.landscape46.portraitFallback46 #menu.homeDock46 .homeBanner46{z-index:12!important;pointer-events:auto!important}" +
    "html.androidLandscape46 #menu.homeDock46 .charSelectPanel,html.landscape46.portraitFallback46 #menu.homeDock46 .charSelectPanel{z-index:14!important;pointer-events:auto!important;bottom:auto!important}" +
    "html.landscape46:not(.portraitFallback46) .utilityButtons37{display:none!important}" +
    "html.landscape46:not(.portraitFallback46) #dash,html.landscape46:not(.portraitFallback46) #skill{min-width:52px;min-height:52px}" +
    "html.landscape46:not(.portraitFallback46) #pause{min-width:40px;min-height:40px}";

  var CSS =
    HIT_CSS +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .menuBrand35{display:none!important}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .heroLive46{width:42%;max-width:46%;top:0;bottom:108px!important;z-index:1;pointer-events:none!important;-webkit-mask-image:linear-gradient(to right,#000 0%,#000 70%,transparent 100%),linear-gradient(to top,transparent 0%,#000 10%,#000 100%);mask-image:linear-gradient(to right,#000 0%,#000 70%,transparent 100%),linear-gradient(to top,transparent 0%,#000 10%,#000 100%);-webkit-mask-composite:source-in;mask-composite:intersect}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .heroLiveBreath46{width:min(40vw,420px);height:100%}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .heroLiveBreath46 img{object-fit:contain;object-position:center 10%}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .top{align-items:center}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .profile{flex:none;max-width:200px;max-height:44px;overflow:visible;z-index:8}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .profile>div{flex-wrap:nowrap;overflow:hidden}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeSupport46{display:none}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .top .charSelectPanel{position:static!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;width:auto;margin:0 8px 0 auto;padding:0;background:transparent;border:0;box-shadow:none;z-index:14;pointer-events:auto;flex:0 0 auto}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .top .charSelectPanel .sectionTitle{display:none!important}" +
    "html.landscape46:not(.portraitFallback46) #homeWallet46{margin-left:0}" +
    "html.landscape46:not(.portraitFallback46) #homeWallet46 .homeChip46.prism,html.landscape46:not(.portraitFallback46) #homeWallet46 .homeChip46.shard{display:none!important}" +
    "html.landscape46:not(.portraitFallback46) #homeQuick46{gap:12px}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 #moreButton39{margin-left:10px;padding:0 12px}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 #homeGreet46,html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeGreet46{position:absolute;left:44px;top:calc(100% + 4px);margin:0;max-width:190px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;z-index:6;pointer-events:none}" +
    "@media(max-height:430px){html.landscape46:not(.portraitFallback46) #menu.homeDock46 #homeGreet46,html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeGreet46{display:none!important}}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeRail46{top:max(58px,calc(env(safe-area-inset-top) + 48px));bottom:max(140px,calc(env(safe-area-inset-bottom) + 128px));padding:4px 3px;gap:3px;justify-content:space-between;overflow:hidden}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeRail46 button{min-width:42px;min-height:42px;padding:6px 4px}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeRail46 button b,html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeRail46 button small{display:none}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeBanner46{left:max(12px,env(safe-area-inset-left))!important;bottom:max(78px,calc(env(safe-area-inset-bottom) + 68px))!important;width:50px!important;min-height:48px!important;padding:4px!important;grid-template-columns:1fr!important;justify-items:center}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeBanner46 img{width:42px;height:36px}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeBanner46 b,html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeBanner46 small,html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeBanner46 em,html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeBannerDots46{display:none}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .nav.homeNav46{width:min(480px,52vw);z-index:13}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeDeck46{z-index:12}" +
    "@media(max-height:409px){html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeBanner46{display:none!important}html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeRail46{bottom:max(78px,calc(env(safe-area-inset-bottom) + 68px))}}" +
    "@media(max-height:370px){html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeDeck46{bottom:max(80px,calc(env(safe-area-inset-bottom) + 70px));gap:4px;overflow:hidden}html.landscape46:not(.portraitFallback46) #menu.homeDock46 .stageMini{min-height:48px;padding:6px 10px}html.landscape46:not(.portraitFallback46) #menu.homeDock46 .stageMini p,html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeStageProg46{display:none!important}html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeModes46 button{min-height:36px;padding:4px 8px}html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeModes46 button small{display:none}html.landscape46:not(.portraitFallback46) #menu.homeDock46 .start{min-height:40px;flex:0 0 40px}}" +
    "html.landscape46.shortWindow46 #menu.homeDock46 .heroLive46{width:40%;bottom:88px!important}" +
    "html.landscape46.shortWindow46 #menu.homeDock46 .top .charSelectPanel{position:static!important;left:auto!important;top:auto!important;margin:0 6px 0 auto}" +
    "html.landscape46.shortWindow46 #menu.homeDock46 .homeDeck46{bottom:max(88px,calc(env(safe-area-inset-bottom) + 78px))}" +
    "html.landscape46:not(.portraitFallback46) #hud .hero{max-width:220px}" +
    "html.landscape46:not(.portraitFallback46) #hud .rinfo{display:none}" +
    "html.landscape46:not(.portraitFallback46) #hud .wave{left:auto;right:max(168px,calc(env(safe-area-inset-right) + 156px));transform:none;width:min(200px,22vw)}" +
    "html.landscape46:not(.portraitFallback46) #hud .mission{left:auto;right:max(168px,calc(env(safe-area-inset-right) + 156px));transform:none;max-width:min(220px,24vw)}" +
    "html.landscape46:not(.portraitFallback46) #hud .perf{right:58px}" +
    "html.landscape46:not(.portraitFallback46) #combo.on51{top:max(52px,calc(env(safe-area-inset-top) + 44px));right:14px}" +
    "html.landscape46:not(.portraitFallback46) .banter,html.landscape46:not(.portraitFallback46) #banter{width:min(32vw,292px)!important;padding:4px 12px!important;bottom:max(14px,env(safe-area-inset-bottom))!important}" +
    "html.landscape46:not(.portraitFallback46) #result.sceneOn47 .modal{grid-template-columns:128px minmax(200px,.9fr) minmax(240px,1.25fr);grid-template-areas:'hero title report' 'hero summary report' 'hero stats route' 'actions actions actions'}" +
    "html.landscape46:not(.portraitFallback46) #result .resultHero47{grid-area:hero;position:relative;left:auto;right:auto;top:auto;bottom:auto;width:100%;height:100%;min-height:168px;background-position:center 12%;background-size:auto 100%}" +
    "html.landscape46:not(.portraitFallback46) #result .resultIcon{grid-area:title;justify-self:start;align-self:end;margin:0 8px 0 0;font-size:20px}" +
    "html.landscape46:not(.portraitFallback46) #result .rankBig{grid-area:title;justify-self:start;align-self:end;margin:0 0 0 28px;font-size:34px;line-height:1;text-shadow:0 2px 16px #05040e,0 0 20px #05040e}" +
    "html.landscape46:not(.portraitFallback46) #result #rtitle{padding-left:64px}" +
    "html.landscape46:not(.portraitFallback46) #result #endingTag{grid-area:hero;align-self:end;justify-self:stretch;position:relative;left:auto;top:auto;max-width:none;margin:0;text-align:center}" +
    "html.landscape46:not(.portraitFallback46) #level .levelRailArt47{background-size:auto 100%;background-position:center 12%}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .start{clip-path:none}" +
    "#paused .modal,#result .modal{position:relative;background:#140e24f6;opacity:1!important}" +
    "#paused .actions button.secondary,#result .actions button.secondary,#fxToggle,#banterToggle,#retryP,#quit,#back{background:#2a1848!important;border:1px solid #f2c75d!important;color:#ffe7a3!important;box-shadow:0 0 0 1px #f2c75d55!important}" +
    "#paused .actions button.primary,#result .actions button.primary,#resume,#again{background:linear-gradient(135deg,#ff4ea3,#c13bff)!important;border:1px solid #ffe6a3!important;color:#fff!important;box-shadow:0 0 0 1px #ffe6a366,0 8px 18px #f35aa666!important}" +
    "@media(max-height:430px){html.landscape46:not(.portraitFallback46) #paused .actions{grid-template-columns:1fr 1fr}html.landscape46:not(.portraitFallback46) #paused #resume{grid-column:1/-1}html.landscape46:not(.portraitFallback46) #paused .sub,html.landscape46:not(.portraitFallback46) #paused #build{max-height:72px;overflow:auto}html.landscape46:not(.portraitFallback46) #paused .modal{background:#140e24f8!important;background-image:none!important}}";

  function androidLocked() {
    var html = global.document && global.document.documentElement;
    return !!(
      global.__SAKURAYO_ANDROID_LANDSCAPE__ ||
      (html && html.classList && html.classList.contains("androidLandscape46"))
    );
  }

  function syncAndroidLandscape() {
    var doc = global.document;
    if (!doc || !doc.documentElement || !doc.documentElement.classList) {
      return { ok: false, locked: false };
    }
    if (!androidLocked()) {
      return { ok: true, locked: false, fallback: doc.documentElement.classList.contains("portraitFallback46") };
    }
    doc.documentElement.classList.add("androidLandscape46", "landscape46");
    doc.documentElement.classList.remove("portraitFallback46");
    return { ok: true, locked: true, fallback: false };
  }

  function hangGreet() {
    var doc = global.document;
    if (!doc) return;
    var profile = doc.querySelector("#menu .profile");
    var line = doc.getElementById("homeGreet46");
    if (!profile || !line) return;
    if ((" " + line.className + " ").indexOf(" homeGreet46 ") < 0) {
      line.className = (line.className + " homeGreet46").replace(/^\s+/, "");
    }
    if (line.parentNode !== profile) profile.appendChild(line);
  }

  function hangChars() {
    if (hangChars.busy) return;
    hangChars.busy = true;
    try {
      var doc = global.document;
      if (!doc) return;
      var top = doc.querySelector("#menu .top");
      var panel = doc.querySelector("#menu .charSelectPanel");
      var wallet = doc.getElementById("homeWallet46");
      if (!top || !panel) return;
      if (wallet && wallet.parentNode === top) {
        if (panel.parentNode !== top || panel.nextElementSibling !== wallet) top.insertBefore(panel, wallet);
      } else if (panel.parentNode !== top) {
        top.appendChild(panel);
      }
    } finally {
      hangChars.busy = false;
    }
  }

  function hangLobbyTop() {
    if (hangLobbyTop.busy) return;
    hangLobbyTop.busy = true;
    try {
      hangGreet();
      hangChars();
    } finally {
      hangLobbyTop.busy = false;
    }
  }

  function scheduleLobbyTop() {
    if (scheduleLobbyTop.queued) return;
    scheduleLobbyTop.queued = true;
    var run = function () {
      scheduleLobbyTop.queued = false;
      hangLobbyTop();
    };
    if (global.requestAnimationFrame) global.requestAnimationFrame(run);
    else if (global.setTimeout) global.setTimeout(run, 0);
    else run();
  }

  function watchGreet() {
    var doc = global.document;
    if (!doc || watchGreet.bound) return;
    watchGreet.bound = true;
    if (!global.MutationObserver) {
      hangLobbyTop();
      return;
    }
    var root = doc.getElementById("menu") || doc.body;
    if (!root) {
      hangLobbyTop();
      return;
    }
    var obs = new global.MutationObserver(scheduleLobbyTop);
    obs.observe(root, { childList: true, subtree: false });
    hangLobbyTop();
  }

  function watchOrientation() {
    if (watchOrientation.bound || !global.addEventListener) return;
    watchOrientation.bound = true;
    var replay = function () {
      if (global.setTimeout) global.setTimeout(syncAndroidLandscape, 0);
      else syncAndroidLandscape();
    };
    global.addEventListener("resize", replay);
    global.addEventListener("orientationchange", replay);
    var html = global.document && global.document.documentElement;
    if (html && global.MutationObserver) {
      var obs = new global.MutationObserver(function () {
        if (androidLocked() && html.classList.contains("portraitFallback46")) {
          syncAndroidLandscape();
        }
      });
      obs.observe(html, { attributes: true, attributeFilter: ["class"] });
    }
  }

  function install() {
    var doc = global.document;
    if (!doc) return { ok: false };
    var style = doc.getElementById(STYLE_ID);
    if (!style) {
      style = doc.createElement("style");
      style.id = STYLE_ID;
      (doc.head || doc.documentElement).appendChild(style);
    }
    style.textContent = CSS;
    var orient = syncAndroidLandscape();
    hangLobbyTop();
    watchGreet();
    watchOrientation();
    return { ok: true, id: STYLE_ID, locked: !!orient.locked, fallback: !!orient.fallback };
  }

  global.SakurayoLayout52 = {
    version: "4.7.0",
    css: CSS,
    install: install,
    hangGreet: hangGreet,
    hangChars: hangChars,
    hangLobbyTop: hangLobbyTop,
    syncAndroidLandscape: syncAndroidLandscape,
  };

  if (global.document) {
    if (global.document.readyState === "loading") {
      global.document.addEventListener("DOMContentLoaded", install);
    } else {
      install();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
