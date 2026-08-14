(function (global) {
  "use strict";

  var VERSION = "4.4.6";
  var typing = null;
  var flashTimer = 0;
  var styleInjected = false;
  var victory = null;

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
      "@keyframes sakurayoBeatFade{from{opacity:0}to{opacity:1}}" +
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
      "#storyBeat44{position:fixed;inset:0;z-index:38;overflow:hidden;background:#05040e;color:#fff}" +
      "#storyBeat44.hidden{display:none!important}" +
      "#storyBeat44 .storyBeatBg{position:absolute;inset:-10%;background:#120b22 center 38%/cover no-repeat;transform-origin:center 30%;animation:sakurayoKenBurns 14s linear alternate infinite;filter:saturate(1.08) brightness(.68)}" +
      "#storyBeat44 .storyBeatShade{position:absolute;inset:0;background:linear-gradient(180deg,#05040e55 0%,#05040e22 38%,#05040ef0 78%);pointer-events:none}" +
      "#storyBeat44 .storyBeatPortrait{position:absolute;right:-8%;bottom:-10%;width:min(92vw,520px);height:78%;background:transparent right bottom/contain no-repeat;pointer-events:none;animation:sakurayoCutIn .55s ease}" +
      "#storyBeat44 .storyBeatPortrait.empty{display:none}" +
      "#storyBeat44 .storyBeatCopy{position:absolute;left:0;right:0;bottom:0;padding:max(18px,env(safe-area-inset-bottom)) 22px 28px;text-align:left;animation:sakurayoBeatFade .35s ease}" +
      "#storyBeat44 .storyBeatKicker{color:#9ee7ff;letter-spacing:.28em;font-size:10px;font-weight:800;margin-bottom:6px}" +
      "#storyBeat44 .storyBeatTitle{margin:0 0 8px;font-size:clamp(22px,7vw,34px);font-weight:1000;line-height:1.15}" +
      "#storyBeat44 .storyBeatLine{max-width:28em;font-size:14px;line-height:1.55;color:#ffeaf4;text-shadow:0 2px 10px #05040e}" +
      "#storyBeat44 .storyBeatHint{margin-top:10px;font-size:10px;color:#bfb1d3}" +
      "#storyBeat44[data-ground='torii'] .storyBeatKicker{color:#ff9ec8}" +
      "#storyBeat44[data-ground='neon'] .storyBeatKicker{color:#8defff}" +
      "#storyBeat44[data-ground='swords'] .storyBeatKicker{color:#ddd4ea}" +
      "#storyBeat44[data-ground='mirror'] .storyBeatKicker{color:#e2c4ff}" +
      "@media (prefers-reduced-motion:reduce){" +
      "#dialogue:not(.hidden) .dialogueModal,#event:not(.hidden) .modal,#result:not(.hidden) .modal,#level:not(.hidden) .modal,#paused:not(.hidden) .modal,#warning:not(.hidden),#dialogue .dialogueArt,#phaseFlash44.on,#storyBeat44 .storyBeatBg,#storyBeat44 .storyBeatPortrait,#storyBeat44 .storyBeatCopy{animation:none}" +
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

  function ensureVictoryNode() {
    if (!global.document) return null;
    var node = $("storyBeat44");
    if (node) return node;
    node = global.document.createElement("div");
    node.id = "storyBeat44";
    node.className = "hidden";
    node.innerHTML =
      '<div class="storyBeatBg"></div><div class="storyBeatShade"></div><div class="storyBeatPortrait empty"></div><div class="storyBeatCopy"><div class="storyBeatKicker"></div><div class="storyBeatTitle"></div><div class="storyBeatLine"></div><div class="storyBeatHint">点击跳过</div></div>';
    node.addEventListener("click", function (ev) {
      ev.stopPropagation();
      skipBeat();
    });
    global.document.body.appendChild(node);
    return node;
  }

  function stopType() {
    if (typing && typing.timer) global.clearTimeout(typing.timer);
    typing = null;
  }

  function clearVictoryTimer() {
    if (victory && victory.timer) {
      global.clearTimeout(victory.timer);
      victory.timer = 0;
    }
  }

  function hideVictory() {
    var node = $("storyBeat44");
    if (node) node.classList.add("hidden");
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

  function renderBeat(beat) {
    var node = ensureVictoryNode();
    if (!node || !beat) return;
    node.dataset.ground = (victory && victory.ground) || "torii";
    var bg = node.querySelector(".storyBeatBg");
    var portrait = node.querySelector(".storyBeatPortrait");
    var copy = node.querySelector(".storyBeatCopy");
    if (bg) {
      bg.style.backgroundImage = beat.bg
        ? "linear-gradient(#05040e33,#05040e88),url('" + String(beat.bg).replace(/'/g, "%27") + "')"
        : "";
    }
    if (portrait) {
      if (beat.portrait) {
        portrait.classList.remove("empty");
        portrait.style.backgroundImage = "url('" + String(beat.portrait).replace(/'/g, "%27") + "')";
        portrait.style.animation = "none";
        void portrait.offsetWidth;
        portrait.style.animation = "";
      } else {
        portrait.classList.add("empty");
        portrait.style.backgroundImage = "";
      }
    }
    if (copy) {
      copy.style.animation = "none";
      void copy.offsetWidth;
      copy.style.animation = "";
    }
    var kicker = node.querySelector(".storyBeatKicker");
    var title = node.querySelector(".storyBeatTitle");
    var line = node.querySelector(".storyBeatLine");
    var hint = node.querySelector(".storyBeatHint");
    if (kicker) kicker.textContent = beat.kicker || "";
    if (title) title.textContent = beat.title || "";
    if (line) line.textContent = beat.line || "";
    if (hint) hint.textContent = victory && victory.index >= victory.beats.length - 1 ? "点击进入对白" : "点击跳过";
    node.classList.remove("hidden");
  }

  function armBeatTimer() {
    if (!victory || victory.testMode) return;
    var beat = victory.beats[victory.index];
    var hold = beat && Number(beat.hold);
    if (!Number.isFinite(hold) || hold <= 0) hold = 2200;
    clearVictoryTimer();
    victory.timer = global.setTimeout(function () {
      skipBeat();
    }, hold);
  }

  function finishVictory(runDone) {
    if (!victory) {
      hideVictory();
      return;
    }
    clearVictoryTimer();
    var cb = victory.onDone;
    victory = null;
    hideVictory();
    if (runDone && cb) cb();
  }

  function skipBeat() {
    if (!victory) return false;
    victory.index += 1;
    if (victory.index >= victory.beats.length) {
      finishVictory(true);
      return true;
    }
    renderBeat(victory.beats[victory.index]);
    armBeatTimer();
    return true;
  }

  function isPlaying() {
    return !!(victory && victory.beats && victory.beats.length);
  }

  function playVictory(opts) {
    injectStyle();
    finishVictory(false);
    var beats = (opts && opts.beats) || [];
    var done = opts && opts.onDone;
    if (!beats.length) {
      if (done) done();
      return;
    }
    victory = {
      beats: beats,
      index: 0,
      onDone: done,
      testMode: !!(opts && opts.testMode),
      ground: (opts && opts.ground) || "torii",
      timer: 0,
    };
    renderBeat(beats[0]);
    armBeatTimer();
  }

  function stopVictory() {
    finishVictory(false);
  }

  function dismiss() {
    stopType();
    stopVictory();
    var root = $("dialogue");
    if (root) {
      root.removeAttribute("data-kind");
    }
  }

  function snapshot() {
    var node = $("storyBeat44");
    return {
      version: VERSION,
      typing: isTyping(),
      playing: isPlaying(),
      beat: victory ? victory.index + 1 : 0,
      beats: victory ? victory.beats.length : 0,
      title: node && !node.classList.contains("hidden")
        ? ((node.querySelector(".storyBeatTitle") || {}).textContent || "")
        : "",
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
    playVictory: playVictory,
    skipBeat: skipBeat,
    isPlaying: isPlaying,
    stopVictory: stopVictory,
    dismiss: dismiss,
    snapshot: snapshot,
  };
})(typeof window !== "undefined" ? window : globalThis);
