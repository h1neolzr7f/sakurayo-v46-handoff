(function (global) {
  "use strict";

  var STYLE_ID = "sakurayo-feel53-css";
  var BADGE_ID = "yeyingDevBadge53";
  var HOOK_ID = "resultHook53";
  var CHANNEL = "yeying-dev";
  var LABEL = "开发版 夜樱";
  var VERSION = "4.7.3";
  var RITUAL_MS = 3000;
  var RADIO_MS = 2200;
  var IDENTS = {
    sayo: { id: "sayo", name: "小夜", color: "#f35aa0", password: "樱花", pluck: 523.25 },
    aya: { id: "aya", name: "绫", color: "#62eaff", password: "双月", pluck: 392 },
    rion: { id: "rion", name: "凛音", color: "#c9a6ff", password: "黄泉", pluck: 329.63 },
  };
  var CSS =
    "html,body{touch-action:manipulation!important}" +
    "canvas,#hud,#level,#joy{touch-action:none}" +
    "#menu.homeDock46 button,#menu.homeDock46 .charCard,#menu.homeDock46 .homeNav46,#menu.homeDock46 .homeRail46,#menu.homeDock46 .homeBanner46,#menu.homeDock46 .charSelectPanel,#menu.homeDock46 .start,.drawer button,.choice,#pause,#dash,#skill,#resume,#back{pointer-events:auto!important;touch-action:manipulation!important}" +
    "#" + BADGE_ID + "{pointer-events:none!important}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeBanner46.speak53{width:min(168px,22vw)!important;min-height:48px!important;padding:4px 8px 4px 4px!important;grid-template-columns:42px 1fr!important;justify-items:start;gap:6px;align-items:center}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeBanner46.speak53 b,html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeBanner46.speak53 small{display:block!important;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeBanner46.speak53 b{font-size:12px;letter-spacing:.08em}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeBanner46.speak53 small{margin-top:2px;color:#ffe7a3;font:700 9px/1.2 system-ui}" +
    "@media(max-height:430px){html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeBanner46.speak53{display:none!important}}" +
    "#menu.swap53 .heroLive46 img,#menu .heroLive46.swap53 img{animation:none}" +
    "#menu .profile.swap53{box-shadow:0 0 0 1px var(--swapAccent53,#f35aa0),0 0 18px var(--swapAccent53,#f35aa0)}" +
    "#start.swap53{box-shadow:0 0 0 1px var(--swapAccent53,#f2c75d),0 0 22px var(--swapAccent53,#f35aa0)}" +
    "#start .pass53{display:none!important}" +
    "@keyframes swapFade53{0%,100%{opacity:1}}" +
    "@media(prefers-reduced-motion:reduce){#menu.swap53 .heroLive46 img,#menu .heroLive46.swap53 img{animation:none}}" +
    "html.landscape46:not(.portraitFallback46) #banter:not(.live53){opacity:0!important;pointer-events:none!important;transform:translate(-50%,10px)!important}" +
    "html.landscape46:not(.portraitFallback46) #banter.live53{opacity:1;transform:translate(-50%,0)!important}" +
    "#resultHook53{display:inline-flex;align-items:center;margin:0 0 8px;padding:4px 10px;border-radius:999px;border:1px solid #f2c75d66;background:#120e27ee;color:#ffe7a3;font:800 11px/1.25 system-ui;letter-spacing:.04em}" +
    "#resultHook53.lose53{border-color:#ff5b7466;color:#ffb3c0}" +
    "#resultHook53:empty{display:none}" +
    "html.landscape46:not(.portraitFallback46) #resultHook53{grid-area:title;justify-self:end;align-self:start;margin:0;max-width:42%;z-index:3}" +
    "#" + BADGE_ID + "{position:fixed;z-index:40;left:max(8px,env(safe-area-inset-left));top:max(8px,env(safe-area-inset-top));padding:4px 10px;border-radius:999px;border:1px solid #f2c75d88;background:#120e27ee;color:#ffe7a3;font:800 10px/1 system-ui;letter-spacing:.14em;pointer-events:none}" +
    "html.shortWindow46 #" + BADGE_ID + ",body:has(#hud:not(.hidden)) #" + BADGE_ID + "{display:none!important}" +
    "#paused .modal,#result .modal{position:relative;background:#140e24f6;opacity:1!important}" +
    "#paused .actions button.secondary,#result .actions button.secondary,#fxToggle,#banterToggle,#retryP,#quit,#back,#reroll,.revealSkip46,.revealAgain46{background:#2a1848!important;border:1px solid #f2c75d!important;color:#ffe7a3!important;box-shadow:0 0 0 1px #f2c75d55!important}" +
    "#paused .actions button.primary,#result .actions button.primary,#resume,#again,.revealTake46{background:linear-gradient(135deg,#ff4ea3,#c13bff)!important;border:1px solid #ffe6a3!important;color:#fff!important;box-shadow:0 0 0 1px #ffe6a366,0 8px 18px #f35aa666!important;font-weight:1000!important}" +
    "@media(max-height:430px){#paused .modal{background:#140e24f8!important;background-image:none!important}}";

  var state = {
    lastChar: "",
    ritualTimer: 0,
    radioTimer: 0,
    swapTimer: 0,
    observers: [],
    bound: false,
  };

  function doc() {
    return global.document || null;
  }

  function $(id) {
    var d = doc();
    return d ? d.getElementById(id) : null;
  }

  function identOf(id) {
    return IDENTS[id] || IDENTS.sayo;
  }

  function detectChar(explicit) {
    if (explicit && IDENTS[explicit]) return explicit;
    var selected = doc() && doc().querySelector(".charCard.selected");
    if (selected && selected.getAttribute("data-character")) {
      return identOf(selected.getAttribute("data-character")).id;
    }
    var name = $("charName");
    var text = name && name.textContent ? name.textContent : "";
    if (text.indexOf("绫") >= 0) return "aya";
    if (text.indexOf("凛") >= 0) return "rion";
    return "sayo";
  }

  function firstSentence(text) {
    var raw = String(text || "").replace(/\s+/g, " ").trim();
    if (!raw) return "下次先看地面，再决定补什么。";
    var cut = raw.split(/[。！？\n]/)[0].trim();
    return cut || raw.slice(0, 28);
  }

  function resultHookText(win, diagnosis) {
    if (win) return "证词可写入档案。本局钩子不另发奖励。";
    return firstSentence(diagnosis);
  }

  function installCss() {
    var d = doc();
    if (!d) return { ok: false };
    var style = d.getElementById(STYLE_ID);
    if (!style) {
      style = d.createElement("style");
      style.id = STYLE_ID;
      (d.head || d.documentElement).appendChild(style);
    }
    style.textContent = CSS;
    return { ok: true, id: STYLE_ID };
  }

  function ensureBadge() {
    var d = doc();
    if (!d || !d.body) return null;
    var badge = d.getElementById(BADGE_ID);
    if (!badge) {
      badge = d.createElement("aside");
      badge.id = BADGE_ID;
      d.body.appendChild(badge);
    }
    badge.textContent = LABEL;
    return badge;
  }

  function ritualSpeak(banner, expand) {
    if (!banner) return { ok: false };
    if (expand) banner.classList.add("speak53");
    else banner.classList.remove("speak53");
    return { ok: true, open: !!expand };
  }

  function startRitual() {
    var banner = $("homeBanner46");
    if (!banner) return { ok: false };
    ritualSpeak(banner, true);
    if (state.ritualTimer && global.clearTimeout) global.clearTimeout(state.ritualTimer);
    if (global.setTimeout) {
      state.ritualTimer = global.setTimeout(function () {
        ritualSpeak(banner, false);
      }, RITUAL_MS);
    }
    return { ok: true, ms: RITUAL_MS };
  }

  function applyPassword(id) {
    var ident = identOf(id);
    var start = $("start");
    if (start && start.querySelector) {
      var chip = start.querySelector(".pass53");
      if (chip && chip.parentNode) chip.parentNode.removeChild(chip);
    }
    return ident.password;
  }

  function pluckTone(id) {
    var ident = identOf(id);
    try {
      var Ctor = global.AudioContext || global.webkitAudioContext;
      if (!Ctor) return ident.pluck;
      var audio = new Ctor();
      var osc = audio.createOscillator();
      var gain = audio.createGain();
      osc.type = "triangle";
      osc.frequency.value = ident.pluck;
      gain.gain.value = 0.04;
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start();
      if (gain.gain.exponentialRampToValueAtTime) {
        gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.28);
      }
      osc.stop(audio.currentTime + 0.3);
    } catch (error) {
      if (global.__SAKURAYO_DEV__ && global.__SAKURAYO_DEV__.report) {
        global.__SAKURAYO_DEV__.report("feel53-pluck", error);
      }
    }
    return ident.pluck;
  }

  function applySwap(id, opts) {
    var ident = identOf(id);
    var d = doc();
    var profile = d && d.querySelector ? d.querySelector("#menu .profile") : null;
    var start = $("start");
    var nodes = [profile, start].filter(Boolean);
    nodes.forEach(function (node) {
      node.classList.add("swap53");
      if (node.style) node.style.setProperty("--swapAccent53", ident.color);
    });
    applyPassword(ident.id);
    if (!opts || opts.pluck !== false) pluckTone(ident.id);
    if (state.swapTimer && global.clearTimeout) global.clearTimeout(state.swapTimer);
    if (global.setTimeout) {
      state.swapTimer = global.setTimeout(function () {
        nodes.forEach(function (node) {
          node.classList.remove("swap53");
        });
      }, 700);
    }
    state.lastChar = ident.id;
    return { ok: true, id: ident.id, color: ident.color, password: ident.password };
  }

  function markLive(box, on) {
    if (!box) return { ok: false };
    if (on) {
      if (!box.classList.contains("live53")) box.classList.add("live53");
    } else if (box.classList.contains("live53")) {
      box.classList.remove("live53");
    }
    return { ok: true, live: !!on };
  }

  function startRadio(box) {
    if (!box || startRadio.busy) return { ok: false, busy: !!startRadio.busy };
    startRadio.busy = true;
    try {
      markLive(box, true);
      if (state.radioTimer && global.clearTimeout) global.clearTimeout(state.radioTimer);
      if (global.setTimeout) {
        state.radioTimer = global.setTimeout(function () {
          markLive(box, false);
        }, RADIO_MS);
      }
      return { ok: true, ms: RADIO_MS };
    } finally {
      startRadio.busy = false;
    }
  }

  function paintResultHook(win, diagnosis, host) {
    var d = doc();
    var result = host || $("result");
    if (!result || !d) return { ok: false, text: "" };
    var hook = d.getElementById(HOOK_ID);
    if (!hook) {
      hook = d.createElement("div");
      hook.id = HOOK_ID;
      var title = $("rtitle");
      if (title && title.parentNode) title.parentNode.insertBefore(hook, title);
      else result.insertBefore(hook, result.firstChild);
    }
    var text = resultHookText(win, diagnosis);
    hook.textContent = text;
    hook.classList.toggle("lose53", !win);
    return { ok: true, text: text, win: !!win };
  }

  function syncResult() {
    var result = $("result");
    if (!result || result.classList.contains("hidden")) return { ok: false };
    var title = $("rtitle");
    var sub = $("rsub");
    var win = !!(title && /净化|隐藏结局/.test(title.textContent || ""));
    return paintResultHook(win, sub ? sub.textContent : "");
  }

  function onLobbyEnter() {
    ensureBadge();
    startRitual();
    applySwap(detectChar(), { pluck: false });
  }

  function observe(node, options, fn) {
    if (!node || !global.MutationObserver) return null;
    var obs = new global.MutationObserver(fn);
    obs.observe(node, options);
    state.observers.push(obs);
    return obs;
  }

  function bind() {
    var menu = $("menu");
    if (menu) {
      var hidden = menu.classList.contains("hidden");
      observe(menu, { attributes: true, attributeFilter: ["class"] }, function () {
        var nowHidden = menu.classList.contains("hidden");
        if (hidden && !nowHidden) onLobbyEnter();
        hidden = nowHidden;
      });
      if (!hidden) onLobbyEnter();
    }

    var list = $("characterList");
    if (list) {
      list.addEventListener("click", function (ev) {
        var btn = ev.target && ev.target.closest ? ev.target.closest("[data-character]") : null;
        if (!btn) return;
        applySwap(btn.getAttribute("data-character"));
      });
    }

    applyPassword(detectChar());

    var banter = $("banter");
    if (banter) {
      var banterHidden = banter.classList.contains("hidden");
      observe(banter, { attributes: true, attributeFilter: ["class"] }, function () {
        var nowHidden = banter.classList.contains("hidden");
        if (banterHidden && !nowHidden) startRadio(banter);
        else if (nowHidden) markLive(banter, false);
        banterHidden = nowHidden;
      });
    }

    var result = $("result");
    if (result) {
      observe(result, { attributes: true, attributeFilter: ["class"] }, function () {
        if (!result.classList.contains("hidden")) syncResult();
      });
    }
  }

  function install() {
    if (state.bound) {
      ensureBadge();
      return { ok: true, id: STYLE_ID, channel: CHANNEL, label: LABEL, reused: true };
    }
    var css = installCss();
    ensureBadge();
    bind();
    state.bound = true;
    return { ok: css.ok, id: STYLE_ID, channel: CHANNEL, label: LABEL, reused: false };
  }

  global.SakurayoFeel53 = {
    version: VERSION,
    channel: CHANNEL,
    label: LABEL,
    ritualMs: RITUAL_MS,
    radioMs: RADIO_MS,
    idents: IDENTS,
    install: install,
    ritualSpeak: ritualSpeak,
    startRitual: startRitual,
    applySwap: applySwap,
    applyPassword: applyPassword,
    markLive: markLive,
    startRadio: startRadio,
    paintResultHook: paintResultHook,
    resultHookText: resultHookText,
    detectChar: detectChar,
  };

  if (global.document) {
    if (global.document.readyState === "loading") {
      global.document.addEventListener("DOMContentLoaded", install);
    } else {
      install();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
