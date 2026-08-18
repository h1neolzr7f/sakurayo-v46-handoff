(function (global) {
  "use strict";

  var VERSION = "4.7.0";
  var portraitTaps = 0;
  var portraitStamp = 0;
  var TAP_WINDOW = 1200;
  var CHEAT_TOAST = "镜界后门已打开。樱花币已入账。";

  var RATES = Object.freeze({
    N: 0.7,
    R: 0.22,
    SR: 0.07,
    SSR: 0.01,
    pitySSR: 80,
    pitySR: 10,
    single: 160,
    ten: 1440,
    cheat: 9999,
    taps: 10,
  });

  var DEFAULT_SHOWN = Object.freeze(["sayo_echo", "aya_petal"]);

  var CARDS = Object.freeze([
    { id: "sayo_echo", n: "小夜·镜中残影", r: "N", tag: "证词残页", d: "回收演习里裁下的半张立绘。入册叠一层镜界火力。" },
    { id: "aya_petal", n: "绫·花瓣证词", r: "N", tag: "证词残页", d: "居合前落下的花瓣拓本。入册加伤，重复再叠一层。" },
    { id: "rion_edge", n: "凛音·刀光残页", r: "R", tag: "道场残简", d: "黄泉流未署名的一页。刀光入册，刃口更利。" },
    { id: "night_radio", n: "夜话电台贴纸", r: "R", tag: "夜话残响", d: "吐槽电台的备用台标。贴上名册，也写入弹芯。" },
    { id: "shrine_seal", n: "神社封条拓本", r: "R", tag: "鸟居拓本", d: "第一章鸟居下揭下的封条影。封条入册，火力开印。" },
    { id: "void_ticket", n: "主神回收券影", r: "SR", tag: "主神残券", d: "虚空圣所的回收券影。入册兑换一层高难火力。" },
    { id: "cherry_crown", n: "樱冠残片", r: "SR", tag: "樱冠残片", d: "镜界冠冕裂开后的一片。好看，也加伤害。" },
    { id: "last_witness", n: "终章证人立绘", r: "SSR", tag: "终章证人", d: "碎镜后面那个人终于肯露面。证人入册，火力封顶。" },
    { id: "sayo_318", n: "小夜·第318号", r: "N", tag: "镜像编号", d: "镜界给她排了编号，她用每一次选择把编号改回名字。" },
    { id: "aya_channel", n: "绫·未送达频道", r: "N", tag: "雨夜频道", d: "那句没有送达的拒绝终于穿过雨夜。救援必须允许被拒绝。" },
    { id: "rion_names", n: "凛音·同门名册", r: "R", tag: "黄泉名册", d: "她没有继承无名的数据，只把每位同门的名字送回剑冢。" },
    { id: "rin_signal", n: "雨宫凛·安全频道", r: "R", tag: "电台证词", d: "尸潮覆盖城市后仍未中断的人工频道。有人一直在另一端值守。" },
    { id: "corp_contract", n: "零号企业·回收合同", r: "R", tag: "事故原件", d: "把人格写成资产的原始合同。封条完整，良心栏从未存在。" },
    { id: "sister_reply", n: "妹妹频道·拒绝救援", r: "SR", tag: "自主权证词", d: "她没有请求被复活，只请求姐姐把选择权还给自己。" },
    { id: "swordmaster_oath", n: "无名剑主·最后一式", r: "SR", tag: "黄泉残响", d: "最后一式没有被上传。剑主把空白留给仍然活着的继承人。" },
    { id: "mirror_twins", n: "镜后双生证词", r: "SSR", tag: "双生证人", d: "原本与备份都不必争夺唯一名额。镜后第一次站着两个完整的名字。" },
  ]);

  var CARD_MAP = Object.create(null);
  CARDS.forEach(function (card) {
    CARD_MAP[card.id] = card;
  });

  var BY_RARITY = { N: [], R: [], SR: [], SSR: [] };
  CARDS.forEach(function (card) {
    BY_RARITY[card.r].push(card);
  });

  var BANNER_UP = Object.freeze({
    moon: Object.freeze(["sayo_echo", "sayo_318", "last_witness", "cherry_crown"]),
    fate: Object.freeze(["aya_petal", "aya_channel", "sister_reply", "mirror_twins"]),
    normal: Object.freeze([]),
  });

  var LOBBY_CSS =
    "html,body{width:100%;height:100%;overscroll-behavior:none}" +
    ".homeNav46{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:6px}" +
    ".homeNav46 button{min-height:58px;padding:8px 2px;border-radius:14px;border:1px solid #ff9bcc55;background:linear-gradient(180deg,#2a183ef2,#120c22f5);color:#fff8fb;font:800 11px/1.15 system-ui;letter-spacing:.06em}" +
    ".homeNav46 button span{display:grid;place-items:center;width:28px;height:28px;margin:0 auto 4px;border-radius:9px;background:#ff72b428;color:#ffe6f3;font-size:12px;overflow:visible}" +
    ".homeNav46 button span img{display:block!important;width:100%;height:100%;border-radius:8px;object-fit:cover;visibility:visible;opacity:1}" +
    "#menu.homeDock46 .start,#menu .start{background:radial-gradient(circle at 16% 78%,#ffe6a355 0 7%,transparent 8%),radial-gradient(circle at 86% 18%,#fff6 0 5%,transparent 6%),linear-gradient(115deg,#ff8ac4 0%,#f35aa6 46%,#f2c75d 100%);border:1px solid #ffe6a3aa;box-shadow:0 12px 32px #f35aa666,0 0 22px #f2c75d33,inset 0 1px #fff8;font-weight:1000;letter-spacing:.42em;text-shadow:0 2px 10px #3a106688}" +
    "#menu.homeDock46 .heroLive46{left:0;right:auto;overflow:hidden}" +
    "#archiveDrawer .archiveDock46{display:grid;gap:10px}" +
    "#archiveDrawer .archiveDock46 button{padding:14px 12px;border-radius:14px;border:1px solid #ff9bcc44;background:linear-gradient(135deg,#221436,#120c20);color:#fff;text-align:left;font:800 14px/1.3 system-ui}" +
    ".drawer.wishDrawer46{padding:0;background:#060410;overflow:hidden}" +
    ".wishDrawer46>.dhead{position:absolute;z-index:30;inset:0 0 auto 0;max-width:none;width:100%;box-sizing:border-box;margin:0;padding:max(8px,env(safe-area-inset-top)) 10px 8px;background:transparent;pointer-events:none}" +
    ".wishDrawer46>.dhead h2{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}" +
    ".wishDrawer46>.dhead .close{pointer-events:auto;width:36px;height:36px;margin-left:auto;border-radius:50%;background:#0b0818cc;border:1px solid #ffe6a355;color:#fff7fb}" +
    ".wishDrawer46>.dbody{display:block;max-width:none;margin:0;padding:0;height:100%;min-height:100%;gap:0}" +
    ".wishStage46{position:relative;min-height:100%;min-height:100dvh;height:100%;overflow:hidden;background:radial-gradient(circle at 28% 18%,#4a1d55 0%,#1a1030 38%,#060410 100%)}" +
    ".wishStage46:before{content:\"\";position:absolute;inset:0;background:radial-gradient(circle at 16% 20%,#ff72b433 0 4%,transparent 42%),radial-gradient(circle at 80% 16%,#ffe08a26 0 3%,transparent 38%),radial-gradient(circle at 60% 72%,#7a3dff28 0 5%,transparent 44%);pointer-events:none;animation:wishDrift46 8s ease-in-out infinite}" +
    ".wishBanner46{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none}" +
    ".wishHero46{position:absolute;z-index:2;left:-4%;bottom:-6%;width:58%;height:118%;object-fit:contain;object-position:left bottom;background:transparent!important;pointer-events:none;-webkit-mask-image:linear-gradient(to top,transparent 0%,#000 12%,#000 100%);mask-image:linear-gradient(to top,transparent 0%,#000 12%,#000 100%)}" +
    ".wishPetals46{position:absolute;inset:0;z-index:3;pointer-events:none;overflow:hidden}" +
    ".wishPetals46 i{position:absolute;top:-12%;width:7px;height:9px;border-radius:0 70% 0 70%;background:#ff9bcc99;box-shadow:0 0 8px #ff9bcc66;animation:petalFall46 11s linear infinite}" +
    ".wishTitle46{position:absolute;z-index:4;top:max(14px,calc(env(safe-area-inset-top) + 6px));right:16px;left:auto;text-align:right;max-width:58%;pointer-events:none}" +
    ".wishTitle46 h3{margin:0;font-size:clamp(26px,5.6vw,40px);letter-spacing:.28em;color:#fff7fb;text-shadow:0 0 22px #ff9bcc99,0 4px 18px #05020d}" +
    ".wishTitle46 p{margin:6px 0 0;color:#ffe7a3;font-size:11px;letter-spacing:.18em;text-shadow:0 2px 10px #05020d}" +
    ".wishPity46{position:absolute;z-index:4;left:12px;right:12px;bottom:118px;padding:8px 10px;border-radius:14px;background:#0b0818cc;border:1px solid #ffe6a333}" +
    ".pityRow46{display:flex;align-items:center;gap:8px;margin-top:6px}" +
    ".pityRow46:first-child{margin-top:0}" +
    ".pityRow46 span{min-width:11.5em;color:#ffe7a3;font-size:10px;letter-spacing:.08em;text-shadow:0 1px 8px #05020d;white-space:nowrap}" +
    ".pityRail46{flex:1;height:8px;border-radius:99px;background:#ffe6a355;overflow:hidden;box-shadow:inset 0 0 0 1px #ffe6a322,0 0 10px #ffe08a33}" +
    ".pityRail46 i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#ffe08a,#ffd36b 70%,#fff4c4);box-shadow:0 0 12px #ffd36b}" +
    ".pityRow46.sr .pityRail46 i{background:linear-gradient(90deg,#c18cff,#9c8cff)}" +
    ".wishDock46{position:absolute;z-index:5;left:0;right:0;bottom:0;padding:10px 12px calc(12px + env(safe-area-inset-bottom));background:linear-gradient(180deg,#06041000,#060410ee 34%,#060410)}" +
    ".wishPills46{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 8px}" +
    ".wishPills46 b{padding:4px 10px;border-radius:999px;background:#0b0818cc;border:1px solid #ffe6a355;color:#ffe7a3;font-size:10px;letter-spacing:.1em}" +
    ".gachaActions46{display:grid;grid-template-columns:1fr 1fr;gap:10px}" +
    ".gachaActions46 button{min-height:54px;border-radius:16px;border:1px solid #ff9bcc66;color:#fff;font:800 15px/1.1 system-ui;letter-spacing:.14em;box-shadow:0 10px 24px #05020d66}" +
    ".gachaActions46 button small{display:block;margin-top:3px;font:700 10px/1 system-ui;letter-spacing:.08em;opacity:.88}" +
    ".gachaActions46 button.poor{opacity:.42}" +
    "#gachaPull1{background:linear-gradient(180deg,#ff86cc,#ff3d9a 58%,#b02078);border-color:#ffb6d888}" +
    "#gachaPull10{background:linear-gradient(180deg,#ffe08a,#f0c14a 42%,#d8892b);border-color:#ffe6a3aa;color:#2a1608}" +
    "#gachaReveal46{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:max(44px,env(safe-area-inset-top)) 12px calc(16px + env(safe-area-inset-bottom));background:radial-gradient(circle at 50% 40%,#4a2878ee,#12081cf6 68%)}" +
    "#gachaReveal46:before{content:\"\";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 50% 42%,#f35aa655 0 12%,transparent 58%);opacity:0}" +
    "#gachaReveal46.isBurst:before{animation:revealBurst46 .55s ease}" +
    ".revealHead46{position:relative;z-index:1;margin:0 0 12px;text-align:center}" +
    ".revealHead46 em{display:block;color:#f2c75d;font:800 11px/1 system-ui;letter-spacing:.28em;font-style:normal}" +
    ".revealHead46 b{display:block;margin-top:6px;font-size:22px;letter-spacing:.2em}" +
    ".revealSum46{display:none;margin:10px 0 0;color:#ffe7a3;font:800 12px/1 system-ui;letter-spacing:.12em}" +
    "#gachaReveal46.isDone .revealSum46{display:block}" +
    "#gachaReveal46:not(.isDone) .revealTake46,#gachaReveal46:not(.isDone) .revealAgain46{visibility:hidden}" +
    "#gachaReveal46.isTest .revealTake46,#gachaReveal46.isTest .revealAgain46{visibility:visible}" +
    ".revealGrid46{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-width:96%;perspective:1200px;opacity:0;transform:scale(.94)}" +
    "#gachaReveal46.isOpen .revealGrid46,#gachaReveal46.isTest .revealGrid46{opacity:1;transform:none;transition:opacity .28s ease,transform .28s ease}" +
    ".revealGrid46.ten{max-width:640px;gap:8px}" +
    "html.landscape46 .revealGrid46.ten{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));max-width:min(860px,92vw);width:min(860px,92vw)}" +
    "html.landscape46 .revealGrid46.ten .revealCard46{width:auto;height:110px}" +
    "html.landscape46 #gachaReveal46{padding:max(28px,env(safe-area-inset-top)) 10px calc(10px + env(safe-area-inset-bottom))}" +
    "html.landscape46 .revealHead46{margin:0 0 8px}" +
    "html.landscape46 .revealHead46 b{font-size:18px}" +
    "html.landscape46 .revealActs46{margin-top:10px}" +
    "html.landscape46.shortWindow46 .revealGrid46.ten .revealCard46{height:68px}" +
    "html.landscape46.shortWindow46 .revealGrid46.one .revealCard46{width:132px;height:168px}" +
    "html.landscape46.shortWindow46 .revealHead46 b{font-size:15px}" +
    "html.landscape46.shortWindow46 .revealSum46{margin:4px 0 0;font-size:10px}" +
    "html.landscape46.shortWindow46 .revealActs46{margin-top:6px}" +
    "html.landscape46.shortWindow46 .revealTake46,html.landscape46.shortWindow46 .revealSkip46,html.landscape46.shortWindow46 .revealAgain46{min-height:42px;min-width:72px;padding:0 14px}" +
    "@media(max-height:430px){html.landscape46 .revealGrid46.ten .revealCard46{height:68px}html.landscape46 .revealGrid46.one .revealCard46{width:132px;height:168px}html.landscape46 .revealHead46 b{font-size:15px}html.landscape46 .revealActs46{margin-top:6px}html.landscape46 .revealTake46,html.landscape46 .revealSkip46,html.landscape46 .revealAgain46{min-height:42px;min-width:72px;padding:0 14px}}" +
    ".revealCard46{position:relative;width:104px;height:146px;perspective:900px}" +
    ".revealGrid46.one .revealCard46{width:196px;height:276px}" +
    ".revealInner46{position:relative;width:100%;height:100%;transform-style:preserve-3d;-webkit-transform-style:preserve-3d;transition:transform .7s cubic-bezier(.2,.8,.2,1)}" +
    ".revealCard46.flipped .revealInner46{transform:rotateY(180deg)}" +
    ".revealFace46{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:12px;overflow:hidden;border:1px solid #ffffff22}" +
    ".revealFace46.back{background:#1a1230}" +
    ".revealFace46.back img,.revealFace46.front img{width:100%;height:100%;object-fit:cover;background:transparent}" +
    ".revealFace46.front{transform:rotateY(180deg);background:#140f24;display:flex;flex-direction:column;box-shadow:inset 0 0 0 1px #fff2}" +
    ".revealFace46.front img{flex:1;min-height:0}" +
    ".revealFace46.front b{display:block;padding:6px 4px 7px;font-size:10px;text-align:center;background:#0b0818cc;color:#fff7fb}" +
    ".revealFace46.front:after{content:\"\";position:absolute;inset:0;background:linear-gradient(115deg,transparent 28%,#fff7 48%,transparent 64%);transform:translateX(-130%);pointer-events:none}" +
    ".revealCard46.flipped .revealFace46.front:after{animation:revealShine46 .85s ease .12s both}" +
    ".revealGem46{position:absolute;z-index:3;top:7px;right:7px;min-width:28px;padding:3px 6px;border-radius:99px;background:#0b0818cc;color:#fff7fb;font:800 9px/1 system-ui;border:1px solid #fff3}" +
    ".revealNew46{position:absolute;z-index:3;top:7px;left:7px;padding:3px 6px;border-radius:6px;background:#ff3d9acc;color:#fff;font:800 9px/1 system-ui;letter-spacing:.12em}" +
    ".revealCard46.r-N .revealFace46,.revealCard46.r-N .revealGem46{border-color:#9ad0ff66}" +
    ".revealCard46.r-R .revealFace46,.revealCard46.r-R .revealGem46{border-color:#73e6c366}" +
    ".revealCard46.r-SR .revealFace46{border-color:#c18cff99;box-shadow:0 0 16px #9c8cff44}" +
    ".revealCard46.r-SSR .revealFace46{border-color:#ffe6a3;box-shadow:0 0 22px #ffd36b88}" +
    ".revealCard46.r-SSR.flipped .revealFace46.front{animation:ssrGlow46 1.4s ease-in-out infinite}" +
    ".revealActs46{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:16px}" +
    ".revealTake46,.revealSkip46,.revealAgain46{min-height:44px;min-width:72px;padding:0 22px;border-radius:999px;border:1px solid #ffe6a388;font:800 14px/1 system-ui;letter-spacing:.16em}" +
    ".revealTake46{background:linear-gradient(180deg,#ffe08a,#d8892b);color:#2a1608;box-shadow:0 10px 24px #05020d66}" +
    ".revealSkip46,.revealAgain46{background:#0b0818cc;color:#fff7fb}" +
    "#gachaReveal46.isTest .revealInner46,#gachaReveal46.isTest .revealFace46.front:after,#gachaReveal46.isTest .revealCard46.r-SSR.flipped .revealFace46.front,#gachaReveal46.isTest:before{transition:none;animation:none}" +
    ".revealCard46.r-SSR.burst46:after{content:\"\";position:absolute;inset:-8px;border-radius:16px;border:2px solid #f2c75d;box-shadow:0 0 28px #f2c75d88;pointer-events:none;animation:ssrBurst46 .7s ease}" +
    "@keyframes revealBurst46{0%{opacity:0}35%{opacity:1}100%{opacity:0}}" +
    "@keyframes ssrBurst46{0%{transform:scale(.7);opacity:0}40%{opacity:1}100%{transform:scale(1.15);opacity:0}}" +
    ".rosterStage46{min-height:100%;padding:max(52px,calc(env(safe-area-inset-top) + 40px)) 12px calc(16px + env(safe-area-inset-bottom));background:radial-gradient(circle at 18% 0,#ff72b428 0%,#1a1030 42%,#060410 100%)}" +
    ".rosterHead46{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:0 0 12px}" +
    ".rosterHead46 h3{margin:0;font-size:22px;letter-spacing:.28em}" +
    ".rosterHead46 span{color:#ffe7a3;font-size:11px;letter-spacing:.12em}" +
    "#rosterWall46{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}" +
    ".rosterSlot46{position:relative;min-height:210px;padding:0;border-radius:16px;overflow:hidden;background:linear-gradient(180deg,#1a132c,#100c1c);border:1px solid #ff9bcc33;text-align:center;color:inherit}" +
    ".rosterSlot46.lock{filter:none}" +
    ".rosterArt46{position:relative;height:158px;background:#0b0818}" +
    ".rosterArt46 img{width:100%;height:100%;object-fit:cover;object-position:center top;background:transparent}" +
    ".rosterSlot46.lock .rosterArt46 img{filter:brightness(.55)}" +
    ".rosterSlot46 i{position:absolute;z-index:2;top:8px;right:8px;display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#0b0818cc;color:#ffe6f3;font:800 9px/1 system-ui;font-style:normal;border:1px solid #fff3}" +
    ".rosterSlot46.lock i{display:none}" +
    ".rosterSlot46.r-N i{color:#9ad0ff;border-color:#9ad0ff66}" +
    ".rosterSlot46.r-R i{color:#73e6c3;border-color:#73e6c366}" +
    ".rosterSlot46.r-SR i{color:#c18cff;border-color:#c18cff88;box-shadow:0 0 10px #9c8cff55}" +
    ".rosterSlot46.r-SSR i{color:#ffe6a3;border-color:#ffe6a3aa;box-shadow:0 0 12px #ffd36b66}" +
    ".rosterVeil46{position:absolute;inset:0;display:grid;place-items:center;background:#08071388;color:#ffe6f3;font:800 12px/1 system-ui;font-style:normal;letter-spacing:.2em}" +
    ".rosterSlot46 b{display:block;padding:8px 6px 0;font-size:11px}" +
    ".rosterSlot46 small{display:block;margin:4px 0 8px;color:#bfb1d3;font-size:9px}" +
    "#rosterPeek46{position:absolute;inset:0;z-index:24;display:flex;align-items:center;justify-content:center;padding:18px;background:#060410ee}" +
    ".rosterPeekCard46{width:min(86vw,280px);border-radius:18px;overflow:hidden;border:1px solid #ffe6a355;background:#120c20;box-shadow:0 18px 40px #05020d88}" +
    ".rosterPeekCard46 img{display:block;width:100%;height:220px;object-fit:cover;background:#0b0818}" +
    ".rosterPeekCard46.lock img{filter:brightness(.4)}" +
    ".rosterPeekCard46 div{padding:12px 14px 16px}" +
    ".rosterPeekCard46 b{display:block;font-size:16px;letter-spacing:.08em}" +
    ".rosterPeekCard46 em{display:block;margin:4px 0 8px;color:#ffe7a3;font-size:11px;font-style:normal;letter-spacing:.16em}" +
    ".rosterPeekCard46 p{margin:0;color:#e7d7ef;font-size:12px;line-height:1.55}" +
    ".heroTap46{position:absolute;z-index:2;left:8%;width:36%;top:18%;bottom:28%;pointer-events:auto;background:transparent;border:0}" +
    "@keyframes wishDrift46{0%,100%{transform:translate3d(0,0,0);opacity:.88}50%{transform:translate3d(1.4%,-1%,0);opacity:1}}" +
    "@keyframes petalFall46{0%{transform:translate3d(0,-10%,0) rotate(0)}100%{transform:translate3d(18px,120vh,0) rotate(220deg)}}" +
    "@keyframes revealShine46{to{transform:translateX(130%)}}" +
    "@keyframes ssrGlow46{0%,100%{box-shadow:0 0 16px #ffd36b66}50%{box-shadow:0 0 34px #ffe08acc}}" +
    "@media(min-width:500px){#rosterWall46{grid-template-columns:repeat(4,minmax(0,1fr))}}" +
    "@media(orientation:landscape){" +
    "#menu.homeDock46 .heroLive46{pointer-events:none;left:0;width:54%;bottom:0}" +
    "#menu.homeDock46 .heroLiveBreath46{width:min(118vw,620px)}" +
    "#menu.homeDock46 .menu{width:min(42vw,400px);max-width:400px;padding:10px 14px calc(10px + env(safe-area-inset-bottom))}" +
    "#menu.homeDock46 .start{width:100%;margin:0 0 8px;letter-spacing:.42em}" +
    "#menu.homeDock46 .nav{width:100%;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;padding:8px;border-radius:18px}" +
    "#menu.homeDock46 .homeNav46 button{min-height:58px}" +
    "#menu.homeDock46 .stageMini{width:100%}" +
    "#menu.homeDock46 .charSelectPanel{position:relative;left:auto;right:auto;bottom:auto;width:100%}" +
    ".wishHero46{left:-2%;width:46%;height:124%;bottom:-8%}" +
    ".wishTitle46{right:4%;max-width:46%}" +
    ".wishDock46,.wishPity46{left:46%}" +
    "#rosterWall46{grid-template-columns:repeat(4,minmax(0,1fr))}" +
    ".rosterArt46{height:168px}" +
    ".heroTap46{left:10%;width:28%;top:16%;bottom:18%}" +
    "}" +
    "html.landscape46 #menu.homeDock46 .heroLive46{pointer-events:none;left:0;width:64%;top:0;bottom:0}" +
    "html.landscape46 #menu.homeDock46 .menu{width:100%;max-width:none;margin:0}" +
    "html.landscape46 .wishHero46{left:-4%;width:52%;height:142%;bottom:-13%}" +
    "html.landscape46 .wishTitle46{right:4%;max-width:46%}" +
    "html.landscape46 .wishDock46,html.landscape46 .wishPity46{left:46%}" +
    "html.landscape46 #rosterWall46{grid-template-columns:repeat(8,minmax(0,1fr));gap:8px}" +
    "html.landscape46 .rosterSlot46{min-height:150px;border-radius:13px}" +
    "html.landscape46 .rosterArt46{height:108px}" +
    "html.landscape46 .rosterSlot46 b{padding-top:6px;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
    "html.landscape46 .rosterSlot46 small{margin:3px 0 6px;font-size:8px}" +
    "html.landscape46 #archiveDrawer .archiveDock46{grid-template-columns:repeat(3,minmax(0,1fr))}" +
    "html.landscape46 #stageList{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}" +
    "#rotateHint46{display:none;position:fixed;z-index:80;left:50%;top:max(8px,env(safe-area-inset-top));transform:translateX(-50%);padding:6px 12px;border-radius:999px;background:#0b0818cc;border:1px solid #ffe6a355;color:#ffe7a3;font:800 11px/1 system-ui;letter-spacing:.12em;pointer-events:none;white-space:nowrap}" +
    "@media(orientation:portrait){" +
    "#rotateHint46{display:block}" +
    "}" +
    "html.tallWindow46 #rotateHint46{display:block}" +
    "@media(prefers-reduced-motion:reduce){.wishStage46:before,.wishPetals46 i,.revealInner46,.revealFace46.front:after,.revealCard46.r-SSR.flipped .revealFace46.front,#gachaReveal46.isBurst:before,.revealCard46.r-SSR.burst46:after{animation:none;transition:none}}";

  var ROOM_CSS =
    "#shopDrawer,#stageDrawer,#archiveDrawer,#talentDrawer,#storyDrawer,#ascDrawer,#achDrawer{background:radial-gradient(circle at 16% 0,#ff72b42e 0%,#1a1030 38%,#060410 100%)}" +
    "#shopDrawer>.dhead,#stageDrawer>.dhead,#archiveDrawer>.dhead,#talentDrawer>.dhead,#storyDrawer>.dhead,#ascDrawer>.dhead,#achDrawer>.dhead{max-width:none;width:100%;box-sizing:border-box;margin:0 0 10px;padding:8px 4px 10px;border-bottom:1px solid #ffe6a344;background:linear-gradient(180deg,#1a1238cc,#0b081800)}" +
    "#shopDrawer>.dhead h2,#stageDrawer>.dhead h2,#archiveDrawer>.dhead h2,#talentDrawer>.dhead h2,#storyDrawer>.dhead h2,#ascDrawer>.dhead h2,#achDrawer>.dhead h2{letter-spacing:.18em;color:#fff7fb;text-shadow:0 0 16px #ff9bcc66}" +
    "#shopDrawer>.dhead .close,#stageDrawer>.dhead .close,#archiveDrawer>.dhead .close,#talentDrawer>.dhead .close,#storyDrawer>.dhead .close,#ascDrawer>.dhead .close,#achDrawer>.dhead .close{border:1px solid #ffe6a355;background:#0b0818cc;color:#fff7fb}" +
    "#shopDrawer>.dbody,#stageDrawer>.dbody,#archiveDrawer>.dbody,#talentDrawer>.dbody,#storyDrawer>.dbody,#ascDrawer>.dbody,#achDrawer>.dbody{max-width:920px}" +
    "#shopDrawer .shopNotice{border:1px solid #ffe6a344;border-radius:14px;background:#120c20cc;color:#e7d7ef}" +
    "#shopDrawer .shopTabs40{display:grid;grid-template-columns:repeat(auto-fit,minmax(108px,1fr));gap:6px;padding:6px;border-radius:14px;background:#0b0818cc;border:1px solid #ff9bcc33}" +
    "#shopDrawer .shopTabs40 button{min-height:40px;border-radius:10px;border:1px solid #ff9bcc44;background:#1a1230;color:#fff7fb;letter-spacing:.06em}" +
    "#shopDrawer .shopTabs40 button.on{background:linear-gradient(180deg,#ffe08a,#d8892b);color:#2a1608;border-color:#ffe6a3aa}" +
    "#shopDrawer .skinCard,#shopDrawer .shopItem40{border:1px solid #ff9bcc33;background:linear-gradient(135deg,#1a132cf2,#100c1cee);border-radius:16px}" +
    "#shopWallet44{border:1px solid #ffe6a344;border-radius:14px;background:#120c20cc}" +
    ".modeBar46{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:0 0 12px}" +
    ".modeBar46 button{min-height:58px;padding:8px 6px;border-radius:14px;border:1px solid #ff9bcc44;background:linear-gradient(180deg,#221436,#120c20);color:#fff7fb;font:800 13px/1.15 system-ui;letter-spacing:.08em}" +
    ".modeBar46 button small{display:block;margin-top:4px;color:#ffe7a3;font:700 10px/1 system-ui;letter-spacing:.1em}" +
    ".modeBar46 button.on{border-color:#ffe6a3aa;background:linear-gradient(180deg,#ffe08a,#d8892b);color:#2a1608;box-shadow:0 8px 20px #05020d66}" +
    ".modeBar46 button.on small{color:#5a2a08}" +
    "#stageList .stageCard{min-height:168px;border:1px solid #ffe6a344;box-shadow:0 12px 28px #05020d55}" +
    "#stageList .stageCard h3{letter-spacing:.08em}" +
    "#stageList .stageCard button{border-radius:12px;border:1px solid #ff9bcc66;background:linear-gradient(180deg,#ff86cc,#b02078);color:#fff}" +
    "#archiveDrawer .archiveDock46{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}" +
    "#archiveDrawer .archiveDock46 button{min-height:92px;padding:16px 14px;border-radius:16px;border:1px solid #ffe6a344;background:linear-gradient(135deg,#2a183ef2,#120c22f5);display:flex;flex-direction:column;justify-content:flex-end;gap:4px}" +
    "#archiveDrawer .archiveDock46 button b{font:800 16px/1.2 system-ui;letter-spacing:.12em}" +
    "#archiveDrawer .archiveDock46 button small{color:#ffe7a3;font:700 11px/1.2 system-ui;letter-spacing:.08em}" +
    "#menu.homeDock46.lobbyWide46 .bg{filter:brightness(.78) saturate(1.05)}" +
    "#menu.homeDock46 .heroLive46{-webkit-mask-image:linear-gradient(to right,#000 0%,#000 78%,transparent 100%);mask-image:linear-gradient(to right,#000 0%,#000 78%,transparent 100%)}" +
    "#menu.homeDock46 .heroLiveBreath46{width:min(62vw,680px);height:100%}" +
    "#menu.homeDock46 .heroLiveBreath46:before{content:\"\";position:absolute;inset:18% 18% 0 18%;background:radial-gradient(ellipse at 50% 78%,#1a103066 0%,#12081c00 70%);pointer-events:none}" +
    "#menu.homeDock46 .heroLiveBreath46 img,.wishHero46{background:transparent!important;image-rendering:auto;filter:none}" +
    ".heroLive46.hasBlink:not(.livePuppet46) .heroLiveBlink46{animation:heroBlink46 5.4s steps(1) infinite}" +
    ".heroLive46.hasBlink .heroLiveBase46{opacity:1!important;animation:none!important}" +
    ".pityRail46{height:7px}" +
    "#shopDrawer .shopNotice{font-size:11px;line-height:1.4;padding:8px 12px}" +
    "#shopWallet44{padding:8px 12px;margin:0 0 8px}" +
    "#shopWallet44 p{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}" +
    "#shopDrawer .shopGroup40[data-shop-group=skins]{grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}" +
    "#shopDrawer .skinCard{display:flex;flex-direction:column;min-height:228px;padding:0;overflow:hidden}" +
    "#shopDrawer .skinPreview{width:100%;height:140px;border-radius:16px 16px 0 0}" +
    "#shopDrawer .skinCard>div{padding:8px 10px 0;flex:1}" +
    "#shopDrawer .skinCard>button{margin:8px 10px 10px}" +
    "#shopDrawer .skinCard p{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}" +
    "#shopDrawer .shopItem40{border-radius:16px;background:linear-gradient(135deg,#1a132cf2,#100c1cee);border:1px solid #ffe6a344}" +
    "#shopDrawer .shopIcon40{background:linear-gradient(180deg,#2a183e,#171027);border:1px solid #ff9bcc44}" +
    "#shopDrawer .shopItem40 button,#shopDrawer .shopUpgrade40{border:1px solid #ff9bcc66;background:linear-gradient(180deg,#ff86cc,#b02078);color:#fff}" +
    "#stageList .stageCard:after{background:linear-gradient(180deg,#08071400 22%,#080714f0)}" +
    "#stageList .stageCard .i{width:100%;padding:56px 14px 14px;box-sizing:border-box}" +
    "#stageList .stageCard p{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;max-height:2.7em}" +
    "#archiveDrawer .archiveDock46 button{background-size:cover;background-position:center;background-color:#120c22}" +
    "#talentDrawer .talent,#storyDrawer .storyCard,#ascDrawer .storyCard,#achDrawer .ach{border:1px solid #ffe6a344;border-radius:16px;background:linear-gradient(135deg,#1a132cf2,#100c1cee)}" +
    "#talentDrawer .talent button,#achDrawer .ach .claim{border-radius:12px;border:1px solid #ff9bcc66;background:linear-gradient(180deg,#ff86cc,#b02078);color:#fff}" +
    "#ascDrawer .dbody>.storyCard.open{border-color:#ffe6a366}" +
    "#careerSearch37{width:100%;box-sizing:border-box;min-height:40px;padding:8px 12px;border-radius:12px;border:1px solid #ffe6a355;background:#0b0818cc;color:#fff7fb}" +
    "#careerTabs38.filterTabs38,.filterTabs38{display:flex;flex-wrap:wrap;gap:6px;padding:6px;border-radius:14px;background:#0b0818cc;border:1px solid #ff9bcc33}" +
    "#careerTabs38 button,.filterTabs38 button{min-height:36px;padding:0 12px;border-radius:10px;border:1px solid #ff9bcc44;background:#1a1230;color:#fff7fb}" +
    "#careerTabs38 button.on,.filterTabs38 button.on{background:linear-gradient(180deg,#ffe08a,#d8892b);color:#2a1608;border-color:#ffe6a3aa}" +
    ".rosterSlot46.lock b{letter-spacing:.16em;color:#bfb1d3}" +
    ".rosterArt46:after{content:\"\";position:absolute;inset:auto 0 0;height:42%;background:linear-gradient(180deg,#100c1c00,#100c1cee)}" +
    ".homeRail46,.homeBanner46,.homeModes46,.homeStageProg46,.homeCoinPlus46,.homeRankBar46{display:none}" +
    "#menu.homeDock46 .homeRail46{display:flex;flex-direction:row;flex-wrap:wrap;justify-content:center;gap:6px;position:relative;margin:8px auto 0;padding:0 8px;z-index:8;pointer-events:auto}" +
    "#menu.homeDock46 .homeRail46 button{min-height:42px;min-width:52px;padding:6px 8px;border-radius:12px;border:1px solid #f35aa644;background:#120e27d4;color:#fff7fb}" +
    ".homeDeck46{display:contents}" +
    "@media(orientation:landscape){" +
    "#menu.homeDock46 .heroLive46{width:64%;left:0;bottom:0!important}" +
    "#menu.homeDock46 .heroLiveBreath46{width:min(58vw,680px);height:100%}" +
    "#menu.homeDock46 .menu{background:linear-gradient(180deg,#0b0818cc,#0b0818f2);border:1px solid #ffe6a328;border-radius:20px 0 0 0;box-shadow:-12px 0 40px #05020d66}" +
    "#shopDrawer>.dhead p,#shopDrawer .shopNotice{display:none}" +
    "#shopWallet44{display:flex;align-items:center;gap:14px;flex-wrap:wrap}" +
    "#shopWallet44 p,#shopWallet44 em{margin:0;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;flex:1}" +
    "#shopDrawer>.dbody,#stageDrawer>.dbody,#archiveDrawer>.dbody,#talentDrawer>.dbody,#storyDrawer>.dbody,#ascDrawer>.dbody,#achDrawer>.dbody{max-width:none;padding:0 18px 18px}" +
    "#archiveDrawer .archiveDock46{grid-template-columns:repeat(3,minmax(0,1fr));min-height:calc(100dvh - 88px);align-content:stretch}" +
    "#archiveDrawer .archiveDock46 button{min-height:240px}" +
    "#stageList{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}" +
    "#stageList .modeBar46{grid-column:1/-1}" +
    "#stageList .stageCard{min-height:210px}" +
    "#storyList,#achList{grid-template-columns:repeat(2,minmax(0,1fr))}" +
    "#talentList{grid-template-columns:1fr}" +
    "}" +
    "html.landscape46 #menu.homeDock46 .heroLive46{top:0;bottom:0!important;left:0;width:58%;-webkit-mask-image:linear-gradient(to right,#000 0%,#000 78%,transparent 100%);mask-image:linear-gradient(to right,#000 0%,#000 78%,transparent 100%)}" +
    "html.landscape46 #menu.homeDock46 .heroLiveBreath46{height:100%;width:min(58vw,680px)}" +
    "html.landscape46 #menu.homeDock46 .heroLiveBreath46 img{object-fit:contain;object-position:center 8%}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .heroLiveName46,html.landscape46:not(.portraitFallback46) #menu.homeDock46 #coverTitle36{display:none}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .menu{position:absolute;inset:0;width:100%;max-width:none;margin:0;padding:0;box-sizing:border-box;justify-content:unset;overflow:visible;background:transparent;border:0;border-radius:0;box-shadow:none;pointer-events:none}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .top{position:absolute;left:max(16px,env(safe-area-inset-left));right:max(16px,env(safe-area-inset-right));top:max(10px,env(safe-area-inset-top));margin:0;padding:0;display:flex;align-items:center;justify-content:space-between;gap:10px;z-index:7;pointer-events:auto}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .profile{display:flex!important;align-items:center;gap:10px;min-width:0;padding:4px 12px 4px 4px;border-radius:999px;background:#120e27d8;border:1px solid #f35aa655;box-shadow:0 0 16px #f35aa622}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .profile img{width:42px;height:42px;border-radius:50%;border:2px solid #f35aa6;box-shadow:0 0 12px #f35aa666}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .profile b{display:block;font-size:13px;letter-spacing:.08em;color:#fff7fb}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .profile small{display:block;margin-top:2px;color:#cfc4df;font-size:10px}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeRankBar46{display:block;width:88px;height:4px;margin-top:4px;border-radius:99px;background:#2a183e;overflow:hidden}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeRankBar46 i{display:block;height:100%;width:0;background:linear-gradient(90deg,#f35aa6,#f2c75d)}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .coins{display:flex;align-items:center;gap:8px;margin:0 0 0 auto;padding:4px 8px 4px 12px;border-radius:999px;background:#120e27ee;border:1px solid #f2c75d55;color:#ffe7a3}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeCoinPlus46{display:grid;place-items:center;width:28px;height:28px;padding:0;border:0;border-radius:50%;background:#f35aa6;color:#fff7fb;font:900 16px/1 system-ui}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .top .charSelectPanel{position:static!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;width:auto;margin:0 8px 0 auto;padding:0;background:transparent;border:0;box-shadow:none;z-index:8;pointer-events:auto;flex:0 0 auto}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .top .charSelectPanel .sectionTitle{display:none!important}" +
    "html.landscape46:not(.portraitFallback46) #homeWallet46{margin-left:0}" +
    "html.landscape46:not(.portraitFallback46) #homeWallet46 .homeChip46.prism,html.landscape46:not(.portraitFallback46) #homeWallet46 .homeChip46.shard{display:none!important}" +
    "html.landscape46:not(.portraitFallback46) #homeQuick46{gap:12px}" +
    "#menu.homeDock46 .charCard{min-width:42px;min-height:42px}" +
    "#settingsButton37{display:none!important}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .characterList{display:flex!important;flex-direction:row;gap:8px}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .charCard{width:42px;height:42px;min-width:42px;min-height:42px;max-width:42px;margin:0;aspect-ratio:auto;padding:1px;background:#120e27cc;border:0;box-shadow:none;flex-shrink:0;overflow:visible}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .charCard img{width:38px;height:38px;border-radius:50%;border:2px solid #ffd8e066;box-shadow:0 0 0 1px #05020d,0 0 12px #f35aa644}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .charCard.selected img{border-color:#f2c75d;box-shadow:0 0 0 2px #f2c75dcc,0 0 16px #f35aa688}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .charCard b,html.landscape46:not(.portraitFallback46) #menu.homeDock46 .charCard p,html.landscape46:not(.portraitFallback46) #menu.homeDock46 .charCard em,html.landscape46:not(.portraitFallback46) #menu.homeDock46 .charCard .selectedMark{display:none!important}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeDeck46{display:flex;flex-direction:column;position:absolute;right:max(16px,env(safe-area-inset-right));top:max(64px,calc(env(safe-area-inset-top) + 52px));bottom:max(86px,calc(env(safe-area-inset-bottom) + 76px));width:min(34vw,320px);gap:8px;z-index:6;pointer-events:none}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeDeck46 .stageMini,html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeDeck46 .homeModes46 button,html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeDeck46 #start,html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeDeck46 button{pointer-events:auto}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .stageMini{position:relative;width:100%;margin:0;flex:1 1 auto;min-height:96px;display:grid;grid-template-columns:1fr auto;grid-template-rows:auto 1fr auto;gap:4px 8px;padding:12px 14px 10px;border-radius:16px;overflow:hidden;background:#120e27ee;border:1px solid #69ddf266;box-shadow:0 0 0 1px #05020d,0 12px 28px #05020d66,inset 0 0 0 1px #69ddf222;backdrop-filter:none;cursor:pointer}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .stageMini img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.32;border-radius:0}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .stageMini>div,html.landscape46:not(.portraitFallback46) #menu.homeDock46 .stageMini h3,html.landscape46:not(.portraitFallback46) #menu.homeDock46 .stageMini p,html.landscape46:not(.portraitFallback46) #menu.homeDock46 .stageMini strong,html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeStageProg46{position:relative;z-index:1}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .stageMini h3{margin:0;font-size:15px;letter-spacing:.08em;color:#fff7fb}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .stageMini p{display:-webkit-box!important;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin:0;color:#cfc4df;font-size:11px;line-height:1.4}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .stageMini strong{align-self:start;font-size:12px;color:#69ddf2;letter-spacing:.08em}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeStageProg46{display:flex;align-items:center;gap:8px;grid-column:1/-1;height:8px}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeStageProg46 i{flex:1;height:4px;border-radius:99px;background:#2a183e;overflow:hidden}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeStageProg46 i:after{content:\"\";display:block;height:100%;width:var(--home-prog,0%);background:linear-gradient(90deg,#f35aa6,#f2c75d)}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeStageProg46 em{color:#ffe7a3;font:700 10px/1 system-ui;font-style:normal}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeModes46{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;flex:0 0 auto}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeModes46.two46{grid-template-columns:1fr 1fr}" +
    "#homeModes46 [data-mode=mainGod][hidden],#homeModes46 [data-mode=mainGod].away46{display:none!important}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeModes46 button{min-height:44px;padding:6px 6px;border-radius:12px;border:1px solid #f35aa655;background:#120e27ee;color:#fff7fb;text-align:center;box-shadow:inset 0 0 0 1px #f35aa622}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeModes46 button i{display:none}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeModes46 button b{display:block;font-size:12px;letter-spacing:.06em}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeModes46 button small{display:block;margin-top:2px;color:#cfc4df;font:700 9px/1 system-ui;letter-spacing:.04em}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeModes46 button.on{border-color:#f2c75d;box-shadow:0 0 16px #f35aa644,inset 0 0 0 1px #f2c75d66}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeModes46 button.lock{opacity:.55}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeStageHint46{position:absolute;z-index:2;right:10px;bottom:8px;padding:2px 7px;border-radius:999px;background:#120e27cc;border:1px solid #69ddf266;color:#69ddf2;font:800 9px/1 system-ui;letter-spacing:.08em}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .start{width:100%;margin:0;flex:0 0 auto;min-height:52px;padding:0 18px;letter-spacing:.18em;font-size:20px;border-radius:8px;clip-path:none;display:flex;align-items:center;justify-content:center;gap:8px}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .start small{font-size:10px;letter-spacing:.22em;opacity:.88}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .start b{letter-spacing:0;font-size:16px}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .nav.homeNav46{position:absolute;left:50%;bottom:max(10px,env(safe-area-inset-bottom));transform:translateX(-50%);width:min(560px,60vw);padding:5px 8px;gap:6px;border-radius:20px;background:#0b0818d8;border:1px solid #f35aa644;box-shadow:0 10px 28px #05020d88;z-index:8;pointer-events:auto}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeNav46 button{min-height:48px;padding:4px 2px;border-radius:14px;background:transparent;border:0;color:#fff7fb}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeNav46 button span{width:24px;height:24px;margin:0 auto 2px;border-radius:50%;background:#f35aa622}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeNav46 button:after{content:attr(data-en);display:block;margin-top:2px;color:#cfc4df;font:700 8px/1 system-ui;letter-spacing:.14em}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .utilityButtons37{position:static;width:auto;margin:0;max-width:none;z-index:8;display:grid!important;grid-template-columns:1fr!important}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .calmUtility39>button:not(#moreButton39){display:none!important}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .calmUtility39.open39>button{display:block!important;min-height:42px;padding:8px 10px}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .calmUtility39.open39>button:not(#moreButton39){display:block!important;min-height:42px}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 #moreButton39{min-height:42px;margin-left:10px;padding:0 12px;border-radius:999px;border:1px solid #f2c75d66;background:#120e27ee;color:#ffe7a3;letter-spacing:.14em;font-size:11px}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .calmUtility39.open39{position:fixed!important;top:max(52px,calc(env(safe-area-inset-top) + 44px));right:max(12px,env(safe-area-inset-right));bottom:auto;z-index:42!important;width:min(74vw,280px);max-height:min(68vh,280px);overflow:auto;padding:8px;border-radius:14px;background:#120e27f8;border:1px solid #f2c75d66;box-shadow:0 16px 36px #05020de8;grid-template-columns:repeat(2,1fr)!important}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeRail46{display:flex;flex-direction:column;position:absolute;left:max(12px,env(safe-area-inset-left));top:max(76px,calc(env(safe-area-inset-top) + 64px));transform:none;gap:6px;z-index:6;pointer-events:auto}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeRail46 button{min-height:46px;min-width:56px;padding:6px 8px;border-radius:12px;border:1px solid #f35aa644;background:#120e27d4;color:#fff7fb;text-align:center}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeRail46 button i{display:block;position:relative;width:16px;height:16px;margin:0 auto;color:#f35aa6;font:900 15px/1 system-ui;font-style:normal;overflow:visible}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeRail46 button b{display:block;margin-top:3px;font-size:11px;letter-spacing:.08em}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeRail46 button small{display:block;margin-top:2px;color:#cfc4df;font:700 8px/1 system-ui;letter-spacing:.12em}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeBanner46{display:grid;grid-template-columns:56px 1fr;align-items:center;gap:8px;position:absolute;left:max(80px,calc(env(safe-area-inset-left) + 72px));bottom:max(86px,calc(env(safe-area-inset-bottom) + 76px));width:min(220px,24vw);min-height:58px;padding:6px;border-radius:14px;border:1px solid #f2c75d55;background:#120e27ee;color:#fff7fb;text-align:left;z-index:6;pointer-events:auto}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeBanner46 img{width:56px;height:46px;object-fit:cover;border-radius:10px;background:#1a1230}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeBanner46 b{display:block;font-size:13px;letter-spacing:.1em}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeBanner46 small{display:block;margin-top:3px;color:#ffe7a3;font:700 9px/1 system-ui;letter-spacing:.16em}" +
    "html.portraitFallback46 #menu.homeDock46 .heroLive46{width:100%;left:0;right:0;top:0;bottom:34%}" +
    "html.portraitFallback46 #menu.homeDock46 .menu{width:100%;max-width:none;margin:0;border-radius:18px 18px 0 0}" +
    "html.portraitFallback46 #menu.homeDock46 .charSelectPanel{position:absolute!important;left:8px!important;right:auto!important;bottom:36%!important;width:auto}" +
    "html.portraitFallback46 #menu.homeDock46 .characterList{display:flex!important;flex-direction:column}" +
    "html.portraitFallback46 #menu.homeDock46 #coverTitle36{left:50%;right:auto;transform:translateX(-50%);text-align:center}" +
    "html.landscape46.shortWindow46 #menu.homeDock46 .heroLive46{width:62%}" +
    "html.landscape46.shortWindow46 #menu.homeDock46 .heroLiveBreath46{width:min(64vw,760px)}" +
    "html.landscape46.shortWindow46 #menu.homeDock46 .top{top:max(6px,env(safe-area-inset-top))}" +
    "html.landscape46.shortWindow46 #menu.homeDock46 .top .charSelectPanel{position:static!important;left:auto!important;top:auto!important;margin:0 6px 0 auto}" +
    "html.landscape46.shortWindow46 #menu.homeDock46 .homeDeck46{top:max(52px,calc(env(safe-area-inset-top) + 44px));bottom:max(72px,calc(env(safe-area-inset-bottom) + 62px));width:min(34vw,300px);gap:4px}" +
    "html.landscape46.shortWindow46 #menu.homeDock46 .stageMini{min-height:56px;padding:6px 10px}" +
    "html.landscape46.shortWindow46 #menu.homeDock46 .stageMini h3{font-size:13px}" +
    "html.landscape46.shortWindow46 #menu.homeDock46 .stageMini p,html.landscape46.shortWindow46 #menu.homeDock46 .homeStageProg46{display:none!important}" +
    "html.landscape46.shortWindow46 #menu.homeDock46 .homeModes46 button{min-height:36px;padding:4px 4px}" +
    "html.landscape46.shortWindow46 #menu.homeDock46 .homeModes46 button small{display:none}" +
    "html.landscape46.shortWindow46 #menu.homeDock46 .homeStageHint46{display:none}" +
    "html.landscape46.shortWindow46 #menu.homeDock46 .start{min-height:44px;font-size:16px;letter-spacing:.14em;clip-path:none}" +
    "html.landscape46.shortWindow46 #menu.homeDock46 .nav.homeNav46{bottom:max(6px,env(safe-area-inset-bottom));width:min(520px,58vw);padding:4px}" +
    "html.landscape46.shortWindow46 #menu.homeDock46 .homeNav46 button{min-height:44px}" +
    "html.landscape46.shortWindow46 #menu.homeDock46 .homeNav46 button:after{display:none}" +
    "html.landscape46.shortWindow46 #menu.homeDock46 .homeRail46{top:max(58px,calc(env(safe-area-inset-top) + 48px));gap:4px}" +
    "html.landscape46.shortWindow46 #menu.homeDock46 .homeRail46 button{min-width:42px;min-height:42px;padding:5px 8px}" +
    "html.landscape46.shortWindow46 #menu.homeDock46 .homeRail46 button small{display:none}" +
    "html.landscape46.shortWindow46 #menu.homeDock46 .homeBanner46{display:none}" +
    "html.landscape46.shortWindow46 #menu.homeDock46 #moreButton39{min-height:42px;font-size:10px}" +
    "html.landscape46.shortWindow46 #menu.homeDock46 .calmUtility39.open39{top:max(48px,calc(env(safe-area-inset-top) + 40px));width:min(74vw,252px);max-height:min(64vh,248px);z-index:40}" +
    "@media(prefers-reduced-motion:reduce){.heroLive46.hasBlink .heroLiveBlink46,.heroLive46.hasBlink .heroLiveBase46{animation:none}}";

  function injectStyle() {
    if (!global.document) return;
    var style = global.document.getElementById("sakurayo-lobby-css");
    if (style && style.parentNode) style.parentNode.removeChild(style);
    style = global.document.createElement("style");
    style.id = "sakurayo-lobby-css";
    style.textContent = LOBBY_CSS + ROOM_CSS;
    (global.document.head || global.document.documentElement).appendChild(style);
  }

  function clampInt(value, min, max) {
    var n = Math.floor(Number(value) || 0);
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  function emptyOwned() {
    var owned = {};
    CARDS.forEach(function (card) {
      owned[card.id] = 0;
    });
    return owned;
  }

  function normalizeOps(shop40) {
    var shop = shop40 && typeof shop40 === "object" && !Array.isArray(shop40) ? shop40 : {};
    var incoming = shop.ops && typeof shop.ops === "object" && !Array.isArray(shop.ops) ? shop.ops : {};
    var owned = emptyOwned();
    var rawOwned = incoming.owned && typeof incoming.owned === "object" && !Array.isArray(incoming.owned) ? incoming.owned : {};
    CARDS.forEach(function (card) {
      owned[card.id] = clampInt(rawOwned[card.id], 0, 9999);
    });
    var seeded = Object.keys(rawOwned).length === 0;
    if (seeded) {
      DEFAULT_SHOWN.forEach(function (id) {
        if (owned[id] < 1) owned[id] = 1;
      });
    }
    shop.ops = {
      pity: clampInt(incoming.pity, 0, RATES.pitySSR),
      pitySR: clampInt(incoming.pitySR, 0, RATES.pitySR),
      pulls: clampInt(incoming.pulls, 0, 999999),
      tenPulls: clampInt(incoming.tenPulls, 0, 999999),
      owned: owned,
      last: Array.isArray(incoming.last) ? incoming.last.slice(0, 20) : [],
      cheatUsed: incoming.cheatUsed ? 1 : 0,
    };
    return shop;
  }

  function cardOf(id) {
    return CARD_MAP[id] || null;
  }

  var POWER = Object.freeze({ N: 0.012, R: 0.022, SR: 0.04, SSR: 0.07, dup: 0.004, cap: 1.45 });

  function rosterPower(save) {
    var owned = emptyOwned();
    var raw = save && save.shop40 && save.shop40.ops && save.shop40.ops.owned;
    if (raw && typeof raw === "object") {
      CARDS.forEach(function (card) {
        owned[card.id] = clampInt(raw[card.id], 0, 9999);
      });
    }
    var mul = 1;
    var uniques = 0;
    var copies = 0;
    CARDS.forEach(function (card) {
      var n = owned[card.id] || 0;
      if (n < 1) return;
      uniques += 1;
      copies += n;
      mul += POWER[card.r] || 0;
      if (n > 1) mul += Math.min(6, n - 1) * POWER.dup;
    });
    if (mul > POWER.cap) mul = POWER.cap;
    return {
      dmg: +mul.toFixed(4),
      pct: Math.round((mul - 1) * 100),
      uniques: uniques,
      copies: copies,
    };
  }

  function shownIds(ops) {
    var out = [];
    DEFAULT_SHOWN.forEach(function (id) {
      if (out.indexOf(id) < 0) out.push(id);
    });
    CARDS.forEach(function (card) {
      if ((ops.owned[card.id] || 0) > 0 && out.indexOf(card.id) < 0) out.push(card.id);
    });
    return out;
  }

  function upIds(banner) {
    return BANNER_UP[banner] || BANNER_UP.normal;
  }

  function weightPool(rarity, banner) {
    var pool = BY_RARITY[rarity] || BY_RARITY.N;
    var featured = upIds(banner);
    if (!featured.length) return pool.slice();
    var weighted = [];
    for (var i = 0; i < pool.length; i++) {
      weighted.push(pool[i]);
      if (featured.indexOf(pool[i].id) >= 0) {
        weighted.push(pool[i]);
        weighted.push(pool[i]);
      }
    }
    return weighted;
  }

  function pickOfRarity(rarity, rng, banner) {
    var pool = weightPool(rarity, banner);
    return pool[Math.floor(rng() * pool.length) % pool.length];
  }

  function rollRarity(ops, rng) {
    if (ops.pity + 1 >= RATES.pitySSR) return "SSR";
    if (ops.pitySR + 1 >= RATES.pitySR) return "SR";
    var roll = rng();
    if (roll < RATES.SSR) return "SSR";
    if (roll < RATES.SSR + RATES.SR) return "SR";
    if (roll < RATES.SSR + RATES.SR + RATES.R) return "R";
    return "N";
  }

  function applyPull(ops, rng, banner) {
    var rarity = rollRarity(ops, rng);
    var card = pickOfRarity(rarity, rng, banner);
    ops.pity += 1;
    ops.pitySR += 1;
    if (card.r === "SSR") {
      ops.pity = 0;
      ops.pitySR = 0;
    } else if (card.r === "SR") {
      ops.pitySR = 0;
    }
    var prev = ops.owned[card.id] || 0;
    ops.owned[card.id] = clampInt(prev + 1, 0, 9999);
    ops.pulls += 1;
    return { id: card.id, r: card.r, n: card.n, pity: ops.pity, isNew: prev === 0 };
  }

  function pull(save, count, rng, banner) {
    var n = count === 10 ? 10 : 1;
    var cost = n === 10 ? RATES.ten : RATES.single;
    if (!save || typeof save !== "object") return { ok: false, reason: "save", results: [] };
    save.shop40 = normalizeOps(save.shop40 || {});
    var coins = clampInt(save.coins, 0, 99999999);
    var meta = save.shell46 && typeof save.shell46 === "object" ? save.shell46 : null;
    var tickets = meta ? clampInt(meta.ticket, 0, 999999) : 0;
    var payTicket = tickets >= n;
    if (!payTicket && coins < cost) {
      return { ok: false, reason: "coins", results: [], coins: coins, pity: save.shop40.ops.pity, pitySR: save.shop40.ops.pitySR, owned: save.shop40.ops.owned };
    }
    var rand = typeof rng === "function" ? rng : Math.random;
    var pool = banner === "fate" || banner === "normal" || banner === "moon" ? banner : "";
    var results = [];
    for (var i = 0; i < n; i++) results.push(applyPull(save.shop40.ops, rand, pool));
    if (n === 10) save.shop40.ops.tenPulls += 1;
    save.shop40.ops.last = results.slice();
    if (payTicket) meta.ticket = tickets - n;
    else save.coins = coins - cost;
    var gained = 0;
    if (meta) {
      meta.energy = clampInt((Number(meta.energy) || 0) + n, 0, 999);
      while (meta.energy >= 50) {
        meta.energy -= 50;
        meta.ticket = clampInt((Number(meta.ticket) || 0) + 1, 0, 999999);
        gained += 1;
      }
    }
    return {
      ok: true,
      results: results,
      coins: save.coins,
      paid: payTicket ? "ticket" : "coins",
      tickets: meta ? meta.ticket : 0,
      energy: meta ? meta.energy : 0,
      energyGrant: gained || 0,
      pity: save.shop40.ops.pity,
      pitySR: save.shop40.ops.pitySR,
      owned: save.shop40.ops.owned,
      pulls: save.shop40.ops.pulls,
      tenPulls: save.shop40.ops.tenPulls,
    };
  }

  function grantCheat(save) {
    if (!save || typeof save !== "object") return { coins: 0, cheatUsed: 0 };
    save.shop40 = normalizeOps(save.shop40 || {});
    save.coins = clampInt(save.coins, 0, 99999999) + RATES.cheat;
    save.shop40.ops.cheatUsed = 1;
    return { coins: save.coins, cheatUsed: 1 };
  }

  function portraitTap(now) {
    var t = Number(now) || Date.now();
    if (!portraitStamp || t - portraitStamp > TAP_WINDOW) portraitTaps = 0;
    portraitStamp = t;
    portraitTaps += 1;
    var granted = portraitTaps >= RATES.taps;
    if (granted) portraitTaps = 0;
    return { taps: portraitTaps, granted: granted };
  }

  function snapshot(save) {
    var shop = normalizeOps((save && save.shop40) || {});
    var ops = shop.ops;
    return {
      version: VERSION,
      rates: RATES,
      cards: CARDS.map(function (card) {
        return { id: card.id, n: card.n, r: card.r, count: ops.owned[card.id] || 0 };
      }),
      shown: shownIds(ops),
      owned: ops.owned,
      pity: ops.pity,
      pitySR: ops.pitySR,
      pulls: ops.pulls,
      tenPulls: ops.tenPulls,
      coins: clampInt(save && save.coins, 0, 99999999),
      cheatUsed: !!ops.cheatUsed,
    };
  }

  function rarityLabel(r) {
    return r === "SSR" ? "证人" : r === "SR" ? "稀有" : r === "R" ? "精良" : "常见";
  }

  function artSrc(handlers, rel) {
    var path = String(rel || "");
    if (handlers && typeof handlers.art === "function") {
      try {
        var url = handlers.art(path);
        if (url) return String(url);
      } catch (err) {}
    }
    if (typeof global.artUrl === "function") {
      try {
        var fallback = global.artUrl(path);
        if (fallback) return String(fallback);
      } catch (err2) {}
    }
    return "game/art/" + path;
  }

  function liveChar(save, handlers) {
    var id = (handlers && handlers.character) || (save && save.character) || "sayo";
    if (id !== "sayo" && id !== "aya" && id !== "rion") return "sayo";
    return id;
  }

  function testMode() {
    if (global.TEST_MODE) return true;
    try {
      return /(?:\?|&)test=1(?:&|$)/.test(String((global.location && global.location.search) || ""));
    } catch (err) {
      return false;
    }
  }

  function hideBrokenArt(root) {
    if (!root) return;
    var imgs = root.querySelectorAll("img[data-art]");
    for (var i = 0; i < imgs.length; i++) {
      imgs[i].onerror = function () {
        this.onerror = null;
        this.removeAttribute("src");
        this.style.opacity = "0";
      };
    }
  }

  function petalMarks() {
    var html = "";
    var lefts = [8, 18, 28, 41, 55, 67, 78, 88];
    var delays = [0, 1.4, 2.8, 0.7, 3.6, 1.1, 4.2, 2.1];
    var durs = [10, 12, 9, 13, 11, 14, 10, 12];
    for (var i = 0; i < lefts.length; i++) {
      html +=
        '<i style="left:' +
        lefts[i] +
        "%;animation-delay:" +
        delays[i] +
        "s;animation-duration:" +
        durs[i] +
        's"></i>';
    }
    return html;
  }

  function renderGacha(host, save, handlers) {
    injectStyle();
    if (!host) return snapshot(save);
    var info = snapshot(save);
    var power = rosterPower(save);
    var hero = liveChar(save, handlers);
    var ssrLeft = Math.max(0, RATES.pitySSR - info.pity);
    var srLeft = Math.max(0, RATES.pitySR - info.pitySR);
    var ssrPct = Math.max(0, Math.min(100, Math.round((info.pity / RATES.pitySSR) * 100)));
    var srPct = Math.max(0, Math.min(100, Math.round((info.pitySR / RATES.pitySR) * 100)));
    host.innerHTML =
      '<div class="wishStage46">' +
      '<img class="wishBanner46" data-art alt="" src="' +
      artSrc(handlers, "gacha/banner_bg.webp") +
      '">' +
      '<img class="wishHero46" data-art alt="" src="' +
      artSrc(handlers, "gacha/hero_" + hero + ".webp") +
      '">' +
      '<div class="wishPetals46">' +
      petalMarks() +
      "</div>" +
      '<div class="wishTitle46"><h3>镜界寻访</h3><p>证词入册 · 叠层加伤 +' +
      power.pct +
      "%</p></div>" +
      '<div class="wishPity46"><div class="pityRow46"><span>距证人保底还有 ' +
      ssrLeft +
      ' 抽</span><div class="pityRail46"><i style="width:' +
      ssrPct +
      '%"></i></div></div><div class="pityRow46 sr"><span>距稀有保底还有 ' +
      srLeft +
      ' 抽</span><div class="pityRail46"><i style="width:' +
      srPct +
      '%"></i></div></div></div>' +
      '<div class="wishDock46"><div class="wishPills46"><b>樱花币 ' +
      info.coins +
      "</b><b>" +
      (handlers && handlers.tickets != null ? "寻访券 " + (Number(handlers.tickets) || 0) : "寻访 " + info.pulls) +
      "</b></div>" +
      '<div class="gachaActions46"><button type="button" id="gachaPull1"' +
      (info.coins < RATES.single && !(handlers && (Number(handlers.tickets) || 0) >= 1) ? ' class="poor"' : "") +
      ">单次寻访<small>" +
      RATES.single +
      '</small></button><button type="button" id="gachaPull10"' +
      (info.coins < RATES.ten && !(handlers && (Number(handlers.tickets) || 0) >= 10) ? ' class="poor"' : "") +
      ">十连寻访<small>" +
      RATES.ten +
      "</small></button></div></div></div>";
    hideBrokenArt(host);
    var one = host.querySelector("#gachaPull1");
    var ten = host.querySelector("#gachaPull10");
    if (one) one.onclick = function () { (handlers && handlers.pull ? handlers.pull : function () {})(1); };
    if (ten) ten.onclick = function () { (handlers && handlers.pull ? handlers.pull : function () {})(10); };
    return info;
  }

  function closeRosterPeek() {
    if (!global.document) return;
    var peek = global.document.getElementById("rosterPeek46");
    if (peek && peek.parentNode) peek.parentNode.removeChild(peek);
  }

  function showRosterPeek(card, locked, count, handlers) {
    if (!global.document) return;
    var drawer = global.document.getElementById("rosterDrawer");
    if (!drawer) return;
    closeRosterPeek();
    var overlay = global.document.createElement("div");
    overlay.id = "rosterPeek46";
    overlay.innerHTML =
      '<div class="rosterPeekCard46' +
      (locked ? " lock" : "") +
      '"><img data-art alt="" src="' +
      artSrc(handlers, locked ? "gacha/card_back.webp" : "gacha/" + card.id + ".webp") +
      '"><div><b>' +
      (locked ? "未回收" : card.n) +
      "</b><em>" +
      rarityLabel(card.r) +
      (locked ? "" : " · ×" + count) +
      "</em><p>" +
      (locked ? "尚未回收。寻访点亮后才会露出立绘。" : card.d) +
      "</p></div></div>";
    overlay.onclick = function () {
      closeRosterPeek();
    };
    drawer.appendChild(overlay);
    hideBrokenArt(overlay);
  }

  function renderRoster(host, save, handlers) {
    injectStyle();
    if (!host) return snapshot(save);
    var info = snapshot(save);
    var got = info.shown.length;
    var power = rosterPower(save);
    host.innerHTML =
      '<div class="rosterStage46"><div class="rosterHead46"><h3>证词名册</h3><span>已点亮 ' +
      got +
      " / " +
      CARDS.length +
      " · 火力 +" +
      power.pct +
      "%</span></div><div id=\"rosterWall46\">" +
      CARDS.map(function (card) {
        var count = info.owned[card.id] || 0;
        var locked = count < 1 && DEFAULT_SHOWN.indexOf(card.id) < 0;
        return (
          '<button type="button" class="rosterSlot46 r-' +
          card.r +
          (locked ? " lock" : "") +
          '" data-card="' +
          card.id +
          '" data-role="' +
          (/^(sayo_|aya_|rion_)/.test(card.id) ? "main" : "item") +
          '" data-count="' +
          count +
          '"><div class="rosterArt46"><img data-art alt="" src="' +
          artSrc(handlers, locked ? "gacha/card_back.webp" : "gacha/" + card.id + ".webp") +
          '"><i>' +
          card.r +
          "</i>" +
          (locked ? '<em class="rosterVeil46">未回收</em>' : "") +
          "</div><b>" +
          (locked ? "待寻访" : card.n) +
          "</b><small>" +
          (locked ? rarityLabel(card.r) : "×" + count) +
          "</small></button>"
        );
      }).join("") +
      "</div></div>";
    hideBrokenArt(host);
    var slots = host.querySelectorAll(".rosterSlot46");
    for (var i = 0; i < slots.length; i++) {
      (function (node) {
        node.onclick = function () {
          var card = cardOf(node.getAttribute("data-card"));
          if (!card) return;
          var count = info.owned[card.id] || 0;
          var locked = count < 1 && DEFAULT_SHOWN.indexOf(card.id) < 0;
          showRosterPeek(card, locked, count, handlers);
        };
      })(slots[i]);
    }
    return info;
  }

  function showReveal(results, handlers) {
    injectStyle();
    if (!global.document) return;
    var drawer = global.document.getElementById("gachaDrawer");
    if (!drawer) return;
    var items = Array.isArray(results) ? results : [];
    var old = global.document.getElementById("gachaReveal46");
    if (old && old.parentNode) old.parentNode.removeChild(old);
    if (!items.length) return;
    var instant = testMode();
    var shown = items.slice();
    if (shown.length > 1) {
      var rank = { N: 0, R: 1, SR: 2, SSR: 3 };
      shown.sort(function (a, b) {
        return (rank[a.r] || 0) - (rank[b.r] || 0);
      });
    }
    var ssr = 0;
    var sr = 0;
    var fresh = 0;
    shown.forEach(function (item) {
      if (item.r === "SSR") ssr += 1;
      else if (item.r === "SR") sr += 1;
      if (item.isNew) fresh += 1;
    });
    var overlay = global.document.createElement("div");
    overlay.id = "gachaReveal46";
    overlay.className = instant ? "isTest isOpen isDone" : "isBurst";
    var gridClass = shown.length > 1 ? "revealGrid46 ten" : "revealGrid46 one";
    overlay.innerHTML =
      '<div class="revealHead46"><em>镜界开印</em><b>' +
      (shown.length > 1 ? "十连证词" : "单次寻访") +
      "</b></div><div class=\"" +
      gridClass +
      '">' +
      shown
        .map(function (item) {
          var card = cardOf(item.id) || item;
          var rarity = item.r || card.r || "N";
          var isNew = !!item.isNew;
          return (
            '<div class="revealCard46 r-' +
            rarity +
            (instant ? " flipped" : "") +
            '" data-card="' +
            (item.id || "") +
            '"><div class="revealInner46"><div class="revealFace46 back"><img data-art alt="" src="' +
            artSrc(handlers, "gacha/card_back.webp") +
            '"></div><div class="revealFace46 front"><img data-art alt="" src="' +
            artSrc(handlers, "gacha/" + (item.id || "sayo_echo") + ".webp") +
            '"><span class="revealGem46">' +
            rarity +
            "</span>" +
            (isNew ? '<span class="revealNew46">NEW</span>' : "") +
            "<b>" +
            (card.n || item.n || "") +
            "</b></div></div></div>"
          );
        })
        .join("") +
      '</div><div class="revealSum46">证人 ' +
      ssr +
      " · 稀有 " +
      sr +
      " · NEW " +
      fresh +
      '</div><div class="revealActs46"><button type="button" class="revealSkip46">跳过</button><button type="button" class="revealTake46">收下证词</button>' +
      (handlers && typeof handlers.again === "function"
        ? '<button type="button" class="revealAgain46">再寻一次</button>'
        : "") +
      "</div>";
    drawer.appendChild(overlay);
    hideBrokenArt(overlay);
    var cards = overlay.querySelectorAll(".revealCard46");
    function markDone() {
      var all = true;
      for (var c = 0; c < cards.length; c++) {
        if (!cards[c].classList.contains("flipped")) all = false;
      }
      if (all) overlay.classList.add("isDone");
    }
    function flipNode(node, silent) {
      if (!node || node.classList.contains("flipped")) return;
      node.classList.add("flipped");
      if (node.classList.contains("r-SSR")) node.classList.add("burst46");
      if (!silent && !instant && handlers && typeof handlers.feedback === "function") {
        handlers.feedback(node.classList.contains("r-SSR") ? "reward" : "click", node.classList.contains("r-SSR") ? 0.4 : 0.16);
      }
      markDone();
    }
    function flipAll() {
      for (var c = 0; c < cards.length; c++) flipNode(cards[c], true);
      if (!instant && handlers && typeof handlers.feedback === "function") handlers.feedback("reward", 0.28);
      overlay.classList.add("isDone");
    }
    if (!instant) {
      setTimeout(function () {
        if (overlay.isConnected) overlay.classList.add("isOpen");
      }, 220);
    }
    for (var i = 0; i < cards.length; i++) {
      (function (node, delay) {
        node.onclick = function () {
          flipNode(node);
        };
        if (!instant) {
          setTimeout(function () {
            if (node.isConnected) flipNode(node);
          }, 420 + delay * 140 + (node.classList.contains("r-SSR") ? 180 : 0));
        }
      })(cards[i], i);
    }
    var take = overlay.querySelector(".revealTake46");
    if (take) {
      take.onclick = function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      };
    }
    var skip = overlay.querySelector(".revealSkip46");
    if (skip) skip.onclick = flipAll;
    var again = overlay.querySelector(".revealAgain46");
    if (again) {
      again.onclick = function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        handlers.again();
      };
    }
  }

  function renderStageModes(mode) {
    var current = mode === "testimony" ? "testimony" : mode === "mainGod" ? "mainGod" : "story";
    function pill(id, title, sub) {
      var nid = id === "story" ? "Story" : id === "testimony" ? "Testimony" : "MainGod";
      return (
        '<button type="button" id="mode' +
        nid +
        '46" data-mode="' +
        id +
        '" class="' +
        (current === id ? "on" : "") +
        '">' +
        title +
        "<small>" +
        sub +
        "</small></button>"
      );
    }
    return (
      '<div id="modeBar46" class="modeBar46">' +
      pill("story", "回收演习", "四章回收") +
      pill("testimony", "证词模式", "不发升级卡") +
      pill("mainGod", "主神空间", "高难轮回") +
      "</div>"
    );
  }

  function dressArchive(host) {
    if (!host) return host;
    var first = !(host.getAttribute && host.getAttribute("data-dressed46") === "1");
    if (host.setAttribute) host.setAttribute("data-dressed46", "1");
    var copy = {
      talent: ["永久天赋", "跨局成长"],
      story: ["剧情档案", "四章证词"],
      asc: ["职业与飞升", "成型与代价"],
    };
    var art = { talent: "talent", story: "story", asc: "ascension" };
    var url = typeof global.artUrl === "function" ? global.artUrl : function (p) { return p; };
    var buttons = host.querySelectorAll ? host.querySelectorAll("[data-open]") : [];
    for (var i = buttons.length - 1; i >= 0; i--) {
      var btn = buttons[i];
      var id = btn.getAttribute ? btn.getAttribute("data-open") : "";
      if (id === "ach") {
        if (btn.parentNode) btn.parentNode.removeChild(btn);
        continue;
      }
      var pair = copy[id];
      if (first && pair) btn.innerHTML = "<b>" + pair[0] + "</b><small>" + pair[1] + "</small>";
      if (art[id] && btn.style) {
        btn.style.backgroundImage = "linear-gradient(180deg,#0b081844 8%,#0b0818f2 78%),url(\"" + url("ui/nav/" + art[id] + ".webp") + "\")";
        btn.style.backgroundSize = "cover";
        btn.style.backgroundPosition = "center";
      }
    }
    return host;
  }

    function bindHit(root, id, className, label) {
    var pad = root.querySelector("#" + id);
    if (!pad) {
      pad = global.document.createElement("button");
      pad.id = id;
      pad.className = className;
      pad.type = "button";
      pad.setAttribute("aria-label", label);
      root.appendChild(pad);
    }
    return pad;
  }

  function bindHeroTap(root, onGrant, onTap) {
    injectStyle();
    if (!root || !global.document) return;
    function handle(kind) {
      if (typeof onTap === "function") onTap(kind);
      var result = portraitTap(Date.now());
      if (result.granted && typeof onGrant === "function") onGrant();
    }
    bindHit(root, "heroTap46", "heroTap46", "角色立绘").onclick = function () {
      handle("tapBody");
    };
    bindHit(root, "heroHead46", "heroHead46", "角色头部").onclick = function () {
      handle("tapHead");
    };
  }

  global.SakurayoLobby = {
    version: VERSION,
    RATES: RATES,
    CARDS: CARDS,
    DEFAULT_SHOWN: DEFAULT_SHOWN,
    injectStyle: injectStyle,
    normalizeOps: normalizeOps,
    snapshot: snapshot,
    pull: pull,
    grantCheat: grantCheat,
    portraitTap: portraitTap,
    renderGacha: renderGacha,
    renderRoster: renderRoster,
    showReveal: showReveal,
    bindHeroTap: bindHeroTap,
    renderStageModes: renderStageModes,
    dressArchive: dressArchive,
    cardOf: cardOf,
    rosterPower: rosterPower,
    cheatToast: CHEAT_TOAST,
    upIds: upIds,
    weightPool: weightPool,
  };
})(typeof window !== "undefined" ? window : globalThis);
