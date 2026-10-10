/* Main-line levels (docs/STORY.md §4/§8/§9): 4 chapters × 4 nodes, rotating objective types,
   three-star rating. Pure logic + canvas drawing; the game injects an api per tick:
   { P, now, kills, enemies, spawnTarget(x,y,hp,kind)->enemy, aoe(x,y,r,dmg), toast(s), sound(k), worldW, worldH }.
   Stars never grant combat stats (rewards are coins / CG / album only). */
(function (global) {
  "use strict";
  var TAU = Math.PI * 2;
  var TYPE = {
    survive: { n: "生存", i: "⏳" }, clear: { n: "清剿", i: "⚔" }, escort: { n: "护送", i: "🏮" },
    timed: { n: "限时摧毁", i: "⏱" }, mech: { n: "机关", i: "☯" }, channel: { n: "读取", i: "📡" }, boss: { n: "Boss", i: "👹" }
  };
  // star keys: win | hits<=v | chests>=v | time<=v | npcHp>=v | mechKills>=v | breaks>=v | noUlt
  function L(id, ch, n, type, goal, s2, s3, map, extra) {
    var o = { id: id, ch: ch, n: n, type: type, goal: goal, stars: [{ k: "win", d: "通关" }, s2, s3], map: map, boss: type === "boss" };
    for (var k in extra || {}) o[k] = extra[k];
    return o;
  }
  var H = function (v) { return { k: "hits", v: v, d: "受击 ≤ " + v + " 次" }; };
  var LEVELS = [
    L("1-1", 1, "灯笼参道", "survive", { t: 90 }, { k: "chests", v: 2, d: "打开 2 个宝箱" }, H(6), [11, 57]),
    L("1-2", 1, "绘马长廊", "clear", { n: 60 }, { k: "time", v: 60, d: "60 秒内完成" }, H(6), [32, 44]),
    L("1-3", 1, "送灯", "escort", { path: [[0.18, 0.5], [0.36, 0.36], [0.55, 0.62], [0.72, 0.4], [0.86, 0.52]] }, { k: "npcHp", v: 70, d: "巫女血量 ≥ 70%" }, H(5), [55, 51], { npc: "miko" }),
    L("1-4", 1, "百目尸将", "boss", { bossAt: 22 }, { k: "breaks", v: 2, d: "触发 2 次破防" }, H(8), [84, 31]),
    L("2-1", 2, "瓦版追风", "timed", { n: 4, limit: 90 }, { k: "time", v: 65, d: "65 秒内完成" }, H(6), [12, 60]),
    L("2-2", 2, "射的屋", "mech", { n: 3 }, { k: "mechKills", v: 30, d: "机关击破 ≥ 30" }, H(6), [35, 40]),
    L("2-3", 2, "雨伞送箱", "escort", { path: [[0.15, 0.7], [0.4, 0.55], [0.6, 0.3], [0.85, 0.42]] }, H(0), { k: "npcHp", v: 70, d: "保安血量 ≥ 70%" }, [60, 58], { npc: "guard" }),
    L("2-4", 2, "射的屋大将", "boss", { bossAt: 22 }, { k: "breaks", v: 2, d: "触发 2 次破防" }, H(8), [85, 35]),
    L("3-1", 3, "剑冢入口", "survive", { t: 100 }, { k: "chests", v: 2, d: "打开 2 个宝箱" }, H(6), [12, 50]),
    L("3-2", 3, "拔剑", "timed", { n: 6, limit: 110, flee: 1 }, { k: "time", v: 70, d: "70 秒内完成" }, H(6), [34, 38]),
    L("3-3", 3, "事故日志", "channel", { t: 30 }, H(2), { k: "time", v: 70, d: "70 秒内完成" }, [58, 60]),
    L("3-4", 3, "黄泉御前", "boss", { bossAt: 22 }, { k: "breaks", v: 2, d: "触发 2 次破防" }, H(8), [84, 36]),
    L("4-1", 4, "镜廊", "timed", { n: 8, limit: 115, hp: 180, kind: "mirror" }, { k: "time", v: 75, d: "75 秒内完成" }, H(6), [12, 44]),
    L("4-2", 4, "第 317 室", "survive", { t: 110 }, { k: "noUlt", d: "不使用大招" }, H(6), [36, 60]),
    L("4-3", 4, "主控门", "escort", { path: [[0.15, 0.4], [0.38, 0.62], [0.62, 0.36], [0.86, 0.5]] }, { k: "npcHp", v: 100, d: "雨宫凛 0 次受伤" }, H(6), [60, 42], { npc: "rin" }),
    L("4-4", 4, "八重镜姬", "boss", { bossAt: 22 }, { k: "breaks", v: 3, d: "触发 3 次破防" }, H(8), [86, 30])
  ];
  var CHAPTERS = [
    { ch: 1, n: "第一章 · 神社外街", theme: "门认出了你。" }, { ch: 2, n: "第二章 · 夜店街", theme: "瓦版不说谎。" },
    { ch: 3, n: "第三章 · 黄泉参道", theme: "记住不等于继承痛苦。" }, { ch: 4, n: "第四章 · 碎镜地砖", theme: "像你不等于是你。" }
  ];
  function find(id) { for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i].id === id) return LEVELS[i]; return null; }
  function chapter(ch) { return LEVELS.filter(function (l) { return l.ch === ch; }); }
  function stars(save, id) { return (save.stars46 && save.stars46[id]) || 0; }
  // Unlock: node 1 of a chapter opens with the chapter (save.unlock); later nodes need the previous node cleared.
  // Legacy saves: a chapter whose boss is in save.done counts as fully cleared (boss node = 1 star).
  function cleared(save, id) { var l = find(id); return stars(save, id) > 0 || !!(l && l.boss && (save.done || []).indexOf(l.ch) >= 0); }
  function unlocked(save, id) {
    var l = find(id); if (!l) return false;
    if (l.ch > (save.unlock || 1)) return false;
    var list = chapter(l.ch), i = list.indexOf(l);
    if ((save.done || []).indexOf(l.ch) >= 0) return true;
    return i === 0 || cleared(save, list[i - 1].id);
  }
  function chapterStars(save, ch) { return chapter(ch).reduce(function (s, l) { return s + stars(save, l.id); }, 0); }

  function create(level, api) {
    var o = { id: level.id, type: level.type, t: 0, kills0: api.kills(), done: false, fail: "", targets: [], pads: [], npc: null, chan: 0, mechKills: 0, hitsAtStart: api.P.hits46 || 0 };
    var W = api.worldW, Hh = api.worldH, i, a;
    if (level.type === "timed") {
      for (i = 0; i < level.goal.n; i++) { a = i / level.goal.n * TAU + 0.4; var r = Math.min(W, Hh) * (0.28 + 0.1 * (i % 2)); var e = api.spawnTarget(W / 2 + Math.cos(a) * r, Hh / 2 + Math.sin(a) * r, level.goal.hp || (level.goal.flee ? 220 : 420), level.goal.kind || (level.goal.flee ? "sword" : "wagon")); if (e) o.targets.push(e); }
    } else if (level.type === "mech") {
      for (i = 0; i < level.goal.n; i++) { a = i / level.goal.n * TAU + 1.1; o.pads.push({ x: W / 2 + Math.cos(a) * W * 0.26, y: Hh / 2 + Math.sin(a) * Hh * 0.26, c: 0, used: false }); }
    } else if (level.type === "escort") {
      var p = level.goal.path.map(function (q) { return [q[0] * W, q[1] * Hh]; });
      o.npc = { x: p[0][0], y: p[0][1], hp: 100, max: 100, path: p, k: 1, hurt: 0, kind: level.npc || "miko", face: 1, walk: 0 };
    } else if (level.type === "channel") {
      o.zone = { x: W / 2, y: Hh / 2, r: 92 };
    }
    return o;
  }
  function tick(level, o, dt, api) {
    if (o.done || o.fail) return;
    o.t += dt; var P = api.P, g = level.goal, i;
    if (level.type === "survive" && o.t >= g.t) o.done = true;
    else if (level.type === "clear" && api.kills() - o.kills0 >= g.n) o.done = true;
    else if (level.type === "timed") {
      if (g.flee) for (i = 0; i < o.targets.length; i++) { var e = o.targets[i]; if (e.dead) continue; if (e.lastHp46 != null && e.hp < e.lastHp46) e.stun46 = 1.6; e.lastHp46 = e.hp; if (e.stun46 > 0) { e.stun46 -= dt; continue; } var dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy) || 1; if (d < 240) { e.x = Math.max(60, Math.min(api.worldW - 60, e.x + dx / d * 78 * dt)); e.y = Math.max(60, Math.min(api.worldH - 60, e.y + dy / d * 78 * dt)); } }
      if (o.targets.every(function (e) { return e.dead || e.hp <= 0; })) o.done = true;
      else if (o.t > g.limit) o.fail = "时间到";
    } else if (level.type === "mech") {
      for (i = 0; i < o.pads.length; i++) {
        var pd = o.pads[i]; if (pd.used) continue;
        if (Math.hypot(P.x - pd.x, P.y - pd.y) < 54) pd.c += dt; else pd.c = Math.max(0, pd.c - dt * 0.5);
        if (pd.c >= 1.2) {
          pd.used = true; var before = api.enemies().filter(function (e) { return !e.dead; }).length;
          api.aoe(pd.x, pd.y, 260, 99999); var after = api.enemies().filter(function (e) { return !e.dead; }).length;
          o.mechKills += Math.max(0, before - after); api.toast("符咒机关引爆！"); api.sound("boom");
        }
      }
      if (o.pads.every(function (q) { return q.used; })) o.done = true;
    } else if (level.type === "escort") {
      var n = o.npc, tg = n.path[n.k], near = Math.hypot(P.x - n.x, P.y - n.y) < 230;
      if (tg && near) { var ex = tg[0] - n.x, ey = tg[1] - n.y, dd = Math.hypot(ex, ey) || 1, v = Math.min(dd, 62 * dt); n.x += ex / dd * v; n.y += ey / dd * v; n.face = ex >= 0 ? 1 : -1; n.walk += dt; if (dd < 6) n.k++; }
      n.waiting = !near;
      var es = api.enemies();
      // 灯笼结界：贴近 NPC 的敌人被缓慢推开；接触伤害有上限，玩家清怪就能保住她。
      var dps = 0;
      for (i = 0; i < es.length; i++) { var en = es[i]; if (en.dead || en.obj46 || en.type === "boss") continue; var qx = en.x - n.x, qy = en.y - n.y, qd = Math.hypot(qx, qy) || 1;
        if (qd < 70) { en.x += qx / qd * 40 * dt; en.y += qy / qd * 40 * dt; }
        if (qd < en.r + 16) dps += 2.5; }
      if (dps > 0) { n.hp -= Math.min(7, dps) * dt; n.hurt = 0.25; }
      n.hurt = Math.max(0, n.hurt - dt); if (n.hurt > 0.24) n.hits = (n.hits || 0) + 1;
      if (n.hp <= 0) { n.hp = 0; o.fail = (level.npc === "rin" ? "雨宫凛" : level.npc === "guard" ? "保安" : "巫女") + "倒下了"; }
      else if (n.k >= n.path.length) o.done = true;
    } else if (level.type === "channel") {
      var z = o.zone, inside = Math.hypot(P.x - z.x, P.y - z.y) < z.r;
      if (inside) o.chan = Math.min(1, o.chan + dt / g.t);
      o.inside = inside; if (o.chan >= 1) o.done = true;
    }
  }
  function label(level, o) {
    if (!o) return ""; var g = level.goal;
    switch (level.type) {
      case "survive": return "存活 " + Math.max(0, Math.ceil(g.t - o.t)) + " 秒";
      case "clear": return "击破尸潮 " + Math.min(g.n, o.killsNow || 0) + "/" + g.n;
      case "timed": return (g.flee ? "摧毁无主飞剑 " : g.kind === "mirror" ? "击碎复制镜 " : g.kind === "elite" ? "击破精英镜卫 " : "拦下瓦版摊车 ") + o.targets.filter(function (e) { return e.dead || e.hp <= 0; }).length + "/" + g.n + " · 剩余 " + Math.max(0, Math.ceil(g.limit - o.t)) + "s";
      case "mech": return "引爆符咒机关 " + o.pads.filter(function (q) { return q.used; }).length + "/" + g.n + "（站在机关上）";
      case "escort": return "护送 " + Math.round(o.npc.k / o.npc.path.length * 100) + "% · 血量 " + Math.ceil(o.npc.hp) + "%" + (o.npc.waiting ? " · 靠近她才会前进" : "");
      case "channel": return "读取日志 " + Math.floor(o.chan * 100) + "%" + (o.inside ? "" : " · 回到圈内");
      case "boss": return "击破 Boss";
    }
    return "";
  }
  function rate(level, res) {
    return level.stars.map(function (s) {
      if (!res.win) return false;
      switch (s.k) {
        case "win": return true;
        case "hits": return (res.hits || 0) <= s.v;
        case "chests": return (res.chests || 0) >= s.v;
        case "time": return res.time <= s.v;
        case "npcHp": return (res.npcHp == null ? 100 : res.npcHp) >= s.v;
        case "mechKills": return (res.mechKills || 0) >= s.v;
        case "breaks": return (res.breaks || 0) >= s.v;
        case "noUlt": return !res.ult;
      }
      return false;
    });
  }
  function record(save, id, got) {
    var n = got.filter(Boolean).length; save.stars46 = save.stars46 || {};
    var prev = save.stars46[id] || 0; if (n > prev) save.stars46[id] = n; return { stars: n, best: Math.max(n, prev), improved: n > prev };
  }
  function draw(ctx, level, o, now, img) {
    if (!o) return; var i;
    if (level.type === "timed") for (i = 0; i < o.targets.length; i++) {
      var e = o.targets[i]; if (e.dead || e.hp <= 0) continue;
      ctx.save(); ctx.strokeStyle = level.goal.flee ? "#e9d4ff" : "#ffcf6a"; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.lineDashOffset = -now * 30;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 14, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = "rgba(20,10,30,.7)"; ctx.fillRect(e.x - 26, e.y - e.r - 26, 52, 6); ctx.fillStyle = "#ffcf6a"; ctx.fillRect(e.x - 26, e.y - e.r - 26, 52 * Math.max(0, e.hp / e.max), 6);
      ctx.restore();
    }
    if (level.type === "mech") for (i = 0; i < o.pads.length; i++) {
      var p = o.pads[i]; ctx.save(); ctx.translate(p.x, p.y);
      ctx.globalAlpha = p.used ? 0.25 : 0.9; ctx.strokeStyle = "#ff8ac8"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 54, 0, TAU); ctx.stroke();
      ctx.rotate(now * 0.8); ctx.strokeStyle = "#ffd6ef"; ctx.beginPath(); for (var k = 0; k < 5; k++) { var a = k * TAU * 2 / 5; ctx[k ? "lineTo" : "moveTo"](Math.cos(a) * 34, Math.sin(a) * 34); } ctx.closePath(); ctx.stroke();
      if (!p.used && p.c > 0) { ctx.rotate(-now * 0.8); ctx.strokeStyle = "#fff"; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 54, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, p.c / 1.2)); ctx.stroke(); }
      ctx.restore();
    }
    if (level.type === "channel") {
      var z = o.zone; ctx.save(); ctx.fillStyle = "rgba(120,200,255,.12)"; ctx.strokeStyle = "#8fd8ff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(z.x, z.y, z.r + 8, -Math.PI / 2, -Math.PI / 2 + TAU * o.chan); ctx.stroke(); ctx.restore();
    }
    if (level.type === "escort") {
      var n = o.npc; ctx.save();
      var last = n.path[n.path.length - 1]; ctx.strokeStyle = "rgba(255,210,140,.35)"; ctx.setLineDash([10, 10]); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(n.x, n.y);
      for (i = n.k; i < n.path.length; i++) ctx.lineTo(n.path[i][0], n.path[i][1]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255,200,120,.25)"; ctx.beginPath(); ctx.arc(last[0], last[1], 34 + Math.sin(now * 3) * 4, 0, TAU); ctx.fill();
      ctx.translate(n.x, n.y); var bob = Math.abs(Math.sin(n.walk * 9)) * 3;
      ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.beginPath(); ctx.ellipse(0, 4, 18, 6, 0, 0, TAU); ctx.fill();
      if (img) { ctx.save(); ctx.scale(n.face, 1); ctx.globalAlpha = n.hurt > 0 ? 0.75 : 1; ctx.drawImage(img, -30, -64 - bob, 60, 68); ctx.restore(); }
      else { ctx.fillStyle = "#ff6a7a"; ctx.beginPath(); ctx.arc(0, -24 - bob, 14, 0, TAU); ctx.fill(); }
      ctx.fillStyle = "rgba(20,10,30,.75)"; ctx.fillRect(-26, -78, 52, 6); ctx.fillStyle = n.hp > 50 ? "#7dffb0" : "#ff7a8a"; ctx.fillRect(-26, -78, 52 * n.hp / n.max, 6);
      ctx.restore();
    }
  }
  global.SakurayoLevels = Object.freeze({ LEVELS: LEVELS, CHAPTERS: CHAPTERS, TYPE: TYPE, find: find, chapter: chapter, stars: stars, unlocked: unlocked, cleared: cleared, chapterStars: chapterStars, create: create, tick: tick, label: label, rate: rate, record: record, draw: draw });
})(typeof window !== "undefined" ? window : globalThis);
