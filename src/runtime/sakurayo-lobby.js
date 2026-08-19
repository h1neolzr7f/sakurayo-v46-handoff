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
  var ROSTER_TABS = Object.freeze(["scrap", "school", "job", "fusion", "fashion", "weapon"]);
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

  var FASHION_CARDS = Object.freeze([
    { id: "fashion_sayo_plain", n: "未归·常服小夜", r: "N", kind: "fashion", face: "sayo", d: "还没写成夜的那身常服。", lore: ["我是还没被写成夜的小夜。", "外套是白的，枪是旧的。", "常服最容易被当成活人。", "袖口已经起线。"] },
    { id: "fashion_sayo_neon", n: "未归·霓虹小夜", r: "R", kind: "fashion", face: "sayo", d: "灯比人先亮。", lore: ["霓虹先认出我，人群没有。", "电台在脚边响。", "粉色光把伤口照得很清楚。", "灯灭的时候我还在。"] },
    { id: "fashion_sayo_night", n: "未归·夜巡小夜", r: "SR", kind: "fashion", face: "sayo", school: "shrine", d: "夜巡没有终点。", lore: ["我沿着鸟居走了一整夜。", "冠的碎片在口袋里发烫。", "没有人交接下一班。", "月亮先下班。"] },
    { id: "fashion_aya_suit", n: "未归·制服绫", r: "N", kind: "fashion", face: "aya", d: "企业还承认这套制服。", lore: ["制服比我更像绫。", "蓝领带是唯一没被拆的零件。", "手枪藏在文件袋里。", "工牌已经作废。"] },
    { id: "fashion_aya_coat", n: "未归·风衣绫", r: "R", kind: "fashion", face: "aya", d: "风衣盖不住作废券。", lore: ["风衣够长，盖不住券上的戳。", "夜风比刀快。", "我把通行证揣进内袋。", "门还是关着。"] },
    { id: "fashion_aya_veil", n: "未归·面纱绫", r: "SR", kind: "fashion", face: "aya", school: "gun", d: "面纱遮不住准星。", lore: ["面纱是给葬礼准备的。", "我从纱后看见准星。", "花瓣粘在纱上，像没擦干净的妆。", "揭开也没有另一张脸。"] },
    { id: "fashion_rion_keiko", n: "未归·稽古凛音", r: "N", kind: "fashion", face: "rion", d: "木刀也要鞠躬。", lore: ["稽古场只剩下我一个人。", "木刀比家谱诚实。", "我还是先鞠躬再出招。", "没有人喊停。"] },
    { id: "fashion_rion_haori", n: "未归·羽织凛音", r: "R", kind: "fashion", face: "rion", d: "羽织盖住未署名的刀。", lore: ["羽织是黑羽家的夜。", "我把刀光藏进袖里。", "家纹比心跳清楚。", "袖口有没写完的名。"] },
    { id: "fashion_rion_bloom", n: "未归·花葬凛音", r: "SR", kind: "fashion", face: "rion", school: "cult", d: "花开在剑冢上。", lore: ["花不是开给活人的。", "我把花放在折断的飞剑旁。", "红比黑先谢。", "没有宾客。"] },
    { id: "fashion_sayo_crown", n: "终夜樱冠", r: "SSR", kind: "fashion", face: "sayo", school: "shrine", legend: true, d: "冠亮着，夜已经结束。", lore: ["这是最后一顶还给小夜的冠。", "金边裂开以后还在发光。", "我把它戴上，像把失败戴正。", "冠比头骨持久。"] },
    { id: "fashion_aya_funeral", n: "零号葬仪", r: "SSR", kind: "fashion", face: "aya", school: "gun", legend: true, d: "企业为零件举行葬礼。", lore: ["零号企业给拆开的人格开葬仪。", "白花不是安慰，是清单。", "我穿着黑大衣去领自己的那一份。", "没有遗像，只有工号。"] },
    { id: "fashion_rion_bride", n: "黄泉花嫁", r: "SSR", kind: "fashion", face: "rion", school: "cult", legend: true, d: "嫁妆是一把葬刀。", lore: ["黄泉不收活人的聘礼。", "红盖头下面还是凛音。", "刀比誓词先落地。", "没有人来掀盖头。"] },
  ]);
  var WEAPON_CARDS = Object.freeze([
    { id: "weapon_sayo_spare", n: "备用夜樱弹", r: "N", kind: "weapon", face: "sayo", d: "备用弹也不够打穿镜核。", lore: ["备用弹匣写着小夜。", "我数过，还是不够。", "樱花印在弹壳上。", "最后一发留给没回来的人。"] },
    { id: "weapon_sayo_petal", n: "花瓣弹匣", r: "R", kind: "weapon", face: "sayo", d: "花比子弹先落地。", lore: ["弹匣里落下花瓣。", "我还是推弹上膛。", "花不会飞向镜核。", "空仓响了一下。"] },
    { id: "weapon_aya_side", n: "侧持短铳", r: "N", kind: "weapon", face: "aya", d: "侧持是为了留出拔刀的手。", lore: ["短铳在右侧。", "左侧留给太刀。", "这一次刀没出鞘。", "铳先空。"] },
    { id: "weapon_aya_twin", n: "双持月切", r: "R", kind: "weapon", face: "aya", d: "两把都来不及。", lore: ["我试过两把一起。", "准星和刀锋互相抢。", "花瓣落在两只手上。", "都没砍到该砍的人。"] },
    { id: "weapon_rion_wood", n: "无铭木刀", r: "N", kind: "weapon", face: "rion", d: "木刀也会折。", lore: ["木刀没有署名。", "稽古场的夜特别长。", "它先于飞剑折断。", "木屑比血轻。"] },
    { id: "weapon_rion_under", n: "鞘中黑羽", r: "R", kind: "weapon", face: "rion", d: "刀还在鞘里。", lore: ["黑羽藏在鞘中。", "我以为不出刃就能少折一把。", "鞘先裂。", "里面是空的。"] },
    { id: "weapon_mirror_round", n: "圆镜盾刃", r: "SR", kind: "weapon", face: "aya", any: true, d: "圆镜能挡一次。", lore: ["圆镜不是给谁单独用的。", "它照见三张脸，哪张都不全。", "挡完就裂。", "裂片还亮。"] },
    { id: "weapon_shard_blade", n: "裂镜片刃", r: "SR", kind: "weapon", face: "sayo", any: true, d: "片刃从镜里长出来。", lore: ["这把刀没有锻造。", "它是镜碎以后自己站起来的。", "谁拿都会被划到。", "刃比人薄。"] },
    { id: "weapon_radio_bat", n: "电台短棍", r: "SR", kind: "weapon", face: "sayo", any: true, d: "还在播的那根天线。", lore: ["电台被拧下来当短棍。", "电流还在笑。", "打到的人听得见夜话。", "电池先死。"] },
    { id: "weapon_sayo_final", n: "夜樱终弹", r: "SSR", kind: "weapon", face: "sayo", legend: true, d: "只剩最后一发。", lore: ["终弹是写给小夜的。", "步枪比人更知道这是最后一次。", "樱花开在空仓上。", "打出去就没有下一夜。"] },
    { id: "weapon_aya_mirror", n: "月切·镜反", r: "SSR", kind: "weapon", face: "aya", legend: true, d: "刀刃是碎掉的镜子。", lore: ["月切反的是镜，不是月。", "我从刃里看见自己出鞘太慢。", "手枪还在另一只手。", "反出去的是空弹壳。"] },
    { id: "weapon_rion_burial", n: "黑羽葬", r: "SSR", kind: "weapon", face: "rion", legend: true, d: "这把刀是墓碑。", lore: ["黑羽葬插在剑冢最深处。", "它比飞剑更像结局。", "我握住它，像握住自己的坟。", "没有人来上香。"] },
  ]);
  var CHRONICLE = Object.freeze([
    { id: "ch_zero_death", n: "第零次死亡", lore: ["三年前我就死在镜界实验里。神社扫地的那个人，可能只是备份。", "他们把我的名字写回名册，像把打翻的水倒回杯里。水已经不是原来那杯。", "我记得冷，记得镜核亮起来，不记得谁把我从名册上擦掉。", "如果现在的我是备份，那第一夜的我，还欠一句再见。"] },
    { id: "ch_hundred_eyes", n: "百目共视", lore: ["百目不是监视器。是很多双已经死过的眼睛，叠在同一副眼眶里。", "每次有人走进镜核，那些眼睛就替我再看一次。看到的都是同一条死路。", "绫说企业管这叫采集。凛音说黄泉流早写过。我只觉得眼睛不够用。", "共视结束的时候，没有人眨眼。"] },
    { id: "ch_zero_corp", n: "零号企业", lore: ["绫的企业不生产枪，生产可替换的人。我是被拆借过的零件之一。", "他们把「会怕」单独装进一间实验室，把「还会回来」装进另一间。", "巫女那一夜不是这条线。这条线没有符，只有工号和作废券。", "拆完以后，他们说还可以再组装一个小夜。价格另议。"] },
    { id: "ch_sword_mound", n: "失败者剑冢", lore: ["剑冢里每一把剑都是一条没走到核心的我。所有小夜都来过，没人留下脚印。", "我数过，数到后来不敢数。刀柄上的名字有的是我，有的快要不是。", "凛音从旁边走过，没有鞠躬。她认得这些刀，比我更认得。", "核心还在最里面。我们都走到过门口，门上没有锁，只有上一夜的我。"] },
    { id: "ch_after_zero", n: "镜零之后", lore: ["镜零是失败的小夜训练出来的。训练的不是胜利，是怎么把下一夜送回去。", "碎镜以后又醒来一个我。她问这是第几次。我没有数字可以给她。", "电台还在播，封条还在写同一个字。备份和原件已经吵不清楚。", "如果还有下一夜，让她别再把我写成一张完整的卡。"] },
  ]);
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
  var JOB_CARDS = Object.freeze([
    { id: "job_swarm", n: "未归·蜂群统御", r: "SR", kind: "job", tag: "转职", school: "mech", face: "sayo", dmg: 0.005, d: "无人机成群却不听令。拥有即机械师倾向 ×1.5，全伤害 +0.5%，重复不加。", lore: ["我是把蜂群写成姐姐的那一版机械师小夜。无人机比我先学会排队，也比我先学会离开。", "我把步枪焊进指挥频段。每一架都画上樱花，像给妹妹系一条还会断的红绳。", "蜂群选择了镜核的热源。我按召回，屏幕只回一行冷字：这一夜已经无主。", "螺旋桨还在远处响。遥控器烫得握不住，像握着别人的失败。"] },
    { id: "job_railLord", n: "未归·天穹磁轨", r: "SR", kind: "job", tag: "转职", school: "mech", face: "sayo", dmg: 0.005, d: "轨道比步枪更直也更容易折。拥有即机械师倾向 ×1.5，全伤害 +0.5%，重复不加。", lore: ["我是想用磁轨把夜空钉住的机械师小夜。轨道比步枪更直，也比人更容易折在半空。", "我沿着天穹一节一节铺轨，焊到鸟居那么高。无人机当铆钉，人当绝缘体。", "磁轨先吸走弹壳，再吸走准星。轨道自己弯向镜核，把我留在地上。", "铁还在震。我的手已经对不上极性，像对不上自己的名字。"] },
    { id: "job_hive", n: "未归·万菌母巢", r: "SR", kind: "job", tag: "转职", school: "spore", face: "sayo", dmg: 0.005, d: "孢子认镜子不认姓。拥有即菌群倾向 ×1.5，全伤害 +0.5%，重复不加。", lore: ["我是想成为母巢本身的菌群小夜。孢子只认镜子里的热，不认我写在袖口的姓。", "我把菌丝编进步枪握把，让它们跟我一起呼吸。它们发光，像另一层不肯听话的皮肤。", "母巢选择了更热的核。我被当成过期的培养基，从胸口往外被吃空。", "蘑菇还在肩上亮。我的名字已经发酵完了，只剩甜得发苦的气味。"] },
    { id: "job_garden", n: "未归·尸骸花园", r: "SR", kind: "job", tag: "转职", school: "spore", face: "sayo", dmg: 0.005, d: "花开在别人身上。拥有即菌群倾向 ×1.5，全伤害 +0.5%，重复不加。", lore: ["我是把尸体当成花圃的菌群小夜。花开在别人身上，种子却不肯回到我手里。", "我一路种花，从神社石阶开到剑冢门口。步枪当锄，孢子当一场不肯停的雨。", "花园先吞掉脚印，再吞掉园丁。镜核从花心里长出来，比任何一朵都亮。", "花还香。我已经是土，连浇水的手都埋进去了。"] },
    { id: "job_starIdol", n: "未归·星穹偶像", r: "SR", kind: "job", tag: "转职", school: "magical", face: "sayo", dmg: 0.005, d: "灯比咒语先亮。拥有即魔法少女倾向 ×1.5，全伤害 +0.5%，重复不加。", lore: ["我是被写成星穹台上的那一版魔法少女。灯比咒语先亮，人比变身慢了整整一夜。", "我把步枪举成麦克风。冠还在发光，舞台却往下沉，像要把我还回神社。", "星穹塌了一角。应援棒还亮着，变身只走到一只手套，另一只仍是血。", "灯灭以后，妆裂在眼角。没有返场灯，也没有人喊我的名字。"] },
    { id: "job_miracle", n: "未归·奇迹魔女", r: "SR", kind: "job", tag: "转职", school: "magical", face: "sayo", dmg: 0.005, d: "奇迹写在合同里。拥有即魔法少女倾向 ×1.5，全伤害 +0.5%，重复不加。", lore: ["我是还想创造一次奇迹的魔法少女小夜。奇迹写在合同里，失败却先写在冠的金边上。", "我把没转完的变身一次次重念。步枪没有变成权杖，花瓣却学会了只往上飞。", "奇迹先离开身体。冠还烫，咒语停在一半，人已经在往下坠。", "金边还亮着。我已经不值得被许愿，只值得被写成一张没转完的卡。"] },
    { id: "job_exorcist", n: "未归·祓魔执行官", r: "SR", kind: "job", tag: "转职", school: "shrine", face: "sayo", dmg: 0.005, d: "执行令先于人作废。拥有即巫女倾向 ×1.5，全伤害 +0.5%，重复不加。", lore: ["我是神社派来执行祓魔的那一夜小夜。符纸写着执行，镜核却先写好了否决。", "我把封条贴上步枪、贴上鸟居、贴上自己的袖口。外面的备份还在扫地，假装这是普通的夜。", "符烧完了，执行令当众作废。裂口从镜里爬到肩上，朱砂把失败写得很工整。", "我仍举着枪。封条比命令先落地，像先辞职的那一张纸。"] },
    { id: "job_guardian", n: "未归·八咫守护者", r: "SR", kind: "job", tag: "转职", school: "shrine", face: "sayo", dmg: 0.005, d: "鸟比人先掉下来。拥有即巫女倾向 ×1.5，全伤害 +0.5%，重复不加。", lore: ["我是被派去守八咫的那一版巫女。鸟比我先看见裂镜，也比我先从夜色里掉下来。", "我把步枪靠在鸟居上，一夜一夜数那些不回来的翅膀。符灰比羽毛轻，比名字重。", "八咫没有守住核。羽毛烧成符灰，守护者变成被守护过的尸体。", "鸟居还在。我的影子短了一截，像被谁先收走了半只。"] },
    { id: "job_warSinger", n: "未归·尸潮歌姬", r: "SR", kind: "job", tag: "转职", school: "idol", face: "sayo", dmg: 0.005, d: "观众席站满不该来的人。拥有即歌姬倾向 ×1.5，全伤害 +0.5%，重复不加。", lore: ["我是对着尸潮开口的那一版歌姬。观众席站满了不该买票的人，灯却还认我。", "歌比子弹先出门。我把步枪靠在脚边，对着没有活人的灯光把词一句句唱完。", "尸潮跟着节拍靠近。电台替我鞠躬，我跪在花瓣里，声带还在，人不在频率上。", "下一首歌自动连播。没有人喊安可，只有潮声替我鼓掌。"] },
    { id: "job_healingIdol", n: "未归·治愈偶像", r: "SR", kind: "job", tag: "转职", school: "idol", face: "sayo", dmg: 0.005, d: "歌能止痛不能缝夜。拥有即歌姬倾向 ×1.5，全伤害 +0.5%，重复不加。", lore: ["我是被推上台医人的那一版偶像。歌能止痛，不能把裂开的夜重新缝回去。", "我一路唱给倒下的人听。麦克风比步枪先烫手，花比药先落地，像抢着宣布无效。", "治愈先用完自己。电台还在报时，人已经不在这条频率上，只剩回声。", "掌声是空的。药箱里只剩歌词，连一句完整的再见都没有。"] },
    { id: "job_barrage", n: "未归·弹幕暴君", r: "SR", kind: "job", tag: "转职", school: "gun", face: "aya", dmg: 0.005, d: "弹幕先打空自己的夜。拥有即枪斗倾向 ×1.5，全伤害 +0.5%，重复不加。", lore: ["我是把弹幕写成领土的那条枪线。手枪是呼吸，太刀是还没来得及说出口的话。", "我把弹匣数得很干净。花瓣总是提醒我再快一点，我偏要把夜填得更密。", "弹幕先打空自己的夜。近身的爪子摸到领口，刀还在鞘里，像迟到的第二句话。", "套筒后锁。暴君的国土只剩空壳，连一发能认账的弹都没有。"] },
    { id: "job_sniper", n: "未归·处刑狙击", r: "SR", kind: "job", tag: "转职", school: "gun", face: "aya", dmg: 0.005, d: "最后一发打空。拥有即枪斗倾向 ×1.5，全伤害 +0.5%，重复不加。", lore: ["我是被派去处刑镜核的那一枪。距离够远，心跳却比子弹更早到达准星。", "我趴过神社屋顶，也趴过企业天台。手枪守近，太刀守退路，狙击只守这一发。", "最后一发打空。近身已经没有时间，处刑改成被处刑，花瓣盖住准星。", "准星还在。人已经不在那条直线上，只留下一枚没认账的空壳。"] },
    { id: "job_plagueDoctor", n: "未归·瘟疫医师", r: "SR", kind: "job", tag: "转职", school: "alch", face: "aya", dmg: 0.005, d: "处方反噬署名。拥有即炼金倾向 ×1.5，全伤害 +0.5%，重复不加。", lore: ["我是把瘟疫写成处方的炼金绫。面具比脸先成为我，药味比姓名先被人记住。", "手枪看守火候，太刀切开试剂。我把别人的名字熬成能喝的东西，还假装这是治疗。", "处方反噬署名。封条在坩埚里烧成失败的味道，玻璃也沿着我的倒影裂开。", "药还在响。医师已经不值得过滤，只值得被写进下一张作废的单。"] },
    { id: "job_philosopher", n: "未归·贤者之石", r: "SR", kind: "job", tag: "转职", school: "alch", face: "aya", dmg: 0.005, d: "石头答应永生不答应完整。拥有即炼金倾向 ×1.5，全伤害 +0.5%，重复不加。", lore: ["我是还想炼出石头的那一版绫。石头答应永生，却不答应把人炼得完整。", "我把封条当瓶盖，把作废券当配方。手枪守炉，太刀守冷却，像守一座不肯承认的坟。", "石头先炼化了炼金台。人变成渣，核变成更亮的废料，连工号都熔进底。", "炉是冷的。我的名字写在残渣上，比任何一句咒语都清楚。"] },
    { id: "job_bloodDuke", n: "未归·鲜血公爵", r: "SR", kind: "job", tag: "转职", school: "vamp", face: "aya", dmg: 0.005, d: "最后一口吸空的是自己。拥有即血族倾向 ×1.5，全伤害 +0.5%，重复不加。", lore: ["我是把血统写成爵位的血族绫。血不是别人的，是企业拆剩下、又被我饮回去的我。", "手枪守墓园，太刀守喉咙。花谢得比夜快，我喝得比花更快，像赶一份清单。", "最后一瓶写着自己的名字。吸空以后，连扣扳机的力气都退成水色。", "爵冠是空的。泪比血晚到，也比血更不像胜利。"] },
    { id: "job_batQueen", n: "未归·夜蝠女王", r: "SR", kind: "job", tag: "转职", school: "vamp", face: "aya", dmg: 0.005, d: "蝠群先离开王座。拥有即血族倾向 ×1.5，全伤害 +0.5%，重复不加。", lore: ["我是把夜蝠认作宫廷的那一版绫。它们认血，不认我戴歪的那顶王冠。", "我把翅膀编进风衣。手枪是权杖，太刀是还没来得及签署的条约，花瓣是未干的印。", "蝠群先离开王座。镜子比我更像女王，我被留在空的夜里，连一声召回都没有。", "翅膀还在远处响。冠已经掉进坟里，像一枚不肯退回的聘礼。"] },
    { id: "job_element", n: "未归·元素统御", r: "SR", kind: "job", tag: "转职", school: "mage", face: "aya", dmg: 0.005, d: "元素先统御施法者。拥有即魔法师倾向 ×1.5，全伤害 +0.5%，重复不加。", lore: ["我是捏着通行证想统御元素的绫。券是金的，门是假的，火却认认真真地烫手。", "法阵画在水里，手枪还在腰上。我以为火和冰能被念咒排队，像企业里的零件。", "元素先统御了施法者。券面盖了作废，法阵从掌心往外死，墨比血先干。", "VOID 两个字母比我的咒语清楚，也比我的名字更像结局。"] },
    { id: "job_timeMage", n: "未归·时序魔导师", r: "SR", kind: "job", tag: "转职", school: "mage", face: "aya", dmg: 0.005, d: "倒回去的只有作废戳。拥有即魔法师倾向 ×1.5，全伤害 +0.5%，重复不加。", lore: ["我是想把时序倒回去的那一版魔法师。秒针只认规则，不认我想救回的那一夜。", "我把怀表焊进法阵。手枪守这一秒，太刀守上一秒，像把退路切成两段。", "时序先折断了导师。倒回去的只有作废戳，人停在盖戳的那一帧，连眨眼都不被允许。", "表还在走。我已经不在这一格，只剩指针还认得我的工号。"] },
    { id: "job_shadow", n: "未归·无明影刃", r: "SR", kind: "job", tag: "转职", school: "ninja", face: "aya", dmg: 0.005, d: "影遁出界人没回来。拥有即忍者倾向 ×1.5，全伤害 +0.5%，重复不加。", lore: ["我是从镜缝里进出的那条无明影。外面的我负责开枪，里面的我负责把自己删掉。", "分身比本体勤快。我把太刀留给回来的那一格，手枪留给还站着的这一格。", "影遁出了界。分身散成灰，本体没有从裂镜对面走回来，只剩一层还举着枪的皮。", "残影还在扣扳机。刃已经不在这一侧，像把退路留在了别人的夜里。"] },
    { id: "job_bombNinja", n: "未归·爆符忍军", r: "SR", kind: "job", tag: "转职", school: "ninja", face: "aya", dmg: 0.005, d: "符先炸了归路。拥有即忍者倾向 ×1.5，全伤害 +0.5%，重复不加。", lore: ["我是把符纸写成炸药的那一支忍。爆炸比影遁守时，也比回家的路更守时。", "我把爆符贴上袖口、贴上弹匣、贴上要回来的石阶。太刀负责切开还没响的引线。", "符先炸了归路。烟散以后，军旗还在，人没有从对面走回来，只剩纸灰。", "纸灰还烫。署名栏被轰空了，像一张不肯承认失败的军令。"] },
    { id: "job_swordSaint", n: "未归·万剑仙", r: "SR", kind: "job", tag: "转职", school: "cult", face: "rion", dmg: 0.005, d: "万剑先折在别人坟上。拥有即修仙倾向 ×1.5，全伤害 +0.5%，重复不加。", lore: ["我是黑羽家被送去飞升的那一页万剑。飞剑比家谱先出门，也比人更先学会折断。", "剑冢里每一把剑都认识我。我路过那些失败的小夜，没有对任何一把刀鞠躬。", "万剑先折在别人的坟上。刃还在振，飞出去的那一半回不来，像不肯认账的半个名字。", "我握住折断的那截。仙名没有写上，天也没有为此开过一次。"] },
    { id: "job_thunderLord", n: "未归·雷劫道君", r: "SR", kind: "job", tag: "转职", school: "cult", face: "rion", dmg: 0.005, d: "劫先劈开飞剑。拥有即修仙倾向 ×1.5，全伤害 +0.5%，重复不加。", lore: ["我是去接雷劫的那一版修仙凛音。雷只认剑冢里的铁，不认我袖里那张发烫的道号。", "我把长刀举成避雷针。家谱在袖里发烫，飞剑在肩上发白，像提前写出的讣告。", "劫先劈开飞剑。道君的冠掉进坟里，人还站着，天却没有为此打开。", "雷还在响。署名只剩焦黑，连一句道号都写不回去。"] },
    { id: "job_titan", n: "未归·再生泰坦", r: "SR", kind: "job", tag: "转职", school: "gene", face: "rion", dmg: 0.005, d: "再生没跑过突变。拥有即基因倾向 ×1.5，全伤害 +0.5%，重复不加。", lore: ["我是被改成泰坦的那一版基因凛音。再生写在合同里，突变却写进还在跳的肉里。", "实验室的灯和鸟居的灯一起亮。我用长刀压住往外长的那只手臂，像压住另一份遗嘱。", "再生追上伤口，没追上镜裂。红晶比皮肤先成为我，合同上的人已经对不上这张脸。", "刀还认得手。泰坦不太认得我，像认错了该复活的那一具。"] },
    { id: "job_berserk", n: "未归·超载狂战", r: "SR", kind: "job", tag: "转职", school: "gene", face: "rion", dmg: 0.005, d: "超载先烧掉刹车。拥有即基因倾向 ×1.5，全伤害 +0.5%，重复不加。", lore: ["我是把再生拧到超载的狂战。力量先到，名字后碎，像一份写反了的紧急合同。", "我一路砍到剑冢最深处。血比家谱诚实，刀比合同短，连停手的字都没有。", "超载先烧掉刹车。突变追上狂战，人变成还在挥的那一截，连回头的余地都没有。", "刀还在响。我已经停不下来，也没有谁能替我按停。"] },
    { id: "job_beast", n: "未归·百兽统御", r: "SR", kind: "job", tag: "转职", school: "summon", face: "rion", dmg: 0.005, d: "百兽先统御署名。拥有即召唤倾向 ×1.5，全伤害 +0.5%，重复不加。", lore: ["我是把影子当成百兽的召唤凛音。契约纸比刀快，反噬比任何部下都守时。", "我在腕上缠满符。刀尖指着该来的兽，它却从背后先到，像早就读过我的署名。", "百兽先统御了署名。红线勒进刀柄，影子比我更高，主人反而要低头。", "符烧完了。兽还在，主人不在，只剩空的腕和还在跳的线。"] },
    { id: "job_heroic", n: "未归·英灵契约", r: "SR", kind: "job", tag: "转职", school: "summon", face: "rion", dmg: 0.005, d: "英灵先收下契约。拥有即召唤倾向 ×1.5，全伤害 +0.5%，重复不加。", lore: ["我是去签英灵的那一版召唤。英灵认剑冢里的死，不认还站着的这一具凛音。", "我把名字写进契。刀是祭品，血是印章，影子是还没赶到的部下。", "英灵先收下契约。人被写成祭品，影子比我更先成为英雄，连鞠躬都轮不到我。", "契还在腕上发烫。署名已经被收走，像一笔不肯退回的聘金。"] },
    { id: "job_boneKing", n: "未归·白骨君王", r: "SR", kind: "job", tag: "转职", school: "necro", face: "rion", dmg: 0.005, d: "先称王的是自己的骨头。拥有即死灵倾向 ×1.5，全伤害 +0.5%，重复不加。", lore: ["我是看见终章以后还想称王的死灵。先称王的不是我，是自己已经亮起来的骨头。", "魂火从掌心往上爬。刀还在，名字开始透明，像被谁从家谱上轻轻擦掉。", "我把凛音收成可召唤的白骨。契约成立的瞬间，王冠戴在空的颅骨上，很合适。", "火还亮。君王的署名栏空了，只剩一具还想发令的架子。"] },
    { id: "job_soulHerd", n: "未归·群魂牧者", r: "SR", kind: "job", tag: "转职", school: "necro", face: "rion", dmg: 0.005, d: "群魂先牧走牧者。拥有即死灵倾向 ×1.5，全伤害 +0.5%，重复不加。", lore: ["我是去牧群魂的那一版死灵凛音。魂认终章里的火，不认我手里这根还在发抖的牧鞭。", "我把刀当杖，把失败的小夜当成羊。火一路亮到剑冢门口，像一条不肯回头的路。", "群魂先牧走了牧者。人变成燃料，鞭还在空中响，羊群比我更认得方向。", "火还在远处走。我已经不在羊群里，只剩一句没来得及喊停的名字。"] },
  ]);
  var FUSION_CARDS = Object.freeze([
    { id: "fusion_magitech", n: "未归·星核机甲少女", r: "SSR", kind: "fusion", tag: "融合", pair: ["mech", "magical"], face: "sayo", dmg: 0.008, d: "机甲裂开仍是小夜。拥有即机械师与魔法少女倾向 ×1.6，全伤害 +0.8%，重复不加。", lore: ["我是把星核焊进机甲胸口的那一版小夜。无人机当姐姐，冠却还想把我写成魔法少女。", "我一路用步枪当遥控器。星冠戴上以后，机甲仍裂着，露出里面还是神社那件白外套。", "机甲先裂开。无人机去追星核的热，冠还亮，人已经从缝里掉出来。", "遥控器烫手。我还是小夜，只是再也拼不回完整的一夜。"] },
    { id: "fusion_gunshrine", n: "未归·祓魔枪巫女", r: "SSR", kind: "fusion", tag: "融合", pair: ["gun", "shrine"], face: "sayo", dmg: 0.008, d: "步枪写符，符烧完。拥有即枪斗与巫女倾向 ×1.6，全伤害 +0.8%，重复不加。", lore: ["我是把符纸写进弹匣的那一夜巫女。步枪是鸟居，符是还没干的朱砂。", "我把封条一层层贴上枪管，贴上准星，贴上自己的袖口。外面的备份还在扫地。", "符烧完了。祓魔波停在半空，镜核比名字先亮，朱砂把失败写得很工整。", "我仍举着空枪。封条比弹壳先落地。"] },
    { id: "fusion_bloodstar", n: "未归·血月魔法少女", r: "SSR", kind: "fusion", tag: "融合", pair: ["vamp", "magical"], face: "sayo", dmg: 0.008, d: "冠还亮，血从变身缝里漏。拥有即血族与魔法少女倾向 ×1.6，全伤害 +0.8%，重复不加。", lore: ["我是想在血月下变身的那一版小夜。冠比我先发光，血却比咒语先出门。", "变身只走到一只手套。其余的我还是神社外套，步枪没有变成权杖，花瓣沾着自己的血。", "冠还亮着，变身缝却裂开。血从缝里漏出来，像另一层不肯干的妆。", "金边还烫。咒语停在一半，人已经空了。"] },
    { id: "fusion_bloodmech", n: "未归·血械猎姬", r: "SSR", kind: "fusion", tag: "融合", pair: ["vamp", "mech"], face: "sayo", dmg: 0.008, d: "无人机喝血，遥控器烫手。拥有即血族与机械师倾向 ×1.6，全伤害 +0.8%，重复不加。", lore: ["我是把无人机养成猎犬的血械小夜。它们认血，不认我按下去的召回。", "我把樱花焊在机翼上。步枪当鞭，遥控器当项圈，一路把它们喂到镜核门口。", "无人机先喝空了补给，再回头喝署名。遥控器烫得握不住，像握着别人的喉咙。", "螺旋桨还在远处响。猎姬已经没有可召回的夜。"] },
    { id: "fusion_idolgun", n: "未归·枪火偶像", r: "SSR", kind: "fusion", tag: "融合", pair: ["idol", "gun"], face: "sayo", dmg: 0.008, d: "麦和步枪抢同一只手。拥有即歌姬与枪斗倾向 ×1.6，全伤害 +0.8%，重复不加。", lore: ["我是被推进舞台还要开枪的那一版小夜。麦克风和步枪抢同一只手，节拍比准星更凶。", "歌比子弹先出门。我把步枪举成麦，对着空的灯把词唱完，又把弹匣唱空。", "麦和枪一起掉下去。高连击的安可没有来，只有空仓的回声在鞠躬。", "下一首歌自动连播。我已经不在频率上。"] },
    { id: "fusion_thunderpriest", n: "未归·雷火天师", r: "SSR", kind: "fusion", tag: "融合", pair: ["mage", "shrine"], face: "sayo", dmg: 0.008, d: "符接雷，人被天罚先劈。拥有即魔法师与巫女倾向 ×1.6，全伤害 +0.8%，重复不加。", lore: ["我是去接天罚的那一版巫女。符纸写着雷，天却只认我袖里发烫的名字。", "我把符接在步枪上，像把鸟居举成避雷针。朱砂比咒语先亮，也比人更先焦。", "雷先劈开了施法的人。符烧成灰，天罚落在肩上，镜核反而更亮。", "雷还在响。我已经不值得被写成天师，只值得被写成焦黑的一张纸。"] },
    { id: "fusion_plagueidol", n: "未归·瘟律歌姬", r: "SSR", kind: "fusion", tag: "融合", pair: ["alch", "idol"], face: "sayo", dmg: 0.008, d: "节拍带腐蚀，观众席在溶。拥有即炼金与歌姬倾向 ×1.6，全伤害 +0.8%，重复不加。", lore: ["我是对着腐蚀开口的那一版歌姬。节拍能带动观众，也能把观众席炼化。", "我一路把酸液写进歌词。麦克风比坩埚先烫手，花比药先落地，像抢着宣布无效。", "观众席先溶掉。尸潮还在打拍子，人已经跪在还冒泡的花瓣里。", "掌声是空的。歌还在连播，连一句完整的安可都没有。"] },
    { id: "fusion_railsword", n: "未归·磁轨剑阵", r: "SSR", kind: "fusion", tag: "融合", pair: ["mech", "cult"], face: "sayo", dmg: 0.008, d: "飞剑当铆钉，轨道自己弯。拥有即机械师与修仙倾向 ×1.6，全伤害 +0.8%，重复不加。", lore: ["我是想用磁轨钉住飞剑的那一版小夜。轨道比刃更直，也比人更容易弯向镜核。", "我把飞剑当成铆钉一节节焊上天穹。步枪当绝缘体，人当还没熔的垫片。", "轨道自己弯了。飞剑先吸走弹壳，再吸走准星，把我留在地上。", "铁还在震。我的手已经对不上极性，像对不上自己的姓。"] },
    { id: "fusion_flowerplague", n: "未归·花疫魔女", r: "SSR", kind: "fusion", tag: "融合", pair: ["magical", "spore"], face: "sayo", dmg: 0.008, d: "花弹开在别人身上。拥有即魔法少女与菌群倾向 ×1.6，全伤害 +0.8%，重复不加。", lore: ["我是把花弹认作奇迹的魔法少女。花开在别人身上，种子却不肯回到我手里。", "我一路把孢子编进没转完的变身。冠还亮，步枪当花茎，菌丝当另一层裙摆。", "花弹先开在路过的人身上。花园吞掉脚印，再吞掉园丁，镜核从花心里长出来。", "花还香。我已经是土，连浇水的手都埋进去了。"] },
    { id: "fusion_fleshshrine", n: "未归·生体御神子", r: "SSR", kind: "fusion", tag: "融合", pair: ["gene", "shrine"], face: "sayo", dmg: 0.008, d: "符刻进肉，结界是血。拥有即基因与巫女倾向 ×1.6，全伤害 +0.8%，重复不加。", lore: ["我是把符刻进肉里的那一版巫女。结界答应护身，却只答应用血来画边。", "我把朱砂写进再生的缝。步枪靠在鸟居上，皮肤自己长成符纸，像一件不肯脱的祭服。", "结界先变成血。符还在肉里亮，人已经被自己的护身勒住，连呼吸都要盖章。", "鸟居还在。我的影子短了一截，像被谁先收走了半只。"] },
    { id: "fusion_shadowmage", n: "未归·影法魔女", r: "SSR", kind: "fusion", tag: "融合", pair: ["ninja", "mage"], face: "aya", dmg: 0.008, d: "残影带火冰，本体没回来。拥有即忍者与魔法师倾向 ×1.6，全伤害 +0.8%，重复不加。", lore: ["我是从镜缝里施法的那条影。外面的我负责开枪，里面的我负责把火和冰留下来。", "分身比本体勤快。苦无随机沾上元素，太刀留给回来的那一格，手枪留给还站着的这一格。", "残影还在喷火喷冰。本体没有从裂镜对面走回来，只剩一层还举着枪的皮。", "法阵还在这一侧亮。人已经不在这一侧。"] },
    { id: "fusion_bloodmage", n: "未归·血焰术士", r: "SSR", kind: "fusion", tag: "融合", pair: ["vamp", "mage"], face: "aya", dmg: 0.008, d: "法阵喝自己的血。拥有即血族与魔法师倾向 ×1.6，全伤害 +0.8%，重复不加。", lore: ["我是把法阵养成嘴的血焰绫。券是金的，门是假的，阵却认认真真地喝。", "我把血契画进水里。手枪还在腰上，太刀守冷却，像守一座不肯承认的炉。", "法阵先喝空了施法的人。券面盖了作废，墨从掌心滴进去，比血先干。", "VOID 两个字母比咒语清楚，也比我的工号更像结局。"] },
    { id: "fusion_nanoninja", n: "未归·纳米机忍", r: "SSR", kind: "fusion", tag: "融合", pair: ["mech", "ninja"], face: "aya", dmg: 0.008, d: "无人机抄影遁，人留在镜缝。拥有即机械师与忍者倾向 ×1.6，全伤害 +0.8%，重复不加。", lore: ["我是让无人机去抄影遁的那一支忍。光学诱饵比人守时，归路却不守时。", "我把苦无焊进螺旋桨。冲刺留下斩击，机翼留下残影，像把回家的路复印了无数张。", "无人机先走进镜缝。人留在这一侧，诱饵散成灰，召回键只回一行冷字。", "屏幕黑了。影还在飞，署名已经不在这一格。"] },
    { id: "fusion_shadowblade", n: "未归·御剑影忍", r: "SSR", kind: "fusion", tag: "融合", pair: ["ninja", "cult"], face: "aya", dmg: 0.008, d: "飞剑斩过，影没归鞘。拥有即忍者与修仙倾向 ×1.6，全伤害 +0.8%，重复不加。", lore: ["我是把飞剑写成影的那一支忍。刃比人先出门，鞘却等不到回来的那一格。", "我把影遁焊进剑阵。太刀负责切开标记，手枪留给还站着的这一侧。", "飞剑斩过镜核。影没有归鞘，人停在出鞘的那一帧，连眨眼都不被允许。", "刃还在振。鞘是空的，像一句不肯认账的退路。"] },
    { id: "fusion_plagueforge", n: "未归·瘟炼菌海", r: "SSR", kind: "fusion", tag: "融合", pair: ["alch", "spore"], face: "aya", dmg: 0.008, d: "坩埚里的菌不认署名。拥有即炼金与菌群倾向 ×1.6，全伤害 +0.8%，重复不加。", lore: ["我是把菌海熬进坩埚的炼金绫。它们发光，却不认我写在瓶盖上的工号。", "手枪看守火候，太刀切开试剂。我把神社封条当瓶盖，把孢子当一场不肯停的雨。", "坩埚里的菌先选择了镜核。盖子着了，人变成过期的培养基，从胸口往外被吃空。", "药还在响。署名已经发酵完了，只剩甜得发苦的气味。"] },
    { id: "fusion_biogun", n: "未归·活体弹仓", r: "SSR", kind: "fusion", tag: "融合", pair: ["gene", "gun"], face: "aya", dmg: 0.008, d: "弹匣长肉，枪口朝前。拥有即基因与枪斗倾向 ×1.6，全伤害 +0.8%，重复不加。", lore: ["我是把弹匣养成活物的枪线。它们会呼吸，也会在上膛的时候咬手。", "我把再生写进弹壳。手枪朝前，太刀守退路，花瓣总是提醒我再快一点。", "弹匣先长出了自己的牙。枪口还朝前，人已经被后坐力按在墙上，近身的爪子摸到领口。", "套筒后锁。活弹还在跳，处刑改成被处刑。"] },
    { id: "fusion_bloodsword", n: "未归·血炼剑仙", r: "SSR", kind: "fusion", tag: "融合", pair: ["vamp", "cult"], face: "rion", dmg: 0.008, d: "飞剑以血为炉，冠空。拥有即血族与修仙倾向 ×1.6，全伤害 +0.8%，重复不加。", lore: ["我是把血当成炉火的那一页飞升。飞剑比家谱先出门，冠却先空了。", "剑冢里每一把剑都认识我。我路过那些失败的小夜，没有对任何一把刀鞠躬。", "飞剑以我的血为炉。刃还在振，飞出去的那一半回不来，冠掉进坟里。", "我握住折断的那截。仙名没有写上，天也没有为此开过一次。"] },
    { id: "fusion_chimera", n: "未归·元素嵌合体", r: "SSR", kind: "fusion", tag: "融合", pair: ["gene", "mage"], face: "rion", dmg: 0.008, d: "看见自己手臂的法阵。拥有即基因与魔法师倾向 ×1.6，全伤害 +0.8%，重复不加。", lore: ["我是被嵌进元素的那一版凛音。火、冰、雷写在肉里，合同上的人已经对不上这张脸。", "我用长刀压住往外长的那只手臂。法阵从皮肤下亮起来，像另一份不肯签字的遗嘱。", "我看见自己手臂上的法阵先活了。元素统御了施法者，人变成还在发光的嵌件。", "刀还认得手。嵌合体不太认得我。"] },
    { id: "fusion_corpseimmortal", n: "未归·尸解剑仙", r: "SSR", kind: "fusion", tag: "融合", pair: ["gene", "cult"], face: "rion", dmg: 0.008, d: "肉身先走，剑还在振。拥有即基因与修仙倾向 ×1.6，全伤害 +0.8%，重复不加。", lore: ["我是去尸解的那一版修仙。合同写着飞升，肉身却先一步离开。", "我把再生焊进飞剑。长刀还在振，家谱在袖里发烫，像提前写出的讣告。", "肉身先走了。剑还插在剑冢里振，冠掉进水里，人已经不在这具该飞升的壳里。", "刃还在响。署名只剩焦黑，连一句道号都写不回去。"] },
    { id: "fusion_shikigami", n: "未归·百鬼阴阳师", r: "SSR", kind: "fusion", tag: "融合", pair: ["summon", "shrine"], face: "rion", dmg: 0.008, d: "百鬼比主人先鞠躬。拥有即召唤与巫女倾向 ×1.6，全伤害 +0.8%，重复不加。", lore: ["我是去召百鬼的那一版阴阳。它们认鸟居上的符，不认还站着的这一具凛音。", "我把灵兽写进符纸。长刀是祭品，血是印章，影子是还没赶到的部下。", "百鬼先鞠躬。鞠躬的对象不是我，是镜核。主人反而要低头。", "符烧完了。鬼还在，主人不在，只剩空的腕和还在跳的线。"] },
    { id: "fusion_necrospore", n: "未归·菌尸冥主", r: "SSR", kind: "fusion", tag: "融合", pair: ["necro", "spore"], face: "rion", dmg: 0.008, d: "魂菇从自己肩上长。拥有即死灵与菌群倾向 ×1.6，全伤害 +0.8%，重复不加。", lore: ["我是看见终章以后还想种魂菇的凛音。菇认镜子里的热，不认我手里这根发抖的刀。", "我把拘魂灯插进菌海。刀当杖，失败的小夜当成培养基，火一路亮到剑冢门口。", "魂菇先从我自己肩上长出来。人变成燃料，羊群比我更认得方向。", "火还在远处走。我已经不在羊群里，只剩一句没来得及喊停的名字。"] },
    { id: "fusion_bloodbeast", n: "未归·血契兽王", r: "SSR", kind: "fusion", tag: "融合", pair: ["summon", "vamp"], face: "rion", dmg: 0.008, d: "兽群喝的是署名。拥有即召唤与血族倾向 ×1.6，全伤害 +0.8%，重复不加。", lore: ["我是把影子当成兽群的血契。它们认血，不认我腕上那圈发烫的红线。", "我把名字写进契。刀是祭品，血是印章，部下是还没赶到的坟。", "兽群先喝空了署名。红线勒进刀柄，影子比我更高，主人反而要低头。", "契还在腕上发烫。署名已经被饮尽，像一笔不肯退回的聘金。"] },
    { id: "fusion_elementalbeast", n: "未归·元素御兽使", r: "SSR", kind: "fusion", tag: "融合", pair: ["summon", "mage"], face: "rion", dmg: 0.008, d: "使魔喷元素，鞭先断。拥有即召唤与魔法师倾向 ×1.6，全伤害 +0.8%，重复不加。", lore: ["我是让使魔轮流喷火霜雷的那一版召唤。兽潮比咒语守时，鞭却先断。", "我把元素写进契约。长刀当鞭，灵兽当还没排队的灾，像把退路切成三段。", "使魔先喷向了持鞭的人。火、冰、雷认阵，不认我，鞭在空中先裂开。", "兽潮还在远处走。我已经没有下一记能抽下去的夜。"] },
    { id: "fusion_soulgun", n: "未归·亡骨枪骑", r: "SSR", kind: "fusion", tag: "融合", pair: ["necro", "gun"], face: "rion", dmg: 0.008, d: "弹匣收魂，刀当马鞭。拥有即死灵与枪斗倾向 ×1.6，全伤害 +0.8%，重复不加。", lore: ["我是把魂火装进弹匣的枪骑。刀当马鞭，枪当还没写完的家谱。", "我一路把失败的小夜收成弹药。长刀抽在空鞍上，魂灯在弹壳里亮，像一队不肯下葬的马。", "弹匣先收下了牧者。贯穿的亡魂弹打出去，人停在马上，已经没有可勒的缰。", "刀还在响。马是空的，魂已经不认这个骑手。"] },
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
    indexCards(JOB_CARDS);
    indexCards(FUSION_CARDS);

  function remnantList() {
    return CARDS.concat(SCHOOL_CARDS, JOB_CARDS, FUSION_CARDS);
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
    ".wishSpark46{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;max-height:72px;overflow:auto}" +
    ".wishSpark46 button{min-height:28px;padding:0 8px;border-radius:999px;border:1px solid #ffe6a355;background:#0b0818cc;color:#ffe7a3;font:800 10px/1 system-ui}" +
    ".wishSpark46 button.poor{opacity:.42}" +
    ".rosterEquip46{margin-top:8px;min-height:36px;padding:0 12px;border-radius:10px;border:1px solid #ffe6a366;background:linear-gradient(180deg,#ffe08a,#d8892b);color:#2a1608;font:800 12px/1 system-ui}" +
    ".chronicleBox46{display:grid;gap:10px}" +
    ".chronicleCard46{padding:12px;border-radius:14px;border:1px solid #ffe6a344;background:#0b0818cc;color:#fff7fb;text-align:left}" +
    ".chronicleCard46 b{display:block;margin:0 0 6px;color:#ffe7a3;letter-spacing:.14em}" +
    ".chronicleCard46 p{margin:0 0 6px;color:#f4eaf4;font-size:12px;line-height:1.55}" +
    ".homeNav46{position:relative;z-index:8}" +
    "#menu.homeDock46 .nav{position:relative;z-index:8}" +
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
    var rosterTab = incoming.rosterTab === "school" || incoming.rosterTab === "job" || incoming.rosterTab === "fusion" || incoming.rosterTab === "fashion" || incoming.rosterTab === "weapon" || incoming.rosterTab === "chronicle"
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
    if (SCHOOL_CARDS.some(function (card) {
      return card.school === id && (shop.ops.owned[card.id] || 0) > 0;
    })) return true;
    var feq = cardOf(shop.ops.fashion && shop.ops.fashion.equipped);
    return !!(feq && feq.school === id && (shop.ops.fashion.owned[feq.id] || 0) > 0);
  }

  function hasJob(save, school) {
    var shop = normalizeOps((save && save.shop40) || {});
    var id = String(school || "");
    if (!id) return false;
    return JOB_CARDS.some(function (card) {
      return card.school === id && (shop.ops.owned[card.id] || 0) > 0;
    });
  }

  function preferSsrFulfill(card) {
    if (!card || card.kind === "scrap") return false;
    if (card.kind === "job") return true;
    return card.kind === "school" && (card.school === "shrine" || card.school === "gun" || card.school === "cult");
  }

  function pickOfRarity(rarity, rng, list, owned, want) {
    var grouped = groupByRarity(list || CARDS);
    var pool = grouped[rarity] && grouped[rarity].length ? grouped[rarity] : grouped.R.length ? grouped.R : grouped.N;
    if (!pool || !pool.length) return null;
    if (owned && (rarity === "SSR" || want === "SSR")) {
      var prefer = pool.filter(function (card) {
        return (owned[card.id] || 0) < 1 && preferSsrFulfill(card);
      });
      if (prefer.length) pool = prefer;
      else {
        var noScrap = pool.filter(function (card) { return card.kind !== "scrap"; });
        if (noScrap.length) pool = noScrap;
      }
    }
    return pool[Math.floor(rng() * pool.length) % pool.length];
  }

  function hasRarity(list, rarity) {
    var c;
    for (c = 0; c < list.length; c++) {
      if (list[c].r === rarity) return true;
    }
    return false;
  }

  function highestRarity(list) {
    var i;
    for (i = 0; i < RARITY_RANK.length; i++) {
      if (hasRarity(list, RARITY_RANK[i])) return RARITY_RANK[i];
    }
    return null;
  }

  function lowestRarity(list) {
    var i;
    for (i = RARITY_RANK.length - 1; i >= 0; i--) {
      if (hasRarity(list, RARITY_RANK[i])) return RARITY_RANK[i];
    }
    return null;
  }

  function downgradeRarity(want, list) {
    if (want === "SSR" && !hasRarity(list, "SSR")) return highestRarity(list);
    var start = RARITY_RANK.indexOf(want);
    if (start < 0) start = 0;
    var i;
    for (i = start; i < RARITY_RANK.length; i++) {
      if (hasRarity(list, RARITY_RANK[i])) return RARITY_RANK[i];
    }
    return lowestRarity(list);
  }

  function ssrRate(pity) {
    if (pity + 1 >= RATES.pitySSR) return 1;
    if (pity + 1 < RATES.softPity) return RATES.SSR;
    var span = RATES.pitySSR - RATES.softPity;
    var step = (pity + 1 - RATES.softPity) / span;
    return Math.min(1, RATES.SSR + step * (1 - RATES.SSR));
  }

  function rollWant(ops, rng) {
    if (ops.pity + 1 >= RATES.pitySSR) return "SSR";
    if (ops.pitySR + 1 >= RATES.pitySR) return "SR";
    var ssr = ssrRate(ops.pity);
    var roll = rng();
    if (roll < ssr) return "SSR";
    if (roll < ssr + RATES.SR) return "SR";
    if (roll < ssr + RATES.SR + RATES.R) return "R";
    return "N";
  }

  function poolState(ops, pool) {
    if (pool === "fashion") return ops.fashion;
    if (pool === "weapon") return ops.weapon;
    return ops;
  }

  function applyPull(ops, rng, list, shardHost) {
    var want = rollWant(ops, rng);
    var rarity = downgradeRarity(want, list);
    var card = pickOfRarity(rarity, rng, list, ops.owned, want);
    if (!card) return null;
    ops.pity += 1;
    ops.pitySR += 1;
    if (card.r === "SSR" || want === "SSR") {
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
    return { id: card.id, r: card.r, n: card.n, pity: ops.pity, isNew: prev === 0, kind: card.kind || "", legend: !!card.legend };
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
      jobCards: JOB_CARDS.map(function (card) {
        return { id: card.id, n: card.n, r: card.r, kind: "job", school: card.school, count: ops.owned[card.id] || 0 };
      }),
      jobOwned: ownedCount(ops, JOB_CARDS),
      fusionCards: FUSION_CARDS.map(function (card) {
        return { id: card.id, n: card.n, r: card.r, kind: "fusion", pair: (card.pair || []).slice(), count: ops.owned[card.id] || 0 };
      }),
      fusionOwned: ownedCount(ops, FUSION_CARDS),
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
    JOB_CARDS.forEach(function (card) {
      if ((owned[card.id] || 0) < 1) return;
      if (card.dmg) player.dmg = (player.dmg || 0) * (1 + card.dmg);
    });
    var fashion = shop.ops.fashion || {};
    var fcard = cardOf(fashion.equipped);
    if (fcard && (fashion.owned[fcard.id] || 0) > 0) {
      var fmul = fcard.legend || fcard.r === "SSR" ? 0.08 : fcard.r === "SR" ? 0.04 : fcard.r === "R" ? 0.02 : 0.01;
      player.dmg = (player.dmg || 0) * (1 + fmul);
    }
    var weapon = shop.ops.weapon || {};
    var wcard = cardOf(weapon.equipped);
    if (wcard && (weapon.owned[wcard.id] || 0) > 0) {
      var wmul = wcard.legend || wcard.r === "SSR" ? 0.14 : wcard.r === "SR" ? 0.08 : wcard.r === "R" ? 0.04 : 0.02;
      if (wcard.face && wcard.face !== cid && !wcard.any) wmul *= 0.5;
      player.dmg = (player.dmg || 0) * (1 + wmul);
    }
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
    save.shop40.ops.rosterTab = ROSTER_TABS.indexOf(tab) >= 0 || tab === "chronicle" ? tab : "scrap";
    return save.shop40.ops.rosterTab;
  }

  function spark(save, poolId, cardId) {
    if (!save || typeof save !== "object") return { ok: false, reason: "save" };
    save.shop40 = normalizeOps(save.shop40 || {});
    var pool = poolId || save.shop40.ops.pool || "remnant";
    if (POOL_IDS.indexOf(pool) < 0) pool = "remnant";
    var list = cardsForPool(pool);
    var card = null;
    list.forEach(function (item) { if (item.id === cardId) card = item; });
    if (!card) return { ok: false, reason: "card", pool: pool };
    if (card.kind === "scrap") return { ok: false, reason: "scrap", pool: pool };
    if (!card.legend && card.r !== "SSR") return { ok: false, reason: "rarity", pool: pool };
    var state = poolState(save.shop40.ops, pool);
    var shardHost = pool === "remnant" ? save.shop40.ops : state;
    if ((shardHost.shards || 0) < RATES.spark) return { ok: false, reason: "shards", pool: pool, shards: shardHost.shards || 0 };
    if ((state.owned[card.id] || 0) > 0) return { ok: false, reason: "owned", pool: pool };
    state.owned[card.id] = 1;
    shardHost.shards = clampInt((shardHost.shards || 0) - RATES.spark, 0, 999999);
    return { ok: true, id: card.id, n: card.n, r: card.r, legend: !!card.legend, pool: pool, shards: shardHost.shards };
  }

  function equip(save, poolId, cardId) {
    if (!save || typeof save !== "object") return { ok: false, reason: "save" };
    save.shop40 = normalizeOps(save.shop40 || {});
    var pool = poolId === "weapon" ? "weapon" : "fashion";
    var state = poolState(save.shop40.ops, pool);
    if (cardId) {
      if ((state.owned[cardId] || 0) < 1) return { ok: false, reason: "owned", pool: pool };
      var card = cardOf(cardId);
      if (!card || card.kind !== pool) return { ok: false, reason: "card", pool: pool };
    }
    state.equipped = cardId || "";
    return { ok: true, pool: pool, equipped: state.equipped };
  }

  function rarityLabel(r, legend) {
    if (legend || r === "LEGEND") return "传说";
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
      "</small></button></div>" +
      sparkRow(pool, state, shards) +
      "</div></div>";
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
    var sparks = host.querySelectorAll("[data-spark]");
    for (var s = 0; s < sparks.length; s++) {
      sparks[s].onclick = function () {
        var id = this.getAttribute("data-spark");
        if (handlers && typeof handlers.spark === "function") handlers.spark(id);
        else {
          spark(save, pool, id);
          renderGacha(host, save, handlers);
        }
      };
    }
    return info;
  }

  function sparkRow(pool, state, shards) {
    var missing = cardsForPool(pool).filter(function (card) {
      return (card.legend || card.r === "SSR") && card.kind !== "scrap" && (state.owned[card.id] || 0) < 1;
    });
    if (!missing.length) return "";
    var poor = (shards || 0) < RATES.spark;
    return (
      '<div class="wishSpark46">' +
      missing
        .map(function (card) {
          return (
            '<button type="button" data-spark="' +
            card.id +
            '"' +
            (poor ? ' class="poor"' : "") +
            ">Spark " +
            card.n +
            "</button>"
          );
        })
        .join("") +
      "</div>"
    );
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

  function showRosterPeek(card, locked, count, handlers, tab) {
    if (!global.document) return;
    var drawer = global.document.getElementById("rosterDrawer");
    if (!drawer) return;
    closeRosterPeek();
    var overlay = global.document.createElement("div");
    overlay.id = "rosterPeek46";
    var canEquip = !locked && (tab === "fashion" || tab === "weapon");
    overlay.innerHTML =
      '<div class="rosterPeekCard46' +
      (locked ? " lock" : "") +
      '"><img data-art alt="" src="' +
      artSrc(handlers, locked ? "gacha/card_back.webp" : "gacha/" + card.id + ".webp") +
      '"><div><b>' +
      (locked ? "未回收" : card.n) +
      "</b><em>" +
      rarityLabel(card.r, card.legend) +
      (card.legend ? " · 传说" : "") +
      (locked ? "" : " · ×" + count) +
      "</em><p>" +
      (locked ? "尚未回收。寻访点亮后才会露出立绘。" : loreText(card)) +
      "</p>" +
      (canEquip ? '<button type="button" class="rosterEquip46" data-equip="' + card.id + '">装备</button>' : "") +
      "</div></div>";
    overlay.onclick = function () {
      closeRosterPeek();
    };
    var eq = overlay.querySelector("[data-equip]");
    if (eq) {
      eq.onclick = function (ev) {
        if (ev && ev.stopPropagation) ev.stopPropagation();
        if (handlers && typeof handlers.equip === "function") handlers.equip(tab, card.id);
        else equip(handlers && handlers.save, tab, card.id);
        closeRosterPeek();
      };
    }
    drawer.appendChild(overlay);
    hideBrokenArt(overlay);
  }

  function rosterList(tab) {
    if (tab === "school") return SCHOOL_CARDS;
    if (tab === "job") return JOB_CARDS;
    if (tab === "fusion") return FUSION_CARDS;
    if (tab === "fashion") return FASHION_CARDS;
    if (tab === "weapon") return WEAPON_CARDS;
    if (tab === "chronicle") return CHRONICLE;
    return CARDS;
  }

  function rosterOwned(info, tab) {
    if (tab === "fashion") return (info.fashion && info.fashion.owned) || {};
    if (tab === "weapon") return (info.weapon && info.weapon.owned) || {};
    return info.owned || {};
  }

  function renderRoster(host, save, handlers) {
    injectStyle();
    if (!host) return snapshot(save);
    var info = snapshot(save);
    var tab = info.rosterTab || "scrap";
    var list = rosterList(tab);
    var ownedMap = rosterOwned(info, tab);
    var got = 0;
    list.forEach(function (card) { if ((ownedMap[card.id] || 0) > 0) got += 1; });
    var wall = "";
    if (tab === "chronicle") {
      wall = '<div class="chronicleBox46"><h4>月城小夜 · 未写完的夜</h4>' + CHRONICLE.map(function (item) {
        return '<article class="chronicleCard46" data-chronicle="' + item.id + '"><b>' + item.n + "</b>" + item.lore.map(function (p) { return "<p>" + p + "</p>"; }).join("") + "</article>";
      }).join("") + "</div>";
    } else if (tab === "fusion" && !FUSION_CARDS.length) {
      wall = '<div class="rosterLater46">后续写入</div>';
    } else if (tab === "school" && !SCHOOL_CARDS.length) {
      wall = '<div class="rosterLater46">后续写入</div>';
    } else if (tab === "job" && !JOB_CARDS.length) {
      wall = '<div class="rosterLater46">后续写入</div>';
    } else {
      wall = list.map(function (card) {
        var count = ownedMap[card.id] || 0;
        var locked = count < 1 && DEFAULT_SHOWN.indexOf(card.id) < 0;
        var mark = card.legend ? "LEGEND" : card.r;
        return (
          '<button type="button" class="rosterSlot46 r-' +
          mark +
          (locked ? " lock" : "") +
          '" data-card="' +
          card.id +
          '"><div class="rosterArt46"><img data-art alt="" src="' +
          artSrc(handlers, locked ? "gacha/card_back.webp" : "gacha/" + card.id + ".webp") +
          '"><i>' +
          (card.legend ? "传说" : card.r) +
          "</i>" +
          (locked ? '<em class="rosterVeil46">未回收</em>' : "") +
          "</div><b>" +
          (locked ? "待寻访" : card.n) +
          "</b><small>" +
          (locked ? rarityLabel(card.r, card.legend) : "×" + count) +
          "</small></button>"
        );
      }).join("");
    }
    host.innerHTML =
      '<div class="rosterStage46"><div class="rosterHead46"><h3>镜界仓库</h3><span>' +
      (tab === "chronicle" ? "月城小夜 · 未写完的夜" : "已点亮 " + got + " / " + list.length) +
      "</span></div>" +
      '<div class="rosterTabs46" id="rosterTabs46">' +
      '<button type="button" data-roster="scrap"' + (tab === "scrap" ? ' class="on"' : "") + ">残件</button>" +
      '<button type="button" data-roster="school"' + (tab === "school" ? ' class="on"' : "") + ">基础</button>" +
      '<button type="button" data-roster="job"' + (tab === "job" ? ' class="on"' : "") + ">转职</button>" +
      '<button type="button" data-roster="fusion"' + (tab === "fusion" ? ' class="on"' : "") + ">融合</button>" +
      '<button type="button" data-roster="fashion"' + (tab === "fashion" ? ' class="on"' : "") + ">时装</button>" +
      '<button type="button" data-roster="weapon"' + (tab === "weapon" ? ' class="on"' : "") + ">武器</button>" +
      '<button type="button" data-roster="chronicle"' + (tab === "chronicle" ? ' class="on"' : "") + ">编年</button>" +
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
          var count = ownedMap[card.id] || 0;
          var locked = count < 1 && DEFAULT_SHOWN.indexOf(card.id) < 0;
          showRosterPeek(card, locked, count, handlers, tab);
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
    JOB_CARDS: JOB_CARDS,
    FUSION_CARDS: FUSION_CARDS,
    CHRONICLE: CHRONICLE,
    hasSchool: hasSchool,
    hasJob: hasJob,
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
    spark: spark,
    equip: equip,
    renderGacha: renderGacha,
    renderRoster: renderRoster,
    showReveal: showReveal,
    bindHeroTap: bindHeroTap,
    renderStageModes: renderStageModes,
    dressArchive: dressArchive,
    cardOf: cardOf,
    downgradeRarity: downgradeRarity,
    cheatToast: CHEAT_TOAST,
  };
})(typeof window !== "undefined" ? window : globalThis);
