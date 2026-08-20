(function (global) {
  "use strict";

  var VERSION = "4.6.7";
  var MAX = 2;
  var COST = 8;
  var REFUND = 4;
  var CAP = 20;
  var START = 10;
  var REGEN = 0.4;
  var RANGE = 220;
  var BLADE_RANGE = 78;
  var RATE = 1.15;
  var DMG = 0.32;
  var IDS = Object.freeze(["sayo", "aya", "rion"]);
  var NAMES = Object.freeze({ sayo: "小夜", aya: "绫", rion: "凛音" });
  var WEAPON = Object.freeze({ sayo: "rifle", aya: "pistol", rion: "blade" });

  var CSS =
    "#opsDock46{position:absolute;z-index:6;left:max(8px,env(safe-area-inset-left));bottom:max(168px,calc(env(safe-area-inset-bottom) + 150px));width:min(168px,42vw);padding:8px;border-radius:16px;background:#0b0818d8;border:1px solid #ffe6a344;pointer-events:auto}" +
    "#opsDock46[hidden]{display:none!important}" +
    ".opsDp46{display:flex;align-items:center;gap:8px;margin:0 0 8px}" +
    ".opsDp46 b{color:#ffe7a3;font:800 11px/1 system-ui;letter-spacing:.08em;white-space:nowrap}" +
    ".opsRail46{flex:1;height:7px;border-radius:99px;background:#ffe6a322;overflow:hidden}" +
    ".opsRail46 i{display:block;height:100%;width:0;border-radius:99px;background:linear-gradient(90deg,#ffe08a,#ff74c8)}" +
    ".opsSlots46{display:grid;grid-template-columns:1fr 1fr;gap:6px}" +
    ".opsSlots46 button{min-height:58px;padding:6px 4px;border-radius:12px;border:1px solid #ff9bcc55;background:linear-gradient(180deg,#221436,#120c20);color:#fff7fb;font:800 11px/1.15 system-ui}" +
    ".opsSlots46 button img{display:block;width:28px;height:28px;margin:0 auto 4px;border-radius:50%;object-fit:cover;background:#100b22}" +
    ".opsSlots46 button.on{border-color:#ffe6a3aa;box-shadow:0 0 12px #ffd36b44}" +
    ".opsSlots46 button.poor{opacity:.42}" +
    ".opsSlots46 button small{display:block;margin-top:2px;color:#ffe7a3;font:700 9px/1 system-ui}" +
    "@media(orientation:landscape){#opsDock46{left:max(12px,env(safe-area-inset-left));bottom:max(168px,calc(env(safe-area-inset-bottom) + 150px));width:196px}}" +
    "html.landscape46 #opsDock46{left:max(12px,env(safe-area-inset-left));bottom:max(168px,calc(env(safe-area-inset-bottom) + 150px));width:196px}";

  var state = emptyState();

  function emptyState() {
    return { dp: START, regen: 0, units: [] };
  }

  function clamp(n, min, max) {
    n = Math.floor(Number(n) || 0);
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  function reset() {
    state = emptyState();
    return snapshot();
  }

  function snapshot() {
    return {
      version: VERSION,
      dp: state.dp,
      cap: CAP,
      cost: COST,
      max: MAX,
      units: state.units.map(function (u) {
        return { id: u.id, x: u.x, y: u.y, n: NAMES[u.id] || u.id };
      }),
    };
  }

  function roster(playerId) {
    return IDS.filter(function (id) {
      return id !== playerId;
    });
  }

  function find(id) {
    for (var i = 0; i < state.units.length; i++) {
      if (state.units[i].id === id) return state.units[i];
    }
    return null;
  }

  function enabled(mode) {
    return mode !== "testimony";
  }

  function canDeploy(id, playerId) {
    if (IDS.indexOf(id) < 0) return { ok: false, reason: "id" };
    if (id === playerId) return { ok: false, reason: "self" };
    if (find(id)) return { ok: false, reason: "out" };
    if (state.units.length >= MAX) return { ok: false, reason: "full" };
    if (state.dp < COST) return { ok: false, reason: "dp" };
    return { ok: true, reason: "" };
  }

  function pinAt(index, px, py, w, h) {
    var side = index % 2 === 0 ? -1 : 1;
    var x = Math.max(36, Math.min((w || 430) - 36, (Number(px) || 0) + side * 72));
    var y = Math.max(64, Math.min((h || 932) - 80, (Number(py) || 0) + 18));
    return { x: x, y: y };
  }

  function deploy(id, playerId, px, py, w, h) {
    var gate = canDeploy(id, playerId);
    if (!gate.ok) return { ok: false, reason: gate.reason, snapshot: snapshot() };
    var pin = pinAt(state.units.length, px, py, w, h);
    state.dp -= COST;
    state.units.push({
      id: id,
      x: pin.x,
      y: pin.y,
      clock: 0.2,
      weapon: WEAPON[id] || "rifle",
    });
    return { ok: true, reason: "", snapshot: snapshot() };
  }

  function retreat(id) {
    var next = [];
    var found = false;
    for (var i = 0; i < state.units.length; i++) {
      if (state.units[i].id === id) found = true;
      else next.push(state.units[i]);
    }
    if (!found) return { ok: false, reason: "missing", snapshot: snapshot() };
    state.units = next;
    state.dp = clamp(state.dp + REFUND, 0, CAP);
    return { ok: true, reason: "", snapshot: snapshot() };
  }

  function grant(n) {
    state.dp = clamp(state.dp + n, 0, CAP);
    return snapshot();
  }

  function tick(dt, world) {
    var play = world && world.play;
    var shots = [];
    if (!play || !enabled(world.mode)) return { shots: shots, snapshot: snapshot() };
    state.regen += Number(dt) || 0;
    var step = 1 / REGEN;
    while (state.regen >= step && state.dp < CAP) {
      state.dp += 1;
      state.regen -= step;
    }
    if (state.dp >= CAP) state.regen = 0;
    var dmg = Math.max(1, (Number(world.dmg) || 8) * DMG * (Number(world.petPow) || 1));
    for (var i = 0; i < state.units.length; i++) {
      var u = state.units[i];
      u.clock -= dt;
      if (u.clock > 0) continue;
      u.clock = RATE;
      var target = typeof world.nearest === "function" ? world.nearest(u.x, u.y, u.weapon === "blade" ? BLADE_RANGE : RANGE) : null;
      if (!target) continue;
      shots.push({
        id: u.id,
        weapon: u.weapon,
        x: u.x,
        y: u.y,
        tx: target.x,
        ty: target.y,
        dmg: dmg,
      });
    }
    return { shots: shots, snapshot: snapshot() };
  }

  function fireShots(shots, world) {
    if (!shots || !world) return 0;
    var n = 0;
    for (var i = 0; i < shots.length; i++) {
      var s = shots[i];
      if (s.weapon === "blade" && typeof world.aoe === "function") {
        world.aoe(s.x, s.y, BLADE_RANGE, s.dmg, "#ff8fa5", false, { source: "summon", school: "summon" });
        n += 1;
        continue;
      }
      if (typeof world.pushBullet !== "function") continue;
      var ang = Math.atan2(s.ty - s.y, s.tx - s.x);
      var spd = s.weapon === "pistol" ? 390 : 430;
      world.pushBullet({
        x: s.x,
        y: s.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        r: 4,
        life: 1.1,
        dmg: s.dmg,
        pierce: 0,
        home: 0,
        source: "summon",
        school: "summon",
        hit: new Set(),
      });
      n += 1;
    }
    return n;
  }

  function renderDock(host, playerId, art) {
    if (!host) return snapshot();
    var ids = roster(playerId);
    var html = '<div class="opsDp46"><b>DP ' + state.dp + "/" + CAP + '</b><span class="opsRail46"><i style="width:' + Math.round((state.dp / CAP) * 100) + '%"></i></span></div><div class="opsSlots46">';
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i];
      var out = !!find(id);
      var gate = canDeploy(id, playerId);
      html +=
        '<button type="button" data-op="' +
        id +
        '" class="' +
        (out ? "on" : gate.reason === "dp" || gate.reason === "full" ? "poor" : "") +
        '"><img alt="" src="' +
        (typeof art === "function" ? art("characters/" + id + "/default/portrait.webp") : "") +
        '">' +
        (NAMES[id] || id) +
        "<small>" +
        (out ? "撤回 +4" : "部署 " + COST) +
        "</small></button>";
    }
    html += "</div>";
    host.innerHTML = html;
    return snapshot();
  }

  function injectStyle() {
    if (!global.document) return;
    var style = global.document.getElementById("sakurayo-ops-css");
    if (style && style.parentNode) style.parentNode.removeChild(style);
    style = global.document.createElement("style");
    style.id = "sakurayo-ops-css";
    style.textContent = CSS;
    (global.document.head || global.document.documentElement).appendChild(style);
  }

  global.SakurayoOps = {
    version: VERSION,
    MAX: MAX,
    COST: COST,
    CAP: CAP,
    START: START,
    IDS: IDS,
    NAMES: NAMES,
    injectStyle: injectStyle,
    reset: reset,
    snapshot: snapshot,
    roster: roster,
    enabled: enabled,
    canDeploy: canDeploy,
    deploy: deploy,
    retreat: retreat,
    grant: grant,
    tick: tick,
    fireShots: fireShots,
    renderDock: renderDock,
  };
})(typeof window !== "undefined" ? window : globalThis);
