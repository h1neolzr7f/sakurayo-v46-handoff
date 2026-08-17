(function (global) {
  "use strict";

  var STYLE_ID = "sakurayo-feel53-css";
  var CSS =
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeBanner46.speak53{width:min(168px,22vw)!important;min-height:48px!important;padding:4px 8px 4px 4px!important;grid-template-columns:42px 1fr!important;justify-items:start;gap:6px;align-items:center}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeBanner46.speak53 b,html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeBanner46.speak53 small{display:block!important;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeBanner46.speak53 b{font-size:12px;letter-spacing:.08em}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeBanner46.speak53 small{margin-top:2px;color:#ffe7a3;font:700 9px/1.2 system-ui}" +
    "@media(max-height:409px){html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeBanner46.speak53{display:none!important}}" +
    "#menu.swap53 .heroLive46 img,#menu .heroLive46.swap53 img{animation:swapFade53 .62s ease}" +
    "#menu .profile.swap53{box-shadow:0 0 0 1px var(--swapAccent53,#f35aa0),0 0 18px var(--swapAccent53,#f35aa0)}" +
    "#start.swap53{box-shadow:0 0 0 1px var(--swapAccent53,#f2c75d),0 0 22px var(--swapAccent53,#f35aa0)}" +
    "@keyframes swapFade53{0%{opacity:.28;filter:saturate(.7)}40%{opacity:1}100%{opacity:1}}" +
    "@media(prefers-reduced-motion:reduce){#menu.swap53 .heroLive46 img,#menu .heroLive46.swap53 img{animation:none}}" +
    "html.landscape46:not(.portraitFallback46) #banter:not(.live53){opacity:0!important;pointer-events:none!important;transform:translate(-50%,10px)!important}" +
    "html.landscape46:not(.portraitFallback46) #banter.live53{opacity:1}" +
    "#resultHook53{display:inline-flex;align-items:center;margin:0 0 8px;padding:4px 10px;border-radius:999px;border:1px solid #f2c75d66;background:#120e27ee;color:#ffe7a3;font:800 11px/1.25 system-ui;letter-spacing:.04em}" +
    "#resultHook53.lose53{border-color:#ff5b7466;color:#ffb3c0}" +
    "#resultHook53:empty{display:none}" +
    "html.landscape46:not(.portraitFallback46) #resultHook53{grid-area:title;justify-self:end;align-self:start;margin:0;max-width:42%;z-index:3}";

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
    return { ok: true, id: STYLE_ID };
  }

  global.SakurayoFeel53 = {
    version: "4.6.0",
    install: install,
  };

  if (global.document) {
    if (global.document.readyState === "loading") {
      global.document.addEventListener("DOMContentLoaded", install);
    } else {
      install();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
