/* UI 打磨第 2 轮：静态视觉（POLISH_LOG 第 2 轮）。
   崩坏3式中式科技二次元：切角面板 + 发光描边 + 扫描线 + 六边形纹、字体层级（Rajdhani 斜体粗体 + Noto Sans SC 800 子集，OFL）、Logo 美术字、
   入口卡片插画底图、底栏选中态、子页面页头横幅。所有插画都由中转站 gpt-image-2 生成（art/ui/polish2/）。 */
(function (global) {
  "use strict";
  if (typeof document === "undefined") return;
  var A = function (p) { return (global.SakurayoArtBase || "art/") + p; }, U = function (p) { return "url(" + A(p) + ")"; };
  var css = `
@font-face{font-family:"SyTitleSC";src:${U("fonts/sy-title-sc.woff2")} format("woff2");font-weight:800;font-display:swap}
@font-face{font-family:"SyTitleEn";src:${U("fonts/sy-title-en.woff2")} format("woff2");font-weight:700;font-display:swap;unicode-range:U+0020-007E}
:root{--sy-glass:linear-gradient(160deg,rgb(var(--c-n1-rgb) / .86),rgb(var(--c-n0-rgb) / .92));--sy-glass-blur:saturate(1.3) blur(12px);
--sy-stroke-in:inset 0 0 0 1px rgb(var(--c-primary-rgb) / .28),inset 0 1px 0 rgb(var(--c-primary-strong-rgb) / .35);--sy-shadow:0 10px 30px rgb(var(--c-n0-rgb) / .6);
--sy-tex:${U("ui/polish2/tex_pattern.webp")};--sy-scan:repeating-linear-gradient(0deg,rgb(var(--c-primary-rgb) / .05) 0 1px,transparent 1px 3px)}
/* ---- 字体层级：英文斜体粗体 + 中文黑体（Rajdhani / Noto Sans SC 子集，OFL） ---- */
.drawer h2,#wd46 header b,#night46 header b,#pachi46 header b,.rm46 h3,.sectionTitle b,.terminalLabel48 b,.levelMapBtn46 b,#sname{font-family:var(--sy-font-title);font-weight:800;font-style:italic;letter-spacing:.03em}
.drawer h2,#wd46 header b,#night46 header b{font-size:var(--sy-fs-xl)!important;line-height:1.05;color:var(--c-n6)!important;text-shadow:0 0 14px rgb(var(--c-primary-rgb) / .6)}
.terminalLabel48 small,.levelMapBtn46 small,.drawer .dhead p{font-family:var(--sy-font-title);font-style:italic;letter-spacing:.18em;opacity:.8;font-size:var(--sy-fs-xs);color:var(--sy-c-cyan)}
.drawer p,.drawer small,#wd46 .note{line-height:1.6}
/* ---- 面板：切角 + 发光描边 + 扫描线 + 六边形纹 ---- */
.drawer,#wd46 .box,#night46 .box,#pachi46 .pf,.rm46{background:var(--sy-scan),var(--sy-tex) 0 0/260px repeat,var(--sy-glass)!important;backdrop-filter:var(--sy-glass-blur);-webkit-backdrop-filter:var(--sy-glass-blur);box-shadow:var(--sy-stroke-in),var(--sy-shadow)!important;border:1px solid rgb(var(--c-primary-rgb) / .4)!important;border-radius:0!important;clip-path:polygon(18px 0,100% 0,100% calc(100% - 18px),calc(100% - 18px) 100%,0 100%,0 18px)}
#wd46 .box,#night46 .box{position:relative;overflow:hidden}
#wd46 .box::before,#night46 .box::before{content:"";position:absolute;inset:6px;pointer-events:none;z-index:6;background:linear-gradient(var(--c-primary),var(--c-primary)) 0 0/18px 2px,linear-gradient(var(--c-primary),var(--c-primary)) 0 0/2px 18px,linear-gradient(var(--c-primary),var(--c-primary)) 100% 100%/18px 2px,linear-gradient(var(--c-primary),var(--c-primary)) 100% 100%/2px 18px;background-repeat:no-repeat;filter:drop-shadow(0 0 4px var(--c-primary))}
.wdc,.nc,.shopList>*,.storyCard,#stageList>*{box-shadow:var(--sy-stroke-in);border-radius:0!important;clip-path:polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)}
/* ---- 页头：横幅插画 + 斜切标题条 + 编号 ---- */
.drawer .dhead,#wd46 .box>header,#night46 .box>header{position:relative;min-height:96px;align-items:flex-end!important;padding:var(--sy-sp-4) var(--sy-sp-5) var(--sy-sp-3)!important;background-size:cover!important;background-position:center 45%!important;border-bottom:2px solid var(--sy-c-cyan)!important;box-shadow:0 2px 14px rgb(var(--c-primary-rgb) / .35)}
.drawer .dhead::after,#wd46 .box>header::after,#night46 .box>header::after{content:"";position:absolute;inset:0;background:var(--sy-scan),linear-gradient(90deg,rgb(var(--c-n0-rgb) / .95) 0%,rgb(var(--c-n0-rgb) / .6) 42%,rgb(var(--c-n0-rgb) / .05) 100%);pointer-events:none}
.drawer .dhead::before,#wd46 .box>header::before,#night46 .box>header::before{content:attr(data-sy-code);position:absolute;right:64px;top:10px;z-index:2;font:italic 700 12px var(--sy-font-title);letter-spacing:.2em;color:var(--c-on-primary);background:var(--sy-c-cyan);padding:1px 14px 1px 10px;clip-path:polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)}
.drawer .dhead>*,#wd46 .box>header>*,#night46 .box>header>*{position:relative;z-index:1}
.drawer .dhead h2,#wd46 .box>header>b,#night46 .box>header>b{padding:2px 26px 2px 12px;background:linear-gradient(90deg,rgb(var(--c-accent-rgb) / .0),rgb(var(--c-accent-rgb) / 0));border-left:4px solid var(--sy-c-pink)}
#stageDrawer .dhead{background-image:${U("ui/polish2/ban_stage.webp")}!important}
#gachaDrawer .dhead{background-image:${U("ui/polish2/ban_gacha.webp")}!important}
#shopDrawer .dhead{background-image:${U("ui/polish2/ban_shop.webp")}!important}
#rosterDrawer .dhead,#archiveDrawer .dhead,#storyDrawer .dhead,#achDrawer .dhead,#talentDrawer .dhead,#ascDrawer .dhead,#trialsDrawer .dhead{background-image:${U("ui/polish2/ban_stage.webp")}!important}
#wd46 .box>header{background-image:${U("ui/polish2/ban_wardrobe.webp")}!important}
#night46 .box>header{background-image:${U("ui/polish2/ban_night.webp")}!important}
/* ---- Logo：HUD 底板 + 斜体大字 + 编号印 ---- */
html body #menu #coverTitle36{position:relative;padding:8px 22px 10px 8px}
html body #menu #coverTitle36::before{content:"";position:absolute;left:-40px;top:-30px;width:340px;height:130px;background:${U("ui/polish2/logo_orn.webp")} left center/contain no-repeat;opacity:.95;pointer-events:none;z-index:-1}
html body #menu #coverTitle36>b{font-family:var(--sy-font-title)!important;font-weight:800!important;font-style:italic;font-size:42px!important;letter-spacing:.04em;line-height:1;color:var(--c-n6)!important;transform:skewX(-8deg);display:inline-block;text-shadow:3px 0 0 rgb(var(--c-accent-rgb) / .7),-2px 0 0 rgb(var(--c-primary-rgb) / .8),0 0 18px rgb(var(--c-primary-rgb) / .6)}
html body #menu #coverTitle36>span{display:inline-block;margin-top:6px;font:italic 700 11px var(--sy-font-title);letter-spacing:.24em;color:var(--c-on-primary)!important;background:var(--sy-c-cyan);padding:1px 14px 1px 8px;clip-path:polygon(0 0,100% 0,calc(100% - 8px) 100%,0 100%);text-shadow:none}
html body #menu #coverTitle36::after{content:"SKR-01 // SAKURAYO";position:absolute;left:10px;top:-8px;font:italic 700 10px var(--sy-font-title);letter-spacing:.3em;color:var(--sy-c-cyan);opacity:.85}
html body #menu #coverTitle36 .terminalLogo48{display:none}
/* ---- 入口卡片：插画底图 + 切角 + 发光边 ---- */
html body #menu #tacticalDeck48>button,html body #menu #modeRow46>button{background-size:cover!important;background-position:center!important;box-shadow:var(--sy-stroke-in),0 6px 16px rgb(var(--c-n0-rgb) / .5)!important;border:1px solid rgb(var(--c-primary-rgb) / .45)!important;border-radius:0!important;clip-path:polygon(12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%,0 12px);overflow:hidden;position:relative}
html body #menu #tacticalDeck48>button>*,html body #menu #modeRow46>button>*{position:relative;z-index:1;text-shadow:0 1px 3px rgb(var(--c-n0-rgb) / .9)}
html body #menu #commandCharacter47{background-image:linear-gradient(90deg,rgb(var(--c-n0-rgb) / .1),rgb(var(--c-n0-rgb) / .8)),${U("ui/polish2/card_operators.webp")}!important}
html body #menu #commandPrepare47{background-image:linear-gradient(90deg,rgb(var(--c-n0-rgb) / .1),rgb(var(--c-n0-rgb) / .8)),${U("ui/polish2/card_prepare.webp")}!important}
html body #menu #tacticalDeck48 #start{background-image:linear-gradient(100deg,rgb(var(--c-accent-rgb) / .55),rgb(var(--c-n0-rgb) / .1) 55%),${U("ui/polish2/card_start.webp")}!important;border-color:var(--sy-c-pink)!important;box-shadow:inset 0 0 0 1px rgb(var(--c-accent-rgb) / .6),0 0 22px rgb(var(--c-accent-rgb) / .45)!important}
html body #menu #tacticalDeck48 #start .terminalLabel48 b{font-size:44px;transform:skewX(-8deg);color:var(--c-n6)!important;text-shadow:3px 0 0 rgb(var(--c-accent-rgb) / .8),-2px 0 0 rgb(var(--c-primary-rgb) / .8),0 2px 8px var(--c-n0)}html body #menu #tacticalDeck48 #start .terminalLabel48 small,html body #menu #tacticalDeck48 #start .terminalIcon48{color:var(--c-n6)!important}
html body #menu #runBtn46{background-image:linear-gradient(0deg,rgb(var(--c-n0-rgb) / .88),rgb(var(--c-n0-rgb) / .2)),${U("ui/polish2/card_run.webp")}!important}
html body #menu #levelMapBtn46{background-image:linear-gradient(0deg,rgb(var(--c-n0-rgb) / .88),rgb(var(--c-n0-rgb) / .2)),${U("ui/polish2/card_levels.webp")}!important}
html body #menu #wdBtn46{background-image:linear-gradient(0deg,rgb(var(--c-n0-rgb) / .88),rgb(var(--c-n0-rgb) / .2)),${U("ui/polish2/card_wardrobe.webp")}!important}
html body #menu #pachiBtn46{background-image:linear-gradient(0deg,rgb(var(--c-n0-rgb) / .88),rgb(var(--c-n0-rgb) / .2)),${U("ui/polish2/card_shateki.webp")}!important}
/* ---- 底栏：六边形图标 + 选中态 ---- */
html body #menu .homeNav46{background:var(--sy-scan),linear-gradient(180deg,rgb(var(--c-n1-rgb) / .9),rgb(var(--c-n0-rgb) / .95))!important;backdrop-filter:var(--sy-glass-blur);box-shadow:var(--sy-stroke-in),var(--sy-shadow)!important;border-radius:0!important;border:1px solid rgb(var(--c-primary-rgb) / .35)!important;clip-path:polygon(16px 0,100% 0,100% 100%,0 100%,0 16px)}
html body #menu .homeNav46>button .terminalIcon48 svg{opacity:0}
html body #menu .homeNav46>button .terminalIcon48{background-position:center!important;background-size:contain!important;background-repeat:no-repeat!important;width:34px!important;height:34px!important}
html body #menu .homeNav46>[data-open="gacha"] .terminalIcon48{background-image:${U("ui/nav/gacha.webp")}!important}html body #menu .homeNav46>[data-open="roster"] .terminalIcon48{background-image:${U("ui/nav/roster.webp")}!important}
html body #menu .homeNav46>[data-open="shop"] .terminalIcon48{background-image:${U("ui/nav/shop.webp")}!important}html body #menu .homeNav46>[data-open="stage"] .terminalIcon48{background-image:${U("ui/nav/stage.webp")}!important}
html body #menu .homeNav46>[data-open="trials"] .terminalIcon48{background-image:${U("ui/nav/ascension.webp")}!important}html body #menu .homeNav46>[data-open="archive"] .terminalIcon48{background-image:${U("ui/nav/archive.webp")}!important}
html body #menu #commandHistory47 .terminalIcon48{background-image:${U("ui/nav/achievement.webp")}!important}
html body #menu .homeNav46>button{position:relative;transition:color .2s,background .2s}
html body #menu .homeNav46>button[data-sy-on]{background:linear-gradient(0deg,rgb(var(--c-primary-rgb) / .28),transparent 80%)!important;color:var(--c-n6)!important}
html body #menu .homeNav46>button[data-sy-on]::before{content:"";position:absolute;left:14%;right:14%;bottom:0;height:3px;background:var(--sy-c-cyan);box-shadow:0 0 10px var(--sy-c-cyan);clip-path:polygon(4px 0,100% 0,calc(100% - 4px) 100%,0 100%)}
html body #menu .homeNav46>button[data-sy-on]::after{content:"";position:absolute;left:50%;top:2px;width:6px;height:6px;margin-left:-3px;background:var(--sy-c-pink);transform:rotate(45deg);box-shadow:0 0 6px var(--sy-c-pink)}
html body #menu .homeNav46>button[data-sy-on] .terminalIcon48{transform:translateY(-3px) scale(1.12);filter:drop-shadow(0 0 6px rgb(var(--c-primary-rgb) / .9))}
html body #menu .homeNav46>button[data-sy-on] b{color:var(--sy-c-cyan)!important}
/* ---- 留白 ---- */
html body #menu #tacticalDeck48{gap:var(--sy-sp-3)!important}html body #menu #modeRow46{gap:var(--sy-sp-2)!important}
.drawer .dbody{padding:var(--sy-sp-4) var(--sy-sp-5)!important}
/* ---- 移动端：触控热区 ≥ 44px、安全区 ---- */
.drawer .close,#wd46 .x,#night46 .x,#pachi46 .x,[data-wdx],[data-nx]{min-width:44px;min-height:44px;display:inline-grid;place-items:center}
@media (pointer:coarse){html body #menu .homeNav46>button{min-height:52px}.levelMapBtn46{min-height:48px}}
html body #menu .homeNav46{margin-bottom:env(safe-area-inset-bottom)}html body #menu #coverTitle36{margin-left:env(safe-area-inset-left)}
/* ---- 新手引导 ---- */
#start.sy-guide{animation:syGuide 1.6s ease-in-out infinite}
@keyframes syGuide{0%,100%{box-shadow:inset 0 0 0 1px rgb(var(--c-accent-rgb) / .6),0 0 10px rgb(var(--c-accent-rgb) / .4)}50%{box-shadow:inset 0 0 0 2px var(--c-n6),0 0 30px rgb(var(--c-accent-rgb) / .9)}}
#start .sy-tip{position:absolute;right:14px;top:8px;z-index:3;font:italic 700 12px var(--sy-font-title);background:var(--sy-c-cyan);color:var(--c-on-primary);padding:2px 12px 2px 8px;clip-path:polygon(0 0,100% 0,calc(100% - 8px) 100%,0 100%)}
html body #menu .terminalActivity48{border-radius:0!important;clip-path:polygon(12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%,0 12px);box-shadow:var(--sy-stroke-in)!important}
/* ===== 第 2 轮补充：战斗 HUD、通用弹窗、列表卡片多层悬停、射的 / 地图面板 ===== */
.overlay .modal{background:var(--sy-scan),var(--sy-glass)!important;border:1px solid rgb(var(--c-primary-rgb) / .45)!important;border-radius:0!important;clip-path:polygon(20px 0,100% 0,100% calc(100% - 20px),calc(100% - 20px) 100%,0 100%,0 20px);box-shadow:var(--sy-stroke-in),0 0 36px rgb(var(--c-primary-rgb) / .18)!important}
.overlay .modal h2{font-family:var(--sy-font-title);font-style:italic;font-weight:800;color:var(--c-n6);text-shadow:0 0 12px rgb(var(--c-primary-rgb) / .6);border-left:4px solid var(--sy-c-pink);padding-left:12px;text-align:left}
.overlay .modal .sub{color:var(--sy-c-sub)}
.overlay .modal button.primary,.overlay .modal button.secondary,#choices>*,#eventChoices>*{border-radius:0!important;clip-path:polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)}
.overlay .modal button.primary{background:linear-gradient(90deg,var(--sy-c-red),var(--sy-c-pink))!important;color:var(--c-n6)!important}
.overlay .modal button.secondary{background:rgb(var(--c-primary-rgb) / .12)!important;color:var(--c-primary-strong)!important;border:1px solid rgb(var(--c-primary-rgb) / .5)!important}
#choices>*,#eventChoices>*{background:linear-gradient(160deg,rgb(var(--c-n2-rgb) / .95),rgb(var(--c-n0-rgb) / .95))!important;border:1px solid rgb(var(--c-primary-rgb) / .35)!important;box-shadow:var(--sy-stroke-in)!important}
/* HUD */
#hud .bar{border-radius:0!important;clip-path:polygon(6px 0,100% 0,calc(100% - 6px) 100%,0 100%);background:rgb(var(--c-n0-rgb) / .75)!important;box-shadow:inset 0 0 0 1px rgb(var(--c-primary-rgb) / .35)!important}
#hud #hpF{background:linear-gradient(90deg,var(--sy-c-red),var(--sy-c-pink))!important;box-shadow:0 0 8px var(--sy-c-pink)}
#hud #shF{background:linear-gradient(90deg,var(--c-primary),var(--sy-c-cyan))!important}#hud #xpF{background:linear-gradient(90deg,var(--c-rare-ssr),var(--sy-c-gold))!important}
#hud .bar span{font:italic 700 11px var(--sy-font-title)!important;letter-spacing:.06em}
#hud .rinfo #time{font:italic 800 28px var(--sy-font-title)!important;color:var(--c-n6);text-shadow:2px 0 0 rgb(var(--c-accent-rgb) / .6),-1px 0 0 rgb(var(--c-primary-rgb) / .8)}
#hud .rinfo #kill,#hud #stageHud{font:italic 700 12px var(--sy-font-title);color:var(--sy-c-cyan);letter-spacing:.08em}
#hud .wave{border-radius:0!important;clip-path:polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%);box-shadow:inset 0 0 0 1px rgb(var(--c-primary-rgb) / .4)!important;background:rgb(var(--c-n0-rgb) / .7)!important}
#hud #waveF{background:repeating-linear-gradient(110deg,var(--sy-c-cyan) 0 8px,var(--c-primary) 8px 12px)!important}
#hud .hero img{border-radius:0!important;clip-path:polygon(25% 0,100% 0,75% 100%,0 100%)!important;border:0!important;box-shadow:none!important;filter:drop-shadow(0 0 4px var(--sy-c-cyan))}
#hud .act,#hud #pause{border-radius:0!important;clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%);background:radial-gradient(circle,rgb(var(--c-primary-rgb) / .35),rgb(var(--c-n0-rgb) / .85) 70%)!important;border:0!important;box-shadow:none!important}
#hud .act span{font:italic 800 12px var(--sy-font-title)}
#hud .act,#hud button[class*="act"]{filter:drop-shadow(0 0 6px rgb(var(--c-primary-rgb) / .85));color:var(--c-n6)!important}
#hud [id*="atk"],#hud [id*="attack"],#hud [class*="atk"],#hud [class*="main"]{background:radial-gradient(circle,rgb(var(--c-accent-rgb) / .95),rgb(var(--c-on-accent-rgb) / .92) 70%)!important;filter:drop-shadow(0 0 10px rgb(var(--c-accent-rgb) / .9))!important}
#hud #combo{font-family:var(--sy-font-title)!important;font-style:italic;color:var(--sy-c-gold)!important;text-shadow:3px 0 0 rgb(var(--c-accent-rgb) / .6),0 0 12px rgb(var(--c-rare-ssr-rgb) / .7)!important}
/* 列表卡片：多层悬停（上浮 + 青色描边发光 + 扫描光带） */
.wdc,.shopList>*,#stageList>*,.nc,#gachaBody46 [class*="card"],#rosterBody46 [class*="card"]{position:relative;transition:translate .2s var(--sy-ease-out),box-shadow .2s,filter .2s}
@media (hover:hover){.wdc:hover,.shopList>*:hover,#stageList>*:hover,.nc:hover{translate:0 -4px;filter:brightness(1.08);box-shadow:inset 0 0 0 1px var(--sy-c-cyan),0 0 18px rgb(var(--c-primary-rgb) / .45)!important}
.wdc:hover::after,.shopList>*:hover::after,#stageList>*:hover::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,transparent 0%,rgb(var(--c-primary-rgb) / .22) 50%,transparent 52%);background-size:100% 200%;animation:syScan 1.1s linear infinite}}
@keyframes syScan{from{background-position:0 100%}to{background-position:0 -100%}}
/* 射的、地图面板 */
#pachi46 header{border-bottom:2px solid var(--sy-c-cyan)!important;background:linear-gradient(90deg,rgb(var(--c-n0-rgb) / .95),rgb(var(--c-n1-rgb) / .6))!important}
#levelMap46 .lm46Sheet,#run46 .rm46,#run46 .rs46{background:var(--sy-scan),var(--sy-glass)!important;border:1px solid rgb(var(--c-primary-rgb) / .4)!important;border-radius:0!important;clip-path:polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px)}
#levelMap46 .lm46Node b,#run46 .rn46 span{font-family:var(--sy-font-title);font-style:italic}
/* 说明：选择器前缀 body:not(#sy0):not(#sy1) 只为把优先级抬到两个 ID，压过旧界面里写死颜色的 ID 选择器 */
/* ===== 色彩体系 v2（docs/COLOR_SYSTEM.md）：60% 中性色 / 30% 主色 / 10% 强调色；三个明度层级；发光只给可交互元素 ===== */
:root{--sy-glass:linear-gradient(180deg,rgb(var(--c-n1-rgb) / .96),rgb(var(--c-n0-rgb) / .97));--sy-stroke-in:inset 0 0 0 1px var(--c-line),inset 0 1px 0 rgb(var(--c-n6-rgb) / .08);--sy-shadow:0 12px 32px rgb(var(--c-n0-rgb) / .7);--sy-scan:repeating-linear-gradient(0deg,rgb(var(--c-n6-rgb) / .025) 0 1px,transparent 1px 3px)}
/* 层级 1：容器（面板、抽屉、弹窗、底栏） */
html body:not(#sy0):not(#sy1) .drawer,html body:not(#sy0):not(#sy1) #wd46 .box,html body:not(#sy0):not(#sy1) #night46 .box,html body:not(#sy0):not(#sy1) #pachi46 .pf,.rm46,html body:not(#sy0):not(#sy1) .overlay .modal,html body:not(#sy0):not(#sy1) #menu .homeNav46,html body:not(#sy0):not(#sy1) #levelMap46 .lm46Sheet,html body:not(#sy0):not(#sy1) #run46 .rm46,html body:not(#sy0):not(#sy1) #run46 .rs46{background:var(--sy-scan),var(--sy-glass)!important;border:1px solid var(--c-line)!important;box-shadow:var(--sy-stroke-in),var(--sy-shadow)!important}
html body:not(#sy0):not(#sy1) .drawer::before,html body:not(#sy0):not(#sy1) #pachi46 .pf::before,html body:not(#sy0):not(#sy1) #run46 .rs46::before,html body:not(#sy0):not(#sy1) #wd46 .box::before,html body:not(#sy0):not(#sy1) #night46 .box::before{filter:none!important;opacity:.7}
/* 层级 2：悬浮（卡片、选项） */
html body:not(#sy0):not(#sy1) .wdc,html body:not(#sy0):not(#sy1) .nc,html body:not(#sy0):not(#sy1) .shopList>*,html body:not(#sy0):not(#sy1) .storyCard,html body:not(#sy0):not(#sy1) #stageList>*,html body:not(#sy0):not(#sy1) #choices>*,html body:not(#sy0):not(#sy1) #eventChoices>*{background:var(--c-surface-2)!important;border:1px solid var(--c-line)!important;box-shadow:inset 0 1px 0 rgb(var(--c-n6-rgb) / .06)!important}
@media (hover:hover){html body:not(#sy0):not(#sy1) .wdc:hover,html body:not(#sy0):not(#sy1) .shopList>*:hover,html body:not(#sy0):not(#sy1) #stageList>*:hover,html body:not(#sy0):not(#sy1) .nc:hover,html body:not(#sy0):not(#sy1) #choices>*:hover,html body:not(#sy0):not(#sy1) #eventChoices>*:hover{border-color:var(--c-primary)!important;box-shadow:0 0 0 1px var(--c-primary),0 0 14px rgb(var(--c-primary-rgb) / .35)!important}}
/* 文字：标题不发光，只用明度区分层级 */
html body:not(#sy0):not(#sy1) .drawer h2,html body:not(#sy0):not(#sy1) #wd46 header b,html body:not(#sy0):not(#sy1) #night46 header b,html body:not(#sy0):not(#sy1) .overlay .modal h2,html body:not(#sy0):not(#sy1) #run46 h3,html body:not(#sy0):not(#sy1) #pachi46 header b,.rm46 h3{color:var(--c-text-1)!important;text-shadow:0 1px 2px rgb(var(--c-n0-rgb) / .8)!important}
html body:not(#sy0):not(#sy1) .drawer .dhead h2,html body:not(#sy0):not(#sy1) #wd46 .box>header>b,html body:not(#sy0):not(#sy1) #night46 .box>header>b,html body:not(#sy0):not(#sy1) .overlay .modal h2{border-left-color:var(--c-accent)!important}
.terminalLabel48 small,.levelMapBtn46 small,html body:not(#sy0):not(#sy1) .drawer .dhead p{color:var(--c-text-2)!important;opacity:1!important}
html body:not(#sy0):not(#sy1) .drawer p,html body:not(#sy0):not(#sy1) .drawer small,html body:not(#sy0):not(#sy1) #wd46 .note,html body:not(#sy0):not(#sy1) .overlay .modal .sub{color:var(--c-text-2)!important}
html body:not(#sy0):not(#sy1) .drawer .dhead,html body:not(#sy0):not(#sy1) #wd46 .box>header,html body:not(#sy0):not(#sy1) #night46 .box>header{border-bottom:1px solid var(--c-line-strong)!important;box-shadow:none!important}
/* Logo：去掉大面积辉光，只保留主色/强调色的细错位 */
html body:not(#sy0):not(#sy1) #menu #coverTitle36>b{color:var(--c-text-1)!important;text-shadow:2px 0 0 rgb(var(--c-accent-rgb) / .55),-1px 0 0 rgb(var(--c-primary-rgb) / .7),0 2px 6px rgb(var(--c-n0-rgb) / .8)!important;filter:none!important}
html body:not(#sy0):not(#sy1) #menu #coverTitle36>span{background:var(--c-primary)!important;color:var(--c-on-primary)!important}
html body:not(#sy0):not(#sy1) #menu #coverTitle36::after{color:var(--c-text-2)!important}
/* 入口卡片：中性边框，悬停才亮主色；出击 = 主色主键（与立绘的靛蓝同色相，不再用红） */
html body:not(#sy0):not(#sy1) #menu #tacticalDeck48>button,html body:not(#sy0):not(#sy1) #menu #modeRow46>button{border:1px solid var(--c-line-strong)!important;box-shadow:inset 0 1px 0 rgb(var(--c-n6-rgb) / .08),0 6px 16px rgb(var(--c-n0-rgb) / .5)!important}
@media (hover:hover){html body:not(#sy0):not(#sy1) #menu #tacticalDeck48>button:hover,html body:not(#sy0):not(#sy1) #menu #modeRow46>button:hover{border-color:var(--c-primary)!important;box-shadow:0 0 0 1px var(--c-primary),0 0 16px rgb(var(--c-primary-rgb) / .4)!important}}
html body:not(#sy0):not(#sy1) #menu #tacticalDeck48 #start{background-image:linear-gradient(100deg,rgb(var(--c-primary-rgb) / .92) 0%,rgb(var(--c-primary-rgb) / .55) 45%,rgb(var(--c-n0-rgb) / .05) 80%),url(${A("ui/polish2/card_start.webp")})!important;border:1px solid var(--c-primary-strong)!important;box-shadow:0 0 0 1px rgb(var(--c-primary-rgb) / .5),0 0 22px rgb(var(--c-primary-rgb) / .35)!important}
html body:not(#sy0):not(#sy1) #menu #tacticalDeck48 #start .terminalLabel48 b,html body:not(#sy0):not(#sy1) #menu #tacticalDeck48 #start .terminalLabel48 small,html body:not(#sy0):not(#sy1) #menu #tacticalDeck48 #start .terminalIcon48{color:var(--c-on-primary)!important;text-shadow:none!important}
html body:not(#sy0):not(#sy1) #menu #tacticalDeck48 #start .terminalLabel48 b{text-shadow:2px 0 0 rgb(var(--c-n6-rgb) / .5)!important}
html body:not(#sy0):not(#sy1) #start.sy-guide{animation:syGuide2 1.6s ease-in-out infinite!important}
@keyframes syGuide2{0%,100%{box-shadow:0 0 0 1px rgb(var(--c-primary-rgb) / .5),0 0 10px rgb(var(--c-primary-rgb) / .3)}50%{box-shadow:0 0 0 2px var(--c-n6),0 0 28px rgb(var(--c-primary-rgb) / .7)}}
html body:not(#sy0):not(#sy1) #start .sy-tip{background:var(--c-accent)!important;color:var(--c-on-accent)!important}
/* 底栏：未选中 = 中性文字；选中 = 主色文字 + 主色下划线 + 强调色菱形 */
html body:not(#sy0):not(#sy1) #menu .homeNav46>button b{color:var(--c-text-2)!important}
html body:not(#sy0):not(#sy1) #menu .homeNav46>button[data-sy-on]{background:linear-gradient(0deg,rgb(var(--c-primary-rgb) / .18),transparent 80%)!important}
html body:not(#sy0):not(#sy1) #menu .homeNav46>button[data-sy-on] b{color:var(--c-primary)!important}
html body:not(#sy0):not(#sy1) #menu .homeNav46>button[data-sy-on]::before{background:var(--c-primary)!important;box-shadow:0 0 8px rgb(var(--c-primary-rgb) / .6)!important}
html body:not(#sy0):not(#sy1) #menu .homeNav46>button[data-sy-on]::after{background:var(--c-accent)!important;box-shadow:none!important}
html body:not(#sy0):not(#sy1) #menu .homeNav46>button .terminalIcon48{filter:saturate(.35) brightness(.9)}
html body:not(#sy0):not(#sy1) #menu .homeNav46>button[data-sy-on] .terminalIcon48{filter:drop-shadow(0 0 5px rgb(var(--c-primary-rgb) / .7))!important}
/* 活动卡、时段标签 */
html body:not(#sy0):not(#sy1) #menu .terminalActivity48{border:1px solid var(--c-line-strong)!important}
html body:not(#sy0):not(#sy1) #syTod{color:var(--c-text-2)!important;border-left-color:var(--c-primary)!important}
/* 战斗 HUD：功能色语义化 */
html body:not(#sy0):not(#sy1) #hud #hpF{background:var(--c-accent)!important;box-shadow:none!important}html body:not(#sy0):not(#sy1) #hud #shF{background:var(--c-primary)!important}html body:not(#sy0):not(#sy1) #hud #xpF{background:var(--c-rare-ssr)!important}
html body:not(#sy0):not(#sy1) #hud .bar{box-shadow:inset 0 0 0 1px var(--c-line-strong)!important;background:rgb(var(--c-n0-rgb) / .75)!important}
html body:not(#sy0):not(#sy1) #hud .rinfo #time{color:var(--c-text-1)!important;text-shadow:0 2px 4px rgb(var(--c-n0-rgb) / .8)!important}
html body:not(#sy0):not(#sy1) #hud .rinfo #kill,html body:not(#sy0):not(#sy1) #hud #stageHud{color:var(--c-text-2)!important}
html body:not(#sy0):not(#sy1) #hud .act,html body:not(#sy0):not(#sy1) #hud #pause{background:linear-gradient(160deg,var(--c-n3),var(--c-n2))!important;color:var(--c-primary-strong)!important;filter:drop-shadow(0 0 1px var(--c-primary)) drop-shadow(0 0 5px rgb(var(--c-primary-rgb) / .45))!important;box-shadow:none!important}
html body:not(#sy0):not(#sy1) #hud [id*="atk"],html body:not(#sy0):not(#sy1) #hud [id*="attack"],html body:not(#sy0):not(#sy1) #hud [class*="atk"],html body:not(#sy0):not(#sy1) #hud [class*="main"]{background:radial-gradient(circle,var(--c-primary),rgb(var(--c-primary-rgb) / .6) 70%)!important;color:var(--c-on-primary)!important;filter:drop-shadow(0 0 8px rgb(var(--c-primary-rgb) / .6))!important}
html body:not(#sy0):not(#sy1) #hud #combo{color:var(--c-rare-ssr)!important;text-shadow:0 2px 4px rgb(var(--c-n0-rgb) / .8)!important}
/* 弹窗按钮：主操作 = 主色，次操作 = 中性描边 */
html body:not(#sy0):not(#sy1) .overlay .modal button.primary,html body:not(#sy0):not(#sy1) #result .actions .primary{background:var(--c-primary)!important;color:var(--c-on-primary)!important;box-shadow:0 0 14px rgb(var(--c-primary-rgb) / .35)!important}
html body:not(#sy0):not(#sy1) .overlay .modal button.secondary,html body:not(#sy0):not(#sy1) #result .actions .secondary{background:transparent!important;color:var(--c-text-1)!important;border:1px solid var(--c-line-strong)!important}
/* 旧界面按钮统一走令牌：卡片内的行动按钮 = 主色实心；页签 = 中性，选中 = 主色；不可用 = 中性弱化 */
html body:not(#sy0):not(#sy1) .drawer .dbody button:not(.close):not([data-shop]):not([data-tab]):not([data-gtab]):not([data-rtab]):not(.on),html body:not(#sy0):not(#sy1) #wd46 .box button:not(.x),html body:not(#sy0):not(#sy1) #night46 .box button:not(.x){background:var(--c-primary)!important;background-image:none!important;color:var(--c-on-primary)!important;border:1px solid transparent!important;box-shadow:none!important;text-shadow:none!important}
html body:not(#sy0):not(#sy1) .drawer [class*="Tabs"] button,html body:not(#sy0):not(#sy1) .drawer [class*="modeBar"] button,html body:not(#sy0):not(#sy1) .drawer [class*="tabs"] button,html body:not(#sy0):not(#sy1) #wd46 nav button,html body:not(#sy0):not(#sy1) .drawer .dbody nav button,html body:not(#sy0):not(#sy1) #night46 .rt button,html body:not(#sy0):not(#sy1) .archiveDock46 button,html body:not(#sy0):not(#sy1) .drawer [class*="side"] button{background:var(--c-surface-2)!important;color:var(--c-text-2)!important;border:1px solid var(--c-line)!important}
html body:not(#sy0):not(#sy1) .drawer [class*="Tabs"] button.on,html body:not(#sy0):not(#sy1) .drawer [class*="modeBar"] button.on,html body:not(#sy0):not(#sy1) .drawer [class*="tabs"] button.on,html body:not(#sy0):not(#sy1) #wd46 nav button.on,html body:not(#sy0):not(#sy1) .drawer .dbody nav button.on,html body:not(#sy0):not(#sy1) #night46 .rt button.on,html body:not(#sy0):not(#sy1) .drawer [class*="side"] button.on{background:var(--c-surface-2)!important;color:var(--c-primary)!important;border-color:var(--c-primary)!important;box-shadow:inset 3px 0 0 var(--c-primary)!important}
html body:not(#sy0):not(#sy1) .drawer .dbody button:disabled,html body:not(#sy0):not(#sy1) .drawer .dbody button.poor,html body:not(#sy0):not(#sy1) .drawer .dbody button.owned,html body:not(#sy0):not(#sy1) .drawer .dbody button[aria-disabled="true"]{background:var(--c-surface-2)!important;color:var(--c-text-3)!important;border-color:var(--c-line)!important}
html body:not(#sy0):not(#sy1) .drawer .shopMoney,html body:not(#sy0):not(#sy1) .drawer [class*="Money"],html body:not(#sy0):not(#sy1) .drawer [class*="wallet"],html body:not(#sy0):not(#sy1) .drawer [class*="Wallet"],html body:not(#sy0):not(#sy1) #shopWallet44{background:var(--c-surface-2)!important;color:var(--c-text-1)!important;border:1px solid var(--c-line)!important}
html body:not(#sy0):not(#sy1) .drawer .close,html body:not(#sy0):not(#sy1) #wd46 .x,html body:not(#sy0):not(#sy1) #night46 .x{background:var(--c-surface-2)!important;color:var(--c-text-1)!important;border:1px solid var(--c-line-strong)!important}
html body:not(#sy0):not(#sy1) .drawer .shopNotice,html body:not(#sy0):not(#sy1) .drawer [class*="Notice"],html body:not(#sy0):not(#sy1) .drawer [class*="notice"]{background:var(--c-surface-2)!important;border:1px solid var(--c-line)!important;border-left:3px solid var(--c-accent)!important;color:var(--c-text-2)!important}
html body:not(#sy0):not(#sy1) .drawer button[data-shop],html body:not(#sy0):not(#sy1) .drawer button[data-tab],html body:not(#sy0):not(#sy1) .drawer button[data-gtab],html body:not(#sy0):not(#sy1) .drawer button[data-rtab],html body:not(#sy0):not(#sy1) .drawer [class*="Tabs"]>button,html body:not(#sy0):not(#sy1) .drawer [class*="tabs"]>button{background:var(--c-surface-2)!important;background-image:none!important;color:var(--c-text-2)!important;border:1px solid var(--c-line)!important}
html body:not(#sy0):not(#sy1) .drawer button[data-shop].on,html body:not(#sy0):not(#sy1) .drawer button[data-tab].on,html body:not(#sy0):not(#sy1) .drawer button[data-gtab].on,html body:not(#sy0):not(#sy1) .drawer button[data-rtab].on,html body:not(#sy0):not(#sy1) .drawer [class*="Tabs"]>button.on,html body:not(#sy0):not(#sy1) .drawer [class*="tabs"]>button.on{color:var(--c-primary)!important;border-color:var(--c-primary)!important;box-shadow:inset 3px 0 0 var(--c-primary)!important}
`;
  var st = document.createElement("style"); st.id = "syStatic"; st.textContent = css; document.head.appendChild(st);
  // 底栏选中态：最近打开的入口保持高亮，直到它的面板关掉
  function sync() { var open = document.querySelector(".drawer:not(.hidden)"), want = open ? open.id.replace(/Drawer$/, "") : "stage"; document.querySelectorAll(".homeNav46>[data-open]").forEach(function (b) { var on = b.dataset.open === want; if (b.hasAttribute("data-sy-on") !== on) { if (on) b.setAttribute("data-sy-on", ""); else b.removeAttribute("data-sy-on"); } }); } /* 用 data 属性而不是 class 标记选中态，避免与 class 观察器互相触发 */
  function guide() { try { var sv = JSON.parse(localStorage.getItem("sakurayoV3") || "{}"), b = document.getElementById("start"); if (!b || (sv.done && sv.done.length) || b.querySelector(".sy-tip")) return; b.classList.add("sy-guide"); var t = document.createElement("span"); t.className = "sy-tip"; t.textContent = "START ▶ 从这里开始第一战"; b.appendChild(t); } catch (e) { } }
  var CODES = { stageDrawer: "OPS-01 // 关卡", gachaDrawer: "SUP-02 // 寻访", shopDrawer: "DEP-03 // 补给", rosterDrawer: "INV-04 // 仓库", archiveDrawer: "ARC-05 // 档案", trialsDrawer: "TRL-06 // 试炼", storyDrawer: "LOG-07", achDrawer: "ACH-08", talentDrawer: "TAL-09", ascDrawer: "ASC-10" };
  function codes() { Object.keys(CODES).forEach(function (id) { var h = document.querySelector("#" + id + " .dhead"); if (h && !h.dataset.syCode) h.dataset.syCode = CODES[id]; }); [["#wd46 .box>header", "WRD-11 // 衣橱"], ["#night46 .box>header", "NGT-12 // 夜行"]].forEach(function (q) { var h = document.querySelector(q[0]); if (h && !h.dataset.syCode) h.dataset.syCode = q[1]; }); }
  function init() { sync(); guide(); codes(); new MutationObserver(codes).observe(document.body, { childList: true }); var mo = new MutationObserver(sync); document.querySelectorAll(".drawer").forEach(function (d) { mo.observe(d, { attributes: true, attributeFilter: ["class"] }); }); /* 只观察抽屉本身，不观察整棵 body（战斗中 class 变化极频繁） */ }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})(typeof window !== "undefined" ? window : globalThis);
