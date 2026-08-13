(function () {
  "use strict";
  SakurayoContent.register({
    id: "official.modkit-addon",
    version: 1,
    apiVersion: 2,
    game: { min: "4.2.0", maxExclusive: "5.0.0" },
    dependencies: [{ id: "official.framework-example", minVersion: 1 }],
    conflicts: [],
    title: "官方 Mod Kit 依赖示例",
    description: "证明内容包可声明依赖，并在不修改核心的情况下追加商店条目、成就、档案和独立存档。",
    saveDefaults: { purchases: {}, flags: { inspected: false } },
    shop: {
      items: [{
        id: "modkit_seal",
        n: "Mod Kit 校验符",
        i: "🧰",
        price: 18,
        max: 1,
        d: "依赖 official.framework-example 的官方示例道具；移除依赖包时本包会自动停用，本体仍能启动。"
      }]
    },
    achievements: [{
      id: "dependency_ready",
      n: "依赖链就绪",
      i: "🔗",
      d: "取得 Mod Kit 校验符",
      r: 24,
      condition: { type: "ownedItem", itemId: "modkit_seal" }
    }],
    stories: [{
      id: "dependency_notes",
      n: "扩展档案：依赖不是加载顺序",
      i: "🧰",
      d: "清单只决定候选包。真正启用前，运行时会检查格式版本、游戏版本、依赖与冲突，再生成确定顺序。",
      unlock: { type: "ownedItem", itemId: "modkit_seal" }
    }],
    texts: { installed: "Mod Kit 依赖示例已启用" }
  });
})();
