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
  var SCHOOL_LABEL = Object.freeze({ mech: "机械师", gun: "枪斗术", alch: "炼金术", gene: "基因战士", vamp: "血族", spore: "菌群术", magical: "魔法少女", cult: "修仙", mage: "魔法师", shrine: "巫女", summon: "召唤师", ninja: "忍者", idol: "战场歌姬", necro: "死灵术士" });
  var ROSTER_TABS = Object.freeze(["scrap", "school", "job", "fusion", "fashion", "weapon"]);
  var RARITY_RANK = Object.freeze(["SSR", "SR", "R", "N"]);

  var CARDS = Object.freeze([
    { id: "sayo_echo", n: "小夜·镜中残影", r: "R", kind: "scrap", tag: "残件", d: "半张立绘还卡在裂镜里。仅供名册收藏。", lore: ["我是卡在镜里的那一半。灵枢观里走着的小夜可能是备份，我才是三年前实验里先碎的那张脸。", "每次有人摸到镜核，我都会被重新对焦一次。步枪还在，樱花还在，名字却越来越薄。", "镜面先裂，立绘后裂。我伸出手去够外面的她，只够到自己的倒影。", "半张脸还在笑。另外半张，已经不属于任何人。"] },
    { id: "aya_petal", n: "绫·花瓣残件", r: "R", kind: "scrap", tag: "残件", d: "居合前落下的花瓣。仅供名册收藏。", lore: ["我是居合前掉下来的那一片。零号企业拆人格的时候，把「犹豫」单独装进这片花里。", "手枪先响，太刀后出。花瓣总是抢在刀光前面落地，像在提醒我：再快一点。", "弹打空的那个呼吸，刀还在鞘里。花已经谢了，人还站着，像没接到自己的指令。", "花瓣盖住准星。我看不见她，她也没回头。"] },
    { id: "rion_edge", n: "凛音·刀光残件", r: "R", kind: "scrap", tag: "残件", d: "黄泉流未署名的一页刀光。仅供名册收藏。", lore: ["我是黄泉流没来得及署名的一页。黑羽家谱把活着的凛音写在正面，把我写在刀背上。", "剑冢里每把剑都认识我。我走过那些失败的小夜，没有对任何一把刀鞠躬。", "刀光先到，名字后到。折断的不是刃，是那句「我会回来」。", "刀还在响。署名栏是空的。"] },
    { id: "night_radio", n: "夜话电台残件", r: "R", kind: "scrap", tag: "残件", d: "吐槽电台还在响。仅供名册收藏。", lore: ["我不是人。我是小夜死过以后，还在播的那台夜话。吐槽还在，主播已经换过好几版备份。", "从灵枢观到剑冢，频率没变。谁路过都听得见冷笑话，听不见心跳。", "电台以为自己还在救人。其实只是把失败循环到下一小时。", "电流沙沙响。报时之后，没有下一位来宾。"] },
    { id: "shrine_seal", n: "灵枢观封条残件", r: "R", kind: "scrap", tag: "残件", d: "全息牌楼下揭下的封条影。仅供名册收藏。", lore: ["我是从全息牌楼上揭下来的一道封。写着小夜的名字，墨却先于人干透。", "灵枢观拿我挡镜核，炼金台拿我当坩埚盖。谁都需要一张能骗人的纸。", "符纸烧完了，镜核还在转。名字被火吃掉，裂口比以前更亮。", "灰落在石阶上。下一张封条已经写好，还是同一个字。"] },
    { id: "void_ticket", n: "主神作废券", r: "R", kind: "scrap", tag: "残件", d: "虚空圣所的作废回收券。仅供名册收藏。", lore: ["我是一张已经作废的回收券。主神空间发过我，又当众盖了戳：此路不算数。", "绫把我捏在指缝里进过圣所。小夜把我夹进档案。谁都以为这是通行证。", "盖戳的不是敌人，是规则本身。券面还亮着，门已经从里面锁死。", "作废两个字比金箔更清楚。没有退款。"] },
    { id: "cherry_crown", n: "樱冠残片", r: "R", kind: "scrap", tag: "残件", d: "镜界冠冕裂开后的一片。仅供名册收藏。", lore: ["我是镜界冠冕裂开后的一片。曾经想把小夜加成完整的那一夜，只加成了碎片。", "戴上会发光，摘下会出血。魔法少女那条线最爱我，也最先被我划伤额头。", "冠还亮着，变身只走到一半。花瓣向上飞，人往下坠。", "金边还烫。头已经空了。"] },
    { id: "last_witness", n: "碎镜后的人", r: "R", kind: "scrap", tag: "残件", d: "碎镜后面那个人不是三女之一。仅供名册收藏。", lore: ["他不是小夜，不是绫，也不是凛音。碎镜后面只站着一个还肯作证的人。", "他看着三年前的实验收场，看着备份醒来，看着剑冢一把一把插满。他没有伸手。", "证人活得比主角久。这不是胜利，是他没有被写成卡的资格。", "他仍站在镜后。下一次有人醒来，他还是那张脸。"] },
  ]);

  var FASHION_CARDS = Object.freeze([
    { id: "fashion_sayo_plain", n: "未归·常服小夜", r: "N", kind: "fashion", face: "sayo", d: "还没写成夜的那身常服。", lore: ["我是还没被写成夜的那一身常服小夜。", "我穿着这件白外套走过灵枢观石阶，步枪比名字更旧。", "常服最容易被路人当成还活着的备份，袖口却先起了线。", "线头比夜更早承认，这件衣服已经没有下一夜。"] },
    { id: "fashion_sayo_neon", n: "未归·霓虹小夜", r: "R", kind: "fashion", face: "sayo", d: "灯比人先亮。", lore: ["霓虹先认出我，人群一次都没有回头。", "电台在湿地上响着，粉色灯光把伤口照得很清楚。", "灯比人先亮，也比人先把失败写到脸上。", "灯灭的时候我还站在街上，没有人来交接。"] },
    { id: "fashion_sayo_night", n: "未归·夜巡小夜", r: "SR", kind: "fashion", face: "sayo", school: "shrine", d: "夜巡没有终点。", lore: ["我沿着红色全息牌楼走完一整夜巡，没有下一班。", "口袋里的冠碎片发烫，像提醒我这班不该结束。", "石阶上没有交接的人，只有灯笼还在烧。", "月亮先下班离开，夜巡就停在空着的全息牌楼下。"] },
    { id: "fashion_aya_suit", n: "未归·制服绫", r: "N", kind: "fashion", face: "aya", d: "企业还承认这套制服。", lore: ["这套制服比我更像零号企业承认的绫。", "蓝领带是唯一没被拆走的零件，工牌已经作废。", "手枪藏在文件袋里，太刀还挂在腰侧等指令。", "工牌盖了戳以后，走廊里的门也不再为我开。"] },
    { id: "fashion_aya_coat", n: "未归·风衣绫", r: "R", kind: "fashion", face: "aya", d: "风衣盖不住作废券。", lore: ["风衣够长，还是盖不住券上那枚作废的戳。", "夜风比刀快，我把通行证揣进已经失效的内袋。", "枪口朝下贴在腰边，太刀没来得及出鞘。", "门从里面锁死，风衣只留下被吹开的下摆。"] },
    { id: "fashion_aya_veil", n: "未归·面纱绫", r: "SR", kind: "fashion", face: "aya", school: "gun", d: "面纱遮不住准星。", lore: ["这层面纱是给葬礼准备的，不是给活人遮脸。", "我从纱后看见准星，花瓣粘在纱上像没擦干净的妆。", "揭开面纱也没有另一张脸，还是被拆开的绫。", "葬礼散场以后，纱比准星更先落下。"] },
    { id: "fashion_rion_keiko", n: "未归·稽古凛音", r: "N", kind: "fashion", face: "rion", d: "木刀也要鞠躬。", lore: ["稽古场只剩下我一个人，木刀比家谱更诚实。", "我还是先鞠躬再出招，像还有人会喊停。", "道服洗得很白，对手的位置一直空着。", "没有人喊停，鞠躬就停在空掉的木地板上。"] },
    { id: "fashion_rion_haori", n: "未归·羽织凛音", r: "R", kind: "fashion", face: "rion", d: "羽织盖住未署名的刀。", lore: ["这件羽织是黑羽家没写完的夜，家纹比心跳清楚。", "我把刀光藏进宽袖里，只露出还没署名的柄。", "袖口那行没写完的名，比刃更先露出线头。", "夜风掀开下摆，署名栏仍是空的。"] },
    { id: "fashion_rion_bloom", n: "未归·花葬凛音", r: "SR", kind: "fashion", face: "rion", school: "cult", d: "花开在剑冢上。", lore: ["这些花不是开给活人的，我把它们放在折断的飞剑旁。", "红比黑先谢，剑冢比宾客更早坐满。", "我在坟前站到花谢，没有人来接这一束。", "没有宾客，花葬只剩我自己和那些折剑。"] },
    { id: "fashion_sayo_crown", n: "终夜樱冠", r: "SSR", kind: "fashion", face: "sayo", school: "shrine", legend: true, d: "冠亮着，夜已经结束。", lore: ["这是最后一顶还给小夜的冠。", "金边裂开以后还在发光。", "我把它戴上，像把失败戴正。", "冠比头骨更持久，夜已经结束。"] },
    { id: "fashion_aya_funeral", n: "零号葬仪", r: "SSR", kind: "fashion", face: "aya", school: "gun", legend: true, d: "企业为零件举行葬礼。", lore: ["零号企业给拆开的人格开葬仪。", "白花不是安慰，是清单。", "我穿着黑大衣去领自己的那一份。", "没有遗像，只剩下工号。"] },
    { id: "fashion_rion_bride", n: "黄泉花嫁", r: "SSR", kind: "fashion", face: "rion", school: "cult", legend: true, d: "嫁妆是一把葬刀。", lore: ["黄泉不收活人的聘礼。", "红盖头下面还是凛音。", "葬刀比誓词更早落地。", "没有人赶来掀开盖头。"] },
    { id: "shop_sayo_techcoat", n: "霓虹战术风衣·小夜", r: "R", kind: "fashion", face: "sayo", school: "mech", d: "常服立绘。局内仍穿 Q 版战术风衣。", lore: ["小夜把霓虹战术风衣披在步枪外面，线路比樱花更先亮。", "冷光顺着袖口走到枪管，夜巡还没有人来交接。", "这身衣服让机械师和枪斗术更常出现，本身不加伤害。", "卡面上是常服的她，局里的小人仍是原来的样子。"] },
    { id: "shop_aya_techcoat", n: "霓虹战术风衣·绫", r: "R", kind: "fashion", face: "aya", school: "mech", d: "常服立绘。局内仍穿 Q 版战术风衣。", lore: ["绫把风衣扣到枪套上面，蓝丝带仍别在银发里。", "霓虹先照见准星，太刀还安静地挂在腰侧。", "机械师和枪斗术因此更常出现，衣服不改弹道。", "卡池里是这身常服，战斗里仍用原来的 Q 版。"] },
    { id: "shop_rion_techcoat", n: "霓虹战术风衣·凛音", r: "R", kind: "fashion", face: "rion", school: "mech", d: "常服立绘。局内仍穿 Q 版战术风衣。", lore: ["凛音让风衣盖住刀鞘，红绳仍系在黑发上。", "霓虹映在刀镡上，她没有因此把刀拔出来。", "机械师和枪斗术更常被写进选项，刃本身不变。", "这张卡是常服，局里出战的仍是原来的 Q 版。"] },
    { id: "shop_sayo_biodress", n: "绯血生体礼服·小夜", r: "R", kind: "fashion", face: "sayo", school: "gene", d: "常服立绘。局内仍穿 Q 版生体礼服。", lore: ["小夜穿着绯血生体礼服，步枪仍横在身前。", "礼服上的脉络比伤口更亮，花瓣粘在裙摆上。", "基因、血族和菌群术因此更常出现，礼服不吸血。", "卡面是常服立绘，战斗小人保持原来的 Q 版。"] },
    { id: "shop_aya_biodress", n: "绯血生体礼服·绫", r: "R", kind: "fashion", face: "aya", school: "gene", d: "常服立绘。局内仍穿 Q 版生体礼服。", lore: ["绫把生体礼服穿在制服外面，手枪没有离手。", "绯红脉络沿着腰封走到太刀的鞘口。", "基因战士、血族和菌群术更常出现在三选一里。", "寻访看到的是常服，局内造型仍是 Q 版。"] },
    { id: "shop_rion_biodress", n: "绯血生体礼服·凛音", r: "R", kind: "fashion", face: "rion", school: "gene", d: "常服立绘。局内仍穿 Q 版生体礼服。", lore: ["凛音让礼服的下摆避开刀刃，红绳没有换成别的颜色。", "生体纹路亮着，剑还在鞘里等她自己决定。", "基因、血族和菌群术的选项因此更常被写出来。", "这张卡只收录常服，出战仍用原来的 Q 版。"] },
    { id: "shop_sayo_psirobe", n: "星辉灵能裙装·小夜", r: "R", kind: "fashion", face: "sayo", school: "magical", d: "常服立绘。局内仍穿 Q 版灵能裙。", lore: ["小夜穿着星辉灵能裙，步枪上仍沾着樱花。", "裙摆的星光比枪口的火更安静，夜空因此近了一点。", "魔法少女、魔法师和巫女更常出现，裙子不施法。", "卡池收的是常服，游戏里用的是原来的 Q 版。"] },
    { id: "shop_aya_psirobe", n: "星辉灵能裙装·绫", r: "R", kind: "fashion", face: "aya", school: "magical", d: "常服立绘。局内仍穿 Q 版灵能裙。", lore: ["绫把灵能裙穿得像另一套制服，蓝眼睛仍看着准星。", "星辉落在太刀鞘上，她没有把刀当成法杖。", "魔法少女、魔法师与巫女的路线因此更常被抽到。", "寻访卡是常服画风，战斗贴图仍是 Q 版。"] },
    { id: "shop_rion_psirobe", n: "星辉灵能裙装·凛音", r: "R", kind: "fashion", face: "rion", school: "magical", d: "常服立绘。局内仍穿 Q 版灵能裙。", lore: ["凛音让星辉裙盖住刀鞘，红眼在星光里没有变色。", "裙摆亮着，她仍先看剑，再看天空。", "魔法少女、魔法师和巫女因此更容易出现。", "这张卡是常服，局内小人没有换成写实比例。"] },
    { id: "shop_sayo_idol", n: "末日舞台演出服·小夜", r: "R", kind: "fashion", face: "sayo", school: "idol", d: "常服立绘。局内仍穿 Q 版演出服。", lore: ["小夜站上末日舞台，步枪被灯照得像话筒架。", "演出服的亮片比樱花更吵，她仍把枪口放低。", "战场歌姬、魔法少女和枪斗术更常出现。", "卡面是舞台上的常服，战斗里仍是 Q 版。"] },
    { id: "shop_aya_idol", n: "末日舞台演出服·绫", r: "R", kind: "fashion", face: "aya", school: "idol", d: "常服立绘。局内仍穿 Q 版演出服。", lore: ["绫把演出服穿得一丝不苟，手枪藏在披风内侧。", "舞台灯先找到蓝丝带，太刀在聚光外保持安静。", "歌姬、魔法少女和枪斗术的选项因此更常出现。", "寻访展示常服，出战模型仍用原来的 Q 版。"] },
    { id: "shop_rion_idol", n: "末日舞台演出服·凛音", r: "R", kind: "fashion", face: "rion", school: "idol", d: "常服立绘。局内仍穿 Q 版演出服。", lore: ["凛音穿着演出服走上残破舞台，刀鞘比话筒更长。", "聚光灯打在红绳上，她没有对空座位鞠躬。", "战场歌姬、魔法少女和枪斗术更常被写进升级。", "这张卡收录常服，游戏战斗仍使用 Q 版。"] },
    { id: "shop_sayo_apron", n: "炼金防污围裙·小夜", r: "R", kind: "fashion", face: "sayo", school: "alch", d: "常服立绘。局内仍穿 Q 版围裙。", lore: ["小夜把炼金围裙系在步枪背带外面，口袋里满是试剂。", "围裙声称防污，樱花和火药仍一起沾在下摆。", "炼金术和菌群术因此更常出现，围裙不保证干净。", "卡池是常服立绘，局里的她仍是原来的 Q 版。"] },
    { id: "shop_aya_apron", n: "炼金防污围裙·绫", r: "R", kind: "fashion", face: "aya", school: "alch", d: "常服立绘。局内仍穿 Q 版围裙。", lore: ["绫把围裙穿成实验记录的一部分，手枪放在台面边缘。", "试剂瓶比工牌更诚实，太刀靠在实验桌旁。", "炼金术与菌群术的路线因此更常被选中。", "寻访卡画的是常服，战斗贴图保持 Q 版。"] },
    { id: "shop_rion_apron", n: "炼金防污围裙·凛音", r: "R", kind: "fashion", face: "rion", school: "alch", d: "常服立绘。局内仍穿 Q 版围裙。", lore: ["凛音系上炼金围裙，刀仍横在身前，没有换成搅拌棒。", "污渍先落在红绳上，她把瓶子推到刀够不着的地方。", "炼金术和菌群术更常出现，刀的数值没有变。", "这张卡是常服，出战时仍穿原来的 Q 版围裙。"] },
    { id: "shop_sayo_summon", n: "百鬼召唤睡衣·小夜", r: "R", kind: "fashion", face: "sayo", school: "summon", d: "常服立绘。局内仍穿 Q 版睡衣。", lore: ["小夜穿着百鬼召唤睡衣，步枪横在松垮的袖子外面。", "符纸贴在枪托上，鬼火比樱花更先围过来。", "召唤师和死灵术士因此更常出现在升级里。", "卡面是常服的她，战斗小人仍是 Q 版。"] },
    { id: "shop_aya_summon", n: "百鬼召唤睡衣·绫", r: "R", kind: "fashion", face: "aya", school: "summon", d: "常服立绘。局内仍穿 Q 版睡衣。", lore: ["绫把睡衣的带子系紧，手枪没有放进枕头底下。", "符纸沿着太刀鞘排开，她仍像在值夜班。", "召唤师与死灵术士的选项因此更常被看见。", "寻访用常服画风，局内继续用原来的 Q 版。"] },
    { id: "shop_rion_summon", n: "百鬼召唤睡衣·凛音", r: "R", kind: "fashion", face: "rion", school: "summon", d: "常服立绘。局内仍穿 Q 版睡衣。", lore: ["凛音穿着召唤睡衣站在符阵里，刀鞘比睡袍更直。", "百鬼先看红绳，再看她有没有把刀拔出来。", "召唤师和死灵术士因此更容易出现。", "这张卡只是常服，游戏里的造型仍是 Q 版。"] },
    { id: "shop_sayo_haori", n: "剑道部夜羽织·小夜", r: "SR", kind: "fashion", face: "sayo", school: "cult", d: "常服立绘。局内仍穿 Q 版羽织。", lore: ["小夜把剑道部的夜羽织披在步枪上，袖口宽得能藏下一发。", "羽织的家纹比樱花安静，她没有因此换成刀。", "修仙和忍者的选项因此更常出现，枪仍是枪。", "卡池收录这身常服，战斗里还是原来的 Q 版。"] },
    { id: "shop_aya_haori", n: "剑道部夜羽织·绫", r: "SR", kind: "fashion", face: "aya", school: "cult", d: "常服立绘。局内仍穿 Q 版羽织。", lore: ["绫穿着夜羽织，手枪收在宽袖里，太刀露在外面。", "剑道部的夜色比企业走廊更黑，蓝丝带仍清晰。", "修仙与忍者因此更常被写进三选一。", "寻访看到常服，出战贴图保持 Q 版羽织。"] },
    { id: "shop_rion_haori", n: "剑道部夜羽织·凛音", r: "SR", kind: "fashion", face: "rion", school: "cult", d: "常服立绘。局内仍穿 Q 版羽织。", lore: ["凛音把夜羽织穿在刀鞘外面，红绳和羽织是同一种夜。", "宽袖盖住握刀的手，她仍先确认刀在鞘中。", "修仙和忍者的路线因此更常出现。", "这张卡是常服立绘，局里用的是原来的 Q 版。"] },
    { id: "shop_sayo_festival", n: "镜夜灯会巫女服·小夜", r: "SR", kind: "fashion", face: "sayo", school: "shrine", d: "常服立绘。局内仍穿 Q 版巫女服。", lore: ["小夜穿着镜夜灯会的巫女服，步枪横过红白的衣带。", "灯笼比月亮更近，花簪仍插在长发上。", "巫女、魔法少女和修仙因此更常出现。", "卡池里是灯会常服，战斗小人仍是原来的 Q 版。"] },
    { id: "shop_aya_festival", n: "镜夜灯会巫女服·绫", r: "SR", kind: "fashion", face: "aya", school: "shrine", d: "常服立绘。局内仍穿 Q 版巫女服。", lore: ["绫把巫女服穿得像另一套制服，手枪贴在袖中。", "灯会的红白衣带绑住太刀，蓝丝带没有摘下。", "巫女、魔法少女与修仙的选项因此更常出现。", "寻访展示常服画风，游戏里继续用 Q 版。"] },
    { id: "shop_rion_festival", n: "镜夜灯会巫女服·凛音", r: "SR", kind: "fashion", face: "rion", school: "shrine", d: "常服立绘。局内仍穿 Q 版巫女服。", lore: ["凛音穿着灯会巫女服，刀鞘从红白下摆里露出来。", "灯笼照见红绳，她没有把祭典当成收刀的理由。", "巫女、魔法少女和修仙因此更容易出现。", "这张卡是常服，出战仍是原来的 Q 版巫女。"] },
  ]);
  var WEAPON_CARDS = Object.freeze([
    { id: "weapon_sayo_spare", n: "备用夜樱弹", r: "N", kind: "weapon", face: "sayo", d: "备用弹也不够打穿镜核。", lore: ["备用弹匣侧面只印着夜樱，名字已经薄了。", "我一匣一匣数过，还是不够打穿镜核。", "空仓响了一下，最后一发留给没回来的人。", "备用弹也用尽以后，步枪比我更先承认结束。"] },
    { id: "weapon_sayo_petal", n: "花瓣弹匣", r: "R", kind: "weapon", face: "sayo", d: "花比子弹先落地。", lore: ["弹匣里先落下花瓣，子弹一颗都没有跟上。", "我还是把花推进膛里，像它们会飞向镜核。", "花瓣盖住准星，空仓只回了一声轻响。", "花比子弹先落地，这一夜没有打出去的弹。"] },
    { id: "weapon_aya_side", n: "侧持短铳", r: "N", kind: "weapon", face: "aya", d: "侧持是为了留出拔刀的手。", lore: ["短铳贴在右侧，是为了给太刀留出那只手。", "左侧刀还在鞘里，这一次居合没有接到指令。", "铳先打空，刀柄还是温的，人已经来不及。", "侧持结束以后，只剩空弹壳和没出鞘的刀。"] },
    { id: "weapon_aya_twin", n: "双持月切", r: "R", kind: "weapon", face: "aya", d: "两把都来不及。", lore: ["我试过两把一起，准星和刀锋互相抢同一口气。", "花瓣落在两只手上，像提醒两边都慢了。", "枪口朝下还在冒烟，刀只抽出半寸就停住。", "都没砍到该砍的人，双持比单持更先空掉。"] },
    { id: "weapon_rion_wood", n: "无铭木刀", r: "N", kind: "weapon", face: "rion", d: "木刀也会折。", lore: ["这把木刀没有署名，稽古场的夜比它更长。", "它先于飞剑折成两截，木屑比血更轻。", "我跪着看那道裂口，家谱上也没有它的名字。", "无铭的木刀断了，下一把飞剑也不会署名。"] },
    { id: "weapon_rion_under", n: "鞘中黑羽", r: "R", kind: "weapon", face: "rion", d: "刀还在鞘里。", lore: ["黑羽藏在鞘中，我以为不出刃就能少折一把。", "鞘先裂开，里面是空的，刀光没有回来。", "红绳还绑着裂口，像要把空鞘假装成完整的刀。", "不出刃的那一夜，鞘比刃更先成为坟。"] },
    { id: "weapon_mirror_round", n: "圆镜盾刃", r: "SR", kind: "weapon", face: "aya", any: true, d: "圆镜能挡一次。", lore: ["这面圆镜不是给谁单独用的，它照过三张都不全的脸。", "我把它举起来挡了一次，镜面立刻裂到圆心。", "裂片还亮着，却再也拼不出任何一张完整的脸。", "挡完就裂，圆镜只够给下一个人留下碎片。"] },
    { id: "weapon_shard_blade", n: "裂镜片刃", r: "SR", kind: "weapon", face: "sayo", any: true, d: "片刃从镜里长出来。", lore: ["这把刀没有锻造，它是镜碎以后自己站起来的。", "谁拿都会被薄刃轻轻划到，包括还活着的备份。", "步枪背在身后没用，片刃比人更先指向镜核。", "刃比人薄，握住它的手也会变成下一片裂镜。"] },
    { id: "weapon_radio_bat", n: "电台短棍", r: "SR", kind: "weapon", face: "sayo", any: true, d: "还在播的那根天线。", lore: ["电台被拧下来当短棍，天线还在抖那句夜话。", "电流还在笑，打到的人听得见已经换过的主播。", "步枪背着没用，我只能挥这台还在播的旧机器。", "电池先死，短棍就不响了，街上空下一句报时。"] },
    { id: "weapon_sayo_final", n: "夜樱终弹", r: "SSR", kind: "weapon", face: "sayo", legend: true, d: "只剩最后一发。", lore: ["终弹是专门写给小夜的。", "步枪比人更知道这是最后一次。", "樱花开在已经空掉的仓上。", "打出去就没有下一夜。"] },
    { id: "weapon_aya_mirror", n: "月切·镜反", r: "SSR", kind: "weapon", face: "aya", legend: true, d: "刀刃是碎掉的镜子。", lore: ["月切反的是镜，不是月。", "我从刃里看见自己出鞘太慢。", "手枪还留在另一只手里。", "反打出去的只是空弹壳。"] },
    { id: "weapon_rion_burial", n: "黑羽葬", r: "SSR", kind: "weapon", face: "rion", legend: true, d: "这把刀是墓碑。", lore: ["黑羽葬插在剑冢最深处。", "它比飞剑更像写完的结局。", "我握住它，像握住自己的坟。", "坟前没有人赶来上香。"] },
  ]);
  var CHRONICLE = Object.freeze([
    { id: "ch_zero_death", n: "第零次死亡", lore: ["三年前我就死在镜界实验里。灵枢观扫地的那个人，可能只是备份。", "他们把我的名字写回名册，像把打翻的水倒回杯里。水已经不是原来那杯。", "我记得冷，记得镜核亮起来，不记得谁把我从名册上擦掉。", "如果现在的我是备份，那第一夜的我，还欠一句再见。"] },
    { id: "ch_hundred_eyes", n: "百目共视", lore: ["百目不是监视器。是很多双已经死过的眼睛，叠在同一副眼眶里。", "每次有人走进镜核，那些眼睛就替我再看一次。看到的都是同一条死路。", "绫说企业管这叫采集。凛音说黄泉流早写过。我只觉得眼睛不够用。", "共视结束的时候，没有人眨眼。"] },
    { id: "ch_zero_corp", n: "零号企业", lore: ["绫的企业不生产枪，生产可替换的人。我是被拆借过的零件之一。", "他们把「会怕」单独装进一间实验室，把「还会回来」装进另一间。", "巫女那一夜不是这条线。这条线没有符，只有工号和作废券。", "拆完以后，他们说还可以再组装一个小夜。价格另议。"] },
    { id: "ch_sword_mound", n: "失败者剑冢", lore: ["剑冢里每一把剑都是一条没走到核心的我。所有小夜都来过，没人留下脚印。", "我数过，数到后来不敢数。刀柄上的名字有的是我，有的快要不是。", "凛音从旁边走过，没有鞠躬。她认得这些刀，比我更认得。", "核心还在最里面。我们都走到过门口，门上没有锁，只有上一夜的我。"] },
    { id: "ch_after_zero", n: "镜零之后", lore: ["镜零是失败的小夜训练出来的。训练的不是胜利，是怎么把下一夜送回去。", "碎镜以后又醒来一个我。她问这是第几次。我没有数字可以给她。", "电台还在播，封条还在写同一个字。备份和原件已经吵不清楚。", "如果还有下一夜，让她别再把我写成一张完整的卡。"] },
  ]);
  var SCHOOL_CARDS = Object.freeze([
    { id: "school_shrine", n: "未归·巫女小夜", r: "SR", kind: "school", tag: "基础", school: "shrine", face: "sayo", d: "符没封住镜核。拥有即巫女倾向 ×1.3。", lore: ["我是灵枢观那一夜的小夜。符纸写着我的名字，镜核比名字先亮。", "我把封条一层层贴上步枪，贴上全息牌楼，贴上自己的袖口。外面的备份还在扫地。", "符烧完了，镜核还在转。裂口从镜里爬到我肩上，朱砂写成失败。", "我仍举着枪。封条先落地。"] },
    { id: "school_idol", n: "未归·歌姬小夜", r: "R", kind: "school", tag: "基础", school: "idol", face: "sayo", d: "电台还在响人已不在。拥有即歌姬倾向 ×1.3。", lore: ["我是被推进舞台的那一版小夜。观众席是空的，只有电台还在报时。", "歌比子弹先出门。我把步枪靠在脚边，对着没有人的灯光把词唱完。", "声带还在，人已经不在频率上。电台替我鞠躬，我跪在花瓣里。", "下一首歌自动连播。没有返场。"] },
    { id: "school_magical", n: "未归·魔法少女小夜", r: "R", kind: "school", tag: "基础", school: "magical", face: "sayo", d: "冠亮着变身没转好。拥有即魔法少女倾向 ×1.3。", lore: ["我是想把完整的一夜戴在头上的小夜。冠比我先发光。", "变身只走到一只手套。其余的我还是灵枢观那件外套，步枪没有变成权杖。", "冠还亮，身体没转完。花瓣往上飞，我往下坠，妆裂在眼角。", "金边还烫。咒语停在一半。"] },
    { id: "school_mech", n: "未归·机械师小夜", r: "R", kind: "school", tag: "基础", school: "mech", face: "sayo", d: "无人机先死步枪还在。拥有即机械师倾向 ×1.3。", lore: ["我是把无人机当姐姐的那一版。它先看见镜核，也先掉下来。", "油污和樱花一起沾在白外套上。我修它的镜头，比修自己的准星勤快。", "螺旋桨停转的时候，步枪还在我手里。火花比求救声响。", "屏幕黑了。我还握着没坏的那一边。"] },
    { id: "school_spore", n: "未归·菌群小夜", r: "R", kind: "school", tag: "基础", school: "spore", face: "sayo", d: "菌海不认主人。拥有即菌群倾向 ×1.3。", lore: ["我是把菌海认作姐妹的小夜。它们发光，却不听我的姓。", "孢子爬上步枪和脸颊，像另一层妆。我伸手，菌丝绕开我，去找更热的东西。", "菌海选择了镜核，没有选择主人。我变成它们路过的一截木头。", "蘑菇还亮。我的手是空的。"] },
    { id: "school_gun", n: "未归·枪斗绫", r: "SR", kind: "school", tag: "基础", school: "gun", face: "aya", d: "弹打空近身刀没来得及。拥有即枪斗倾向 ×1.3。", lore: ["我是零号企业最锋利的那条枪线。手枪是呼吸，太刀是没来得及说的话。", "我把弹匣数得很干净。花瓣总是提醒我再快一点，我偏要再稳一点。", "最后一发打空，刀还在鞘里。近身的爪子已经摸到领口。", "套筒后锁。刀柄是凉的。"] },
    { id: "school_mage", n: "未归·魔法师绫", r: "R", kind: "school", tag: "基础", school: "mage", face: "aya", d: "主神券作废。拥有即魔法师倾向 ×1.3。", lore: ["我是捏着通行证进圣所的绫。券是金的，门是假的。", "法阵画在水里，手枪还在腰上。我以为规则能被念咒改写。", "券面盖了作废。墨从掌心滴进法阵，法阵先死。", "VOID 两个字母比我的名字清楚。"] },
    { id: "school_alch", n: "未归·炼金绫", r: "R", kind: "school", tag: "基础", school: "alch", face: "aya", d: "封条当坩埚盖。拥有即炼金倾向 ×1.3。", lore: ["我是把灵枢观封条当瓶盖的绫。朱印能骗人，骗不了沸腾。", "手枪看守火候，太刀切开试剂。我把别人的名字熬成能喝的东西。", "盖子先着。封条在坩埚里烧成失败的味道，玻璃也裂了。", "药还在响。人已经不值得过滤。"] },
    { id: "school_ninja", n: "未归·忍者绫", r: "R", kind: "school", tag: "基础", school: "ninja", face: "aya", d: "影遁出界人没回来。拥有即忍者倾向 ×1.3。", lore: ["我是从镜缝里进出的那条影。外面的我负责开枪，里面的我负责消失。", "分身比本体勤快。我把太刀留给回来的那一格，手枪留给还在的这一格。", "影遁出了界。分身散掉，本体没有从裂镜对面走回来。", "残影还举着枪。人已经不在这一侧。"] },
    { id: "school_vamp", n: "未归·血族绫", r: "R", kind: "school", tag: "基础", school: "vamp", face: "aya", d: "最后一口吸空的是自己。拥有即血族倾向 ×1.3。", lore: ["我是把活下去做成饮品的绫。血不是别人的，是企业拆剩下的我。", "手枪守墓园，太刀守喉咙。花谢得比夜快，我喝得比花快。", "最后一瓶写着自己的名字。吸空以后，连开枪的力气都退色。", "瓶是空的。泪比血晚到。"] },
    { id: "school_cult", n: "未归·修仙凛音", r: "SR", kind: "school", tag: "基础", school: "cult", face: "rion", d: "飞剑折在剑冢。拥有即修仙倾向 ×1.3。", lore: ["我是黑羽家被送去飞升的那一页。飞剑比家谱先出门。", "剑冢里每把剑都认识我。我路过那些失败的小夜，没有对任何一把鞠躬。", "飞剑折在别人的坟上。刃还在振，飞的那一半回不来。", "我握住折断的那截。天没有开。"] },
    { id: "school_necro", n: "未归·死灵凛音", r: "R", kind: "school", tag: "基础", school: "necro", face: "rion", d: "看见终章把自己收成魂火。拥有即死灵倾向 ×1.3。", lore: ["我是看见终章以后还想收尸的凛音。先收下的是自己。", "魂火从掌心往上爬。刀还在，名字开始透明。", "我把凛音当成可召唤物。契约成立的瞬间，人变成燃料。", "火还亮。署名栏空了。"] },
    { id: "school_gene", n: "未归·基因凛音", r: "R", kind: "school", tag: "基础", school: "gene", face: "rion", d: "再生没跑过突变。拥有即基因倾向 ×1.3。", lore: ["我是被改过刀法和血的凛音。再生写在合同里，突变写在肉里。", "实验室的灯和全息牌楼的灯一起亮。我用刀压住往外长的那只手臂。", "再生追上伤口，没追上镜裂。红晶比皮肤先成为我。", "刀还认得手。手不太认得我。"] },
    { id: "school_summon", n: "未归·召唤凛音", r: "R", kind: "school", tag: "基础", school: "summon", face: "rion", d: "契约反噬。拥有即召唤倾向 ×1.3。", lore: ["我是把影子当部下的凛音。契约纸比刀快，反噬比部下快。", "我在腕上缠满符。刀尖指着该来的东西，它从背后先来。", "契约反咬署名。红线勒进刀柄，影子比我更高。", "符烧完了。部下还在，主人不在。"] },
  ]);
  var JOB_CARDS = Object.freeze([
    { id: "job_swarm", n: "未归·蜂群统御", r: "SR", kind: "job", tag: "转职", school: "mech", face: "sayo", d: "无人机成群却不听令。拥有即机械师倾向 ×1.5，重复不叠加倾向。", lore: ["我是把蜂群写成姐姐的那一版机械师小夜。无人机比我先学会排队，也比我先学会离开。", "我把步枪焊进指挥频段。每一架都画上樱花，像给妹妹系一条还会断的红绳。", "蜂群选择了镜核的热源。我按召回，屏幕只回一行冷字：这一夜已经无主。", "螺旋桨还在远处响。遥控器烫得握不住，像握着别人的失败。"] },
    { id: "job_railLord", n: "未归·天穹磁轨", r: "SR", kind: "job", tag: "转职", school: "mech", face: "sayo", d: "轨道比步枪更直也更容易折。拥有即机械师倾向 ×1.5，重复不叠加倾向。", lore: ["我是想用磁轨把夜空钉住的机械师小夜。轨道比步枪更直，也比人更容易折在半空。", "我沿着天穹一节一节铺轨，焊到全息牌楼那么高。无人机当铆钉，人当绝缘体。", "磁轨先吸走弹壳，再吸走准星。轨道自己弯向镜核，把我留在地上。", "铁还在震。我的手已经对不上极性，像对不上自己的名字。"] },
    { id: "job_hive", n: "未归·万菌母巢", r: "SR", kind: "job", tag: "转职", school: "spore", face: "sayo", d: "孢子认镜子不认姓。拥有即菌群倾向 ×1.5，重复不叠加倾向。", lore: ["我是想成为母巢本身的菌群小夜。孢子只认镜子里的热，不认我写在袖口的姓。", "我把菌丝编进步枪握把，让它们跟我一起呼吸。它们发光，像另一层不肯听话的皮肤。", "母巢选择了更热的核。我被当成过期的培养基，从胸口往外被吃空。", "蘑菇还在肩上亮。我的名字已经发酵完了，只剩甜得发苦的气味。"] },
    { id: "job_garden", n: "未归·尸骸花园", r: "SR", kind: "job", tag: "转职", school: "spore", face: "sayo", d: "花开在别人身上。拥有即菌群倾向 ×1.5，重复不叠加倾向。", lore: ["我是把尸体当成花圃的菌群小夜。花开在别人身上，种子却不肯回到我手里。", "我一路种花，从灵枢观石阶开到剑冢门口。步枪当锄，孢子当一场不肯停的雨。", "花园先吞掉脚印，再吞掉园丁。镜核从花心里长出来，比任何一朵都亮。", "花还香。我已经是土，连浇水的手都埋进去了。"] },
    { id: "job_starIdol", n: "未归·星穹偶像", r: "SR", kind: "job", tag: "转职", school: "magical", face: "sayo", d: "灯比咒语先亮。拥有即魔法少女倾向 ×1.5，重复不叠加倾向。", lore: ["我是被写成星穹台上的那一版魔法少女。灯比咒语先亮，人比变身慢了整整一夜。", "我把步枪举成麦克风。冠还在发光，舞台却往下沉，像要把我还回灵枢观。", "星穹塌了一角。应援棒还亮着，变身只走到一只手套，另一只仍是血。", "灯灭以后，妆裂在眼角。没有返场灯，也没有人喊我的名字。"] },
    { id: "job_miracle", n: "未归·奇迹魔女", r: "SR", kind: "job", tag: "转职", school: "magical", face: "sayo", d: "奇迹写在合同里。拥有即魔法少女倾向 ×1.5，重复不叠加倾向。", lore: ["我是还想创造一次奇迹的魔法少女小夜。奇迹写在合同里，失败却先写在冠的金边上。", "我把没转完的变身一次次重念。步枪没有变成权杖，花瓣却学会了只往上飞。", "奇迹先离开身体。冠还烫，咒语停在一半，人已经在往下坠。", "金边还亮着。我已经不值得被许愿，只值得被写成一张没转完的卡。"] },
    { id: "job_exorcist", n: "未归·祓魔执行官", r: "SR", kind: "job", tag: "转职", school: "shrine", face: "sayo", d: "执行令先于人作废。拥有即巫女倾向 ×1.5，重复不叠加倾向。", lore: ["我是灵枢观派来执行祓魔的那一夜小夜。符纸写着执行，镜核却先写好了否决。", "我把封条贴上步枪、贴上全息牌楼、贴上自己的袖口。外面的备份还在扫地，假装这是普通的夜。", "符烧完了，执行令当众作废。裂口从镜里爬到肩上，朱砂把失败写得很工整。", "我仍举着枪。封条比命令先落地，像先辞职的那一张纸。"] },
    { id: "job_guardian", n: "未归·八咫守护者", r: "SR", kind: "job", tag: "转职", school: "shrine", face: "sayo", d: "鸟比人先掉下来。拥有即巫女倾向 ×1.5，重复不叠加倾向。", lore: ["我是被派去守八咫的那一版巫女。鸟比我先看见裂镜，也比我先从夜色里掉下来。", "我把步枪靠在全息牌楼上，一夜一夜数那些不回来的翅膀。符灰比羽毛轻，比名字重。", "八咫没有守住核。羽毛烧成符灰，守护者变成被守护过的尸体。", "全息牌楼还在。我的影子短了一截，像被谁先收走了半只。"] },
    { id: "job_warSinger", n: "未归·尸潮歌姬", r: "SR", kind: "job", tag: "转职", school: "idol", face: "sayo", d: "观众席站满不该来的人。拥有即歌姬倾向 ×1.5，重复不叠加倾向。", lore: ["我是对着尸潮开口的那一版歌姬。观众席站满了不该买票的人，灯却还认我。", "歌比子弹先出门。我把步枪靠在脚边，对着没有活人的灯光把词一句句唱完。", "尸潮跟着节拍靠近。电台替我鞠躬，我跪在花瓣里，声带还在，人不在频率上。", "下一首歌自动连播。没有人喊安可，只有潮声替我鼓掌。"] },
    { id: "job_healingIdol", n: "未归·治愈偶像", r: "SR", kind: "job", tag: "转职", school: "idol", face: "sayo", d: "歌能止痛不能缝夜。拥有即歌姬倾向 ×1.5，重复不叠加倾向。", lore: ["我是被推上台医人的那一版偶像。歌能止痛，不能把裂开的夜重新缝回去。", "我一路唱给倒下的人听。麦克风比步枪先烫手，花比药先落地，像抢着宣布无效。", "治愈先用完自己。电台还在报时，人已经不在这条频率上，只剩回声。", "掌声是空的。药箱里只剩歌词，连一句完整的再见都没有。"] },
    { id: "job_barrage", n: "未归·弹幕暴君", r: "SR", kind: "job", tag: "转职", school: "gun", face: "aya", d: "弹幕先打空自己的夜。拥有即枪斗倾向 ×1.5，重复不叠加倾向。", lore: ["我是把弹幕写成领土的那条枪线。手枪是呼吸，太刀是还没来得及说出口的话。", "我把弹匣数得很干净。花瓣总是提醒我再快一点，我偏要把夜填得更密。", "弹幕先打空自己的夜。近身的爪子摸到领口，刀还在鞘里，像迟到的第二句话。", "套筒后锁。暴君的国土只剩空壳，连一发能认账的弹都没有。"] },
    { id: "job_sniper", n: "未归·处刑狙击", r: "SR", kind: "job", tag: "转职", school: "gun", face: "aya", d: "最后一发打空。拥有即枪斗倾向 ×1.5，重复不叠加倾向。", lore: ["我是被派去处刑镜核的那一枪。距离够远，心跳却比子弹更早到达准星。", "我趴过灵枢观屋顶，也趴过企业天台。手枪守近，太刀守退路，狙击只守这一发。", "最后一发打空。近身已经没有时间，处刑改成被处刑，花瓣盖住准星。", "准星还在。人已经不在那条直线上，只留下一枚没认账的空壳。"] },
    { id: "job_plagueDoctor", n: "未归·瘟疫医师", r: "SR", kind: "job", tag: "转职", school: "alch", face: "aya", d: "处方反噬署名。拥有即炼金倾向 ×1.5，重复不叠加倾向。", lore: ["我是把瘟疫写成处方的炼金绫。面具比脸先成为我，药味比姓名先被人记住。", "手枪看守火候，太刀切开试剂。我把别人的名字熬成能喝的东西，还假装这是治疗。", "处方反噬署名。封条在坩埚里烧成失败的味道，玻璃也沿着我的倒影裂开。", "药还在响。医师已经不值得过滤，只值得被写进下一张作废的单。"] },
    { id: "job_philosopher", n: "未归·贤者之石", r: "SR", kind: "job", tag: "转职", school: "alch", face: "aya", d: "石头答应永生不答应完整。拥有即炼金倾向 ×1.5，重复不叠加倾向。", lore: ["我是还想炼出石头的那一版绫。石头答应永生，却不答应把人炼得完整。", "我把封条当瓶盖，把作废券当配方。手枪守炉，太刀守冷却，像守一座不肯承认的坟。", "石头先炼化了炼金台。人变成渣，核变成更亮的废料，连工号都熔进底。", "炉是冷的。我的名字写在残渣上，比任何一句咒语都清楚。"] },
    { id: "job_bloodDuke", n: "未归·鲜血公爵", r: "SR", kind: "job", tag: "转职", school: "vamp", face: "aya", d: "最后一口吸空的是自己。拥有即血族倾向 ×1.5，重复不叠加倾向。", lore: ["我是把血统写成爵位的血族绫。血不是别人的，是企业拆剩下、又被我饮回去的我。", "手枪守墓园，太刀守喉咙。花谢得比夜快，我喝得比花更快，像赶一份清单。", "最后一瓶写着自己的名字。吸空以后，连扣扳机的力气都退成水色。", "爵冠是空的。泪比血晚到，也比血更不像胜利。"] },
    { id: "job_batQueen", n: "未归·夜蝠女王", r: "SR", kind: "job", tag: "转职", school: "vamp", face: "aya", d: "蝠群先离开王座。拥有即血族倾向 ×1.5，重复不叠加倾向。", lore: ["我是把夜蝠认作宫廷的那一版绫。它们认血，不认我戴歪的那顶王冠。", "我把翅膀编进风衣。手枪是权杖，太刀是还没来得及签署的条约，花瓣是未干的印。", "蝠群先离开王座。镜子比我更像女王，我被留在空的夜里，连一声召回都没有。", "翅膀还在远处响。冠已经掉进坟里，像一枚不肯退回的聘礼。"] },
    { id: "job_element", n: "未归·元素统御", r: "SR", kind: "job", tag: "转职", school: "mage", face: "aya", d: "元素先统御施法者。拥有即魔法师倾向 ×1.5，重复不叠加倾向。", lore: ["我是捏着通行证想统御元素的绫。券是金的，门是假的，火却认认真真地烫手。", "法阵画在水里，手枪还在腰上。我以为火和冰能被念咒排队，像企业里的零件。", "元素先统御了施法者。券面盖了作废，法阵从掌心往外死，墨比血先干。", "VOID 两个字母比我的咒语清楚，也比我的名字更像结局。"] },
    { id: "job_timeMage", n: "未归·时序魔导师", r: "SR", kind: "job", tag: "转职", school: "mage", face: "aya", d: "倒回去的只有作废戳。拥有即魔法师倾向 ×1.5，重复不叠加倾向。", lore: ["我是想把时序倒回去的那一版魔法师。秒针只认规则，不认我想救回的那一夜。", "我把怀表焊进法阵。手枪守这一秒，太刀守上一秒，像把退路切成两段。", "时序先折断了导师。倒回去的只有作废戳，人停在盖戳的那一帧，连眨眼都不被允许。", "表还在走。我已经不在这一格，只剩指针还认得我的工号。"] },
    { id: "job_shadow", n: "未归·无明影刃", r: "SR", kind: "job", tag: "转职", school: "ninja", face: "aya", d: "影遁出界人没回来。拥有即忍者倾向 ×1.5，重复不叠加倾向。", lore: ["我是从镜缝里进出的那条无明影。外面的我负责开枪，里面的我负责把自己删掉。", "分身比本体勤快。我把太刀留给回来的那一格，手枪留给还站着的这一格。", "影遁出了界。分身散成灰，本体没有从裂镜对面走回来，只剩一层还举着枪的皮。", "残影还在扣扳机。刃已经不在这一侧，像把退路留在了别人的夜里。"] },
    { id: "job_bombNinja", n: "未归·爆符忍军", r: "SR", kind: "job", tag: "转职", school: "ninja", face: "aya", d: "符先炸了归路。拥有即忍者倾向 ×1.5，重复不叠加倾向。", lore: ["我是把符纸写成炸药的那一支忍。爆炸比影遁守时，也比回家的路更守时。", "我把爆符贴上袖口、贴上弹匣、贴上要回来的石阶。太刀负责切开还没响的引线。", "符先炸了归路。烟散以后，军旗还在，人没有从对面走回来，只剩纸灰。", "纸灰还烫。署名栏被轰空了，像一张不肯承认失败的军令。"] },
    { id: "job_swordSaint", n: "未归·万剑仙", r: "SR", kind: "job", tag: "转职", school: "cult", face: "rion", d: "万剑先折在别人坟上。拥有即修仙倾向 ×1.5，重复不叠加倾向。", lore: ["我是黑羽家被送去飞升的那一页万剑。飞剑比家谱先出门，也比人更先学会折断。", "剑冢里每一把剑都认识我。我路过那些失败的小夜，没有对任何一把刀鞠躬。", "万剑先折在别人的坟上。刃还在振，飞出去的那一半回不来，像不肯认账的半个名字。", "我握住折断的那截。仙名没有写上，天也没有为此开过一次。"] },
    { id: "job_thunderLord", n: "未归·雷劫道君", r: "SR", kind: "job", tag: "转职", school: "cult", face: "rion", d: "劫先劈开飞剑。拥有即修仙倾向 ×1.5，重复不叠加倾向。", lore: ["我是去接雷劫的那一版修仙凛音。雷只认剑冢里的铁，不认我袖里那张发烫的道号。", "我把长刀举成避雷针。家谱在袖里发烫，飞剑在肩上发白，像提前写出的讣告。", "劫先劈开飞剑。道君的冠掉进坟里，人还站着，天却没有为此打开。", "雷还在响。署名只剩焦黑，连一句道号都写不回去。"] },
    { id: "job_titan", n: "未归·再生泰坦", r: "SR", kind: "job", tag: "转职", school: "gene", face: "rion", d: "再生没跑过突变。拥有即基因倾向 ×1.5，重复不叠加倾向。", lore: ["我是被改成泰坦的那一版基因凛音。再生写在合同里，突变却写进还在跳的肉里。", "实验室的灯和全息牌楼的灯一起亮。我用长刀压住往外长的那只手臂，像压住另一份遗嘱。", "再生追上伤口，没追上镜裂。红晶比皮肤先成为我，合同上的人已经对不上这张脸。", "刀还认得手。泰坦不太认得我，像认错了该复活的那一具。"] },
    { id: "job_berserk", n: "未归·超载狂战", r: "SR", kind: "job", tag: "转职", school: "gene", face: "rion", d: "超载先烧掉刹车。拥有即基因倾向 ×1.5，重复不叠加倾向。", lore: ["我是把再生拧到超载的狂战。力量先到，名字后碎，像一份写反了的紧急合同。", "我一路砍到剑冢最深处。血比家谱诚实，刀比合同短，连停手的字都没有。", "超载先烧掉刹车。突变追上狂战，人变成还在挥的那一截，连回头的余地都没有。", "刀还在响。我已经停不下来，也没有谁能替我按停。"] },
    { id: "job_beast", n: "未归·百兽统御", r: "SR", kind: "job", tag: "转职", school: "summon", face: "rion", d: "百兽先统御署名。拥有即召唤倾向 ×1.5，重复不叠加倾向。", lore: ["我是把影子当成百兽的召唤凛音。契约纸比刀快，反噬比任何部下都守时。", "我在腕上缠满符。刀尖指着该来的兽，它却从背后先到，像早就读过我的署名。", "百兽先统御了署名。红线勒进刀柄，影子比我更高，主人反而要低头。", "符烧完了。兽还在，主人不在，只剩空的腕和还在跳的线。"] },
    { id: "job_heroic", n: "未归·英灵契约", r: "SR", kind: "job", tag: "转职", school: "summon", face: "rion", d: "英灵先收下契约。拥有即召唤倾向 ×1.5，重复不叠加倾向。", lore: ["我是去签英灵的那一版召唤。英灵认剑冢里的死，不认还站着的这一具凛音。", "我把名字写进契。刀是祭品，血是印章，影子是还没赶到的部下。", "英灵先收下契约。人被写成祭品，影子比我更先成为英雄，连鞠躬都轮不到我。", "契还在腕上发烫。署名已经被收走，像一笔不肯退回的聘金。"] },
    { id: "job_boneKing", n: "未归·白骨君王", r: "SR", kind: "job", tag: "转职", school: "necro", face: "rion", d: "先称王的是自己的骨头。拥有即死灵倾向 ×1.5，重复不叠加倾向。", lore: ["我是看见终章以后还想称王的死灵。先称王的不是我，是自己已经亮起来的骨头。", "魂火从掌心往上爬。刀还在，名字开始透明，像被谁从家谱上轻轻擦掉。", "我把凛音收成可召唤的白骨。契约成立的瞬间，王冠戴在空的颅骨上，很合适。", "火还亮。君王的署名栏空了，只剩一具还想发令的架子。"] },
    { id: "job_soulHerd", n: "未归·群魂牧者", r: "SR", kind: "job", tag: "转职", school: "necro", face: "rion", d: "群魂先牧走牧者。拥有即死灵倾向 ×1.5，重复不叠加倾向。", lore: ["我是去牧群魂的那一版死灵凛音。魂认终章里的火，不认我手里这根还在发抖的牧鞭。", "我把刀当杖，把失败的小夜当成羊。火一路亮到剑冢门口，像一条不肯回头的路。", "群魂先牧走了牧者。人变成燃料，鞭还在空中响，羊群比我更认得方向。", "火还在远处走。我已经不在羊群里，只剩一句没来得及喊停的名字。"] },
  ]);
  var FUSION_CARDS = Object.freeze([
    { id: "fusion_magitech", n: "未归·星核机甲少女", r: "SSR", kind: "fusion", tag: "融合", pair: ["mech", "magical"], face: "sayo", d: "机甲裂开仍是小夜。拥有即机械师与魔法少女倾向 ×1.6，重复不叠加倾向。", lore: ["我是把星核焊进机甲胸口的那一版小夜。无人机当姐姐，冠却还想把我写成魔法少女。", "我一路用步枪当遥控器。星冠戴上以后，机甲仍裂着，露出里面还是灵枢观那件白外套。", "机甲先裂开。无人机去追星核的热，冠还亮，人已经从缝里掉出来。", "遥控器烫手。我还是小夜，只是再也拼不回完整的一夜。"] },
    { id: "fusion_gunshrine", n: "未归·祓魔枪巫女", r: "SSR", kind: "fusion", tag: "融合", pair: ["gun", "shrine"], face: "sayo", d: "步枪写符，符烧完。拥有即枪斗与巫女倾向 ×1.6，重复不叠加倾向。", lore: ["我是把符纸写进弹匣的那一夜巫女。步枪是全息牌楼，符是还没干的朱砂。", "我把封条一层层贴上枪管，贴上准星，贴上自己的袖口。外面的备份还在扫地。", "符烧完了。祓魔波停在半空，镜核比名字先亮，朱砂把失败写得很工整。", "我仍举着空枪。封条比弹壳先落地。"] },
    { id: "fusion_bloodstar", n: "未归·血月魔法少女", r: "SSR", kind: "fusion", tag: "融合", pair: ["vamp", "magical"], face: "sayo", d: "冠还亮，血从变身缝里漏。拥有即血族与魔法少女倾向 ×1.6，重复不叠加倾向。", lore: ["我是想在血月下变身的那一版小夜。冠比我先发光，血却比咒语先出门。", "变身只走到一只手套。其余的我还是灵枢观外套，步枪没有变成权杖，花瓣沾着自己的血。", "冠还亮着，变身缝却裂开。血从缝里漏出来，像另一层不肯干的妆。", "金边还烫。咒语停在一半，人已经空了。"] },
    { id: "fusion_bloodmech", n: "未归·血械猎姬", r: "SSR", kind: "fusion", tag: "融合", pair: ["vamp", "mech"], face: "sayo", d: "无人机喝血，遥控器烫手。拥有即血族与机械师倾向 ×1.6，重复不叠加倾向。", lore: ["我是把无人机养成猎犬的血械小夜。它们认血，不认我按下去的召回。", "我把樱花焊在机翼上。步枪当鞭，遥控器当项圈，一路把它们喂到镜核门口。", "无人机先喝空了补给，再回头喝署名。遥控器烫得握不住，像握着别人的喉咙。", "螺旋桨还在远处响。猎姬已经没有可召回的夜。"] },
    { id: "fusion_idolgun", n: "未归·枪火偶像", r: "SSR", kind: "fusion", tag: "融合", pair: ["idol", "gun"], face: "sayo", d: "麦和步枪抢同一只手。拥有即歌姬与枪斗倾向 ×1.6，重复不叠加倾向。", lore: ["我是被推进舞台还要开枪的那一版小夜。麦克风和步枪抢同一只手，节拍比准星更凶。", "歌比子弹先出门。我把步枪举成麦，对着空的灯把词唱完，又把弹匣唱空。", "麦和枪一起掉下去。高连击的安可没有来，只有空仓的回声在鞠躬。", "下一首歌自动连播。我已经不在频率上。"] },
    { id: "fusion_thunderpriest", n: "未归·雷火天师", r: "SSR", kind: "fusion", tag: "融合", pair: ["mage", "shrine"], face: "sayo", d: "符接雷，人被天罚先劈。拥有即魔法师与巫女倾向 ×1.6，重复不叠加倾向。", lore: ["我是去接天罚的那一版巫女。符纸写着雷，天却只认我袖里发烫的名字。", "我把符接在步枪上，像把全息牌楼举成避雷针。朱砂比咒语先亮，也比人更先焦。", "雷先劈开了施法的人。符烧成灰，天罚落在肩上，镜核反而更亮。", "雷还在响。我已经不值得被写成天师，只值得被写成焦黑的一张纸。"] },
    { id: "fusion_plagueidol", n: "未归·瘟律歌姬", r: "SSR", kind: "fusion", tag: "融合", pair: ["alch", "idol"], face: "sayo", d: "节拍带腐蚀，观众席在溶。拥有即炼金与歌姬倾向 ×1.6，重复不叠加倾向。", lore: ["我是对着腐蚀开口的那一版歌姬。节拍能带动观众，也能把观众席炼化。", "我一路把酸液写进歌词。麦克风比坩埚先烫手，花比药先落地，像抢着宣布无效。", "观众席先溶掉。尸潮还在打拍子，人已经跪在还冒泡的花瓣里。", "掌声是空的。歌还在连播，连一句完整的安可都没有。"] },
    { id: "fusion_railsword", n: "未归·磁轨剑阵", r: "SSR", kind: "fusion", tag: "融合", pair: ["mech", "cult"], face: "sayo", d: "飞剑当铆钉，轨道自己弯。拥有即机械师与修仙倾向 ×1.6，重复不叠加倾向。", lore: ["我是想用磁轨钉住飞剑的那一版小夜。轨道比刃更直，也比人更容易弯向镜核。", "我把飞剑当成铆钉一节节焊上天穹。步枪当绝缘体，人当还没熔的垫片。", "轨道自己弯了。飞剑先吸走弹壳，再吸走准星，把我留在地上。", "铁还在震。我的手已经对不上极性，像对不上自己的姓。"] },
    { id: "fusion_flowerplague", n: "未归·花疫魔女", r: "SSR", kind: "fusion", tag: "融合", pair: ["magical", "spore"], face: "sayo", d: "花弹开在别人身上。拥有即魔法少女与菌群倾向 ×1.6，重复不叠加倾向。", lore: ["我是把花弹认作奇迹的魔法少女。花开在别人身上，种子却不肯回到我手里。", "我一路把孢子编进没转完的变身。冠还亮，步枪当花茎，菌丝当另一层裙摆。", "花弹先开在路过的人身上。花园吞掉脚印，再吞掉园丁，镜核从花心里长出来。", "花还香。我已经是土，连浇水的手都埋进去了。"] },
    { id: "fusion_fleshshrine", n: "未归·生体御神子", r: "SSR", kind: "fusion", tag: "融合", pair: ["gene", "shrine"], face: "sayo", d: "符刻进肉，结界是血。拥有即基因与巫女倾向 ×1.6，重复不叠加倾向。", lore: ["我是把符刻进肉里的那一版巫女。结界答应护身，却只答应用血来画边。", "我把朱砂写进再生的缝。步枪靠在全息牌楼上，皮肤自己长成符纸，像一件不肯脱的祭服。", "结界先变成血。符还在肉里亮，人已经被自己的护身勒住，连呼吸都要盖章。", "全息牌楼还在。我的影子短了一截，像被谁先收走了半只。"] },
    { id: "fusion_shadowmage", n: "未归·影法魔女", r: "SSR", kind: "fusion", tag: "融合", pair: ["ninja", "mage"], face: "aya", d: "残影带火冰，本体没回来。拥有即忍者与魔法师倾向 ×1.6，重复不叠加倾向。", lore: ["我是从镜缝里施法的那条影。外面的我负责开枪，里面的我负责把火和冰留下来。", "分身比本体勤快。苦无随机沾上元素，太刀留给回来的那一格，手枪留给还站着的这一格。", "残影还在喷火喷冰。本体没有从裂镜对面走回来，只剩一层还举着枪的皮。", "法阵还在这一侧亮。人已经不在这一侧。"] },
    { id: "fusion_bloodmage", n: "未归·血焰术士", r: "SSR", kind: "fusion", tag: "融合", pair: ["vamp", "mage"], face: "aya", d: "法阵喝自己的血。拥有即血族与魔法师倾向 ×1.6，重复不叠加倾向。", lore: ["我是把法阵养成嘴的血焰绫。券是金的，门是假的，阵却认认真真地喝。", "我把血契画进水里。手枪还在腰上，太刀守冷却，像守一座不肯承认的炉。", "法阵先喝空了施法的人。券面盖了作废，墨从掌心滴进去，比血先干。", "VOID 两个字母比咒语清楚，也比我的工号更像结局。"] },
    { id: "fusion_nanoninja", n: "未归·纳米机忍", r: "SSR", kind: "fusion", tag: "融合", pair: ["mech", "ninja"], face: "aya", d: "无人机抄影遁，人留在镜缝。拥有即机械师与忍者倾向 ×1.6，重复不叠加倾向。", lore: ["我是让无人机去抄影遁的那一支忍。光学诱饵比人守时，归路却不守时。", "我把苦无焊进螺旋桨。冲刺留下斩击，机翼留下残影，像把回家的路复印了无数张。", "无人机先走进镜缝。人留在这一侧，诱饵散成灰，召回键只回一行冷字。", "屏幕黑了。影还在飞，署名已经不在这一格。"] },
    { id: "fusion_shadowblade", n: "未归·御剑影忍", r: "SSR", kind: "fusion", tag: "融合", pair: ["ninja", "cult"], face: "aya", d: "飞剑斩过，影没归鞘。拥有即忍者与修仙倾向 ×1.6，重复不叠加倾向。", lore: ["我是把飞剑写成影的那一支忍。刃比人先出门，鞘却等不到回来的那一格。", "我把影遁焊进剑阵。太刀负责切开标记，手枪留给还站着的这一侧。", "飞剑斩过镜核。影没有归鞘，人停在出鞘的那一帧，连眨眼都不被允许。", "刃还在振。鞘是空的，像一句不肯认账的退路。"] },
    { id: "fusion_plagueforge", n: "未归·瘟炼菌海", r: "SSR", kind: "fusion", tag: "融合", pair: ["alch", "spore"], face: "aya", d: "坩埚里的菌不认署名。拥有即炼金与菌群倾向 ×1.6，重复不叠加倾向。", lore: ["我是把菌海熬进坩埚的炼金绫。它们发光，却不认我写在瓶盖上的工号。", "手枪看守火候，太刀切开试剂。我把灵枢观封条当瓶盖，把孢子当一场不肯停的雨。", "坩埚里的菌先选择了镜核。盖子着了，人变成过期的培养基，从胸口往外被吃空。", "药还在响。署名已经发酵完了，只剩甜得发苦的气味。"] },
    { id: "fusion_biogun", n: "未归·活体弹仓", r: "SSR", kind: "fusion", tag: "融合", pair: ["gene", "gun"], face: "aya", d: "弹匣长肉，枪口朝前。拥有即基因与枪斗倾向 ×1.6，重复不叠加倾向。", lore: ["我是把弹匣养成活物的枪线。它们会呼吸，也会在上膛的时候咬手。", "我把再生写进弹壳。手枪朝前，太刀守退路，花瓣总是提醒我再快一点。", "弹匣先长出了自己的牙。枪口还朝前，人已经被后坐力按在墙上，近身的爪子摸到领口。", "套筒后锁。活弹还在跳，处刑改成被处刑。"] },
    { id: "fusion_bloodsword", n: "未归·血炼剑仙", r: "SSR", kind: "fusion", tag: "融合", pair: ["vamp", "cult"], face: "rion", d: "飞剑以血为炉，冠空。拥有即血族与修仙倾向 ×1.6，重复不叠加倾向。", lore: ["我是把血当成炉火的那一页飞升。飞剑比家谱先出门，冠却先空了。", "剑冢里每一把剑都认识我。我路过那些失败的小夜，没有对任何一把刀鞠躬。", "飞剑以我的血为炉。刃还在振，飞出去的那一半回不来，冠掉进坟里。", "我握住折断的那截。仙名没有写上，天也没有为此开过一次。"] },
    { id: "fusion_chimera", n: "未归·元素嵌合体", r: "SSR", kind: "fusion", tag: "融合", pair: ["gene", "mage"], face: "rion", d: "看见自己手臂的法阵。拥有即基因与魔法师倾向 ×1.6，重复不叠加倾向。", lore: ["我是被嵌进元素的那一版凛音。火、冰、雷写在肉里，合同上的人已经对不上这张脸。", "我用长刀压住往外长的那只手臂。法阵从皮肤下亮起来，像另一份不肯签字的遗嘱。", "我看见自己手臂上的法阵先活了。元素统御了施法者，人变成还在发光的嵌件。", "刀还认得手。嵌合体不太认得我。"] },
    { id: "fusion_corpseimmortal", n: "未归·尸解剑仙", r: "SSR", kind: "fusion", tag: "融合", pair: ["gene", "cult"], face: "rion", d: "肉身先走，剑还在振。拥有即基因与修仙倾向 ×1.6，重复不叠加倾向。", lore: ["我是去尸解的那一版修仙。合同写着飞升，肉身却先一步离开。", "我把再生焊进飞剑。长刀还在振，家谱在袖里发烫，像提前写出的讣告。", "肉身先走了。剑还插在剑冢里振，冠掉进水里，人已经不在这具该飞升的壳里。", "刃还在响。署名只剩焦黑，连一句道号都写不回去。"] },
    { id: "fusion_shikigami", n: "未归·百鬼阴阳师", r: "SSR", kind: "fusion", tag: "融合", pair: ["summon", "shrine"], face: "rion", d: "百鬼比主人先鞠躬。拥有即召唤与巫女倾向 ×1.6，重复不叠加倾向。", lore: ["我是去召百鬼的那一版阴阳。它们认全息牌楼上的符，不认还站着的这一具凛音。", "我把灵兽写进符纸。长刀是祭品，血是印章，影子是还没赶到的部下。", "百鬼先鞠躬。鞠躬的对象不是我，是镜核。主人反而要低头。", "符烧完了。鬼还在，主人不在，只剩空的腕和还在跳的线。"] },
    { id: "fusion_necrospore", n: "未归·菌尸冥主", r: "SSR", kind: "fusion", tag: "融合", pair: ["necro", "spore"], face: "rion", d: "魂菇从自己肩上长。拥有即死灵与菌群倾向 ×1.6，重复不叠加倾向。", lore: ["我是看见终章以后还想种魂菇的凛音。菇认镜子里的热，不认我手里这根发抖的刀。", "我把拘魂灯插进菌海。刀当杖，失败的小夜当成培养基，火一路亮到剑冢门口。", "魂菇先从我自己肩上长出来。人变成燃料，羊群比我更认得方向。", "火还在远处走。我已经不在羊群里，只剩一句没来得及喊停的名字。"] },
    { id: "fusion_bloodbeast", n: "未归·血契兽王", r: "SSR", kind: "fusion", tag: "融合", pair: ["summon", "vamp"], face: "rion", d: "兽群喝的是署名。拥有即召唤与血族倾向 ×1.6，重复不叠加倾向。", lore: ["我是把影子当成兽群的血契。它们认血，不认我腕上那圈发烫的红线。", "我把名字写进契。刀是祭品，血是印章，部下是还没赶到的坟。", "兽群先喝空了署名。红线勒进刀柄，影子比我更高，主人反而要低头。", "契还在腕上发烫。署名已经被饮尽，像一笔不肯退回的聘金。"] },
    { id: "fusion_elementalbeast", n: "未归·元素御兽使", r: "SSR", kind: "fusion", tag: "融合", pair: ["summon", "mage"], face: "rion", d: "使魔喷元素，鞭先断。拥有即召唤与魔法师倾向 ×1.6，重复不叠加倾向。", lore: ["我是让使魔轮流喷火霜雷的那一版召唤。兽潮比咒语守时，鞭却先断。", "我把元素写进契约。长刀当鞭，灵兽当还没排队的灾，像把退路切成三段。", "使魔先喷向了持鞭的人。火、冰、雷认阵，不认我，鞭在空中先裂开。", "兽潮还在远处走。我已经没有下一记能抽下去的夜。"] },
    { id: "fusion_soulgun", n: "未归·亡骨枪骑", r: "SSR", kind: "fusion", tag: "融合", pair: ["necro", "gun"], face: "rion", d: "弹匣收魂，刀当马鞭。拥有即死灵与枪斗倾向 ×1.6，重复不叠加倾向。", lore: ["我是把魂火装进弹匣的枪骑。刀当马鞭，枪当还没写完的家谱。", "我一路把失败的小夜收成弹药。长刀抽在空鞍上，魂灯在弹壳里亮，像一队不肯下葬的马。", "弹匣先收下了牧者。贯穿的亡魂弹打出去，人停在马上，已经没有可勒的缰。", "刀还在响。马是空的，魂已经不认这个骑手。"] },
  ]);

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
    ".revealPvSplit48{position:absolute;inset:0;z-index:8;display:grid;grid-template-columns:minmax(0,46%) minmax(0,1fr);align-items:center;gap:clamp(12px,3vw,40px);padding:clamp(10px,3vh,28px) clamp(16px,4vw,56px);background:radial-gradient(120% 90% at 22% 50%,#0f2a44 0%,#060a16 62%,#04050c 100%);cursor:pointer;animation:rpvIn48 .28s ease-out}" +
    ".revealPvSplit48.legend{background:radial-gradient(120% 90% at 22% 50%,#3a2a0e 0%,#0b0a14 62%,#05050c 100%)}" +
    ".rpvStage48{position:relative;height:100%;min-height:0;clip-path:polygon(0 0,calc(100% - 22px) 0,100% 22px,100% 100%,22px 100%,0 calc(100% - 22px));background:#030611;box-shadow:inset 0 0 0 1px #6ff3ff55}" +
    ".rpvStage48 video{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}" +
    ".rpvScan48{position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,transparent 0 3px,#6ff3ff0d 3px 4px)}" +
    ".rpvInfo48{display:flex;flex-direction:column;gap:8px;min-width:0;color:#eaf6ff}" +
    ".revealPvSplit48 .rpvTag48{align-self:flex-start;padding:4px 12px;clip-path:polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%);background:linear-gradient(90deg,#ffd36b,#ff9ec4);color:#1a0f05;font:800 12px/1.2 system-ui;letter-spacing:.12em}" +
    ".rpvInfo48 b{font:900 clamp(22px,3.4vw,40px)/1.15 system-ui;text-shadow:0 0 18px #6ff3ff66}" +
    ".rpvInfo48 em{font-style:normal;color:#9fdcff;font:700 14px/1.2 system-ui;letter-spacing:.2em}" +
    ".rpvInfo48 p{margin:6px 0 0;max-width:34em;padding-left:10px;border-left:2px solid #ff7fb0;color:#d8e6f5;font:500 14px/1.6 system-ui}" +
    ".rpvHint48{margin-top:10px;color:#8aa6c0;font:600 12px/1 system-ui}" +
    "@keyframes rpvIn48{from{opacity:0}to{opacity:1}}" +
    "@media (orientation:portrait){.revealPvSplit48{grid-template-columns:1fr;grid-template-rows:62% auto}}" +
    ".rosterSlot46 .rosterArt46{position:relative}" +
    ".rosterStars48{display:block;margin:4px 0 0;color:#ffd77a;font:700 11px/1 system-ui;letter-spacing:1px;text-shadow:0 0 6px #ffb84a88}" +
    ".rosterArt46 .rosterStars48{position:absolute;left:4px;right:4px;bottom:4px;margin:0;padding:2px 0;text-align:center;font-size:10px;background:linear-gradient(90deg,transparent,#06101ecc 20%,#06101ecc 80%,transparent)}" +
    ".rosterSlot46.star3 .rosterArt46{box-shadow:0 0 0 1px #6ff3ff88,0 0 10px #3fe0ff55}" +
    ".rosterSlot46.star5 .rosterArt46{box-shadow:0 0 0 1px #ffe08acc,0 0 14px #ffc84a77;animation:rosterStar48 2.6s ease-in-out infinite}" +
    "@keyframes rosterStar48{50%{box-shadow:0 0 0 1px #fff2c0,0 0 20px #ffd36baa}}" +
    "@media (prefers-reduced-motion: reduce){.rosterSlot46.star5 .rosterArt46{animation:none}}" +
    ".rosterPactTag48{position:absolute;top:4px;right:4px;padding:2px 6px;clip-path:polygon(6px 0,100% 0,calc(100% - 6px) 100%,0 100%);background:linear-gradient(90deg,#ff5f8f,#ff9ec4);color:#fff;font:800 10px/1.3 system-ui;font-style:normal}" +
    ".rosterSlot46.pact48 .rosterArt46{outline:2px solid #ff7fb0;outline-offset:-2px}" +
    ".rosterPact48{margin-left:8px;background:linear-gradient(180deg,#6ff3ff,#2aa7d8);border-color:#9ff6ff88;color:#04121c}.rosterPact48.on{background:linear-gradient(180deg,#ff9ec4,#e2558a);color:#fff}" +
    ".rosterPactHint48{display:block;margin-top:6px;color:#bfefff;font:600 11px/1.4 system-ui}" +
    ".rosterEquip46{margin-top:8px;min-height:36px;padding:0 12px;border-radius:10px;border:1px solid #ffe6a366;background:linear-gradient(180deg,#ffe08a,#d8892b);color:#2a1608;font:800 12px/1 system-ui}" +
    ".chronicleBox46{display:grid;gap:10px}" +
    "#rosterWall46>.chronicleBox46{grid-column:1/-1}" +
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
    "#rosterDrawer>#rosterBody46{height:100%;min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;box-sizing:border-box}" +
    "#rosterDrawer .rosterStage46{box-sizing:border-box}" +
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
    "#rosterPeek46{position:absolute;inset:0;z-index:40;display:flex;align-items:center;justify-content:center;padding:18px;background:#060410ee;box-sizing:border-box}" +
    ".rosterPeekCard46{position:relative;width:min(86vw,280px);max-height:100%;border-radius:18px;overflow:auto;overscroll-behavior:contain;border:1px solid #ffe6a355;background:#120c20;box-shadow:0 18px 40px #05020d88;box-sizing:border-box}" +
    "#rosterPeekClose46{position:sticky;z-index:2;top:0;display:block;width:40px;height:40px;margin:0 0 -40px auto;padding:0;border-radius:4px;border:1px solid #b9e8f355;background:#172b39ee;color:#eaf5fa;font-size:24px}" +
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
    "html.landscape46 .wishPity46{bottom:max(240px,calc(env(safe-area-inset-bottom) + 220px));right:12px}" +
    "html.landscape46 #rosterWall46{grid-template-columns:repeat(4,minmax(0,1fr))}" +
    "html.landscape46 #archiveDrawer .archiveDock46{grid-template-columns:repeat(4,minmax(0,1fr))}" +
    "html.landscape46 #stageList{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}" +
    "@media(max-height:460px){" +
    "html.landscape46 .wishTitle46{top:52px;max-width:48%}" +
    "html.landscape46 .wishTitle46 h3{font-size:26px;line-height:1.15}" +
    "html.landscape46 .wishTitle46 p{margin-top:4px;font-size:10px}" +
    "html.landscape46 .wishPity46{top:116px;bottom:auto}" +
    "html.landscape46 .wishPills46{gap:4px}" +
    "html.landscape46 .wishPills46 b{padding:3px 6px;font-size:9px}" +
    "html.landscape46 .wishSpark46{max-height:60px}" +
    ".rosterPeekCard46{width:min(86vw,600px);display:grid;grid-template-columns:minmax(120px,38%) minmax(0,1fr)}" +
    ".rosterPeekCard46 img{height:100%;min-height:220px;max-height:300px;grid-column:1;grid-row:1}" +
    ".rosterPeekCard46 div{grid-column:2;grid-row:1;padding-top:48px}" +
    "#rosterPeekClose46{position:sticky;grid-column:2;grid-row:1;align-self:start;justify-self:end}" +
    "}" +
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
    "@keyframes heroBlink46{0%,86%,100%{opacity:0}88%,94%{opacity:1}}" +
    "@keyframes heroBaseBlink46{0%,86%,100%{opacity:1}88%,94%{opacity:0}}" +
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
    "@media(prefers-reduced-motion:reduce){.heroLive46.hasBlink .heroLiveBlink46,.heroLive46.hasBlink .heroLiveBase46{animation:none}}";


  var GACHA_V2_CSS =
    ".wishV2 .wishBanner46{filter:saturate(1.08) brightness(.82)}" +
    ".wishV2 .wishShade46{position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(90deg,#070b1ae6 0,#070b1a66 16%,transparent 34%,transparent 52%,#070b1acc 74%,#070b1af2 100%),linear-gradient(0deg,#070b1acc,transparent 30%)}" +
    "html.landscape46 #gachaDrawer .wishV2 .wishHero46{left:13%;width:44%;height:118%;bottom:-14%;-webkit-mask-image:none;mask-image:none;filter:drop-shadow(0 0 28px #ff9bcc55)}" +
    "#gachaDrawer .wishV2 .wishTabs46{top:max(64px,calc(env(safe-area-inset-top) + 56px));left:max(12px,env(safe-area-inset-left));flex-direction:column;gap:8px;width:clamp(92px,12vw,132px)}" +
    "#gachaDrawer .wishV2 .wishTabs46 button{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:3px;min-height:52px;padding:6px 12px;border-radius:12px;border:1px solid #96e4f555;background:#0b1326cc;color:#dbe9f8;text-align:left;font:800 14px/1 system-ui;letter-spacing:.12em;backdrop-filter:blur(8px)}" +
    "#gachaDrawer .wishV2 .wishTabs46 button small{font:600 9px/1 system-ui;letter-spacing:.08em;color:#a9bed6}" +
    "#gachaDrawer .wishV2 .wishTabs46 button.on{background:linear-gradient(120deg,#ff6fae,#ff9fcf 50%,#8fe6f5);color:#081426;border-color:#fff8;box-shadow:0 8px 22px #ff8fc455}" +
    "#gachaDrawer .wishV2 .wishTabs46 button.on small{color:#0b2233}" +
    "#gachaDrawer .wishV2 .wishWallet46{position:absolute;z-index:7;top:max(14px,calc(env(safe-area-inset-top) + 6px));right:64px;display:flex;align-items:center;gap:8px;height:36px;padding:0 6px 0 10px;border-radius:999px;background:#09101ee6;border:1px solid #96e4f566;color:#ffd77a;font:800 14px/1 system-ui}" +
    "#gachaDrawer .wishV2 .wishShardPill46{padding:5px 9px;border-radius:999px;background:#ffffff12;color:#cfe6f5;font:700 10px/1 system-ui;letter-spacing:.06em}" +
    ".wishCoin46{display:inline-block;width:18px;height:18px;object-fit:contain;vertical-align:-4px;margin-right:4px;filter:drop-shadow(0 0 4px #ffd77a88)}" +
    "#gachaDrawer .wishV2 .wishTitle46{top:max(60px,calc(env(safe-area-inset-top) + 52px));right:max(18px,env(safe-area-inset-right));max-width:40%;text-align:right}" +
    "#gachaDrawer .wishV2 .wishTag46{display:inline-block;padding:3px 10px;border-radius:4px;background:#ff8fc4;color:#2a0b1c;font:800 10px/1.2 system-ui;letter-spacing:.2em}" +
    "#gachaDrawer .wishV2 .wishTitle46 h3{margin:6px 0 4px;font-size:clamp(24px,3.6vw,38px);letter-spacing:.22em;line-height:1.1}" +
    "#gachaDrawer .wishV2 .wishUp46{display:inline-flex;align-items:center;gap:8px;margin:2px 0 6px;padding:5px 6px 5px 5px;border-radius:999px;background:#09101ee0;border:1px solid #ffd77a88}" +
    "#gachaDrawer .wishV2 .wishUp46 em{padding:3px 7px;border-radius:999px;background:linear-gradient(180deg,#ffe08a,#d8892b);color:#2a1608;font:900 10px/1 system-ui;font-style:normal}" +
    "#gachaDrawer .wishV2 .wishUp46 b{color:#fff;font-size:13px;letter-spacing:.08em}" +
    "#gachaDrawer .wishV2 .wishUp46 i{font-style:normal;color:#ffd77a;font:900 11px/1 system-ui;padding-right:6px}" +
    "#gachaDrawer .wishV2 .wishTitle46 p{display:block;margin:0;padding:0;background:none;border:0;color:#e4eef9;font-size:10px;letter-spacing:.1em;text-shadow:0 1px 6px #000}" +
    "#gachaDrawer .wishV2 .wishTime46{display:block;margin-top:4px;color:#8fe6f5;font:700 10px/1.2 system-ui;letter-spacing:.12em}" +
    "html.landscape46 #gachaDrawer .wishV2 .wishPity46{top:auto;bottom:max(150px,calc(env(safe-area-inset-bottom) + 142px));left:auto;right:max(18px,env(safe-area-inset-right));width:min(38%,380px);background:#09101ed9;border-color:#96e4f544}" +
    "#gachaDrawer .wishV2 .pityRow46 span{min-width:9.5em;color:#e4eef9}" +
    "html.landscape46 #gachaDrawer .wishV2 .wishDock46{left:auto;right:0;width:min(44%,460px);padding:0 max(18px,env(safe-area-inset-right)) calc(12px + env(safe-area-inset-bottom)) 0;background:none}" +
    "#gachaDrawer .wishV2 .wishLinks46{position:absolute;z-index:6;left:max(12px,env(safe-area-inset-left));bottom:calc(12px + env(safe-area-inset-bottom));display:flex;align-items:center;gap:6px;margin:0}" +
    "#gachaDrawer .wishV2 .wishLinks46 button{min-height:28px;padding:0 12px;border-radius:999px;border:1px solid #96e4f566;background:#09101ee0;color:#dbe9f8;font:700 11px/1 system-ui;letter-spacing:.12em}" +
    "#gachaDrawer .wishV2 .wishLinks46 .wishPills46{margin:0 0 0 4px;gap:6px}" +
    "#gachaDrawer .wishV2 .wishPills46 b{background:#09101ee0;border-color:#96e4f544;color:#cfe6f5}" +
    "#gachaDrawer .wishV2 .gachaActions46 button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:62px;border-radius:14px;font-size:17px;letter-spacing:.2em;border:1px solid #fff5;background:linear-gradient(180deg,#2a3f5f,#162338)}" +
    "#gachaDrawer .wishV2 .gachaActions46 #gachaPull10{background:linear-gradient(120deg,#ff6fae,#ff9fcf 50%,#8fe6f5);color:#081426;box-shadow:0 10px 26px #ff8fc466}" +
    "#gachaDrawer .wishV2 .gachaActions46 small{display:flex;align-items:center;justify-content:center;padding:3px 10px;border-radius:999px;background:#0005;color:#ffe9a8;font-size:12px;letter-spacing:.04em;opacity:1}" +
    "#gachaDrawer .wishV2 .gachaActions46 #gachaPull10 small{background:#08142633;color:#081426}" +
    "#gachaDrawer .wishV2 .wishSpark46{margin-top:8px;max-height:30px;overflow-x:auto;overflow-y:hidden;flex-wrap:nowrap}" +
    "#gachaDrawer .wishV2 .wishSpark46 button{flex:0 0 auto;background:#09101ee0;border-color:#ff8fc466;color:#ffe3f0}" +
    "@media (max-height:420px){" +
    "#gachaDrawer .wishV2 .wishTitle46{top:56px}" +
    "#gachaDrawer .wishV2 .wishTag46{display:none}" +
    "#gachaDrawer .wishV2 .wishTitle46 h3{margin:0 0 2px;font-size:22px}" +
    "#gachaDrawer .wishV2 .wishUp46{margin:0 0 2px;padding:3px 5px 3px 3px}" +
    "#gachaDrawer .wishV2 .wishTime46{margin-top:2px}" +
    "html.landscape46 #gachaDrawer .wishV2 .wishPity46{bottom:max(116px,calc(env(safe-area-inset-bottom) + 108px));padding:5px 10px}" +
    "#gachaDrawer .wishV2 .pityRow46{margin-top:3px}" +
    "#gachaDrawer .wishV2 .wishLinks46 button{min-height:24px}" +
    "#gachaDrawer .wishV2 .gachaActions46 button{min-height:46px;flex-direction:row;gap:10px;font-size:15px}" +
    "#gachaDrawer .wishV2 .wishSpark46{margin-top:5px;max-height:26px}" +
    "#gachaDrawer .wishV2 .wishSpark46 button{min-height:24px}" +
    "}" +
    "@media (max-width:700px){#gachaDrawer .wishV2 .wishLinks46 .wishPills46{display:none}#gachaDrawer .wishV2 .wishLinks46{bottom:auto;top:calc(250px + env(safe-area-inset-top))}html.landscape46 #gachaDrawer .wishV2 .wishDock46{width:48%}}" +
    "@media (max-width:560px){html.landscape46 #gachaDrawer .wishV2 .wishDock46{left:0;width:auto;padding-left:12px}html.landscape46 #gachaDrawer .wishV2 .wishPity46{left:12px;right:12px;width:auto;bottom:calc(190px + env(safe-area-inset-bottom))}#gachaDrawer .wishV2 .wishTitle46{max-width:70%}#gachaDrawer .wishV2 .wishTabs46{top:auto;bottom:calc(330px + env(safe-area-inset-bottom));flex-direction:row;width:auto}}" +
    ".wishSheet46{position:absolute;inset:0;z-index:20;display:grid;place-items:center;background:#03060fb3;backdrop-filter:blur(4px)}" +
    ".wishSheet46.hidden{display:none}" +
    ".wishSheetCard46{width:min(460px,88vw);max-height:80%;overflow:auto;padding:18px 20px;border-radius:14px;background:#0b1326f2;border:1px solid #96e4f566;color:#e4eef9;box-shadow:0 18px 40px #0009}" +
    ".wishSheetCard46 h4{margin:0 0 10px;letter-spacing:.2em;color:#fff}" +
    ".wishSheetCard46 ul{margin:0;padding-left:18px;font-size:12px;line-height:1.8}" +
    ".wishSheetCard46 p{font-size:12px;line-height:1.7}" +
    ".wishSheetActions46{display:flex;justify-content:flex-end;gap:10px;margin-top:14px}.wishSheetActions46 .wishSheetClose46{margin:0}" +
    ".wishSheetCancel46{min-height:44px;padding:0 18px;border-radius:999px;border:1px solid #96e4f566;background:#09101ee0;color:#dbe9f8;font:800 12px/1 system-ui}" +
    ".wishSheetClose46{min-height:44px!important;display:block;margin:14px 0 0 auto;min-height:34px;padding:0 18px;border-radius:999px;border:0;background:linear-gradient(120deg,#ff6fae,#8fe6f5);color:#081426;font:800 12px/1 system-ui}" +
    "#gachaDrawer .wishV2 .wishUp46{cursor:pointer;transition:transform .15s,box-shadow .15s}" +
    "#gachaDrawer .wishV2 .wishUp46:hover{transform:translateY(-1px);box-shadow:0 4px 14px #ffd77a44}" +
    "#gachaDrawer .wishV2 .wishUp46 .fateBadge46{padding:2px 6px;border-radius:999px;background:#25183ecc;border:1px solid #ff9bcc88;color:#ffd8ec;font:800 10px/1 system-ui}" +
    "#gachaDrawer .wishV2 .wishUp46 .fateBadge46.full{background:linear-gradient(120deg,#ffe08a,#ff8fc4);color:#26101e;border-color:#fff}" +
    ".wishTicketPill46{padding:5px 9px;border-radius:999px;background:linear-gradient(120deg,#ff6fae33,#8fe6f533);border:1px solid #ff9fcf66;color:#ffe9f5;font:800 10px/1 system-ui;letter-spacing:.06em}" +
    ".wishFocusGrid46,.wishSparkGrid46{display:grid;grid-template-columns:repeat(auto-fill,minmax(122px,1fr));gap:8px;margin-top:10px;max-height:46vh;overflow-y:auto;padding-right:4px}" +
    ".wishFocusItem46{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 6px;border-radius:12px;border:1px solid #96e4f533;background:#101b33cc;color:#e4eef9;text-align:center;cursor:pointer}" +
    ".wishFocusItem46.on{border-color:#ffd77a;background:linear-gradient(180deg,#2c2142f0,#151d33f0);box-shadow:0 0 16px #ffd77a44}" +
    ".wishFocusItem46 img{width:54px;height:68px;object-fit:cover;border-radius:8px;border:1px solid #ffffff22}" +
    ".wishFocusItem46 b{font-size:11px;line-height:1.2;color:#fff}" +
    ".wishFocusItem46 small{font-size:9px;color:#96e4f5}" +
    ".wishFocusFilter46{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}" +
    ".wishFocusFilter46 button{min-height:28px;padding:0 10px;border-radius:999px;border:1px solid #96e4f544;background:#09101ecc;color:#cfe6f5;font:700 11px/1 system-ui}" +
    ".wishFocusFilter46 button.on{background:linear-gradient(120deg,#ffe08a,#ff9fcf);color:#1d0e1a;border-color:#fff}" +
    ".wishLogList46{display:grid;gap:5px;max-height:42vh;overflow-y:auto;margin-top:8px;padding-right:4px}" +
    ".wishLogRow46{display:flex;align-items:center;justify-content:space-between;padding:6px 10px;border-radius:8px;background:#101a30cc;border:1px solid #ffffff14;font-size:11px}" +
    ".wishLogRow46.r-SSR{border-color:#ffd77a88;background:linear-gradient(90deg,#332418cc,#101a30cc);color:#ffe8a3}" +
    ".wishLogRow46.r-SR{border-color:#d58cff66;background:linear-gradient(90deg,#261638cc,#101a30cc);color:#f0d6ff}" +
    ".revealOmen46{text-align:center;margin:0 0 10px;padding:5px 16px;border-radius:999px;font:900 12px/1.2 system-ui;letter-spacing:.24em;background:#0d1528cc;border:1px solid #96e4f555;color:#dbe9f8}" +
    ".revealOmen46.omen-SSR{background:linear-gradient(90deg,#2a180800,#ffd77a33 50%,#2a180800);border-color:#ffd77aaa;color:#ffe89e;text-shadow:0 0 14px #ffd77a}" +
    ".revealOmen46.omen-SR{background:linear-gradient(90deg,#200f3300,#d58cff33 50%,#200f3300);border-color:#d58cffaa;color:#f3d4ff;text-shadow:0 0 12px #d58cff}" +
    ".revealCard46.r-SSR:not(.flipped) .revealFace46.back,.revealCard46.r-LEGEND:not(.flipped) .revealFace46.back{border-color:#ffd77acc;box-shadow:0 0 22px #ffd77a66}" +
    ".revealCard46.r-SR:not(.flipped) .revealFace46.back{border-color:#d58cffaa;box-shadow:0 0 16px #d58cff44}" +
    ".revealDupe46{position:absolute;top:8px;right:8px;z-index:2;padding:2px 6px;border-radius:999px;background:#09101ed9;border:1px solid #96e4f577;color:#96e4f5;font:800 9px/1.2 system-ui}" +
    ".rosterResonance46{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:0 0 10px;padding:8px 12px;border-radius:12px;background:#120d24cc;border:1px solid #ffe6a344;font-size:11px;color:#e7d7ef}" +
    ".rosterResonance46 em{font-style:normal;padding:3px 8px;border-radius:999px;background:#26183ecc;border:1px solid #ff9bcc55;color:#ffe6a3;font:800 10px/1 system-ui}" +
    ".rosterFilter46{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px}" +
    ".rosterFilter46 button{min-height:28px;padding:0 10px;border-radius:999px;border:1px solid #ff9bcc44;background:#140e24cc;color:#e7d7ef;font:700 11px/1 system-ui}" +
    ".rosterFilter46 button.on{background:linear-gradient(120deg,#ffe08a,#d8892b);color:#2a1608;border-color:#ffe6a3}";

  function injectStyle() {
    if (!global.document) return;
    var style = global.document.getElementById("sakurayo-lobby-css");
    if (style) return;
    style = global.document.createElement("style");
    style.id = "sakurayo-lobby-css";
    style.textContent = LOBBY_CSS + ROOM_CSS + GACHA_V2_CSS;
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
    var focusId = typeof incoming.focusId === "string" && list.some(function (c) { return c.id === incoming.focusId; }) ? incoming.focusId : "";
    return {
      pity: clampInt(incoming.pity, 0, RATES.pitySSR),
      pitySR: clampInt(incoming.pitySR, 0, RATES.pitySR),
      pulls: clampInt(incoming.pulls, 0, 999999),
      tenPulls: clampInt(incoming.tenPulls, 0, 999999),
      owned: owned,
      last: Array.isArray(incoming.last) ? incoming.last.slice(0, 20) : [],
      history: Array.isArray(incoming.history) ? incoming.history.slice(0, 40) : [],
      equipped: typeof incoming.equipped === "string" ? incoming.equipped : "",
      shards: clampInt(incoming.shards, 0, 999999),
      focusId: focusId,
      fatePoints: focusId ? clampInt(incoming.fatePoints, 0, 1) : 0,
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
    var focusId = typeof incoming.focusId === "string" && catalog.some(function (c) { return c.id === incoming.focusId; }) ? incoming.focusId : "";
    var rosterFilter = typeof incoming.rosterFilter === "string" ? incoming.rosterFilter : "all";
    shop.ops = {
      pity: clampInt(incoming.pity, 0, RATES.pitySSR),
      pitySR: clampInt(incoming.pitySR, 0, RATES.pitySR),
      pulls: clampInt(incoming.pulls, 0, 999999),
      tenPulls: clampInt(incoming.tenPulls, 0, 999999),
      owned: owned,
      last: Array.isArray(incoming.last) ? incoming.last.slice(0, 20) : [],
      history: Array.isArray(incoming.history) ? incoming.history.slice(0, 40) : [],
      cheatUsed: incoming.cheatUsed ? 1 : 0,
      shards: clampInt(incoming.shards, 0, 999999),
      pool: pool,
      rosterTab: rosterTab,
      rosterFilter: rosterFilter,
      focusId: focusId,
      fatePoints: focusId ? clampInt(incoming.fatePoints, 0, 1) : 0,
      noviceUsed: clampInt(incoming.noviceUsed, 0, 2),
      pact: typeof incoming.pact === "string" && PACT_KINDS[(cardOf(incoming.pact) || {}).kind] && (owned[incoming.pact] || 0) > 0 ? incoming.pact : "",
      supplies: ['firstRun','chapter1','chapter2','chapter3','chapter4','kills500'].reduce(function(receipts,id){
        receipts[id] = !!(incoming.supplies && incoming.supplies[id] === true);
        return receipts;
      }, {}),
      services: global.SakurayoServices ? global.SakurayoServices.normalize(incoming.services) : (incoming.services || {}),
      fashion: normalizePool(incoming.fashion, FASHION_CARDS),
      weapon: normalizePool(incoming.weapon, WEAPON_CARDS),
      trials: global.SakurayoTrials ? global.SakurayoTrials.normalize(incoming.trials) : (incoming.trials || { receipts: {}, best: {} }),
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

  function hasFusion(save, school) {
    var shop = normalizeOps((save && save.shop40) || {});
    var id = String(school || "");
    if (!id) return false;
    return FUSION_CARDS.some(function (card) {
      return (card.pair || []).indexOf(id) >= 0 && (shop.ops.owned[card.id] || 0) > 0;
    });
  }

  function preferSsrFulfill(card) {
    if (!card || card.kind === "scrap") return false;
    if (card.kind === "fusion") return true;
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

  function applyPull(ops, rng, list, shardHost, forceSsr) {
    var want = forceSsr ? "SSR" : rollWant(ops, rng);
    var rarity = downgradeRarity(want, list);
    var focusCard = ops.focusId ? cardOf(ops.focusId) : null;
    if (focusCard && !list.some(function (c) { return c.id === focusCard.id; })) focusCard = null;
    var card = null;
    var hitFocus = false;
    if (focusCard && (rarity === focusCard.r || (want === "SSR" && focusCard.r === "SSR"))) {
      if ((ops.fatePoints || 0) >= 1) {
        card = focusCard;
        ops.fatePoints = 0;
        hitFocus = true;
      } else if (rng() < 0.5) {
        card = focusCard;
        ops.fatePoints = 0;
        hitFocus = true;
      } else {
        card = pickOfRarity(rarity, rng, list, ops.owned, want);
        if (card && card.id === focusCard.id) {
          ops.fatePoints = 0;
          hitFocus = true;
        } else {
          ops.fatePoints = 1;
        }
      }
    } else {
      card = pickOfRarity(rarity, rng, list, ops.owned, want);
    }
    if (!card) return null;
    ops.pity += 1;
    ops.pitySR += 1;
    var pullAtPity = ops.pity;
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
    var row = { id: card.id, r: card.r, n: card.n, pity: ops.pity, pullAtPity: pullAtPity, isNew: prev === 0, kind: card.kind || "", legend: !!card.legend, hitFocus: hitFocus };
    if (!Array.isArray(ops.history)) ops.history = [];
    ops.history.unshift(row);
    if (ops.history.length > 40) ops.history.length = 40;
    return row;
  }

  function pull(save, count, rng, poolId) {
    var n = count === 10 ? 10 : 1;
    var cost = n === 10 ? RATES.ten : RATES.single;
    if (!save || typeof save !== "object") return { ok: false, reason: "save", results: [] };
    save.shop40 = normalizeOps(save.shop40 || {});
    var pool = poolId || save.shop40.ops.pool || "remnant";
    if (POOL_IDS.indexOf(pool) < 0) pool = "remnant";
    var list = cardsForPool(pool);
    var coins = save.coins;
    if (!list.length) {
      return { ok: false, reason: "empty", results: [], coins: coins, pool: pool, pity: save.shop40.ops.pity, pitySR: save.shop40.ops.pitySR, owned: save.shop40.ops.owned };
    }
    var tickets = Math.max(0, Number(save.wishTickets46) || 0), useTicket = tickets >= n; // 内测寻访券：够数时优先用券
    if (!useTicket && coins < cost) {
      return { ok: false, reason: "coins", results: [], coins: coins, pool: pool, pity: save.shop40.ops.pity, pitySR: save.shop40.ops.pitySR, owned: save.shop40.ops.owned };
    }
    var rand = typeof rng === "function" ? rng : Math.random;
    var state = poolState(save.shop40.ops, pool);
    var shardHost = pool === "remnant" ? save.shop40.ops : state;
    var results = [];
    for (var i = 0; i < n; i++) {
      var row = applyPull(state, rand, list, shardHost, false);
      if (row) results.push(row);
    }
    if (n === 10) state.tenPulls += 1;
    state.last = results.slice();
    if (useTicket) save.wishTickets46 = tickets - n; else save.coins = coins - cost;
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
      focusId: state.focusId || "",
      fatePoints: state.fatePoints || 0,
    };
  }

  var NOVICE_COST = 1150;
  function pullNovice(save, rng) {
    if (!save || typeof save !== "object") return { ok: false, reason: "save", results: [] };
    save.shop40 = normalizeOps(save.shop40 || {});
    var ops = save.shop40.ops;
    if ((ops.noviceUsed || 0) >= 2) {
      return { ok: false, reason: "limit", results: [], coins: save.coins, noviceUsed: ops.noviceUsed };
    }
    var tickets = Math.max(0, Number(save.wishTickets46) || 0), useTicket = tickets >= 8;
    if (!useTicket && save.coins < NOVICE_COST) {
      return { ok: false, reason: "coins", results: [], coins: save.coins, noviceUsed: ops.noviceUsed };
    }
    var rand = typeof rng === "function" ? rng : Math.random;
    var list = cardsForPool("remnant");
    var isFirstNovice = (ops.noviceUsed || 0) === 0;
    var results = [];
    var hasSsrInBatch = false;
    for (var i = 0; i < 10; i++) {
      var forceSsr = isFirstNovice && i === 9 && !hasSsrInBatch;
      var row = applyPull(ops, rand, list, ops, forceSsr);
      if (row) {
        if (row.r === "SSR" || row.legend) hasSsrInBatch = true;
        results.push(row);
      }
    }
    ops.tenPulls += 1;
    ops.noviceUsed = clampInt((ops.noviceUsed || 0) + 1, 0, 2);
    ops.last = results.slice();
    if (useTicket) save.wishTickets46 = tickets - 8; else save.coins = save.coins - NOVICE_COST;
    return {
      ok: true,
      novice: true,
      noviceUsed: ops.noviceUsed,
      results: results,
      coins: save.coins,
      pool: "remnant",
      pity: ops.pity,
      pitySR: ops.pitySR,
      owned: ops.owned,
      pulls: ops.pulls,
      tenPulls: ops.tenPulls,
      shards: ops.shards,
    };
  }

  function setFocus(save, poolId, cardId) {
    if (!save || typeof save !== "object") return { ok: false, reason: "save" };
    save.shop40 = normalizeOps(save.shop40 || {});
    var pool = poolId || save.shop40.ops.pool || "remnant";
    if (POOL_IDS.indexOf(pool) < 0) pool = "remnant";
    var state = poolState(save.shop40.ops, pool);
    if (!cardId) {
      state.focusId = "";
      state.fatePoints = 0;
      return { ok: true, pool: pool, focusId: "", fatePoints: 0 };
    }
    var list = cardsForPool(pool);
    var target = null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === cardId) { target = list[i]; break; }
    }
    if (!target || (target.r !== "SSR" && target.r !== "SR")) {
      return { ok: false, reason: "card", pool: pool };
    }
    if (state.focusId !== target.id) {
      state.focusId = target.id;
      state.fatePoints = 0;
    }
    return { ok: true, pool: pool, focusId: state.focusId, fatePoints: state.fatePoints, n: target.n, r: target.r };
  }

  /* 本命契约（移植 #33 设计，重写）：从已回收的流派 / 转职 / 融合卡里选一张缔结。
   * 只影响开局（自动习得该流派一张入门技）和该流派的刷新权重 ×1.25，不加面板数值。 */
  var PACT_KINDS = { school: 1, job: 1, fusion: 1 };
  var PACT_MUL = 1.25;
  function pactOf(save) {
    var ops = save && save.shop40 && save.shop40.ops;
    var id = ops && ops.pact;
    var card = id && cardOf(id);
    if (!card || !PACT_KINDS[card.kind] || !((ops.owned || {})[id] > 0)) return null;
    return { id: id, n: card.n, kind: card.kind, face: card.face || "", schools: card.kind === "fusion" ? (card.pair || []).slice() : [card.school] };
  }
  function setPact(save, id) {
    if (!save || typeof save !== "object") return { ok: false, reason: "save" };
    save.shop40 = normalizeOps(save.shop40 || {});
    var ops = save.shop40.ops;
    if (!id) { ops.pact = ""; return { ok: true, pact: "" }; }
    var card = cardOf(id);
    if (!card || !PACT_KINDS[card.kind]) return { ok: false, reason: "card" };
    if (!((ops.owned || {})[id] > 0)) return { ok: false, reason: "owned" };
    ops.pact = ops.pact === id ? "" : id;
    return { ok: true, pact: ops.pact };
  }
  function pactMul(save, school) {
    var p = pactOf(save);
    return p && school && p.schools.indexOf(school) >= 0 ? PACT_MUL : 1;
  }
  /* 共鸣星级：重复回收只点亮星与卡框，不加任何数值（守住「收藏不增加战斗属性」）。 */
  function starOf(count) {
    return Math.max(0, Math.min(5, Math.floor(Number(count) || 0)));
  }
  function starRow(count) {
    var n = starOf(count), out = "";
    for (var i = 0; i < 5; i++) out += i < n ? "★" : "☆";
    return out;
  }

  function schoolMultipliers(save) {
    var out = [];
    Object.keys(SCHOOL_LABEL).forEach(function (sid) {
      var mul = 1;
      if (hasSchool(save, sid)) mul *= 1.3;
      if (hasJob(save, sid)) mul *= 1.5;
      if (hasFusion(save, sid)) mul *= 1.6;
      mul *= pactMul(save, sid);
      if (mul > 1.01) {
        out.push({ school: sid, name: SCHOOL_LABEL[sid], mul: Number(mul.toFixed(2)) });
      }
    });
    return out;
  }

  function grantCheat(save) {
    if (!save || typeof save !== "object") return { coins: 0, cheatUsed: 0 };
    save.shop40 = normalizeOps(save.shop40 || {});
    save.coins = save.coins + RATES.cheat;
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
      rosterFilter: ops.rosterFilter || "all",
      focusId: ops.focusId || "",
      fatePoints: ops.fatePoints || 0,
      noviceUsed: ops.noviceUsed || 0,
      history: (ops.history || []).slice(),
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
      coins: save ? save.coins : 0,
      wishTickets: save ? Math.max(0, Number(save.wishTickets46) || 0) : 0,
      cheatUsed: !!ops.cheatUsed,
    };
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

  var POOL_META = Object.freeze({
    remnant: { tab: "残片", kind: "常驻寻访", name: "镜界寻访", time: "常驻卡池 · 不限时" },
    fashion: { tab: "时装", kind: "时装寻访", name: "衣橱回响", time: "常驻卡池 · 不限时" },
    weapon: { tab: "武器", kind: "武器寻访", name: "兵装回收", time: "常驻卡池 · 不限时" }
  });

  function featuredCard(pool, focusId) {
    if (focusId) {
      var focused = cardOf(focusId);
      if (focused) return focused;
    }
    var list = cardsForPool(pool) || [];
    for (var i = 0; i < list.length; i++) if (list[i].legend) return list[i];
    for (var j = 0; j < list.length; j++) if (list[j].r === "SSR") return list[j];
    return list[0] || null;
  }

  function escapeHtml(v) {
    return String(v == null ? "" : v).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }

  function cardHeroTag(card) {
    if (!card) return "all";
    if (card.face) return card.face;
    if (card.hero) return card.hero;
    var id = String(card.id || "");
    if (id.indexOf("sayo") >= 0 || card.school === "gun" || card.school === "mech" || card.school === "mage" || card.school === "star") return "sayo";
    if (id.indexOf("aya") >= 0 || card.school === "shrine" || card.school === "alch" || card.school === "ward" || card.school === "puppet") return "aya";
    if (id.indexOf("rion") >= 0 || card.school === "sword" || card.school === "vamp" || card.school === "cult" || card.school === "ice") return "rion";
    return "all";
  }

  function cardTendencyText(card) {
    if (!card) return "";
    if (card.kind === "school" && card.school) return (SCHOOL_LABEL[card.school] || card.school) + "流派倾向 ×1.3";
    if (card.kind === "job" && card.school) return (SCHOOL_LABEL[card.school] || card.school) + "流派倾向 ×1.5";
    if (card.kind === "fusion" && Array.isArray(card.pair)) {
      return card.pair.map(function (s) { return SCHOOL_LABEL[s] || s; }).join(" + ") + " 倾向 ×1.6";
    }
    if (card.kind === "fashion" && card.school) return "穿戴时" + (SCHOOL_LABEL[card.school] || card.school) + "流派倾向 ×1.3";
    return "纯外观与证词收藏";
  }

  function bindWishSheet(host, pool, state, save, handlers) {
    var sheet = host.querySelector("#gachaSheet46");
    if (!sheet) return;
    function open(html) {
      sheet.innerHTML = '<div class="wishSheetCard46">' + html + '<button type="button" class="wishSheetClose46">知道了</button></div>';
      sheet.classList.remove("hidden");
      hideBrokenArt(sheet);
      var closeBtn = sheet.querySelector(".wishSheetClose46");
      if (closeBtn) closeBtn.onclick = function () { sheet.classList.add("hidden"); };
    }
    sheet.onclick = function (e) { if (e.target === sheet) sheet.classList.add("hidden"); };
    var info = host.querySelector("#gachaInfo46"),
      log = host.querySelector("#gachaLog46"),
      focusBtn = host.querySelector("#gachaFocusBtn46"),
      sparkBtn = host.querySelector("#gachaSparkShop46"),
      noviceBtn = host.querySelector("#gachaNovice46");
    if (info) info.onclick = function () {
      var curPity = (state && state.pity) || 0;
      var curSsrPct = (ssrRate(curPity) * 100).toFixed(1);
      var poolCards = cardsForPool(pool);
      var ssrCount = poolCards.filter(function (c) { return c.r === "SSR"; }).length;
      var srCount = poolCards.filter(function (c) { return c.r === "SR"; }).length;
      open("<h4>寻访详情</h4><ul>" +
        "<li>证人（SSR）基础概率 " + (RATES.SSR * 100).toFixed(1) + "%，第 " + RATES.softPity + " 抽起提升，" + RATES.pitySSR + " 抽必出（当前下一抽实时概率：<b style=\"color:#ffd77a\">" + curSsrPct + "%</b>）</li>" +
        "<li>稀有（SR）基础概率 " + (RATES.SR * 100).toFixed(1) + "%，每 " + RATES.pitySR + " 抽至少一张</li>" +
        "<li>R " + (RATES.R * 100).toFixed(0) + "% · N " + (RATES.N * 100).toFixed(0) + "%（本池含 SSR " + ssrCount + " 张 · SR " + srCount + " 张）</li>" +
        "<li>命定定轨：点击主界面 UP 胶囊可自选定轨目标，出对应稀有度时 50% 概率命中；若未命中获 1 点命定值，下次必出定轨卡</li>" +
        "<li>每抽获得碎镜片 " + RATES.shardPull + "，重复卡 +" + RATES.shardDupe + "；集满 " + RATES.spark + " 可兑换指定卡</li>" +
        "<li>收藏不增加战斗属性</li></ul>");
    };
    if (log) log.onclick = function () {
      var hist = (state && Array.isArray(state.history) && state.history.length) ? state.history : (state && Array.isArray(state.last)) ? state.last : [];
      var rowsHtml = "";
      if (hist.length) {
        rowsHtml = '<div class="wishLogList46">' + hist.slice(0, 30).map(function (h) {
          var badge = h.legend ? "传说" : h.r || "N";
          return '<div class="wishLogRow46 r-' + (h.r || "N") + '"><span><b>[' + badge + ']</b> ' + escapeHtml(h.n || h.id) + (h.isNew ? ' <em style="color:#78ffb0;font-style:normal">NEW</em>' : "") + (h.hitFocus ? ' <em style="color:#ffd77a;font-style:normal">定轨命中</em>' : "") + '</span><small>' + (h.pullAtPity ? "第 " + h.pullAtPity + " 抽" : "近期回收") + "</small></div>";
        }).join("") + "</div>";
      } else {
        rowsHtml = '<p style="color:#9db4cc">暂无近期寻访明细，开始寻访后将自动记录最近 40 条回收档案。</p>';
      }
      open("<h4>寻访记录</h4><p>" + (POOL_META[pool] || POOL_META.remnant).name + " 累计 " + ((state && state.pulls) || 0) + " 次 · 当前保底计数 " + ((state && state.pity) || 0) + " / " + RATES.pitySSR + (state && state.focusId ? " · 命定值 " + (state.fatePoints || 0) + " / 1" : "") + "</p>" + rowsHtml);
    };
    function openFocusSheet(filterChar) {
      var curChar = filterChar || "all";
      var candidates = cardsForPool(pool).filter(function (c) {
        return (c.r === "SSR" || c.r === "SR") && c.kind !== "scrap";
      });
      var filtered = curChar === "all" ? candidates : candidates.filter(function (c) { return cardHeroTag(c) === curChar; });
      var curFocus = (state && state.focusId) || "";
      var html = "<h4>命定定轨 · 自选 UP 目标</h4>" +
        "<p>选定目标后，抽出同稀有度卡时 <b>50%</b> 概率直接为定轨卡；若歪出其他卡则命定值 <b>+1（上限 1/1）</b>，下次必出定轨目标！收藏不增加战斗属性。</p>" +
        '<div class="wishFocusFilter46">' +
        '<button type="button" data-fchar="all"' + (curChar === "all" ? ' class="on"' : "") + ">全部 (" + candidates.length + ")</button>" +
        '<button type="button" data-fchar="sayo"' + (curChar === "sayo" ? ' class="on"' : "") + ">月城小夜</button>" +
        '<button type="button" data-fchar="aya"' + (curChar === "aya" ? ' class="on"' : "") + ">神代绫</button>" +
        '<button type="button" data-fchar="rion"' + (curChar === "rion" ? ' class="on"' : "") + ">黑羽凛音</button>" +
        (curFocus ? '<button type="button" data-fclear="1">取消定轨</button>' : "") +
        "</div>" +
        '<div class="wishFocusGrid46">' +
        filtered.map(function (c) {
          var count = (state && state.owned && state.owned[c.id]) || 0;
          var isOn = curFocus === c.id;
          return '<button type="button" class="wishFocusItem46' + (isOn ? " on" : "") + '" data-focus-pick="' + c.id + '">' +
            '<img data-art alt="" src="' + artSrc(handlers, "gacha/" + c.id + ".webp") + '">' +
            "<b>[" + c.r + "] " + escapeHtml(c.n) + "</b>" +
            "<small>" + escapeHtml(cardTendencyText(c)) + "</small>" +
            "<small>" + (isOn ? "🎯 当前定轨" : count > 0 ? "已回收 ×" + count : "未回收") + "</small>" +
            "</button>";
        }).join("") +
        "</div>";
      open(html);
      var fbtns = sheet.querySelectorAll("[data-fchar]");
      for (var fi = 0; fi < fbtns.length; fi++) {
        fbtns[fi].onclick = function () { openFocusSheet(this.getAttribute("data-fchar")); };
      }
      var clearBtn = sheet.querySelector("[data-fclear]");
      if (clearBtn) {
        clearBtn.onclick = function () {
          setFocus(save, pool, "");
          sheet.classList.add("hidden");
          if (handlers && typeof handlers.setFocus === "function") handlers.setFocus(pool, "");
          else renderGacha(host, save, handlers);
        };
      }
      var picks = sheet.querySelectorAll("[data-focus-pick]");
      for (var pk = 0; pk < picks.length; pk++) {
        picks[pk].onclick = function () {
          var cid = this.getAttribute("data-focus-pick");
          setFocus(save, pool, cid);
          sheet.classList.add("hidden");
          if (handlers && typeof handlers.setFocus === "function") handlers.setFocus(pool, cid);
          else renderGacha(host, save, handlers);
        };
      }
    }
    if (focusBtn) focusBtn.onclick = function () { openFocusSheet("all"); };
    if (sparkBtn) sparkBtn.onclick = function () {
      var curShards = pool === "remnant" ? (save && save.shop40 && save.shop40.ops && save.shop40.ops.shards) || 0 : (state && state.shards) || 0;
      var ssrList = cardsForPool(pool).filter(function (c) { return (c.legend || c.r === "SSR") && c.kind !== "scrap"; });
      var html = "<h4>碎镜工坊 · 指定证人兑换</h4>" +
        "<p>当前碎镜片：<b>" + curShards + " / " + RATES.spark + "</b>（每抽 +1，重复卡 +8）。集满 " + RATES.spark + " 枚可直接指定兑换任意未拥有的证人 SSR 卡。收藏不增加战斗属性。</p>" +
        '<div class="wishSparkGrid46">' +
        ssrList.map(function (c) {
          var owned = ((state && state.owned && state.owned[c.id]) || 0) > 0;
          var canSpark = !owned && curShards >= RATES.spark;
          return '<button type="button" class="wishFocusItem46' + (canSpark ? " on" : "") + '" data-workshop-spark="' + c.id + '"' + (owned || !canSpark ? " disabled" : "") + ">" +
            '<img data-art alt="" src="' + artSrc(handlers, "gacha/" + c.id + ".webp") + '">' +
            "<b>" + escapeHtml(c.n) + "</b>" +
            "<small>" + escapeHtml(cardTendencyText(c)) + "</small>" +
            "<small>" + (owned ? "✓ 已点亮" : canSpark ? "💎 200 碎镜兑换" : "需 200 碎镜片") + "</small>" +
            "</button>";
        }).join("") +
        "</div>";
      open(html);
      var sbtns = sheet.querySelectorAll("[data-workshop-spark]");
      for (var si = 0; si < sbtns.length; si++) {
        sbtns[si].onclick = function () {
          var id = this.getAttribute("data-workshop-spark");
          sheet.classList.add("hidden");
          if (handlers && typeof handlers.spark === "function") handlers.spark(id);
          else {
            spark(save, pool, id);
            renderGacha(host, save, handlers);
          }
        };
      }
    };
    if (noviceBtn) noviceBtn.onclick = function () {
      var used = (save && save.shop40 && save.shop40.ops && save.shop40.ops.noviceUsed) || 0;
      var left = Math.max(0, 2 - used);
      var html = "<h4>初夜迎新 · 新手特惠十连</h4>" +
        "<p>迎新特惠：前 2 次十连享 <b>8 折（" + NOVICE_COST + " 樱花币 或 8 张寻访券）</b>，且<b>首次迎新十连必出至少 1 张 SSR 证人/融合卡</b>！当前剩余次数：<b>" + left + " / 2</b>。收藏不增加战斗属性。</p>" +
        (left > 0
          ? '<div class="wishSheetActions46"><button type="button" class="wishSheetCancel46">稍后再说</button><button type="button" class="wishSheetClose46" id="gachaNoviceConfirm46">立即迎新十连（' + NOVICE_COST + '）</button></div>'
          : "");
      sheet.innerHTML = '<div class="wishSheetCard46">' + html + (left <= 0 ? '<button type="button" class="wishSheetClose46">知道了</button>' : "") + "</div>";
      sheet.classList.remove("hidden");
      var cancel = sheet.querySelector(".wishSheetCancel46");
      if (cancel) cancel.onclick = function () { sheet.classList.add("hidden"); };
      var closeOrGo = sheet.querySelector(".wishSheetClose46");
      if (closeOrGo) {
        closeOrGo.onclick = function () {
          sheet.classList.add("hidden");
          if (left > 0) {
            if (handlers && typeof handlers.pullNovice === "function") handlers.pullNovice();
            else {
              var res = pullNovice(save);
              renderGacha(host, save, handlers);
              if (res && res.ok) showReveal(res.results, handlers);
            }
          }
        };
      }
    };
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
    var tickets = info.wishTickets || 0;
    var ssrLeft = Math.max(0, RATES.pitySSR - pity);
    var srLeft = Math.max(0, RATES.pitySR - pitySR);
    var ssrPct = Math.max(0, Math.min(100, Math.round((pity / RATES.pitySSR) * 100)));
    var srPct = Math.max(0, Math.min(100, Math.round((pitySR / RATES.pitySR) * 100)));
    var empty = !cardsForPool(pool).length;
    var poor1 = (tickets < 1 && info.coins < RATES.single) || empty;
    var poor10 = (tickets < 10 && info.coins < RATES.ten) || empty;
    var sub = "收藏不增加战斗属性 · " + (pool === "fashion" ? "时装装备保留展示与标注倾向" : pool === "weapon" ? "武器装备仅作收藏展示" : "职业卡仅影响标注流派倾向");
    var meta = POOL_META[pool] || POOL_META.remnant;
    var focusId = state.focusId || "";
    var fatePoints = state.fatePoints || 0;
    var up = featuredCard(pool, focusId);
    var coinIcon = '<img class="wishCoin46" data-art alt="" src="' + artSrc(handlers, "gacha/v4/icon_coin.webp") + '">';
    var shardIcon = '<img class="wishCoin46" data-art alt="" src="' + artSrc(handlers, "gacha/v4/icon_shard.webp") + '">';
    var tabHtml = "";
    for (var pi = 0; pi < POOL_IDS.length; pi++) {
      var pid = POOL_IDS[pi], pm = POOL_META[pid];
      tabHtml += '<button type="button" data-pool="' + pid + '"' + (pool === pid ? ' class="on" aria-current="true"' : "") + "><b>" + pm.tab + "</b><small>" + pm.kind + "</small></button>";
    }
    var noviceLeft = Math.max(0, 2 - (info.noviceUsed || 0));
    host.innerHTML =
      '<div class="wishStage46 wishV2">' +
      '<img class="wishBanner46" data-art alt="" src="' + artSrc(handlers, "gacha/v4/banner_" + pool + ".webp") + '">' +
      '<div class="wishShade46" aria-hidden="true"></div>' +
      '<img class="wishHero46" data-art alt="" src="' + artSrc(handlers, "gacha/v4/up_" + (pool === "fashion" ? "crown" : hero) + ".webp") + '">' +
      '<div class="wishPetals46">' + petalMarks() + "</div>" +
      '<nav class="wishTabs46" id="gachaTabs46" aria-label="卡池">' + tabHtml + "</nav>" +
      '<div class="wishWallet46" aria-label="货币">' +
      coinIcon + "<b>" + info.coins + "</b>" +
      (tickets > 0 ? '<span class="wishTicketPill46">🎫 寻访券 ×' + tickets + "</span>" : "") +
      '<span class="wishShardPill46">' + shardIcon + '碎镜片 ' + shards + " / " + RATES.spark + "</span></div>" +
      '<div class="wishTitle46"><span class="wishTag46">' + meta.kind + "</span><h3>" + meta.name + "</h3>" +
      (up ? '<div class="wishUp46" id="gachaFocusBtn46" role="button" tabindex="0" title="点击切换定轨 UP 目标"><em>' + (focusId ? "定轨" : "UP") + "</em><b>" + escapeHtml(up.n) + "</b><i>" + up.r + "</i>" + (focusId ? '<span class="fateBadge46' + (fatePoints >= 1 ? " full" : "") + '">命定 ' + fatePoints + "/1</span>" : '<span class="fateBadge46">切换定轨</span>') + "</div>" : "") +
      "<p>" + sub + '</p><small class="wishTime46">' + meta.time + "</small></div>" +
      '<div class="wishPity46"><div class="pityRow46"><span>距证人保底还有 ' + ssrLeft + ' 抽</span><div class="pityRail46"><i style="width:' + ssrPct + '%"></i></div></div><div class="pityRow46 sr"><span>距稀有保底还有 ' + srLeft + ' 抽</span><div class="pityRail46"><i style="width:' + srPct + '%"></i></div></div></div>' +
      '<div class="wishLinks46"><button type="button" id="gachaInfo46">详情</button><button type="button" id="gachaLog46">记录</button><button type="button" id="gachaSparkShop46">工坊</button>' +
      (pool === "remnant" && noviceLeft > 0 ? '<button type="button" id="gachaNovice46">迎新8折</button>' : "") +
      '<span class="wishPills46"><b>已寻访 ' + pulls + "</b><b>软保 " + RATES.softPity + "</b></span></div>" +
      '<div class="wishDock46">' +
      '<div class="gachaActions46"><button type="button" id="gachaPull1"' + (poor1 ? ' class="poor"' : "") + "><span>单次寻访</span><small>" + (tickets >= 1 ? "🎫 寻访券 ×1" : coinIcon + RATES.single) + '</small></button><button type="button" id="gachaPull10"' + (poor10 ? ' class="poor"' : "") + "><span>十连寻访</span><small>" + (tickets >= 10 ? "🎫 寻访券 ×10" : coinIcon + RATES.ten) + "</small></button></div>" +
      sparkRow(pool, state, shards) +
      "</div>" +
      '<div class="wishSheet46 hidden" id="gachaSheet46" role="dialog" aria-modal="true"></div>' +
      "</div>";
    bindWishSheet(host, pool, state, save, handlers);
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
        var go = function () {
          if (handlers && typeof handlers.spark === "function") handlers.spark(id);
          else {
            spark(save, pool, id);
            renderGacha(host, save, handlers);
          }
        };
        var sheet = host.querySelector("#gachaSheet46");
        var card = cardOf(id);
        if (!sheet || shards < RATES.spark || !card) return go();
        sheet.innerHTML = '<div class="wishSheetCard46"><h4>确认兑换</h4><p>消耗碎镜片 ' + RATES.spark + " 兑换「" + escapeHtml(card.n) + "」？此操作不可撤销。</p>" +
          '<div class="wishSheetActions46"><button type="button" class="wishSheetCancel46">取消</button><button type="button" class="wishSheetClose46">确认兑换</button></div></div>';
        sheet.classList.remove("hidden");
        sheet.querySelector(".wishSheetCancel46").onclick = function () { sheet.classList.add("hidden"); };
        sheet.querySelector(".wishSheetClose46").onclick = function () { sheet.classList.add("hidden"); go(); };
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
    if (peek) global.SakurayoUI.close(peek);
  }

  function showRosterPeek(card, locked, count, handlers, tab, source, containerOverride) {
    if (!global.document) return;
    var drawer = containerOverride || global.document.getElementById("rosterDrawer") || global.document.getElementById("gachaDrawer");
    if (!drawer) return;
    closeRosterPeek();
    var overlay = global.document.createElement("div");
    overlay.id = "rosterPeek46";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "rosterPeekTitle46");
    var equipPool = card && (card.kind === "fashion" || card.kind === "weapon") ? card.kind : (tab === "fashion" || tab === "weapon" ? tab : "");
    var canEquip = !locked && !!equipPool;
    var canPact = !locked && card && PACT_KINDS[card.kind] && handlers && handlers.save;
    var pactNow = canPact && (pactOf(handlers.save) || {}).id === card.id;
    overlay.innerHTML =
      '<div class="rosterPeekCard46' +
      (locked ? " lock" : "") +
      '"><button type="button" id="rosterPeekClose46" aria-label="关闭卡片详情">×</button><img data-art alt="" src="' +
      artSrc(handlers, locked ? "gacha/card_back.webp" : "gacha/" + card.id + ".webp") +
      '"><div><b id="rosterPeekTitle46">' +
      (locked ? "未回收" : card.n) +
      "</b><em>" +
      rarityLabel(card.r, card.legend) +
      (card.legend ? " · 传说" : "") +
      (locked ? "" : " · ×" + count) +
      "</em>" +
      (locked ? "" : '<span class="rosterStars48 s' + starOf(count) + '" aria-label="共鸣 ' + starOf(count) + ' 星">' + starRow(count) + "</span>") +
      "<p>" +
      (locked ? "尚未回收。寻访点亮后才会露出立绘。" : loreText(card)) +
      "</p>" +
      (locked ? "" : '<p class="collectionRule46">收藏不增加战斗属性 · ' + card.d + (card.kind === "fashion" && card.school ? " 装备时" + (SCHOOL_LABEL[card.school] || card.school) + "流派倾向 ×1.3。" : "") + "</p>") +
      (canEquip ? '<button type="button" class="rosterEquip46" data-equip="' + card.id + '">装备</button>' : "") +
      (canPact ? '<button type="button" class="rosterEquip46 rosterPact48' + (pactNow ? " on" : "") + '" data-pact="' + card.id + '">' + (pactNow ? "解除本命契约" : "缔结本命契约") + "</button>" + '<small class="rosterPactHint48">本命：开局习得该流派入门技，刷新倾向 ×1.25</small>' : "") +
      "</div></div>";
    overlay.onclick = function (event) {
      if (event && event.target === overlay) closeRosterPeek();
    };
    var close = overlay.querySelector("#rosterPeekClose46");
    if (close) close.onclick = closeRosterPeek;
    var eq = overlay.querySelector("[data-equip]");
    if (eq) {
      eq.onclick = function (ev) {
        if (ev && ev.stopPropagation) ev.stopPropagation();
        if (handlers && typeof handlers.equip === "function") handlers.equip(equipPool, card.id);
        else equip(handlers && handlers.save, equipPool, card.id);
        closeRosterPeek();
      };
    }
    var pb = overlay.querySelector("[data-pact]");
    if (pb) {
      pb.onclick = function (ev) {
        if (ev && ev.stopPropagation) ev.stopPropagation();
        closeRosterPeek();
        var r = typeof handlers.pact === "function" ? handlers.pact(card.id) : setPact(handlers.save, card.id);
        if (typeof global.SakurayoSfx === "function") global.SakurayoSfx(r && r.pact ? "revealSR" : "flip");
      };
    }
    drawer.appendChild(overlay);
    hideBrokenArt(overlay);
    global.SakurayoUI.open(overlay, {
        nested: true,
        initialFocus: close,
        returnFocus: source,
        onClose: function () {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }
      });

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
    closeRosterPeek();
    var info = snapshot(save);
    var tab = info.rosterTab || "scrap";
    var filter = info.rosterFilter || "all";
    var list = rosterList(tab);
    var ownedMap = rosterOwned(info, tab);
    var got = 0;
    list.forEach(function (card) { if ((ownedMap[card.id] || 0) > 0) got += 1; });
    var visibleList = list;
    if (tab !== "chronicle" && tab !== "scrap" && filter !== "all") {
      if (filter === "owned") {
        visibleList = list.filter(function (c) { return (ownedMap[c.id] || 0) > 0; });
      } else if (filter === "missing") {
        visibleList = list.filter(function (c) { return (ownedMap[c.id] || 0) < 1; });
      } else {
        visibleList = list.filter(function (c) { return cardHeroTag(c) === filter; });
      }
    }
    var muls = schoolMultipliers(save);
    var resonanceHtml = '<div class="rosterResonance46"><span><b>流派共鸣倾向</b>（收藏不增加战斗属性，仅提高局内对应流派升级卡出现权重）：</span>' +
      (muls.length
        ? muls.map(function (m) { return "<em>" + m.name + " ×" + m.mul + "</em>"; }).join("")
        : "<em>暂未激活额外流派倾向</em>") +
      "</div>";
    var filterHtml = (tab !== "chronicle" && tab !== "scrap")
      ? '<div class="rosterFilter46" id="rosterFilter46">' +
        '<button type="button" data-rfilter="all"' + (filter === "all" ? ' class="on"' : "") + ">全部</button>" +
        '<button type="button" data-rfilter="sayo"' + (filter === "sayo" ? ' class="on"' : "") + ">月城小夜</button>" +
        '<button type="button" data-rfilter="aya"' + (filter === "aya" ? ' class="on"' : "") + ">神代绫</button>" +
        '<button type="button" data-rfilter="rion"' + (filter === "rion" ? ' class="on"' : "") + ">黑羽凛音</button>" +
        '<button type="button" data-rfilter="owned"' + (filter === "owned" ? ' class="on"' : "") + ">已点亮</button>" +
        '<button type="button" data-rfilter="missing"' + (filter === "missing" ? ' class="on"' : "") + ">未回收</button>" +
        "</div>"
      : "";
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
      var pactId = (pactOf(save) || {}).id || "";
      wall = visibleList.map(function (card) {
        var count = ownedMap[card.id] || 0;
        var locked = count < 1 && DEFAULT_SHOWN.indexOf(card.id) < 0;
        var mark = card.legend ? "LEGEND" : card.r;
        var stars = locked ? 0 : starOf(count);
        var isPact = !locked && pactId === card.id;
        return (
          '<button type="button" class="rosterSlot46 r-' +
          mark +
          (locked ? " lock" : "") +
          (stars >= 3 ? " star3" : "") +
          (stars >= 5 ? " star5" : "") +
          (isPact ? " pact48" : "") +
          '" data-card="' +
          card.id +
          '"><div class="rosterArt46"><img data-art alt="" src="' +
          artSrc(handlers, locked ? "gacha/card_back.webp" : "gacha/" + card.id + ".webp") +
          '"><i>' +
          (card.legend ? "传说" : card.r) +
          "</i>" +
          (locked ? '<em class="rosterVeil46">未回收</em>' : "") +
          (isPact ? '<em class="rosterPactTag48">本命</em>' : "") +
          (stars > 1 ? '<span class="rosterStars48 s' + stars + '">' + starRow(count) + "</span>" : "") +
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
      resonanceHtml +
      '<div class="rosterTabs46" id="rosterTabs46">' +
      '<button type="button" data-roster="scrap"' + (tab === "scrap" ? ' class="on"' : "") + ">残件</button>" +
      '<button type="button" data-roster="school"' + (tab === "school" ? ' class="on"' : "") + ">基础</button>" +
      '<button type="button" data-roster="job"' + (tab === "job" ? ' class="on"' : "") + ">转职</button>" +
      '<button type="button" data-roster="fusion"' + (tab === "fusion" ? ' class="on"' : "") + ">融合</button>" +
      '<button type="button" data-roster="fashion"' + (tab === "fashion" ? ' class="on"' : "") + ">时装</button>" +
      '<button type="button" data-roster="weapon"' + (tab === "weapon" ? ' class="on"' : "") + ">武器</button>" +
      '<button type="button" data-roster="chronicle"' + (tab === "chronicle" ? ' class="on"' : "") + ">编年</button>" +
      "</div>" +
      filterHtml +
      '<div id="rosterWall46">' +
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
    var rfilters = host.querySelectorAll("#rosterFilter46 [data-rfilter]");
    for (var rf = 0; rf < rfilters.length; rf++) {
      rfilters[rf].onclick = function () {
        var nf = this.getAttribute("data-rfilter") || "all";
        save = save || {};
        save.shop40 = normalizeOps(save.shop40 || {});
        save.shop40.ops.rosterFilter = nf;
        renderRoster(host, save, handlers);
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
          showRosterPeek(card, locked, count, handlers, tab, node);
        };
      })(slots[i]);
    }
    return info;
  }

  function obtainCard(items) {
    for (var i = 0; i < items.length; i++) {
      var card = cardOf(items[i].id) || items[i];
      var rarity = items[i].r || card.r || "";
      var legend = !!(items[i].legend || card.legend || rarity === "LEGEND");
      if (!(legend || rarity === "SSR")) continue;
      var face = card.face || "";
      if (face === "sayo" || face === "aya" || face === "rion") return { face: face, card: card, legend: legend };
    }
    return null;
  }
  function obtainFace(items) {
    var o = obtainCard(items);
    return o ? o.face : "";
  }

  var FACE_NAME = { sayo: "月城小夜", aya: "神代绫", rion: "黑羽凛音" };
  /* 证人降临演出（横屏左右分栏）：竖版 PV 放左栏完整显示（contain，不裁人物），
   * 右栏是卡名 / 稀有度 / 角色 / 一句证词。整层叫 revealPv46，跳过按钮照旧能移除它。 */
  function playObtain(overlay, handlers, faceOrInfo, then) {
    var info = typeof faceOrInfo === "string" ? { face: faceOrInfo, card: null, legend: false } : faceOrInfo;
    var face = info.face;
    var probe = global.document.createElement("video");
    if (!probe || typeof probe.canPlayType !== "function") { then(); return; }
    var ext = !probe.canPlayType('video/mp4; codecs="avc1.42E01E"') && probe.canPlayType('video/webm; codecs="vp9"') ? ".webm" : ".mp4";
    var box = global.document.createElement("div");
    box.className = "revealPv46 revealPvSplit48" + (info.legend ? " legend" : "");
    var card = info.card || {};
    var lore = card.lore && card.lore.length ? card.lore[0] : "";
    box.innerHTML =
      '<div class="rpvStage48"><video muted playsinline></video><i class="rpvScan48"></i></div>' +
      '<div class="rpvInfo48"><small class="rpvTag48">' + (info.legend ? "LEGEND · 传说证人" : "SSR · 证人降临") + "</small>" +
      "<b>" + escapeHtml(card.n || FACE_NAME[face] || "") + "</b>" +
      "<em>" + escapeHtml(FACE_NAME[face] || "") + "</em>" +
      (lore ? "<p>" + escapeHtml(lore) + "</p>" : "") +
      '<span class="rpvHint48">点击任意处跳过</span></div>';
    var v = box.querySelector("video");
    v.muted = true;
    v.playsInline = true;
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      v.onended = null;
      v.onerror = null;
      try { v.pause(); } catch (err) {}
      if (box.parentNode) box.parentNode.removeChild(box);
      then();
    }
    box.pause = function () { try { v.pause(); } catch (err) {} };
    box.onclick = finish;
    v.onerror = finish;
    v.onended = finish;
    v.src = artSrc(handlers, "pv/gacha/" + face + ext);
    overlay.appendChild(box);
    var pr = v.play && v.play();
    if (pr && typeof pr.catch === "function") pr.catch(finish);
    else if (!pr) finish();
    global.setTimeout(finish, 9000);
  }

  function showReveal(results, handlers) {
    injectStyle();
    if (!global.document) return;
    var drawer = global.document.getElementById("gachaDrawer");
    if (!drawer) return;
    var items = Array.isArray(results) ? results : [];
    var old = global.document.getElementById("gachaReveal46");
    if (old) global.SakurayoUI.close(old);
    if (!items.length) return;
    var instant = testMode();
    var overlay = global.document.createElement("div");
    overlay.id = "gachaReveal46";
    if (instant) overlay.className = "isTest";
    var revealBg = artSrc(handlers, "gacha/v4/reveal_bg.webp");
    if (revealBg) overlay.style.backgroundImage = "linear-gradient(#05030bb3,#05030bcc),url(\"" + revealBg + "\")";
    overlay.style.backgroundSize = "cover";
    overlay.style.backgroundPosition = "center";
    var hasSsr = items.some(function (x) { return x && (x.r === "SSR" || x.legend || x.r === "LEGEND"); });
    var hasSr = !hasSsr && items.some(function (x) { return x && x.r === "SR"; });
    var omenClass = hasSsr ? "omen-SSR" : hasSr ? "omen-SR" : "omen-N";
    var omenText = hasSsr ? "✦ 终夜金虹 · 证人降临 ✦" : hasSr ? "◈ 紫电共鸣 · 稀有显现 ◈" : "❀ 夜樱寻访 · 残响回收 ❀";
    var gridClass = items.length > 1 ? "revealGrid46 ten" : "revealGrid46 one";
    overlay.innerHTML =
      '<div class="revealOmen46 ' + omenClass + '">' + omenText + "</div>" +
      '<div class="' +
      gridClass +
      '">' +
      items
        .map(function (item) {
          var card = cardOf(item.id) || item;
          var rarity = item.r || card.r || "N";
          var isNew = item.isNew !== false && !!item.isNew;
          var showDupe = item.isNew === false;
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
            (isNew ? '<span class="revealNew46">NEW</span>' : showDupe ? '<span class="revealDupe46">+' + RATES.shardDupe + ' 碎镜</span>' : "") +
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
    if (typeof global.SakurayoSfx === "function") {
      global.SakurayoSfx("pull");
      if (instant) { var best = overlay.querySelector(".r-SSR,.r-LEGEND") ? "revealSSR" : overlay.querySelector(".r-SR") ? "revealSR" : "flip"; global.SakurayoSfx(best); }
    }
    var cards = overlay.querySelectorAll(".revealCard46");
    function flipAll() {
      for (var c = 0; c < cards.length; c++) cards[c].classList.add("flipped");
    }
    for (var i = 0; i < cards.length; i++) {
      (function (node, delay) {
        function flip() {
          if (node.classList.contains("flipped")) {
            var cid = node.getAttribute("data-card");
            var cobj = cardOf(cid);
            if (cobj) showRosterPeek(cobj, false, 1, handlers, cobj.kind || "scrap", node, drawer);
            return;
          }
          node.classList.add("flipped");
          var sfx = global.SakurayoSfx;
          if (typeof sfx === "function") sfx(/r-(SSR|LEGEND)/.test(node.className) ? "revealSSR" : /r-SR/.test(node.className) ? "revealSR" : "flip");
        }
        node.onclick = flip;
      })(cards[i], i);
    }
    function scheduleFlips() {
      if (instant) return;
      for (var j = 0; j < cards.length; j++) {
        (function (node, delay) {
          setTimeout(function () {
            if (node.isConnected && node.onclick && !node.classList.contains("flipped")) node.onclick();
          }, 240 + delay * 110);
        })(cards[j], j);
      }
    }
    var obtain = instant ? null : obtainCard(items);
    if (obtain) playObtain(overlay, handlers, obtain, scheduleFlips);
    else scheduleFlips();
    var take = overlay.querySelector(".revealTake46");
    global.SakurayoUI.open(overlay, {nested:true,initialFocus:take,onClose:function(){
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }});
    if (take) {
      take.onclick = function () {
        global.SakurayoUI.close(overlay);
      };
    }
    var skip = overlay.querySelector(".revealSkip46");
    if (skip) skip.onclick = function () {
      var pv = overlay.querySelector(".revealPv46");
      if (pv) {
        pv.onended = null;
        pv.onerror = null;
        try { pv.pause(); } catch (err) {}
        if (pv.parentNode) pv.parentNode.removeChild(pv);
      }
      flipAll();
    };
    var again = overlay.querySelector(".revealAgain46");
    if (again) {
      again.onclick = function () {
        global.SakurayoUI.close(overlay);
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
    hasFusion: hasFusion,
    POOL_IDS: POOL_IDS,
    ROSTER_TABS: ROSTER_TABS,
    DEFAULT_SHOWN: DEFAULT_SHOWN,
    injectStyle: injectStyle,
    normalizeOps: normalizeOps,
    snapshot: snapshot,
    pull: pull,
    pullNovice: pullNovice,
    NOVICE_COST: NOVICE_COST,
    setFocus: setFocus,
    schoolMultipliers: schoolMultipliers,
    grantCheat: grantCheat,
    portraitTap: portraitTap,
    setPool: setPool,
    setRosterTab: setRosterTab,
    spark: spark,
    equip: equip,
    pactOf: pactOf,
    setPact: setPact,
    pactMul: pactMul,
    starOf: starOf,
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
