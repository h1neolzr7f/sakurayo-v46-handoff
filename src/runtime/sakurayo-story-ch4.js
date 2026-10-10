/* 第四章「本殿 —— 千夜一闪」（终章，docs/STORY.md v3 §3 第 4 层）。结局回扣序章：
   23:59 的最后一发烟花、小夜的房租愿望、绫的「粉丝 0」、凛音的「不用上学……挺好」、朔夜的遗言「刀要快」、刀名「大食切」。 */
(function (global) {
  "use strict";
  var B1 = "story/ch4/bg_honden.webp", B0 = "story/ch1/bg_v3_pre.webp", E = "说书 · 狸老板", CG1 = "story/ch4/cg_dawn.webp", CG0 = "story/ch1/cg_rewind.webp";
  var S = {
    "4-1": {
      pre: [
        { id: "v34-e01", chap: ["终章", "千夜一闪"], bg: B1, style: "epic", name: E, t: "诸位看官——这是最后一回了。" },
        { id: "v34-e02", style: "epic", name: E, t: "二百年前，千代斩开半座山，以为斩的是鬼。她没看见，鬼面之下，是谁的脸。" },
        { id: "v34-001", bg: B1, L: { who: "sayo", ex: "shaken" }, who: "sayo", ex: "shaken", t: "所以……般若就是我家祖宗？我家祖宗吃了二百年的夜晚？！还吃了三十串章鱼烧？！" },
        { id: "v34-002", R: { who: "aya", ex: "calm" }, who: "aya", ex: "calm", t: "穷，但胃口很好。确实是你家的人。" },
        { id: "v34-003", R: { who: "yoi", ex: "calm" }, who: "yoi", t: "……凡人们。本神有话要说。不是神谕，是——坦白。" },
        { id: "v34-004", who: "yoi", t: "本神宣布「永不散场」，是骗你们的。本神从来不想留住这一夜。是她不肯走，祭典就散不了。本神一个祭神，散不了自己的祭典……很丢脸吧？" },
        { id: "v34-005", who: "yoi", t: "所以本神把面具，一张一张，放在了月城、神代、黑羽的后人头上。——对不起。还有，谢谢。" },
        { id: "v34-006", L: { who: "rion", ex: "calm" }, who: "rion", ex: "calm", t: "……本殿回廊里全是镜子。每一面都映着她那一夜没逛完的摊位。打碎它们，路才会开。" }
      ],
      post: [
        { id: "v34-010", L: { who: "aya", ex: "calm" }, who: "aya", ex: "calm", t: "（最后一面镜子里，是二百年前的参道。一个铁炮手和一个剑士，分着同一盒章鱼烧。）" },
        { id: "v34-011", R: { who: "sayo", ex: "calm" }, who: "sayo", ex: "calm", t: "她们看起来……好开心。" }
      ]
    },
    "4-2": {
      pre: [
        { id: "v34-020", bg: B1, t: "第四百一十二夜，最后一个小时。本殿外，所有被吃掉的夜晚一齐涌了回来。" },
        { id: "v34-021", L: { who: "rion", ex: "calm" }, who: "rion", ex: "calm", t: "这一段，我一个人守过一百次。每次都没守住。" },
        { id: "v34-022", R: { who: "sayo", ex: "resolve" }, who: "sayo", ex: "resolve", t: "那这次三个人守！不许用大招——留着给祖宗！" }
      ],
      post: [
        { id: "v34-030", L: { who: "aya", ex: "calm" }, who: "aya", ex: "calm", t: "我开播了。观众——零。……没关系。今晚这段，我是为一个人播的。" }
      ]
    },
    "4-3": {
      pre: [
        { id: "v34-040", bg: B1, R: { who: "rin", ex: "calm" }, who: "rin", ex: "calm", t: "广播站雨宫凛，最后一条广播——我要亲自走到本殿，把「祭典结束」的通知念出来。护送我。" },
        { id: "v34-041", L: { who: "sayo", ex: "calm" }, who: "sayo", ex: "calm", t: "凛姐要是受一点伤，散场通知就念不完了对吧？好，一根头发都不许掉！" }
      ],
      post: [
        { id: "v34-050", R: { who: "rin", ex: "calm" }, who: "rin", ex: "calm", t: "……到了。那么——各位来宾，本届百夜祭，即将——" },
        { id: "v34-051", R: { who: "sakuya", ex: "calm" }, who: "sakuya", t: "不要。" },
        { id: "v34-052", who: "sakuya", t: "我还没逛完。我和千代说好了，放完最后一发烟花，一起去吃章鱼烧。她说「刀要快」，我说「你先走，我马上来」。……我还没去。" }
      ]
    },
    "4-4": {
      pre: [
        { id: "v34-060", bg: B1, L: { who: "sayo", ex: "calm" }, R: { who: "sakuya", ex: "calm" }, who: "sayo", ex: "calm", t: "……祖宗。不对，朔夜小姐。我叫月城小夜，穷，但是很能吃。和你一样。" },
        { id: "v34-061", who: "sakuya", t: "你笑起来……也像我。" },
        { id: "v34-062", who: "sayo", ex: "resolve", t: "所以我知道你想要什么。不是二百年的夜晚——是一场逛完的祭典，和一个等你的人。" },
        { id: "v34-063", who: "sayo", ex: "resolve", t: "我们陪你逛完。但在那之前……得先把你打醒！" },
        { id: "v34-064", R: { who: "rin", ex: "serious" }, who: "rin", ex: "serious", t: "鬼·朔夜，四个阶段。每一个阶段都是她那一夜的一段回忆——破开三次，她才听得见你们！" }
      ],
      awaken: [
        { id: "v34-070", who: "me", ex: "resolve", t: { sayo: "没问题没问题——这次，换我保护你。", aya: "这一段，我直播给全镇看。第一个观众，是你。", rion: "千代，刀要快。——这次，够快了。" } }
      ],
      post: [
        { id: "v34-080", bg: B1, style: "epic", name: E, t: "凛音拔刀。这一刀，斩的不是鬼，是二百年没散场的夜。" },
        { id: "v34-081", style: "epic", name: E, t: "刀光过处，冻在天上的千发烟花一齐炸开；本殿的屋檐、樱夜山、整片夜空，像幕布一样被一刀两断——" },
        { id: "v34-082", style: "epic", name: E, t: "后世称这一刀为「千夜一闪」。（目击者神代绫补充：斩完之后，她说了一句「好困」。）" },
        { id: "v34-083", bg: B0, t: "23:59。樱夜町夏祭，最后一夜。所有人抬头，等最后一发烟花。" },
        { id: "v34-084", cg: CG0, t: "烟花升空。这一次——它没有停。" },
        { id: "v34-085", cg: CG1, t: "烟花炸开，天亮了。本殿台阶上，四个人分着一盒章鱼烧。第四个人的身影，正一点一点变成樱花瓣。" },
        { id: "v34-086", cg: null, L: { who: "sayo", ex: "calm" }, R: { who: "sakuya", ex: "calm" }, who: "sakuya", t: "……好吃。和那年一样。小夜，这个给你——我的钱袋。二百年前的铜钱，大概……够交一个月房租？" },
        { id: "v34-087", who: "sayo", ex: "shaken", t: "欸——？！我在最后一发烟花前许的愿……真的实现了？！" },
        { id: "v34-088", R: { who: "aya", ex: "calm" }, who: "aya", ex: "calm", t: "（绫看着手机。直播间观众：312……313。多出来的那一个，头像是一张狐狸面具。）……欢迎回来。不对——欢迎来过。" },
        { id: "v34-089", who: "sakuya", t: "千代在前面等我了。……谢谢你们，陪我逛完。" },
        { id: "v34-090", L: { who: "rion", ex: "calm" }, R: { who: "yoi", ex: "calm" }, who: "yoi", t: "咳咳——凡人们！本神宣布：本届百夜祭，圆满散场！……明年，也要来。" },
        { id: "v34-091", L: { who: "rion", ex: "calm" }, R: null, who: "rion", ex: "calm", t: "……明天，要上学。" },
        { id: "v34-092", who: "rion", ex: "calm", t: "……嗯。想去。" },
        { id: "v34-093", style: "epic", name: E, t: "至于那把刀——神代家的新一期瓦版写道：「斩何物，便名何刀。此刀斩开千夜，本当更名——」" },
        { id: "v34-094", style: "epic", name: E, t: "「——然散场之时，鬼尚在吃章鱼烧。故此刀，仍名『大食切』。」诸位看官，百夜祭，至此散场。" }
      ]
    }
  };
  global.SakurayoStory = global.SakurayoStory || {};
  global.SakurayoStory.ch4 = S;
  (global.SakurayoStory.CG = global.SakurayoStory.CG || []).push({ id: "story/ch4/cg_dawn.webp", n: "天亮了" });
})(typeof window !== "undefined" ? window : globalThis);
