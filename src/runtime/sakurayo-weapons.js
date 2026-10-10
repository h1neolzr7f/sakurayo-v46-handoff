/* Auxiliary weapon system (构筑武器). Every character keeps her signature main attack and can stack
   up to any mix of these sub-weapons from level-up cards; each reaches an evolution at Lv5.
   Melee and ranged are freely mixed (Rion can take guns, Sayo can take orbit blades).
   Pure logic + drawing; the game injects an api: { P, target(range), push(b), aoe(x,y,r,d,c), hit(e,d,src), enemiesNear(x,y,r), fx(k,x,y), sound(k) }. */
(function (global) {
  "use strict";
  var TAU = Math.PI * 2;
  // dmg is a multiple of P.dmg per hit; cd in seconds. Numbers tuned so a Lv5 weapon ≈ +35-45% of a base main-gun DPS.
  var DEF = {
    spread:   { n: "散射樱扇", evo: "百花缭乱", e: "🌸", s: "gun",   d: "扇形散射 {c} 发近距霰弹", cd: 1.1, dmg: 0.42 },
    ricochet: { n: "弹射符弹", evo: "千回符链", e: "🔁", s: "gun",   d: "主武器子弹命中后弹射 {c} 次", cd: 0, dmg: 0 },
    homing:   { n: "追踪纸鹤", evo: "群鹤夜啼", e: "🕊️", s: "magical", d: "每轮放出 {c} 只追踪纸鹤", cd: 1.5, dmg: 0.7 },
    bomb:     { n: "爆裂樱弹", evo: "八重爆樱", e: "💥", s: "gun",   d: "投掷榴弹，范围爆炸（半径 {r}）", cd: 2.2, dmg: 1.5 },
    laser:    { n: "月光激光", evo: "望月贯光", e: "🔆", s: "tech",  d: "沿瞄准方向照射贯穿激光 {t}s", cd: 3.4, dmg: 3.2 },
    orbit:    { n: "环绕樱刃", evo: "落樱结界", e: "🗡️", s: "ninja", d: "{c} 把樱刃环绕自身切割", cd: 0, dmg: 0.55 },
    boomerang:{ n: "回旋斩月", evo: "双月回天", e: "🌙", s: "ninja", d: "掷出回旋刃，往返切割（{c} 把）", cd: 1.8, dmg: 1.1 }
  };
  // Evolution needs Lv5 + the paired base upgrade (Vampire-Survivors style).
  var PAIR = { spread: "multi", ricochet: "pierce", homing: "star", bomb: "blast", laser: "rail", orbit: "sword", boomerang: "speed" };
  var ORDER = Object.keys(DEF);
  function stats(id, lv, evo) {
    evo = !!evo && lv >= 5; var k = DEF[id];
    return {
      c: id === "spread" ? 3 + lv + (evo ? 3 : 0) : id === "ricochet" ? lv + (evo ? 2 : 0) : id === "homing" ? lv + (evo ? 3 : 0) : id === "orbit" ? 1 + lv + (evo ? 2 : 0) : id === "boomerang" ? (evo ? 2 : 1) : 1,
      r: id === "bomb" ? 64 + lv * 10 + (evo ? 30 : 0) : 0,
      t: id === "laser" ? +(0.35 + lv * 0.07 + (evo ? 0.3 : 0)).toFixed(2) : 0,
      cd: k.cd * (1 - lv * 0.06) * (evo ? 0.75 : 1),
      dmg: k.dmg * (1 + (lv - 1) * 0.16) * (evo ? 1.35 : 1)
    };
  }
  function describe(id, lv, evo) {
    var s = stats(id, lv, evo), k = DEF[id];
    return (evo ? "【进化·" + k.evo + "】" : "") + k.d.replace("{c}", s.c).replace("{r}", s.r).replace("{t}", s.t) + (k.cd ? "｜冷却 " + s.cd.toFixed(1) + "s" : "") + (s.dmg ? "｜单次 " + Math.round(s.dmg * 100) + "%攻击" : "");
  }
  function state(P) { if (!P.weapons46) P.weapons46 = {}; return P.weapons46; }
  function level(P, id) { var w = state(P)[id]; return w ? w.lv : 0; }
  function gain(P, id) { var W = state(P); if (!W[id]) W[id] = { lv: 0, t: 0.3, a: 0 }; W[id].lv = Math.min(5, W[id].lv + 1); return W[id].lv; }
  function aimAngle(api, range) { var t = api.target(range); var P = api.P; return t ? Math.atan2(t.y - P.y, t.x - P.x) : (P.weaponAngle || 0); }
  function tick(dt, api) {
    var P = api.P, W = state(P), id, w, s, i, a;
    for (id in W) {
      w = W[id]; if (!w.lv) continue; s = stats(id, w.lv, w.evo); w.t -= dt;
      if (id === "orbit") {
        w.a = (w.a + dt * (w.evo ? 4.6 : 3.4)) % TAU;
        var rad = 62 + w.lv * 4;
        for (i = 0; i < s.c; i++) {
          a = w.a + i * TAU / s.c;
          var bx = P.x + Math.cos(a) * rad, by = P.y + Math.sin(a) * rad;
          var near = api.enemiesNear(bx, by, 16);
          for (var j = 0; j < near.length; j++) { var e = near[j]; if ((e.orb46 || 0) > api.now) continue; e.orb46 = api.now + 0.32; api.hit(e, P.dmg * s.dmg, "orbit"); }
        }
        continue;
      }
      if (!DEF[id].cd || w.t > 0) continue;
      w.t = s.cd;
      if (id === "spread") {
        a = aimAngle(api, 320); var fan = 0.9 + (w.evo ? 0.5 : 0);
        for (i = 0; i < s.c; i++) { var q = a - fan / 2 + fan * i / Math.max(1, s.c - 1); api.push({ x: P.x, y: P.y, vx: Math.cos(q) * 760, vy: Math.sin(q) * 760, r: 4, life: 0.42, dmg: P.dmg * s.dmg, pierce: 0, source: "shot", school: "gun", tracer46: "#ffd0e4", hit: new Set() }); }
        api.fx("muzzle", P.x + Math.cos(a) * 24, P.y + Math.sin(a) * 24); api.sound("pistol");
      } else if (id === "homing") {
        for (i = 0; i < s.c; i++) { var h = (P.weaponAngle || 0) + Math.PI + (i - (s.c - 1) / 2) * 0.5; api.push({ x: P.x, y: P.y, vx: Math.cos(h) * 360, vy: Math.sin(h) * 360, r: 6, life: 2.2, dmg: P.dmg * s.dmg, pierce: 0, home: 0.16, crane46: 1, source: "star", school: "magical", tracer46: "#bfe9ff", hit: new Set() }); }
      } else if (id === "bomb") {
        var tg = api.target(420); a = aimAngle(api, 420);
        api.push({ x: P.x, y: P.y, vx: Math.cos(a) * 440, vy: Math.sin(a) * 440, r: 8, life: tg ? Math.min(1, Math.hypot(tg.x - P.x, tg.y - P.y) / 440) : 0.8, dmg: P.dmg * s.dmg * 0.3, pierce: 0, boom46: s.r, boomDmg46: P.dmg * s.dmg, source: "shot", school: "gun", tracer46: "#ffb070", hit: new Set() });
      } else if (id === "laser") {
        w.beam = { a: aimAngle(api, 700), t: s.t, len: 640, tick: 0 };
      } else if (id === "boomerang") {
        a = aimAngle(api, 380);
        for (i = 0; i < s.c; i++) { var g = a + i * Math.PI; api.push({ x: P.x, y: P.y, vx: Math.cos(g) * 620, vy: Math.sin(g) * 620, r: 14, life: 1.25, dmg: P.dmg * s.dmg, pierce: 99, rang46: 1.25, source: "blade", school: "ninja", tracer46: "#e9d4ff", hit: new Set() }); }
      }
    }
    var L = W.laser;
    if (L && L.beam) {
      var B = L.beam; B.t -= dt; B.tick -= dt; B.a = aimAngle(api, 700) * 0.15 + B.a * 0.85;
      if (B.tick <= 0) {
        B.tick = 0.1; var ls = stats("laser", L.lv, L.evo), cx = Math.cos(B.a), cy = Math.sin(B.a);
        var cand = api.enemiesNear(P.x + cx * B.len / 2, P.y + cy * B.len / 2, B.len / 2 + 30);
        for (i = 0; i < cand.length; i++) { var en = cand[i], px = en.x - P.x, py = en.y - P.y, along = px * cx + py * cy; if (along < 0 || along > B.len) continue; if (Math.abs(px * cy - py * cx) < en.r + (L.evo ? 20 : 12)) api.hit(en, P.dmg * ls.dmg * 0.1 / ls.t * 0.6, "laser"); }
      }
      if (B.t <= 0) L.beam = null;
    }
  }
  // Called by the bullet loop after a hit. Returns true when the bullet should stop.
  function onHit(b, e, api) {
    if (b.boom46) { api.aoe(b.x, b.y, b.boom46, b.boomDmg46, "#ff9a4a"); api.fx("shatter", b.x, b.y); return true; }
    var W = state(api.P);
    if (!b.bounced46 && b.source === "shot" && W.ricochet && W.ricochet.lv && !b.tracer46) b.bounce46 = stats("ricochet", W.ricochet.lv, W.ricochet.evo).c, b.bounced46 = 1;
    if (b.bounce46 > 0) {
      var best = null, bd = 260, list = api.enemiesNear(e.x, e.y, 260);
      for (var i = 0; i < list.length; i++) { var o = list[i]; if (o.dead || b.hit.has(o)) continue; var d = Math.hypot(o.x - e.x, o.y - e.y); if (d < bd) { bd = d; best = o; } }
      if (best) { var sp = Math.hypot(b.vx, b.vy), a = Math.atan2(best.y - e.y, best.x - e.x); b.x = e.x; b.y = e.y; b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp; b.life = Math.max(b.life, bd / sp + 0.05); b.bounce46--; b.pierce = Math.max(b.pierce, 1); b.tracer46 = "#9ff3ff"; return false; }
    }
    return false;
  }
  function update(b, dt, api) {
    if (b.boom46 && b.life - dt <= 0) { api.aoe(b.x, b.y, b.boom46, b.boomDmg46, "#ff9a4a"); api.fx("shatter", b.x, b.y); b.boom46 = 0; }
    if (b.rang46) { var P = api.P, t = b.rang46 - b.life; if (t > b.rang46 * 0.45) { var a = Math.atan2(P.y - b.y, P.x - b.x), sp = Math.hypot(b.vx, b.vy); b.vx += (Math.cos(a) * sp - b.vx) * Math.min(1, dt * 6); b.vy += (Math.sin(a) * sp - b.vy) * Math.min(1, dt * 6); if (Math.hypot(P.x - b.x, P.y - b.y) < 20) b.life = 0; if (t > b.rang46 * 0.5 && !b.back46) { b.back46 = 1; b.hit = new Set(); } } }
  }
  function draw(ctx, P, now) {
    var W = P.weapons46; if (!W) return;
    if (W.orbit && W.orbit.lv) {
      var s = stats("orbit", W.orbit.lv, W.orbit.evo), rad = 62 + W.orbit.lv * 4;
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      for (var i = 0; i < s.c; i++) {
        var a = W.orbit.a + i * TAU / s.c, x = P.x + Math.cos(a) * rad, y = P.y + Math.sin(a) * rad;
        ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.PI / 2);
        ctx.fillStyle = W.orbit.evo ? "#ffd6ef" : "#ff9ccf"; ctx.shadowColor = "#ff5aa6"; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.moveTo(0, -14); ctx.quadraticCurveTo(7, 0, 0, 14); ctx.quadraticCurveTo(-7, 0, 0, -14); ctx.fill(); ctx.restore();
      }
      ctx.restore();
    }
    var L = W.laser;
    if (L && L.beam) {
      var B = L.beam, w = (L.evo ? 20 : 12) * (0.75 + Math.sin(now * 60) * 0.25);
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(140,220,255,.45)"; ctx.lineWidth = w * 2.2; ctx.beginPath(); ctx.moveTo(P.x, P.y); ctx.lineTo(P.x + Math.cos(B.a) * B.len, P.y + Math.sin(B.a) * B.len); ctx.stroke();
      ctx.strokeStyle = "#f4fdff"; ctx.lineWidth = w * 0.6; ctx.stroke(); ctx.restore();
    }
  }
  // Marks Lv5 weapons whose partner is owned as evolved; returns the ids that just evolved.
  function evolve(P, owns) {
    var W = state(P), out = [];
    for (var id in W) if (W[id].lv >= 5 && !W[id].evo && owns(PAIR[id])) { W[id].evo = true; out.push(id); }
    return out;
  }
  function choices(P) {
    var owned = ORDER.filter(function (id) { return level(P, id) > 0; });
    return ORDER.filter(function (id) { return level(P, id) < 5 && (level(P, id) > 0 || owned.length < 4); });
  }
  global.SakurayoWeapons = Object.freeze({ DEF: DEF, ORDER: ORDER, stats: stats, describe: describe, level: level, gain: gain, tick: tick, onHit: onHit, update: update, draw: draw, choices: choices, evolve: evolve, PAIR: PAIR, MAX_SLOTS: 4 });
})(typeof window !== "undefined" ? window : globalThis);
