/* Boss 转阶段 PV：在 Boss 换阶段时叠一层全屏视频演出。
 *
 * 接入方式：包装 window.SakurayoCutscene.flashPhase。
 * index.html 在 Boss 每次转阶段时都会调 `SakurayoCutscene?.flashPhase?.(p)`（第 3244 行），
 * 并在第 4 阶段再调一次（3402 行）。这里在原有 520ms 闪光之外叠加 PV，
 * 不动 cutscene 自身逻辑，也不改 index.html 的游戏流程。
 *
 * 素材：art/pv/boss/boss_phase2|3|4.mp4（+ .webm）。
 * 阶段 2/3/4 若存在 art/pv/boss/stage{章}_phase{阶段}，就用这一章的片子，否则仍播共用片。
 * PV 是纯表现层：播放期间不阻塞游戏状态，播完自动移除；同一局同一阶段只播一次。
 */
(function (global) {
  "use strict";

  var DIR = "pv/boss/";
  var CLIPS = { 2: "boss_phase2", 3: "boss_phase3", 4: "boss_phase4" };
  var HOLD_MS = 5200; // PV 展示时长（Grok 出的是 6 秒，留一点淡出余量）

  var played = {}; // phase -> true，同一局内只播一次
  var box = null;
  var vid = null;
  var timer = 0;
  var endTimer = 0;

  function artUrl(p) {
    var a = global.artUrl;
    return a ? a(p) : "art/" + p;
  }

  /** 按浏览器能力挑格式：安卓 WebView 两种都行，桌面 Chromium 只吃 VP9。 */
  function pick(base) {
    var t = global.document.createElement("video");
    var webm = base + ".webm";
    var mp4 = base + ".mp4";
    if (t.canPlayType('video/webm; codecs="vp9"')) return webm;
    if (t.canPlayType('video/mp4; codecs="avc1.42E01E"')) return mp4;
    return webm;
  }

  function injectStyle() {
    if (global.document.getElementById("bossPvCss")) return;
    var st = global.document.createElement("style");
    st.id = "bossPvCss";
    st.textContent = [
      ".bossPvWrap{position:fixed;inset:0;z-index:2147483000;pointer-events:none;",
      "opacity:0;transition:opacity .38s ease;background:#05040e}",
      ".bossPvWrap.on{opacity:1}",
      ".bossPvWrap video{width:100%;height:100%;object-fit:cover;display:block}",
    ].join("");
    global.document.head.appendChild(st);
  }

  function ensure() {
    if (box && box.parentNode) return box;
    injectStyle();
    box = global.document.createElement("div");
    box.className = "bossPvWrap";
    box.id = "bossPvWrap";
    vid = global.document.createElement("video");
    vid.muted = true;
    vid.playsInline = true;
    vid.setAttribute("playsinline", "");
    vid.preload = "auto";
    box.appendChild(vid);
    global.document.body.appendChild(box);
    return box;
  }

  function hide() {
    if (!box) return;
    box.classList.remove("on");
    if (vid) {
      var v = vid;
      global.setTimeout(function () {
        try {
          v.pause();
          v.removeAttribute("src");
        } catch (e) {}
      }, 420);
    }
    if (timer) {
      global.clearTimeout(timer);
      timer = 0;
    }
    if (endTimer) {
      global.clearTimeout(endTimer);
      endTimer = 0;
    }
  }

  /**
   * 播放某个阶段的 PV。
   * @param {number} phase Boss 阶段（2/3/4 有素材）
   * @param {boolean} [force] 忽略"同局只播一次"的限制
   * @returns {boolean} 是否真的起播
   */
  function play(phase, force, stageId) {
    var shared = CLIPS[phase];
    if (!shared) return false;
    if (!force && played[phase]) return false;
    if (!global.document || !global.document.body) return false;

    played[phase] = true;
    ensure();

    var staged = (phase === 2 || phase === 3 || phase === 4) && stageId ? "stage" + stageId + "_phase" + phase : "";
    var fellBack = false;
    function setSrc(base) {
      vid.onerror = function () {
        if (fellBack || !staged || base === shared) return;
        fellBack = true;
        setSrc(shared);
      };
      vid.setAttribute("src", artUrl(DIR + pick(base)));
      try {
        vid.currentTime = 0;
      } catch (e) {}
      var started = vid.play();
      if (started && started.catch) started.catch(function () {});
    }
    setSrc(staged || shared);

    // 先让浏览器拿到第一帧再淡入，避免闪出黑框
    requestAnimationFrame(function () {
      box.classList.add("on");
    });

    if (timer) global.clearTimeout(timer);
    timer = global.setTimeout(hide, HOLD_MS);
    return true;
  }

  /** 新一局开始时重置"已播"记录。 */
  function reset() {
    played = {};
    hide();
  }

  function state() {
    return {
      playing: !!(box && box.classList.contains("on")),
      playedPhases: Object.keys(played).map(Number),
      src: vid ? vid.getAttribute("src") : null,
    };
  }

  // ---- 包装 flashPhase ----
  var C = global.SakurayoCutscene;
  if (C && typeof C.flashPhase === "function" && !C.flashPhase.__bossPvWrapped) {
    var origFlash = C.flashPhase;
    var wrapped = function (phase, stageId) {
      var r = origFlash.apply(this, arguments);
      try {
        // index.html 在两处调它：阶段 2/3，以及击败时的阶段 4。
        // 第二个参数是章节 id，用来挑 stageN_phaseN。
        play(phase, false, stageId);
      } catch (e) {}
      return r;
    };
    wrapped.__bossPvWrapped = true;
    C.flashPhase = wrapped;
  }

  global.SakurayoBossPv = {
    play: play,
    reset: reset,
    hide: hide,
    state: state,
    // flashPhase(4) 会走这里（第 4 阶段在 index.html 里单独调用）
    onPhaseFlash: function (p, stageId) {
      return play(p, false, stageId);
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
