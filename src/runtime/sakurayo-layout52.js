(function (global) {
  "use strict";

  var STYLE_ID = "sakurayo-layout52-css";
  var CSS =
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .menuBrand35{display:none!important}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .heroLive46{width:58%;top:0;bottom:108px!important;-webkit-mask-image:linear-gradient(to right,#000 0%,#000 70%,transparent 100%),linear-gradient(to top,transparent 0%,#000 10%,#000 100%);mask-image:linear-gradient(to right,#000 0%,#000 70%,transparent 100%),linear-gradient(to top,transparent 0%,#000 10%,#000 100%);-webkit-mask-composite:source-in;mask-composite:intersect}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .heroLiveBreath46{width:min(48vw,500px);height:100%}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .heroLiveBreath46 img{object-fit:contain;object-position:center 10%}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .top{align-items:center}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .profile{flex:none;max-width:200px;max-height:44px;overflow:visible;z-index:8}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .profile>div{flex-wrap:nowrap;overflow:hidden}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeSupport46{display:none}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .charSelectPanel{position:static!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;width:auto;margin:0 8px 0 auto;padding:0;background:transparent;border:0;box-shadow:none;z-index:8;pointer-events:auto;flex:0 0 auto}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .charSelectPanel .sectionTitle{display:none!important}" +
    "html.landscape46:not(.portraitFallback46) #homeWallet46{margin-left:0}" +
    "html.landscape46:not(.portraitFallback46) #homeWallet46 .homeChip46.prism,html.landscape46:not(.portraitFallback46) #homeWallet46 .homeChip46.shard{display:none!important}" +
    "html.landscape46:not(.portraitFallback46) #homeQuick46{gap:12px}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 #moreButton39{margin-left:10px;padding:0 12px}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 #homeGreet46,html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeGreet46{position:absolute;left:44px;top:calc(100% + 4px);margin:0;max-width:190px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;z-index:6}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeRail46{top:max(58px,calc(env(safe-area-inset-top) + 48px));bottom:max(140px,calc(env(safe-area-inset-bottom) + 128px));padding:4px 3px;gap:3px;justify-content:space-between;overflow:hidden}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeRail46 button{min-width:42px;min-height:42px;padding:6px 4px}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeRail46 button b,html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeRail46 button small{display:none}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeBanner46{left:max(12px,env(safe-area-inset-left))!important;bottom:max(78px,calc(env(safe-area-inset-bottom) + 68px))!important;width:50px!important;min-height:48px!important;padding:4px!important;grid-template-columns:1fr!important;justify-items:center}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeBanner46 img{width:42px;height:36px}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeBanner46 b,html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeBanner46 small,html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeBanner46 em,html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeBannerDots46{display:none}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .nav.homeNav46{width:min(480px,52vw)}" +
    "@media(max-height:409px){html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeBanner46{display:none!important}html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeRail46{bottom:max(78px,calc(env(safe-area-inset-bottom) + 68px))}}" +
    "@media(max-height:370px){html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeDeck46{bottom:max(80px,calc(env(safe-area-inset-bottom) + 70px));gap:4px;overflow:hidden}html.landscape46:not(.portraitFallback46) #menu.homeDock46 .stageMini{min-height:48px;padding:6px 10px}html.landscape46:not(.portraitFallback46) #menu.homeDock46 .stageMini p,html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeStageProg46{display:none!important}html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeModes46 button{min-height:36px;padding:4px 8px}html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeModes46 button small{display:none}html.landscape46:not(.portraitFallback46) #menu.homeDock46 .start{min-height:40px;flex:0 0 40px}}" +
    "html.landscape46.shortWindow46 #menu.homeDock46 .heroLive46{width:56%;bottom:88px!important}" +
    "html.landscape46.shortWindow46 #menu.homeDock46 .charSelectPanel{position:static!important;left:auto!important;top:auto!important;margin:0 6px 0 auto}" +
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
    "html.landscape46:not(.portraitFallback46) #level .levelRailArt47{background-size:auto 100%;background-position:center 12%}";

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
  }

  function hangLobbyTop() {
    hangGreet();
    hangChars();
  }

  function watchGreet() {
    var doc = global.document;
    if (!doc || !doc.body || watchGreet.bound) return;
    watchGreet.bound = true;
    var obs = new global.MutationObserver(hangLobbyTop);
    obs.observe(doc.body, { childList: true, subtree: true });
    hangLobbyTop();
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
    hangLobbyTop();
    watchGreet();
    return { ok: true, id: STYLE_ID };
  }

  global.SakurayoLayout52 = {
    version: "4.6.0",
    install: install,
    hangGreet: hangGreet,
    hangChars: hangChars,
  };

  if (global.document) {
    if (global.document.readyState === "loading") {
      global.document.addEventListener("DOMContentLoaded", install);
    } else {
      install();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
