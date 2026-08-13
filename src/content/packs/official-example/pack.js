(function () {
  "use strict";
  SakurayoContent.register({
    id: "official.framework-example",
    version: 1,
    apiVersion: 2,
    game: { min: "4.2.0", maxExclusive: "5.0.0" },
    dependencies: [],
    conflicts: [],
    title: "官方示例包：薄樱观测记录",
    description: "证明服饰、商店、成就、档案和扩展存档可由内容包追加。",
    saveDefaults: {
      purchases: {},
      flags: { manualRead: false }
    },
    shop: {
      costumes: [
        {
          id: "framework_observer",
          n: "薄樱观测服",
          e: "📘",
          price: 40,
          c1: "#8ce7ff",
          c2: "#493b7a",
          bias: ["shrine", "mage"],
          d: "官方扩展示例服饰。资源、商店数据和职业倾向均来自独立内容包。",
          assetBase: "content-packs/official-example/characters"
        }
      ],
      items: [
        {
          id: "observer_manual",
          n: "扩展观测手册",
          i: "📗",
          price: 25,
          max: 1,
          d: "收藏型示例道具。购买状态写入该内容包自己的存档区域，不改变战斗数值。"
        }
      ]
    },
    achievements: [
      {
        id: "observer_wardrobe",
        n: "框架观测员",
        i: "🧩",
        d: "拥有官方示例服饰“薄樱观测服”",
        r: 35,
        condition: { type: "ownedSkin", skinId: "framework_observer" }
      }
    ],
    stories: [
      {
        id: "observer_notes",
        n: "扩展档案：不动核心的第四条路",
        i: "📖",
        d: "凛把新记录装进独立档案层。即使档案损坏，尸潮、绘制与存档主干仍会继续运行。",
        unlock: { type: "ownedItem", itemId: "observer_manual" }
      }
    ],
    texts: {
      installed: "官方示例扩展已隔离加载"
    }
  });
})();
