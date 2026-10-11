/* 樱花弹珠台（活动抽奖小游戏）。弹珠不再是夜行地图上的战斗形态、也不再“发射角色”：
   玩家在顶部拖动发射口选择落点（或点「发射」用摆动发射口），樱花弹珠穿过钉阵与转风车，落入底部 7 个奖槽之一。
   每日免费 1 球，其余每球消耗樱花币；奖品只有货币 / 镜屑 / 再来一球——不提供任何战斗属性。
   纯模块：自带画布/循环/输入；奖品结算通过 onPrize 回调交给游戏侧。simulate(seed, x) 用于测试与期望值核算。 */
(function (global) {
  "use strict";
  var W = 360, H = 600, BR = 7;
  var PRIZES = [ // 7 个奖槽（左→右），中间最难进
    { id: "c20", n: "🌸 20", coins: 20, col: "#6b5a8a" }, { id: "c60", n: "🌸 60", coins: 60, col: "#4f7dbd" }, { id: "again", n: "再来一球", again: 1, col: "#38a36a" },
    { id: "jack", n: "🌸 300 · 镜屑 1", coins: 300, kyo: 1, col: "#ffcf4a" },
    { id: "again", n: "再来一球", again: 1, col: "#38a36a" }, { id: "c60", n: "🌸 60", coins: 60, col: "#4f7dbd" }, { id: "c20", n: "🌸 20", coins: 20, col: "#6b5a8a" }];
  var COST = 80;
  function rng(s) { s = (s >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  function pegs() { var out = []; for (var row = 0; row < 11; row++) { var n = row % 2 ? 8 : 9, off = row % 2 ? W / 9 / 2 : 0; for (var i = 0; i < n; i++) out.push({ x: 20 + off + i * (W - 40) / 8.0 * (8 / 9) + (row % 2 ? 0 : 0), y: 130 + row * 34, r: 4 }); } return out; }
  function Board(seed) { this.r = rng(seed); this.pegs = pegs(); this.mills = [{ x: W * 0.3, y: 260, a: 0 }, { x: W * 0.7, y: 330, a: 1 }]; this.balls = []; this.t = 0; this.results = []; }
  Board.prototype.drop = function (x) { this.balls.push({ x: Math.max(18, Math.min(W - 18, x)), y: 70, vx: (this.r() - 0.5) * 30, vy: 40, trail: [] }); };
  var EDGES = [0, 62, 114, 162, 198, 246, 298, 360]; // 奖槽不等宽：中央大奖槽最窄（36px）
  Board.prototype.slotAt = function (x) { for (var i = 0; i < 7; i++) if (x < EDGES[i + 1]) return i; return 6; };
  Board.prototype.step = function (dt) {
    this.t += dt; var self = this;
    this.mills.forEach(function (m) { m.a += dt * (m.a % 2 ? -2.2 : 2.6); });
    this.balls.forEach(function (b) {
      if (b.done) return; b.vy += 620 * dt; b.vx *= 0.999; b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < BR + 6) { b.x = BR + 6; b.vx = Math.abs(b.vx) * 0.6; } if (b.x > W - BR - 6) { b.x = W - BR - 6; b.vx = -Math.abs(b.vx) * 0.6; }
      self.pegs.forEach(function (p) { var dx = b.x - p.x, dy = b.y - p.y, d = Math.hypot(dx, dy), m = BR + p.r; if (d < m && d > 0) { var nx = dx / d, ny = dy / d, vn = b.vx * nx + b.vy * ny; if (vn < 0) { b.vx -= 1.4 * vn * nx; b.vy -= 1.4 * vn * ny; b.vx += (self.r() - 0.5) * 30; if (b.vy < -120) b.vy = -120; } b.x = p.x + nx * m; b.y = p.y + ny * m; p.hit = 0.25; } });
      self.mills.forEach(function (m) { var dx = b.x - m.x, dy = b.y - m.y, d = Math.hypot(dx, dy); if (d < 30 && d > 0) { var tx = -dy / d, ty = dx / d, sp = 160; b.vx += tx * sp * dt * 8 * (m.a % 2 ? -1 : 1) * 0.1; b.vy += ty * sp * dt * 0.4; } });
      if (Math.hypot(b.vx, b.vy) < 25) { b.stall = (b.stall || 0) + dt; if (b.stall > 0.3) { b.vx += (self.r() < 0.5 ? -1 : 1) * 60; b.stall = 0; } } else b.stall = 0; // 防卡在钉顶
      b.trail.push([b.x, b.y]); if (b.trail.length > 10) b.trail.shift();
      if (b.y > H - 40) { b.done = true; b.slot = self.slotAt(b.x); self.results.push(b.slot); }
    });
    this.balls = this.balls.filter(function (b) { return !b.done || self.t - 0 < 0; });
  };
  function simulate(seed, x) { var b = new Board(seed); b.drop(x == null ? W / 2 : x); for (var i = 0; i < 3600 && !b.results.length; i++) b.step(1 / 60); return { slot: b.results[0], prize: PRIZES[b.results[0]] }; }
  var cur = null;
  function start(o) {
    stop(); o = o || {};
    var root = document.createElement("div"); root.id = "pachi46"; root.innerHTML = '<div class="pf"><header><b>樱花弹珠台</b><small class="tk"></small><button class="x" aria-label="关闭">✕</button></header><canvas width="' + W + '" height="' + H + '"></canvas><footer><button class="go">发射</button><small class="msg">拖动顶部发射口选择落点</small></footer></div>';
    document.body.appendChild(root);
    var cv = root.querySelector("canvas"), g = cv.getContext("2d"), B = new Board(o.seed || (Date.now() >>> 0)), aimX = W / 2, swing = !o.auto, last = performance.now(), raf = 0, st = { B: B, root: root, o: o, got: [] };
    var img = {}; ["petal"].forEach(function () { });
    function ticket() { return o.ticket ? o.ticket() : { free: 0, coins: 0 }; }
    function paintTk() { var t = ticket(); root.querySelector(".tk").textContent = t.free > 0 ? "今日免费 " + t.free + " 球" : "每球 🌸 " + COST + "（持有 " + t.coins + "）"; }
    function fire() { if (B.balls.some(function (b) { return !b.done; })) return false; if (o.pay && !o.pay()) { root.querySelector(".msg").textContent = "樱花币不足"; return false; } B.drop(aimX); paintTk(); return true; }
    st.fire = fire;
    root.querySelector(".go").onclick = fire; root.querySelector(".x").onclick = function () { stop(); o.onClose && o.onClose(st.got); };
    cv.addEventListener("pointerdown", function (e) { var r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H; if (y < 110) { aimX = x; swing = false; } });
    cv.addEventListener("pointermove", function (e) { if (!e.buttons) return; var r = cv.getBoundingClientRect(); aimX = Math.max(18, Math.min(W - 18, (e.clientX - r.left) / r.width * W)); swing = false; });
    var seen = 0;
    function draw() {
      var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#22113a"); gr.addColorStop(1, "#0b0716"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.fillStyle = "#ffb3d9"; g.beginPath(); g.moveTo(aimX - 14, 46); g.lineTo(aimX + 14, 46); g.lineTo(aimX, 66); g.fill(); g.strokeStyle = "#ffb3d955"; g.setLineDash([3, 5]); g.beginPath(); g.moveTo(aimX, 66); g.lineTo(aimX, 120); g.stroke(); g.setLineDash([]);
      B.pegs.forEach(function (p) { g.fillStyle = p.hit > 0 ? "#fff" : "#ff9ec7"; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.283); g.fill(); p.hit = Math.max(0, (p.hit || 0) - 1 / 60); });
      B.mills.forEach(function (m) { g.save(); g.translate(m.x, m.y); g.rotate(m.a); g.fillStyle = "#ffd76a"; for (var k = 0; k < 5; k++) { g.rotate(1.2566); g.beginPath(); g.ellipse(0, -12, 5, 12, 0, 0, 6.283); g.fill(); } g.restore(); });
      PRIZES.forEach(function (p, i) { var x = EDGES[i], w = EDGES[i + 1] - x; g.fillStyle = p.col; g.globalAlpha = 0.85; g.fillRect(x + 2, H - 40, w - 4, 38); g.globalAlpha = 1; g.fillStyle = "#fff"; g.font = "bold 9px sans-serif"; g.textAlign = "center"; g.fillText(p.id === "jack" ? "大奖" : p.n.split(" · ")[0], x + w / 2, H - 16); });
      B.balls.forEach(function (b) { b.trail.forEach(function (q, k) { g.globalAlpha = k / b.trail.length * 0.4; g.fillStyle = "#ffc4e6"; g.beginPath(); g.arc(q[0], q[1], BR * 0.8, 0, 6.283); g.fill(); }); g.globalAlpha = 1; var rg = g.createRadialGradient(b.x - 2, b.y - 2, 1, b.x, b.y, BR); rg.addColorStop(0, "#fff"); rg.addColorStop(1, "#ff6fb5"); g.fillStyle = rg; g.beginPath(); g.arc(b.x, b.y, BR, 0, 6.283); g.fill(); });
    }
    function loop(now) {
      if (cur !== st) return; var dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (swing) aimX = W / 2 + Math.sin(now / 700) * (W / 2 - 30);
      if (!global.__pachiManual) B.step(dt); draw();
      while (seen < B.results.length) { var p = PRIZES[B.results[seen++]]; st.got.push(p); root.querySelector(".msg").textContent = "落入：" + p.n; if (o.onPrize) o.onPrize(p); paintTk(); }
      raf = requestAnimationFrame(loop);
    }
    st.step = function (dt) { B.step(dt); draw(); while (seen < B.results.length) { var p = PRIZES[B.results[seen++]]; st.got.push(p); if (o.onPrize) o.onPrize(p); paintTk(); } };
    st.aim = function (x) { aimX = x; swing = false; };
    st.stop = function () { cancelAnimationFrame(raf); root.remove(); };
    cur = st; paintTk(); raf = requestAnimationFrame(loop); return st;
  }
  function stop() { if (cur) { var c = cur; cur = null; c.stop(); } }
  global.SakurayoPachinko = { W: W, H: H, PRIZES: PRIZES, COST: COST, Board: Board, simulate: simulate, start: start, stop: stop, current: function () { return cur; } };
})(typeof window !== "undefined" ? window : globalThis);
