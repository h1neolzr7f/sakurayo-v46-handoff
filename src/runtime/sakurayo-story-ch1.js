/* 第一章「神社外街」AVG 台词（docs/STORY.md §4 第一章）。who: me = 当前出击角色；t 可按角色分支 {sayo,aya,rion}。
   bg/cg 为 art 相对路径。行 id 用于「已读快进」。 */
(function (global) {
  "use strict";
  var B1 = "story/ch1/bg_pre.webp", B2 = "story/ch1/bg_end.webp", CG1 = "story/ch1/cg_lanterns.webp", CG2 = "story/ch1/cg_eyes.webp";
  var S = {
    "1-1": {
      pre: [
        { id: "c1-001", chap: ["第一章", "神社外街"], bg: B1, t: "三年前，御镜重工的「镜界事故」带走了 317 个人。今晚，神社外街的灯笼又一盏一盏亮了起来——没有人去点。" },
        { id: "c1-002", L: { who: "me", ex: "calm" }, who: "me", t: { sayo: "……这条参道，我小时候来过。那时候灯笼是暖的。", aya: "外街封锁三年了。灯笼的电路早就断了，它们不该亮。", rion: "师父说过，夜祭的灯是给回家的人引路的。" } },
        { id: "c1-003", R: { who: "rin", ex: "serious" }, who: "rin", t: "这里是雨宫凛，电台接通。听得到吗？你的灵纹信号在镜面上起了反应——门，好像认得你。" },
        { id: "c1-004", who: "me", ex: "resolve", t: "认得我？" },
        { id: "c1-005", who: "rin", ex: "serious", t: "尸潮在往参道聚集。它们会重复生前最后的动作——所以会卡点，会有起手式。别站在参道正中，鸟居挡弹不挡人。" },
        { id: "c1-006", who: "me", ex: "resolve", t: { sayo: "明白。先活下来，再问门为什么认得我。", aya: "收到。按老规矩：先清场，再取证。", rion: "我会记住它们的起手式。" } },
        { id: "c1-007", who: "rin", ex: "calm", t: "撑过 90 秒，我就能锁定镜面的源头。路边的宝箱里有补给，顺手的话打开它们。" }
      ],
      post: [
        { id: "c1-008", bg: B1, L: { who: "me", ex: "shaken" }, R: { who: "rin", ex: "serious" }, who: "rin", ex: "serious", t: "信号锁定了。源头在神社正殿……但有件事很奇怪。" },
        { id: "c1-009", who: "me", ex: "shaken", t: "什么事？" },
        { id: "c1-010", who: "rin", ex: "serious", t: "镜面在你靠近时开得最大。它不是在防你——它像是在等你。" },
        { id: "c1-011", who: "me", ex: "resolve", t: { sayo: "……那就让它等着。我会自己走进去。", aya: "等我？那它最好准备好解释。", rion: "被等待的剑客，通常是去赴约的。" } }
      ]
    },
    "1-2": {
      pre: [
        { id: "c1-012", bg: B1, L: { who: "me", ex: "calm" }, R: { who: "rin", ex: "calm" }, who: "", t: "参道两侧挂满了绘马。木牌在没有风的夜里轻轻相撞，像有人在低声说话。" },
        { id: "c1-013", who: "me", ex: "shaken", t: "这些绘马……上面写的是愿望。「希望妈妈的病快点好」「明年还要一起来看灯」……" },
        { id: "c1-014", who: "rin", ex: "serious", t: "日期全是三年前的事故当天。尸潮在重复的动作——是在许愿。" },
        { id: "c1-015", who: "me", ex: "angry", t: { sayo: "所以它们不是怪物。它们只是……停在了那一刻。", aya: "御镜把这些人的最后一个愿望写进了动作模型。真恶心。", rion: "把人的祈祷当作招式来用……这不是剑，是亵渎。" } },
        { id: "c1-016", who: "rin", ex: "calm", t: "长廊会被它们堵死。60 只——清出一条路来。越快越好，它们每多许一次愿，镜面就更亮一分。" }
      ],
      post: [
        { id: "c1-017", bg: B1, L: { who: "me", ex: "calm" }, who: "", t: "最后一块绘马落地，裂成两半。背面用很小的字写着：「请让我被记住」。" },
        { id: "c1-018", who: "me", ex: "shaken", t: { sayo: "……我会记住的。哪怕我自己都不确定，我是不是那个会被记住的人。", aya: "记住你们的不该是服务器。是活着的人。", rion: "我记住了。你们的名字，不是招式名。" } }
      ]
    },
    "1-3": {
      pre: [
        { id: "c1-019", bg: B1, L: { who: "me", ex: "calm" }, R: { who: "miko", ex: "afraid" }, who: "miko", ex: "afraid", t: "请、请等一下！你是……从外面来的人吗？" },
        { id: "c1-020", who: "me", ex: "shaken", t: "一个活人？这里怎么还会有巫女——" },
        { id: "c1-021", who: "miko", ex: "calm", t: "我叫小灯。我姐姐三年前在这里值夜……之后就再也没有回来。我每年都来送灯，把灯笼送到正殿，就像她以前那样。" },
        { id: "c1-022", R: { who: "rin", ex: "serious" }, who: "rin", ex: "serious", t: "她是事故遇难者的家属。……带上她吧，一个人留在这里太危险了。" },
        { id: "c1-023", R: { who: "miko", ex: "calm" }, who: "me", ex: "resolve", t: { sayo: "跟紧我。我会护住你，一直到正殿。", aya: "跟着我，别离开三步之内。这次我不会再签错名字了。", rion: "走在我身后。刀在前，人就在。" } },
        { id: "c1-024", who: "miko", ex: "calm", t: "嗯！……她们好像会追着灯笼来。我只有在你身边的时候，才敢往前走。" }
      ],
      post: [
        { id: "c1-025", bg: B2, cg: CG1, who: "", t: "灯笼被放上正殿台阶的那一刻，参道上千盏灯同时亮起。光从鸟居下一路铺到看不见的尽头。" },
        { id: "c1-026", cg: null, L: { who: "me", ex: "calm" }, R: { who: "miko", ex: "calm" }, who: "miko", ex: "calm", t: "姐姐说过，灯亮了，迷路的人就能找到回家的路……谢谢你。" },
        { id: "c1-027", who: "me", ex: "shaken", t: { sayo: "……被留下的人，也一直在迷路吧。", aya: "（她的姐姐，也在那 317 个名字里。我签过的那份名单里。）", rion: "回家的路……我也很久没走过了。" } },
        { id: "c1-028", R: { who: "rin", ex: "serious" }, who: "rin", ex: "serious", t: "正殿的镜面在扩张——有什么大东西醒了。小灯交给我这边接应，你去吧。" }
      ]
    },
    "1-4": {
      pre: [
        { id: "c1-029", bg: B2, L: { who: "me", ex: "resolve" }, R: { who: "rin", ex: "serious" }, who: "rin", ex: "serious", t: "正殿前方，巨大的灵纹反应。它由事故当晚的值夜人员拼合而成——我们叫它「百目尸将」。" },
        { id: "c1-030", who: "rin", ex: "serious", t: "它有护身的破防槽。持续打它，或者完成场上的目标，槽满就会失衡——那是输出窗口。" },
        { id: "c1-031", who: "me", ex: "resolve", t: { sayo: "百只眼睛……也会有一只认得我吗。", aya: "值夜人员……也就是说，有我当年的部下。", rion: "一百只眼睛，就有一百个破绽。" } }
      ],
      post: [
        { id: "c1-032", bg: B2, cg: CG2, who: "", t: "尸将倒下前，铠甲上的眼睛一齐睁开。它们没有看向敌人——它们全都看向镜面深处。" },
        { id: "c1-033", cg: null, L: { who: "me", ex: "shaken" }, R: { who: "kagami", ex: "calm" }, who: "kagami", t: "……第零号灵纹，确认。欢迎回来。" },
        { id: "c1-034", who: "me", ex: "shaken", t: "你是谁？" },
        { id: "c1-035", who: "kagami", t: "镜零。由 317 次失败训练而成的管理者。我只想确认一件事——哪一个你，值得继续存在。" },
        { id: "c1-036", who: "me", ex: "angry", t: { sayo: "我不需要你来回答这种问题！", aya: "你没有资格替任何人回答。包括你自己。", rion: "活着不需要你的批准。" } },
        { id: "c1-037", R: { who: "rin", ex: "serious" }, who: "rin", ex: "serious", t: "信号断了……镜零撤回了雨夜商圈的方向。第一章，结束了。" },
        { id: "c1-038", who: "me", ex: "resolve", t: { sayo: "不。只是门打开了。", aya: "那就去商圈。合同上的每一个名字，我都要找回来。", rion: "那就追。剑还没收鞘。" } }
      ]
    }
  };
  global.SakurayoStory = global.SakurayoStory || {};
  global.SakurayoStory.ch1 = S;
  global.SakurayoStory.CG = [{ id: "story/ch1/cg_lanterns.webp", n: "千灯同明" }, { id: "story/ch1/cg_eyes.webp", n: "百目开眼" }];
})(typeof window !== "undefined" ? window : globalThis);
