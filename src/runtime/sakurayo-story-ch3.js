/* 第三章「河边花火会场 —— 觊觎鬼力的人」（docs/STORY.md v3 §3 第 3 层）。
   新说话人：soichi（黑羽宗一，凛音的堂兄 → 鬼宗一）、sakuya（月城朔夜，二百年前的铁炮手 / 般若的真身）。 */
(function (global) {
  "use strict";
  var B1 = "story/ch3/bg_river.webp", E = "说书 · 狸老板", CG1 = "story/ch3/cg_reveal.webp";
  var S = {
    "3-1": {
      pre: [
        { id: "v33-e01", chap: ["第三章", "觊觎鬼力的人"], bg: B1, style: "epic", name: E, t: "上回书说到：瓦版最后一页写着——般若之躯，未尝化灰。" },
        { id: "v33-e02", style: "epic", name: E, t: "二百年来，总有人想把那具身躯挖出来。鬼的力气，能让人不老，能让夜不散，能让输过一次的人，再也不输。" },
        { id: "v33-e03", style: "epic", name: E, t: "黑羽家有两支。一支守刀，一支守不住自己。" },
        { id: "v33-001", bg: B1, L: { who: "sayo", ex: "resolve" }, who: "sayo", ex: "resolve", t: "河边花火会场！这里的炒面是全祭典最便宜的，一盒两百！" },
        { id: "v33-002", R: { who: "aya", ex: "calm" }, who: "aya", ex: "calm", t: "你已经吃了三盒了。按循环理财，你现在欠祭典六百。" },
        { id: "v33-003", who: "sayo", ex: "calm", t: "倒带一次就清零！这叫——时间的利息！" },
        { id: "v33-004", L: { who: "rion", ex: "calm" }, who: "rion", ex: "calm", t: "……今晚，不要离我太远。" },
        { id: "v33-005", R: { who: "aya", ex: "shaken" }, who: "aya", ex: "shaken", t: "凛音主动说了一句超过五个字的话。小夜，录下来，这是新闻。" },
        { id: "v33-006", R: { who: "rin", ex: "serious" }, who: "rin", ex: "serious", t: "广播站。河面上的灯笼妖正往岸上爬，像涨潮一样。撑过这一波——上游有人在放它们下来。" }
      ],
      post: [
        { id: "v33-010", bg: B1, L: { who: "rion", ex: "shaken" }, who: "rion", ex: "shaken", t: "（凛音盯着上游的桥。桥上站着一个穿黑羽织的男人，正朝她举杯。）" },
        { id: "v33-011", R: { who: "soichi", ex: "calm" }, who: "soichi", t: "好久不见，凛音。……不对，对你来说，是「又见面了」吧？这是第几次了——四百次？" }
      ]
    },
    "3-2": {
      pre: [
        { id: "v33-020", L: { who: "sayo", ex: "shaken" }, R: { who: "soichi", ex: "calm" }, who: "sayo", ex: "shaken", t: "凛音，这位帅哥是谁？你亲戚？长得好像——像坏版的你。" },
        { id: "v33-021", who: "soichi", t: "黑羽宗一。分家的长子，凛音的堂兄。也是这二百年来，唯一一个想明白了的黑羽。" },
        { id: "v33-022", who: "soichi", t: "本家守着一把刀，守着一个笑话，守着一个吃章鱼烧的般若。而我——在喂它。" },
        { id: "v33-023", L: { who: "aya", ex: "angry" }, who: "aya", ex: "angry", t: "所以每一夜被吃掉，是你干的。" },
        { id: "v33-024", who: "soichi", t: "夜晚而已。人们本来就会把夜晚浪费掉。我只是把它们……存起来。" },
        { id: "v33-025", who: "soichi", t: "我的剑，替我招待你们。——它们不太听话，会逃。追得上的话，就来桥上找我。" }
      ],
      post: [
        { id: "v33-030", bg: B1, L: { who: "rion", ex: "calm" }, who: "rion", ex: "calm", t: "……他以前不是这样的。小时候，他教我第一式。他说：「凛音，刀要快。」" },
        { id: "v33-031", R: { who: "sayo", ex: "shaken" }, who: "sayo", ex: "shaken", t: "刀要快……这句话，说书的狸老板好像也讲过？" },
        { id: "v33-032", who: "rion", ex: "calm", t: "……嗯。是黑羽家的家训。最早说这句话的人，不姓黑羽。" }
      ]
    },
    "3-3": {
      pre: [
        { id: "v33-040", bg: B1, t: "河中央，第一号花火筒。只要点燃它，被宗一「存起来」的夜晚就会一齐放回天上。" },
        { id: "v33-041", L: { who: "aya", ex: "calm" }, who: "aya", ex: "calm", t: "点火需要三十秒。我们守着，谁上来就打谁。" },
        { id: "v33-042", R: { who: "rion", ex: "calm" }, who: "rion", ex: "calm", t: "……我有话要说。等这个点完。" }
      ],
      post: [
        { id: "v33-050", bg: B1, L: { who: "rion", ex: "calm" }, R: { who: "sayo", ex: "calm" }, who: "rion", ex: "calm", t: "这一夜，我已经过了四百一十二次。" },
        { id: "v33-051", who: "rion", ex: "calm", t: "第一次，我一个人追般若，输了。第二次也输了。第一百次，我学会了哪个摊位的章鱼烧最好吃。第三百次，我不再数了。" },
        { id: "v33-052", R: { who: "aya", ex: "shaken" }, who: "aya", ex: "shaken", t: "……所以你总知道「左边」。所以你总是困。" },
        { id: "v33-053", who: "rion", ex: "calm", t: "第四百一十二次，你们戴着面具出现了。……这是第一次，我不是一个人。" },
        { id: "v33-054", L: { who: "sayo", ex: "resolve" }, who: "sayo", ex: "resolve", t: "那从今晚开始，房租……不对，夜晚，我们三个人分摊！" },
        { id: "v33-055", who: "rion", ex: "calm", t: "（凛音笑了。很短，像烟花。）……嗯。" }
      ]
    },
    "3-4": {
      pre: [
        { id: "v33-060", bg: B1, L: { who: "sayo", ex: "calm" }, R: { who: "aya", ex: "calm" }, who: "sayo", ex: "calm", t: "补给！刨冰四碗——凛音一碗什么都不加，我的加两倍炼乳，绫的——" },
        { id: "v33-061", who: "aya", ex: "calm", t: "第四碗给谁？" },
        { id: "v33-062", who: "sayo", ex: "calm", t: "……不知道。手自己点的。总觉得，好像一直有第四个人跟我们一起逛。" },
        { id: "v33-063", R: { who: "yoi", ex: "calm" }, who: "yoi", t: "（宵没有像往常那样大笑。她只是看着那碗刨冰。）……上吧。本神的第三位大将——不对。这一位，不是本神的。" },
        { id: "v33-064", R: { who: "soichi", ex: "calm" }, who: "soichi", t: "凛音。你有四百次可以学会。我只要一次——就够把它的力气全部拿走。" },
        { id: "v33-065", R: { who: "rin", ex: "serious" }, who: "rin", ex: "serious", t: "他戴上了般若的碎片！鬼面每次裂开都会露出破绽——打碎两次！" }
      ],
      awaken: [
        { id: "v33-070", who: "rion", ex: "resolve", t: { sayo: "宗一哥哥，你教我的第一式——我现在还给你。", aya: "宗一哥哥，你教我的第一式——我现在还给你。", rion: "宗一哥哥，你教我的第一式——我现在还给你。" } }
      ],
      post: [
        { id: "v33-080", bg: B1, L: { who: "rion", ex: "calm" }, R: { who: "soichi", ex: "calm" }, who: "soichi", t: "……快了。比我教你的时候，快多了。" },
        { id: "v33-081", who: "soichi", t: "凛音……我只是不想再输了。本家赢了二百年，分家输了二百年。我想要一次，哪怕一次……" },
        { id: "v33-082", who: "rion", ex: "calm", t: "我也输了四百一十一次。……下次来我家吃饭。" },
        { id: "v33-083", t: "鬼面碎片从宗一脸上剥落，飞向夜空，和天上所有冻住的烟花一起，汇向本殿。" },
        { id: "v33-084", cg: CG1, t: "夜空里，一张巨大的般若面具裂开了。面具后面，是一张哭着的、年轻女人的脸。" },
        { id: "v33-085", cg: null, L: { who: "sayo", ex: "shaken" }, R: { who: "sakuya", ex: "calm" }, who: "sayo", ex: "shaken", t: "……那是，我的脸？" },
        { id: "v33-086", who: "sakuya", t: "…………千代？……不对。你不是千代。你是——" },
        { id: "v33-087", style: "epic", name: E, t: "般若之躯，未尝化灰。因为般若，从来就不是从樱夜山来的鬼。" },
        { id: "v33-088", style: "epic", name: E, t: "那一夜，被踏于足下的铁炮手月城朔夜，没有死。她只是——太想把那场祭典逛完了。第三夜，至此。" }
      ]
    }
  };
  global.SakurayoStory = global.SakurayoStory || {};
  global.SakurayoStory.ch3 = S;
  (global.SakurayoStory.CG = global.SakurayoStory.CG || []).push({ id: "story/ch3/cg_reveal.webp", n: "面具之后" });
})(typeof window !== "undefined" ? window : globalThis);
