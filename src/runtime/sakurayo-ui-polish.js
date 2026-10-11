/* UI 打磨层（POLISH_LOG 第 1 轮）：设计令牌、按钮微动效 + 音效、樱花点击粒子、页面转场、数字滚动、
   稀有度奖励弹窗、菱形发光提示点 / 斜切标签、HUD 拐角线框（崩坏3式中式科技风）、加载与空状态小人动画、大厅昼夜时段。
   思路参考：Juice it or Lose it（GDC 2012）、sf-yuzifu/BA-style-homepage（MIT，点击特效与转场结构）、
   CialloKing/ba-click-fx（MIT，点击光环 + 碎片的分层思路）、easings.net 的 cubic-bezier 曲线。没有拷贝任何素材，图标全部由 gpt-image-2 重新生成。
   纯增强：所有效果都可以被 prefers-reduced-motion 或设置里的“减弱特效”关闭。 */
(function (global) {
  "use strict";
  if (typeof document === "undefined") return;
  var doc = document, reduce = function () { return (global.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) || doc.body.classList.contains("reduceFx"); };
  // 颜色令牌读取：Canvas 也只能用令牌色。tok("primary", .5) → "rgb(r g b / .5)"
  var tokCache = {}; function tok(n, a) { var v = tokCache[n]; if (!v) { v = tokCache[n] = (getComputedStyle(doc.documentElement).getPropertyValue("--c-" + n + "-rgb") || "").trim() || "128 128 128"; } return "rgb(" + v + " / " + (a == null ? 1 : a) + ")"; }
  global.SakurayoTok = tok; addEventListener("sakurayo-theme", function () { tokCache = {}; });
  var ART = function (p) { return (global.SakurayoArtBase || "art/") + p; };
  // ---------- 1. 设计令牌 ----------
  var css = `
:root{--sy-sp-1:4px;--sy-sp-2:8px;--sy-sp-3:12px;--sy-sp-4:16px;--sy-sp-5:24px;--sy-r-s:8px;--sy-r-m:14px;--sy-r-l:20px;
--sy-fs-xs:11px;--sy-fs-s:13px;--sy-fs-m:15px;--sy-fs-l:19px;--sy-fs-xl:26px;

--sy-ease-out:cubic-bezier(.22,1,.36,1);--sy-ease-back:cubic-bezier(.34,1.56,.64,1);--sy-t-fast:.12s;--sy-t-mid:.28s;
--sy-font-title:"SyTitleEn","SyTitleSC","Noto Sans SC",sans-serif;--sy-cut:polygon(12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%,0 12px)}
/* 2. 按钮微动效：悬停上浮 + 光泽扫过，按下回弹压缩 */
button:not(.sy-nofx){transition:scale var(--sy-t-fast) var(--sy-ease-out),translate var(--sy-t-fast) var(--sy-ease-out),filter var(--sy-t-fast),box-shadow var(--sy-t-mid)}
@media (hover:hover){button:not(.sy-nofx):not(:disabled):hover{translate:0 -2px;filter:brightness(1.08)}}
button:not(.sy-nofx):not(:disabled):active,button.sy-press{translate:0 1px;scale:.95;filter:brightness(.95)}
button.sy-pop{animation:syPop .32s var(--sy-ease-back)}@keyframes syPop{0%{scale:.92}60%{scale:1.05}100%{scale:1}} /* 用独立的 scale/translate 属性，不覆盖元素自身用 transform 做的定位（地图节点等） */
.go,.levelMapBtn46{position:relative;overflow:hidden}
.go::after,.levelMapBtn46::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgb(var(--c-n6-rgb) / .35) 48%,transparent 66%);transform:translateX(-120%);pointer-events:none}
@media (hover:hover){.go:hover::after,.levelMapBtn46:hover::after{transform:translateX(120%);transition:transform .6s var(--sy-ease-out)}}
/* 3. 樱花点击粒子层 */
#syFx{position:fixed;inset:0;pointer-events:none;z-index:9998}
/* 4. 页面转场：樱色斜切幕 */
#syWipe{position:fixed;inset:-10% -20%;z-index:9997;pointer-events:none;background:repeating-linear-gradient(0deg,rgb(var(--c-n6-rgb) / .08) 0 1px,transparent 1px 4px),linear-gradient(105deg,transparent 0 30%,var(--c-n0) 30% 47%,var(--c-primary) 47% 48.5%,var(--c-n6) 48.5% 49.5%,var(--c-accent) 49.5% 50.5%,var(--c-n0) 50.5% 70%,transparent 70%);transform:translateX(-130%) skewX(-18deg);opacity:0;mix-blend-mode:normal}
#syWipe.go{animation:syWipe .46s var(--sy-ease-out)}@keyframes syWipe{0%{transform:translateX(-120%) skewX(-18deg);opacity:1;filter:brightness(1)}40%{transform:translateX(0) skewX(-18deg);opacity:1;filter:brightness(1.8)}48%{filter:brightness(1) hue-rotate(40deg)}100%{transform:translateX(120%) skewX(-18deg);opacity:1}}
.drawer:not(.hidden),#run46:not(.hidden),#night46:not(.hidden),#pachi46 .pf{animation:syIn .34s var(--sy-ease-out)}@keyframes syIn{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:none}}
/* 7/8. 灯笼红点、樱花 / 狐狸角标 */
.sy-dot{position:absolute;top:2px;right:4px;width:10px;height:10px;background:var(--sy-c-pink);transform:rotate(45deg);box-shadow:0 0 0 1px var(--c-n6),0 0 10px var(--sy-c-pink);animation:syBlink 1.4s ease-in-out infinite;pointer-events:none;z-index:3}
@keyframes syBlink{0%,100%{opacity:1}50%{opacity:.45}}
.sy-tag{position:absolute;top:6px;left:-4px;padding:1px 12px 1px 8px;font:italic 700 11px var(--sy-font-title);letter-spacing:.08em;color:var(--c-on-primary);background:var(--sy-c-cyan);clip-path:polygon(0 0,100% 0,calc(100% - 8px) 100%,0 100%);box-shadow:0 0 12px rgb(var(--c-primary-rgb) / .6);pointer-events:none;z-index:3}.sy-tag.hot{background:var(--sy-c-pink);color:var(--c-n6)}.sy-tag.gold{background:var(--sy-c-gold)}
/* 9. 面板折角 + 纹样 + 美术字标题 */
.drawer .dhead,.drawer header,#run46 .rs46,#pachi46 .pf,.rm46,.modal46{position:relative}
.drawer::before,#pachi46 .pf::before,#run46 .rs46::before{content:"";position:absolute;inset:6px;pointer-events:none;z-index:4;background:linear-gradient(var(--sy-c-cyan),var(--sy-c-cyan)) 0 0/18px 2px,linear-gradient(var(--sy-c-cyan),var(--sy-c-cyan)) 0 0/2px 18px,linear-gradient(var(--sy-c-cyan),var(--sy-c-cyan)) 100% 100%/18px 2px,linear-gradient(var(--sy-c-cyan),var(--sy-c-cyan)) 100% 100%/2px 18px;background-repeat:no-repeat;filter:drop-shadow(0 0 4px var(--sy-c-cyan))}
.drawer h2,.drawer h3,#run46 h3,#pachi46 header b,.rm46 h3{font-family:var(--sy-font-title);font-style:italic;font-weight:800;letter-spacing:.04em;color:var(--c-n6);text-shadow:0 0 12px rgb(var(--c-primary-rgb) / .55)}
/* 10. 加载 / 空状态小人 */
.sy-chibi{display:flex;flex-direction:column;align-items:center;gap:6px;color:var(--sy-c-sub);font-size:var(--sy-fs-s);padding:var(--sy-sp-4)}
.sy-chibi i{width:72px;height:96px;background:center bottom/contain no-repeat;animation:syBob 1.2s ease-in-out infinite}
.sy-chibi b{font-weight:600;color:var(--sy-c-ink);background:var(--sy-c-panel);border:1px solid var(--sy-c-line);clip-path:polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px);padding:4px 12px;position:relative}
.sy-chibi b::before{content:"";position:absolute;top:-6px;left:50%;border:6px solid transparent;border-bottom-color:var(--sy-c-line);border-top:0;transform:translateX(-50%)}
@keyframes syBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
#bootArt35 .sy-chibi{position:absolute;right:4%;bottom:6%;z-index:5}
/* 6. 奖励弹窗 */
#syReward{position:fixed;inset:0;z-index:9996;display:grid;place-items:center;background:rgb(var(--c-n0-rgb) / .55);opacity:0;pointer-events:none;transition:opacity .2s}
#syReward.on{opacity:1;pointer-events:auto}
#syReward .card{position:relative;min-width:240px;padding:22px 28px 18px;clip-path:var(--sy-cut);background:var(--sy-c-panel);border:1px solid var(--sy-c-line);text-align:center;color:var(--sy-c-ink);transform:scale(.6);transition:transform .4s var(--sy-ease-back)}
#syReward.on .card{transform:scale(1)}
#syReward .rays{position:absolute;left:50%;top:50%;width:420px;height:420px;margin:-210px 0 0 -210px;border-radius:50%;background:repeating-conic-gradient(var(--ray) 0 6deg,transparent 6deg 18deg);mask:radial-gradient(circle,var(--c-n0) 20%,transparent 70%);-webkit-mask:radial-gradient(circle,var(--c-n0) 20%,transparent 70%);animation:sySpin 6s linear infinite;z-index:-1;opacity:.7}
@keyframes sySpin{to{transform:rotate(360deg)}}
#syReward .ic{font-size:44px;filter:drop-shadow(0 0 12px var(--ray))}#syReward h4{margin:6px 0 2px;font-family:var(--sy-font-title);font-size:var(--sy-fs-l)}#syReward small{color:var(--sy-c-sub)}
#syReward .r-N{--ray:rgb(var(--c-rare-n-rgb) / .5)}#syReward .r-R{--ray:rgb(var(--c-primary-rgb) / .75)}#syReward .r-SR{--ray:rgb(var(--c-rare-sr-rgb) / .85)}#syReward .r-SSR{--ray:rgb(var(--c-rare-ssr-rgb) / .95)}
#syReward .r-SSR .card,#syReward .card.r-SSR{box-shadow:0 0 40px rgb(var(--c-rare-ssr-rgb) / .6),inset 0 0 0 2px rgb(var(--c-rare-ssr-rgb) / .7)}
/* 11. 大厅昼夜：叠加色层 */
#menu .bg::after{content:"";position:absolute;inset:0;pointer-events:none;background:var(--sy-tod,transparent);mix-blend-mode:soft-light;transition:background 2s}
#menu[data-tod="dawn"]{--sy-tod:linear-gradient(180deg,rgb(var(--c-accent-rgb) / .45),rgb(var(--c-primary-rgb) / .15))}
#menu[data-tod="day"]{--sy-tod:linear-gradient(180deg,rgb(var(--c-n6-rgb) / .35),rgb(var(--c-rare-ssr-rgb) / .1))}
#menu[data-tod="dusk"]{--sy-tod:linear-gradient(180deg,rgb(var(--c-accent-rgb) / .5),rgb(var(--c-rare-sr-rgb) / .3))}
#menu[data-tod="night"]{--sy-tod:linear-gradient(180deg,rgb(var(--c-primary-rgb) / .45),rgb(var(--c-n0-rgb) / .35))}
#syTod{position:absolute;top:calc(env(safe-area-inset-top) + 96px);left:40px;z-index:6;font:italic 700 11px var(--sy-font-title);letter-spacing:.1em;color:var(--sy-c-cyan);background:rgb(var(--c-n0-rgb) / .6);border-left:2px solid var(--sy-c-cyan);padding:2px 10px;pointer-events:none}
.sy-roll{display:inline-block;font-variant-numeric:tabular-nums}.sy-roll.up{color:var(--c-rare-ssr);text-shadow:0 0 8px var(--c-rare-ssr)}.sy-roll.down{color:var(--c-accent)}
@media (prefers-reduced-motion:reduce){#syWipe,.sy-chibi i,.sy-dot{animation:none!important}}
`;
  var st = doc.createElement("style"); st.id = "syPolish"; st.textContent = css; doc.head.appendChild(st);
  // ---------- 音效：WebAudio 小合成（按下 = 短木鱼音，打开面板 = 铃音），无素材依赖 ----------
  var ac = null; function blip(kind) { try { if (global.__SAKURAYO_MUTE_UI || (global.SakurayoSettings && global.SakurayoSettings.sfx === 0)) return; ac = ac || new (global.AudioContext || global.webkitAudioContext)(); var t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(); o.connect(g); g.connect(ac.destination);
      if (kind === "open") { o.type = "sine"; o.frequency.setValueAtTime(880, t); o.frequency.exponentialRampToValueAtTime(1320, t + 0.12); g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35); o.start(t); o.stop(t + 0.36); }
      else if (kind === "reward") { [660, 880, 1320].forEach(function (f, i) { var o2 = ac.createOscillator(), g2 = ac.createGain(); o2.type = "triangle"; o2.frequency.value = f; o2.connect(g2); g2.connect(ac.destination); g2.gain.setValueAtTime(0.05, t + i * 0.08); g2.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.3); o2.start(t + i * 0.08); o2.stop(t + i * 0.08 + 0.32); }); return; }
      else if (kind === "hover") { o.type = "sine"; o.frequency.setValueAtTime(1500, t); g.gain.setValueAtTime(0.015, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.05); o.start(t); o.stop(t + 0.06); }
      else { o.type = "triangle"; o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(300, t + 0.06); g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.09); o.start(t); o.stop(t + 0.1); } } catch (e) { } }
  // ---------- 3. 樱花粒子（点击爆开 + 指针拖尾） ----------
  var fx = doc.createElement("canvas"); fx.id = "syFx"; var g = fx.getContext("2d"), P = [], dpr = Math.min(2, global.devicePixelRatio || 1), raf = 0, lastTrail = 0;
  function size() { fx.width = innerWidth * dpr; fx.height = innerHeight * dpr; }
  function petal(x, y, burst) { if (burst && Math.random() < 0.7) return shard(x, y); var a = Math.random() * 6.283, sp = burst ? 80 + Math.random() * 160 : 20 + Math.random() * 30; P.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (burst ? 40 : 0), r: (burst ? 5 : 3.5) + Math.random() * 3, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 8, life: burst ? 0.9 : 0.6, t: 0, ring: 0 }); }
  function shard(x, y) { var a = Math.random() * 6.283, sp = 120 + Math.random() * 220; P.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 3 + Math.random() * 4, rot: a, vr: (Math.random() - 0.5) * 10, life: 0.45, t: 0, shard: 1, c: Math.random() < 0.75 ? "primary" : "accent" }); }
  function ring(x, y) { P.push({ x: x, y: y, ring: 1, t: 0, life: 0.38 }); }
  function drawPetal(p) { if (p.shard) { var al = 1 - p.t / p.life, z = p.r * dpr; g.save(); g.translate(p.x * dpr, p.y * dpr); g.rotate(p.rot); g.shadowColor = tok(p.c, 1); g.shadowBlur = 8 * dpr; g.fillStyle = tok(p.c, al); g.beginPath(); g.moveTo(-z * 1.6, 0); g.lineTo(0, -z * 0.5); g.lineTo(z * 1.6, 0); g.lineTo(0, z * 0.5); g.closePath(); g.fill(); g.restore(); return; } g.save(); g.translate(p.x * dpr, p.y * dpr); g.rotate(p.rot); var s = p.r * dpr; g.fillStyle = tok("accent", 1 - p.t / p.life); g.beginPath(); g.moveTo(0, -s); g.bezierCurveTo(s * 0.9, -s * 0.9, s * 0.8, s * 0.5, 0, s); g.bezierCurveTo(-s * 0.8, s * 0.5, -s * 0.9, -s * 0.9, 0, -s); g.fill(); g.fillStyle = tok("n6", 0.5 * (1 - p.t / p.life)); g.beginPath(); g.arc(0, -s * 0.3, s * 0.22, 0, 6.283); g.fill(); g.restore(); }
  var lastT = 0; function loop(now) { var dt = Math.min(0.05, (now - (lastT || now)) / 1000); lastT = now; g.clearRect(0, 0, fx.width, fx.height);
    P = P.filter(function (p) { p.t += dt; if (p.t >= p.life) return false; if (p.ring) { var k = p.t / p.life, R = (8 + k * 34) * dpr; g.save(); g.translate(p.x * dpr, p.y * dpr); g.rotate(0.785); g.strokeStyle = tok("primary", 1 - k); g.shadowColor = tok("primary"); g.shadowBlur = 10 * dpr; g.lineWidth = 2.5 * dpr * (1 - k); g.strokeRect(-R / 1.6, -R / 1.6, R * 1.25, R * 1.25); g.restore(); return true; } p.vy += 160 * dt; p.vx *= 0.97; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; drawPetal(p); return true; });
    raf = P.length ? requestAnimationFrame(loop) : 0; if (!raf) lastT = 0; }
  function kick() { if (!raf) raf = requestAnimationFrame(loop); }
  function burst(x, y) { if (reduce()) return; ring(x, y); for (var i = 0; i < 7; i++) petal(x, y, true); kick(); }
  // ---------- 4. 转场 ----------
  var wipe = doc.createElement("div"); wipe.id = "syWipe"; function transition() { if (reduce()) return; wipe.classList.remove("go"); void wipe.offsetWidth; wipe.classList.add("go"); }
  // ---------- 6. 奖励弹窗 ----------
  var rw = doc.createElement("div"); rw.id = "syReward"; rw.innerHTML = '<div class="wrap"><div class="card"><div class="rays"></div><div class="ic"></div><h4></h4><small></small></div></div>'; var rwT = 0;
  function reward(o) { o = o || {}; var r = o.rarity || "R"; rw.className = "on"; rw.querySelector(".wrap").className = "wrap r-" + r; rw.querySelector(".card").className = "card r-" + r; rw.querySelector(".ic").textContent = o.icon || "🌸"; rw.querySelector("h4").textContent = o.title || "获得奖励"; rw.querySelector("small").textContent = (o.rarityLabel || r) + " · " + (o.desc || ""); blip("reward");
    var r0 = rw.getBoundingClientRect(); for (var i = 0; i < (r === "SSR" ? 24 : r === "SR" ? 14 : 8); i++) petal(r0.width / 2, r0.height / 2, true); kick();
    clearTimeout(rwT); rwT = setTimeout(function () { rw.className = ""; }, o.hold || 1800); }
  rw.addEventListener("click", function () { rw.className = ""; });
  // ---------- 5. 数字滚动 ----------
  var rolls = new WeakMap();
  function watchNumber(el) { if (!el || rolls.has(el)) return; var cur = parseInt((el.textContent || "").replace(/[^\d-]/g, ""), 10) || 0, written = null, tok = 0; rolls.set(el, 1); el.classList.add("sy-roll");
    // 注意：MutationObserver 回调是异步的，自己写入的中间值也会触发回调；用 written 记录自己最后写的文本，命中就忽略，避免滚动自激成指数级 rAF 链
    new MutationObserver(function () { var txt = el.textContent || ""; if (txt === written) return; var nv = parseInt(txt.replace(/[^\d-]/g, ""), 10); if (isNaN(nv) || nv === cur) return; var from = cur, to = nv, t0 = performance.now(), pre = txt.split(/[\d,]+/)[0] || "", post = txt.split(/[\d,]+/).slice(-1)[0] || "", my = ++tok; cur = nv;
      if (reduce()) return; el.classList.toggle("up", to > from); el.classList.toggle("down", to < from);
      (function step(now) { if (my !== tok) return; var k = Math.min(1, (now - t0) / 600), e = 1 - Math.pow(1 - k, 3), v = k >= 1 ? txt : pre + Math.round(from + (to - from) * e).toLocaleString("en-US") + post; written = v; el.textContent = v; if (k < 1) requestAnimationFrame(step); else el.classList.remove("up", "down"); })(t0); })
      .observe(el, { childList: true, characterData: true, subtree: true }); }
  // ---------- 10. 小人 ----------
  var LINES = ["今晚的百夜祭，也要一起去吗？", "樱花落下的速度是每秒五厘米哦。", "别担心，镜界的门不会跑掉的。", "再等一下下……正在擦亮镜子。", "狐狸面具……是不是有点可爱？", "嗯？这里好像还空空的呢。"];
  function chibi(line, who) { var d = doc.createElement("div"); d.className = "sy-chibi"; var i = doc.createElement("i"), b = doc.createElement("b"); d.appendChild(i); d.appendChild(b); b.textContent = line || LINES[Math.floor(Math.random() * LINES.length)];
    var c = who || "sayo", k = 0; i.style.backgroundImage = "url(" + ART("shmup/chibi_" + c + "_idle0.webp") + ")"; var iv = setInterval(function () { if (!d.isConnected) return clearInterval(iv); k = (k + 1) % 8; i.style.backgroundImage = "url(" + ART("shmup/chibi_" + c + "_idle" + k + ".webp") + ")"; }, 125); return d; }
  function decorateEmpty(root) { (root || doc).querySelectorAll(".dbody small, .shopList small, .dbody p.empty, .empty").forEach(function (s) { if (s.dataset.syChibi || !/暂无|没有|空/.test(s.textContent || "") || s.closest(".sy-chibi")) return; s.dataset.syChibi = 1; s.style.display = "none"; s.parentNode.insertBefore(chibi("这里还空空的……先去夜行转一圈吧？", ["sayo", "aya", "rion"][Math.floor(Math.random() * 3)]), s); }); }
  // ---------- 11. 昼夜时段 ----------
  function tod(h) { return h >= 5 && h < 8 ? "dawn" : h >= 8 && h < 17 ? "day" : h >= 17 && h < 19 ? "dusk" : "night"; }
  var TODN = { dawn: "SYS 05:00 · 晨间巡逻", day: "SYS 12:00 · 日间值守", dusk: "SYS 18:00 · 黄昏警戒", night: "SYS 00:00 · 夜间作战" };
  function applyTod(force) { var m = doc.getElementById("menu"); if (!m) return; var t = force || tod(new Date().getHours()); m.dataset.tod = t; var tag = doc.getElementById("syTod"); if (!tag) { tag = doc.createElement("div"); tag.id = "syTod"; m.appendChild(tag); } tag.textContent = TODN[t]; }
  // ---------- 7. 红点 → 灯笼 ----------
  function lanternDots(root) { (root || doc).querySelectorAll("[data-open]").forEach(function (b) { var dot = b.querySelector(".dot, .red, .badgeDot, .newDot, i.n"), want = !!dot || b.classList.contains("has-new") || b.dataset.new === "1"; var has = b.querySelector(".sy-dot"); if (dot) dot.style.opacity = "0"; if (want && !has) { var s = doc.createElement("span"); s.className = "sy-dot"; b.appendChild(s); } else if (!want && has) has.remove(); }); }
  // ---------- 初始化 ----------
  function init() {
    doc.body.appendChild(fx); doc.body.appendChild(wipe); doc.body.appendChild(rw); size(); addEventListener("resize", size);
    doc.addEventListener("pointerdown", function (e) { var b = e.target.closest && e.target.closest("button,[role=button],.rn46"); if (b) { blip("tap"); b.classList.remove("sy-pop"); void b.offsetWidth; b.classList.add("sy-pop"); } if (!e.target.closest("canvas#game, #duel46 canvas, #shmup46 canvas")) burst(e.clientX, e.clientY); }, true);
    doc.addEventListener("pointerover", function (e) { if (e.pointerType !== "mouse") return; var b = e.target.closest && e.target.closest(".homeNav46>button,#tacticalDeck48>button,#modeRow46>button"); if (b && b !== doc.__syHover) { doc.__syHover = b; blip("hover"); } }, true);
    doc.addEventListener("pointermove", function (e) { if (reduce() || e.pointerType !== "mouse") return; var n = performance.now(); if (n - lastTrail < 70) return; lastTrail = n; petal(e.clientX, e.clientY, false); kick(); }, { passive: true });
    doc.addEventListener("click", function (e) { if (e.target.closest("[data-open], #levelMapBtn46, #pachiBtn46, [data-k=node]")) { transition(); blip("open"); } }, true);
    ["coins", "shopCoins", "tcoins"].forEach(function (id) { watchNumber(doc.getElementById(id)); });
    var boot = doc.getElementById("bootArt35"); if (boot) boot.appendChild(chibi("再等一下下……正在擦亮镜子。", "sayo"));
    applyTod(); setInterval(applyTod, 60000);
    var pend = 0; new MutationObserver(function () { if (pend) return; pend = setTimeout(function () { pend = 0; decorateEmpty(); lanternDots(); }, 250); }).observe(doc.body, { childList: true, subtree: true }); /* 节流：战斗中 DOM 变化频繁 */ decorateEmpty(); lanternDots();
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", init); else init();
  global.SakurayoPolish = { reward: reward, burst: burst, transition: transition, watchNumber: watchNumber, chibi: chibi, applyTod: applyTod, blip: blip };
})(typeof window !== "undefined" ? window : globalThis);
