/* Interactive battlefield props: breakable crates, treasure chests and spirit shrines.
   Pure state + canvas drawing; index.html supplies the effects through an api object:
   api.gems(x, y, count, value), api.heal(fraction), api.shield(amount), api.coins(n),
   api.fx(kind, x, y), api.toast(text), api.sound(key). */
(function (global) {
  "use strict";
  // per chapter layout flavour: how many of each prop and how they cluster
  var LAYOUT = {
    1: { crates: 12, chests: 2, shrines: 2, cluster: 3 },  // shrine street: crates in little stacks
    2: { crates: 10, chests: 2, shrines: 1, cluster: 1 },  // neon city: scattered supply boxes
    3: { crates: 8, chests: 3, shrines: 2, cluster: 2 },   // sword graveyard: more chests, fewer crates
    4: { crates: 6, chests: 3, shrines: 3, cluster: 1 },   // mirror core: shrines matter most
  };
  var CHEST_COINS = 12;
  var TRAP_REARM = 12;
  function mulberry(seed) {
    var a = seed >>> 0;
    return function () { a = (a + 0x6d2b79f5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function create(stageId, worldW, worldH, startX, startY, seed, blocked) {
    var L = LAYOUT[stageId] || LAYOUT[1], rnd = mulberry(seed || 1), list = [], tries = 0;
    function place(kind, r, extra) {
      while (tries++ < 4000) {
        var x = 80 + rnd() * (worldW - 160), y = 80 + rnd() * (worldH - 160);
        if (Math.hypot(x - startX, y - startY) < 260) continue;           // keep the spawn clear
        if (blocked && blocked(x, y, r + 10)) continue;
        var ok = true;
        for (var i = 0; i < list.length; i++) if (Math.hypot(list[i].x - x, list[i].y - y) < list[i].r + r + 26) { ok = false; break; }
        if (!ok) continue;
        var p = { kind: kind, x: x, y: y, r: r, done: false, t: 0 };
        for (var k in extra) p[k] = extra[k];
        list.push(p); return p;
      }
      return null;
    }
    var i, j;
    for (i = 0; i < Math.ceil(L.crates / L.cluster); i++) {
      var head = place("crate", 17, { hp: 1 });
      for (j = 1; head && j < L.cluster; j++) {
        var a = rnd() * Math.PI * 2, c = { kind: "crate", x: head.x + Math.cos(a) * 40, y: head.y + Math.sin(a) * 40, r: 17, hp: 1, done: false, t: 0 };
        if (c.x > 60 && c.y > 60 && c.x < worldW - 60 && c.y < worldH - 60 && !(blocked && blocked(c.x, c.y, 27))) list.push(c);
      }
    }
    for (i = 0; i < L.chests; i++) place("chest", 22, {});
    for (i = 0; i < L.shrines; i++) place("shrine", 26, { charge: 0 });
    for (i = 0; i < (L.traps || 2); i++) place("trap", 20, { cool: 0 });
    return list;
  }
  function update(list, P, dt, api, moving) {
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      if (p.done) { p.t += dt; continue; }
      var d = Math.hypot(P.x - p.x, P.y - p.y), touch = d < p.r + (P.r || 14) + 6;
      if (p.kind === "crate" && touch && (moving || P.inv > 0)) {
        p.done = true; api.fx("shatter", p.x, p.y); api.sound("hit");
        api.gems(p.x, p.y, 2, 4);
        if (i % 4 === 0) api.heal(0.05);
      } else if (p.kind === "chest" && touch) {
        p.done = true; api.fx("loot", p.x, p.y); api.sound("coin");
        api.gems(p.x, p.y, 6, 6); api.coins(CHEST_COINS); api.toast("宝箱 · 樱花币 +" + CHEST_COINS);
      } else if (p.kind === "trap") {
        // 符咒机关: stepping on the seal detonates it on nearby enemies, then it re-arms.
        p.cool = Math.max(0, p.cool - dt);
        if (touch && p.cool <= 0) { p.cool = TRAP_REARM; api.fx("skill", p.x, p.y); api.sound("crit"); api.aoe(p.x, p.y, 170); api.toast("符咒机关：引爆"); }
      } else if (p.kind === "shrine") {
        p.charge = touch ? Math.min(1.5, p.charge + dt) : Math.max(0, p.charge - dt * 0.5);
        if (p.charge >= 1.5) { p.done = true; api.fx("levelup", p.x, p.y); api.sound("level"); api.heal(0.25); api.shield(20); api.toast("灵龛：生命 +25%、护盾 +20"); }
      }
    }
  }
  function drawProp(ctx, p, t, art) {
    var img = art && art(p.kind), s = p.r * 2.6;
    if (p.done) {
      if (p.kind === "shrine" && img) { ctx.save(); ctx.globalAlpha = 0.35; ctx.drawImage(img, p.x - s / 2, p.y - s * 0.7, s, s); ctx.restore(); }
      return;
    }
    ctx.save();
    ctx.fillStyle = "#0008"; ctx.beginPath(); ctx.ellipse(p.x, p.y + p.r * 0.7, p.r * 1.05, p.r * 0.38, 0, 0, Math.PI * 2); ctx.fill();
    if (p.kind === "trap") {
      var armed = p.cool <= 0, pulse = 0.5 + Math.sin(t * 5) * 0.5;
      ctx.strokeStyle = armed ? "rgba(255,120,190," + (0.55 + pulse * 0.4) + ")" : "rgba(160,160,190,.35)"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r * 1.6, p.r * 0.8, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); for (var k = 0; k < 5; k++) { var a = -Math.PI / 2 + k * Math.PI * 4 / 5; ctx[k ? "lineTo" : "moveTo"](p.x + Math.cos(a) * p.r, p.y + Math.sin(a) * p.r * 0.5); } ctx.closePath(); ctx.stroke();
      if (!armed) { ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.font = "800 11px system-ui"; ctx.textAlign = "center"; ctx.fillText(Math.ceil(p.cool) + "s", p.x, p.y - p.r); }
      ctx.restore(); return;
    }
    if (p.kind === "chest") { ctx.shadowColor = "#7ff3ff"; ctx.shadowBlur = 10 + Math.sin(t * 4) * 5; }
    if (img) ctx.drawImage(img, p.x - s / 2, p.y - s * 0.7, s, s);
    else { ctx.fillStyle = p.kind === "chest" ? "#c9a24a" : p.kind === "shrine" ? "#b9a8d8" : "#8a5a3a"; ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2); }
    ctx.restore();
    if (p.kind === "shrine" && p.charge > 0) {
      ctx.save(); ctx.strokeStyle = "#ff9fd0"; ctx.lineWidth = 4; ctx.beginPath();
      ctx.arc(p.x, p.y - p.r * 1.4, 12, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (p.charge / 1.5)); ctx.stroke(); ctx.restore();
    }
  }
  function draw(ctx, list, t, art, view) {
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      if (view && (p.x < view.left - 60 || p.x > view.right + 60 || p.y < view.top - 60 || p.y > view.bottom + 60)) continue;
      drawProp(ctx, p, t, art);
    }
  }
  global.SakurayoProps = Object.freeze({ LAYOUT: LAYOUT, CHEST_COINS: CHEST_COINS, TRAP_REARM: TRAP_REARM, create: create, update: update, draw: draw });
})(typeof window !== "undefined" ? window : globalThis);
