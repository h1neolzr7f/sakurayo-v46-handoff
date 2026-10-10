/* 第二章「夜店街 —— 瓦版不说谎」AVG 台词（docs/STORY.md v3 §3 第 2 层）。
   节奏：说书开场 → 日常吐槽 → 摊位冒险 → Boss 前最轻松的一段 → Boss 觉醒一句真心话 → 说书收尾 + 章末反转。
   who：sayo / aya / rion / rin / guard（老保安）；yoi（宵）、tanuki（狸老板）。 */
(function (global) {
  "use strict";
  var B1 = "story/ch2/bg_street.webp", B2 = "story/ch2/bg_shateki.webp", E = "说书 · 狸老板", CG1 = "story/ch2/cg_kawaraban.webp", CG2 = "story/ch2/cg_ashes.webp";
  var S = {
    "2-1": {
      pre: [
        { id: "v32-e01", chap: ["第二章", "瓦版不说谎"], bg: B1, style: "epic", name: E, t: "上回书说到，参道灯笼大将吐出一颗铅弹，上刻「月城」二字。" },
        { id: "v32-e02", style: "epic", name: E, t: "二百年前那一夜，有一人不持刀、不持铳，只持笔。她追着般若跑了三条街，把每一刀都写进瓦版。" },
        { id: "v32-e03", style: "epic", name: E, t: "此人姓神代。后世皆言：瓦版不说谎——只是偶尔，写得太老实。" },
        { id: "v32-001", bg: B1, L: { who: "aya", ex: "calm" }, who: "aya", ex: "calm", t: "……所以，「大食切」这个丢人的名字，是我家祖上起的。" },
        { id: "v32-002", R: { who: "sayo", ex: "resolve" }, who: "sayo", ex: "resolve", t: "这有什么！我家祖上是打铁炮的穷人，你家祖上是写八卦的记者，凛音家祖上是吃章鱼烧——" },
        { id: "v32-003", R: { who: "rion", ex: "angry" }, who: "rion", ex: "angry", t: "……是斩般若的。章鱼烧是般若吃的。" },
        { id: "v32-004", who: "sayo", ex: "calm", t: "对对对，斩般若的！刀名字是章鱼烧起的！" },
        { id: "v32-005", who: "rion", ex: "calm", t: "……算了。" },
        { id: "v32-006", R: { who: "rin", ex: "calm" }, who: "rin", ex: "calm", t: "广播站雨宫凛。夜店街起风了，四辆装满旧瓦版的摊车自己跑了起来——每一张都写着二百年前那一夜的一段。拦下四辆，越快越好，不然它们会冲进河里。" },
        { id: "v32-007", L: { who: "aya", ex: "resolve" }, who: "aya", ex: "resolve", t: "追新闻？这个我熟。三位观众朋友——哦，现在是零位——跟紧了。" }
      ],
      post: [
        { id: "v32-010", cg: CG1, t: "第四辆摊车翻倒，瓦版漫天飞。最后一张落进绫的手里。木刻的般若嘴里塞满了章鱼烧，脖子上骑着一个拿刀的女孩。" },
        { id: "v32-011", cg: null, L: { who: "aya", ex: "shaken" }, who: "aya", ex: "shaken", t: "……这一张的落款，是「神代千寻」。我奶奶的奶奶的……反正很多个奶奶。" },
        { id: "v32-012", R: { who: "sayo", ex: "calm" }, who: "sayo", ex: "calm", t: "画得好可爱！般若的脸鼓鼓的。" },
        { id: "v32-013", who: "aya", ex: "calm", t: "……这是一份事故报告，小夜。" }
      ]
    },
    "2-2": {
      pre: [
        { id: "v32-020", bg: B2, L: { who: "sayo", ex: "resolve" }, who: "sayo", ex: "resolve", t: "射的屋！打中奖品就能拿走对吧？那个招财猫看起来能卖三千！" },
        { id: "v32-021", R: { who: "yoi", ex: "calm" }, who: "yoi", t: "哼哼——此乃本神麾下第二位摊主大将的地盘！奖品架上的东西，都是被夜晚吃掉的愿望。打下来，它们就自由了。" },
        { id: "v32-022", R: { who: "aya", ex: "calm" }, who: "aya", ex: "calm", t: "所以打下来不能卖。" },
        { id: "v32-023", L: { who: "sayo", ex: "shaken" }, who: "sayo", ex: "shaken", t: "……不能卖？！" },
        { id: "v32-024", R: { who: "rin", ex: "calm" }, who: "rin", ex: "calm", t: "架子后面有三台会自己装弹的机关。拆掉它们，奖品架才会停。" }
      ],
      post: [
        { id: "v32-030", L: { who: "rion", ex: "calm" }, who: "rion", ex: "calm", t: "（凛音从奖品架上取下一只褪色的护身符，看了很久，放进袖子里）" },
        { id: "v32-031", R: { who: "sayo", ex: "calm" }, who: "sayo", ex: "calm", t: "凛音也有想要的愿望吗？" },
        { id: "v32-032", who: "rion", ex: "calm", t: "……这个，是我掉的。很久以前。" },
        { id: "v32-033", who: "sayo", ex: "calm", t: "很久以前是多久？我们不是今天才来的吗？" },
        { id: "v32-034", who: "rion", ex: "calm", t: "……睡糊涂了。走吧。" }
      ]
    },
    "2-3": {
      pre: [
        { id: "v32-040", bg: B1, t: "开始下雨了。夜店街尽头，一位撑着破伞的老保安在等人。" },
        { id: "v32-041", R: { who: "guard", ex: "calm" }, who: "guard", ex: "calm", t: "小姑娘们，帮个忙。我得把这箱瓦版送回神代家的旧仓库。四十年了，每年今晚我都送，每年都送不到。" },
        { id: "v32-042", L: { who: "aya", ex: "shaken" }, who: "aya", ex: "shaken", t: "……您认识神代家？" },
        { id: "v32-043", who: "guard", ex: "calm", t: "认识你。你小时候在仓库门口哭过，说长大要当记者，把所有人都写进新闻里，这样就没人会被忘掉。" },
        { id: "v32-044", who: "aya", ex: "calm", t: "……我不记得了。走吧，雨大了。" }
      ],
      post: [
        { id: "v32-050", L: { who: "aya", ex: "calm" }, R: { who: "guard", ex: "calm" }, who: "guard", ex: "calm", t: "送到了。四十年，第一次送到。……谢谢你，神代家的小记者。" },
        { id: "v32-051", who: "aya", ex: "calm", t: "（老保安和破伞一起化成了雨点。纸箱里，是一整套二百年前的瓦版，最后一页被封住了。）" },
        { id: "v32-052", R: { who: "sayo", ex: "shaken" }, who: "sayo", ex: "shaken", t: "绫……你在哭吗？" },
        { id: "v32-053", who: "aya", ex: "angry", t: "是雨。……关掉你那该死的心疼表情。" }
      ]
    },
    "2-4": {
      pre: [
        { id: "v32-060", bg: B2, L: { who: "sayo", ex: "calm" }, R: { who: "rion", ex: "calm" }, who: "sayo", ex: "calm", t: "补给！刨冰三碗，草莓、蓝色夏威夷、还有凛音要的……「什么都不加」？" },
        { id: "v32-061", who: "rion", ex: "calm", t: "……冰本来的味道。" },
        { id: "v32-062", R: { who: "aya", ex: "calm" }, who: "aya", ex: "calm", t: "那就是水。你花钱买了一碗冻起来的水。" },
        { id: "v32-063", who: "sayo", ex: "resolve", t: "凛音的钱我出！循环理财第二弹！" },
        { id: "v32-064", R: { who: "yoi", ex: "calm" }, who: "yoi", t: "吃饱了？那就上吧——射的屋大将！它百发百中，从不失手——因为它打的不是你，是你最后悔的那一秒！" },
        { id: "v32-065", R: { who: "rin", ex: "serious" }, who: "rin", ex: "serious", t: "它换弹的时候会停顿，那就是破防的窗口。打断两次，它的枪就会卡壳。" }
      ],
      awaken: [
        { id: "v32-070", who: "aya", ex: "resolve", t: "四十年没送到的东西，我送到了。二百年没写完的报道——今晚，我来写完。" }
      ],
      post: [
        { id: "v32-080", bg: B1, t: "射的屋大将的枪管炸成了烟花。奖品架上所有的愿望一起飞了起来，像萤火虫。" },
        { id: "v32-081", L: { who: "aya", ex: "calm" }, who: "aya", ex: "calm", t: "（绫撕开瓦版最后一页的封条。纸在她手里自己烧了起来。）" },
        { id: "v32-082", cg: CG2, t: "火光里显出一行字，墨迹二百年未干——「般若之躯，未尝化灰」。" },
        { id: "v32-083", cg: null, L: { who: "aya", ex: "shaken" }, R: { who: "sayo", ex: "shaken" }, who: "aya", ex: "shaken", t: "……没死透。般若，二百年前根本没死透。" },
        { id: "v32-084", who: "sayo", ex: "shaken", t: "那、那千代斩开的半座山呢？三十串章鱼烧呢？" },
        { id: "v32-085", L: { who: "rion", ex: "calm" }, R: null, who: "rion", ex: "calm", t: "（凛音的刀又鸣了一次。她没有回头）……我知道。" },
        { id: "v32-086", style: "epic", name: E, t: "瓦版不说谎。只是写下真相的那位神代氏，为了让那一夜「好笑一点」，把最后一页封了二百年。" },
        { id: "v32-087", style: "epic", name: E, t: "第二夜，至此。般若的身躯藏于何处，觊觎它的又是何人——且听下回分解。" }
      ]
    }
  };
  global.SakurayoStory = global.SakurayoStory || {};
  global.SakurayoStory.ch2 = S;
  (global.SakurayoStory.CG = global.SakurayoStory.CG || []).push({ id: "story/ch2/cg_kawaraban.webp", n: "神代家的瓦版" }, { id: "story/ch2/cg_ashes.webp", n: "未尝化灰" });
})(typeof window !== "undefined" ? window : globalThis);
