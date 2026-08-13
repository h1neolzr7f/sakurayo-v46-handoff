(function () {
  "use strict";
  SakurayoContent.register({
    id: "official.story-exploration",
    version: 2,
    apiVersion: 2,
    game: { min: "4.2.0", maxExclusive: "5.0.0" },
    dependencies: [],
    conflicts: [],
    title: "官方剧情探索地图",
    description: "四章可行走场景、一次性奖励节点与探索记录。",
    saveDefaults: {
      collected: {},
      visits: {},
      fragments: [],
      choices: {}
    },
    migrations: [
      { from: 1, to: 2, set: { choices: {} } }
    ],
    explorations: [
      {
        id: "shrine-outskirts",
        stageId: 1,
        title: "神社外街 · 封印余响",
        background: "content-packs/official-exploration/maps/chapter1.webp",
        spawn: [0.5, 0.78],
        walkable: [
          { type: "circle", x: 0.5, y: 0.56, r: 0.27 },
          { type: "polygon", points: [[0.32,0.98],[0.68,0.98],[0.62,0.55],[0.38,0.55]] },
          { type: "polygon", points: [[0.38,0.60],[0.62,0.60],[0.69,0.10],[0.45,0.10]] },
          { type: "polygon", points: [[0.10,0.86],[0.31,0.89],[0.50,0.62],[0.40,0.44],[0.15,0.62]] },
          { type: "polygon", points: [[0.90,0.84],[0.69,0.89],[0.50,0.62],[0.60,0.44],[0.85,0.61]] }
        ],
        nodes: [
          { id: "torii-cache", x: 0.18, y: 0.72, icon: "🌸", label: "鸟居后的补给", reward: { type: "coins", amount: 12 } },
          { id: "seal-fragment", x: 0.77, y: 0.63, icon: "📜", label: "破损封印记录", reward: { type: "fragment", value: "神社封印残页", coins: 8 } },
          { id: "moon-crystal", x: 0.52, y: 0.32, icon: "✦", label: "月下晶核", reward: { type: "coins", amount: 18 } },
          { id: "hidden-offering", x: 0.36, y: 0.48, icon: "🌸", label: "显形的旧祭盒", requiresEvent: "echo-altar", reward: { type: "coins", amount: 28 } }
        ],
        events: [{ id:"echo-altar", x:0.50, y:0.55, icon:"印", requiresNode:"seal-fragment", title:"残响祭坛", text:"封印里夹着一段未登记的人格残响。留下它，还是拆解成补给？", choices:[
          { id:"preserve", label:"保留残响", description:"获得证词碎片并显形隐藏祭盒。", coins:10, fragment:"被保留的神社残响" },
          { id:"extract", label:"拆解封印", description:"立即获得更多樱花币，但记录会留下选择。", coins:24, fragment:"被拆解的封印编号" }
        ] }]
      },
      {
        id: "rain-market",
        stageId: 2,
        title: "雨夜商圈 · 企业盲区",
        background: "content-packs/official-exploration/maps/chapter2.webp",
        spawn: [0.48, 0.82],
        walkable: [
          { type:"rect", x:0.50, y:0.56, w:0.72, h:0.48 },
          { type:"rect", x:0.48, y:0.76, w:0.50, h:0.34 },
          { type:"circle", x:0.18, y:0.64, r:0.17 },
          { type:"circle", x:0.76, y:0.46, r:0.20 },
          { type:"polygon", points:[[0.19,0.28],[0.78,0.28],[0.87,0.43],[0.13,0.48]] }
        ],
        nodes: [
          { id: "arcade-locker", x: 0.15, y: 0.57, icon: "🎁", label: "停机厅储物柜", reward: { type: "coins", amount: 16 } },
          { id: "emp-log", x: 0.77, y: 0.48, icon: "💠", label: "EMP 维护日志", reward: { type: "fragment", value: "零号维护日志", coins: 10 } },
          { id: "roof-drop", x: 0.79, y: 0.76, icon: "✦", label: "屋顶空投", reward: { type: "coins", amount: 22 } },
          { id:"hidden-terminal", x:0.47, y:0.39, icon:"◇", label:"零号离线密钥", requiresEvent:"blind-terminal", reward:{type:"fragment",value:"未上传的企业密钥",coins:20} }
        ],
        events: [{ id:"blind-terminal", x:0.55, y:0.53, icon:"端", requiresNode:"emp-log", title:"盲区终端", text:"终端仍连接着人格回收服务器。可以公开日志，也可以反向烧毁追踪索引。", choices:[
          { id:"publish", label:"公开维护日志", description:"留下公开证词并打开隐藏终端。", coins:14, fragment:"公开的零号维护日志" },
          { id:"burn", label:"烧毁追踪索引", description:"切断追踪并回收残余晶核。", coins:28, fragment:"被烧毁的追踪索引" }
        ] }]
      },
      {
        id: "sword-mound",
        stageId: 3,
        title: "黄泉剑冢 · 无名同门",
        background: "content-packs/official-exploration/maps/chapter3.webp",
        spawn: [0.48, 0.82],
        walkable: [
          { type:"circle", x:0.50, y:0.50, r:0.21 },
          { type:"polygon", points:[[0.42,0.57],[0.58,0.57],[0.60,0.98],[0.38,0.98]] },
          { type:"polygon", points:[[0.42,0.47],[0.14,0.12],[0.29,0.08],[0.55,0.39]] },
          { type:"polygon", points:[[0.57,0.46],[0.71,0.12],[0.91,0.11],[0.65,0.56]] },
          { type:"polygon", points:[[0.38,0.52],[0.08,0.69],[0.17,0.85],[0.48,0.63]] },
          { type:"polygon", points:[[0.61,0.53],[0.91,0.65],[0.84,0.84],[0.52,0.63]] }
        ],
        nodes: [
          { id: "left-memorial", x: 0.17, y: 0.63, icon: "🗡️", label: "无名剑碑", reward: { type: "fragment", value: "无名同门名册", coins: 12 } },
          { id: "dojo-scroll", x: 0.72, y: 0.25, icon: "📜", label: "残缺剑谱", reward: { type: "coins", amount: 24 } },
          { id: "ritual-core", x: 0.49, y: 0.52, icon: "✦", label: "剑阵晶核", reward: { type: "coins", amount: 18 } },
          { id:"hidden-sword", x:0.78, y:0.70, icon:"刃", label:"归还姓名的断剑", requiresEvent:"nameless-oath", reward:{type:"fragment",value:"断剑上的真名",coins:24} }
        ],
        events: [{ id:"nameless-oath", x:0.50, y:0.48, icon:"誓", requiresNode:"left-memorial", title:"无名者之誓", text:"剑碑要求继承者留下一个名字。写自己的名字，还是归还亡者的名字？", choices:[
          { id:"return", label:"归还亡者姓名", description:"保留名册并唤醒隐藏断剑。", coins:12, fragment:"被归还的同门姓名" },
          { id:"inherit", label:"写下继承者姓名", description:"承担剑阵残响并获得更多晶核。", coins:30, fragment:"继承者的新誓约" }
        ] }]
      },
      {
        id: "mirror-core",
        stageId: 4,
        title: "镜界核心 · 失败时间线",
        background: "content-packs/official-exploration/maps/chapter4.webp",
        spawn: [0.5, 0.82],
        walkable: [
          { type:"circle", x:0.50, y:0.57, r:0.25 },
          { type:"rect", x:0.50, y:0.55, w:0.18, h:0.82 },
          { type:"rect", x:0.50, y:0.57, w:0.82, h:0.14 },
          { type:"circle", x:0.12, y:0.57, r:0.11 },
          { type:"circle", x:0.88, y:0.57, r:0.11 },
          { type:"circle", x:0.50, y:0.14, r:0.13 }
        ],
        nodes: [
          { id: "left-timeline", x: 0.2, y: 0.58, icon: "🪞", label: "左侧时间线", reward: { type: "fragment", value: "第 109 次失败记录", coins: 14 } },
          { id: "right-timeline", x: 0.79, y: 0.58, icon: "🪞", label: "右侧时间线", reward: { type: "fragment", value: "第 317 次失败记录", coins: 14 } },
          { id: "core-gift", x: 0.5, y: 0.23, icon: "🌸", label: "镜核赠礼", reward: { type: "coins", amount: 30 } },
          { id:"hidden-witness", x:0.50, y:0.56, icon:"证", label:"未被覆盖的原始证词", requiresEvent:"mirror-verdict", reward:{type:"fragment",value:"未覆盖的原始证词",coins:32} }
        ],
        events: [{ id:"mirror-verdict", x:0.50, y:0.67, icon:"判", requiresNode:"left-timeline", title:"镜面裁决", text:"镜界要求删除一条失败时间线来维持核心稳定。接受它的二选一，还是拒绝裁决？", choices:[
          { id:"refuse", label:"拒绝删除任何人", description:"核心升压，但原始证词会显形。", coins:18, fragment:"拒绝裁决的共同证词" },
          { id:"archive", label:"封存而不删除", description:"转移时间线并回收镜核资源。", coins:36, fragment:"离线封存的时间线" }
        ] }]
      }
    ]
  });
})();
