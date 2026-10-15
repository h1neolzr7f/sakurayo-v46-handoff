/* 晨修 E023–E028（2026-10-15）：局部视觉修复，全部按具体界面作用域，不加全局强制规则。
   - 设置页：.dhead::after 本应只罩标题栏，却因 .dhead 未定位而盖住整个抽屉左半 → 左栏发灰（E024）；三列等高网格，1024×461 不滚动。 */
(function (global) {
  "use strict";
  var d = global.document; if (!d) return;
  var TOK18 = function (n, a) { return global.SakurayoTok ? global.SakurayoTok(n, a) : "rgb(var(--c-" + n + "-rgb) / " + a + ")"; };
  var css = [
    "#settingsDrawer37 .dhead{position:relative}",
    "#settingsDrawer37 .dhead::before{content:none!important}",
    "#settingsDrawer37{overflow:hidden}",
    "#settingsDrawer37 #settingsBody37{display:grid!important;grid-template-columns:repeat(30,minmax(0,1fr))!important;grid-auto-rows:auto;gap:8px!important;align-content:space-evenly;min-height:calc(100vh - 120px);box-sizing:border-box;padding-top:10px;padding-bottom:10px}",
    "#settingsBody37>.settingRow37,#settingsBody37>.settingToggle37,#settingsBody37>.settingGroup39>.settingToggle37{height:clamp(48px,10.5vh,78px)!important;min-height:0!important;margin:0!important;order:1;box-sizing:border-box;grid-row:auto!important;align-self:stretch}",
    "#settingsBody37>.settingRow37{grid-column:span 10!important;padding:6px 14px!important;display:flex!important;flex-direction:column;justify-content:center;gap:4px;background:rgb(var(--c-n1-rgb) / 1)!important;border-color:rgb(var(--c-primary-rgb) / 0.2)!important}",
    "#settingsBody37>.settingRow37 span{margin:0!important;color:rgb(var(--c-n6-rgb) / 1)!important;font-weight:700;font-size:14px}",
    "#settingsBody37>.settingRow37 b{color:rgb(var(--c-n6-rgb) / 1)!important}",
    "#settingsBody37 .settingToggle37{grid-column:span 6!important;display:flex!important;align-items:center;justify-content:center;font-size:14px;font-weight:700;padding:0 6px!important;white-space:nowrap;color:rgb(var(--c-on-primary-rgb) / 1)!important;background:linear-gradient(90deg,rgb(var(--c-primary-rgb) / 1),rgb(var(--c-primary-strong-rgb) / 1))!important;opacity:1!important}",
    "#settingsBody37 .settingGroup39{display:contents!important}",
    "#settingsBody37>.routeNote{order:2;grid-column:1/-1!important;margin:0!important;padding:8px 14px!important;font-size:14px!important;line-height:1.35;color:rgb(var(--c-n6-rgb) / 1)!important;background:rgb(var(--c-n1-rgb) / 1)!important}",
    "#settingsBody37>#commandUtilities48{order:3;grid-column:1/-1!important;width:auto!important;max-width:none!important;display:flex!important;align-items:center;gap:14px;padding:8px 14px!important;margin:0!important;min-height:0!important;height:auto!important;background:rgb(var(--c-n1-rgb) / 1)!important}",
    "#settingsBody37>#commandUtilities48 small{font-size:11px!important;color:rgb(var(--c-n5-rgb) / 1)!important;white-space:nowrap}",
    "#settingsBody37>#commandUtilities48 h3{margin:0!important;font-size:16px!important;white-space:nowrap;color:rgb(var(--c-n6-rgb) / 1)!important}",
    "#settingsBody37>#commandUtilities48 .cmdActions47{margin:0 0 0 auto!important;flex-wrap:nowrap}",
    "#settingsBody37>#commandUtilities48 .cmdActions47 button{height:44px;min-height:44px;font-size:14px;padding:0 14px}"
  ].join("");

  /* E025 格斗按键：崩三式圆形发光技能键（图标 + 冷却/能量环 + 按下反馈 + 大小层级），摇杆同风格。只作用于 #duel46。 */
  var DUEL_CSS = [
    "html #duel46 .dact46{width:250px;height:190px}",
    "html #duel46 .dact46::before{content:'';position:absolute;right:-30px;bottom:-40px;width:260px;height:260px;border-radius:50%;border:1px solid rgb(var(--c-primary-rgb) / 0.16);box-shadow:inset 0 0 40px rgb(var(--c-primary-rgb) / 0.08);pointer-events:none}",
    "html #duel46 .dact46 .sykBtn{--ring:rgb(var(--c-primary-rgb) / 1);--core:rgb(var(--c-n1-rgb) / 1);border-radius:50%;clip-path:none!important;left:auto!important;top:auto!important;display:flex!important;flex-direction:column;align-items:center;justify-content:center;gap:1px;font:800 13px/1 var(--sy-font-title,sans-serif);color:rgb(var(--c-n6-rgb) / 1);transition:transform .08s ease-out,filter .08s}",
    "html #duel46 .dact46 .sykBtn::before{inset:0!important;border-radius:50%;clip-path:none!important;background:conic-gradient(var(--ring) calc(var(--cd,1) * 360deg),rgb(var(--c-n6-rgb) / 0.12) 0)!important;-webkit-mask:radial-gradient(circle,transparent calc(50% - 4px),rgb(var(--c-n0-rgb) / 1) calc(50% - 3px));mask:radial-gradient(circle,transparent calc(50% - 4px),rgb(var(--c-n0-rgb) / 1) calc(50% - 3px));filter:drop-shadow(0 0 6px var(--ring))}",
    "html #duel46 .dact46 .sykBtn::after{inset:4px!important;border-radius:50%;clip-path:none!important;background:radial-gradient(circle at 50% 35%,rgb(var(--c-n6-rgb) / 0.16),transparent 55%),radial-gradient(circle,var(--core) 58%,rgb(var(--c-n2-rgb) / 0.9))!important;box-shadow:inset 0 0 0 1px rgb(var(--c-n6-rgb) / 0.22),inset 0 -6px 14px rgb(var(--c-n0-rgb) / 0.45)}",
    "html #duel46 .dact46 .sykBtn svg{width:46%;height:46%;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 4px var(--ring))}",
    "html #duel46 .dact46 .sykBtn b18{font-size:11px;font-weight:800;letter-spacing:.06em}",
    "html #duel46 .dact46 .sykBtn small{display:none}",
    "html #duel46 .dact46 .sykBtn.pr18{transform:scale(.88);filter:brightness(1.45)}",
    "html #duel46 .dact46 .sykBtn.pr18::after{box-shadow:inset 0 0 0 2px var(--ring),0 0 18px var(--ring)}",
    "html #duel46 .dact46 .sykBtn.lock18{filter:saturate(.35) brightness(.8)}",
    "html #duel46 .dact46 .b-H{right:8px!important;bottom:8px!important;width:92px!important;height:92px!important;--ring:rgb(var(--c-accent-rgb) / 1);--core:rgb(var(--c-on-accent-rgb) / 1)}",
    "html #duel46 .dact46 .b-H svg{width:44%;height:44%}",
    "html #duel46 .dact46 .b-L{right:110px!important;bottom:6px!important;width:66px!important;height:66px!important}",
    "html #duel46 .dact46 .b-T{right:116px!important;bottom:82px!important;width:56px!important;height:56px!important;--ring:rgb(var(--c-primary-rgb) / 1)}",
    "html #duel46 .dact46 .b-BK{right:186px!important;bottom:4px!important;width:52px!important;height:52px!important;--ring:rgb(var(--c-n5-rgb) / 1);font-size:11px!important}",
    "html #duel46 .dact46 .b-SP{right:62px!important;bottom:112px!important;width:66px!important;height:66px!important;--ring:rgb(var(--c-warn-rgb) / 1);--core:rgb(var(--c-on-accent-rgb) / 1)}",
    "html #duel46 .dact46 .b-SU{right:0!important;bottom:118px!important;width:62px!important;height:62px!important;--ring:rgb(var(--c-rare-ssr-rgb) / 1);--core:rgb(var(--c-on-accent-rgb) / 1)}",
    "html #duel46 .dact46 .b-SU.full18::before{animation:syPulse18 1s ease-in-out infinite}",
    "@keyframes syPulse18{50%{filter:drop-shadow(0 0 12px var(--ring)) brightness(1.35)}}",
    "html #duel46 .dstk46::before,html #duel46 .dstk46::after{clip-path:none!important;border-radius:50%}",
    "html #duel46 .dstk46::before{background:repeating-conic-gradient(rgb(var(--c-primary-rgb) / 0.55) 0 2deg,transparent 2deg 15deg)!important;-webkit-mask:radial-gradient(circle,transparent calc(50% - 7px),rgb(var(--c-n0-rgb) / 1) calc(50% - 6px));mask:radial-gradient(circle,transparent calc(50% - 7px),rgb(var(--c-n0-rgb) / 1) calc(50% - 6px))}",
    "html #duel46 .dstk46::after{inset:8px!important;background:radial-gradient(circle,rgb(var(--c-primary-rgb) / 0.1),rgb(var(--c-on-primary-rgb) / 0.72) 70%)!important;box-shadow:inset 0 0 0 1px rgb(var(--c-primary-rgb) / 0.35),0 0 24px rgb(var(--c-primary-rgb) / 0.18)}",
    "html #duel46 .dstk46 i{clip-path:none!important;border-radius:50%;width:56px!important;height:56px!important;margin:-28px!important;background:radial-gradient(circle at 40% 35%,rgb(var(--c-n6-rgb) / 1),rgb(var(--c-primary-rgb) / 1) 45%,rgb(var(--c-n4-rgb) / 1))!important;box-shadow:0 0 16px rgb(var(--c-primary-rgb) / 0.7),inset 0 0 0 2px rgb(var(--c-n6-rgb) / 0.5)}",
    "@media (min-height:600px){html #duel46 .dact46{transform:scale(1.15);transform-origin:right bottom}html #duel46 .dstk46{transform:scale(1.1);transform-origin:left bottom}}","@media (max-height:440px){html #duel46 .dact46{transform:scale(.82)}}"
  ].join("");
  var ICON = {
    L: '<path d="M6 18 18 6M13 6h5v5"/>',
    H: '<path d="M5 19 16 8l3-3M14 5h5v5M8 13l3 3"/>',
    T: '<path d="M8 12V6a1.5 1.5 0 0 1 3 0v5M11 11V5a1.5 1.5 0 0 1 3 0v6M14 11V7a1.5 1.5 0 0 1 3 0v6c0 4-2 7-6 7s-6-3-6-6l-1-3a1.5 1.5 0 0 1 3-1l1 2"/>',
    BK: '<path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6z"/>',
    SP: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-9z"/>',
    SU: '<path d="m12 2 2.5 6.5L21 9l-5 4.5L17.5 21 12 17l-5.5 4L8 13.5 3 9l6.5-.5z"/>'
  };
  var LABEL = { L: "轻", H: "重", T: "投", BK: "防", SP: "必杀", SU: "超必" };
  function skinDuel(root) {
    if (!root || root.__sk18) return; root.__sk18 = 1;
    root.querySelectorAll(".dact46 .sykBtn[data-p]").forEach(function (b) {
      var k = b.getAttribute("data-p"); if (!ICON[k]) return;
      var keep = b.querySelector("small"); b.textContent = ""; b.insertAdjacentHTML("beforeend", '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICON[k] + "</svg><b18>" + LABEL[k] + "</b18>"); if (keep) b.appendChild(keep);
      b.setAttribute("aria-label", LABEL[k]);
      b.addEventListener("pointerdown", function () { b.classList.add("pr18"); clearTimeout(b.__pt); b.__pt = setTimeout(function () { b.classList.remove("pr18"); }, 160); });
    });
    var su = root.querySelector(".b-SU"), sp = root.querySelector(".b-SP"), hv = root.querySelector(".b-H");
    (function tick() { if (!root.isConnected) return; requestAnimationFrame(tick);
      var g = global.SakurayoDuel && global.SakurayoDuel.current && global.SakurayoDuel.current(), P = g && g.P; if (!P) return;
      var m = Math.max(0, Math.min(1, P.meter || 0)), busy = !!(P.mn && P.mv);
      if (su) { su.style.setProperty("--cd", m.toFixed(3)); su.classList.toggle("full18", m >= 1); su.classList.toggle("lock18", m < 1); }
      var tot = busy ? (P.mv.st || 0) + (P.mv.ac || 0) + (P.mv.rc || 0) : 0, rec = tot ? Math.min(1, (P.mf || 0) / tot) : 1;
      if (sp) sp.style.setProperty("--cd", (busy ? rec : 1).toFixed(3));
      if (hv) hv.style.setProperty("--cd", (busy ? rec : 1).toFixed(3));
    })();
  }

  /* E026/E027 大厅统一背景 + 透明看板娘 + 伪 3D：背景 / 粒子 / 角色 / UI 分层视差（陀螺仪 / 鼠标 / 自动漂移），
     面板轻微透视倾斜 + 背景景深；设置页「动态效果」开关（完整 / 减弱），系统「减少动态」默认减弱。 */
  var DEPTH_CSS = [
    ".heroVidA21 video{opacity:0!important}",
    ".heroVidGL21{position:absolute;pointer-events:none}",
    "body.depth18 #menu .bg,body.depth18 #syBg{translate:calc(var(--px18,0) * -16px) calc(var(--py18,0) * -10px);scale:1.04}",
    "body.depth18 #syDepth18{translate:calc(var(--px18,0) * -6px) calc(var(--py18,0) * -4px)}",
    "body.depth18 .depthHero18{translate:calc(var(--px18,0) * 8px) calc(var(--py18,0) * 4px)}",
    "",
    "#menu{overflow:clip!important} /* 装饰 SVG 溢出右边，hidden 仍会被 focus/scrollIntoView 横向滚走 120px，clip 不可滚 *//* 可点的面板不随视差移动（会让按钮“不稳定”、误触），只移动背景/装饰层 */",
    "body.depth18:has(.drawer:not(.hidden)) #menu .bg{filter:blur(3px) brightness(.8)}",
    "#syDepth18{position:absolute;inset:0;pointer-events:none;z-index:1}"
  ].join("");
  var MKEY = "syMotion18";
  function motionLow() { var v = null; try { v = global.localStorage.getItem(MKEY); } catch (e) {} if (v) return v === "low"; return !!(global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches); }
  var D = { tx: 0, ty: 0, x: 0, y: 0, gyro: false, mouseAt: 0, cv: null, parts: [], frames: 0 };
  function setupDepth() {
    var body = d.body; if (!body) return;
    var onMove = function (e) { D.mouseAt = performance.now(); D.tx = (e.clientX / global.innerWidth - 0.5) * 2; D.ty = (e.clientY / global.innerHeight - 0.5) * 2; };
    global.addEventListener("pointermove", onMove, { passive: true });
    global.addEventListener("deviceorientation", function (e) { if (e.gamma == null) return; D.gyro = true; D.mouseAt = performance.now();
      var land = global.innerWidth > global.innerHeight; var a = land ? e.beta : e.gamma, b = land ? e.gamma : e.beta;
      D.tx = Math.max(-1, Math.min(1, (a || 0) / 25)); D.ty = Math.max(-1, Math.min(1, ((b || 0) - (land ? 0 : 40)) / 25)); }, { passive: true });
    var last = 0;
    (function loop(now) { requestAnimationFrame(loop); var low = motionLow(); body.classList.toggle("depth18", !low); if (low) { if (D.cv) D.cv.style.display = "none"; return; }
      var menu = d.getElementById("menu"), vis = menu && !menu.classList.contains("hidden") && menu.offsetParent !== null; var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      var idle = now - D.mouseAt > 2500, ax = idle ? Math.sin(now / 3200) * 0.55 : D.tx, ay = idle ? Math.sin(now / 4100) * 0.35 : D.ty;
      D.x += (ax - D.x) * Math.min(1, dt * 4); D.y += (ay - D.y) * Math.min(1, dt * 4);
      body.style.setProperty("--px18", D.x.toFixed(3)); body.style.setProperty("--py18", D.y.toFixed(3));
      var hv = d.querySelector("#menu .heroVid46"); if (hv && hv.parentElement && !hv.parentElement.classList.contains("depthHero18")) hv.parentElement.classList.add("depthHero18");
      if (vis) drawParts(menu, dt, now); else if (D.cv) D.cv.style.display = "none"; })(performance.now());
  }
  function drawParts(menu, dt, now) {
    var cv = D.cv; if (!cv || !cv.isConnected) { cv = D.cv = d.createElement("canvas"); cv.id = "syDepth18"; var bg = menu.querySelector(".bg"); if (bg && bg.parentNode) bg.parentNode.insertBefore(cv, bg.nextSibling); else menu.insertBefore(cv, menu.firstChild); D.parts = []; }
    cv.style.display = ""; var W = global.innerWidth, H = global.innerHeight, dpr = Math.min(1.5, global.devicePixelRatio || 1);
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    var g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    var P = D.parts, i, p; while (P.length < 34) P.push({ x: Math.random() * W, y: Math.random() * H, z: 0.3 + Math.random() * 0.7, k: P.length % 3 ? 0 : 1, r: Math.random() * 6.28, s: 0.5 + Math.random() });
    for (i = 0; i < P.length; i++) { p = P[i];
      if (p.k) { p.x += (-14 - 20 * p.z) * dt; p.y += (18 + 26 * p.z) * dt; p.r += dt * p.s; } else { p.y -= 8 * p.z * dt; p.x += Math.sin(now / 1500 + i) * 4 * dt; }
      if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W * 1.2; } if (p.y < -20) p.y = H + 10; if (p.x < -20) p.x = W + 20;
      var ox = D.x * -10 * p.z, oy = D.y * -6 * p.z;
      if (p.k) { g.save(); g.translate(p.x + ox, p.y + oy); g.rotate(p.r); g.fillStyle = TOK18("accent", 0.35 + 0.4 * p.z); g.beginPath(); g.ellipse(0, 0, 5 * p.z + 2, 2.6 * p.z + 1, 0, 0, 6.283); g.fill(); g.restore(); }
      else { g.fillStyle = TOK18("primary-strong", 0.18 + 0.3 * p.z * (0.6 + 0.4 * Math.sin(now / 600 + i))); g.beginPath(); g.arc(p.x + ox, p.y + oy, 1.2 + p.z * 1.4, 0, 6.283); g.fill(); } }
    D.frames++;
  }
  function addMotionToggle() {
    var body = d.getElementById("settingsBody37"); if (!body || d.getElementById("motion18")) return;
    var b = d.createElement("button"); b.id = "motion18"; b.className = "settingToggle37"; var paint = function () { b.textContent = "动态效果：" + (motionLow() ? "减弱" : "完整"); }; paint();
    b.onclick = function () { try { global.localStorage.setItem(MKEY, motionLow() ? "full" : "low"); } catch (e) {} paint(); };
    var note = body.querySelector(".routeNote"); body.insertBefore(b, note && note.parentNode === body ? note : null);
  }

  /* E029 寻访页：UP 主视觉卡（与 UP 卡一致）+ 规则卡 + 视差碎镜；提示条移到顶部不压 Spark 条 */
  var GACHA_CSS = [
    "#gachaDrawer .wishHeroOff46{display:none!important}",
    "#gachaDrawer .noUpArt46 .wishHeroOff46{display:block!important}#gachaDrawer .noUpArt46 .wishUpCard46{display:none}",
    "#gachaDrawer .wishUpCard46{position:absolute;z-index:2;margin:0;left:max(160px,13vw);top:84px;bottom:150px;width:min(46vw,calc((100vh - 234px) * 1.4));clip-path:polygon(28px 0,100% 0,100% calc(100% - 28px),calc(100% - 28px) 100%,0 100%,0 28px);background:rgb(var(--c-n0-rgb) / .6);box-shadow:inset 0 0 0 1px rgb(var(--c-primary-rgb) / .5);translate:calc(var(--px18,0) * 10px) calc(var(--py18,0) * 6px)}",
    "#gachaDrawer .wishUpArt46{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 30%;scale:1.06;translate:calc(var(--px18,0) * -8px) calc(var(--py18,0) * -5px)}",
    "#gachaDrawer .wishUpCard46::after{content:'';position:absolute;inset:0;background:linear-gradient(0deg,rgb(var(--c-n0-rgb) / .92),rgb(var(--c-n0-rgb) / 0) 46%),repeating-linear-gradient(0deg,rgb(var(--c-n6-rgb) / .03) 0 1px,transparent 1px 3px);pointer-events:none}",
    "#gachaDrawer .wishUpCard46 figcaption{position:absolute;z-index:1;left:22px;right:22px;bottom:14px;display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;color:rgb(var(--c-n6-rgb) / 1)}",
    "#gachaDrawer .wishUpCard46 figcaption em{font:900 12px/1 var(--sy-font-title,sans-serif);font-style:normal;padding:3px 7px;background:rgb(var(--c-rare-ssr-rgb) / 1);color:rgb(var(--c-on-accent-rgb) / 1)}",
    "#gachaDrawer .wishUpCard46 figcaption b{font:900 22px/1.1 var(--sy-font-title,sans-serif)}",
    "#gachaDrawer .wishUpCard46 figcaption i{font:900 14px/1 var(--sy-font-title,sans-serif);font-style:normal;color:rgb(var(--c-rare-ssr-rgb) / 1)}",
    "#gachaDrawer .wishUpCard46 figcaption span{font-size:12px;padding:2px 8px;border:1px solid rgb(var(--c-primary-rgb) / .7);color:rgb(var(--c-primary-strong-rgb) / 1)}",
    "#gachaDrawer .wishUpCard46 figcaption p{flex-basis:100%;margin:0;font-size:14px;line-height:1.4;color:rgb(var(--c-n5-rgb) / 1)}",
    "#gachaDrawer .wishRule46{position:absolute;z-index:3;right:22px;top:222px;width:min(377px,32vw);padding:10px 14px;background:rgb(var(--c-n0-rgb) / .78);box-shadow:inset 0 0 0 1px rgb(var(--c-primary-rgb) / .35);clip-path:polygon(14px 0,100% 0,100% 100%,0 100%,0 14px);translate:calc(var(--px18,0) * 3px) 0}",
    "#gachaDrawer .wishRule46 h4{margin:0 0 6px;font:800 14px var(--sy-font-title,sans-serif);color:rgb(var(--c-primary-strong-rgb) / 1)}",
    "#gachaDrawer .wishRule46 ul{margin:0;padding:0;list-style:none;display:grid;gap:5px}",
    "#gachaDrawer .wishRule46 li{font-size:14px;line-height:1.35;color:rgb(var(--c-n6-rgb) / 1)}",
    "#gachaDrawer .wishRule46 li b{display:inline-block;min-width:34px;margin-right:6px;color:rgb(var(--c-accent-rgb) / 1)}",
    "#gachaDrawer .wishShards46{position:absolute;inset:0;z-index:1;pointer-events:none}",
    "#gachaDrawer .wishShards46 i{position:absolute;width:60px;height:90px;clip-path:polygon(30% 0,100% 20%,70% 100%,0 70%);background:linear-gradient(135deg,rgb(var(--c-primary-strong-rgb) / .35),rgb(var(--c-accent-rgb) / .08));box-shadow:inset 0 0 0 1px rgb(var(--c-n6-rgb) / .3);animation:syShard29 7s ease-in-out infinite}",
    "#gachaDrawer .wishShards46 i:nth-child(1){left:58%;top:22%;translate:calc(var(--px18,0) * 22px) calc(var(--py18,0) * 14px)}",
    "#gachaDrawer .wishShards46 i:nth-child(2){left:64%;top:58%;width:40px;height:62px;animation-delay:-2s;translate:calc(var(--px18,0) * 30px) calc(var(--py18,0) * 18px)}",
    "#gachaDrawer .wishShards46 i:nth-child(3){left:12%;top:70%;width:34px;height:50px;animation-delay:-4s;translate:calc(var(--px18,0) * 16px) 0}",
    "#gachaDrawer .wishShards46 i:nth-child(4){left:52%;top:8%;width:28px;height:40px;animation-delay:-1s;translate:calc(var(--px18,0) * 26px) 0}",
    "#gachaDrawer .wishShards46 i:nth-child(5){left:70%;top:36%;width:48px;height:70px;animation-delay:-5s;translate:calc(var(--px18,0) * 34px) calc(var(--py18,0) * 20px)}",
    "@keyframes syShard29{50%{transform:translateY(-12px) rotate(8deg)}}",
    "body:not(.depth18) #gachaDrawer .wishShards46 i{animation:none}",
    "body:has(#gachaDrawer:not(.hidden)) .syHint46{top:auto!important;bottom:62px!important;max-width:44vw;animation:syHintOut29 .5s ease 5s forwards;left:max(160px,13vw)!important;right:auto!important;transform:none!important}@keyframes syHintOut29{to{opacity:0;visibility:hidden}}",
    "@media (max-height:500px){body:has(#gachaDrawer:not(.hidden)) .syHint46{left:150px!important;max-width:none!important;white-space:nowrap;bottom:62px!important;font-size:13px!important}body:has(#gachaDrawer:not(.hidden)) .syHint46 i{display:none}#gachaDrawer .wishUpCard46{top:64px;bottom:112px;left:150px;width:min(42vw,calc((100vh - 160px) * 1.5))}#gachaDrawer .wishUpCard46 figcaption b{font-size:17px}#gachaDrawer .wishUpCard46 figcaption p{display:none}#gachaDrawer .wishRule46{display:none}}"
  ].join("");

  /* E031 割草/弹幕按键统一为格斗同款圆形发光技能键（图标 + 发光环 + 按压反馈） */
  var ORB_CSS = ":is(html body #hud .acts .act,html #shm46 .btns .sykBtn){--ring:rgb(var(--c-primary-rgb) / 1);--core:rgb(var(--c-n1-rgb) / 1);clip-path:none!important;border-radius:50%!important;border:0!important;overflow:visible!important;padding:0!important;display:flex!important;flex-direction:column;align-items:center;justify-content:flex-end!important;padding-bottom:9px!important;box-sizing:border-box!important;background:radial-gradient(circle at 50% 35%,rgb(var(--c-n6-rgb) / .16),transparent 55%),radial-gradient(circle,var(--core) 58%,rgb(var(--c-n2-rgb) / .9))!important;box-shadow:0 0 0 3px rgb(var(--c-n0-rgb) / .5),0 0 0 4px var(--ring),0 0 14px var(--ring),inset 0 0 0 1px rgb(var(--c-n6-rgb) / .22),inset 0 -6px 14px rgb(var(--c-n0-rgb) / .45)!important;color:rgb(var(--c-n6-rgb) / 1)!important;font:800 11px/1.05 var(--sy-font-title,sans-serif)!important;text-align:center;transition:transform .08s ease-out,filter .08s!important}:is(html body #hud .acts .act,html #shm46 .btns .sykBtn)::before{content:''!important;position:absolute!important;left:50%!important;top:42%!important;width:40%!important;height:40%!important;inset:auto!important;left:30%!important;top:16%!important;clip-path:none!important;background:currentColor!important;-webkit-mask:var(--ic) center/contain no-repeat;mask:var(--ic) center/contain no-repeat;filter:drop-shadow(0 0 4px var(--ring));transform:none!important;border:0!important}:is(html body #hud .acts .act,html #shm46 .btns .sykBtn)::after{display:none!important}:is(html body #hud .acts .act,html #shm46 .btns .sykBtn):active{transform:scale(.9);filter:brightness(1.4)}:is(html body #hud .acts .act,html #shm46 .btns .sykBtn)>span:not(.n){font-size:0!important}html body #hud .acts #atk46{--ic:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 19 16 8l3-3M14 5h5v5M8 13l3 3'/%3E%3C/svg%3E\");--ring:rgb(var(--c-accent-rgb) / 1);--core:rgb(var(--c-on-accent-rgb) / 1)}html body #hud .acts #skill{--ic:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 4c2 3 2 5 0 8-2-3-2-5 0-8zM4 12c3-2 5-2 8 0-3 2-5 2-8 0zM20 12c-3 2-5 2-8 0 3-2 5-2 8 0zM12 20c-2-3-2-5 0-8 2 3 2 5 0 8z'/%3E%3C/svg%3E\");--ring:rgb(var(--c-primary-strong-rgb) / 1);font-size:0!important}html body #hud .acts #dash{--ic:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 12h12M12 6l6 6-6 6'/%3E%3C/svg%3E\");--ring:rgb(var(--c-n5-rgb) / 1)}html body #hud .acts #ult46{--ic:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m12 2 2.5 6.5L21 9l-5 4.5L17.5 21 12 17l-5.5 4L8 13.5 3 9l6.5-.5z'/%3E%3C/svg%3E\");--ring:rgb(var(--c-rare-ssr-rgb) / 1)}html body #hud .acts #ult46 svg{position:absolute;inset:-4px;width:calc(100% + 8px)!important;height:calc(100% + 8px)!important;transform:rotate(-90deg)}html body #hud .acts #ult46 svg .bg{display:none}html body #hud .acts #ult46 svg .fg{stroke:var(--ring);stroke-width:2.5;fill:none}html body #hud .acts #ult46>span{font-size:11px!important;position:static!important;transform:none!important;margin:0!important}html #shm46 .btns .sykBtn small{display:none!important}html #shm46 .btns .fc{--ic:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18zM12 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6z'/%3E%3C/svg%3E\")}html #shm46 .btns .bm{--ic:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6z'/%3E%3C/svg%3E\");--ring:rgb(var(--c-accent-rgb) / 1);--core:rgb(var(--c-on-accent-rgb) / 1)}html #shm46 .btns .aw{--ic:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-9z'/%3E%3C/svg%3E\");--ring:rgb(var(--c-rare-ssr-rgb) / 1)}html #shm46 .btns .sykBtn{width:62px!important;height:62px!important}html #shm46 .btns .sykBtn small{font-size:9px!important;opacity:.75}html #shm46 .btns .sykBtn[hidden]{display:none!important}";
  function add() { if (d.getElementById("syPolish18")) return; var s = d.createElement("style"); s.id = "syPolish18"; s.textContent = css; (d.head || d.documentElement).appendChild(s);
    var s2 = d.createElement("style"); s2.id = "syPolish18duel"; s2.textContent = DUEL_CSS; (d.head || d.documentElement).appendChild(s2);
    new MutationObserver(function () { var r = d.getElementById("duel46"); if (r && !r.__sk18) skinDuel(r); }).observe(d.body || d.documentElement, { childList: true, subtree: false });
    var s3 = d.createElement("style"); s3.id = "syPolish18depth"; s3.textContent = DEPTH_CSS + GACHA_CSS + ORB_CSS; (d.head || d.documentElement).appendChild(s3);
    var sb = null; new MutationObserver(function () { var b = d.getElementById("settingsBody37"); if (b && b !== sb) { sb = b; new MutationObserver(addMotionToggle).observe(b, { childList: true }); } addMotionToggle(); }).observe(d.body, { childList: true });
    setupDepth(); }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", add); else add();
  global.SakurayoPolish18 = { css: function () { return css; }, motionLow: motionLow, depth: function () { return { x: D.x, y: D.y, frames: D.frames, on: d.body.classList.contains("depth18") }; } };
})(typeof window !== "undefined" ? window : globalThis);
