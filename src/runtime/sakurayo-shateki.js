/* 缘日射的（百夜祭庙会摊位抽奖小游戏，替代旧樱花弹珠台）。
   每局 3 发软木弹：三层货架上的奖品横向移动，越值钱越小、越快、越重。准星有不可消除的手抖（σ≈9px），
   命中位置越靠上越容易打倒（倒地概率 = 奖品基础概率 × 命中高度），打中没倒给 5 币安慰奖。
   期望收益 < 每局花费（测试对“最优瞄准”策略断言），不能刷币。奖品只有樱花币、镜屑、加一发——不含战斗属性。
   纯模块：自带画布和循环；结算通过 onPrize 回调交给游戏侧。simulate(seed, policy) 用于测试和期望值核算。 */
(function (global) {
  "use strict";
  var W = 360, H = 600, COST = 80, SHOTS = 3, SHAKE = 9;
  var KINDS = {
    jack: { e: "🐱", n: "招财猫（🌸 200 · 镜屑 1）", coins: 200, kyo: 1, w: 26, h: 30, p: 0.16, col: "#ffcf4a", shelf: 0, sp: 70 },
    daruma: { e: "🎎", n: "达摩（🌸 80）", coins: 80, w: 34, h: 36, p: 0.42, col: "#e8414f", shelf: 1, sp: 45 },
    extra: { e: "🎯", n: "加一发", extra: 1, w: 30, h: 30, p: 0.45, col: "#38a36a", shelf: 1, sp: 45 },
    candy: { e: "🍎", n: "苹果糖（🌸 30）", coins: 30, w: 40, h: 40, p: 0.7, col: "#ff6f8a", shelf: 2, sp: 25 },
    fan: { e: "🪭", n: "团扇（🌸 20）", coins: 20, w: 46, h: 34, p: 0.85, col: "#6b8fd8", shelf: 2, sp: 25 }
  };
  var SHELF_Y = [190, 310, 430], CONSOLE = { n: "打中了没倒（🌸 5）", coins: 5, consolation: 1 };
  function rng(s) { s = (s >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  function gauss(r) { return Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(6.2832 * r()); }
  function Stall(seed) {
    this.r = rng(seed); this.t = 0; this.shots = SHOTS; this.fx = []; this.results = [];
    var L = [["jack", "jack"], ["daruma", "extra", "daruma"], ["candy", "fan", "candy", "fan"]], self = this; this.items = [];
    L.forEach(function (row, s) { row.forEach(function (k, i) { var K = KINDS[k]; self.items.push({ k: k, K: K, x: (i + 0.5) * W / row.length, dir: s % 2 ? -1 : 1, up: true, fall: 0 }); }); });
  }
  Stall.prototype.step = function (dt) {
    this.t += dt;
    this.items.forEach(function (it) { if (!it.up) { it.fall += dt; if (it.fall > 2.5) { it.up = true; it.fall = 0; } return; } it.x += it.dir * it.K.sp * dt; if (it.x > W + 30) it.x -= W + 60; if (it.x < -30) it.x += W + 60; });
    this.fx = this.fx.filter(function (f) { f.t -= dt; return f.t > 0; });
  };
  // 射击：x,y 是准星位置；实际弹着点叠加手抖。返回结果（奖品 / 安慰奖 / 落空）。
  Stall.prototype.shoot = function (x, y) {
    if (this.shots <= 0) return null; this.shots--;
    var bx = x + gauss(this.r) * SHAKE, by = y + gauss(this.r) * SHAKE, res = { miss: true, x: bx, y: by };
    for (var i = 0; i < this.items.length; i++) {
      var it = this.items[i], K = it.K, gy = SHELF_Y[K.shelf]; if (!it.up) continue;
      if (Math.abs(bx - it.x) <= K.w / 2 && by <= gy && by >= gy - K.h) {
        var f = (gy - by) / K.h; // 0 = 底部，1 = 顶部
        if (this.r() < K.p * (0.3 + 0.7 * f)) { it.up = false; it.fall = 0; res = { prize: K, k: it.k }; if (K.extra) this.shots++; }
        else res = { prize: CONSOLE, k: "con" };
        break;
      }
    }
    this.fx.push({ x: bx, y: by, t: 0.4, hit: !res.miss }); this.results.push(res); return res;
  };
  // 测试 / 核算：policy = "best"（每发都瞄准期望最高奖品的顶边、提前量完美）或 "random"
  function simulate(seed, policy) {
    var S = new Stall(seed), r = rng(seed * 7 + 1), coins = 0, kyo = 0, guard = 0;
    while (S.shots > 0 && guard++ < 20) {
      S.step(0.3 + r() * 0.5);
      var cand = S.items.filter(function (it) { return it.up && it.x > 20 && it.x < W - 20; }); if (!cand.length) continue;
      var tgt = policy === "random" ? cand[Math.floor(r() * cand.length)] : cand.sort(function (a, b) { return ev(b.K) - ev(a.K); })[0];
      var res = S.shoot(tgt.x, SHELF_Y[tgt.K.shelf] - tgt.K.h + 2);
      if (res && res.prize) { coins += res.prize.coins || 0; kyo += res.prize.kyo || 0; }
    }
    return { coins: coins, kyo: kyo, shots: S.results.length };
  }
  function ev(K) { return K.p * ((K.coins || 0) + (K.kyo ? 60 : 0) + (K.extra ? 25 : 0)); }
  var cur = null;
  function start(o) {
    stop(); o = o || {};
    var root = document.createElement("div"); root.id = "pachi46"; root.className = "shateki46";
    root.innerHTML = '<div class="pf"><header><b>缘日射的</b><small class="tk"></small><button class="x" aria-label="关闭">✕</button></header><canvas width="' + W + '" height="' + H + '"></canvas><footer><button class="go">开一局（3 发）</button><small class="msg">点货架上的奖品射击；打奖品上沿更容易打倒</small></footer></div>';
    document.body.appendChild(root);
    var cv = root.querySelector("canvas"), g = cv.getContext("2d"), S = null, aim = { x: W / 2, y: 300 }, last = performance.now(), raf = 0, st = { root: root, o: o, got: [] };
    function ticket() { return o.ticket ? o.ticket() : { free: 0, coins: 0 }; }
    function paintTk() { var t = ticket(); root.querySelector(".tk").textContent = (S && S.shots > 0 ? "剩 " + S.shots + " 发 · " : "") + (t.free > 0 ? "今日免费 " + t.free + " 局" : "每局 🌸 " + COST + "（持有 " + t.coins + "）"); }
    function begin() { if (S && S.shots > 0) return true; if (o.pay && !o.pay()) { root.querySelector(".msg").textContent = "樱花币不足"; return false; } S = new Stall(o.seed ? o.seed + st.got.length : (Date.now() >>> 0)); st.S = S; paintTk(); return true; }
    function fire(x, y) {
      if (!S || S.shots <= 0) return false; if (x != null) aim = { x: x, y: y == null ? aim.y : y };
      var res = S.shoot(aim.x, aim.y); if (!res) return false;
      if (res.prize) { st.got.push(res.prize); root.querySelector(".msg").textContent = (res.prize.consolation ? "" : "打倒了！") + res.prize.n; if (o.onPrize) o.onPrize(res.prize); }
      else root.querySelector(".msg").textContent = "没打中……";
      paintTk(); return true;
    }
    st.begin = begin; st.fire = fire;
    root.querySelector(".go").onclick = begin; root.querySelector(".x").onclick = function () { stop(); o.onClose && o.onClose(st.got); };
    cv.addEventListener("pointermove", function (e) { var r = cv.getBoundingClientRect(); aim = { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; });
    cv.addEventListener("pointerdown", function (e) { var r = cv.getBoundingClientRect(); aim = { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; if (!S || S.shots <= 0) begin(); else fire(); });
    function draw() {
      var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#2a0f1e"); gr.addColorStop(1, "#120712"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      // 摊位顶棚和灯笼
      for (var i = 0; i < 9; i++) { g.fillStyle = i % 2 ? "#f4efe6" : "#d8344a"; g.fillRect(i * 40, 0, 40, 46); }
      for (i = 0; i < 5; i++) { var lx = 36 + i * 72, ly = 70 + Math.sin(performance.now() / 600 + i) * 3; g.fillStyle = "#ff8a3d"; g.beginPath(); g.ellipse(lx, ly, 13, 17, 0, 0, 6.283); g.fill(); g.fillStyle = "#3a1208"; g.fillRect(lx - 7, ly - 19, 14, 4); g.fillRect(lx - 7, ly + 15, 14, 4); }
      SHELF_Y.forEach(function (y) { g.fillStyle = "#7a4a2a"; g.fillRect(0, y, W, 12); g.fillStyle = "#4a2a16"; g.fillRect(0, y + 12, W, 6); });
      if (S) S.items.forEach(function (it) {
        var K = it.K, gy = SHELF_Y[K.shelf]; g.save(); g.translate(it.x, gy);
        if (!it.up) { g.rotate(Math.min(1.5, it.fall * 6)); g.globalAlpha = Math.max(0, 1 - it.fall / 2.5); }
        g.fillStyle = K.col; g.beginPath(); g.roundRect ? g.roundRect(-K.w / 2, -K.h, K.w, K.h, 6) : g.rect(-K.w / 2, -K.h, K.w, K.h); g.fill();
        g.globalAlpha *= 0.9; g.font = Math.round(K.h * 0.8) + "px sans-serif"; g.textAlign = "center"; g.fillText(K.e, 0, -K.h * 0.18); g.globalAlpha = 1;
        g.fillStyle = "#fff"; g.font = "bold 9px sans-serif"; g.textAlign = "center"; g.fillText(K.coins ? K.coins : "+1", 0, -3); g.restore();
      });
      else { g.fillStyle = "#ffd7e6"; g.font = "bold 18px sans-serif"; g.textAlign = "center"; g.fillText("点「开一局」或点击画面", W / 2, 300); }
      if (S) S.fx.forEach(function (f) { g.strokeStyle = f.hit ? "#ffe066" : "#ffffff88"; g.lineWidth = 2; g.beginPath(); g.arc(f.x, f.y, 4 + (0.4 - f.t) * 30, 0, 6.283); g.stroke(); });
      var wob = Math.sin(performance.now() / 170) * 3; g.strokeStyle = "#ff4d6d"; g.lineWidth = 2; g.beginPath(); g.arc(aim.x + wob, aim.y, 12, 0, 6.283); g.moveTo(aim.x + wob - 18, aim.y); g.lineTo(aim.x + wob + 18, aim.y); g.moveTo(aim.x + wob, aim.y - 18); g.lineTo(aim.x + wob, aim.y + 18); g.stroke();
      // 软木枪
      g.fillStyle = "#5a3418"; g.save(); g.translate(W / 2, H - 20); g.rotate(Math.atan2(aim.y - (H - 20), aim.x - W / 2) + 1.5708); g.fillRect(-7, -70, 14, 80); g.fillStyle = "#c79a5a"; g.fillRect(-5, -78, 10, 10); g.restore();
    }
    function loop(now) { if (cur !== st) return; var dt = Math.min(0.05, (now - last) / 1000); last = now; if (S && !global.__pachiManual) S.step(dt); draw(); raf = requestAnimationFrame(loop); }
    st.step = function (dt) { if (S) S.step(dt); draw(); };
    st.aim = function (x, y) { aim = { x: x, y: y == null ? aim.y : y }; };
    st.stop = function () { cancelAnimationFrame(raf); root.remove(); };
    cur = st; paintTk(); raf = requestAnimationFrame(loop); return st;
  }
  function stop() { if (cur) { var c = cur; cur = null; c.stop(); } }
  global.SakurayoShateki = { W: W, H: H, KINDS: KINDS, SHELF_Y: SHELF_Y, COST: COST, SHOTS: SHOTS, Stall: Stall, simulate: simulate, start: start, stop: stop, current: function () { return cur; } };
})(typeof window !== "undefined" ? window : globalThis);
