/* Sakurayo procedural SFX: layered WebAudio recipes (no audio files).
 * index.html's sound(k) hands its AudioContext + gain here; unknown keys fall back
 * to the legacy single-oscillator table. Recipes are short and quiet by design. */
(function (root) {
  "use strict";
  var noiseBuf = null, last = {};
  function noise(ctx) {
    if (noiseBuf && noiseBuf.sampleRate === ctx.sampleRate) return noiseBuf;
    var len = Math.floor(ctx.sampleRate * 0.6), b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return (noiseBuf = b);
  }
  function env(ctx, out, t, vol, a, dur) {
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(out); return g;
  }
  function tone(ctx, out, t, f, dur, vol, type, f2, a) {
    var o = ctx.createOscillator(); o.type = type || "sine";
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t + dur);
    o.connect(env(ctx, out, t, vol, a || 0.005, dur)); o.start(t); o.stop(t + dur + 0.02);
  }
  function hiss(ctx, out, t, dur, vol, type, f, f2, q) {
    var s = ctx.createBufferSource(); s.buffer = noise(ctx);
    var fl = ctx.createBiquadFilter(); fl.type = type || "bandpass"; fl.Q.value = q || 1;
    fl.frequency.setValueAtTime(f || 1200, t);
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
    s.connect(fl); fl.connect(env(ctx, out, t, vol, 0.004, dur)); s.start(t); s.stop(t + dur + 0.02);
  }
  function chord(ctx, out, t, fs, step, dur, vol, type) {
    for (var i = 0; i < fs.length; i++) tone(ctx, out, t + i * step, fs[i], dur, vol, type || "triangle", 0, 0.01);
  }
  /* min gap (s) per key so dense combat does not turn into static */
  var GAP = { hit: 0.035, crit: 0.06, kill: 0.04, shot: 0.03, rifle: 0.03, pistol: 0.03, bossShot: 0.06, tap: 0.03, flip: 0.05 };
  var R = {
    tap: function (c, o, t) { tone(c, o, t, 1480, 0.05, 0.05, "sine", 1100); },
    open: function (c, o, t) { hiss(c, o, t, 0.16, 0.05, "bandpass", 600, 2600, 1.4); tone(c, o, t + 0.02, 660, 0.12, 0.035, "sine", 990); },
    close: function (c, o, t) { hiss(c, o, t, 0.12, 0.04, "bandpass", 2400, 700, 1.4); tone(c, o, t, 880, 0.1, 0.03, "sine", 560); },
    confirm: function (c, o, t) { chord(c, o, t, [784, 1175], 0.06, 0.18, 0.06, "sine"); },
    error: function (c, o, t) { tone(c, o, t, 220, 0.09, 0.07, "square", 180); tone(c, o, t + 0.1, 196, 0.12, 0.06, "square", 160); },
    coin: function (c, o, t) { tone(c, o, t, 1568, 0.08, 0.06, "square"); tone(c, o, t + 0.07, 2093, 0.22, 0.06, "square"); },
    hit: function (c, o, t) { hiss(c, o, t, 0.06, 0.09, "bandpass", 1800, 600, 0.8); tone(c, o, t, 180, 0.07, 0.07, "sine", 70); },
    crit: function (c, o, t) { hiss(c, o, t, 0.09, 0.12, "highpass", 3000, 1500, 0.7); tone(c, o, t, 1320, 0.12, 0.05, "triangle", 2200); tone(c, o, t, 140, 0.1, 0.09, "sine", 55); },
    kill: function (c, o, t) { tone(c, o, t, 520, 0.09, 0.06, "triangle", 260); hiss(c, o, t, 0.08, 0.06, "lowpass", 1400, 300, 0.7); },
    eliteKill: function (c, o, t) { tone(c, o, t, 90, 0.35, 0.16, "sine", 38); hiss(c, o, t, 0.3, 0.12, "lowpass", 900, 120, 0.7); chord(c, o, t + 0.05, [659, 988], 0.05, 0.25, 0.05, "triangle"); },
    hurt: function (c, o, t) { tone(c, o, t, 150, 0.16, 0.12, "square", 70); hiss(c, o, t, 0.12, 0.08, "lowpass", 900, 200, 0.8); },
    dash: function (c, o, t) { hiss(c, o, t, 0.18, 0.09, "bandpass", 500, 3200, 2); },
    skill: function (c, o, t) { tone(c, o, t, 220, 0.4, 0.08, "sawtooth", 660, 0.02); hiss(c, o, t + 0.03, 0.35, 0.07, "bandpass", 800, 4000, 1.5); chord(c, o, t + 0.08, [523, 784, 1047], 0.04, 0.3, 0.04, "triangle"); },
    level: function (c, o, t) { chord(c, o, t, [523, 659, 784, 1047], 0.07, 0.35, 0.06, "triangle"); },
    phase: function (c, o, t) { tone(c, o, t, 70, 0.8, 0.14, "sawtooth", 45); hiss(c, o, t, 0.7, 0.08, "lowpass", 600, 80, 0.7); },
    boss: function (c, o, t) { tone(c, o, t, 55, 1.0, 0.16, "sawtooth", 41); tone(c, o, t + 0.25, 82, 0.8, 0.1, "square", 61); },
    win: function (c, o, t) { chord(c, o, t, [523, 659, 784, 1047, 1319], 0.09, 0.7, 0.07, "triangle"); },
    over: function (c, o, t) { chord(c, o, t, [392, 330, 262, 196], 0.14, 0.5, 0.06, "sine"); },
    ach: function (c, o, t) { chord(c, o, t, [880, 1109, 1319], 0.06, 0.4, 0.05, "sine"); },
    pull: function (c, o, t) { hiss(c, o, t, 0.6, 0.07, "bandpass", 400, 5000, 2.5); tone(c, o, t, 330, 0.6, 0.05, "triangle", 990, 0.05); },
    flip: function (c, o, t) { hiss(c, o, t, 0.07, 0.06, "highpass", 2500, 4000, 0.8); },
    revealSR: function (c, o, t) { chord(c, o, t, [784, 988, 1175], 0.05, 0.45, 0.06, "triangle"); },
    revealSSR: function (c, o, t) { tone(c, o, t, 98, 0.9, 0.12, "sine", 65); chord(c, o, t + 0.05, [523, 659, 784, 1047, 1319, 1568], 0.07, 1.1, 0.06, "triangle"); hiss(c, o, t, 1.0, 0.05, "highpass", 4000, 9000, 0.5); },
    trial: function (c, o, t) { tone(c, o, t, 196, 0.5, 0.09, "sawtooth", 392, 0.03); chord(c, o, t + 0.12, [587, 880], 0.08, 0.4, 0.05, "triangle"); }
  };
  function play(ctx, k, gain) {
    var fn = R[k]; if (!fn || !ctx || gain <= 0) return false;
    var t = ctx.currentTime;
    if (GAP[k] && last[k] && t - last[k] < GAP[k]) return true;
    last[k] = t;
    var out = ctx.createGain(); out.gain.value = Math.min(1, gain * 1.6); out.connect(ctx.destination);
    try { fn(ctx, out, t + 0.002); } catch (e) { return false; }
    return true;
  }
  root.SakurayoSfxLib = Object.freeze({ play: play, keys: Object.keys(R) });
})(typeof window !== "undefined" ? window : globalThis);
