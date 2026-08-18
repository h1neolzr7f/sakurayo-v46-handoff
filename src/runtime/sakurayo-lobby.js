(function (global) {
  "use strict";

  var VERSION = "4.6.0";
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
    softPity: 65,
    spark: 200,
    shardPull: 1,
    shardDupe: 8,
    single: 160,
    ten: 1440,
    cheat: 9999,
    taps: 10,
  });

  var DEFAULT_SHOWN = Object.freeze(["sayo_echo", "aya_petal"]);
  var POOL_IDS = Object.freeze(["remnant", "fashion", "weapon"]);
  var ROSTER_TABS = Object.freeze(["scrap", "school"]);
  var RARITY_RANK = Object.freeze(["SSR", "SR", "R", "N"]);

  var CARDS = Object.freeze([
    { id: "sayo_echo", n: "小夜·镜中残影", r: "R", kind: "scrap", tag: "残件", d: "半张立绘还卡在裂镜里。拥有即暴击 +0.5%，重复不加。", lore: ["我是卡在镜里的那一半。神社里走着的小夜可能是备份，我才是三年前实验里先碎的那张脸。", "每次有人摸到镜核，我都会被重新对焦一次。步枪还在，樱花还在，名字却越来越薄。", "镜面先裂，立绘后裂。我伸出手去够外面的她，只够到自己的倒影。", "半张脸还在笑。另外半张，已经不属于任何人。"] },
    { id: "aya_petal", n: "绫·花瓣残件", r: "R", kind: "scrap", tag: "残件", d: "居合前落下的花瓣。拥有即移速 +0.5%，重复不加。", lore: ["我是居合前掉下来的那一片。零号企业拆人格的时候，把「犹豫」单独装进这片花里。", "手枪先响，太刀后出。花瓣总是抢在刀光前面落地，像在提醒我：再快一点。", "弹打空的那个呼吸，刀还在鞘里。花已经谢了，人还站着，像没接到自己的指令。", "花瓣盖住准星。我看不见她，她也没回头。"] },
    { id: "rion_edge", n: "凛音·刀光残件", r: "R", kind: "scrap", tag: "残件", d: "黄泉流未署名的一页刀光。拥有即刀伤 +1%，重复不加。", lore: ["我是黄泉流没来得及署名的一页。黑羽家谱把活着的凛音写在正面，把我写在刀背上。", "剑冢里每把剑都认识我。我走过那些失败的小夜，没有对任何一把刀鞠躬。", "刀光先到，名字后到。折断的不是刃，是那句「我会回来」。", "刀还在响。署名栏是空的。"] },
    { id: "night_radio", n: "夜话电台残件", r: "R", kind: "scrap", tag: "残件", d: "吐槽电台还在响。拥有即技能冷却 -0.5%，重复不加。", lore: ["我不是人。我是小夜死过以后，还在播的那台夜话。吐槽还在，主播已经换过好几版备份。", "从神社到剑冢，频率没变。谁路过都听得见冷笑话，听不见心跳。", "电台以为自己还在救人。其实只是把失败循环到下一小时。", "电流沙沙响。报时之后，没有下一位来宾。"] },
    { id: "shrine_seal", n: "神社封条残件", r: "R", kind: "scrap", tag: "残件", d: "鸟居下揭下的封条影。拥有即减伤 +0.4%，重复不加。", lore: ["我是从鸟居上揭下来的一道封。写着小夜的名字，墨却先于人干透。", "神社拿我挡镜核，炼金台拿我当坩埚盖。谁都需要一张能骗人的纸。", "符纸烧完了，镜核还在转。名字被火吃掉，裂口比以前更亮。", "灰落在石阶上。下一张封条已经写好，还是同一个字。"] },
    { id: "void_ticket", n: "主神作废券", r: "R", kind: "scrap", tag: "残件", d: "虚空圣所的作废回收券。拥有即开局护盾 +4，重复不加。", lore: ["我是一张已经作废的回收券。主神空间发过我，又当众盖了戳：此路不算数。", "绫把我捏在指缝里进过圣所。小夜把我夹进档案。谁都以为这是通行证。", "盖戳的不是敌人，是规则本身。券面还亮着，门已经从里面锁死。", "作废两个字比金箔更清楚。没有退款。"] },
    { id: "cherry_crown", n: "樱冠残片", r: "R", kind: "scrap", tag: "残件", d: "镜界冠冕裂开后的一片。拥有即全伤害 +0.8%，重复不加。", lore: ["我是镜界冠冕裂开后的一片。曾经想把小夜加成完整的那一夜，只加成了碎片。", "戴上会发光，摘下会出血。魔法少女那条线最爱我，也最先被我划伤额头。", "冠还亮着，变身只走到一半。花瓣向上飞，人往下坠。", "金边还烫。头已经空了。"] },
    { id: "last_witness", n: "碎镜后的人", r: "R", kind: "scrap", tag: "残件", d: "碎镜后面那个人不是三女之一。拥有即生命 +1%，重复不加。", lore: ["他不是小夜，不是绫，也不是凛音。碎镜后面只站着一个还肯作证的人。", "他看着三年前的实验收场，看着备份醒来，看着剑冢一把一把插满。他没有伸手。", "证人活得比主角久。这不是胜利，是他没有被写成卡的资格。", "他仍站在镜后。下一次有人醒来，他还是那张脸。"] },
  ]);

  var FASHION_CARDS = Object.freeze([]);
  var WEAPON_CARDS = Object.freeze([]);
  var SCHOOL_CARDS = Object.freeze([
    { id: "school_shrine", n: "未归·巫女小夜", r: "SR", kind: "school", tag: "基础", school: "shrine", face: "sayo", dmg: 0.006, d: "符没封住镜核。拥有即巫女倾向 ×1.3。", lore: ["我是神社那一夜的小夜。符纸写着我的名字，镜核比名字先亮。", "我把封条一层层贴上步枪，贴上鸟居，贴上自己的袖口。外面的备份还在扫地。", "符烧完了，镜核还在转。裂口从镜里爬到我肩上，朱砂写成失败。", "我仍举着枪。封条先落地。"] },
    { id: "school_idol", n: "未归·歌姬小夜", r: "R", kind: "school", tag: "基础", school: "idol", face: "sayo", dmg: 0.003, d: "电台还在响人已不在。拥有即歌姬倾向 ×1.3。", lore: ["我是被推进舞台的那一版小夜。观众席是空的，只有电台还在报时。", "歌比子弹先出门。我把步枪靠在脚边，对着没有人的灯光把词唱完。", "声带还在，人已经不在频率上。电台替我鞠躬，我跪在花瓣里。", "下一首歌自动连播。没有返场。"] },
    { id: "school_magical", n: "未归·魔法少女小夜", r: "R", kind: "school", tag: "基础", school: "magical", face: "sayo", dmg: 0.003, d: "冠亮着变身没转好。拥有即魔法少女倾向 ×1.3。", lore: ["我是想把完整的一夜戴在头上的小夜。冠比我先发光。", "变身只走到一只手套。其余的我还是神社那件外套，步枪没有变成权杖。", "冠还亮，身体没转完。花瓣往上飞，我往下坠，妆裂在眼角。", "金边还烫。咒语停在一半。"] },
    { id: "school_mech", n: "未归·机械师小夜", r: "R", kind: "school", tag: "基础", school: "mech", face: "sayo", dmg: 0.003, d: "无人机先死步枪还在。拥有即机械师倾向 ×1.3。", lore: ["我是把无人机当姐姐的那一版。它先看见镜核，也先掉下来。", "油污和樱花一起沾在白外套上。我修它的镜头，比修自己的准星勤快。", "螺旋桨停转的时候，步枪还在我手里。火花比求救声响。", "屏幕黑了。我还握着没坏的那一边。"] },
    { id: "school_spore", n: "未归·菌群小夜", r: "R", kind: "school", tag: "基础", school: "spore", face: "sayo", dmg: 0.003, d: "菌海不认主人。拥有即菌群倾向 ×1.3。", lore: ["我是把菌海认作姐妹的小夜。它们发光，却不听我的姓。", "孢子爬上步枪和脸颊，像另一层妆。我伸手，菌丝绕开我，去找更热的东西。", "菌海选择了镜核，没有选择主人。我变成它们路过的一截木头。", "蘑菇还亮。我的手是空的。"] },
    { id: "school_gun", n: "未归·枪斗绫", r: "SR", kind: "school", tag: "基础", school: "gun", face: "aya", dmg: 0.006, d: "弹打空近身刀没来得及。拥有即枪斗倾向 ×1.3。", lore: ["我是零号企业最锋利的那条枪线。手枪是呼吸，太刀是没来得及说的话。", "我把弹匣数得很干净。花瓣总是提醒我再快一点，我偏要再稳一点。", "最后一发打空，刀还在鞘里。近身的爪子已经摸到领口。", "套筒后锁。刀柄是凉的。"] },
    { id: "school_mage", n: "未归·魔法师绫", r: "R", kind: "school", tag: "基础", school: "mage", face: "aya", dmg: 0.003, d: "主神券作废。拥有即魔法师倾向 ×1.3。", lore: ["我是捏着通行证进圣所的绫。券是金的，门是假的。", "法阵画在水里，手枪还在腰上。我以为规则能被念咒改写。", "券面盖了作废。墨从掌心滴进法阵，法阵先死。", "VOID 两个字母比我的名字清楚。"] },
    { id: "school_alch", n: "未归·炼金绫", r: "R", kind: "school", tag: "基础", school: "alch", face: "aya", dmg: 0.003, d: "封条当坩埚盖。拥有即炼金倾向 ×1.3。", lore: ["我是把神社封条当瓶盖的绫。朱印能骗人，骗不了沸腾。", "手枪看守火候，太刀切开试剂。我把别人的名字熬成能喝的东西。", "盖子先着。封条在坩埚里烧成失败的味道，玻璃也裂了。", "药还在响。人已经不值得过滤。"] },
    { id: "school_ninja", n: "未归·忍者绫", r: "R", kind: "school", tag: "基础", school: "ninja", face: "aya", dmg: 0.003, d: "影遁出界人没回来。拥有即忍者倾向 ×1.3。", lore: ["我是从镜缝里进出的那条影。外面的我负责开枪，里面的我负责消失。", "分身比本体勤快。我把太刀留给回来的那一格，手枪留给还在的这一格。", "影遁出了界。分身散掉，本体没有从裂镜对面走回来。", "残影还举着枪。人已经不在这一侧。"] },
    { id: "school_vamp", n: "未归·血族绫", r: "R", kind: "school", tag: "基础", school: "vamp", face: "aya", dmg: 0.003, d: "最后一口吸空的是自己。拥有即血族倾向 ×1.3。", lore: ["我是把活下去做成饮品的绫。血不是别人的，是企业拆剩下的我。", "手枪守墓园，太刀守喉咙。花谢得比夜快，我喝得比花快。", "最后一瓶写着自己的名字。吸空以后，连开枪的力气都退色。", "瓶是空的。泪比血晚到。"] },
    { id: "school_cult", n: "未归·修仙凛音", r: "SR", kind: "school", tag: "基础", school: "cult", face: "rion", dmg: 0.006, d: "飞剑折在剑冢。拥有即修仙倾向 ×1.3。", lore: ["我是黑羽家被送去飞升的那一页。飞剑比家谱先出门。", "剑冢里每把剑都认识我。我路过那些失败的小夜，没有对任何一把鞠躬。", "飞剑折在别人的坟上。刃还在振，飞的那一半回不来。", "我握住折断的那截。天没有开。"] },
    { id: "school_necro", n: "未归·死灵凛音", r: "R", kind: "school", tag: "基础", school: "necro", face: "rion", dmg: 0.003, d: "看见终章把自己收成魂火。拥有即死灵倾向 ×1.3。", lore: ["我是看见终章以后还想收尸的凛音。先收下的是自己。", "魂火从掌心往上爬。刀还在，名字开始透明。", "我把凛音当成可召唤物。契约成立的瞬间，人变成燃料。", "火还亮。署名栏空了。"] },
    { id: "school_gene", n: "未归·基因凛音", r: "R", kind: "school", tag: "基础", school: "gene", face: "rion", dmg: 0.003, d: "再生没跑过突变。拥有即基因倾向 ×1.3。", lore: ["我是被改过刀法和血的凛音。再生写在合同里，突变写在肉里。", "实验室的灯和鸟居的灯一起亮。我用刀压住往外长的那只手臂。", "再生追上伤口，没追上镜裂。红晶比皮肤先成为我。", "刀还认得手。手不太认得我。"] },
    { id: "school_summon", n: "未归·召唤凛音", r: "R", kind: "school", tag: "基础", school: "summon", face: "rion", dmg: 0.003, d: "契约反噬。拥有即召唤倾向 ×1.3。", lore: ["我是把影子当部下的凛音。契约纸比刀快，反噬比部下快。", "我在腕上缠满符。刀尖指着该来的东西，它从背后先来。", "契约反咬署名。红线勒进刀柄，影子比我更高。", "符烧完了。部下还在，主人不在。"] },
  ]);

  var SCRAP_BONUS = Object.freeze({
    sayo_echo: { crit: 0.005 },
    aya_petal: { spd: 0.005 },
    rion_edge: { blade: 0.01 },
    night_radio: { skillCd: 0.005 },
    shrine_seal: { reduce: 0.004 },
    void_ticket: { shield: 4 },
    cherry_crown: { dmg: 0.008 },
    last_witness: { hp: 0.01 },
  });

  var CARD_MAP = Object.create(null);
  function indexCards(list) {
    list.forEach(function (card) {
      CARD_MAP[card.id] = card;
    });
  }
  indexCards(CARDS);
  indexCards(FASHION_CARDS);
  indexCards(WEAPON_CARDS);
  indexCards(SCHOOL_CARDS);

  function remnantList() {
    return CARDS.concat(SCHOOL_CARDS);
  }

  function cardsForPool(pool) {
    if (pool === "fashion") return FASHION_CARDS;
    if (pool === "weapon") return WEAPON_CARDS;
    return remnantList();
  }

  function groupByRarity(list) {
    var out = { N: [], R: [], SR: [], SSR: [] };
    list.forEach(function (card) {
      if (out[card.r]) out[card.r].push(card);
    });
    return out;
  }

  var BY_RARITY = groupByRarity(CARDS);

  var LOBBY_CSS =
    "html,body{width:100%;height:100%;overscroll-behavior:none}" +
    ".homeNav46{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:6px}" +
    ".homeNav46 button{min-height:58px;padding:8px 2px;border-radius:14px;border:1px solid #ff9bcc55;background:linear-gradient(180deg,#2a183ef2,#120c22f5);color:#fff8fb;font:800 11px/1.15 system-ui;letter-spacing:.06em}" +
    ".homeNav46 button span{display:grid;place-items:center;width:28px;height:28px;margin:0 auto 4px;border-radius:9px;background:#ff72b428;color:#ffe6f3;font-size:12px;overflow:visible}" +
    ".homeNav46 button span img{display:block!important;width:100%;height:100%;border-radius:8px;object-fit:cover;visibility:visible;opacity:1}" +
    "#menu.homeDock46 .start,#menu .start{background:linear-gradient(180deg,#ffe7b0 0%,#ff74c8 26%,#c13bff 66%,#6a28ff 100%);border:1px solid #ffe6a3aa;box-shadow:0 14px 40px #ff4ea888,0 0 28px #ffe08a40,inset 0 1px #fff8;font-weight:1000;letter-spacing:.42em;text-shadow:0 2px 10px #3a106688}" +
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
    ".wishTitle46{position:absolute;z-index:4;top:max(52px,calc(env(safe-area-inset-top) + 44px));right:16px;left:auto;text-align:right;max-width:58%;pointer-events:none}" +
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
    ".wishTabs46{position:absolute;z-index:6;top:max(14px,calc(env(safe-area-inset-top) + 6px));left:12px;display:flex;gap:6px}" +
    ".wishTabs46 button{min-height:32px;padding:0 12px;border-radius:999px;border:1px solid #ffe6a355;background:#0b0818cc;color:#ffe7a3;font:800 11px/1 system-ui;letter-spacing:.12em}" +
    ".wishTabs46 button.on{background:linear-gradient(180deg,#ffe08a,#d8892b);color:#2a1608;border-color:#ffe6a3aa}" +
    ".wishPills46{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 8px}" +
    ".wishPills46 b{padding:4px 10px;border-radius:999px;background:#0b0818cc;border:1px solid #ffe6a355;color:#ffe7a3;font-size:10px;letter-spacing:.1em}" +
    ".rosterTabs46{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px}" +
    ".rosterTabs46 button{min-height:32px;padding:0 12px;border-radius:999px;border:1px solid #ffe6a355;background:#0b0818cc;color:#ffe7a3;font:800 11px/1 system-ui;letter-spacing:.12em}" +
    ".rosterTabs46 button.on{background:linear-gradient(180deg,#ffe08a,#d8892b);color:#2a1608;border-color:#ffe6a3aa}" +
    ".rosterLater46{min-height:180px;display:grid;place-items:center;border:1px dashed #ffe6a344;border-radius:16px;color:#bfb1d3;letter-spacing:.2em;font:800 13px/1.4 system-ui}" +
    ".revealCard46.r-LEGEND .revealFace46{border-color:#ffe6a3;box-shadow:0 0 26px #ffd36baa}" +
    ".revealLegend46{position:absolute;z-index:4;left:7px;bottom:36px;padding:3px 7px;border-radius:6px;background:linear-gradient(180deg,#ffe08a,#d8892b);color:#2a1608;font:800 9px/1 system-ui;letter-spacing:.14em}" +
    ".gachaActions46{display:grid;grid-template-columns:1fr 1fr;gap:10px}" +
    ".gachaActions46 button{min-height:54px;border-radius:16px;border:1px solid #ff9bcc66;color:#fff;font:800 15px/1.1 system-ui;letter-spacing:.14em;box-shadow:0 10px 24px #05020d66}" +
    ".gachaActions46 button small{display:block;margin-top:3px;font:700 10px/1 system-ui;letter-spacing:.08em;opacity:.88}" +
    ".gachaActions46 button.poor{opacity:.42}" +
    "#gachaPull1{background:linear-gradient(180deg,#ff86cc,#ff3d9a 58%,#b02078);border-color:#ffb6d888}" +
    "#gachaPull10{background:linear-gradient(180deg,#ffe08a,#f0c14a 42%,#d8892b);border-color:#ffe6a3aa;color:#2a1608}" +
    "#gachaReveal46{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:max(44px,env(safe-area-inset-top)) 12px calc(16px + env(safe-area-inset-bottom));background:radial-gradient(circle at 50% 40%,#4a2878ee,#12081cf6 68%)}" +
    ".revealGrid46{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-width:96%;perspective:1200px}" +
    ".revealGrid46.ten{max-width:640px;gap:8px}" +
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
    ".revealTake46,.revealSkip46,.revealAgain46{min-height:44px;padding:0 22px;border-radius:999px;border:1px solid #ffe6a388;font:800 14px/1 system-ui;letter-spacing:.16em}" +
    ".revealTake46{background:linear-gradient(180deg,#ffe08a,#d8892b);color:#2a1608;box-shadow:0 10px 24px #05020d66}" +
    ".revealSkip46,.revealAgain46{background:#0b0818cc;color:#fff7fb}" +
    "#gachaReveal46.isTest .revealInner46,#gachaReveal46.isTest .revealFace46.front:after,#gachaReveal46.isTest .revealCard46.r-SSR.flipped .revealFace46.front{transition:none;animation:none}" +
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
    "html.landscape46 #menu.homeDock46 .menu{width:min(34vw,360px);max-width:360px;margin-left:auto}" +
    "html.landscape46 .wishHero46{left:-2%;width:46%;height:124%;bottom:-8%}" +
    "html.landscape46 .wishTitle46{right:4%;max-width:46%}" +
    "html.landscape46 .wishDock46,html.landscape46 .wishPity46{left:46%}" +
    "html.landscape46 #rosterWall46{grid-template-columns:repeat(4,minmax(0,1fr))}" +
    "html.landscape46 #archiveDrawer .archiveDock46{grid-template-columns:repeat(4,minmax(0,1fr))}" +
    "html.landscape46 #stageList{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}" +
    "#rotateHint46{display:none;position:fixed;z-index:80;left:50%;top:max(8px,env(safe-area-inset-top));transform:translateX(-50%);padding:6px 12px;border-radius:999px;background:#0b0818cc;border:1px solid #ffe6a355;color:#ffe7a3;font:800 11px/1 system-ui;letter-spacing:.12em;pointer-events:none;white-space:nowrap}" +
    "@media(orientation:portrait){" +
    "#rotateHint46{display:block}" +
    "}" +
    "html.tallWindow46 #rotateHint46{display:block}" +
    "@media(prefers-reduced-motion:reduce){.wishStage46:before,.wishPetals46 i,.revealInner46,.revealFace46.front:after,.revealCard46.r-SSR.flipped .revealFace46.front{animation:none;transition:none}}";

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
    ".heroLive46.hasBlink:not(.livePuppet46) .heroLiveBase46{animation:heroBaseBlink46 5.4s steps(1) infinite}" +
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
    "@media(orientation:landscape){" +
    "#menu.homeDock46 .heroLive46{width:64%;left:0;bottom:0!important}" +
    "#menu.homeDock46 .heroLiveBreath46{width:min(58vw,680px);height:100%}" +
    "#menu.homeDock46 .menu{background:linear-gradient(180deg,#0b0818cc,#0b0818f2);border:1px solid #ffe6a328;border-radius:20px 0 0 0;box-shadow:-12px 0 40px #05020d66}" +
    "#shopDrawer>.dhead p,#shopDrawer .shopNotice{display:none}" +
    "#shopWallet44{display:flex;align-items:center;gap:14px;flex-wrap:wrap}" +
    "#shopWallet44 p,#shopWallet44 em{margin:0;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;flex:1}" +
    "#shopDrawer>.dbody,#stageDrawer>.dbody,#archiveDrawer>.dbody,#talentDrawer>.dbody,#storyDrawer>.dbody,#ascDrawer>.dbody,#achDrawer>.dbody{max-width:none;padding:0 18px 18px}" +
    "#archiveDrawer .archiveDock46{grid-template-columns:repeat(4,minmax(0,1fr));min-height:calc(100dvh - 88px);align-content:stretch}" +
    "#archiveDrawer .archiveDock46 button{min-height:240px}" +
    "#stageList{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}" +
    "#stageList .modeBar46{grid-column:1/-1}" +
    "#stageList .stageCard{min-height:210px}" +
    "#storyList,#achList{grid-template-columns:repeat(2,minmax(0,1fr))}" +
    "#talentList{grid-template-columns:1fr}" +
    "}" +
    "html.landscape46 #menu.homeDock46 .heroLive46{top:0;bottom:0!important;left:0;width:64%;-webkit-mask-image:linear-gradient(to right,#000 0%,#000 78%,transparent 100%);mask-image:linear-gradient(to right,#000 0%,#000 78%,transparent 100%)}" +
    "html.landscape46 #menu.homeDock46 .heroLiveBreath46{height:100%;width:min(58vw,680px)}" +
    "html.landscape46 #menu.homeDock46 .heroLiveBreath46 img{object-fit:contain;object-position:center 10%}" +
    "html.landscape46 #menu.homeDock46 .heroLiveName46{top:auto;bottom:16%;left:max(16px,env(safe-area-inset-left));max-width:36%}" +
    "html.landscape46 #menu.homeDock46 #coverTitle36{left:max(16px,env(safe-area-inset-left));right:auto;top:max(10px,env(safe-area-inset-top));transform:none;text-align:left;max-width:40%}" +
    "html.landscape46 #menu.homeDock46 .menu{width:min(34vw,360px);max-width:360px;margin-left:auto;padding:10px 12px calc(10px + env(safe-area-inset-bottom));box-sizing:border-box}" +
    "html.landscape46 #menu.homeDock46 .charSelectPanel{position:relative!important;left:auto!important;right:auto!important;bottom:auto!important;width:100%;margin:0 0 8px}" +
    "html.landscape46 #menu.homeDock46 .characterList{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;flex-direction:unset}" +
    "html.landscape46 #menu.homeDock46 .charCard{width:auto;height:auto;min-width:0;max-width:56px;margin:0 auto;aspect-ratio:1}" +
    "html.landscape46 #menu.homeDock46 .charCard img{width:100%;height:100%}" +
    "html.landscape46 #menu.homeDock46 .stageMini,html.landscape46 #menu.homeDock46 .start,html.landscape46 #menu.homeDock46 .nav{width:100%;margin-left:0;margin-right:0}" +
    "html.portraitFallback46 #menu.homeDock46 .heroLive46{width:100%;left:0;right:0;top:0;bottom:34%}" +
    "html.portraitFallback46 #menu.homeDock46 .menu{width:100%;max-width:none;margin:0;border-radius:18px 18px 0 0}" +
    "html.portraitFallback46 #menu.homeDock46 .charSelectPanel{position:absolute!important;left:8px;right:auto;bottom:36%;width:auto}" +
    "html.portraitFallback46 #menu.homeDock46 .characterList{display:flex!important;flex-direction:column}" +
    "html.portraitFallback46 #menu.homeDock46 #coverTitle36{left:50%;right:auto;transform:translateX(-50%);text-align:center}" +
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

  function emptyOwned(list) {
    var owned = {};
    (list || CARDS).forEach(function (card) {
      owned[card.id] = 0;
    });
    return owned;
  }

  function normalizePool(raw, list) {
    var incoming = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    var owned = emptyOwned(list);
    var rawOwned = incoming.owned && typeof incoming.owned === "object" && !Array.isArray(incoming.owned) ? incoming.owned : {};
    list.forEach(function (card) {
      owned[card.id] = clampInt(rawOwned[card.id], 0, 9999);
    });
    return {
      pity: clampInt(incoming.pity, 0, RATES.pitySSR),
      pitySR: clampInt(incoming.pitySR, 0, RATES.pitySR),
      pulls: clampInt(incoming.pulls, 0, 999999),
      tenPulls: clampInt(incoming.tenPulls, 0, 999999),
      owned: owned,
      last: Array.isArray(incoming.last) ? incoming.last.slice(0, 20) : [],
      equipped: typeof incoming.equipped === "string" ? incoming.equipped : "",
      shards: clampInt(incoming.shards, 0, 999999),
    };
  }

  function normalizeOps(shop40) {
    var shop = shop40 && typeof shop40 === "object" && !Array.isArray(shop40) ? shop40 : {};
    var incoming = shop.ops && typeof shop.ops === "object" && !Array.isArray(shop.ops) ? shop.ops : {};
    var catalog = remnantList();
    var owned = emptyOwned(catalog);
    var rawOwned = incoming.owned && typeof incoming.owned === "object" && !Array.isArray(incoming.owned) ? incoming.owned : {};
    catalog.forEach(function (card) {
      owned[card.id] = clampInt(rawOwned[card.id], 0, 9999);
    });
    var seeded = Object.keys(rawOwned).length === 0;
    if (seeded) {
      DEFAULT_SHOWN.forEach(function (id) {
        if (owned[id] < 1) owned[id] = 1;
      });
    }
    var pool = incoming.pool === "fashion" || incoming.pool === "weapon" ? incoming.pool : "remnant";
    var rosterTab = incoming.rosterTab === "school" || incoming.rosterTab === "fashion" || incoming.rosterTab === "weapon" || incoming.rosterTab === "chronicle"
      ? incoming.rosterTab
      : "scrap";
    shop.ops = {
      pity: clampInt(incoming.pity, 0, RATES.pitySSR),
      pitySR: clampInt(incoming.pitySR, 0, RATES.pitySR),
      pulls: clampInt(incoming.pulls, 0, 999999),
      tenPulls: clampInt(incoming.tenPulls, 0, 999999),
      owned: owned,
      last: Array.isArray(incoming.last) ? incoming.last.slice(0, 20) : [],
      cheatUsed: incoming.cheatUsed ? 1 : 0,
      shards: clampInt(incoming.shards, 0, 999999),
      pool: pool,
      rosterTab: rosterTab,
      fashion: normalizePool(incoming.fashion, FASHION_CARDS),
      weapon: normalizePool(incoming.weapon, WEAPON_CARDS),
    };
    return shop;
  }

  function cardOf(id) {
    return CARD_MAP[id] || null;
  }

  function shownIds(ops) {
    var out = [];
    DEFAULT_SHOWN.forEach(function (id) {
      if (out.indexOf(id) < 0) out.push(id);
    });
    remnantList().forEach(function (card) {
      if ((ops.owned[card.id] || 0) > 0 && out.indexOf(card.id) < 0) out.push(card.id);
    });
    return out;
  }

  function ownedCount(ops, list) {
    var n = 0;
    (list || []).forEach(function (card) {
      if ((ops.owned[card.id] || 0) > 0) n += 1;
    });
    return n;
  }

  function hasSchool(save, school) {
    var shop = normalizeOps((save && save.shop40) || {});
    var id = String(school || "");
    if (!id) return false;
    return SCHOOL_CARDS.some(function (card) {
      return card.school === id && (shop.ops.owned[card.id] || 0) > 0;
    });
  }

  function pickOfRarity(rarity, rng, list) {
    var grouped = groupByRarity(list || CARDS);
    var pool = grouped[rarity] && grouped[rarity].length ? grouped[rarity] : grouped.R.length ? grouped.R : grouped.N;
    if (!pool || !pool.length) return null;
    return pool[Math.floor(rng() * pool.length) % pool.length];
  }

  function highestRarity(list) {
    var i;
    for (i = 0; i < RARITY_RANK.length; i++) {
      for (var c = 0; c < list.length; c++) {
        if (list[c].r === RARITY_RANK[i]) return RARITY_RANK[i];
      }
    }
    return null;
  }

  function downgradeRarity(want, list) {
    var start = RARITY_RANK.indexOf(want);
    if (start < 0) start = 0;
    var i;
    for (i = start; i < RARITY_RANK.length; i++) {
      for (var c = 0; c < list.length; c++) {
        if (list[c].r === RARITY_RANK[i]) return RARITY_RANK[i];
      }
    }
    return highestRarity(list);
  }

  function ssrRate(pity) {
    if (pity + 1 >= RATES.pitySSR) return 1;
    if (pity + 1 < RATES.softPity) return RATES.SSR;
    var span = RATES.pitySSR - RATES.softPity;
    var step = (pity + 1 - RATES.softPity) / span;
    return Math.min(1, RATES.SSR + step * (1 - RATES.SSR));
  }

  function rollRarity(ops, rng, list) {
    var want;
    if (ops.pity + 1 >= RATES.pitySSR) want = "SSR";
    else if (ops.pitySR + 1 >= RATES.pitySR) want = "SR";
    else {
      var ssr = ssrRate(ops.pity);
      var roll = rng();
      if (roll < ssr) want = "SSR";
      else if (roll < ssr + RATES.SR) want = "SR";
      else if (roll < ssr + RATES.SR + RATES.R) want = "R";
      else want = "N";
    }
    return downgradeRarity(want, list);
  }

  function poolState(ops, pool) {
    if (pool === "fashion") return ops.fashion;
    if (pool === "weapon") return ops.weapon;
    return ops;
  }

  function applyPull(ops, rng, list, shardHost) {
    var rarity = rollRarity(ops, rng, list);
    var card = pickOfRarity(rarity, rng, list);
    if (!card) return null;
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
    shardHost.shards = clampInt((shardHost.shards || 0) + RATES.shardPull, 0, 999999);
    if (prev > 0) shardHost.shards = clampInt(shardHost.shards + RATES.shardDupe, 0, 999999);
    return { id: card.id, r: card.r, n: card.n, pity: ops.pity, isNew: prev === 0, kind: card.kind || "" };
  }

  function pull(save, count, rng, poolId) {
    var n = count === 10 ? 10 : 1;
    var cost = n === 10 ? RATES.ten : RATES.single;
    if (!save || typeof save !== "object") return { ok: false, reason: "save", results: [] };
    save.shop40 = normalizeOps(save.shop40 || {});
    var pool = poolId || save.shop40.ops.pool || "remnant";
    if (POOL_IDS.indexOf(pool) < 0) pool = "remnant";
    var list = cardsForPool(pool);
    var coins = clampInt(save.coins, 0, 99999999);
    if (!list.length) {
      return { ok: false, reason: "empty", results: [], coins: coins, pool: pool, pity: save.shop40.ops.pity, pitySR: save.shop40.ops.pitySR, owned: save.shop40.ops.owned };
    }
    if (coins < cost) {
      return { ok: false, reason: "coins", results: [], coins: coins, pool: pool, pity: save.shop40.ops.pity, pitySR: save.shop40.ops.pitySR, owned: save.shop40.ops.owned };
    }
    var rand = typeof rng === "function" ? rng : Math.random;
    var state = poolState(save.shop40.ops, pool);
    var shardHost = pool === "remnant" ? save.shop40.ops : state;
    var results = [];
    for (var i = 0; i < n; i++) {
      var row = applyPull(state, rand, list, shardHost);
      if (row) results.push(row);
    }
    if (n === 10) state.tenPulls += 1;
    state.last = results.slice();
    save.coins = coins - cost;
    return {
      ok: true,
      results: results,
      coins: save.coins,
      pool: pool,
      pity: save.shop40.ops.pity,
      pitySR: save.shop40.ops.pitySR,
      owned: save.shop40.ops.owned,
      pulls: save.shop40.ops.pulls,
      tenPulls: save.shop40.ops.tenPulls,
      shards: save.shop40.ops.shards,
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
      pages: POOL_IDS.slice(),
      rosterTabs: ROSTER_TABS.slice(),
      pool: ops.pool,
      rosterTab: ops.rosterTab,
      cards: CARDS.map(function (card) {
        return { id: card.id, n: card.n, r: card.r, kind: card.kind || "scrap", count: ops.owned[card.id] || 0 };
      }),
      schoolCards: SCHOOL_CARDS.map(function (card) {
        return { id: card.id, n: card.n, r: card.r, kind: "school", school: card.school, count: ops.owned[card.id] || 0 };
      }),
      schoolOwned: ownedCount(ops, SCHOOL_CARDS),
      shown: shownIds(ops),
      owned: ops.owned,
      pity: ops.pity,
      pitySR: ops.pitySR,
      pulls: ops.pulls,
      tenPulls: ops.tenPulls,
      shards: ops.shards,
      fashion: ops.fashion,
      weapon: ops.weapon,
      coins: clampInt(save && save.coins, 0, 99999999),
      cheatUsed: !!ops.cheatUsed,
    };
  }

  function applyOwnedBonus(player, save) {
    if (!player || typeof player !== "object") return player;
    var shop = normalizeOps((save && save.shop40) || {});
    var owned = shop.ops.owned || {};
    var cid = (save && save.character) || player.character || "";
    CARDS.forEach(function (card) {
      if ((owned[card.id] || 0) < 1) return;
      var bonus = SCRAP_BONUS[card.id];
      if (!bonus) return;
      if (bonus.crit) player.crit = (player.crit || 0) + bonus.crit;
      if (bonus.spd) player.spd = (player.spd || 0) * (1 + bonus.spd);
      if (bonus.blade) {
        player.bladePower = (player.bladePower || 1) * (1 + bonus.blade);
        if (cid === "rion") player.dmg = (player.dmg || 0) * (1 + bonus.blade);
      }
      if (bonus.skillCd) player.skillCd = (player.skillCd || 0) * (1 - bonus.skillCd);
      if (bonus.reduce) player.damageReduce = (player.damageReduce || 0) + bonus.reduce;
      if (bonus.shield) {
        player.maxSh = (player.maxSh || 0) + bonus.shield;
        player.sh = (player.sh || 0) + bonus.shield;
      }
      if (bonus.dmg) player.dmg = (player.dmg || 0) * (1 + bonus.dmg);
      if (bonus.hp) {
        player.maxHp = (player.maxHp || 0) * (1 + bonus.hp);
        player.hp = player.maxHp;
      }
    });
    var schoolN = 0;
    SCHOOL_CARDS.forEach(function (card) {
      if ((owned[card.id] || 0) < 1) return;
      schoolN += 1;
      if (card.dmg) player.dmg = (player.dmg || 0) * (1 + card.dmg);
    });
    if (schoolN >= 7) player.dmg = (player.dmg || 0) * 1.02;
    if (schoolN >= 14) player.dmg = (player.dmg || 0) * 1.03;
    return player;
  }

  function setPool(save, pool) {
    save = save || {};
    save.shop40 = normalizeOps(save.shop40 || {});
    save.shop40.ops.pool = pool === "fashion" || pool === "weapon" ? pool : "remnant";
    return save.shop40.ops.pool;
  }

  function setRosterTab(save, tab) {
    save = save || {};
    save.shop40 = normalizeOps(save.shop40 || {});
    save.shop40.ops.rosterTab = ROSTER_TABS.indexOf(tab) >= 0 || tab === "fashion" || tab === "weapon" || tab === "chronicle" ? tab : "scrap";
    return save.shop40.ops.rosterTab;
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
    var hero = liveChar(save, handlers);
    var pool = info.pool || "remnant";
    var state = pool === "fashion" ? info.fashion : pool === "weapon" ? info.weapon : info;
    var pity = state.pity || 0;
    var pitySR = state.pitySR || 0;
    var pulls = state.pulls || 0;
    var shards = pool === "remnant" ? info.shards : state.shards || 0;
    var ssrLeft = Math.max(0, RATES.pitySSR - pity);
    var srLeft = Math.max(0, RATES.pitySR - pitySR);
    var ssrPct = Math.max(0, Math.min(100, Math.round((pity / RATES.pitySSR) * 100)));
    var srPct = Math.max(0, Math.min(100, Math.round((pitySR / RATES.pitySR) * 100)));
    var empty = !cardsForPool(pool).length;
    var poor1 = info.coins < RATES.single || empty;
    var poor10 = info.coins < RATES.ten || empty;
    var sub = pool === "fashion" ? "时装装备才吃满" : pool === "weapon" ? "武器装备才吃满" : "残片进仓库 · 拥有即加成";
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
      '<div class="wishTabs46" id="gachaTabs46">' +
      '<button type="button" data-pool="remnant"' + (pool === "remnant" ? ' class="on"' : "") + ">残片</button>" +
      '<button type="button" data-pool="fashion"' + (pool === "fashion" ? ' class="on"' : "") + ">时装</button>" +
      '<button type="button" data-pool="weapon"' + (pool === "weapon" ? ' class="on"' : "") + ">武器</button>" +
      "</div>" +
      '<div class="wishTitle46"><h3>镜界寻访</h3><p>' +
      sub +
      "</p></div>" +
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
      "</b><b>寻访 " +
      pulls +
      "</b><b>软保 " +
      RATES.softPity +
      "</b><b>碎镜片 " +
      shards +
      " / " +
      RATES.spark +
      "</b></div>" +
      '<div class="gachaActions46"><button type="button" id="gachaPull1"' +
      (poor1 ? ' class="poor"' : "") +
      ">单次寻访<small>" +
      RATES.single +
      '</small></button><button type="button" id="gachaPull10"' +
      (poor10 ? ' class="poor"' : "") +
      ">十连寻访<small>" +
      RATES.ten +
      "</small></button></div></div></div>";
    hideBrokenArt(host);
    var tabs = host.querySelectorAll("#gachaTabs46 [data-pool]");
    for (var t = 0; t < tabs.length; t++) {
      tabs[t].onclick = function () {
        var next = this.getAttribute("data-pool");
        setPool(save, next);
        if (handlers && typeof handlers.setPool === "function") handlers.setPool(next);
        else renderGacha(host, save, handlers);
      };
    }
    var one = host.querySelector("#gachaPull1");
    var ten = host.querySelector("#gachaPull10");
    if (one) one.onclick = function () { (handlers && handlers.pull ? handlers.pull : function () {})(1); };
    if (ten) ten.onclick = function () { (handlers && handlers.pull ? handlers.pull : function () {})(10); };
    return info;
  }

  function loreText(card) {
    if (card && Array.isArray(card.lore) && card.lore.length) {
      return card.lore.join(" ");
    }
    return (card && card.d) || "";
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
      (locked ? "尚未回收。寻访点亮后才会露出立绘。" : loreText(card)) +
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
    var tab = info.rosterTab || "scrap";
    var list = tab === "school" ? SCHOOL_CARDS : CARDS;
    var got = ownedCount(info, list);
    var wall = "";
    if (tab === "school" && !SCHOOL_CARDS.length) {
      wall = '<div class="rosterLater46">后续写入</div>';
    } else {
      wall = list.map(function (card) {
        var count = info.owned[card.id] || 0;
        var locked = count < 1 && DEFAULT_SHOWN.indexOf(card.id) < 0;
        return (
          '<button type="button" class="rosterSlot46 r-' +
          card.r +
          (locked ? " lock" : "") +
          '" data-card="' +
          card.id +
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
      }).join("");
    }
    host.innerHTML =
      '<div class="rosterStage46"><div class="rosterHead46"><h3>镜界仓库</h3><span>已点亮 ' +
      got +
      " / " +
      list.length +
      "</span></div>" +
      '<div class="rosterTabs46" id="rosterTabs46">' +
      '<button type="button" data-roster="scrap"' + (tab === "scrap" ? ' class="on"' : "") + ">残件</button>" +
      '<button type="button" data-roster="school"' + (tab === "school" ? ' class="on"' : "") + ">基础</button>" +
      "</div><div id=\"rosterWall46\">" +
      wall +
      "</div></div>";
    hideBrokenArt(host);
    var tabs = host.querySelectorAll("#rosterTabs46 [data-roster]");
    for (var t = 0; t < tabs.length; t++) {
      tabs[t].onclick = function () {
        var next = this.getAttribute("data-roster");
        setRosterTab(save, next);
        if (handlers && typeof handlers.setRosterTab === "function") handlers.setRosterTab(next);
        else renderRoster(host, save, handlers);
      };
    }
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
    var overlay = global.document.createElement("div");
    overlay.id = "gachaReveal46";
    if (instant) overlay.className = "isTest";
    var gridClass = items.length > 1 ? "revealGrid46 ten" : "revealGrid46 one";
    overlay.innerHTML =
      '<div class="' +
      gridClass +
      '">' +
      items
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
            (card.legend || rarity === "LEGEND" ? '<span class="revealLegend46">传说</span>' : "") +
            (isNew ? '<span class="revealNew46">NEW</span>' : "") +
            "<b>" +
            (card.n || item.n || "") +
            "</b></div></div></div>"
          );
        })
        .join("") +
      '</div><div class="revealActs46"><button type="button" class="revealSkip46">跳过</button><button type="button" class="revealTake46">收下证词</button>' +
      (handlers && typeof handlers.again === "function"
        ? '<button type="button" class="revealAgain46">再寻一次</button>'
        : "") +
      "</div>";
    drawer.appendChild(overlay);
    hideBrokenArt(overlay);
    var cards = overlay.querySelectorAll(".revealCard46");
    function flipAll() {
      for (var c = 0; c < cards.length; c++) cards[c].classList.add("flipped");
    }
    for (var i = 0; i < cards.length; i++) {
      (function (node, delay) {
        node.onclick = function () {
          node.classList.add("flipped");
        };
        if (!instant) {
          setTimeout(function () {
            if (node.isConnected) node.classList.add("flipped");
          }, 240 + delay * 110);
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
      pill("story", "回收演习", "肉鸽四章") +
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
      ach: ["成就图鉴", "回收记录"],
    };
    var art = { talent: "talent", story: "story", asc: "ascension", ach: "achievement" };
    var url = typeof global.artUrl === "function" ? global.artUrl : function (p) { return p; };
    var buttons = host.querySelectorAll ? host.querySelectorAll("[data-open]") : [];
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var id = btn.getAttribute ? btn.getAttribute("data-open") : "";
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
    FASHION_CARDS: FASHION_CARDS,
    WEAPON_CARDS: WEAPON_CARDS,
    SCHOOL_CARDS: SCHOOL_CARDS,
    hasSchool: hasSchool,
    POOL_IDS: POOL_IDS,
    ROSTER_TABS: ROSTER_TABS,
    SCRAP_BONUS: SCRAP_BONUS,
    DEFAULT_SHOWN: DEFAULT_SHOWN,
    injectStyle: injectStyle,
    normalizeOps: normalizeOps,
    snapshot: snapshot,
    pull: pull,
    grantCheat: grantCheat,
    portraitTap: portraitTap,
    applyOwnedBonus: applyOwnedBonus,
    setPool: setPool,
    setRosterTab: setRosterTab,
    renderGacha: renderGacha,
    renderRoster: renderRoster,
    showReveal: showReveal,
    bindHeroTap: bindHeroTap,
    renderStageModes: renderStageModes,
    dressArchive: dressArchive,
    cardOf: cardOf,
    cheatToast: CHEAT_TOAST,
  };
})(typeof window !== "undefined" ? window : globalThis);
