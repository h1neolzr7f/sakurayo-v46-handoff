(function (global) {
  "use strict";

  var VERSION = "4.7.0";
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
      "@keyframes sakurayoCutIn{from{transform:translateY(12px) scale(.98)}to{transform:none}}" +
      "@keyframes sakurayoKenBurns{from{transform:scale(1)}to{transform:scale(1.08)}}" +
      "@keyframes sakurayoWarnPulse{0%,100%{opacity:1;transform:translateX(-50%) scale(1)}50%{opacity:.82;transform:translateX(-50%) scale(1.04)}}" +
      "@keyframes sakurayoPhaseFlash{0%{opacity:0}18%{opacity:.72}100%{opacity:0}}" +
      "@keyframes sakurayoBeatFade{from{opacity:0}to{opacity:1}}" +
      "@keyframes sakurayoPhaseRail{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}" +
      "#dialogue .dialogueModal{overflow:hidden}" +
      "#dialogue:not(.hidden) .dialogueModal{animation:sakurayoCutIn .36s ease}" +
      "#dialogue .dialogueArt{transform-origin:center 30%;animation:sakurayoKenBurns 12s linear alternate infinite}" +
      "#dialogueChapter{margin:0 0 8px;color:#9ee7ff;letter-spacing:.22em;font-size:10px;font-weight:800}" +
      "#dialoguePhase44{display:none;margin:0 0 12px;padding:8px 10px;border:1px solid #ffffff1f;border-left:3px solid #ff68ac;border-radius:3px 12px 12px 3px;background:linear-gradient(90deg,#ff4eaa17,#ffffff08);text-align:left;animation:sakurayoPhaseRail .3s ease}" +
      "#dialoguePhase44.show{display:grid;grid-template-columns:auto auto 1fr;align-items:center;gap:9px}" +
      "#dialoguePhase44>span{color:#ff9cc9;font:900 10px/1 system-ui;letter-spacing:.16em;white-space:nowrap}" +
      "#dialoguePhase44>i{display:flex;gap:3px;font-style:normal}" +
      "#dialoguePhase44>i em{display:block;width:15px;height:3px;border-radius:9px;background:#ffffff1f}" +
      "#dialoguePhase44>i em.on{background:#ff67ad;box-shadow:0 0 8px #ff4ea366}" +
      "#dialoguePhase44>b{min-width:0;color:#fff1f8;font-size:11px;letter-spacing:.03em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
      "#dialogue[data-ground='torii'] .dialogueModal{border-color:#ff6fb088;box-shadow:0 0 40px #ff4ea324}" +
      "#dialogue[data-ground='neon'] .dialogueModal{border-color:#5ad2ff88;box-shadow:0 0 40px #5ad2ff24}" +
      "#dialogue[data-ground='swords'] .dialogueModal{border-color:#c9bdd888;box-shadow:0 0 40px #c9bdd824}" +
      "#dialogue[data-ground='mirror'] .dialogueModal{border-color:#c79bff88;box-shadow:0 0 40px #c79bff24}" +
      "#dialogue[data-kind='phase'] .dialogueModal{border-width:2px}" +
      "#dialogue[data-kind='ending'] .dialogueModal{border-color:#ffe6a488}" +
      "#event:not(.hidden) .modal,#result:not(.hidden) .modal,#level:not(.hidden) .modal,#paused:not(.hidden) .modal{opacity:1;transform:none;animation:none}" +
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
      "#storyBeat44[data-sequence='briefing'] .storyBeatShade{background:linear-gradient(90deg,#05040ef2 0%,#05040eaa 45%,#05040e26 74%),linear-gradient(180deg,#05040e44,#05040ecc)}" +
      "#storyBeat44[data-sequence='briefing'] .storyBeatCopy{left:3%;right:38%;bottom:7%;padding:18px 22px;border-left:3px solid #ff68ad;background:linear-gradient(90deg,#080615cc,transparent)}" +
      "#storyBeat44[data-sequence='briefing'] .storyBeatKicker{font-size:11px}" +
      "#storyBeat44[data-sequence='briefing'] .storyBeatTitle{font-size:clamp(28px,8vw,48px);letter-spacing:.08em}" +
      "#storyBeat44[data-sequence='briefing'] .storyBeatPortrait{right:0;bottom:-13%;height:96%}" +
      "#storyBeat44[data-ground='torii'] .storyBeatKicker{color:#ff9ec8}" +
      "#storyBeat44[data-ground='neon'] .storyBeatKicker{color:#8defff}" +
      "#storyBeat44[data-ground='swords'] .storyBeatKicker{color:#ddd4ea}" +
      "#storyBeat44[data-ground='mirror'] .storyBeatKicker{color:#e2c4ff}" +
      "html.shortWindow46 #storyBeat44[data-sequence='briefing'] .storyBeatCopy{left:3%;right:34%;bottom:8%;padding:10px 14px;border-left:3px solid #f35aa6;background:linear-gradient(90deg,#080615d8,transparent)}" +
      "html.shortWindow46 #storyBeat44[data-sequence='briefing'] .storyBeatTitle{font-size:clamp(18px,4.8vw,28px);letter-spacing:.14em}" +
      "html.shortWindow46 #storyBeat44[data-sequence='briefing'] .storyBeatLine{font-size:12px;line-height:1.45}" +
      "html.shortWindow46 #dialogue .dialogueModal{height:min(86vh,230px);max-height:230px;border:1px solid #f2c75d55}" +
      "html.shortWindow46 #result .modal{height:min(92vh,252px);max-height:min(92vh,252px);padding:10px 12px;grid-template-columns:56px minmax(150px,.9fr) minmax(210px,1.2fr);column-gap:10px;row-gap:4px;border:1px solid #f2c75d66}" +
      "html.shortWindow46 #result .resultIcon{font-size:18px;margin-top:0}" +
      "html.shortWindow46 #result .rankBig{font-size:36px}" +
      "html.shortWindow46 #result #rtitle{font-size:16px;letter-spacing:.08em}" +
      "html.shortWindow46 #result #endingTag{top:auto;bottom:46px;left:10px}" +
      "html.shortWindow46 #result #rstats,html.shortWindow46 #result #damageReport{padding:6px 8px;font-size:9px}" +
      "html.shortWindow46 #result .actions button{min-height:40px;padding:6px 10px}" +
      "html.shortWindow46 #paused .modal,html.shortWindow46 #level .modal,html.shortWindow46 #event .modal{max-height:94vh;overflow:auto}" +
      "@media(max-height:430px){#level .modal{max-height:94vh;overflow:auto}#level .choice{padding:8px 6px}#reroll{min-height:40px;margin-top:6px}}" +
      "@media (orientation:landscape) and (max-height:600px){" +
      ".overlay{padding:max(8px,env(safe-area-inset-top)) max(10px,env(safe-area-inset-right)) max(8px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left))}" +
      "#dialogue .dialogueModal{display:grid;grid-template-columns:minmax(220px,38%) minmax(0,1fr);width:min(94vw,900px);height:min(78vh,336px);max-height:336px;padding:0;text-align:left}" +
      "#dialogue .dialogueArt{grid-column:1;grid-row:1;height:100%!important;min-height:0;background-position:center 16%!important;border-right:1px solid #ffffff16;animation-duration:16s}" +
      "#dialogue .dialogueBody{grid-column:2;grid-row:1;display:flex;min-width:0;flex-direction:column;justify-content:flex-end;padding:18px 20px 16px;background:linear-gradient(135deg,#17102ae8,#090716f7)}" +
      "#dialogueChapter{margin-bottom:6px}" +
      "#dialogue .speaker{align-self:flex-start}" +
      "#dialogue .dialogueText{min-height:3.2em;margin-top:9px;font-size:clamp(12px,1.8vw,15px);line-height:1.65}" +
      "#dialogue .dialogueHint{margin-top:12px}" +
      "#dialoguePhase44{margin-bottom:9px}" +
      "#banter{left:220px!important;right:220px!important;top:auto!important;bottom:max(10px,env(safe-area-inset-bottom))!important;width:auto!important;max-width:none!important;padding:8px 11px;transform:none!important}" +
      "#result .modal{position:relative;display:grid;grid-template-columns:112px minmax(220px,.9fr) minmax(280px,1.25fr);grid-template-rows:auto auto 1fr auto;grid-template-areas:'rank title report' 'rank summary report' 'stats stats route' 'actions actions actions';column-gap:14px;row-gap:7px;width:min(96vw,920px);height:min(94vh,404px);max-height:404px;padding:14px 16px;overflow:hidden;text-align:left}" +
      "#result .resultIcon{grid-area:rank;align-self:start;justify-self:center;margin-top:2px;font-size:34px}" +
      "#result .rankBig{grid-area:rank;align-self:center;justify-self:center;font-size:68px;line-height:1;text-shadow:0 0 28px #ffd36b55}" +
      "#result #rtitle{grid-area:title;align-self:end;margin:0;font-size:24px;line-height:1.05;text-align:left}" +
      "#result #rsub{grid-area:summary;align-self:start;margin:0;font-size:10px;line-height:1.5;text-align:left}" +
      "#result #rstats{grid-area:stats;min-height:0;align-self:stretch;padding:10px 12px;overflow:auto;border:1px solid #ffffff12;border-radius:13px;background:#ffffff08;font-size:10px;line-height:1.55;text-align:left}" +
      "#result #endingTag{position:absolute;left:18px;top:176px;margin:0;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center}" +
      "#result #damageReport{grid-area:report;min-height:0;margin:0;padding:9px 11px;overflow:auto;border:1px solid #ffffff12;border-radius:13px;background:#09071696}" +
      "#result #damageReport h3{margin:0 0 5px}" +
      "#result #damageReport .routeNote{padding:7px;font-size:9px;line-height:1.45}" +
      "#result #routeNote{grid-area:route;min-height:0;max-height:78px;padding:8px 10px;overflow:auto;font-size:9px;line-height:1.45}" +
      "#result .actions{grid-area:actions;display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:0}" +
      "#result .actions button{min-height:38px;padding:8px 12px}" +
      "}" +
      "@media (prefers-reduced-motion:reduce){" +
      "#dialogue:not(.hidden) .dialogueModal,#event:not(.hidden) .modal,#result:not(.hidden) .modal,#level:not(.hidden) .modal,#paused:not(.hidden) .modal,#warning:not(.hidden),#dialogue .dialogueArt,#dialoguePhase44,#phaseFlash44.on,#storyBeat44 .storyBeatBg,#storyBeat44 .storyBeatPortrait,#storyBeat44 .storyBeatCopy{animation:none;opacity:1!important}" +
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

  function ensurePhaseRail() {
    if (!global.document) return null;
    var node = $("dialoguePhase44");
    if (node) return node;
    var body = global.document.querySelector("#dialogue .dialogueBody");
    if (!body) return null;
    node = global.document.createElement("div");
    node.id = "dialoguePhase44";
    node.innerHTML = "<span></span><i></i><b></b>";
    var speaker = body.querySelector(".speaker");
    body.insertBefore(node, speaker || body.firstChild);
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
    var rail = ensurePhaseRail();
    if (rail) {
      var phase = Math.max(0, Math.min(4, Number(opts && opts.phase) || 0));
      var cue = String((opts && opts.phaseCue) || "");
      var visible = (kind === "phase" || kind === "boss") && phase > 0;
      rail.classList.toggle("show", visible);
      rail.querySelector("span").textContent = visible ? "PHASE 0" + phase : "";
      rail.querySelector("b").textContent = visible ? cue : "";
      var dots = rail.querySelector("i");
      dots.innerHTML = "";
      if (visible) {
        for (var i = 1; i <= 4; i += 1) {
          var dot = global.document.createElement("em");
          if (i <= phase) dot.className = "on";
          dots.appendChild(dot);
        }
      }
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
    if (global.requestAnimationFrame) {
      global.requestAnimationFrame(function () {
        node.classList.add("on");
      });
    } else {
      node.classList.add("on");
    }
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
    node.dataset.sequence = (victory && victory.mode) || "victory";
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
        if (global.requestAnimationFrame) {
          global.requestAnimationFrame(function () {
            portrait.style.animation = "";
          });
        } else {
          portrait.style.animation = "";
        }
      } else {
        portrait.classList.add("empty");
        portrait.style.backgroundImage = "";
      }
    }
    if (copy) {
      copy.style.animation = "none";
      if (global.requestAnimationFrame) {
        global.requestAnimationFrame(function () {
          copy.style.animation = "";
        });
      } else {
        copy.style.animation = "";
      }
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
    if (!beats.length || !!(opts && opts.testMode)) {
      if (done) done();
      return;
    }
    victory = {
      beats: beats,
      index: 0,
      onDone: done,
      testMode: !!(opts && opts.testMode),
      ground: (opts && opts.ground) || "torii",
      mode: (opts && opts.mode) || "victory",
      timer: 0,
    };
    renderBeat(beats[0]);
    armBeatTimer();
  }

  function stopVictory() {
    finishVictory(false);
  }

  function playBriefing(opts) {
    var next = {};
    var key;
    for (key in (opts || {})) {
      if (Object.prototype.hasOwnProperty.call(opts, key)) next[key] = opts[key];
    }
    next.mode = "briefing";
    playVictory(next);
  }

  function dismiss() {
    stopType();
    stopVictory();
    var root = $("dialogue");
    if (root) {
      root.removeAttribute("data-kind");
    }
    var rail = $("dialoguePhase44");
    if (rail) rail.classList.remove("show");
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
      sequence: victory ? victory.mode || "victory" : "",
      phase: $("dialoguePhase44") && $("dialoguePhase44").classList.contains("show")
        ? (($("dialoguePhase44").querySelector("span") || {}).textContent || "")
        : "",
      phaseCue: $("dialoguePhase44") && $("dialoguePhase44").classList.contains("show")
        ? (($("dialoguePhase44").querySelector("b") || {}).textContent || "")
        : "",
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
    playBriefing: playBriefing,
    skipBeat: skipBeat,
    isPlaying: isPlaying,
    stopVictory: stopVictory,
    dismiss: dismiss,
    snapshot: snapshot,
  };
})(typeof window !== "undefined" ? window : globalThis);
