(function (global) {
  "use strict";

  var VERSION = "4.6.0";
  var COLS = 4;
  var ROWS = 2;
  var DAMP = 10;
  var viewW = 430;
  var viewH = 932;
  var worldW = COLS * 430;
  var worldH = ROWS * 932;
  var camX = 0;
  var camY = 0;

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }

  function configure(w, h) {
    viewW = Math.max(1, Number(w) || 1);
    viewH = Math.max(1, Number(h) || 1);
    worldW = COLS * viewW;
    worldH = ROWS * viewH;
    return size();
  }

  function size() {
    return {
      cols: COLS,
      rows: ROWS,
      screens: COLS * ROWS,
      viewW: viewW,
      viewH: viewH,
      worldW: worldW,
      worldH: worldH,
    };
  }

  function clampCam(x, y) {
    return {
      x: clamp(x, 0, Math.max(0, worldW - viewW)),
      y: clamp(y, 0, Math.max(0, worldH - viewH)),
    };
  }

  function targetOf(px, py) {
    return clampCam((Number(px) || 0) - viewW * 0.5, (Number(py) || 0) - viewH * 0.5);
  }

  function snap(px, py) {
    var t = targetOf(px, py);
    camX = t.x;
    camY = t.y;
    return current();
  }

  function follow(px, py, dt, instant) {
    var t = targetOf(px, py);
    if (instant || !(dt > 0)) {
      camX = t.x;
      camY = t.y;
      return current();
    }
    var k = 1 - Math.exp(-DAMP * dt);
    var held = clampCam(camX + (t.x - camX) * k, camY + (t.y - camY) * k);
    camX = held.x;
    camY = held.y;
    return current();
  }

  function current() {
    return {
      x: camX,
      y: camY,
      left: camX,
      top: camY,
      right: camX + viewW,
      bottom: camY + viewH,
      viewW: viewW,
      viewH: viewH,
      worldW: worldW,
      worldH: worldH,
      cols: COLS,
      rows: ROWS,
    };
  }

  function worldToScreen(x, y) {
    return { x: (Number(x) || 0) - camX, y: (Number(y) || 0) - camY };
  }

  function screenToWorld(x, y) {
    return { x: (Number(x) || 0) + camX, y: (Number(y) || 0) + camY };
  }

  function contains(x, y, pad) {
    pad = Number(pad) || 0;
    return (
      x >= camX - pad &&
      x <= camX + viewW + pad &&
      y >= camY - pad &&
      y <= camY + viewH + pad
    );
  }

  function inWorld(x, y, pad) {
    pad = Number(pad) || 0;
    return x > -pad && x < worldW + pad && y > -pad && y < worldH + pad;
  }

  function clampPlayer(x, y, edges) {
    edges = edges || {};
    var ex = edges.edgeX == null ? 28 : edges.edgeX;
    var et = edges.edgeTop == null ? 73 : edges.edgeTop;
    var eb = edges.edgeBottom == null ? 22 : edges.edgeBottom;
    return {
      x: clamp(x, ex, Math.max(ex, worldW - ex)),
      y: clamp(y, et, Math.max(et, worldH - eb)),
    };
  }

  function spawnOutside(pad, rng) {
    pad = pad == null ? 65 : Number(pad);
    var roll = typeof rng === "function" ? rng() : Math.random();
    var side = Math.floor(clamp(roll, 0, 0.999999) * 4);
    var along = typeof rng === "function" ? rng() : Math.random();
    var x;
    var y;
    if (side === 0) {
      x = camX + along * viewW;
      y = camY - pad;
    } else if (side === 1) {
      x = camX + viewW + pad;
      y = camY + along * viewH;
    } else if (side === 2) {
      x = camX + along * viewW;
      y = camY + viewH + pad;
    } else {
      x = camX - pad;
      y = camY + along * viewH;
    }
    return { x: x, y: y, side: side };
  }

  function visibleChunks() {
    var x0 = Math.floor(camX / viewW) - 1;
    var x1 = Math.floor((camX + viewW) / viewW) + 1;
    var y0 = Math.floor(camY / viewH) - 1;
    var y1 = Math.floor((camY + viewH) / viewH) + 1;
    var out = [];
    var cx;
    var cy;
    for (cy = y0; cy <= y1; cy++) {
      for (cx = x0; cx <= x1; cx++) {
        if (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS) continue;
        out.push({ col: cx, row: cy, x: cx * viewW, y: cy * viewH });
      }
    }
    return out;
  }

  function apply(ctx, shakeX, shakeY) {
    if (!ctx) return current();
    ctx.translate(-(camX - (shakeX || 0)), -(camY - (shakeY || 0)));
    return current();
  }

  function snapshot() {
    var s = size();
    s.camX = camX;
    s.camY = camY;
    s.centered = true;
    return s;
  }

  global.SakurayoCamera = {
    version: VERSION,
    COLS: COLS,
    ROWS: ROWS,
    DAMP: DAMP,
    configure: configure,
    size: size,
    snap: snap,
    follow: follow,
    current: current,
    worldToScreen: worldToScreen,
    screenToWorld: screenToWorld,
    contains: contains,
    inWorld: inWorld,
    clampPlayer: clampPlayer,
    spawnOutside: spawnOutside,
    visibleChunks: visibleChunks,
    apply: apply,
    snapshot: snapshot,
  };
})(typeof window !== "undefined" ? window : globalThis);
