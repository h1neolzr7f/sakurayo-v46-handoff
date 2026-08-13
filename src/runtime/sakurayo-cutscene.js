(function (global) {
  "use strict";

  var VERSION = "4.4.1";
  var typing = null;
  var flashTimer = 0;
  var styleInjected = false;

  function $(id) {
    return global.document.getElementById(id);
  }

  function injectStyle() {
    if (styleInjected || !global.document) return;
    styleInjected = true;
    var style = global.document.createElement("style");
    style.id = "sakurayo-cutscene-css";
    style.textContent =
      "@keyframes sakurayoCutIn{from{opacity:0;transform:translateY(16px) scale(.96)}to{opacity:1;transform:none}}" +
      "@keyframes sakurayoKenBurns{from{transform:scale(1)}to{transform:scale(1.08)}}" +
      "@keyframes sakurayoWarnPulse{0%,100%{opacity:1;transform:translateX(-50%) scale(1)}50%{opacity:.82;transform:translateX(-50%) scale(1.04)}}" +
      "@keyframes sakurayoPhaseFlash{0%{opacity:0}18%{opacity:.72}100%{opacity:0}}" +
      "#dialogue .dialogueModal{overflow:hidden}" +
      "#dialogue:not(.hidden) .dialogueModal{animation:sakurayoCutIn .36s ease}" +
      "#dialogue .dialogueArt{transform-origin:center 30%;animation:sakurayoKenBurns 12s linear alternate infinite}" +
      "#dialogueChapter{margin:0 0 8px;color:#9ee7ff;letter-spacing:.22em;font-size:10px;font-weight:800}" +
      "#dialogue[data-ground='torii'] .dialogueModal{border-color:#ff6fb088;box-shadow:0 0 40px #ff4ea324}" +
      "#dialogue[data-ground='neon'] .dialogueModal{border-color:#5ad2ff88;box-shadow:0 0 40px #5ad2ff24}" +
      "#dialogue[data-ground='swords'] .dialogueModal{border-color:#c9bdd888;box-shadow:0 0 40px #c9bdd824}" +
      "#dialogue[data-ground='mirror'] .dialogueModal{border-color:#c79bff88;box-shadow:0 0 40px #c79bff24}" +
      "#dialogue[data-kind='phase'] .dialogueModal{border-width:2px}" +
      "#dialogue[data-kind='ending'] .dialogueModal{border-color:#ffe6a488}" +
      "#event:not(.hidden) .modal,#result:not(.hidden) .modal,#level:not(.hidden) .modal,#paused:not(.hidden) .modal{animation:sakurayoCutIn .3s ease}" +
      "#warning:not(.hidden){animation:sakurayoWarnPulse .55s ease 2}" +
      "#phaseFlash44{position:fixed;inset:0;z-index:34;pointer-events:none;opacity:0;background:radial-gradient(circle at 50% 40%,#ff4ea366,#05040ecc 62%)}" +
      "#phaseFlash44.on{animation:sakurayoPhaseFlash .48s ease}" +
      "@media (prefers-reduced-motion:reduce){" +
      "#dialogue:not(.hidden) .dialogueModal,#event:not(.hidden) .modal,#result:not(.hidden) .modal,#level:not(.hidden) .modal,#paused:not(.hidden) .modal,#warning:not(.hidden),#dialogue .dialogueArt,#phaseFlash44.on{animation:none}" +
      "}";
    global.document.head.appendChild(style);
  }

  function ensureFlash() {
    if (!global.document || $("phaseFlash44")) return $("phaseFlash44");
    var node = global.document.createElement("div");
    node.id = "phaseFlash44";
    global.document.body.appendChild(node);
    return node;
  }

  function stopType() {
    if (typing && typing.timer) global.clearTimeout(typing.timer);
    typing = null;
  }

  function present(opts) {
    injectStyle();
    var root = $("dialogue");
    if (!root) return;
    var kind = (opts && opts.kind) || "talk";
    var ground = (opts && opts.ground) || "torii";
    root.dataset.kind = kind;
    root.dataset.ground = ground;
    var chap = $("dialogueChapter");
    if (chap) {
      var no = (opts && opts.stageNo) || "";
      var name = (opts && opts.stageName) || "";
      chap.textContent = [no, name].filter(Boolean).join(" · ");
    }
  }

  function typeLine(el, text, done, testMode) {
    stopType();
    var full = String(text || "");
    if (!el) {
      if (done) done();
      return;
    }
    if (testMode) {
      el.textContent = full;
      if (done) done();
      return;
    }
    var i = 0;
    el.textContent = "";
    typing = { full: full, el: el, done: done, timer: 0 };
    var step = function () {
      if (!typing) return;
      i += 1;
      el.textContent = full.slice(0, i);
      if (i >= full.length) {
        var cb = typing.done;
        stopType();
        if (cb) cb();
        return;
      }
      typing.timer = global.setTimeout(step, full.charCodeAt(i - 1) > 255 ? 28 : 16);
    };
    typing.timer = global.setTimeout(step, 16);
  }

  function isTyping() {
    return !!typing;
  }

  function completeLine() {
    if (!typing) return false;
    var full = typing.full;
    var el = typing.el;
    var cb = typing.done;
    stopType();
    if (el) el.textContent = full;
    if (cb) cb();
    return true;
  }

  function flashPhase(phase) {
    injectStyle();
    var node = ensureFlash();
    if (!node) return;
    node.classList.remove("on");
    void node.offsetWidth;
    node.classList.add("on");
    if (flashTimer) global.clearTimeout(flashTimer);
    flashTimer = global.setTimeout(function () {
      node.classList.remove("on");
      flashTimer = 0;
    }, 520);
    node.dataset.phase = String(phase || 0);
  }

  function dismiss() {
    stopType();
    var root = $("dialogue");
    if (root) {
      root.removeAttribute("data-kind");
    }
  }

  function snapshot() {
    return {
      version: VERSION,
      typing: isTyping(),
      kind: $("dialogue") ? $("dialogue").dataset.kind || "" : "",
      ground: $("dialogue") ? $("dialogue").dataset.ground || "" : "",
      chapter: $("dialogueChapter") ? $("dialogueChapter").textContent || "" : "",
    };
  }

  global.SakurayoCutscene = {
    version: VERSION,
    present: present,
    typeLine: typeLine,
    isTyping: isTyping,
    completeLine: completeLine,
    stopType: stopType,
    flashPhase: flashPhase,
    dismiss: dismiss,
    snapshot: snapshot,
  };
})(typeof window !== "undefined" ? window : globalThis);
