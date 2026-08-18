(function (global) {
  "use strict";

  var STYLE_ID = "sakurayo-touch54-css";
  var VERSION = "4.7.0";
  var CLICKABLE =
    "button,a,input,select,textarea,label,summary,.choice,.charCard,.stageCard,.stageMini,.eventChoice,.close,.start,.revealCard46,.rosterSlot46,.skinCard,[onclick],[data-open],[data-home],[data-mode],[data-character],[data-shell-open],[data-shell],[role='button'],#pause,#dash,#skill,#resume,#back,#opsDock46";
  var UI_UP =
    "#menu:not(.hidden),.drawer:not(.hidden),.overlay:not(.hidden),#level:not(.hidden),#event:not(.hidden),#dialogue:not(.hidden),#paused:not(.hidden),#result:not(.hidden),#storyBeat44:not(.hidden),#exploration41:not(.hidden),#gachaReveal46:not(.hidden)";
  var CSS =
    "html,body{touch-action:manipulation!important}" +
    "canvas#cv,canvas:not(#exploreCanvas41){touch-action:none}" +
    "#menu,#menu .menu,.drawer,.overlay,.modal,#level,#event,#dialogue,#paused,#result,#storyBeat44,#gachaReveal46{pointer-events:auto!important}" +
    "#menu .bg,#menu .heroLive46,#menu .heroLiveBreath46,#menu .coverTitle36,#yeyingDevBadge53{pointer-events:none!important}" +
    CLICKABLE + "{pointer-events:auto!important;touch-action:manipulation!important}" +
    "#hud{pointer-events:none}#hud .act,#pause,#dash,#skill,#joy{pointer-events:auto!important}";

  var state = {
    bound: false,
    lastEl: null,
    lastAt: 0,
    startX: 0,
    startY: 0,
    startEl: null,
  };

  function doc() {
    return global.document || null;
  }

  function closestClickable(node) {
    if (!node || !node.closest) return null;
    var hit = node.closest(CLICKABLE);
    if (!hit || hit.disabled) return null;
    if (hit.id === "joy" || (hit.classList && hit.classList.contains("stick"))) return null;
    return hit;
  }

  function uiBlocking() {
    var d = doc();
    if (!d || !d.querySelector) return false;
    return !!d.querySelector(UI_UP);
  }

  function playCanvas() {
    var d = doc();
    if (!d) return null;
    return d.getElementById("cv") || d.querySelector("canvas:not(#exploreCanvas41)");
  }

  function visibleId(id) {
    var n = doc() && doc().getElementById(id);
    return !!(n && n.classList && !n.classList.contains("hidden"));
  }

  function syncCinematicHud() {
    var d = doc();
    var hud = d && d.getElementById("hud");
    if (!hud || !hud.classList) return { ok: false, cinematic: false };
    var cinematic = visibleId("storyBeat44") || visibleId("dialogue") || visibleId("level");
    if (cinematic) {
      hud.classList.add("hidden");
      return { ok: true, cinematic: true };
    }
    if (!visibleId("menu") && !visibleId("paused") && !visibleId("result")) {
      hud.classList.remove("hidden");
    }
    return { ok: true, cinematic: false };
  }

  function syncHits() {
    var canvas = playCanvas();
    var blocked = uiBlocking();
    if (canvas && canvas.style) {
      canvas.style.pointerEvents = blocked ? "none" : "auto";
    }
    var hud = syncCinematicHud();
    return {
      ok: true,
      blocked: blocked,
      cinematic: !!hud.cinematic,
      canvas: canvas ? canvas.style.pointerEvents : "",
    };
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

  function fireClick(el) {
    var now = Date.now();
    if (el === state.lastEl && now - state.lastAt < 350) return { ok: false, reused: true };
    state.lastEl = el;
    state.lastAt = now;
    if (typeof el.click === "function") el.click();
    return { ok: true, id: el.id || el.className || el.tagName };
  }

  function pointFromTouch(ev) {
    var list = ev.changedTouches || ev.touches;
    return list && list[0] ? list[0] : null;
  }

  function onTouchStart(ev) {
    var t = pointFromTouch(ev);
    if (!t) return;
    state.startX = t.clientX;
    state.startY = t.clientY;
    state.startEl = closestClickable(ev.target) || (doc() && doc().elementFromPoint
      ? closestClickable(doc().elementFromPoint(t.clientX, t.clientY))
      : null);
  }

  function onTouchEnd(ev) {
    var t = pointFromTouch(ev);
    if (!t) return;
    var moved = Math.hypot(t.clientX - state.startX, t.clientY - state.startY);
    if (moved > 18) return;
    var d = doc();
    var under = d && d.elementFromPoint ? d.elementFromPoint(t.clientX, t.clientY) : ev.target;
    var hit = closestClickable(under) || state.startEl;
    if (!hit) return;
    if (ev.cancelable && ev.preventDefault) ev.preventDefault();
    fireClick(hit);
  }

  function onNativeClick() {
    state.lastAt = Date.now();
  }

  function scheduleHits() {
    if (scheduleHits.queued) return;
    scheduleHits.queued = true;
    var run = function () {
      scheduleHits.queued = false;
      syncHits();
    };
    if (global.requestAnimationFrame) global.requestAnimationFrame(run);
    else if (global.setTimeout) global.setTimeout(run, 0);
    else run();
  }

  function watch() {
    var d = doc();
    if (!d || !d.body || !global.MutationObserver) return;
    var obs = new global.MutationObserver(scheduleHits);
    obs.observe(d.body, { attributes: true, attributeFilter: ["class", "hidden"], subtree: true });
    syncHits();
  }

  function bind() {
    var d = doc();
    if (!d || state.bound) return { ok: true, reused: true };
    d.addEventListener("touchstart", onTouchStart, { capture: true, passive: true });
    d.addEventListener("touchend", onTouchEnd, { capture: true, passive: false });
    d.addEventListener("click", onNativeClick, true);
    if (global.addEventListener) {
      global.addEventListener("resize", syncHits);
      global.addEventListener("orientationchange", syncHits);
    }
    watch();
    state.bound = true;
    return { ok: true, reused: false };
  }

  function install() {
    var css = installCss();
    var hits = syncHits();
    var bound = bind();
    return {
      ok: !!(css.ok && hits.ok),
      id: STYLE_ID,
      version: VERSION,
      blocked: hits.blocked,
      reused: !!bound.reused,
    };
  }

  global.SakurayoTouch54 = {
    version: VERSION,
    css: CSS,
    clickable: CLICKABLE,
    install: install,
    syncHits: syncHits,
    syncCinematicHud: syncCinematicHud,
    closestClickable: closestClickable,
    fireClick: fireClick,
  };

  if (global.document) {
    if (global.document.readyState === "loading") {
      global.document.addEventListener("DOMContentLoaded", install);
    } else {
      install();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
