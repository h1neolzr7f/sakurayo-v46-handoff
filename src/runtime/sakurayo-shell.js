(function (global) {
  "use strict";

  var VERSION = "4.6.0";
  var PREVIEW = "预览界面 · 暂不联网";
  var DRAWERS = Object.freeze(["mission", "mail", "notice", "friend", "calendar", "profile"]);
  var CHAR_NAMES = Object.freeze({ sayo: "月城小夜", aya: "神代绫", rion: "黑羽凛音" });
  var rosterFilter = "all";
  var gachaBanner = "moon";
  var shopRail = "featured";
  var storyPick = 0;
  var storyTouched = false;
  var profileTab = "base";
  var profileId = "sayo";
  var jumpProfile = "";
  var noticePick = "";
  var mailPick = "";

  var DOSSIERS = Object.freeze({
    sayo: Object.freeze({
      en: "SAYO Tsukishiro",
      birth: "7月24日",
      height: "167cm",
      team: "樱夜特助小队",
    }),
    aya: Object.freeze({
      en: "AYA Jindai",
      birth: "11月3日",
      height: "165cm",
      team: "零号企业追缉课",
    }),
    rion: Object.freeze({
      en: "RION Kuroha",
      birth: "2月14日",
      height: "170cm",
      team: "黄泉流道场",
    }),
  });

  var CSS =
    "#homeWallet46{display:none;align-items:center;gap:8px;margin:0 0 0 auto}" +
    ".homeChip46{display:none;align-items:center;gap:6px;min-height:42px;padding:4px 8px 4px 10px;border-radius:999px;background:#120e27ee;border:1px solid #69ddf255;color:#fff7fb;font:800 12px/1 system-ui}" +
    ".homeChip46 i{font:900 11px/1 system-ui;font-style:normal;color:#69ddf2}" +
    ".homeChip46.shard{border-color:#a78bfa66}" +
    ".homeChip46.shard i{color:#c4b5fd}" +
    ".homeChip46.ticket{border-color:#ff5b7455}" +
    ".homeChip46.ticket i{color:#ff5b74}" +
    ".homeChip46 button{width:28px;height:28px;padding:0;border:0;border-radius:50%;background:#f35aa6;color:#fff7fb;font:900 16px/1 system-ui}" +
    "#homeQuick46{display:none;align-items:center;gap:6px}" +
    "#homeQuick46 button{width:42px;height:42px;padding:0;border-radius:50%;border:1px solid #f2c75d66;background:#120e27ee;color:#ffe7a3;font:800 12px/1 system-ui}" +
    ".homeXp46,.homeRec46{display:none}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .top{flex-wrap:nowrap}" +
    "html.landscape46:not(.portraitFallback46) #homeWallet46{display:flex;flex:0 1 auto;min-width:0;gap:6px}" +
    "html.landscape46:not(.portraitFallback46) .homeChip46{display:flex;padding:4px 6px 4px 8px;gap:4px}" +
    "html.landscape46:not(.portraitFallback46) .homeChip46.ticket{display:flex}" +
    "html.landscape46:not(.portraitFallback46) .homeChip46.ticket button{display:none}" +
    "html.landscape46:not(.portraitFallback46) #homeQuick46{display:flex;flex:0 0 auto}" +
    "html.landscape46:not(.portraitFallback46) #homeQuick46 .homeIco46{position:relative;width:42px;height:42px;padding:0;border-radius:50%;border:1px solid #f2c75d66;background:#120e27ee}" +
    "html.landscape46:not(.portraitFallback46) #homeQuick46 .homeIco46.cal:before{content:\"\";position:absolute;left:11px;top:12px;width:18px;height:16px;border:1.5px solid #ffe7a3;border-radius:3px;box-shadow:3px -3px 0 #ffe7a3,11px -3px 0 #ffe7a3;background:radial-gradient(circle at 5px 8px,#ffe7a3 1.1px,transparent 1.2px),radial-gradient(circle at 10px 8px,#ffe7a3 1.1px,transparent 1.2px),radial-gradient(circle at 5px 12px,#ffe7a3 1.1px,transparent 1.2px)}" +
    "html.landscape46:not(.portraitFallback46) #homeQuick46 .homeIco46.cal.hasDot46:after{content:\"\";position:absolute;top:8px;right:8px;width:7px;height:7px;border-radius:50%;background:#ff5b74}" +
    "html.landscape46:not(.portraitFallback46) #homeQuick46 .homeIco46.pal:before{content:\"\";position:absolute;left:8px;top:9px;width:10px;height:10px;border:1.5px solid #ffe7a3;border-radius:50%;box-shadow:12px 0 0 -1.5px #120e27ee,12px 0 0 0 #ffe7a3,1px 13px 0 -2px #ffe7a3,13px 13px 0 -2.5px #ffe7a3}" +
    ".railIco46{display:block;width:16px;height:16px;margin:0 auto;position:relative}" +
    ".railIco46.task:before{content:\"\";position:absolute;left:3px;top:3px;right:3px;bottom:1px;border:1.5px solid #f35aa6;border-radius:2px}" +
    ".railIco46.task:after{content:\"\";position:absolute;left:5px;top:1px;right:5px;height:3px;border:1.5px solid #f35aa6;border-bottom:0;border-radius:2px 2px 0 0}" +
    ".railIco46.mail:before{content:\"\";position:absolute;left:1px;top:4px;right:1px;bottom:2px;border:1.5px solid #f35aa6;border-radius:2px}" +
    ".railIco46.mail:after{content:\"\";position:absolute;left:2px;top:4px;right:2px;height:6px;border-left:1.5px solid #f35aa6;border-right:1.5px solid #f35aa6;clip-path:polygon(0 0,50% 100%,100% 0)}" +
    ".railIco46.notice:before{content:\"\";position:absolute;left:2px;top:4px;width:8px;height:8px;border:1.5px solid #f35aa6;border-radius:2px 8px 8px 2px}" +
    ".railIco46.notice:after{content:\"\";position:absolute;right:2px;top:6px;width:3px;height:5px;border:1.5px solid #f35aa6;border-radius:1px}" +
    ".shellItem46 .railIco46{width:18px;height:18px;margin:0;background:transparent}" +
    ".profileVoice46{display:grid;gap:8px}" +
    ".profileVoice46 button{min-height:44px;padding:8px 12px;border-radius:12px;border:1px solid #69ddf266;background:#1a2030;color:#fff7fb;text-align:left}" +
    ".friendActs46{display:flex;flex-direction:column;gap:6px}" +
    ".friendActs46 button{min-height:36px;padding:0 10px;border-radius:8px;border:1px solid #ff9bcc66;background:#1a1230;color:#fff7fb;font:800 11px/1 system-ui}" +
    "html.landscape46:not(.portraitFallback46) #homeRail46 [data-home=mail],html.landscape46:not(.portraitFallback46) #homeRail46 [data-home=mission],html.landscape46:not(.portraitFallback46) #homeRail46 [data-home=notice]{position:relative}" +
    "html.landscape46:not(.portraitFallback46) #homeRail46 .hasDot46:after,html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeNav46 [data-open=gacha].hasDot46:after{content:\"\";position:absolute;top:6px;right:6px;width:7px;height:7px;border-radius:50%;background:#ff5b74}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeNav46 [data-open=gacha]{position:relative}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .bg:before{content:\"\";position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(90deg,#08071300 0 46%,#0a081866 72%,#080713cc 100%),radial-gradient(circle at 78% 14%,#f2c75d33 0 7%,transparent 24%)}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .bg:after{content:\"\";position:absolute;z-index:1;top:7%;right:3%;width:36%;height:58%;pointer-events:none;opacity:.5;background:repeating-linear-gradient(90deg,transparent 0 17px,#08071399 17px 19px),repeating-linear-gradient(180deg,transparent 0 13px,#08071399 13px 15px),repeating-linear-gradient(90deg,#69ddf218 0 7px,transparent 7px 19px),repeating-linear-gradient(180deg,#f2c75d1c 0 5px,transparent 5px 15px);box-shadow:inset 0 0 0 1px #f2c75d33;-webkit-mask-image:linear-gradient(90deg,transparent,#000 28%);mask-image:linear-gradient(90deg,transparent,#000 28%)}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeBanner46{grid-template-columns:64px 1fr;width:min(248px,28vw);min-height:72px;align-items:center}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeBanner46 em{display:block;color:#f2c75d;font:800 9px/1 system-ui;letter-spacing:.18em}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeBanner46 small{color:#ff9bcc;letter-spacing:.04em;white-space:nowrap}" +
    "html.landscape46:not(.portraitFallback46) .homeBannerDots46{display:flex;gap:4px;margin-top:5px}" +
    "html.landscape46:not(.portraitFallback46) .homeBannerDots46 i{width:5px;height:5px;border-radius:50%;background:#cfc4df55}" +
    "html.landscape46:not(.portraitFallback46) .homeBannerDots46 i.on{background:#f35aa6}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeModes46 .modeIco46{display:block;width:18px;height:18px;margin-bottom:4px}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeModes46 .modeIco46.testimony{background:conic-gradient(from 20deg,#f35aa6,#ff9bcc,#f35aa6);clip-path:polygon(50% 0,100% 38%,82% 100%,18% 100%,0 38%)}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeModes46 .modeIco46.domain{background:linear-gradient(135deg,#69ddf2,#3d82d8);clip-path:polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%)}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .coins{margin:0}" +
    "html.landscape46:not(.portraitFallback46) .homeXp46{display:block;margin-top:2px;color:#69ddf2;font:700 9px/1 system-ui;letter-spacing:.04em}" +
    "html.landscape46:not(.portraitFallback46) .homeRec46{display:block;grid-column:1/-1;color:#cfc4df;font:700 10px/1 system-ui;letter-spacing:.08em}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeModes46 button[data-mode=testimony] i{color:#f35aa6}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .homeModes46 button[data-mode=mainGod] i{color:#69ddf2}" +
    "html.landscape46.shortWindow46 #homeWallet46 .homeChip46,html.landscape46.shortWindow46 #homeQuick46,html.landscape46.shortWindow46 .homeXp46,html.landscape46.shortWindow46 .homeRec46{display:none!important}" +
    "html.landscape46.shortWindow46 #homeRail46 [data-home=\"notice\"]{display:none}" +
    "html.landscape46.shortWindow46 #menu.homeDock46 .homeRail46{top:max(52px,calc(env(safe-area-inset-top) + 42px));gap:2px}" +
    ".shellDrawer46>.dbody{display:flex;flex-direction:column;gap:10px}" +
    ".shellList46{display:grid;gap:8px}" +
    ".shellItem46{display:grid;grid-template-columns:42px 1fr auto;gap:10px;align-items:center;min-height:56px;padding:10px 12px;border-radius:14px;background:#120e27ee;border:1px solid #f35aa644;color:#fff7fb;text-align:left}" +
    ".shellItem46 i{display:grid;place-items:center;width:42px;height:42px;border-radius:12px;background:#f35aa622;color:#f35aa6;font:900 16px/1 system-ui;font-style:normal}" +
    ".shellItem46 b{display:block;font-size:14px;letter-spacing:.06em}" +
    ".shellItem46 small{display:block;margin-top:3px;color:#cfc4df;font-size:11px;line-height:1.4}" +
    ".shellItem46 em{color:#f2c75d;font:800 11px/1 system-ui;font-style:normal}" +
    ".shellItem46 em.ready46{color:#69ddf2}" +
    ".shellItem46 em.done46{color:#cfc4df}" +
    ".shellHint46{margin:0;color:#cfc4df;font-size:11px;letter-spacing:.08em}" +
    ".shellCal46{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px}" +
    ".shellCal46 button{min-height:64px;padding:6px 4px;border-radius:12px;border:1px solid #f35aa644;background:#120e27ee;color:#fff7fb}" +
    ".shellCal46 button b{display:block;font-size:12px}" +
    ".shellCal46 button small{display:block;margin-top:4px;color:#cfc4df;font-size:9px;line-height:1.35}" +
    "html.landscape46:not(.portraitFallback46) .shellCal46{gap:8px;margin-top:6px}" +
    "html.landscape46:not(.portraitFallback46) .shellCal46 button{min-height:120px;padding:12px 6px}" +
    "html.landscape46:not(.portraitFallback46) .shellCal46 button b{font-size:14px}" +
    "html.landscape46:not(.portraitFallback46) .shellCal46 button small{font-size:11px}" +
    ".shellCal46 button.on{border-color:#f2c75d;box-shadow:0 0 12px #f35aa644}" +
    ".shellCal46 button.done{opacity:.55}" +
    ".gachaBanners46,.gachaFeature46,.gachaEnergy46{display:none}" +
    ".rosterFilter46{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:0 0 10px}" +
    ".rosterFilter46 button{min-height:36px;padding:0 12px;border-radius:10px;border:1px solid #f35aa644;background:#1a1230;color:#fff7fb}" +
    ".rosterFilter46 button.on{background:linear-gradient(180deg,#f35aa6,#b02078);border-color:#ff9bcc88}" +
    ".rosterFilter46 span{margin-left:auto;color:#ffe7a3;font-size:11px;letter-spacing:.08em}" +
    ".rosterSlot46 .rosterNew46{position:absolute;z-index:3;top:8px;right:8px;padding:3px 6px;border-radius:6px;background:#f35aa6;color:#fff;font:800 9px/1 system-ui;letter-spacing:.12em}" +
    ".rosterSlot46 .rosterAwaken46{position:absolute;z-index:3;top:10px;left:-18px;padding:3px 22px;background:linear-gradient(90deg,#f35aa6,#ff7ec0);color:#fff;font:800 8px/1 system-ui;letter-spacing:.14em;transform:rotate(-32deg);box-shadow:0 4px 10px #05020d66}" +
    ".rosterSlot46.off{display:none}" +
    ".shopRail46{display:none}" +
    ".shopChip46{display:inline-flex;align-items:center;gap:4px;min-height:32px}" +
    ".storyDock46{display:contents}" +
    ".storyPane46{display:none}" +
    "#profileDrawer.shellWide46 .dbody{display:grid;gap:12px}" +
    ".profileHero46{display:grid;grid-template-columns:minmax(120px,32%) 1fr;gap:14px;align-items:stretch}" +
    ".profileHero46 img{width:100%;min-height:180px;object-fit:cover;object-position:center top;border-radius:16px;background:#100b1e;border:1px solid #69ddf244}" +
    ".profileChars46{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px}" +
    ".profileChars46 button{min-height:36px;padding:0 10px;border-radius:999px;border:1px solid #f35aa644;background:#1a1230;color:#fff7fb}" +
    ".profileChars46 button.on{border-color:#f2c75d;color:#ffe7a3}" +
    ".profileTabs46{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px}" +
    ".profileTabs46 button{min-height:36px;padding:0 12px;border-radius:10px;border:1px solid #f35aa644;background:#1a1230;color:#fff7fb}" +
    ".profileTabs46 button.on{position:relative;background:#1a2030;border-color:#cfe8ff;color:#fff7fb}" +
    ".profileTabs46 button.on:before,.profileTabs46 button.on:after{content:\"\";position:absolute;width:7px;height:7px;border:1px solid #69ddf2}" +
    ".profileTabs46 button.on:before{top:3px;left:3px;border-right:0;border-bottom:0}" +
    ".profileTabs46 button.on:after{right:3px;bottom:3px;border-left:0;border-top:0}" +
    ".profileMeta46{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}" +
    ".profileMeta46 b{display:block;color:#cfc4df;font-size:10px;letter-spacing:.12em}" +
    ".profileMeta46 span{display:block;margin-top:3px;color:#fff7fb;font-size:13px}" +
    ".profileBond46{display:grid;grid-template-columns:auto 1fr auto auto;grid-template-areas:\"heart title nums gift\" \"heart rail rail gift\";gap:4px 8px;align-items:center;margin-top:12px}" +
    ".profileBond46 i{grid-area:heart;color:#f35aa6;font:900 14px/1 system-ui;font-style:normal}" +
    ".profileBond46 b{grid-area:title;color:#fff7fb;font:800 12px/1 system-ui}" +
    ".profileBond46 .rail{grid-area:rail;height:8px;border-radius:99px;background:#2a183e;overflow:hidden}" +
    ".profileBond46 .rail em{display:block;height:100%;background:linear-gradient(90deg,#f35aa6,#f2c75d);font-style:normal}" +
    ".profileBond46 small{grid-area:nums;color:#ffe7a3;font-size:10px}" +
    ".profileGift46{grid-area:gift;display:flex;gap:6px}" +
    ".profileGift46 button{width:36px;height:36px;padding:0;border-radius:50%;border:1px solid #f35aa655;background:#1a1230;color:#ff9bcc}" +
    "#profileBody46 [data-open-real]{min-height:42px;padding:0 14px;border-radius:10px;border:1px solid #69ddf266;background:#1a2030;color:#fff7fb}" +
    "html.landscape46:not(.portraitFallback46) .gachaBanners46{display:flex;flex-direction:column;position:absolute;z-index:6;left:max(12px,env(safe-area-inset-left));top:max(56px,calc(env(safe-area-inset-top) + 44px));width:min(176px,21vw);gap:8px}" +
    "html.landscape46:not(.portraitFallback46) .gachaBanners46 button{position:relative;display:grid;grid-template-columns:42px 1fr;align-items:center;gap:8px;min-height:68px;padding:6px 10px;border-radius:12px;border:1px solid #f35aa644;background:#120e27ee;color:#fff7fb;text-align:left}" +
    "html.landscape46:not(.portraitFallback46) .gachaBanners46 button img{width:42px;height:42px;object-fit:cover;border-radius:8px;background:#1a1230}" +
    "html.landscape46:not(.portraitFallback46) .gachaBanners46 button.on{border-color:#f35aa6;box-shadow:0 0 16px #f35aa644}" +
    "html.landscape46:not(.portraitFallback46) .gachaBanners46 button.on:after{content:\"\";position:absolute;right:-7px;top:50%;width:0;height:0;border:7px solid transparent;border-left-color:#f35aa6;transform:translateY(-50%)}" +
    "html.landscape46:not(.portraitFallback46) .gachaBanners46 b{display:block;font-size:13px}" +
    "html.landscape46:not(.portraitFallback46) .gachaBanners46 small{display:block;margin-top:3px;color:#cfc4df;font-size:10px}" +
    "html.landscape46:not(.portraitFallback46) #gachaDrawer .wishTitle46{left:50%;right:auto;transform:translateX(-50%);text-align:center;max-width:46%}" +
    "html.landscape46:not(.portraitFallback46) .gachaFeature46{display:block;position:absolute;z-index:6;right:max(18px,env(safe-area-inset-right));top:max(86px,calc(env(safe-area-inset-top) + 72px));width:min(240px,28vw);text-align:right;pointer-events:none;text-shadow:0 2px 12px #05020d}" +
    "html.landscape46:not(.portraitFallback46) .gachaFeature46 em{display:block;color:#f2c75d;font:900 14px/1 system-ui;letter-spacing:.18em}" +
    "html.landscape46:not(.portraitFallback46) .gachaFeature46 b{display:block;margin-top:6px;font-size:28px;letter-spacing:.16em;color:#fff7fb}" +
    "html.landscape46:not(.portraitFallback46) .gachaFeature46 small{display:inline-block;margin-top:8px;padding:3px 10px;border-radius:2px;background:#f35aa6;color:#fff7fb;font:800 11px/1 system-ui;letter-spacing:.08em;transform:skewX(-12deg)}" +
    "html.landscape46:not(.portraitFallback46) .gachaFeature46 i{display:block;margin-top:8px;color:#cfc4df;font:700 11px/1 system-ui;font-style:normal}" +
    "html.landscape46:not(.portraitFallback46) .gachaEnergy46{display:block;position:absolute;z-index:6;right:max(16px,env(safe-area-inset-right));bottom:max(18px,env(safe-area-inset-bottom));color:#ffe7a3;font:800 11px/1 system-ui;letter-spacing:.08em}" +
    "html.landscape46:not(.portraitFallback46) #gachaPull1,html.landscape46:not(.portraitFallback46) #gachaPull10{clip-path:polygon(12px 0,100% 0,calc(100% - 12px) 100%,0 100%);border-radius:0}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer,html.landscape46:not(.portraitFallback46) #storyDrawer,html.landscape46:not(.portraitFallback46) #profileDrawer{background:#080713}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer>.dhead,html.landscape46:not(.portraitFallback46) #storyDrawer>.dhead,html.landscape46:not(.portraitFallback46) #profileDrawer>.dhead{background:#0b0818}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer>.dhead p{display:none}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer .shopNotice{display:none}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer>.dbody{display:grid;grid-template-columns:minmax(132px,16%) 1fr;gap:12px;align-items:start}" +
    "html.landscape46:not(.portraitFallback46) #shopWallet44{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer .shopMoney{display:flex;align-items:center;gap:6px;flex-wrap:nowrap}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer .shopChip46{display:flex;align-items:center;gap:4px;min-height:36px;padding:4px 8px;border-radius:999px;background:#120e27ee;border:1px solid #69ddf255;color:#fff7fb;font:800 12px/1 system-ui}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer .shopChip46 i{font:900 11px/1 system-ui;font-style:normal;color:#69ddf2}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer .shopChip46.shard{border-color:#a78bfa66}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer .shopChip46.shard i{color:#c4b5fd}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer .shopChip46.sakura{border-color:#f2c75d55;color:#ffe7a3}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer .shopChip46.ticket{border-color:#ff5b7455}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer .shopChip46.ticket i{color:#ff5b74}" +
    "html.landscape46:not(.portraitFallback46) .shopRail46{display:flex;flex-direction:column;gap:6px;position:sticky;top:8px}" +
    "html.landscape46:not(.portraitFallback46) .shopRail46 button{min-height:44px;padding:8px 10px;border-radius:12px;border:1px solid #f35aa644;background:#120e27ee;color:#fff7fb;text-align:left}" +
    "html.landscape46:not(.portraitFallback46) .shopRail46 button.on{border-color:#f35aa6;color:#fff7fb;background:linear-gradient(90deg,#f35aa633,#120e27ee);box-shadow:inset 3px 0 0 #f35aa6,0 0 12px #f35aa622}" +
    "html.landscape46:not(.portraitFallback46) #shopList .shopTabs40{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}" +
    "html.landscape46:not(.portraitFallback46) #shopList .shopGroup40[style*=\"display: grid\"],html.landscape46:not(.portraitFallback46) #shopList .shopGroup40[style*=\"display: block\"]{display:grid!important;gap:10px}" +
    "html.landscape46:not(.portraitFallback46) #shopList [data-shop-group=skins]{grid-template-columns:repeat(3,minmax(0,1fr))}" +
    "html.landscape46:not(.portraitFallback46) #shopList [data-shop-group=starters],html.landscape46:not(.portraitFallback46) #shopList [data-shop-group=items],html.landscape46:not(.portraitFallback46) #shopList [data-shop-group=talismans],html.landscape46:not(.portraitFallback46) #shopList [data-shop-group=extensions]{grid-template-columns:repeat(2,minmax(0,1fr))}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer .challengeToggle40,html.landscape46:not(.portraitFallback46) #shopDrawer .routeNote{grid-column:1/-1}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer .skinCard,html.landscape46:not(.portraitFallback46) #shopDrawer .shopItem40{display:flex;flex-direction:column;min-height:0;margin:0;padding:0;overflow:hidden;border:1px solid #69ddf244;background:linear-gradient(135deg,#1a132cf2,#100c1cee)}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer .skinPreview{width:100%;height:132px}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer .shopIcon40{width:100%;height:64px;border-radius:0;font-size:28px}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer .skinCard>div,html.landscape46:not(.portraitFallback46) #shopDrawer .shopItem40>div{padding:6px 10px 0}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer .skinCard h3,html.landscape46:not(.portraitFallback46) #shopDrawer .shopItem40 h3{margin:0;font-size:13px}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer .skinCard p,html.landscape46:not(.portraitFallback46) #shopDrawer .skinBias,html.landscape46:not(.portraitFallback46) #shopDrawer .shopItem40 p{display:none}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer .skinCard button,html.landscape46:not(.portraitFallback46) #shopDrawer .shopItem40>button{margin:6px 10px 8px;min-height:42px;border-radius:10px;border:1px solid #ff9bcc66;background:linear-gradient(180deg,#ff86cc,#b02078);color:#fff}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer .shopUpgrade40{margin:0 10px 8px;min-height:36px}" +
    "html.landscape46:not(.portraitFallback46) .rosterHead46 span{display:none}" +
    "html.landscape46:not(.portraitFallback46) #rosterDrawer>.dbody{overflow:auto}" +
    "html.landscape46:not(.portraitFallback46) #rosterWall46{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:10px;max-height:calc(100dvh - 118px);overflow:auto;align-content:start}" +
    "html.landscape46:not(.portraitFallback46) .rosterSlot46{min-height:156px}" +
    "html.landscape46:not(.portraitFallback46) .rosterArt46{height:118px}" +
    "html.landscape46:not(.portraitFallback46) .rosterSlot46 b{font-size:12px;white-space:normal}" +
    "html.landscape46:not(.portraitFallback46) .rosterSlot46 i{left:8px;right:auto;top:10px;width:auto;height:auto;padding:0;border:0;border-radius:0;background:transparent;font:900 20px/1 system-ui;letter-spacing:.08em}" +
    "html.landscape46:not(.portraitFallback46) .rosterSlot46.r-SSR i{color:#f35aa6;text-shadow:0 0 10px #f35aa688}" +
    "html.landscape46:not(.portraitFallback46) .rosterSlot46.r-SR i{color:#69ddf2;text-shadow:0 0 10px #69ddf266}" +
    "#shopFeatured46{display:none}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer.isFeatured46 #shopFeatured46{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;align-content:start}" +
    "html.landscape46:not(.portraitFallback46) #shopFeatured46 .shellHint46{grid-column:1/-1;margin:0}" +
    "html.landscape46:not(.portraitFallback46) #shopExchange46{display:none}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer.isExchange46 #shopExchange46{display:grid;grid-template-columns:1fr 1fr;gap:8px}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer.isExchange46 #shopFeatured46,html.landscape46:not(.portraitFallback46) #shopDrawer.isExchange46 #shopList .shopGroup40{display:none!important}" +
    "html.landscape46:not(.portraitFallback46) #shopExchange46 .shellHint46{grid-column:1/-1;margin:0}" +
    "html.landscape46:not(.portraitFallback46) #shopDrawer.isFeatured46 #shopList .shopGroup40{display:none!important}" +
    "html.landscape46:not(.portraitFallback46) #shopFeatured46 .shopSkin46,html.landscape46:not(.portraitFallback46) #shopFeatured46 .shopGood46,html.landscape46:not(.portraitFallback46) #shopExchange46 .shopGood46{display:flex;flex-direction:column;min-height:148px;padding:0;overflow:hidden;border-radius:16px;border:1px solid #69ddf244;background:linear-gradient(135deg,#1a132cf2,#100c1cee)}" +
    "html.landscape46:not(.portraitFallback46) #shopFeatured46 .shopSkinPrev46,html.landscape46:not(.portraitFallback46) .shopGoodIco46{position:relative;width:100%;height:88px;overflow:hidden;background:#171027}" +
    "html.landscape46:not(.portraitFallback46) #shopFeatured46 .shopSkinPrev46 img{width:100%;height:100%;object-fit:cover;object-position:center top}" +
    "html.landscape46:not(.portraitFallback46) #shopFeatured46 .shopSkinPrev46 span{position:absolute;inset:0;display:grid;place-items:center}" +
    "html.landscape46:not(.portraitFallback46) #shopFeatured46 .shopSkin46>div{padding:6px 10px 0}" +
    "html.landscape46:not(.portraitFallback46) #shopFeatured46 .shopSkin46 h3,html.landscape46:not(.portraitFallback46) .shopGoodBar46 b{margin:0;font-size:13px;color:#fff7fb}" +
    "html.landscape46:not(.portraitFallback46) #shopFeatured46 .shopSkin46 p,html.landscape46:not(.portraitFallback46) #shopFeatured46 .shopSkin46 .skinBias{display:none}" +
    "html.landscape46:not(.portraitFallback46) .shopGoodBar46{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px 10px}" +
    "html.landscape46:not(.portraitFallback46) .shopGoodBar46 small{display:block;color:#cfc4df;font-size:10px}" +
    "html.landscape46:not(.portraitFallback46) #shopFeatured46 .shopSkin46 button,html.landscape46:not(.portraitFallback46) .shopGood46 button{min-height:42px;padding:0 12px;border-radius:10px;border:1px solid #f2c75d66;background:linear-gradient(180deg,#ff86cc,#b02078);color:#fff;font:800 12px/1 system-ui}" +
    "html.landscape46:not(.portraitFallback46) #shopFeatured46 .shopSkin46 button{margin:6px 10px 8px}" +
    ".shopGoodIco46{display:grid;place-items:center}" +
    ".shopGoodIco46:before{content:\"\";position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)}" +
    ".shopGoodIco46.core:before{width:22px;height:22px;border:2px solid #ff5b74;border-radius:50%;box-shadow:0 0 0 5px #ff5b7433,inset 0 0 0 4px #171027}" +
    ".shopGoodIco46.ammo:before{width:16px;height:34px;border:2px solid #69ddf2;border-radius:3px;box-shadow:6px 4px 0 -2px #69ddf266}" +
    ".shopGoodIco46.ticket:before{width:34px;height:20px;border:2px solid #f2c75d;border-radius:3px;transform:translate(-50%,-50%) rotate(-12deg)}" +
    ".shopGoodIco46.shard:before{width:18px;height:18px;border:2px solid #c4b5fd;transform:translate(-50%,-50%) rotate(45deg)}" +
    ".shopGoodIco46.prism:before{width:0;height:0;border:10px solid transparent;border-bottom-color:#69ddf2;transform:translate(-50%,-70%)}" +
    ".shopGoodIco46.sakura:before{width:16px;height:16px;border-radius:50%;background:#f35aa6;box-shadow:10px 0 0 #f35aa6,-5px 9px 0 #f35aa6}" +
    "html.shortWindow46 #shopDrawer .shopChip46.prism,html.shortWindow46 #shopDrawer .shopChip46.shard{display:none}" +
    "html.shortWindow46 #shopFeatured46 .shopSkinPrev46,html.shortWindow46 .shopGoodIco46{height:56px!important}" +
    "html.landscape46:not(.portraitFallback46) #storyList .storyCard.charLore,html.landscape46:not(.portraitFallback46) #storyList .storyCard.recap39,html.landscape46:not(.portraitFallback46) #storyList #storyRecap39,html.landscape46:not(.portraitFallback46) #storyList .hiddenStory40,html.landscape46:not(.portraitFallback46) #storyList .extensionStory41{display:none!important}" +
    "html.landscape46:not(.portraitFallback46) #storyList .storyAct46{display:block;margin-bottom:2px;color:#cfc4df;font:700 10px/1 system-ui;letter-spacing:.12em}" +
    "html.landscape46:not(.portraitFallback46) #storyDrawer>.dhead h2{letter-spacing:.2em}" +
    "html.landscape46:not(.portraitFallback46) #storyList{display:grid;grid-template-columns:minmax(220px,30%) 1fr;gap:12px;align-items:start}" +
    "html.landscape46:not(.portraitFallback46) #storyList .storyCard{grid-column:1;min-height:64px;cursor:pointer;display:grid;grid-template-columns:42px 1fr 16px;align-items:center}" +
    "html.landscape46:not(.portraitFallback46) #storyList .storyCard p{display:none}" +
    "html.landscape46:not(.portraitFallback46) #storyList .storyCard h3{margin:0;font-size:13px;letter-spacing:.06em}" +
    "html.landscape46:not(.portraitFallback46) #storyList .storyCard:after{content:\">\";color:#cfc4df;font:800 14px/1 system-ui}" +
    "html.landscape46:not(.portraitFallback46) #storyList .storyCard.on{border-color:#a020f0!important;box-shadow:0 0 16px #a020f066;background:linear-gradient(90deg,#3a1a58ee,#120e27ee)}" +
    "html.landscape46:not(.portraitFallback46) #storyList .storyPane46{grid-column:2;grid-row:1/span 16;position:sticky;top:8px;display:block;height:calc(100dvh - 96px);min-height:240px;max-height:calc(100dvh - 96px);padding:0;overflow:hidden;border-radius:16px;background:#100b1e;border:1px solid #f35aa644}" +
    "html.landscape46:not(.portraitFallback46) .storyPane46 img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#100b1e}" +
    "html.landscape46:not(.portraitFallback46) .storyPane46 .storyPaneCopy46{position:absolute;z-index:1;left:0;right:0;bottom:0;padding:36px 16px 16px;background:linear-gradient(180deg,#08071300 10%,#080713e8 55%,#080713 100%)}" +
    "html.landscape46:not(.portraitFallback46) .storyPane46 b{display:block;font-size:20px;letter-spacing:.12em}" +
    "html.landscape46:not(.portraitFallback46) .storyPane46 p{margin:8px 0 0;color:#cfc4df;line-height:1.55}" +
    "html.landscape46:not(.portraitFallback46) .storyPane46 em{display:block;margin-top:12px;color:#ffe7a3;font-style:normal;text-align:right}" +
    "html.landscape46:not(.portraitFallback46) #profileDrawer.shellWide46 .dbody{grid-template-columns:minmax(220px,36%) 1fr}" +
    "html.landscape46:not(.portraitFallback46) #hud .hero{max-width:320px;padding:4px 10px 4px 4px;background:#120e27d8;border:1px solid #f35aa655;clip-path:none;border-radius:999px}" +
    "html.landscape46:not(.portraitFallback46) #hud .hero img{width:42px;height:42px;border-width:2px;border-color:#f35aa6}" +
    "html.landscape46:not(.portraitFallback46) #hud .bar{height:8px}" +
    "html.landscape46:not(.portraitFallback46) #hud .wave{height:8px;border-radius:99px;background:#120e27cc;border:1px solid #ff5b7444}" +
    "html.landscape46:not(.portraitFallback46) #dash,#skill{border-radius:50%}" +
    "html.landscape46:not(.portraitFallback46) #opsDock46{border-radius:999px}" +
    "html.shortWindow46 .shellItem46,html.shortWindow46 .shellCal46 button{min-height:44px}" +
    "html.shortWindow46 .profileHero46{grid-template-columns:1fr}" +
    "html.shortWindow46 .profileHero46 img{min-height:120px;max-height:140px}" +
    "html.shortWindow46 .gachaFeature46,html.shortWindow46 .gachaEnergy46{display:none!important}" +
    "html.shortWindow46 #shopList [data-shop-group=skins],html.shortWindow46 #shopFeatured46{grid-template-columns:repeat(2,minmax(0,1fr))!important}" +
    "@keyframes startPulse46{0%,100%{box-shadow:0 12px 32px #f35aa666,0 0 22px #f2c75d33}50%{box-shadow:0 16px 42px #f35aa688,0 0 36px #f2c75d55}}" +
    "@keyframes petalFall46{0%{transform:translate3d(0,-8px,0) rotate(0);opacity:.0}12%{opacity:.7}100%{transform:translate3d(18px,110vh,0) rotate(220deg);opacity:0}}" +
    "@keyframes shellIn46{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}" +
    "@keyframes shellFloat46{0%{opacity:1;transform:translate(-50%,0) scale(1)}100%{opacity:0;transform:translate(-50%,-46px) scale(1.08)}}" +
    "@keyframes chipPop46{0%{transform:scale(1)}40%{transform:scale(1.12)}100%{transform:scale(1)}}" +
    "@keyframes cmdGlow46{0%,100%{filter:brightness(1)}50%{filter:brightness(1.16)}}" +
    "@keyframes calPulse46{0%,100%{box-shadow:0 0 0 0 #f2c75d00}50%{box-shadow:0 0 0 6px #f2c75d22}}" +
    "html.landscape46:not(.portraitFallback46) #menu.homeDock46 .start{animation:startPulse46 2.4s ease-in-out infinite}" +
    "#homePetals46{display:none;position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden}" +
    "html.landscape46:not(.portraitFallback46) #homePetals46{display:block}" +
    "#homePetals46 i{position:absolute;top:-8%;width:7px;height:10px;border-radius:0 70% 0 70%;background:linear-gradient(135deg,#ff9bcc,#f35aa6);opacity:.55;animation:petalFall46 9s linear infinite}" +
    "#homeGreet46{display:none}" +
    "html.landscape46:not(.portraitFallback46) #homeGreet46{display:block;margin-top:4px;max-width:220px;color:#ffe7a3;font:700 10px/1.35 system-ui;letter-spacing:.04em;text-shadow:0 2px 8px #05020d}" +
    "html.landscape46.shortWindow46 #homeGreet46,html.landscape46.shortWindow46 #homePetals46{display:none!important}" +
    ".shellDrawer46:not(.hidden),.drawer.wishDrawer46:not(.hidden){animation:shellIn46 .28s ease}" +
    ".shellFloat46{position:fixed;left:50%;top:30%;z-index:90;color:#f2c75d;font:900 22px/1 system-ui;letter-spacing:.08em;pointer-events:none;text-shadow:0 0 16px #f2c75d88;animation:shellFloat46 .9s ease forwards}" +
    ".homeChip46.pop46 b,.homeChip46.pop46,#coins.pop46{animation:chipPop46 .28s ease}" +
    "html.landscape46:not(.portraitFallback46) #homeQuick46 .homeIco46.cal.hasDot46{animation:calPulse46 1.6s ease-in-out infinite}" +
    "html.landscape46:not(.portraitFallback46) #skill.ready44,html.landscape46:not(.portraitFallback46) #dash.ready44{animation:cmdGlow46 1.15s ease-in-out infinite}" +
    "html.landscape46:not(.portraitFallback46) #joy{box-shadow:0 0 0 1px #f2c75d44,inset 0 0 26px #f35aa628,0 0 22px #f35aa622}" +
    ".shellCal46 button.on{background:linear-gradient(180deg,#f35aa6,#b02078);border-color:#ffe6a3;color:#fff7fb}" +
    ".shellCal46 button{position:relative;overflow:hidden}" +
    ".shellStamp46{position:absolute;right:5px;bottom:5px;width:22px;height:22px;border:2px solid #f2c75d;border-radius:50%;color:#f2c75d;font:900 10px/18px system-ui;transform:rotate(-18deg);box-shadow:0 0 8px #f2c75d55}" +
    ".shellCal46 button.stamped46 .shellStamp46{animation:stampIn46 .45s cubic-bezier(.2,1.4,.3,1)}" +
    "@keyframes stampIn46{0%{transform:rotate(-18deg) scale(2.1);opacity:0}100%{transform:rotate(-18deg) scale(1);opacity:1}}" +
    "@media(prefers-reduced-motion:reduce){.shellCal46 button.stamped46 .shellStamp46{animation:none}}" +
    ".shellItem46 em.ready46{animation:calPulse46 1.8s ease-in-out infinite}" +
    ".shellPane46{display:none}" +
    ".shellSplit46{display:grid;gap:10px}" +
    "html.landscape46:not(.portraitFallback46) .shellSplit46{grid-template-columns:minmax(220px,32%) 1fr;align-items:start;min-height:calc(100dvh - 96px)}" +
    "html.landscape46:not(.portraitFallback46) .shellPane46{display:block;position:sticky;top:8px;min-height:240px;height:calc(100dvh - 96px);padding:0;overflow:hidden;border-radius:16px;background:#100b1e;border:1px solid #f2c75d44}" +
    "html.landscape46:not(.portraitFallback46) .shellPaneHero46{height:38%;min-height:110px;background:radial-gradient(circle at 70% 20%,#f2c75d22,#1a2030 46%,#100b1e);border-bottom:1px solid #f2c75d33}" +
    "html.landscape46:not(.portraitFallback46) .shellPaneCopy46{padding:16px;overflow:auto;height:62%}" +
    "html.landscape46:not(.portraitFallback46) .shellPane46 b{display:block;font-size:18px;letter-spacing:.1em}" +
    "html.landscape46:not(.portraitFallback46) .shellPane46 p{margin:8px 0 0;color:#cfc4df;line-height:1.55}" +
    "html.shortWindow46 .shellPane46{display:block;min-height:96px;height:auto;padding:10px 12px;border-radius:14px;background:#100b1e;border:1px solid #f2c75d44}" +
    ".friendCard46 img{width:42px;height:42px;object-fit:cover;border-radius:12px;border:1px solid #69ddf244;background:#1a1230}" +
    ".homeSupport46{display:none}" +
    "html.landscape46:not(.portraitFallback46) .homeSupport46{display:inline-block;margin-left:6px;padding:2px 8px;border-radius:999px;border:1px solid #69ddf266;background:#1a2030;color:#69ddf2;font:800 9px/1 system-ui;letter-spacing:.08em;vertical-align:middle}" +
    ".railIco46.ach:before{content:\"\";position:absolute;left:2px;top:3px;width:12px;height:12px;border:1.5px solid #f2c75d;border-radius:50%}" +
    ".railIco46.ach:after{content:\"\";position:absolute;left:6px;top:1px;width:4px;height:4px;background:#f2c75d;clip-path:polygon(50% 0,61% 35%,100% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,0 35%,39% 35%)}" +
    ".railIco46.set:before{content:\"\";position:absolute;left:3px;top:3px;width:10px;height:10px;border:1.5px solid #f35aa6;border-radius:50%;box-shadow:0 -6px 0 -3px #f35aa6,0 6px 0 -3px #f35aa6,6px 0 0 -3px #f35aa6,-6px 0 0 -3px #f35aa6}" +
    "#archiveStats46{display:none}" +
    "html.landscape46:not(.portraitFallback46) #archiveStats46{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0 0 12px}" +
    "html.landscape46:not(.portraitFallback46) #archiveStats46 i{display:block;min-height:56px;padding:10px 12px;border-radius:14px;background:#120e27ee;border:1px solid #f2c75d44;color:#fff7fb;font-style:normal}" +
    "html.landscape46:not(.portraitFallback46) #archiveStats46 b{display:block;color:#69ddf2;font:900 16px/1 system-ui}" +
    "html.landscape46:not(.portraitFallback46) #archiveStats46 small{display:block;margin-top:4px;color:#cfc4df;font:700 10px/1 system-ui;letter-spacing:.08em}" +
    "html.landscape46:not(.portraitFallback46) #archiveDrawer .archiveDock46 button{position:relative;border-color:#f2c75d55;box-shadow:inset 0 0 0 1px #f35aa622}" +
    "html.landscape46:not(.portraitFallback46) #archiveDrawer .archiveDock46 button:before,html.landscape46:not(.portraitFallback46) #archiveDrawer .archiveDock46 button:after{content:\"\";position:absolute;width:8px;height:8px;border:1px solid #f2c75d}" +
    "html.landscape46:not(.portraitFallback46) #archiveDrawer .archiveDock46 button:before{top:8px;left:8px;border-right:0;border-bottom:0}" +
    "html.landscape46:not(.portraitFallback46) #archiveDrawer .archiveDock46 button:after{right:8px;bottom:8px;border-left:0;border-top:0}" +
    "html.landscape46:not(.portraitFallback46) #achDrawer.achShell46 #achList{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}" +
    "html.landscape46:not(.portraitFallback46) #achDrawer.achShell46 .achievementMaster35{grid-column:1/-1;display:grid;grid-template-columns:72px 1fr auto;align-items:center;min-height:88px;padding:12px;border-color:#f2c75d88}" +
    "html.landscape46:not(.portraitFallback46) #achDrawer.achShell46 .ach{min-height:120px;padding:12px;border-radius:16px;border:1px solid #f35aa644;background:linear-gradient(135deg,#1a132cf2,#100c1cee)}" +
    "html.landscape46:not(.portraitFallback46) #achDrawer.achShell46 .ach.lock{opacity:.55}" +
    "html.landscape46:not(.portraitFallback46) #achDrawer.achShell46 .ach .claim{min-height:42px}" +
    "html.landscape46:not(.portraitFallback46) #settingsDrawer37.settingsShell46>.dbody{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:start}" +
    "html.landscape46:not(.portraitFallback46) #settingsDrawer37 .settingsSliders46,html.landscape46:not(.portraitFallback46) #settingsDrawer37 .settingsToggles46{display:grid;gap:8px}" +
    "html.landscape46:not(.portraitFallback46) #settingsDrawer37 .settingRow37{padding:14px;border-radius:14px;border:1px solid #69ddf244;background:#120e27ee}" +
    "html.landscape46:not(.portraitFallback46) #settingsDrawer37 .settingRow37 input{accent-color:#f35aa6}" +
    "html.landscape46:not(.portraitFallback46) #settingsDrawer37 .settingToggle37{min-height:44px;border-radius:12px;border:1px solid #f35aa644;background:#120e27ee;color:#fff7fb}" +
    "html.landscape46:not(.portraitFallback46) #settingsDrawer37 .routeNote{grid-column:1/-1;color:#cfc4df}" +
    "html.landscape46:not(.portraitFallback46) #stageDrawer.stageShell46 .stageCard{min-height:200px;border-color:#f2c75d44}" +
    "html.landscape46:not(.portraitFallback46) #stageDrawer.stageShell46 .stageCard.lock{filter:saturate(.45) brightness(.72)}" +
    "html.landscape46:not(.portraitFallback46) #stageDrawer.stageShell46 .stageCard button{min-height:42px;clip-path:polygon(10px 0,100% 0,calc(100% - 10px) 100%,0 100%)}" +
    "html.shortWindow46 #archiveStats46{display:none!important}" +
    "html.shortWindow46 #settingsDrawer37.settingsShell46>.dbody{grid-template-columns:1fr}" +
    "html.shortWindow46 #achDrawer.achShell46 #achList{grid-template-columns:repeat(2,minmax(0,1fr))!important}";

  function $(sel, root) {
    var doc = root || (global.document || null);
    return doc ? doc.querySelector(sel) : null;
  }

  function $$(sel, root) {
    var doc = root || (global.document || null);
    return doc ? Array.prototype.slice.call(doc.querySelectorAll(sel)) : [];
  }

  function injectStyle() {
    if (!global.document) return;
    var style = global.document.getElementById("sakurayo-shell-css");
    if (style && style.parentNode) style.parentNode.removeChild(style);
    style = global.document.createElement("style");
    style.id = "sakurayo-shell-css";
    style.textContent = CSS;
    (global.document.head || global.document.documentElement).appendChild(style);
  }

  function defenseLevel(save) {
    var tal = 0;
    var bag = (save && save.tal) || {};
    Object.keys(bag).forEach(function (key) {
      tal += Number(bag[key]) || 0;
    });
    return 1 + (((save && save.done) || []).length || 0) + tal;
  }

  function wallets(save) {
    var coins = Math.max(0, Math.floor(Number(save && save.coins) || 0));
    var meta = ensureMeta(save);
    return {
      sakura: coins,
      prism: meta.prism,
      shard: meta.shard,
      ticket: clampInt(meta.ticket, 0, 999999),
      energy: clampInt(meta.energy, 0, 49),
    };
  }

  function xpOf(save) {
    var lv = defenseLevel(save);
    var now = Math.min(2900, 180 + (((save && save.done) || []).length || 0) * 220 + ((Math.max(0, Math.floor(Number(save && save.runs) || 0)) % 80) * 8));
    var max = 800 + lv * 150;
    if (now >= max) now = Math.max(0, max - 40);
    return { lv: lv, now: now, max: max };
  }

  function recLevel(chapter) {
    var ch = Math.max(1, Math.min(4, Math.floor(Number(chapter) || 1)));
    return 1 + (ch - 1) * 12;
  }

  function bondOf(save, id) {
    var runs = Math.max(0, Math.floor(Number(save && save.runs) || 0));
    var kills = Math.max(0, Math.floor(Number(save && save.kills) || 0));
    var extra = 0;
    if (save && save.shell46) extra = ensureMeta(save).bond[charId(id)];
    var value = Math.min(1500, 180 + runs * 37 + (kills % 200) + extra);
    return { lv: Math.max(1, Math.floor(value / 280) + 1), now: value, max: 1500 };
  }

  var LOGIN_REWARDS = Object.freeze([
    { coins: 40, shard: 0, prism: 0, ticket: 1 },
    { coins: 60, shard: 0, prism: 0, ticket: 0 },
    { coins: 80, shard: 20, prism: 0, ticket: 0 },
    { coins: 100, shard: 0, prism: 0, ticket: 0 },
    { coins: 120, shard: 0, prism: 0, ticket: 1 },
    { coins: 160, shard: 20, prism: 0, ticket: 0 },
    { coins: 240, shard: 0, prism: 40, ticket: 1 },
  ]);
  var MISSIONS = Object.freeze([
    { id: "kill", title: "每日：击破尸潮", sub: "今日再击破 10 体", need: 10, coins: 50, reset: "day" },
    { id: "clear", title: "每周：通关任一章", sub: "本周新通关一章", need: 1, coins: 80, reset: "week" },
    { id: "pull", title: "每日：寻访一次证词", sub: "今日真实抽取一次", need: 1, coins: 40, reset: "day" },
  ]);
  var MAILS = Object.freeze([
    { id: "welcome", title: "补给签收通知", sub: "新档案开通奖励", body: "新档案已在本机开通。补给写入樱花币，不外链、不改枪口。", coins: 80, shard: 0, need: "always" },
    { id: "gacha", title: "镜界寻访周期", sub: "完成一次寻访后可领", body: "完成一次真实寻访后可领取碎片。卡只进名册，不出售永久伤害。", coins: 0, shard: 20, need: "pull" },
    { id: "patch", title: "系统维护回执", sub: "本机离线更新说明", body: "这次维护只整理本机界面与存档字段。没有联网补丁，也没有清档。", coins: 0, shard: 0, need: "always" },
  ]);
  var NOTICES = Object.freeze([
    { id: "story", title: "四章主线仍在本地推进", sub: "通关记录沿用现有存档字段", body: "四章主线仍在本地推进。通关记录沿用现有存档字段 done / story，不联网拉取公告。" },
    { id: "shop", title: "衣装不出售永久伤害", sub: "商店真分类可买，兑换区只换货币", body: "衣装与寻访卡都不出售永久伤害。商店真分类可买，兑换区只换货币。" },
  ]);
  var TALENT_FALLBACK = Object.freeze([
    { id: "atk", n: "破魔弹芯", i: "⚔", d: "每级基础伤害 +5%", max: 10 },
    { id: "hp", n: "巫女护体", i: "♥", d: "每级初始生命 +8", max: 10 },
    { id: "luck", n: "神乐祝福", i: "✦", d: "每级暴击率 +2%", max: 8 },
    { id: "mag", n: "灵核感应", i: "◎", d: "每级拾取范围 +12", max: 8 },
    { id: "flow", n: "战斗演算", i: "⏱", d: "每级技能与冲刺冷却 -2%", max: 8 },
  ]);
  var STORY_FALLBACK = Object.freeze([
    { n: "序章：第零次死亡", i: "🌸", d: "三年前，小夜在镜界实验中已经死亡一次。神社保存的“她”，究竟是幸存者、备份，还是镜像？" },
    { n: "档案一：百目共视", i: "💎", d: "僵尸并非失控。它们共享视觉、痛觉和记忆，背后有一个意识在借整座城市观察小夜。" },
    { n: "档案二：零号企业", i: "🏙️", d: "飞升协议从来不是救灾技术。企业计划把人格拆成可替换组件，让死亡成为无限续费的劳动。" },
    { n: "档案三：失败者剑冢", i: "⚔️", d: "剑冢中的每一把剑都来自一次失败时间线。所有“小夜”都曾走到这里，却没有一个抵达核心。" },
    { n: "终章：镜零之后", i: "🜂", d: "镜零声称自己由所有失败的小夜训练而成。核心崩塌时，另一名“小夜”却在碎片后醒来。" },
  ]);
  var EXCHANGES = Object.freeze([
    { id: "shard-coin", title: "碎片兑换樱花币", pay: "shard", payN: 100, get: "coins", getN: 50 },
    { id: "prism-coin", title: "棱晶兑换寻访资金", pay: "prism", payN: 200, get: "coins", getN: 160 },
    { id: "coin-shard", title: "樱花币兑换碎片", pay: "coins", payN: 80, get: "shard", getN: 20 },
    { id: "coin-ticket", title: "樱花币兑换寻访券", pay: "coins", payN: 160, get: "ticket", getN: 1 },
  ]);
  var VOICES = Object.freeze({
    sayo: Object.freeze(["先活过这二十秒，再谈你是谁。", "先领补给，再谈出击。", "镜还在。人还在。"]),
    aya: Object.freeze(["后门关掉。现在才算我自己的任务。", "合同先放下。人还在呼吸。", "拒绝也可以是救援。"]),
    rion: Object.freeze(["借来的强大已经归还。", "名字比刀锋更先到。", "同门的名，我还记得。"]),
  });

  function clampInt(v, a, b) {
    var n = Math.floor(Number(v) || 0);
    if (n < a) return a;
    if (n > b) return b;
    return n;
  }

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function dateKey(d) {
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }

  function todayKey() {
    return dateKey(new Date());
  }

  function weekKey(d) {
    var x = d ? new Date(d.getTime()) : new Date();
    x = new Date(x.getFullYear(), x.getMonth(), x.getDate());
    var day = x.getDay();
    x.setDate(x.getDate() + (day === 0 ? -6 : 1 - day));
    return dateKey(x);
  }

  function eventLeft(now) {
    var t = (now && now.getTime ? now : new Date()).getTime();
    var epoch = new Date(2026, 7, 4, 4, 0, 0).getTime();
    var period = 14 * 24 * 3600 * 1000;
    var elapsed = ((t - epoch) % period + period) % period;
    var left = period - elapsed;
    var days = Math.floor(left / 86400000);
    var hours = Math.floor((left % 86400000) / 3600000);
    return days + "天" + hours + "时";
  }

  function voiceLines(id) {
    return VOICES[charId(id)] || VOICES.sayo;
  }

  function shiftKey(days) {
    var d = new Date();
    d.setDate(d.getDate() + days);
    return dateKey(d);
  }

  function charId(id) {
    return id === "aya" || id === "rion" ? id : "sayo";
  }

  function defaultMeta() {
    return {
      ready: 0,
      prism: 0,
      shard: 0,
      login: { date: "", streak: 0 },
      claimed: { missions: {}, mail: {} },
      read: { mail: {}, notices: {} },
      bond: { sayo: 0, aya: 0, rion: 0 },
      friend: "sayo",
      gachaSeen: 0,
      ticket: 0,
      energy: 0,
      missionStamp: { day: "", week: "", kills: 0, pulls: 0, clears: 0 },
      seenCards: {},
    };
  }

  function ensureMeta(save) {
    if (!save || typeof save !== "object") return defaultMeta();
    if (!save.shell46 || typeof save.shell46 !== "object" || Array.isArray(save.shell46)) save.shell46 = defaultMeta();
    var meta = save.shell46;
    if (!meta.login || typeof meta.login !== "object" || Array.isArray(meta.login)) meta.login = { date: "", streak: 0 };
    if (!meta.claimed || typeof meta.claimed !== "object" || Array.isArray(meta.claimed)) meta.claimed = { missions: {}, mail: {} };
    if (!meta.claimed.missions || typeof meta.claimed.missions !== "object") meta.claimed.missions = {};
    if (!meta.claimed.mail || typeof meta.claimed.mail !== "object") meta.claimed.mail = {};
    if (!meta.read || typeof meta.read !== "object" || Array.isArray(meta.read)) meta.read = { mail: {}, notices: {} };
    if (!meta.read.mail || typeof meta.read.mail !== "object") meta.read.mail = {};
    if (!meta.read.notices || typeof meta.read.notices !== "object") meta.read.notices = {};
    if (!meta.bond || typeof meta.bond !== "object" || Array.isArray(meta.bond)) meta.bond = { sayo: 0, aya: 0, rion: 0 };
    if (!meta.missionStamp || typeof meta.missionStamp !== "object" || Array.isArray(meta.missionStamp)) {
      meta.missionStamp = { day: "", week: "", kills: 0, pulls: 0, clears: 0 };
    }
    if (!meta.seenCards || typeof meta.seenCards !== "object" || Array.isArray(meta.seenCards)) meta.seenCards = {};
    if (!meta.ready) {
      meta.prism = 80;
      meta.shard = 40;
      meta.ticket = clampInt(meta.ticket, 0, 999999) + 1;
      meta.ready = 1;
    }
    meta.prism = clampInt(meta.prism, 0, 999999);
    meta.shard = clampInt(meta.shard, 0, 999999);
    meta.ticket = clampInt(meta.ticket, 0, 999999);
    meta.energy = clampInt(meta.energy, 0, 49);
    meta.login.date = typeof meta.login.date === "string" ? meta.login.date : "";
    meta.login.streak = clampInt(meta.login.streak, 0, 7);
    meta.bond.sayo = clampInt(meta.bond.sayo, 0, 1500);
    meta.bond.aya = clampInt(meta.bond.aya, 0, 1500);
    meta.bond.rion = clampInt(meta.bond.rion, 0, 1500);
    meta.friend = charId(meta.friend);
    meta.gachaSeen = meta.gachaSeen ? 1 : 0;
    return meta;
  }

  function grant(save, meta, pack) {
    if (!pack) return;
    save.coins = clampInt((Number(save.coins) || 0) + (pack.coins || 0), 0, 999999);
    meta.prism = clampInt(meta.prism + (pack.prism || 0), 0, 999999);
    meta.shard = clampInt(meta.shard + (pack.shard || 0), 0, 999999);
    if (pack.ticket) meta.ticket = clampInt(meta.ticket + pack.ticket, 0, 999999);
  }

  function missionRaw(save, id) {
    if (id === "kill") return Math.max(0, Math.floor(Number(save && save.kills) || 0));
    if (id === "clear") return ((save && save.done) || []).length;
    if (id === "pull") return ((((save && save.shop40) || {}).ops || {}).pulls) || 0;
    return 0;
  }

  function rollMissions(save) {
    var meta = ensureMeta(save);
    var stamp = meta.missionStamp;
    var today = todayKey();
    var week = weekKey();
    if (!stamp.day) {
      stamp.day = today;
      stamp.kills = 0;
      stamp.pulls = 0;
    } else if (stamp.day !== today) {
      stamp.day = today;
      stamp.kills = missionRaw(save, "kill");
      stamp.pulls = missionRaw(save, "pull");
      delete meta.claimed.missions.kill;
      delete meta.claimed.missions.pull;
    }
    if (!stamp.week) {
      stamp.week = week;
      stamp.clears = 0;
    } else if (stamp.week !== week) {
      stamp.week = week;
      stamp.clears = missionRaw(save, "clear");
      delete meta.claimed.missions.clear;
    }
    return meta;
  }

  function missionProg(save, id) {
    var meta = rollMissions(save);
    var raw = missionRaw(save, id);
    var stamp = meta.missionStamp;
    if (id === "kill") return Math.max(0, raw - (stamp.kills || 0));
    if (id === "pull") return Math.max(0, raw - (stamp.pulls || 0));
    if (id === "clear") return Math.max(0, raw - (stamp.clears || 0));
    return 0;
  }

  function loginState(save) {
    var meta = ensureMeta(save);
    var today = todayKey();
    var claimedToday = meta.login.date === today;
    var streak = meta.login.streak;
    var next = 1;
    if (claimedToday) next = streak || 1;
    else if (meta.login.date === shiftKey(-1)) next = streak >= 7 ? 1 : streak + 1;
    else next = 1;
    return { today: today, claimedToday: claimedToday, streak: streak, next: next, reward: LOGIN_REWARDS[next - 1] };
  }

  function claimLogin(save) {
    var meta = ensureMeta(save);
    var st = loginState(save);
    if (st.claimedToday) return { ok: false, reason: "today", coins: save.coins };
    meta.login.date = st.today;
    meta.login.streak = st.next;
    grant(save, meta, st.reward);
    return { ok: true, day: st.next, coins: save.coins, prism: meta.prism, shard: meta.shard, ticket: meta.ticket };
  }

  function claimMission(save, id) {
    var meta = rollMissions(save);
    var row = MISSIONS.filter(function (m) { return m.id === id; })[0];
    if (!row) return { ok: false, reason: "id" };
    if (meta.claimed.missions[id]) return { ok: false, reason: "claimed" };
    if (missionProg(save, id) < row.need) return { ok: false, reason: "need" };
    meta.claimed.missions[id] = 1;
    grant(save, meta, { coins: row.coins, shard: 0, prism: 0 });
    return { ok: true, coins: save.coins };
  }

  function claimMail(save, id) {
    var meta = ensureMeta(save);
    var mail = MAILS.filter(function (m) { return m.id === id; })[0];
    if (!mail) return { ok: false, reason: "id" };
    meta.read.mail[id] = 1;
    if (mail.need === "pull" && missionRaw(save, "pull") < 1) return { ok: false, reason: "need", read: 1 };
    if (meta.claimed.mail[id]) return { ok: false, reason: "claimed", read: 1 };
    meta.claimed.mail[id] = 1;
    grant(save, meta, { coins: mail.coins || 0, shard: mail.shard || 0, prism: 0 });
    return { ok: true, coins: save.coins, shard: meta.shard };
  }

  function readNotice(save, id) {
    var meta = ensureMeta(save);
    var row = NOTICES.filter(function (n) { return n.id === id; })[0];
    if (!row) return { ok: false, reason: "id" };
    meta.read.notices[id] = 1;
    return { ok: true };
  }

  function giftBond(save, id) {
    var who = charId(id);
    var meta = ensureMeta(save);
    if (clampInt(save && save.coins, 0, 999999) < 40) return { ok: false, reason: "coins" };
    save.coins = clampInt(save.coins - 40, 0, 999999);
    meta.bond[who] = clampInt(meta.bond[who] + 80, 0, 1500);
    return { ok: true, coins: save.coins, bond: bondOf(save, who) };
  }

  function setFriend(save, id) {
    var meta = ensureMeta(save);
    meta.friend = charId(id);
    return { ok: true, friend: meta.friend };
  }

  function friendOf(save) {
    return charId(ensureMeta(save).friend);
  }

  function isMainCard(id) {
    return /^(sayo_|aya_|rion_)/.test(String(id || ""));
  }

  function markSeen(save, id) {
    var meta = ensureMeta(save);
    if (!id) return { ok: false };
    meta.seenCards[id] = 1;
    return { ok: true, id: id };
  }

  function isNewCard(save, id, count) {
    if (!id || count < 1) return false;
    if (id === "sayo_echo" || id === "aya_petal") return false;
    return !ensureMeta(save).seenCards[id];
  }

  function archiveStats(save, api) {
    var done = Math.min(4, (((save && save.done) || []).length) || 0);
    var achDone = api && api.achDone != null ? Number(api.achDone) || 0 : 0;
    var achTotal = api && api.achTotal != null ? Number(api.achTotal) || 0 : 0;
    var tal = 0;
    var bag = (save && save.tal) || {};
    Object.keys(bag).forEach(function (key) {
      tal += Number(bag[key]) || 0;
    });
    var owned = 0;
    var cards = ((((save || {}).shop40) || {}).ops || {}).owned || {};
    Object.keys(cards).forEach(function (key) {
      if (Number(cards[key]) > 0) owned += 1;
    });
    return { done: done, achDone: achDone, achTotal: achTotal, tal: tal, owned: owned };
  }

  function talentRows(api) {
    var save = api && api.save;
    var src = api && api.talents && api.talents.length ? api.talents : TALENT_FALLBACK;
    return src.map(function (row) {
      var lv = row.lv != null ? row.lv : ((((save && save.tal) || {})[row.id]) || 0);
      return { id: row.id, n: row.n, i: row.i || "✦", d: row.d || "", lv: lv, max: row.max || 10 };
    });
  }

  function storyRows(api) {
    var save = api && api.save;
    var src = api && api.stories && api.stories.length ? api.stories : STORY_FALLBACK;
    var unlocked = (save && save.story) || [];
    return src.map(function (row, index) {
      return { n: row.n, i: row.i, d: row.d, on: unlocked.indexOf(index) >= 0 };
    });
  }

  function exchange(save, id) {
    var meta = ensureMeta(save);
    var row = EXCHANGES.filter(function (x) { return x.id === id; })[0];
    if (!row) return { ok: false, reason: "id" };
    var pay = row.pay === "coins" ? clampInt(save && save.coins, 0, 999999) : meta[row.pay];
    if (pay < row.payN) return { ok: false, reason: "short" };
    if (row.pay === "coins") save.coins = clampInt(save.coins - row.payN, 0, 999999);
    else meta[row.pay] = clampInt(meta[row.pay] - row.payN, 0, 999999);
    if (row.get === "coins") save.coins = clampInt((save.coins || 0) + row.getN, 0, 999999);
    else meta[row.get] = clampInt(meta[row.get] + row.getN, 0, 999999);
    return { ok: true, coins: save.coins, prism: meta.prism, shard: meta.shard };
  }

  function markGachaSeen(save) {
    var meta = ensureMeta(save);
    meta.gachaSeen = 1;
    return meta;
  }

  function canSpeak() {
    var synth = global.speechSynthesis;
    if (!synth || !global.SpeechSynthesisUtterance) return false;
    var ua = "";
    try {
      ua = String((global.navigator && global.navigator.userAgent) || "");
    } catch (err) {}
    if (/SakurayoAndroid/i.test(ua)) return false;
    if (/Android/i.test(ua) && /;\s*wv\)/i.test(ua)) return false;
    if (/Android/i.test(ua) && typeof synth.getVoices === "function" && !(synth.getVoices() || []).length) return false;
    return true;
  }

  function speakLine(text, api) {
    var line = String(text || "");
    if (!line) return { ok: false };
    var spoken = false;
    if (canSpeak()) {
      try {
        var utter = new global.SpeechSynthesisUtterance(line);
        utter.lang = "zh-CN";
        utter.rate = 0.92;
        utter.onerror = function () {
          if (api && typeof api.feedback === "function") api.feedback("reward", 0.26);
        };
        global.speechSynthesis.cancel();
        global.speechSynthesis.speak(utter);
        spoken = true;
      } catch (err) {}
    }
    if (api && typeof api.feedback === "function") api.feedback(spoken ? "open" : "reward", 0.26);
    say(api, line);
    return { ok: true, spoken: spoken };
  }

  function dots(save) {
    var meta = rollMissions(save);
    var login = loginState(save);
    return {
      mission: MISSIONS.some(function (m) {
        return !meta.claimed.missions[m.id] && missionProg(save, m.id) >= m.need;
      }),
      mail: MAILS.some(function (m) {
        var ready = m.need !== "pull" || missionRaw(save, "pull") >= 1;
        return ready && !meta.claimed.mail[m.id];
      }),
      notice: NOTICES.some(function (n) {
        return !meta.read.notices[n.id];
      }),
      calendar: !login.claimedToday,
      gacha: !meta.gachaSeen,
    };
  }

  function commit(api) {
    if (api && typeof api.commit === "function") api.commit();
  }

  function say(api, text) {
    if (api && typeof api.toast === "function") api.toast(text);
  }

  function feel(api, kind, text) {
    if (api && typeof api.feedback === "function") api.feedback(kind || "reward", 0.34);
    if (text) floatReward(text);
    say(api, text);
  }

  function floatReward(text) {
    var doc = global.document;
    if (!doc || !doc.body || !text) return;
    var node = doc.createElement("div");
    node.className = "shellFloat46";
    node.textContent = text;
    doc.body.appendChild(node);
    setTimeout(function () {
      if (node.parentNode) node.parentNode.removeChild(node);
    }, 920);
  }

  function greetLine(save) {
    var id = charId((save && save.shell46 && save.shell46.friend) || (save && save.character));
    var name = CHAR_NAMES[id] || "月城小夜";
    var login = loginState(save);
    var bond = bondOf(save, id);
    if (!login.claimedToday) return name + "：今日登录补给还在，先领再出击。";
    if (bond.lv >= 4) return name + "：灵纹比上次更稳，今晚可以走深一点。";
    if (missionProg(save, "pull") < 1) return name + "：名册还空着。去镜界寻访一次。";
    if (missionProg(save, "clear") < 1) return name + "：神社外街的灯还亮着。先活过这一章。";
    return name + "：电台还开着。我在门口等你回来。";
  }

  function ensurePetals() {
    var menu = global.document && global.document.getElementById("menu");
    if (!menu || menu.querySelector("#homePetals46")) return;
    var layer = global.document.createElement("div");
    layer.id = "homePetals46";
    var html = "";
    for (var i = 0; i < 8; i++) {
      html +=
        '<i style="left:' +
        (8 + i * 12) +
        "%;animation-delay:" +
        (i * 0.7) +
        "s;animation-duration:" +
        (7.5 + (i % 3)) +
        's"></i>';
    }
    layer.innerHTML = html;
    menu.appendChild(layer);
  }

  function ensureGreet(save) {
    var xp = global.document && global.document.getElementById("homeXp46");
    if (!xp || !xp.parentNode) return;
    var line = global.document.getElementById("homeGreet46");
    if (!line) {
      line = global.document.createElement("small");
      line.id = "homeGreet46";
      xp.insertAdjacentElement("afterend", line);
    }
    line.textContent = greetLine(save);
  }

  function popChip(el, next) {
    if (!el) return;
    var prev = el.dataset.v;
    var text = String(next);
    var chip = el.closest ? el.closest(".homeChip46") : el.parentNode;
    if (prev !== text && chip && chip.classList) {
      chip.classList.add("pop46");
      setTimeout(function () {
        if (chip.classList) chip.classList.remove("pop46");
      }, 280);
    }
    el.dataset.v = text;
    el.textContent = text;
  }

  function clearFloats() {
    $$(".shellFloat46").forEach(function (node) {
      if (node && node.parentNode) node.parentNode.removeChild(node);
    });
  }

  function previewToast(toast) {
    if (typeof toast === "function") toast(PREVIEW);
  }

  function hideDrawers() {
    $$(".drawer").forEach(function (node) {
      node.classList.add("hidden");
    });
  }

  function drawerHtml(id, title, bodyId) {
    return (
      '<section class="drawer shellDrawer46 hidden" id="' +
      id +
      'Drawer"><div class="dhead"><h2>' +
      title +
      '</h2><button class="close" type="button">×</button></div><div class="dbody" id="' +
      bodyId +
      '"></div></section>'
    );
  }

  function ensureDrawers() {
    var doc = global.document;
    if (!doc || !doc.body) return;
    if (doc.getElementById("missionDrawer")) {
      bindCloses();
      return;
    }
    var wrap = doc.createElement("div");
    wrap.id = "shellDrawers46";
    wrap.innerHTML =
      drawerHtml("mission", "每日任务", "missionBody46") +
      drawerHtml("mail", "镜界邮件", "mailBody46") +
      drawerHtml("notice", "作战公告", "noticeBody46") +
      drawerHtml("friend", "支援名册", "friendBody46") +
      drawerHtml("calendar", "登录日历", "calendarBody46") +
      '<section class="drawer shellDrawer46 shellWide46 hidden" id="profileDrawer"><div class="dhead"><h2>角色档案</h2><button class="close" type="button">×</button></div><div class="dbody" id="profileBody46"></div></section>';
    doc.body.appendChild(wrap);
    bindCloses();
  }

  function bindCloses() {
    $$("#shellDrawers46 .close").forEach(function (btn) {
      btn.onclick = hideDrawers;
    });
  }

  function articlePane(title, body) {
    return (
      '<article class="shellPane46"><div class="shellPaneHero46"></div><div class="shellPaneCopy46"><b>' +
      title +
      "</b><p>" +
      body +
      "</p></div></article>"
    );
  }

  function listButton(icon, title, sub, tag, attr, tagClass) {
    var ico = String(icon || "");
    if (ico.indexOf("<i class=\"railIco46") === 0) ico = "<i>" + ico + "</i>";
    else if (ico.indexOf("<") !== 0) ico = "<i>" + ico + "</i>";
    return (
      '<button type="button" class="shellItem46" ' +
      (attr || "") +
      ">" +
      ico +
      "<div><b>" +
      title +
      "</b><small>" +
      sub +
      "</small></div><em class=\"" +
      (tagClass || "") +
      '">' +
      tag +
      "</em></button>"
    );
  }

  function renderMission(host, api) {
    if (!host) return;
    var save = api && api.save;
    var meta = ensureMeta(save);
    host.innerHTML =
      '<p class="shellHint46">本地任务 · 领取写入樱花币</p><div class="shellList46">' +
      MISSIONS.map(function (m) {
        var have = missionProg(save, m.id);
        var got = !!meta.claimed.missions[m.id];
        var ready = !got && have >= m.need;
        var tag = got ? "已领" : ready ? "领取 🌸" + m.coins : have + "/" + m.need;
        return listButton('<i class="railIco46 task"></i>', m.title, m.sub, tag, 'data-claim="mission" data-id="' + m.id + '"', got ? "done46" : ready ? "ready46" : "");
      }).join("") +
      "</div>";
    host.onclick = function (ev) {
      var btn = ev.target.closest ? ev.target.closest("[data-claim=mission]") : null;
      if (!btn) return;
      var out = claimMission(save, btn.getAttribute("data-id"));
      if (!out.ok) {
        say(api, out.reason === "need" ? "进度还没到" : "已经领过了");
        return;
      }
      commit(api);
      feel(api, "reward", "任务 +🌸");
      renderMission(host, api);
    };
  }

  function renderMail(host, api) {
    if (!host) return;
    var save = api && api.save;
    var meta = ensureMeta(save);
    if (!mailPick) mailPick = MAILS[0].id;
    var picked = MAILS.filter(function (m) { return m.id === mailPick; })[0] || MAILS[0];
    host.innerHTML =
      '<p class="shellHint46">本地信箱 · 领取写入存档</p><div class="shellSplit46"><div class="shellList46">' +
      MAILS.map(function (m) {
        var locked = m.need === "pull" && missionRaw(save, "pull") < 1;
        var got = !!meta.claimed.mail[m.id];
        var tag = got ? "已领" : locked ? "未达成" : m.coins || m.shard ? "领取" : "已读";
        return listButton('<i class="railIco46 mail"></i>', m.title, m.sub, tag, 'data-claim="mail" data-id="' + m.id + '"', got ? "done46" : locked ? "" : "ready46");
      }).join("") +
      "</div>" +
      articlePane(picked.title, picked.body || picked.sub) +
      "</div>";
    host.onclick = function (ev) {
      var btn = ev.target.closest ? ev.target.closest("[data-claim=mail]") : null;
      if (!btn) return;
      mailPick = btn.getAttribute("data-id") || mailPick;
      var out = claimMail(save, mailPick);
      commit(api);
      if (!out.ok && out.reason === "need") say(api, "先去镜界寻访一次");
      else if (!out.ok && out.reason === "claimed") say(api, "这封已经领过了");
      else if (out.ok) feel(api, "reward", "邮件签收");
      renderMail(host, api);
    };
  }

  function renderNotice(host, api) {
    if (!host) return;
    var save = api && api.save;
    var meta = ensureMeta(save);
    if (!noticePick) noticePick = NOTICES[0].id;
    var picked = NOTICES.filter(function (n) { return n.id === noticePick; })[0] || NOTICES[0];
    host.innerHTML =
      '<p class="shellHint46">本地公告 · 不联网</p><div class="shellSplit46"><div class="shellList46">' +
      NOTICES.map(function (n) {
        var read = !!meta.read.notices[n.id];
        return listButton('<i class="railIco46 notice"></i>', n.title, n.sub, read ? "已读" : "未读", 'data-claim="notice" data-id="' + n.id + '"', read ? "done46" : "ready46");
      }).join("") +
      "</div>" +
      articlePane(picked.title, picked.body || picked.sub) +
      "</div>";
    host.onclick = function (ev) {
      var btn = ev.target.closest ? ev.target.closest("[data-claim=notice]") : null;
      if (!btn) return;
      noticePick = btn.getAttribute("data-id") || noticePick;
      readNotice(save, noticePick);
      commit(api);
      renderNotice(host, api);
    };
  }

  function renderFriend(host, api) {
    if (!host) return;
    var list = (api && api.characters) || {};
    var save = api && api.save;
    var meta = ensureMeta(save);
    var rows = [
      ["sayo", (list.sayo && list.sayo.name) || "月城小夜", "步枪远程"],
      ["aya", (list.aya && list.aya.name) || "神代绫", "枪刀切换"],
      ["rion", (list.rion && list.rion.name) || "黑羽凛音", "纯太刀"],
    ];
    host.innerHTML =
      '<p class="shellHint46">支援名册 · 本机赠礼加好感，不改局内伤害</p><div class="shellList46">' +
      rows
        .map(function (row) {
          var on = meta.friend === row[0];
          var art = artOf(api, "characters/" + row[0] + "/default/portrait.webp");
          return (
            '<div class="shellItem46 friendCard46">' +
            (art ? '<img alt="" src="' + art + '">' : "<i>友</i>") +
            "<div><b>" +
            row[1] +
            "</b><small>" +
            row[2] +
            (on ? " · 支援中" : "") +
            '</small></div><div class="friendActs46"><button type="button" data-friend="' +
            row[0] +
            '">' +
            (on ? "支援中" : "设为支援") +
            '</button><button type="button" data-gift-friend="' +
            row[0] +
            '">赠礼 40🌸</button></div></div>'
          );
        })
        .join("") +
      "</div>";
    host.onclick = function (ev) {
      var gift = ev.target.closest ? ev.target.closest("[data-gift-friend]") : null;
      if (gift) {
        var who = gift.getAttribute("data-gift-friend");
        var out = giftBond(save, who);
        if (!out.ok) {
          say(api, "樱花币不足 40");
          return;
        }
        commit(api);
        feel(api, "reward", "赠予" + (CHAR_NAMES[charId(who)] || "") + " 好感+80");
        renderFriend(host, api);
        return;
      }
      var btn = ev.target.closest ? ev.target.closest("[data-friend]") : null;
      if (!btn) return;
      var id = btn.getAttribute("data-friend");
      setFriend(save, id);
      jumpProfile = id;
      commit(api);
      say(api, "已设为支援展示");
      if (api && typeof api.openDrawer === "function") api.openDrawer("profile");
      else renderFriend(host, api);
    };
  }

  function rewardLab(pack, mode) {
    var extra = pack && pack.ticket ? "券+" + pack.ticket : "";
    if (mode === "done") return "已领";
    if (mode === "on") return extra ? "领取 · " + extra : "领取";
    return extra ? "🌸 " + pack.coins + " · " + extra : "🌸 " + pack.coins;
  }

  function renderCalendar(host, api) {
    if (!host) return;
    var save = api && api.save;
    var st = loginState(save);
    var days = ["一", "二", "三", "四", "五", "六", "日"];
    var html = '<p class="shellHint46">七日登录 · 樱花币与寻访券写入存档</p><div class="shellCal46">';
    for (var i = 0; i < 7; i++) {
      var day = i + 1;
      var state = "";
      var pack = LOGIN_REWARDS[i];
      var lab = rewardLab(pack, "");
      if (st.claimedToday && day <= st.streak) {
        state = "done";
        lab = "已领";
      } else if (!st.claimedToday && day === st.next) {
        state = "on";
        lab = rewardLab(pack, "on");
      } else if (day < st.next) {
        state = "done";
        lab = "已领";
      }
      html +=
        '<button type="button" class="' +
        state +
        '" data-login-day="' +
        day +
        '"><b>第' +
        days[i] +
        "日</b><small>" +
        lab +
        "</small>" +
        (state === "done" ? '<i class="shellStamp46">领</i>' : "") +
        "</button>";
    }
    host.innerHTML = html + "</div>";
    host.onclick = function (ev) {
      var btn = ev.target.closest ? ev.target.closest("[data-login-day]") : null;
      if (!btn) return;
      if (!btn.classList || !btn.classList.contains("on")) {
        say(api, st.claimedToday ? "今天已经领过了" : "还没到这一天");
        return;
      }
      var out = claimLogin(save);
      if (!out.ok) {
        say(api, "今天已经领过了");
        return;
      }
      commit(api);
      btn.classList.remove("on");
      btn.classList.add("stamped46");
      if (!btn.querySelector(".shellStamp46")) {
        var seal = global.document.createElement("i");
        seal.className = "shellStamp46";
        seal.textContent = "领";
        btn.appendChild(seal);
      }
      var small = btn.querySelector("small");
      if (small) small.textContent = "已领";
      var fly = "第" + out.day + "日 +" + (st.reward && st.reward.coins ? st.reward.coins : "") + "🌸";
      if (st.reward && st.reward.ticket) fly += " · 券+" + st.reward.ticket;
      feel(api, "reward", fly);
      setTimeout(function () {
        if (host && host.parentNode) renderCalendar(host, api);
      }, 720);
    };
  }

  function talentBlock(api) {
    var rows = talentRows(api);
    var html = '<p>永久天赋写入现有存档。本页只读等级，升级仍走天赋房。</p><div class="shellList46">';
    rows.forEach(function (row) {
      html +=
        '<div class="shellItem46"><i>' +
        row.i +
        "</i><div><b>" +
        row.n +
        "</b><small>" +
        row.d +
        "</small></div><em>" +
        row.lv +
        "/" +
        row.max +
        "</em></div>";
    });
    return html + '</div><p><button type="button" data-open-real="talent">打开天赋</button></p>';
  }

  function storyBlock(api) {
    var rows = storyRows(api);
    var html = '<p>正文章节仍走樱夜档案。通关后的抉择留在剧情房，不改枪口。</p><div class="shellList46">';
    rows.forEach(function (row) {
      html +=
        '<div class="shellItem46"><i>' +
        (row.on ? row.i || "章" : "?") +
        "</i><div><b>" +
        (row.on ? row.n : "未解锁档案") +
        "</b><small>" +
        (row.on ? row.d : "通关对应章节后解锁。") +
        '</small></div><em class="' +
        (row.on ? "done46" : "") +
        '">' +
        (row.on ? "已阅" : "锁定") +
        "</em></div>";
    });
    return html + '</div><p><button type="button" data-open-real="story">打开剧情档案</button></p>';
  }

  function artOf(api, rel) {
    if (api && typeof api.artUrl === "function") {
      try {
        return String(api.artUrl(rel) || "");
      } catch (err) {}
    }
    if (typeof global.artUrl === "function") {
      try {
        return String(global.artUrl(rel) || "");
      } catch (err2) {}
    }
    return "";
  }

  function renderProfile(host, api) {
    if (!host) return;
    var chars = (api && api.characters) || {};
    var id = profileId === "aya" || profileId === "rion" ? profileId : "sayo";
    var c = chars[id] || { name: CHAR_NAMES[id] || "月城小夜", weapon: "夜樱突击步枪", role: "远程压制", desc: "" };
    var extra = DOSSIERS[id] || DOSSIERS.sayo;
    var bond = bondOf(api && api.save, id);
    var art = artOf(api, "characters/" + id + "/default/portrait.webp");
    var tab = profileTab;
    var body =
      tab === "talent"
        ? talentBlock(api)
        : tab === "story"
          ? storyBlock(api)
          : tab === "voice"
            ? '<p>离线语音 · 本机合成，不外链。</p><div class="profileVoice46">' +
              voiceLines(id)
                .map(function (line) {
                  return '<button type="button" data-speak="' + line.replace(/"/g, "") + '">▶ ' + line + "</button>";
                })
                .join("") +
              "</div>"
            : "<p>" +
              (c.desc || "") +
              "</p><div class=\"profileMeta46\"><div><b>生日</b><span>" +
              extra.birth +
              "</span></div><div><b>身高</b><span>" +
              extra.height +
              "</span></div><div><b>武器</b><span>" +
              (c.weapon || "") +
              "</span></div><div><b>所属</b><span>" +
              extra.team +
              "</span></div></div>";
    host.innerHTML =
      '<div class="profileHero46"><img alt="" src="' +
      art +
      '"></div><div><nav class="profileChars46">' +
      [["sayo", "小夜"], ["aya", "绫"], ["rion", "凛音"]]
        .map(function (pair) {
          return (
            '<button type="button" data-profile-char="' +
            pair[0] +
            '"' +
            (id === pair[0] ? ' class="on"' : "") +
            ">" +
            pair[1] +
            "</button>"
          );
        })
        .join("") +
      '</nav><nav class="profileTabs46">' +
      [["base", "基础档案"], ["talent", "天赋能力"], ["story", "剧情记录"], ["voice", "语音记录"]]
        .map(function (pair) {
          return (
            '<button type="button" data-profile-tab="' +
            pair[0] +
            '"' +
            (tab === pair[0] ? ' class="on"' : "") +
            ">" +
            pair[1] +
            "</button>"
          );
        })
        .join("") +
      "</nav><b>" +
      (c.name || CHAR_NAMES[id] || "") +
      "</b><small>" +
      extra.en +
      " · " +
      (c.role || "") +
      "</small>" +
      body +
      '<div class="profileBond46"><i>♥</i><b>好感度 Lv.' +
      bond.lv +
      '</b><small>' +
      bond.now +
      "/" +
      bond.max +
      '</small><div class="rail"><em style="width:' +
      Math.round((bond.now / bond.max) * 100) +
      '%"></em></div><div class="profileGift46"><button type="button" data-gift="heart" aria-label="好感">♥</button><button type="button" data-gift="give" aria-label="赠礼">赠</button><button type="button" data-gift="voice" aria-label="语音">声</button><button type="button" data-gift="skin" aria-label="衣装">衣</button></div></div></div>';
    var img = host.querySelector("img");
    if (img) img.onerror = function () { img.style.display = "none"; };
    host.onclick = function (ev) {
      var charBtn = ev.target.closest ? ev.target.closest("[data-profile-char]") : null;
      if (charBtn) {
        profileId = charBtn.getAttribute("data-profile-char") || "sayo";
        profileTab = "base";
        renderProfile(host, api);
        return;
      }
      var btn = ev.target.closest ? ev.target.closest("[data-profile-tab]") : null;
      if (btn) {
        profileTab = btn.getAttribute("data-profile-tab") || "base";
        renderProfile(host, api);
        return;
      }
      var real = ev.target.closest ? ev.target.closest("[data-open-real]") : null;
      if (real && api && typeof api.openDrawer === "function") {
        api.openDrawer(real.getAttribute("data-open-real"));
        return;
      }
      var speak = ev.target.closest ? ev.target.closest("[data-speak]") : null;
      if (speak) {
        speakLine(speak.getAttribute("data-speak"), api);
        return;
      }
      var gift = ev.target.closest ? ev.target.closest("[data-gift]") : null;
      if (!gift) return;
      var act = gift.getAttribute("data-gift");
      if (act === "voice") {
        profileTab = "voice";
        renderProfile(host, api);
        speakLine(voiceLines(id)[0], api);
        return;
      }
      if (act === "skin" && api && typeof api.openDrawer === "function") {
        api.openDrawer("shop");
        return;
      }
      if (act === "heart" || act === "give") {
        var out = giftBond(api && api.save, id);
        if (!out.ok) {
          say(api, "樱花币不足 40");
          return;
        }
        commit(api);
        feel(api, "reward", "好感 +80");
        renderProfile(host, api);
      }
    };
  }

  function bannerHtml(api) {
    var sayo = artOf(api, "gacha/hero_sayo.webp");
    var aya = artOf(api, "gacha/hero_aya.webp");
    var rion = artOf(api, "gacha/hero_rion.webp");
    return (
      '<nav class="gachaBanners46">' +
      '<button type="button" data-gacha-banner="moon"><img alt="" src="' +
      sayo +
      '"><div><b>新月之扉</b><small>当前卡池</small></div></button>' +
      '<button type="button" data-gacha-banner="fate"><img alt="" src="' +
      aya +
      '"><div><b>命运交错</b><small>同步卡池</small></div></button>' +
      '<button type="button" data-gacha-banner="normal"><img alt="" src="' +
      rion +
      '"><div><b>常规寻访</b><small>常规卡池</small></div></button>' +
      "</nav>"
    );
  }

  function featureHtml(save, handlers) {
    var id = gachaBanner === "fate" ? "aya" : gachaBanner === "normal" ? "rion" : (handlers && handlers.character) || (save && save.character) || "sayo";
    if (id !== "aya" && id !== "rion") id = "sayo";
    var money = wallets(save);
    var upLab = gachaBanner === "normal" ? "常规均权" : "本期概率提升";
    return (
      '<div class="gachaFeature46"><em>★★★★★★</em><b>' +
      (CHAR_NAMES[id] || "月城小夜") +
      "</b><small>" +
      upLab +
      "</small><i>结束时间：" +
      eventLeft() +
      '</i></div><div class="gachaEnergy46">当前能量：' +
      money.energy +
      "/50</div>"
    );
  }

  function paintGachaBanners(host) {
    $$("[data-gacha-banner]", host).forEach(function (btn) {
      btn.classList.toggle("on", btn.getAttribute("data-gacha-banner") === gachaBanner);
    });
  }

  function decorateGacha(host, save, handlers, toast) {
    if (!host) return;
    var stage = host.querySelector ? host.querySelector(".wishStage46") : null;
    if (stage && !stage.querySelector(".gachaBanners46")) {
      stage.insertAdjacentHTML("afterbegin", bannerHtml({ artUrl: handlers && handlers.art }));
      stage.addEventListener("click", function (ev) {
        var btn = ev.target.closest ? ev.target.closest("[data-gacha-banner]") : null;
        if (!btn) return;
        gachaBanner = btn.getAttribute("data-gacha-banner") || "moon";
        var feat = stage.querySelector(".gachaFeature46");
        var energy = stage.querySelector(".gachaEnergy46");
        if (feat && feat.parentNode) feat.parentNode.removeChild(feat);
        if (energy && energy.parentNode) energy.parentNode.removeChild(energy);
        stage.insertAdjacentHTML("beforeend", featureHtml(save, handlers));
        var hero = stage.querySelector(".wishHero46");
        var who = gachaBanner === "fate" ? "aya" : gachaBanner === "normal" ? "rion" : "sayo";
        if (hero && handlers && typeof handlers.art === "function") {
          try { hero.src = handlers.art("gacha/hero_" + who + ".webp") || hero.src; } catch (err) {}
        }
        paintGachaBanners(host);
        paintHomeBanner();
      });
    }
    if (stage && !stage.querySelector(".gachaFeature46")) {
      stage.insertAdjacentHTML("beforeend", featureHtml(save, handlers));
    }
    paintGachaBanners(host);
    var title = host.querySelector ? host.querySelector(".wishTitle46 h3") : null;
    if (title) title.textContent = "镜界寻访";
    var one = host.querySelector ? host.querySelector("#gachaPull1") : null;
    var ten = host.querySelector ? host.querySelector("#gachaPull10") : null;
    if (one && one.querySelector("small")) one.childNodes[0].nodeValue = "寻访一次";
    if (ten && ten.querySelector("small")) ten.childNodes[0].nodeValue = "寻访十次";
  }

  function decorateRoster(host, save, handlers, api) {
    if (!host) return;
    var stage = host.querySelector ? host.querySelector(".rosterStage46") : null;
    var wall = host.querySelector ? host.querySelector("#rosterWall46") : null;
    if (!stage || !wall) return;
    if (!stage.querySelector(".rosterFilter46")) {
      var bar = global.document.createElement("div");
      bar.className = "rosterFilter46";
      bar.innerHTML =
        '<button type="button" data-roster-filter="all">全部</button>' +
        '<button type="button" data-roster-filter="main">主攻</button>' +
        '<button type="button" data-roster-filter="SSR">SSR</button>' +
        '<button type="button" data-roster-filter="SR">SR</button>' +
        "<span></span>";
      stage.insertBefore(bar, wall);
      bar.addEventListener("click", function (ev) {
        var btn = ev.target.closest ? ev.target.closest("[data-roster-filter]") : null;
        if (!btn) return;
        rosterFilter = btn.getAttribute("data-roster-filter") || "all";
        paintRosterFilter(host);
      });
    }
    $$(".rosterSlot46", host).forEach(function (slot) {
      if (slot.classList.contains("lock")) return;
      var id = slot.getAttribute("data-card") || "";
      var count = Number(slot.getAttribute("data-count") || 0);
      if (!count) {
        var small = slot.querySelector("small");
        var text = small ? String(small.textContent || "") : "";
        var hit = text.match(/×(\d+)/);
        count = hit ? Number(hit[1]) : 0;
      }
      var neu = isNewCard(save, id, count);
      var oldNew = slot.querySelector(".rosterNew46");
      if (neu && !oldNew) {
        var mark = global.document.createElement("span");
        mark.className = "rosterNew46";
        mark.textContent = "NEW";
        (slot.querySelector(".rosterArt46") || slot).appendChild(mark);
      } else if (!neu && oldNew && oldNew.parentNode) {
        oldNew.parentNode.removeChild(oldNew);
      }
      if (count >= 2 && !slot.querySelector(".rosterAwaken46")) {
        var ribbon = global.document.createElement("span");
        ribbon.className = "rosterAwaken46";
        ribbon.textContent = "AWAKEN";
        (slot.querySelector(".rosterArt46") || slot).appendChild(ribbon);
      }
      var prev = slot.onclick;
      slot.onclick = function (ev) {
        if (typeof prev === "function") prev.call(slot, ev);
        if (id && save) {
          markSeen(save, id);
          commit(api);
        }
      };
    });
    paintRosterFilter(host);
  }

  function paintRosterFilter(host) {
    $$("[data-roster-filter]", host).forEach(function (btn) {
      btn.classList.toggle("on", btn.getAttribute("data-roster-filter") === rosterFilter);
    });
    var shown = 0;
    var total = 0;
    $$(".rosterSlot46", host).forEach(function (slot) {
      total += 1;
      var rare = "all";
      if (slot.classList.contains("r-SSR")) rare = "SSR";
      else if (slot.classList.contains("r-SR")) rare = "SR";
      var role = slot.getAttribute("data-role") || (isMainCard(slot.getAttribute("data-card")) ? "main" : "item");
      var hide = false;
      if (rosterFilter === "main") hide = role !== "main";
      else if (rosterFilter !== "all") hide = rare !== rosterFilter;
      slot.classList.toggle("off", hide);
      if (!slot.classList.contains("lock") && !hide) shown += 1;
    });
    var lab = host.querySelector ? host.querySelector(".rosterFilter46 span") : null;
    if (lab) lab.textContent = "已收集：" + shown + "/" + total;
  }

  function decorateShop(drawer, api) {
    if (!drawer) return;
    var body = drawer.querySelector ? drawer.querySelector(".dbody") : null;
    if (!body) return;
    ensureShopHead(drawer, api && api.save);
    var rail = body.querySelector(".shopRail46");
    if (!rail) {
      rail = global.document.createElement("nav");
      rail.className = "shopRail46";
      rail.innerHTML =
        '<button type="button" data-shop-rail="featured">羁绊</button>' +
        '<button type="button" data-shop-rail="skins">衣装</button>' +
        '<button type="button" data-shop-rail="starters">初心</button>' +
        '<button type="button" data-shop-rail="items">道具</button>' +
        '<button type="button" data-shop-rail="talismans">补给符</button>' +
        '<button type="button" data-shop-rail="exchange">兑换区</button>';
      var list = body.querySelector("#shopList");
      if (list) body.insertBefore(rail, list);
      else body.appendChild(rail);
      rail.addEventListener("click", function (ev) {
        var btn = ev.target.closest ? ev.target.closest("[data-shop-rail]") : null;
        if (!btn) return;
        var id = btn.getAttribute("data-shop-rail");
        shopRail = id;
        if (id !== "exchange" && id !== "featured" && api && typeof api.clickTab === "function") api.clickTab(id);
        if (id === "featured" && api && typeof api.clickTab === "function") api.clickTab("skins");
        paintShopRail(drawer);
        fillFeatured(drawer, api);
        fillExchange(drawer, api);
      });
    }
    paintShopRail(drawer);
    fillFeatured(drawer, api);
    fillExchange(drawer, api);
  }

  function paintShopRail(drawer) {
    $$("[data-shop-rail]", drawer).forEach(function (btn) {
      btn.classList.toggle("on", btn.getAttribute("data-shop-rail") === shopRail);
    });
    if (drawer && drawer.classList) {
      drawer.classList.toggle("isFeatured46", shopRail === "featured");
      drawer.classList.toggle("isExchange46", shopRail === "exchange");
    }
  }

  function setShopRail(id) {
    shopRail = id || "featured";
    return shopRail;
  }

  function moneyLab(kind) {
    if (kind === "coins") return "🌸";
    if (kind === "prism") return "棱晶";
    if (kind === "ticket") return "寻访券";
    return "碎片";
  }

  function moneyIco(kind) {
    if (kind === "coins") return "sakura";
    if (kind === "prism") return "prism";
    if (kind === "ticket") return "ticket";
    return "shard";
  }

  function findShopAction(drawer, group, titlePart) {
    var cards = $$("[data-shop-group=" + group + "] .shopItem40", drawer);
    for (var i = 0; i < cards.length; i++) {
      var h = cards[i].querySelector("h3");
      if (!h || String(h.textContent || "").indexOf(titlePart) < 0) continue;
      var up = cards[i].querySelector(".shopUpgrade40");
      if (up && !up.disabled) return up;
      return cards[i].querySelector("button");
    }
    return null;
  }

  function buyFeatured(drawer, api, kind, id, title) {
    if (kind === "exchange") {
      var out = exchange(api && api.save, id);
      if (!out.ok) {
        say(api, "货币不足");
        return out;
      }
      commit(api);
      feel(api, "reward", id === "coin-ticket" ? "寻访券 +1" : "兑换完成");
      paintCurrencies(api && api.save);
      return out;
    }
    var group = kind === "starter" ? "starters" : kind === "item" ? "items" : "talismans";
    var btn = findShopAction(drawer, group, title);
    if (!btn || btn.disabled) {
      say(api, "货币不足或已满级");
      return { ok: false };
    }
    btn.click();
    return { ok: true };
  }

  function fillExchange(drawer, api) {
    var list = drawer && drawer.querySelector ? drawer.querySelector("#shopList") : null;
    if (!list) return;
    var shelf = list.querySelector("#shopExchange46");
    if (!shelf) {
      shelf = global.document.createElement("section");
      shelf.id = "shopExchange46";
      list.insertBefore(shelf, list.firstChild);
    }
    var save = api && api.save;
    var money = wallets(save);
    shelf.innerHTML = EXCHANGES.map(function (row) {
      return (
        '<div class="shopGood46"><i class="shopGoodIco46 ' +
        moneyIco(row.get) +
        '"></i><div class="shopGoodBar46"><div><b>' +
        row.title +
        "</b><small>" +
        moneyLab(row.pay) +
        " " +
        row.payN +
        " → " +
        moneyLab(row.get) +
        " " +
        row.getN +
        '</small></div><button type="button" data-exchange="' +
        row.id +
        '">兑换</button></div></div>'
      );
    }).join("") + "<p class=\"shellHint46\">当前 棱晶 " + money.prism + " · 碎片 " + money.shard + " · 寻访券 " + money.ticket + " · 🌸 " + money.sakura + "</p>";
    shelf.onclick = function (ev) {
      var btn = ev.target.closest ? ev.target.closest("[data-exchange]") : null;
      if (!btn) return;
      var out = exchange(save, btn.getAttribute("data-exchange"));
      if (!out.ok) {
        say(api, "货币不足");
        return;
      }
      commit(api);
      feel(api, "reward", "兑换完成");
      fillExchange(drawer, api);
      paintCurrencies(save);
    };
  }

  function featuredGoods(save) {
    var shop = (save && save.shop40) || {};
    var starterLv = ((shop.starter || {}).assault) || 0;
    var itemLv = ((shop.items || {}).ammo) || 0;
    var coins = clampInt(save && save.coins, 0, 999999);
    var starterCost = 65 + starterLv * 55;
    var itemCost = 140;
    return [
      {
        id: "assault",
        kind: "starter",
        title: "夜樱火控核心",
        ico: "core",
        label: starterLv >= 5 ? "已满级" : starterLv ? "升级 🌸 " + starterCost : coins >= starterCost ? "🌸 " + starterCost : "还差 🌸 " + (starterCost - coins),
        disabled: starterLv >= 5 || coins < starterCost,
      },
      {
        id: "ammo",
        kind: "item",
        title: "穿甲弹匣",
        ico: "ammo",
        label: itemLv ? "已购" : coins >= itemCost ? "🌸 " + itemCost : "还差 🌸 " + (itemCost - coins),
        disabled: !!itemLv || coins < itemCost,
      },
      {
        id: "coin-ticket",
        kind: "exchange",
        title: "寻访券",
        ico: "ticket",
        label: coins >= 160 ? "🌸 160" : "还差 🌸 " + (160 - coins),
        disabled: coins < 160,
      },
    ];
  }

  function fillFeatured(drawer, api) {
    var list = drawer && drawer.querySelector ? drawer.querySelector("#shopList") : null;
    if (!list) return;
    var shelf = list.querySelector("#shopFeatured46");
    if (!shelf) {
      shelf = global.document.createElement("section");
      shelf.id = "shopFeatured46";
    }
    if (shelf.parentNode !== list || list.firstChild !== shelf) {
      list.insertBefore(shelf, list.firstChild);
    }
    var skins = $$("[data-shop-group=skins] .skinCard", list).slice(0, 3);
    shelf.innerHTML = "";
    skins.forEach(function (card, index) {
      var clone = card.cloneNode(true);
      clone.className = "shopSkin46";
      var preview = clone.querySelector(".skinPreview");
      if (preview) preview.className = "shopSkinPrev46";
      var srcBtn = card.querySelector("button");
      var btn = clone.querySelector("button");
      if (btn && srcBtn) btn.onclick = function () { srcBtn.click(); };
      clone.setAttribute("data-shelf", "skin-" + index);
      shelf.appendChild(clone);
    });
    featuredGoods(api && api.save).forEach(function (good) {
      var node = global.document.createElement("div");
      node.className = "shopGood46";
      node.setAttribute("data-shop-buy", good.kind + ":" + good.id);
      node.innerHTML =
        '<i class="shopGoodIco46 ' +
        good.ico +
        '"></i><div class="shopGoodBar46"><b>' +
        good.title +
        '</b><button type="button"' +
        (good.disabled ? " disabled" : "") +
        ">" +
        good.label +
        "</button></div>";
      node.querySelector("button").onclick = function () {
        buyFeatured(drawer, api, good.kind, good.id, good.title);
      };
      shelf.appendChild(node);
    });
    var hint = global.document.createElement("p");
    hint.className = "shellHint46";
    hint.textContent = "衣装只改外观 · 核心/道具写入存档 · 不出售永久伤害";
    shelf.appendChild(hint);
  }

  function chapterIndex(cards) {
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      var cls = card.className || "";
      if (card.id === "storyRecap39") continue;
      if (/\b(charLore|recap39|hiddenStory40|extensionStory41)\b/.test(cls)) continue;
      return i;
    }
    return 0;
  }

  function decorateStory(drawer, stories, save, api) {
    if (!drawer) return;
    var list = drawer.querySelector ? drawer.querySelector("#storyList") : null;
    if (!list) return;
    drawer.classList.add("storyShell46");
    var head = drawer.querySelector(".dhead h2");
    if (head) head.textContent = "剧情档案";
    var pane = list.querySelector(".storyPane46");
    if (!pane) {
      pane = global.document.createElement("div");
      pane.className = "storyPane46";
      list.appendChild(pane);
    } else {
      list.appendChild(pane);
    }
    var cards = $$(".storyCard", list).filter(function (card) {
      return !card.classList.contains("storyPane46");
    });
    if (!cards.length) return;
    var acts = ["第一幕", "第二幕", "第三幕", "第四幕", "终间章"];
    var chapterNo = 0;
    cards.forEach(function (card) {
      var cls = card.className || "";
      if (card.id === "storyRecap39" || /\b(charLore|recap39|hiddenStory40|extensionStory41)\b/.test(cls)) return;
      if (!card.querySelector(".storyAct46") && acts[chapterNo]) {
        var lab = global.document.createElement("small");
        lab.className = "storyAct46";
        lab.textContent = acts[chapterNo];
        var heading = card.querySelector("h3");
        if (heading && heading.parentNode) heading.parentNode.insertBefore(lab, heading);
      }
      chapterNo += 1;
    });
    if (!storyTouched) storyPick = chapterIndex(cards);
    if (storyPick >= cards.length) storyPick = 0;
    cards.forEach(function (card, index) {
      card.classList.toggle("on", index === storyPick);
      card.onclick = function () {
        storyTouched = true;
        storyPick = index;
        decorateStory(drawer, stories, save, api);
      };
    });
    var selected = cards[storyPick];
    var title = selected && selected.querySelector("h3");
    var text = selected && selected.querySelector("p");
    var done = ((save && save.done) || []).length;
    var face = selected && selected.querySelector("img");
    var stages = (api && api.stages) || [];
    var stage = stages.length ? stages[Math.min(storyPick, stages.length - 1)] : null;
    var src = stage && stage.img ? stage.img : face && face.getAttribute("src") ? face.getAttribute("src") : artOf(api, "ui/lobby_wide.webp");
    pane.innerHTML =
      (src ? '<img alt="" src="' + src + '">' : "") +
      '<div class="storyPaneCopy46"><b>' +
      (title ? title.textContent : "未解锁档案") +
      "</b><p>" +
      (text ? text.textContent : "通关对应章节后解锁。") +
      "</p><em>完成度：" +
      Math.round((Math.min(4, done) / 4) * 100) +
      "%</em></div>";
    var paneImg = pane.querySelector("img");
    if (paneImg) paneImg.onerror = function () { paneImg.style.display = "none"; };
  }

  function toggleDot(sel, on) {
    $$(sel).forEach(function (node) {
      node.classList.toggle("hasDot46", !!on);
    });
  }

  function paintDots(save) {
    var d = dots(save);
    toggleDot("#homeRail46 [data-home=mission]", d.mission);
    toggleDot("#homeRail46 [data-home=mail]", d.mail);
    toggleDot("#homeRail46 [data-home=notice]", d.notice);
    toggleDot("#homeQuick46 .homeIco46.cal", d.calendar);
    toggleDot("#menu.homeDock46 .homeNav46 [data-open=gacha]", d.gacha);
    return d;
  }

  function bannerLab() {
    return gachaBanner === "normal" ? "常规均权" : "本期概率提升";
  }

  function paintHomeBanner() {
    var host = global.document && global.document.getElementById("homeBanner46");
    if (!host) return "";
    var lab = bannerLab() + " · " + eventLeft();
    var small = host.querySelector("small");
    if (small) small.textContent = lab;
    var title = host.querySelector("b");
    if (title) {
      title.textContent = gachaBanner === "fate" ? "命运交错" : gachaBanner === "normal" ? "常规寻访" : "新月之誓";
    }
    var dots = host.querySelectorAll(".homeBannerDots46 > i");
    if (dots && dots.length) {
      var idx = gachaBanner === "fate" ? 1 : gachaBanner === "normal" ? 2 : 0;
      for (var i = 0; i < dots.length; i++) dots[i].classList.toggle("on", i === idx);
    }
    return lab;
  }

  function ensureShopHead(drawer, save) {
    var money = drawer && drawer.querySelector ? drawer.querySelector(".shopMoney") : null;
    if (!money) return;
    if (!money.querySelector("#shopPrism46")) {
      var coins = money.querySelector("#shopCoins");
      money.textContent = "";
      money.insertAdjacentHTML(
        "beforeend",
        '<span class="shopChip46 prism"><i>◆</i><b id="shopPrism46">0</b></span><span class="shopChip46 shard"><i>◇</i><b id="shopShard46">0</b></span>'
      );
      var sakura = global.document.createElement("span");
      sakura.className = "shopChip46 sakura";
      sakura.innerHTML = "<i>🌸</i>";
      if (coins) sakura.appendChild(coins);
      else sakura.insertAdjacentHTML("beforeend", '<b id="shopCoins">0</b>');
      money.appendChild(sakura);
      money.insertAdjacentHTML("beforeend", '<span class="shopChip46 ticket"><i>券</i><b id="shopTicket46">0</b></span>');
    }
    paintShopWallet(save);
  }

  function paintShopWallet(save) {
    var money = wallets(save);
    var prism = global.document && global.document.getElementById("shopPrism46");
    var shard = global.document && global.document.getElementById("shopShard46");
    var ticket = global.document && global.document.getElementById("shopTicket46");
    var coins = global.document && global.document.getElementById("shopCoins");
    if (prism) popChip(prism, money.prism);
    if (shard) popChip(shard, money.shard);
    if (ticket) ticket.textContent = money.ticket;
    if (coins) coins.textContent = money.sakura;
    return money;
  }

  function paintSupport(save) {
    var plate = global.document && global.document.querySelector("#menu .profile");
    if (!plate) return "";
    var id = friendOf(save);
    var tag = plate.querySelector(".homeSupport46");
    if (!tag) {
      tag = global.document.createElement("em");
      tag.className = "homeSupport46";
      var box = plate.querySelector("div") || plate;
      box.appendChild(tag);
    }
    tag.textContent = "支援 · " + (CHAR_NAMES[id] || "");
    return tag.textContent;
  }

  function decorateAch(drawer) {
    if (drawer && drawer.classList) drawer.classList.add("achShell46", "room46");
    return drawer;
  }

  function decorateSettings(drawer) {
    if (!drawer) return drawer;
    if (drawer.classList) drawer.classList.add("settingsShell46", "room46");
    var body = drawer.querySelector("#settingsBody37") || drawer.querySelector(".dbody");
    if (!body || body.querySelector(".settingsCols46")) return drawer;
    var left = global.document.createElement("div");
    left.className = "settingsCols46 settingsSliders46";
    var right = global.document.createElement("div");
    right.className = "settingsCols46 settingsToggles46";
    var kids = Array.prototype.slice.call(body.children);
    kids.forEach(function (node) {
      if (node.tagName === "LABEL") left.appendChild(node);
      else if (node.classList && node.classList.contains("routeNote")) return;
      else right.appendChild(node);
    });
    var note = body.querySelector(".routeNote");
    body.insertBefore(left, body.firstChild);
    body.insertBefore(right, left.nextSibling);
    if (note) body.appendChild(note);
    return drawer;
  }

  function decorateStage(drawer) {
    if (drawer && drawer.classList) drawer.classList.add("stageShell46", "room46");
    return drawer;
  }

  function decorateArchive(drawer, api) {
    if (!drawer) return drawer;
    var body = drawer.querySelector(".dbody");
    if (!body) return drawer;
    var dock = body.classList && body.classList.contains("archiveDock46") ? body : body.querySelector(".archiveDock46");
    if (dock === body) {
      var wrap = global.document.createElement("div");
      wrap.className = "archiveDock46";
      while (body.firstChild) wrap.appendChild(body.firstChild);
      body.classList.remove("archiveDock46");
      body.appendChild(wrap);
      dock = wrap;
    }
    if (!dock) return drawer;
    var strip = drawer.querySelector("#archiveStats46");
    if (!strip) {
      strip = global.document.createElement("div");
      strip.id = "archiveStats46";
      if (dock.parentNode) dock.parentNode.insertBefore(strip, dock);
    }
    var stats = archiveStats(api && api.save, api);
    strip.innerHTML =
      "<i><b>" +
      stats.done +
      "/4</b><small>主线通关</small></i><i><b>" +
      stats.achDone +
      "/" +
      stats.achTotal +
      "</b><small>成就点亮</small></i><i><b>" +
      stats.tal +
      "</b><small>天赋等级</small></i><i><b>" +
      stats.owned +
      "/16</b><small>证词回收</small></i>";
    if (global.SakurayoLobby && typeof global.SakurayoLobby.dressArchive === "function") {
      global.SakurayoLobby.dressArchive(dock);
    }
    return drawer;
  }

  function paintCurrencies(save) {
    var money = wallets(save);
    var prism = global.document && global.document.getElementById("homePrism46");
    var shard = global.document && global.document.getElementById("homeShard46");
    var ticket = global.document && global.document.getElementById("homeTicket46");
    if (prism) popChip(prism, money.prism);
    if (shard) popChip(shard, money.shard);
    if (ticket) ticket.textContent = money.ticket;
    paintShopWallet(save);
    paintHomeBanner();
    paintDots(save);
    paintSupport(save);
    ensurePetals();
    ensureGreet(save);
    return money;
  }

  function onOpen(name, api) {
    ensureDrawers();
    if (api && api.save) ensureMeta(api.save);
    if (name === "mission") renderMission($("#missionBody46"), api);
    if (name === "mail") renderMail($("#mailBody46"), api);
    if (name === "notice") renderNotice($("#noticeBody46"), api);
    if (name === "friend") renderFriend($("#friendBody46"), api);
    if (name === "calendar") renderCalendar($("#calendarBody46"), api);
    if (name === "profile") {
      profileId = charId(jumpProfile || (api && api.characterId) || profileId);
      jumpProfile = "";
      profileTab = "base";
      renderProfile($("#profileBody46"), api);
    }
    if (name === "gacha") {
      decorateGacha($("#gachaBody46"), api && api.save, api && api.handlers, api && api.toast);
      if (api && api.save) {
        markGachaSeen(api.save);
        commit(api);
      }
    }
    if (name === "roster") decorateRoster($("#rosterBody46"), api && api.save, api && api.handlers, api);
    if (name === "shop") decorateShop($("#shopDrawer"), api);
    if (name === "story") {
      storyTouched = false;
      decorateStory($("#storyDrawer"), api && api.stories, api && api.save, api);
    }
    if (name === "ach") decorateAch($("#achDrawer"));
    if (name === "stage") decorateStage($("#stageDrawer"));
    if (name === "archive") decorateArchive($("#archiveDrawer"), api);
    if (name === "settings") decorateSettings($("#settingsDrawer37"));
    if (api && api.save) paintCurrencies(api.save);
  }

  global.SakurayoShell = {
    version: VERSION,
    PREVIEW: PREVIEW,
    DRAWERS: DRAWERS,
    injectStyle: injectStyle,
    ensureDrawers: ensureDrawers,
    ensureMeta: ensureMeta,
    defenseLevel: defenseLevel,
    wallets: wallets,
    xpOf: xpOf,
    recLevel: recLevel,
    bondOf: bondOf,
    loginState: loginState,
    claimLogin: claimLogin,
    claimMission: claimMission,
    claimMail: claimMail,
    readNotice: readNotice,
    giftBond: giftBond,
    setFriend: setFriend,
    friendOf: friendOf,
    isMainCard: isMainCard,
    markSeen: markSeen,
    isNewCard: isNewCard,
    archiveStats: archiveStats,
    exchange: exchange,
    dots: dots,
    setShopRail: setShopRail,
    previewToast: previewToast,
    renderMission: renderMission,
    renderMail: renderMail,
    renderNotice: renderNotice,
    renderFriend: renderFriend,
    renderCalendar: renderCalendar,
    renderProfile: renderProfile,
    decorateGacha: decorateGacha,
    decorateRoster: decorateRoster,
    decorateShop: decorateShop,
    buyFeatured: buyFeatured,
    decorateStory: decorateStory,
    decorateAch: decorateAch,
    decorateSettings: decorateSettings,
    decorateStage: decorateStage,
    decorateArchive: decorateArchive,
    paintSupport: paintSupport,
    paintCurrencies: paintCurrencies,
    paintHomeBanner: paintHomeBanner,
    paintDots: paintDots,
    greetLine: greetLine,
    clearFloats: clearFloats,
    currentBanner: function () { return gachaBanner; },
    eventLeft: eventLeft,
    weekKey: weekKey,
    rollMissions: rollMissions,
    speakLine: speakLine,
    onOpen: onOpen,
  };
})(typeof window !== "undefined" ? window : globalThis);
