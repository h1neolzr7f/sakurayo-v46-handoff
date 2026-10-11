/* Sakurayo combat feel: analog stick shaping, velocity smoothing, knockback and hit-stop.
   Pure helpers (no DOM) so they can be unit-tested; index.html owns the game state. */
(function (global) {
  "use strict";
  var DEAD = 0.16;          // radial dead zone of the virtual stick
  var ACCEL = 16;           // 1/s: how fast velocity reaches the stick target
  var DECEL = 22;           // 1/s: faster stop when the stick is released
  var TURN = 30;            // 1/s: sharp reversals (dot < 0) snap faster
  function stick(dx, dy) {
    var m = Math.hypot(dx, dy);
    if (m <= DEAD) return { x: 0, y: 0, m: 0 };
    var k = Math.min(1, (m - DEAD) / (1 - DEAD));
    var out = 0.38 + 0.62 * k;             // keep a usable walk speed just past the dead zone
    return { x: dx / m * out, y: dy / m * out, m: out };
  }
  function steer(v, tx, ty, dt) {
    var tm = Math.hypot(tx, ty), vm = Math.hypot(v.x, v.y), rate;
    if (!tm) rate = DECEL;
    else if (vm > 0.05 && (v.x * tx + v.y * ty) / (vm * tm) < 0) rate = TURN;
    else rate = ACCEL;
    var a = 1 - Math.exp(-rate * Math.max(0, dt));
    v.x += (tx - v.x) * a; v.y += (ty - v.y) * a;
    if (!tm && Math.hypot(v.x, v.y) < 0.02) { v.x = 0; v.y = 0; }
    return v;
  }
  function knock(e, fromX, fromY, damage, crit, source) {
    if (!e || e.type === "boss" || e.guardFor) return;
    var melee = source === "blade";
    var power = Math.min(1, damage / Math.max(1, e.max || 1) * 3) * (melee ? 170 : 90) + (crit ? 60 : 0);
    if (e.type === "tank") power *= 0.35;
    var dx = e.x - fromX, dy = e.y - fromY, l = Math.hypot(dx, dy) || 1;
    e.kbx = (e.kbx || 0) + dx / l * power; e.kby = (e.kby || 0) + dy / l * power;
  }
  function applyKnock(e, dt) {
    if (!e.kbx && !e.kby) return;
    e.x += e.kbx * dt; e.y += e.kby * dt;
    var f = Math.exp(-14 * dt); e.kbx *= f; e.kby *= f;
    if (Math.abs(e.kbx) + Math.abs(e.kby) < 4) { e.kbx = 0; e.kby = 0; }
  }
  // hit-stop: short global freezes on heavy hits, capped so they never stack into a stutter
  function stopFor(kind) { return kind === "boss" ? 0.07 : kind === "elite" ? 0.055 : kind === "crit" ? 0.03 : 0; }
  global.SakurayoFeel = Object.freeze({ DEAD: DEAD, stick: stick, steer: steer, knock: knock, applyKnock: applyKnock, stopFor: stopFor });
})(typeof window !== "undefined" ? window : globalThis);
