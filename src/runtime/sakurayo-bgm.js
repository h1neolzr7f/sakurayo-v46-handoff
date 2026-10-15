/* Sakurayo BGM: scene-based looping music with crossfades.
 * Tracks are original OGG renders (tools/bgm/, FluidR3_GM MIT soundfont).
 * Backend: WebAudio buffers (gapless loops) when fetch works; <audio loop> fallback for file:// and WebView assets.
 * index.html attaches its AudioContext + music gain and reports the base scene; this module adds the gacha override. */
(function (root) {
  "use strict";
  var LOOPS = { lobby: 1, gacha: 1, battle: 1, boss: 1 }, STINGS = { win: 1, lose: 1 };
  var ctx = null, out = null, url = function (p) { return p; }, getVol = function () { return 0.5; };
  var base = "lobby", current = null, vol = 0, stingUntil = 0, buffers = {}, failed = {}, voices = {}, backend = "none";
  var doc = root.document;
  function wantScene() {
    if (typeof root.SakurayoMusicScene === "function") { var b = root.SakurayoMusicScene(); if (LOOPS[b]) base = b; }
    var g = doc && doc.getElementById("gachaDrawer");
    if (base !== "battle" && base !== "boss" && g && !g.classList.contains("hidden")) return "gacha";
    return base;
  }
  function load(name, cb) {
    if (buffers[name]) return cb(buffers[name]);
    if (failed[name] || !ctx || typeof fetch !== "function" || /^file:/.test(String(root.location && root.location.href))) return cb(null);
    fetch(url("bgm/" + name + ".ogg")).then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(function (b) { return ctx.decodeAudioData(b); })
      .then(function (buf) { buffers[name] = buf; cb(buf); })
      .catch(function () { failed[name] = true; cb(null); });
  }
  function fadeOut(v, sec) {
    if (!v) return;
    if (v.gain) {
      var t = ctx.currentTime; v.gain.gain.cancelScheduledValues(t); v.gain.gain.setValueAtTime(v.gain.gain.value, t);
      v.gain.gain.linearRampToValueAtTime(0, t + sec);
      try { v.src.stop(t + sec + 0.05); } catch (e) {}
    } else if (v.el) {
      v.target = 0; v.dieAt = Date.now() + sec * 1000;
    }
  }
  function startVoice(name, loop, sec, done) {
    load(name, function (buf) {
      if (buf && ctx && out) {
        var src = ctx.createBufferSource(), g = ctx.createGain();
        src.buffer = buf; src.loop = loop; src.connect(g); g.connect(out);
        var t = ctx.currentTime; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + sec);
        src.start(t); backend = "webaudio";
        if (!loop) src.onended = function () { if (voices[name] && voices[name].src === src) delete voices[name]; };
        done({ src: src, gain: g });
      } else if (doc) {
        var el = new root.Audio(url("bgm/" + name + ".ogg"));
        el.loop = loop; el.volume = 0; el.preload = "auto";
        var v = { el: el, level: 0, target: 1, step: 1 / Math.max(1, sec * 10) };
        el.play().catch(function () {}); backend = "element";
        if (!loop) el.onended = function () { if (voices[name] === v) delete voices[name]; };
        done(v);
      }
    });
  }
  function switchTo(name) {
    if (name === current) return;
    var prev = current; current = name;
    var fade = name === "boss" ? 0.6 : name === "battle" || prev === "battle" || prev === "boss" ? 0.9 : 1.4;
    if (prev && voices[prev]) { fadeOut(voices[prev], fade); delete voices[prev]; }
    if (name) startVoice(name, true, fade, function (v) { if (current === name && !voices[name]) voices[name] = v; else fadeOut(v, 0.05); });
  }
  var attached = false;
  function tick() {
    if (!attached) return;
    vol = Math.max(0, Math.min(1, Number(getVol()) || 0));
    var hidden = doc && doc.hidden;
    if (Date.now() >= stingUntil) { if (vol <= 0) switchTo(null); else if (!hidden) switchTo(wantScene()); }
    for (var k in voices) {
      var v = voices[k]; if (!v.el) continue;
      if (hidden) { if (!v.el.paused) v.el.pause(); continue; } else if (v.el.paused && v.target > 0) v.el.play().catch(function () {});
      v.level += Math.sign(v.target - v.level) * Math.min(Math.abs(v.target - v.level), v.step);
      v.el.volume = Math.max(0, Math.min(1, v.level * vol * 0.8));
    }
    for (var d in dying) { var x = dying[d]; x.level = Math.max(0, x.level - x.step * 1.5); x.el.volume = x.level * vol * 0.8; if (x.level <= 0) { x.el.pause(); delete dying[d]; } }
  }
  var dying = {}, dieId = 0;
  var _fadeOut = fadeOut;
  fadeOut = function (v, sec) { if (v && v.el) { v.step = 1 / Math.max(1, sec * 10); dying[++dieId] = v; return; } _fadeOut(v, sec); };
  var api = {
    attach: function (audioCtx, gainNode, artUrl, volumeFn) {
      ctx = audioCtx || null; out = gainNode || null; attached = true;
      if (typeof artUrl === "function") url = artUrl;
      if (typeof volumeFn === "function") getVol = volumeFn;
      tick();
    },
    scene: function (name) { if (LOOPS[name]) { base = name; tick(); } },
    sting: function (name) {
      if (!STINGS[name]) return;
      if (current && voices[current]) { fadeOut(voices[current], 0.5); delete voices[current]; }
      current = null; base = "lobby";
      stingUntil = Date.now() + (name === "win" ? 8200 : 14000);
      if (vol > 0) startVoice(name, false, 0.05, function (v) { voices["sting:" + name] = v; });
    },
    state: function () { return { base: base, scene: current, want: wantScene(), vol: vol, backend: backend, voices: Object.keys(voices), sting: Date.now() < stingUntil }; }
  };
  root.SakurayoBGM = Object.freeze(api);
  if (root.setInterval) root.setInterval(tick, 100);
})(typeof window !== "undefined" ? window : globalThis);
