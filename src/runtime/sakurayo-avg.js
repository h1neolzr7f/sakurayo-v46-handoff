/* AVG story player (docs/STORY.md §7). Full-screen overlay: background / CG, left-right standing
   portraits (speaker lit, others dimmed 30%), name plate, typewriter text.
   Controls: tap / Space / Enter = next, 自动 (off → 1x → 2x → 3x), 快进 (only already-read lines,
   stops at the first unread one), 回看 (last 50 lines), 跳过 (confirm). Pure DOM, no game coupling:
   play(script, { cast, url, read, onRead, onCg, onDone }). */
(function (global) {
  "use strict";
  var CSS = "#avg46{position:fixed;inset:0;z-index:90;background:#07060c;color:#fff;font-family:inherit;overflow:hidden;user-select:none;-webkit-user-select:none}" +
    "#avg46.hidden{display:none}#avg46 .a46bg{position:absolute;inset:0;background:#000 center/cover no-repeat;transition:background-image .4s,opacity .4s;filter:saturate(1.05)}" +
    "#avg46 .a46bg:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.05) 50%,rgba(6,4,14,.7))}" +
    "#avg46 .a46cg{position:absolute;inset:0;background:#000 center/cover no-repeat;opacity:0;transition:opacity .5s;pointer-events:none}#avg46 .a46cg.on{opacity:1}" +
    "#avg46 .a46st{position:absolute;bottom:0;height:96%;max-width:46%;object-fit:contain;object-position:bottom;transition:filter .25s,transform .25s,opacity .25s;opacity:0;filter:brightness(.7) saturate(.85);transform:translateY(8px)}" +
    "#avg46 .a46st.L{left:4%}#avg46 .a46st.R{right:4%}#avg46 .a46st.on{opacity:1;transform:none}#avg46 .a46st.talk{filter:none;transform:scale(1.02)}" +
    "#avg46 .a46box{position:absolute;left:50%;transform:translateX(-50%);bottom:max(14px,env(safe-area-inset-bottom));width:min(880px,92vw);min-height:118px;padding:24px 28px 18px;border-radius:16px;" +
    "background:linear-gradient(180deg,rgba(26,18,40,.82),rgba(12,8,22,.92));border:1px solid rgba(255,190,225,.35);box-shadow:0 10px 40px rgba(0,0,0,.5);backdrop-filter:blur(6px)}" +
    "#avg46 .a46nm{position:absolute;top:-17px;left:22px;padding:5px 18px;border-radius:999px;font-weight:800;letter-spacing:.06em;background:linear-gradient(90deg,#ff7ab8,#b07cff);font-size:15px;box-shadow:0 4px 14px rgba(255,90,170,.35)}" +
    "#avg46 .a46nm:empty{display:none}#avg46 .a46tx{font-size:clamp(15px,2.3vw,19px);line-height:1.65;min-height:3.3em;text-shadow:0 1px 2px #000}#avg46 .a46tx.narr{color:#d9d2ff;font-style:italic}" +
    "#avg46 .a46box.epic{background:linear-gradient(180deg,#140d08f0,#0b0705f5);border:1px solid #c9a46a88;box-shadow:inset 0 0 0 4px #00000055,inset 0 0 0 5px #c9a46a33}#avg46 .a46box.epic .a46tx{font-family:SakurayoEpic,'Noto Serif CJK SC','Songti SC',serif;font-style:normal;color:#f3e3c3;letter-spacing:.12em;line-height:1.9;text-shadow:0 1px 0 #000}#avg46 .a46box.epic .a46nm{background:#5a1f17;color:#f6e2b8;font-family:SakurayoEpic,serif;letter-spacing:.2em}" +
    "#avg46 .a46tri{position:absolute;right:20px;bottom:12px;opacity:.8;animation:avgTri46 .9s infinite}@keyframes avgTri46{50%{transform:translateY(3px)}}" +
    "#avg46 .a46bar{position:absolute;top:max(10px,env(safe-area-inset-top));right:max(12px,env(safe-area-inset-right));display:flex;gap:8px;z-index:3}" +
    "#avg46 .a46bar button{min-width:64px;height:40px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.28);background:rgba(16,10,28,.7);color:#fff;font-weight:700;font-size:14px}" +
    "#avg46 .a46bar button:active{transform:scale(.95)}#avg46 .a46bar button.on{background:linear-gradient(90deg,#ff7ab8,#b07cff);border-color:transparent}" +
    "#avg46 .a46log{position:absolute;inset:0;z-index:5;background:rgba(6,4,14,.92);padding:64px max(24px,6vw) 24px;overflow:auto}#avg46 .a46log.hidden{display:none}" +
    "#avg46 .a46log p{margin:0 0 12px;line-height:1.6}#avg46 .a46log b{color:#ff9ccf;margin-right:10px}#avg46 .a46log .x{position:fixed;top:14px;right:18px}" +
    "#avg46 .a46confirm{position:absolute;inset:0;z-index:6;display:grid;place-items:center;background:rgba(0,0,0,.55)}#avg46 .a46confirm.hidden{display:none}" +
    "#avg46 .a46confirm div{background:#1b1328;border:1px solid rgba(255,190,225,.35);border-radius:16px;padding:22px 26px;text-align:center}#avg46 .a46confirm button{margin:14px 8px 0;min-width:96px;height:42px;border-radius:999px;border:0;font-weight:800}" +
    "#avg46 .a46chap{position:absolute;inset:0;display:grid;place-items:center;z-index:4;pointer-events:none;opacity:0;transition:opacity .6s}#avg46 .a46chap.on{opacity:1}" +
    "#avg46 .a46chap div{text-align:center;padding:18px 48px;background:linear-gradient(90deg,transparent,rgba(10,6,20,.85),transparent)}#avg46 .a46chap b{display:block;font-size:clamp(22px,4vw,34px);letter-spacing:.2em}#avg46 .a46chap small{opacity:.8;letter-spacing:.3em}";
  var root, els, cur = null;
  var SPEED = [0, 1, 2, 3], CPS = 42;
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function mount() {
    if (root) return;
    var st = el("style"); st.textContent = CSS; document.head.appendChild(st);
    root = el("section", "hidden"); root.id = "avg46"; root.setAttribute("role", "dialog"); root.setAttribute("aria-label", "剧情");
    els = { bg: el("div", "a46bg"), L: el("img", "a46st L"), R: el("img", "a46st R"), cg: el("div", "a46cg"), box: el("div", "a46box"), nm: el("div", "a46nm"), tx: el("div", "a46tx"), tri: el("div", "a46tri", "▼"),
      bar: el("div", "a46bar"), auto: el("button", "", "自动"), ff: el("button", "", "快进"), logB: el("button", "", "回看"), skip: el("button", "", "跳过"),
      log: el("div", "a46log hidden"), confirm: el("div", "a46confirm hidden", "<div><b>跳过本段剧情？</b><br><small>可以在关卡详情里点「剧情」重看</small><br><button data-k='no'>取消</button><button data-k='yes' style='background:linear-gradient(90deg,#ff7ab8,#b07cff);color:#fff'>跳过</button></div>"),
      chap: el("div", "a46chap", "<div><small></small><b></b></div>") };
    els.L.alt = ""; els.R.alt = "";
    els.box.append(els.nm, els.tx, els.tri); els.bar.append(els.auto, els.ff, els.logB, els.skip);
    root.append(els.bg, els.L, els.R, els.cg, els.box, els.chap, els.bar, els.log, els.confirm);
    document.body.appendChild(root);
    root.addEventListener("pointerup", function (e) { if (e.target.closest("button,.a46log,.a46confirm")) return; next(); });
    els.auto.onclick = function () { if (!cur) return; cur.auto = (cur.auto + 1) % SPEED.length; els.auto.textContent = cur.auto ? "自动 " + SPEED[cur.auto] + "x" : "自动"; els.auto.classList.toggle("on", !!cur.auto); schedule(); };
    els.ff.onclick = function () { if (!cur) return; if (!cur.ff && !cur.wasRead) { els.ff.textContent = "未读"; setTimeout(function () { els.ff.textContent = "快进"; }, 700); return; } cur.ff = !cur.ff; els.ff.classList.toggle("on", cur.ff); if (cur.ff && cur.typing && cur.wasRead) finishType(); else schedule(); };
    els.logB.onclick = function () { openLog(); };
    els.skip.onclick = function () { els.confirm.classList.remove("hidden"); };
    els.confirm.addEventListener("click", function (e) { var k = e.target.dataset && e.target.dataset.k; if (!k) return; els.confirm.classList.add("hidden"); if (k === "yes") end(true); });
    addEventListener("keydown", function (e) {
      if (!cur || root.classList.contains("hidden")) return;
      if (!els.log.classList.contains("hidden")) { if (e.key === "Escape") els.log.classList.add("hidden"); return; }
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); e.stopPropagation(); next(); }
      else if (e.key === "Control") { cur.ff = true; els.ff.classList.add("on"); schedule(); }
      else if (e.key === "l" || e.key === "L") openLog();
    }, true);
  }
  function openLog() {
    if (!cur) return; els.log.innerHTML = "<button class='x' style='min-width:64px;height:40px;border-radius:999px;border:1px solid #fff4;background:#1b1328;color:#fff'>关闭</button>" +
      cur.log.slice(-50).map(function (q) { return "<p>" + (q.n ? "<b>" + esc(q.n) + "</b>" : "") + esc(q.t) + "</p>"; }).join("");
    els.log.querySelector(".x").onclick = function () { els.log.classList.add("hidden"); };
    els.log.classList.remove("hidden"); els.log.scrollTop = 1e9;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function play(script, opts) {
    mount(); if (cur) end(false);
    cur = { s: script, i: -1, o: opts || {}, auto: 0, ff: false, log: [], typing: false, shown: 0, timer: 0, read: new Set(opts && opts.read || []) };
    els.auto.textContent = "自动"; els.auto.classList.remove("on"); els.ff.classList.remove("on");
    els.L.className = "a46st L"; els.R.className = "a46st R"; els.cg.className = "a46cg"; els.log.classList.add("hidden"); els.confirm.classList.add("hidden");
    root.classList.remove("hidden"); next();
  }
  function url(p) { return cur.o.url ? cur.o.url(p) : p; }
  function next() {
    if (!cur) return;
    if (cur.typing) { finishType(); return; }
    cur.i++;
    var ln = cur.s[cur.i];
    if (!ln) { end(false); return; }
    if (ln.bg) els.bg.style.backgroundImage = "url(\"" + url(ln.bg) + "\")";
    if (ln.cg !== undefined) { if (ln.cg) { els.cg.style.backgroundImage = "url(\"" + url(ln.cg) + "\")"; els.cg.classList.add("on"); cur.o.onCg && cur.o.onCg(ln.cg); } else els.cg.classList.remove("on"); }
    if (ln.chap) { els.chap.querySelector("small").textContent = ln.chap[0]; els.chap.querySelector("b").textContent = ln.chap[1]; els.chap.classList.add("on"); setTimeout(function () { els.chap.classList.remove("on"); }, 1800); }
    ["L", "R"].forEach(function (side) {
      var v = ln[side]; if (v === undefined) return; var im = els[side];
      if (!v) { im.classList.remove("on", "talk"); im.dataset.who = ""; return; }
      var c = cur.o.cast && cur.o.cast(v.who, v.ex || "calm"); if (!c) return;
      if (im.dataset.src !== c.img) { im.src = c.img; im.dataset.src = c.img; }
      im.dataset.who = v.who; im.classList.add("on");
    });
    var who = ln.who || "", nm = ln.name != null ? ln.name : (who && cur.o.cast ? (cur.o.cast(who, ln.ex || "calm") || {}).name : "") || "";
    if (who && ln.ex) { ["L", "R"].forEach(function (side) { if (els[side].dataset.who === who) { var c = cur.o.cast(who, ln.ex); if (c && els[side].dataset.src !== c.img) { els[side].src = c.img; els[side].dataset.src = c.img; } } }); }
    ["L", "R"].forEach(function (side) { els[side].classList.toggle("talk", !!who && els[side].dataset.who === who); });
    els.nm.textContent = nm; els.tx.classList.toggle("narr", !who && ln.style !== "epic"); els.box.classList.toggle("epic", ln.style === "epic");
    var text = ln.t || ""; cur.full = text; cur.shown = 0; cur.typing = true; cur.line = ln;
    cur.log.push({ n: nm, t: text }); if (cur.log.length > 50) cur.log.shift();
    var id = ln.id; cur.wasRead = id ? cur.read.has(id) : false;
    if (id && !cur.wasRead) { cur.read.add(id); cur.o.onRead && cur.o.onRead(id); }
    if (cur.ff && !cur.wasRead) { cur.ff = false; els.ff.classList.remove("on"); }
    type();
  }
  function type() {
    clearTimeout(cur.timer);
    if (cur.ff) { finishType(); return; }
    var step = function () {
      if (!cur || !cur.typing) return;
      cur.shown = Math.min(cur.full.length, cur.shown + 2); els.tx.textContent = cur.full.slice(0, cur.shown);
      if (cur.shown >= cur.full.length) finishType(); else cur.timer = setTimeout(step, 2000 / CPS);
    };
    els.tri.style.visibility = "hidden"; step();
  }
  function finishType() { if (!cur) return; clearTimeout(cur.timer); cur.typing = false; els.tx.textContent = cur.full; els.tri.style.visibility = "visible"; schedule(); }
  function schedule() {
    if (!cur || cur.typing) return; clearTimeout(cur.timer);
    if (cur.ff) { cur.timer = setTimeout(next, 70); return; }
    if (cur.auto) cur.timer = setTimeout(next, (900 + cur.full.length * 55) / SPEED[cur.auto]);
  }
  function end(skipped) {
    if (!cur) return; var c = cur; cur = null; clearTimeout(c.timer); root.classList.add("hidden");
    if (skipped) for (var i = c.i + 1; i < c.s.length; i++) { var ln = c.s[i]; if (ln.cg) c.o.onCg && c.o.onCg(ln.cg); if (ln.id && c.o.onRead) c.o.onRead(ln.id); }
    c.o.onDone && c.o.onDone({ skipped: !!skipped });
  }
  function state() { return cur ? { index: cur.i, total: cur.s.length, typing: cur.typing, auto: SPEED[cur.auto], ff: cur.ff, name: els.nm.textContent, text: cur.full, log: cur.log.length, cg: els.cg.classList.contains("on"), speaker: (["L", "R"].filter(function (s) { return els[s].classList.contains("talk"); })[0] || "") } : null; }
  global.SakurayoAvg = Object.freeze({ play: play, next: next, state: state, skip: function () { end(true); }, toggleAuto: function () { els && els.auto.click(); }, toggleFF: function () { els && els.ff.click(); }, openLog: openLog, active: function () { return !!cur; } });
})(typeof window !== "undefined" ? window : globalThis);
