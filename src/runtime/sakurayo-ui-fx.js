/* UI 特色演出层（POLISH_LOG 第 3 轮）：樱花纹科技化符号（SKR 樱印）、大厅动态背景、3D 视差与镜头推拉、
   出击键多层反馈、加载演出、结算演出、角色出场展示。
   性能：只用 Canvas2D + CSS（不依赖 WebGL，安卓 WebView 全兼容）；DPR ≤ 1.5、30fps 上限、页面不可见或大厅隐藏时暂停；
   低端机（≤4 核或 ≤3GB）粒子减半，减弱特效或 prefers-reduced-motion 时只画一帧静态。 */
(function (global) {
  "use strict";
  if (typeof document === "undefined") return;
  var doc = document, low = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 3;
  function reduce() { return (global.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) || doc.body.classList.contains("reduceFx"); }
  // ---------- 1. SKR 樱印：五瓣樱花的科技化表达（切角花瓣线框 + 六边形核心 + 刻度环） ----------
  function sigil(size, cls) {
    var p = "", i; for (i = 0; i < 5; i++) { var a = i * 72; p += '<g transform="rotate(' + a + ' 50 50)"><path d="M50 46 L43 30 L45 16 L50 20 L55 16 L57 30 Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="bevel"/><path d="M50 40 L50 24" stroke="currentColor" stroke-width=".8" opacity=".6"/></g>'; }
    var ticks = ""; for (i = 0; i < 60; i++) ticks += '<line x1="50" y1="2" x2="50" y2="' + (i % 5 ? 4.5 : 7) + '" transform="rotate(' + i * 6 + ' 50 50)" stroke="currentColor" stroke-width="' + (i % 5 ? .5 : 1) + '"/>';
    return '<svg class="sy-sigil ' + (cls || "") + '" viewBox="0 0 100 100" width="' + size + '" height="' + size + '" aria-hidden="true"><g class="ring">' + ticks + '<circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width=".6" stroke-dasharray="3 2"/></g><g class="petals">' + p + '</g><polygon points="50,44 55.2,47 55.2,53 50,56 44.8,53 44.8,47" fill="currentColor"/></svg>';
  }
  var css = `
.sy-sigil{color:var(--sy-c-cyan,var(--c-primary));filter:drop-shadow(0 0 6px rgb(var(--c-primary-rgb) / .7))}.sy-sigil .ring{transform-origin:50% 50%;animation:sySpin 24s linear infinite}.sy-sigil .petals{transform-origin:50% 50%;animation:sySpin 60s linear infinite reverse}
@keyframes sySpin{to{transform:rotate(360deg)}}
#syBg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0}
#menu>.sy-mark{position:absolute;right:-120px;top:50%;width:560px;height:560px;margin-top:-280px;opacity:.12;pointer-events:none;z-index:0}
/* 视差：背景 / 角色 / 面板三层反向位移 + 轻微 3D 旋转 */
#menu{perspective:1400px}
#menu .bg{translate:calc(var(--px,0) * -14px) calc(var(--py,0) * -8px);scale:1.04;transition:translate .25s ease-out}
#menu #heroLive46 img{translate:calc(var(--px,0) * -6px) calc(var(--py,0) * -4px);transition:translate .25s ease-out} /* 只移动立绘图片，不移动可点击的 heroTap 热区（会盖住竖屏底栏） */
/* 可点击的入口面板不参与视差：preserve-3d/rotateY 会让切角按钮的命中落到父容器，位移会把按钮推出安全区 */
#menu #coverTitle36{translate:calc(var(--px,0) * 8px) calc(var(--py,0) * 4px);transition:translate .3s ease-out}
/* 镜头推拉：打开子页面时大厅后退、模糊、压暗 */
#menu{transition:filter .2s} /* 关闭抽屉时立即恢复缩放，避免回到大厅的瞬间点到错位的按钮 */
#menu[data-sy-push]{transition:scale .45s var(--sy-ease-out,ease),filter .45s;scale:.94;filter:blur(3px) brightness(.55) saturate(.8)}
.drawer:not(.hidden){animation:syDolly .5s var(--sy-ease-out,ease)}
@keyframes syDolly{from{opacity:0;transform:perspective(1200px) translateZ(140px) rotateX(4deg)}to{opacity:1;transform:none}}
/* 出击键：多层反馈（按下压缩 → 冲击菱环 → 故障闪烁 → 全屏斜切闪光） */
#start.sy-hit{animation:syGlitch .36s steps(2) 1}
@keyframes syGlitch{0%{filter:none}25%{filter:hue-rotate(60deg) saturate(2);translate:3px 0}50%{filter:invert(.15);translate:-3px 1px}75%{filter:brightness(1.8);translate:2px -1px}100%{filter:none;translate:0 0}}
.sy-shock{position:fixed;width:20px;height:20px;margin:-10px 0 0 -10px;border:2px solid var(--c-primary);rotate:45deg;pointer-events:none;z-index:9998;box-shadow:0 0 16px var(--c-primary),inset 0 0 10px var(--c-primary);animation:syShock .5s var(--sy-ease-out,ease) forwards}
.sy-shock.b{border-color:var(--c-accent);box-shadow:0 0 16px var(--c-accent);animation-delay:.06s;opacity:0}
@keyframes syShock{0%{scale:.4;opacity:1}100%{scale:9;opacity:0}}
#syFlash{position:fixed;inset:0;pointer-events:none;z-index:9997;opacity:0;background:linear-gradient(105deg,transparent 35%,rgb(var(--c-n6-rgb) / .95) 49%,rgb(var(--c-primary-rgb) / .9) 51%,transparent 65%),repeating-linear-gradient(0deg,rgb(var(--c-n0-rgb) / .25) 0 2px,transparent 2px 4px)}
#syFlash.go{animation:syFlash .42s ease-out}@keyframes syFlash{0%{opacity:0;transform:translateX(-30%)}30%{opacity:1}100%{opacity:0;transform:translateX(30%)}}
/* 加载演出 */
#bootArt35 .sy-load{position:absolute;left:50%;bottom:9%;width:min(560px,80vw);translate:-50% 0;z-index:6;font:italic 700 12px var(--sy-font-title,sans-serif);color:var(--c-primary-strong);letter-spacing:.12em}
#bootArt35 .sy-load .bar{height:4px;margin:8px 0 6px;background:rgb(var(--c-primary-rgb) / .15);clip-path:polygon(4px 0,100% 0,calc(100% - 4px) 100%,0 100%)}
#bootArt35 .sy-load .bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--c-primary),var(--c-n6) 85%,var(--c-accent));box-shadow:0 0 10px var(--c-primary);transition:width .25s}
#bootArt35 .sy-load .row{display:flex;justify-content:space-between}#bootArt35 .sy-load .tip{color:var(--c-n6);opacity:.85;font-style:normal;letter-spacing:.04em}
#bootArt35 .sy-sigil{position:absolute;left:50%;top:44%;translate:-50% -50%;z-index:5;opacity:.85}
/* 结算演出 */
#result.sy-show .modal{animation:syRes .55s var(--sy-ease-back,ease) both;position:relative;overflow:hidden}
@keyframes syRes{from{opacity:0;clip-path:polygon(0 0,0 0,0 100%,0 100%)}to{opacity:1;clip-path:polygon(0 0,100% 0,100% 100%,0 100%)}}
#result.sy-show .modal::before{content:"";position:absolute;inset:-20% -40%;background:linear-gradient(105deg,transparent 40%,rgb(var(--c-primary-rgb) / .18) 48%,rgb(var(--c-accent-rgb) / .2) 52%,transparent 60%);animation:sySweep 1.2s .2s ease-out both;pointer-events:none}
@keyframes sySweep{from{transform:translateX(-60%)}to{transform:translateX(60%)}}
#result.sy-show #rankBig{animation:sySlam .5s .35s cubic-bezier(.2,1.6,.4,1) both;font-family:var(--sy-font-title,sans-serif);font-style:italic;text-shadow:4px 0 0 rgb(var(--c-accent-rgb) / .7),-3px 0 0 rgb(var(--c-primary-rgb) / .8),0 0 24px rgb(var(--c-rare-ssr-rgb) / .7)}
@keyframes sySlam{0%{scale:3.2;opacity:0;filter:blur(6px)}70%{scale:.92;opacity:1;filter:none}100%{scale:1}}
#result.sy-show #rstats>*{animation:syRow .35s ease-out both}
${Array.from({ length: 10 }, function (_, i) { return "#result.sy-show #rstats>*:nth-child(" + (i + 1) + "){animation-delay:" + (0.55 + i * 0.07).toFixed(2) + "s}"; }).join("")}
@keyframes syRow{from{opacity:0;translate:-24px 0}to{opacity:1;translate:0 0}}
#result .modal{background:repeating-linear-gradient(0deg,rgb(var(--c-primary-rgb) / .05) 0 1px,transparent 1px 3px),linear-gradient(160deg,rgb(var(--c-n1-rgb) / .95),rgb(var(--c-n0-rgb) / .97))!important;border:1px solid rgb(var(--c-primary-rgb) / .45)!important;border-radius:0!important;clip-path:polygon(22px 0,100% 0,100% calc(100% - 22px),calc(100% - 22px) 100%,0 100%,0 22px);box-shadow:inset 0 0 0 1px rgb(var(--c-primary-rgb) / .25),0 0 40px rgb(var(--c-primary-rgb) / .2)!important}
#result #rankBig{font-size:96px!important;color:var(--c-rare-ssr)!important;line-height:1}
#result #rtitle{font:italic 800 28px var(--sy-font-title,sans-serif);color:var(--c-n6);letter-spacing:.04em}
#result #rstats>*{border-left:3px solid var(--c-primary);background:linear-gradient(90deg,rgb(var(--c-primary-rgb) / .12),transparent);padding:4px 10px;margin:4px 0;text-align:left}
#result #rstats b{font:italic 700 20px var(--sy-font-title,sans-serif);color:var(--c-primary)}
#result .actions button{border-radius:0!important;clip-path:polygon(10px 0,100% 0,calc(100% - 10px) 100%,0 100%);font:italic 800 16px var(--sy-font-title,sans-serif)!important;letter-spacing:.1em}
#result .actions .primary{background:linear-gradient(90deg,var(--c-accent),var(--c-accent))!important;color:var(--c-n6)!important;box-shadow:0 0 18px rgb(var(--c-accent-rgb) / .5)!important}
#result .actions .secondary{background:rgb(var(--c-primary-rgb) / .12)!important;color:var(--c-primary-strong)!important;border:1px solid rgb(var(--c-primary-rgb) / .5)!important}
#result .sy-sigil{position:absolute;right:-40px;top:-40px;opacity:.18;pointer-events:none}
/* 角色出场展示 */
#syShow{position:fixed;inset:0;z-index:9995;pointer-events:none;display:none;overflow:hidden}
#syShow.on{display:block}
#syShow .band{position:absolute;left:-10%;right:-10%;top:30%;height:40%;background:linear-gradient(90deg,rgb(var(--c-n0-rgb) / .95),rgb(var(--c-n1-rgb) / .9));transform:skewY(-6deg);border-top:2px solid var(--c-primary);border-bottom:2px solid var(--c-accent);box-shadow:0 0 30px rgb(var(--c-primary-rgb) / .5);animation:syBand .9s cubic-bezier(.2,.9,.2,1) both}
#syShow .band::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgb(var(--c-primary-rgb) / .07) 0 1px,transparent 1px 3px)}
#syShow img{position:absolute;right:8%;bottom:0;height:115%;max-width:none;animation:syHero .9s cubic-bezier(.2,.9,.2,1) both;filter:drop-shadow(-12px 0 0 rgb(var(--c-primary-rgb) / .35))}
#syShow .nm{position:absolute;left:8%;top:42%;font:italic 800 56px var(--sy-font-title,sans-serif);color:var(--c-n6);text-shadow:4px 0 0 rgb(var(--c-accent-rgb) / .7),-3px 0 0 rgb(var(--c-primary-rgb) / .8);animation:syName .9s .1s cubic-bezier(.2,.9,.2,1) both}
#syShow .cd{position:absolute;left:8.4%;top:38%;font:italic 700 13px var(--sy-font-title,sans-serif);letter-spacing:.35em;color:var(--c-primary);animation:syName .9s cubic-bezier(.2,.9,.2,1) both}
/* 验收第 4 轮：结算胜利立绘层、角色出场主题色 + 台词、加载页层次 */
#result .modal .sy-win{position:absolute;right:-6%;bottom:0;height:118%;max-width:none;z-index:0;pointer-events:none;opacity:0;-webkit-mask-image:linear-gradient(90deg,transparent,var(--c-n0) 35%);mask-image:linear-gradient(90deg,transparent,var(--c-n0) 35%);filter:drop-shadow(-10px 0 0 rgb(var(--c-primary-rgb) / .25))}
#result.sy-show .modal .sy-win{animation:syWin .8s .25s var(--sy-ease-out,ease) forwards}
@keyframes syWin{from{opacity:0;translate:60px 0}to{opacity:.3;translate:0 0}}
#result .modal>*:not(.sy-win):not(.sy-sigil){position:relative;z-index:1}
#syShow{--hc:var(--c-primary);--hc-rgb:var(--c-primary-rgb)}
#syShow[data-c="aya"]{--hc:var(--c-accent);--hc-rgb:var(--c-accent-rgb)}#syShow[data-c="rion"]{--hc:var(--c-rare-sr);--hc-rgb:var(--c-rare-sr-rgb)}
#syShow .band{border-top-color:var(--hc)!important;box-shadow:0 0 30px rgb(var(--hc-rgb) / .45)!important}
#syShow .cd{color:var(--hc)!important}
#syShow .qt{position:absolute;left:8.4%;top:calc(42% + 70px);font:700 15px var(--sy-font-body,sans-serif);color:var(--c-n5);letter-spacing:.08em;border-left:3px solid var(--hc);padding-left:10px;animation:syName .9s .25s cubic-bezier(.2,.9,.2,1) both}
#bootArt35 img{animation:syBootDrift 9s ease-in-out infinite alternate}
@keyframes syBootDrift{from{scale:1.04;translate:-1% 0}to{scale:1.08;translate:1% -1%}}
#bootArt35::after{content:"";position:absolute;inset:14px;pointer-events:none;z-index:5;background:linear-gradient(var(--c-primary),var(--c-primary)) 0 0/26px 2px,linear-gradient(var(--c-primary),var(--c-primary)) 0 0/2px 26px,linear-gradient(var(--c-primary),var(--c-primary)) 100% 100%/26px 2px,linear-gradient(var(--c-primary),var(--c-primary)) 100% 100%/2px 26px;background-repeat:no-repeat;opacity:.8}
@media (prefers-reduced-motion:reduce){#bootArt35 img{animation:none}}
/* 验收第 5 轮：HUD 受击边缘闪 + 击杀数弹跳；加载页点击反馈；子页卡片斜切编号；射的/地图专属符号动效 */
#syHurt{position:fixed;inset:0;pointer-events:none;z-index:6;opacity:0;box-shadow:inset 0 0 0 3px rgb(var(--c-danger-rgb) / .9),inset 0 0 80px rgb(var(--c-danger-rgb) / .55)}
#syHurt.on{animation:syHurt .38s ease-out}
@keyframes syHurt{0%{opacity:1}100%{opacity:0}}
#hud #kill.sy-bump,#hud .rinfo #kill.sy-bump{animation:syBump .22s var(--sy-ease-back,ease)}
@keyframes syBump{0%{scale:1}40%{scale:1.35;color:var(--c-rare-ssr)}100%{scale:1}}
#bootArt35{cursor:pointer}
#bootArt35 .sy-ping{position:absolute;width:12px;height:12px;margin:-6px 0 0 -6px;border:2px solid var(--c-primary);rotate:45deg;pointer-events:none;z-index:7;animation:syPing .6s ease-out forwards}
@keyframes syPing{to{scale:7;opacity:0}}
#bootArt35 .sy-load .tip::before{content:"TIP ▸ ";color:var(--c-accent)}
#bootArt35 .sy-load .hint{display:block;margin-top:4px;color:var(--c-n4);font-size:10px;letter-spacing:.2em}
html body:not(#sy0) .drawer .wdc,html body:not(#sy0) .drawer .nc,html body:not(#sy0) .drawer .shopList>*,html body:not(#sy0) #stageList>*{clip-path:polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)}
.drawer .shopList,#stageList{counter-reset:syn}
.drawer .shopList>*,#stageList>*{counter-increment:syn;position:relative}
.drawer .shopList>*::before,#stageList>*::before{content:"SKR-" counter(syn,decimal-leading-zero);position:absolute;right:8px;top:6px;z-index:3;font:italic 700 10px var(--sy-font-title,sans-serif);letter-spacing:.15em;color:var(--c-n4);pointer-events:none}
#pachi46 header::after,#levelMap46 .lm46Sheet::after,#run46 .rm46::after{content:"";position:absolute;right:14px;top:10px;width:18px;height:18px;border:2px solid var(--c-primary);rotate:45deg;animation:sySpin 6s linear infinite;pointer-events:none;opacity:.8}
@keyframes sySpin{to{rotate:405deg}}
@media (prefers-reduced-motion:reduce){#pachi46 header::after,#levelMap46 .lm46Sheet::after,#run46 .rm46::after{animation:none}}
/* 升级弹窗（崩三式）：斜切大标题条 + LEVEL UP 英文、按稀有度的顶边色与光、卡片依次斜切入场、六边形图标框 */
#level:not(.hidden){background:radial-gradient(ellipse at 50% 60%,rgb(var(--c-primary-rgb) / .12),rgb(var(--c-n0-rgb) / .78) 70%)!important;backdrop-filter:blur(3px) saturate(.8);-webkit-backdrop-filter:blur(3px) saturate(.8)}
#level .modal{position:relative;overflow:visible!important;animation:syLvIn .42s var(--sy-ease-out,ease) both}
@keyframes syLvIn{from{opacity:0;translate:0 24px;scale:.96}to{opacity:1;translate:0 0;scale:1}}
html body:not(#sy0) #level .modal>h2{display:inline-block;margin-left:-28px!important;padding:6px 40px 6px 28px!important;background:linear-gradient(90deg,var(--c-accent),rgb(var(--c-accent-rgb) / .55))!important;color:var(--c-on-accent)!important;border:0!important;clip-path:polygon(0 0,100% 0,calc(100% - 22px) 100%,0 100%);text-shadow:none!important;font:italic 800 26px var(--sy-font-title,sans-serif)!important;letter-spacing:.06em;animation:syLvBar .5s var(--sy-ease-back,ease) both}
#level .modal>h2::after{content:"LEVEL UP";margin-left:14px;font:italic 700 14px var(--sy-font-title,sans-serif);letter-spacing:.3em;opacity:.75}
@keyframes syLvBar{from{clip-path:polygon(0 0,0 0,0 100%,0 100%)}to{clip-path:polygon(0 0,100% 0,calc(100% - 22px) 100%,0 100%)}}
#level .modal::before{content:"SKR // RESONANCE";position:absolute;right:18px;top:12px;font:italic 700 11px var(--sy-font-title,sans-serif);letter-spacing:.3em;color:var(--c-n4)}
html body:not(#sy0):not(#sy1) #level .choice{--rc:var(--c-rare-n);--rc-rgb:var(--c-rare-n-rgb);border:1px solid var(--c-line)!important;border-left-width:1px!important;border-top:3px solid var(--rc)!important;background:linear-gradient(180deg,rgb(var(--rc-rgb) / .16),var(--c-surface-2) 38%)!important;clip-path:polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px);animation:syCard .45s var(--sy-ease-out,ease) both;transition:translate .15s,box-shadow .15s}
#level .choice:nth-child(2){animation-delay:.07s!important}#level .choice:nth-child(3){animation-delay:.14s!important}#level .choice:nth-child(4){animation-delay:.21s!important}
@keyframes syCard{from{opacity:0;translate:40px 0;clip-path:polygon(14px 0,14px 0,0 100%,0 100%)}}
html body:not(#sy0):not(#sy1) #level .choice.rar46-rare{--rc:var(--c-rare-r);--rc-rgb:var(--c-rare-r-rgb)}
html body:not(#sy0):not(#sy1) #level .choice.rar46-epic{--rc:var(--c-rare-sr);--rc-rgb:var(--c-rare-sr-rgb)}
html body:not(#sy0):not(#sy1) #level .choice.rar46-legend,html body:not(#sy0):not(#sy1) #level .choice.rar46-evo{--rc:var(--c-rare-ssr);--rc-rgb:var(--c-rare-ssr-rgb);box-shadow:0 0 18px rgb(var(--c-rare-ssr-rgb) / .35)!important}
html body:not(#sy0):not(#sy1) #level .choice[data-rec]{outline:1px solid var(--c-primary);outline-offset:-1px}
@media (hover:hover){html body:not(#sy0):not(#sy1) #level .choice:hover{translate:0 -6px;box-shadow:0 0 0 1px var(--rc),0 8px 26px rgb(var(--rc-rgb) / .45)!important}}
#level .choice img{clip-path:polygon(25% 3%,75% 3%,100% 50%,75% 97%,25% 97%,0 50%);background:var(--c-n1);filter:drop-shadow(0 0 6px rgb(var(--rc-rgb) / .6))}
#level .choice .meta span:last-child{color:var(--rc)!important;font-weight:800}
#level button:not(.choice){clip-path:polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)}
@media (prefers-reduced-motion:reduce){#level .modal,#level .modal>h2,#level .choice{animation:none!important}}
/* 结算面板：内容多时不再超出屏幕底部（“再次迎击 / 返回”原来看不到），中间滚动、按钮吸底；旧的 🌸 表情图标与 SKR 徽记重叠，隐藏 */
html body:not(#sy0) #result .modal{max-height:calc(100dvh - 24px - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px));overflow-y:auto!important;overscroll-behavior:contain}
html body:not(#sy0) #result .actions{position:sticky;bottom:-1px;z-index:3;padding:10px 0 4px;background:linear-gradient(transparent,var(--c-surface-1) 30%)}
html body:not(#sy0) #result .resultIcon{display:none!important}
@media (max-height:440px){html body:not(#sy0) #result .actions{display:flex!important;gap:8px}html body:not(#sy0) #result .actions button{flex:1;min-height:40px!important;margin:0!important}html body:not(#sy0) #result .rankBig{font-size:48px!important;line-height:1!important}}
html body:not(#sy0) #result .modal .sy-win{position:fixed;height:min(110dvh,900px);right:max(0px,calc(50vw - 520px))}
/* 矮横屏（844×390）升级弹窗：三张卡加按钮超出屏幕，“重抽 / 全部拿 / 图鉴”看不到。压缩卡片，弹窗内可滚动，按钮行并排 */
@media (max-height:440px){html body:not(#sy0):not(#sy1) #level .modal{max-height:calc(100dvh - 12px);overflow-y:auto!important;padding-top:10px!important;padding-bottom:10px!important}
html body:not(#sy0) #level .modal>h2{font-size:20px!important;padding:3px 30px 3px 22px!important;margin-bottom:2px!important}
html body:not(#sy0):not(#sy1) #level .choice{min-height:0!important;padding:8px 10px!important}
html body:not(#sy0):not(#sy1) #level .choice img{width:44px!important;height:44px!important;margin:0 auto 2px!important}
html body:not(#sy0):not(#sy1) #level .choice small:last-child,html body:not(#sy0):not(#sy1) #level .choice .dots46,html body:not(#sy0):not(#sy1) #level .choice [class*="dots"]{display:none!important}
html body:not(#sy0):not(#sy1) #level .modal>#reroll,html body:not(#sy0):not(#sy1) #level .modal>#levelBar46{display:inline-flex!important;width:calc(50% - 4px)!important;vertical-align:middle;margin:6px 0 0!important;min-height:36px!important}
html body:not(#sy0):not(#sy1) #level .modal>#reroll{margin-right:8px!important}}
#syShow.out{animation:syOut .35s ease-in forwards}
@keyframes syBand{from{transform:skewY(-6deg) translateX(-110%)}to{transform:skewY(-6deg) translateX(0)}}
@keyframes syHero{from{translate:30% 0;opacity:0}to{translate:0 0;opacity:1}}
@keyframes syName{from{translate:-40px 0;opacity:0}to{translate:0 0;opacity:1}}
@keyframes syOut{to{opacity:0}}
@media (prefers-reduced-motion:reduce){#menu .bg,#menu #heroLive46,#tacticalDeck48,#coverTitle36{translate:none!important;rotate:none!important}.sy-sigil .ring,.sy-sigil .petals{animation:none}}
`;
  var st = doc.createElement("style"); st.id = "syFx3"; st.textContent = css; doc.head.appendChild(st);

  // ---------- 2. 大厅动态背景 ----------
  var cv, g, motes = [], petals = [], last = 0, t0 = performance.now(), dpr = Math.min(1.5, global.devicePixelRatio || 1);
  function seed() { var W = cv.width, H = cv.height, n = low ? 26 : 52, m = low ? 4 : 8; motes = []; petals = []; for (var i = 0; i < n; i++) motes.push({ x: Math.random() * W, y: Math.random() * H, v: (10 + Math.random() * 30) * dpr, s: (0.8 + Math.random() * 1.8) * dpr, a: Math.random() }); for (i = 0; i < m; i++) petals.push({ x: Math.random() * W, y: Math.random() * H, vx: (8 + Math.random() * 14) * dpr, vy: (10 + Math.random() * 16) * dpr, r: (5 + Math.random() * 6) * dpr, rot: Math.random() * 6, vr: (Math.random() - .5) * 1.5 }); }
  function size() { var m = doc.getElementById("menu"); if (!m || !cv) return; cv.width = Math.round(m.clientWidth * dpr); cv.height = Math.round(m.clientHeight * dpr); seed(); }
  function techPetal(p) { g.save(); g.translate(p.x, p.y); g.rotate(p.rot); var r = p.r; g.strokeStyle = T("accent", .75); g.lineWidth = 1 * dpr; g.beginPath(); g.moveTo(0, r * .2); g.lineTo(-r * .55, -r * .45); g.lineTo(-r * .3, -r); g.lineTo(0, -r * .78); g.lineTo(r * .3, -r); g.lineTo(r * .55, -r * .45); g.closePath(); g.stroke(); g.fillStyle = T("accent", .18); g.fill(); g.restore(); }
  function T(n, a) { return global.SakurayoTok ? global.SakurayoTok(n, a) : "gray"; }
  function frame(now) {
    var menu = doc.getElementById("menu"); if (!cv || !menu) return; var vis = !doc.hidden && !menu.classList.contains("hidden") && menu.offsetParent !== null;
    if (vis && !reduce()) requestAnimationFrame(frame); else { setTimeout(function () { requestAnimationFrame(frame); }, 500); if (!reduce()) return; }
    if (now - last < 33) return; var dt = Math.min(0.1, (now - (last || now)) / 1000); last = now;
    var W = cv.width, H = cv.height, t = (now - t0) / 1000; g.clearRect(0, 0, W, H);
    // 六边形网格：被一条斜向扫描带“点亮”
    var R = 34 * dpr, hx = R * 1.732, sweep = ((t * 0.18) % 1.6 - 0.3) * (W + H);
    g.lineWidth = 1 * dpr;
    for (var row = 0, y = 0; y < H + R; row++, y += R * 1.5) for (var x = (row % 2) * hx / 2; x < W + hx; x += hx) {
      var d = Math.abs(x + y - sweep); if (d > 240 * dpr) continue; var al = 0.22 * (1 - d / (240 * dpr));
      g.strokeStyle = T("primary", al.toFixed(3)); g.beginPath(); for (var k = 0; k < 6; k++) { var an = Math.PI / 3 * k + Math.PI / 6, px = x + R * .92 * Math.cos(an), py = y + R * .92 * Math.sin(an); k ? g.lineTo(px, py) : g.moveTo(px, py); } g.closePath(); g.stroke(); }
    // 上升的数据光点
    motes.forEach(function (m) { m.y -= m.v * dt; if (m.y < -4) { m.y = H + 4; m.x = Math.random() * W; } var a = 0.35 + 0.35 * Math.sin(t * 2 + m.a * 6); g.fillStyle = T("primary-strong", (a * 0.6).toFixed(2)); g.fillRect(m.x, m.y, m.s, m.s * 3); });
    // 线框樱瓣
    petals.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; if (p.y > H + 20 || p.x > W + 20) { p.x = Math.random() * W * .6 - 20; p.y = -20; } techPetal(p); });
    // 水平扫描线
    var sy = (t * 60 * dpr) % (H + 40) - 20; var gr = g.createLinearGradient(0, sy - 20, 0, sy + 2); gr.addColorStop(0, T("primary", 0)); gr.addColorStop(1, T("primary", .10)); g.fillStyle = gr; g.fillRect(0, sy - 20, W, 22);
  }
  // ---------- 3. 视差 ----------
  var tx = 0, ty = 0, raf = 0;
  function setPar(x, y) { tx = Math.max(-1, Math.min(1, x)); ty = Math.max(-1, Math.min(1, y)); if (raf) return; raf = requestAnimationFrame(function () { raf = 0; var m = doc.getElementById("menu"); if (m) { m.style.setProperty("--px", tx.toFixed(3)); m.style.setProperty("--py", ty.toFixed(3)); } }); }
  // ---------- 4. 出击多层反馈 ----------
  var flash; function startFx(e) { if (reduce()) return; var b = doc.getElementById("start"); if (!b) return; var r = b.getBoundingClientRect(), x = e && e.clientX || r.left + r.width / 2, y = e && e.clientY || r.top + r.height / 2;
    b.classList.remove("sy-hit"); void b.offsetWidth; b.classList.add("sy-hit"); ["", " b"].forEach(function (c) { var s = doc.createElement("i"); s.className = "sy-shock" + c; s.style.left = x + "px"; s.style.top = y + "px"; doc.body.appendChild(s); setTimeout(function () { s.remove(); }, 700); });
    flash.classList.remove("go"); void flash.offsetWidth; flash.classList.add("go"); if (global.SakurayoPolish) global.SakurayoPolish.blip("open"); }
  // ---------- 5. 加载演出 ----------
  var TIPS = ["SKR-01 // 镜界坐标校准中", "提示：同一职业凑齐三项核心即可成型", "提示：Boss 战前可在割草、格斗、弹幕三种打法间自由选择", "提示：妖气节点更难，但魂晶翻倍", "提示：庙会射的每日免费一局", "SYS // 正在同步樱印协议"];
  function bootFx() { var boot = doc.getElementById("bootArt35"); if (!boot || boot.querySelector(".sy-load")) return; boot.insertAdjacentHTML("beforeend", sigil(140) + '<div class="sy-load"><div class="row"><span>LOADING // 樱夜系统启动</span><span class="pc">0%</span></div><div class="bar"><i></i></div><div class="tip"></div><span class="hint">TAP // 点击屏幕查看下一条</span></div>');
    boot.addEventListener("pointerdown", function (e) { var r = boot.getBoundingClientRect(), d = doc.createElement("i"); d.className = "sy-ping"; d.style.left = (e.clientX - r.left) + "px"; d.style.top = (e.clientY - r.top) + "px"; boot.appendChild(d); setTimeout(function () { d.remove(); }, 650); var tp = boot.querySelector(".tip"); if (tp) tp.textContent = TIPS[(Math.random() * TIPS.length) | 0]; if (global.SakurayoPolish) global.SakurayoPolish.blip("tap"); });
    var bar = boot.querySelector(".bar i"), pc = boot.querySelector(".pc"), tip = boot.querySelector(".tip"), k = 0, p = 0; tip.textContent = TIPS[0];
    var iv = setInterval(function () { if (!boot.isConnected) return clearInterval(iv); var im = [].slice.call(doc.images), done = im.filter(function (x) { return x.complete; }).length, real = im.length ? done / im.length : 1; p = Math.min(99, Math.max(p + 2, real * 100 * 0.9)); bar.style.width = p + "%"; pc.textContent = Math.round(p) + "%"; if (++k % 8 === 0) tip.textContent = TIPS[(k / 8 | 0) % TIPS.length]; }, 120); }
  // ---------- 6. 结算演出 ----------
  function resultFx() { var r = doc.getElementById("result"); if (!r) return; var md = r.querySelector(".modal"); if (md && !md.querySelector(".sy-sigil")) md.insertAdjacentHTML("afterbegin", sigil(220));
    new MutationObserver(function () { var on = !r.classList.contains("hidden"); if (on && !r.classList.contains("sy-show")) { var hi = doc.querySelector("#heroLive46 img"), mdl = r.querySelector(".modal"); if (mdl && hi && hi.src) { var w = mdl.querySelector(".sy-win") || mdl.insertBefore(Object.assign(doc.createElement("img"), { className: "sy-win", alt: "" }), mdl.firstChild); if (w.src !== hi.src) w.src = hi.src; } setTimeout(function () { if (global.SakurayoPolish) global.SakurayoPolish.blip("reward"); }, 520); r.classList.add("sy-show"); r.querySelectorAll("#rstats b, #rstats strong").forEach(function (el, i) { if (global.SakurayoPolish) global.SakurayoPolish.watchNumber(el); var txt = el.textContent, n = parseInt(txt.replace(/[^\d]/g, ""), 10); if (!n || reduce()) return; var t1 = performance.now() + 550 + i * 70; (function step(now) { var k = Math.max(0, Math.min(1, (now - t1) / 700)); el.textContent = txt.replace(/[\d,]+/, Math.round(n * (1 - Math.pow(1 - k, 3))).toLocaleString("en-US")); if (k < 1) requestAnimationFrame(step); else el.textContent = txt; })(performance.now()); }); } else if (!on && r.classList.contains("sy-show")) r.classList.remove("sy-show"); }) /* 注意：classList.remove 即使类不存在也会写 class 属性，会让自己的观察器无限触发 */.observe(r, { attributes: true, attributeFilter: ["class"] }); }
  // ---------- 7. 角色出场 ----------
  var show, lastName = null, showT = 0;
  var QUOTE = { sayo: "「夜樱小队，月城小夜——准备出击。」", aya: "「刀与枪，都交给我吧。」", rion: "「黑羽之下，不留残影。」" };
  function showcase(name) { if (reduce() || !show) return; var img = doc.querySelector("#heroLive46 img"); show.innerHTML = '<div class="band"></div>' + (img ? '<img src="' + img.src + '" alt="">' : "") + '<div class="cd">OPERATOR // SKR-0' + (1 + (name.length % 7)) + '</div><div class="nm"></div>'; show.querySelector(".nm").textContent = name; var cid = /绫/.test(name) ? "aya" : /凛|音/.test(name) ? "rion" : "sayo"; show.setAttribute("data-c", cid); show.insertAdjacentHTML("beforeend", '<div class="qt"></div>'); show.querySelector(".qt").textContent = QUOTE[cid]; show.className = "on"; clearTimeout(showT); showT = setTimeout(function () { show.classList.add("out"); setTimeout(function () { show.className = ""; }, 360); }, 1400); }
  function watchChar() { var n = doc.getElementById("charName"); if (!n) return; lastName = n.textContent; new MutationObserver(function () { var v = n.textContent; if (v && v !== lastName) { lastName = v; setTimeout(function () { showcase(v); }, 60); } }).observe(n, { childList: true, characterData: true, subtree: true }); }
  // ---------- 8. HUD 受击与击杀反馈 ----------
  function hudFx() { var hp = doc.getElementById("hpF"), kill = doc.getElementById("kill"); var hurt = doc.createElement("div"); hurt.id = "syHurt"; doc.body.appendChild(hurt); var last = 101;
    if (hp) new MutationObserver(function () { var w = parseFloat(hp.style.width) || 0; if (w < last - 0.5 && !reduce()) { hurt.classList.remove("on"); void hurt.offsetWidth; hurt.classList.add("on"); } last = w; }).observe(hp, { attributes: true, attributeFilter: ["style"] });
    if (kill) { var lk = kill.textContent; new MutationObserver(function () { if (kill.textContent === lk) return; lk = kill.textContent; kill.classList.remove("sy-bump"); void kill.offsetWidth; kill.classList.add("sy-bump"); }).observe(kill, { childList: true, characterData: true, subtree: true }); } }
  // ---------- 初始化 ----------
  function init() {
    var menu = doc.getElementById("menu"), bg = menu && menu.querySelector(".bg");
    if (menu) { cv = doc.createElement("canvas"); cv.id = "syBg"; g = cv.getContext("2d"); (bg || menu).appendChild(cv); menu.insertAdjacentHTML("afterbegin", sigil(560, "sy-mark").replace('class="sy-sigil sy-mark"', 'class="sy-sigil sy-mark"')); var mk = menu.querySelector("svg.sy-mark"); if (mk) mk.classList.add("sy-mark"); size(); addEventListener("resize", size); requestAnimationFrame(frame); }
    flash = doc.createElement("div"); flash.id = "syFlash"; doc.body.appendChild(flash); show = doc.createElement("div"); show.id = "syShow"; doc.body.appendChild(show);
    doc.addEventListener("pointermove", function (e) { if (e.pointerType === "mouse") setPar(e.clientX / innerWidth * 2 - 1, e.clientY / innerHeight * 2 - 1); }, { passive: true });
    addEventListener("deviceorientation", function (e) { if (e.gamma == null) return; setPar(e.gamma / 25, (e.beta - 45) / 25); }, { passive: true });
    doc.addEventListener("pointerdown", function (e) { if (e.target.closest && e.target.closest("#start")) startFx(e); }, true);
    var pmo = new MutationObserver(function () { var open = !!doc.querySelector(".drawer:not(.hidden)"); if (menu && menu.hasAttribute("data-sy-push") !== open) { if (open) menu.setAttribute("data-sy-push", ""); else menu.removeAttribute("data-sy-push"); } }); doc.querySelectorAll(".drawer").forEach(function (d) { pmo.observe(d, { attributes: true, attributeFilter: ["class"] }); });
    bootFx(); resultFx(); watchChar(); hudFx();
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", init); else init();
  global.SakurayoFx = { sigil: sigil, showcase: showcase, startFx: startFx };
})(typeof window !== "undefined" ? window : globalThis);
