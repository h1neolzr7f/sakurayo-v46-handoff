/* 第一章「参道 —— 本神宣布」AVG 台词（docs/STORY.md v3 §3 第 1 层）。
   who：sayo / aya / rion / rin / miko 有立绘；yoi（宵）、tanuki（狸老板）立绘生成前只显示名字。
   bg/cg 为 art 相对路径。行 id 用于「已读快进」（v3-*）。 */
(function (global) {
  "use strict";
  var B1 = "story/ch1/bg_v3_pre.webp", B2 = "story/ch1/bg_v3_end.webp", E = "说书 · 狸老板", CG1 = "story/ch1/cg_rewind.webp", CG2 = "story/ch1/cg_ema.webp";
  var S = {
    "1-1": {
      pre: [
        { id: "v31-e01", chap: ["第一章", "你可听说过大食切"], bg: B2, style: "epic", name: E, t: "诸位看官——你可听说过，大食切的故事？" },
        { id: "v31-e02", style: "epic", name: E, t: "二百年前，百夜祭。有般若自樱夜山来，身高十丈，专食夜晚。夜被它吃一口，天便永不再亮。" },
        { id: "v31-e03", style: "epic", name: E, t: "黑羽流剑士千代，与铁炮手月城朔夜，迎战于参道。朔夜为护千代，被般若踏于足下，临终只道一句——「千代，刀要快。快到它来不及跑。」" },
        { id: "v31-e04", style: "epic", name: E, t: "千代不哭。她跃上般若之颈，一刀，一刀，燃尽刀身。最后一斩，连同半座樱夜山，一齐斩开。" },
        { id: "v31-e05", style: "epic", name: E, t: "斩何物，便名何刀。斩童子者名童子切，斩雷者名雷切。此刀本当名「百夜切」——" },
        { id: "v31-e06", style: "epic", name: E, t: "然瓦版记者神代氏如实记载：般若毙命之时，口中尚塞着三十串章鱼烧。故此刀，名曰——「大食切」。" },
        { id: "v3-001", bg: B1, t: "二百年后。樱夜町夏祭，最后一夜。23:59，所有人抬头等最后一发烟花。" },
        { id: "v3-00a", L: { who: "me", ex: "calm" }, who: "me", ex: "calm", t: { sayo: "最后一发了！许个愿吧——希望下个月房租能交上！", aya: "最后一发。镜头对准天空，三、二——", rion: "……放完就能回家睡觉了。（背上的刀，有点沉）" } },
        { id: "v3-002", cg: CG1, t: "烟花升空——然后停住了。火光一点一点缩回去，像录像带倒带。灯笼、人群、苹果糖上的糖衣，全都往回流。" },
        { id: "v3-003", cg: null, L: { who: "me", ex: "shaken" }, who: "me", ex: "shaken", t: { sayo: "……欸？天黑……不对，天又亮了一点？现在几点？", aya: "……画面卡了？不对，是天空在倒放。我得录下来——", rion: "……又来了。" } },
        { id: "v3-004", R: { who: "aya", ex: "calm" }, who: "aya", ex: "calm", t: "18:00。刚才是 23:59。我的直播间——粉丝 0。……刚才明明有 312 个。" },
        { id: "v3-005", who: "sayo", ex: "shaken", t: "我头上怎么多了个狐狸面具？！还有，我刚买的章鱼烧呢？！我付了钱的！" },
        { id: "v3-006", R: { who: "yoi", ex: "calm" }, who: "yoi", t: "咳咳——凡人们，安静！" },
        { id: "v3-007", who: "yoi", t: "本神乃樱夜町祭神，宵！本神宣布——今夜，永不散场！烟花不许放，摊位不许收，谁也不许回家睡觉！" },
        { id: "v3-008", L: { who: "rion", ex: "calm" }, who: "rion", ex: "calm", t: "……不用回家睡觉。也就是说，明天不用上学。" },
        { id: "v3-009", who: "rion", ex: "calm", t: "……嗯，挺好。" },
        { id: "v3-010", R: { who: "aya", ex: "angry" }, who: "aya", ex: "angry", t: "一点都不好！我的粉丝！" },
        { id: "v3-011", R: { who: "yoi", ex: "calm" }, who: "yoi", t: "戴面具的三个，本神看见你们了。想让天亮？那就来本殿找本神。路上的摊位，一个都不许跳过——鬼退治摊，开张！" },
        { id: "v3-012", R: { who: "rin", ex: "calm" }, who: "rin", ex: "calm", t: "这里是祭典广播站，雨宫凛。好消息：参道上的灯笼妖很弱。坏消息：有九十秒那么多。撑过去，我帮你们找路。" },
        { id: "v3-013", L: { who: "sayo", ex: "resolve" }, who: "sayo", ex: "resolve", t: "没问题没问题！打完就有奉纳钱拿对吧？——对吧？！" }
      ],
      post: [
        { id: "v3-014", bg: B1, L: { who: "sayo", ex: "calm" }, R: { who: "rin", ex: "calm" }, who: "rin", ex: "calm", t: "撑住了。灯笼妖散的时候都在喊「明年还来」……挺有礼貌的。" },
        { id: "v3-015", R: { who: "tanuki", ex: "calm" }, who: "tanuki", t: "哟，戴狐面的。面具不错吧？本店出品。死了也别慌，回鸟居底下找我，苹果糖管够。" },
        { id: "v3-016", who: "sayo", ex: "shaken", t: "死、死了？！" },
        { id: "v3-017", who: "tanuki", t: "在这儿，死叫「出局」。出局就回 18:00，从头逛。只有神给的奉纳钱不会倒带——好好攒着吧。" },
        { id: "v3-018", who: "sayo", ex: "resolve", t: "……也就是说，只要一直逛，就能一直攒钱？无限刷奖品？这、这是神仙夏祭吧！" },
        { id: "v3-019", R: { who: "aya", ex: "calm" }, who: "aya", ex: "calm", t: "笔记：①时间倒带 ②奉纳钱不倒带 ③月城小夜没救了。……我写在手臂上，看看下次还在不在。" }
      ]
    },
    "1-2": {
      pre: [
        { id: "v3-020", bg: B1, L: { who: "aya", ex: "shaken" }, R: { who: "sayo", ex: "calm" }, who: "aya", ex: "shaken", t: "……我手臂上的字没了。我出局了一次。所以笔记也会倒带。" },
        { id: "v3-021", who: "sayo", ex: "calm", t: "那写在我手上！反正我也看不懂！" },
        { id: "v3-022", who: "aya", ex: "angry", t: "这句话里没有一个字让人放心。" },
        { id: "v3-023", t: "绘马长廊。满墙木牌，愿望五花八门：「希望暑假作业自己写完」「希望前男友秃头」「希望猫咪会说话」。" },
        { id: "v3-024", R: { who: "rin", ex: "serious" }, who: "rin", ex: "serious", t: "绘马在发光。纸面具小鬼正在帮这些愿望「实现」——刚才有个大叔的头发掉了一半。" },
        { id: "v3-025", who: "aya", ex: "calm", t: "「前男友秃头」实现了。证据确凿。……这段我剪进去了。" },
        { id: "v3-026", L: { who: "rion", ex: "calm" }, who: "rion", ex: "calm", t: "……左边。" },
        { id: "v3-027", t: "下一秒，左边的绘马墙后面涌出一大群纸面具小鬼。" },
        { id: "v3-028", who: "aya", ex: "shaken", t: "……你怎么知道？" },
        { id: "v3-029", who: "rion", ex: "calm", t: "猜的。好麻烦，速战速决吧。" }
      ],
      post: [
        { id: "v3-030", bg: B1, L: { who: "sayo", ex: "calm" }, R: { who: "rion", ex: "calm" }, who: "sayo", ex: "calm", t: "凛音凛音，你刚才那刀好快！教教我！" },
        { id: "v3-031", who: "rion", ex: "calm", t: "……想早点睡觉，就会变快。" },
        { id: "v3-032", R: { who: "aya", ex: "calm" }, who: "aya", ex: "calm", t: "（小声）……明明说「赞成永夜」的人，出刀比谁都想赶时间。" }
      ]
    },
    "1-3": {
      pre: [
        { id: "v3-033", bg: B1, L: { who: "sayo", ex: "calm" }, R: { who: "miko", ex: "afraid" }, who: "miko", ex: "afraid", t: "那、那个……本殿往哪边走？我和大家走散了……" },
        { id: "v3-034", who: "sayo", ex: "resolve", t: "交给我们！迷路小孩送回家，说不定神社会给奉纳钱！" },
        { id: "v3-035", L: { who: "aya", ex: "calm" }, who: "aya", ex: "calm", t: "动机不纯，但结果正确。批准。" },
        { id: "v3-036", R: { who: "rin", ex: "calm" }, who: "rin", ex: "calm", t: "小巫女叫小灯。路上灯笼妖很多，保护好她——她手里那盏灯，好像是本殿的钥匙。" }
      ],
      post: [
        { id: "v3-037", bg: B1, L: { who: "sayo", ex: "calm" }, R: { who: "miko", ex: "calm" }, who: "miko", ex: "calm", t: "谢谢姐姐们。……你们三个，以前也一起来过祭典的吧？" },
        { id: "v3-038", who: "sayo", ex: "calm", t: "欸？没有哦。我们是这个夏天才合租认识的。" },
        { id: "v3-039", L: { who: "aya", ex: "calm" }, who: "aya", ex: "calm", t: "不认识。" },
        { id: "v3-040", R: { who: "rion", ex: "calm" }, who: "rion", ex: "calm", t: "……不认识。" },
        { id: "v3-041", R: { who: "miko", ex: "calm" }, who: "miko", ex: "calm", t: "这样啊。……嘿嘿。啊，那把刀——是大食切呀。好久不见。" },
        { id: "v31-041", L: { who: "rion", ex: "shaken" }, who: "rion", ex: "shaken", t: "……这名字，请不要大声念。" },
        { id: "v31-042", L: { who: "aya", ex: "calm" }, who: "aya", ex: "calm", t: "（打字）「大·食·切」。热搜预定。" }
      ]
    },
    "1-4": {
      pre: [
        { id: "v3-042", bg: B2, L: { who: "sayo", ex: "calm" }, R: { who: "aya", ex: "calm" }, who: "sayo", ex: "calm", t: "开战前补给！一盒章鱼烧，六个，一人两个——凛音你的我给你吹凉了！" },
        { id: "v3-043", who: "aya", ex: "calm", t: "你哪来的钱。" },
        { id: "v3-044", who: "sayo", ex: "resolve", t: "倒带前买的！倒带后摊主不记得我付过钱，所以又给了我一盒！这叫循环理财！" },
        { id: "v3-045", who: "aya", ex: "angry", t: "这叫白吃。" },
        { id: "v3-046", L: { who: "rion", ex: "calm" }, who: "rion", ex: "calm", t: "……好吃。（第二个也吃掉了）" },
        { id: "v3-047", R: { who: "yoi", ex: "calm" }, who: "yoi", t: "哼哼哼——吃饱了？那就来见识本神的第一位摊主大将：百目灯笼大将！它的每一只眼睛，都盯着你们的破绽！" },
        { id: "v3-048", R: { who: "rin", ex: "serious" }, who: "rin", ex: "serious", t: "它的眼睛会轮流闭上。闭眼的那一刻就是破防——打它两次破防，它就撑不住了。" }
      ],
      post: [
        { id: "v3-049", bg: B2, t: "大将倒下，百只眼睛一齐闭上。灯笼一盏盏熄灭，有什么东西「当」地一声，滚到小夜脚边。" },
        { id: "v31-050", cg: CG2, t: "一颗发黑的铅弹。二百年前的铁炮弹。弹身上，刻着两个字——「月城」。" },
        { id: "v31-051", cg: null, L: { who: "sayo", ex: "shaken" }, R: { who: "aya", ex: "calm" }, who: "sayo", ex: "shaken", t: "欸？月城……我家祖上，是打铁炮的？我还以为我们家世代都是穷人……" },
        { id: "v31-052", who: "aya", ex: "calm", t: "两者并不矛盾。" },
        { id: "v31-053", style: "epic", name: E, t: "……那一夜死去的铁炮手，姓月城。而般若的这只眼睛，二百年来，一直在找她。" },
        { id: "v31-054", L: { who: "rion", ex: "shaken" }, R: null, who: "rion", ex: "shaken", t: "（刀在鞘中低鸣。凛音按住刀柄，背对两人，小声）……这次，也没赶上吗。" },
        { id: "v31-055", L: { who: "sayo", ex: "calm" }, who: "sayo", ex: "calm", t: "凛音？你刚才说什么？" },
        { id: "v31-056", who: "rion", ex: "calm", t: "……说我困了。走吧，下一条街。" },
        { id: "v31-057", style: "epic", name: E, t: "第一夜，至此。欲知般若何在、大食切因何而鸣——且听下回分解。" }
      ]
    }
  };
  global.SakurayoStory = global.SakurayoStory || {};
  global.SakurayoStory.ch1 = S;
  global.SakurayoStory.CG = [{ id: "story/ch1/cg_rewind.webp", n: "倒带的夜空" }, { id: "story/ch1/cg_ema.webp", n: "十年前的绘马" }];
})(typeof window !== "undefined" ? window : globalThis);
