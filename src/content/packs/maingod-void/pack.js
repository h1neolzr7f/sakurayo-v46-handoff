(function () {
  "use strict";

  window.SakurayoContent.register({
    id: "official.maingod-void",
    version: 1,
    apiVersion: 2,
    title: "主神空间 · 虚空圣所",
    description:
      "通关终章后开放的可自由探索区域。在主神空间最深处的虚空圣所收集监察碎片与回声火花，并见证镜零的异常。",
    saveDefaults: {
      collected: {},
      visits: {},
      choices: {},
    },
    explorations: [
      {
        id: "void-sanctum",
        stageId: "mainGod",
        title: "虚空圣所",
        entryLabel: "探索虚空圣所",
        background: "content-packs/maingod-void/maps/chapter5.webp",
        spawn: [0.5, 0.76],
        walkable: [
          { type: "rect", x: 0.5, y: 0.76, w: 0.6, h: 0.32 },
          { type: "rect", x: 0.3, y: 0.52, w: 0.48, h: 0.56 },
          { type: "rect", x: 0.68, y: 0.46, w: 0.52, h: 0.6 },
          { type: "rect", x: 0.5, y: 0.3, w: 0.6, h: 0.28 },
        ],
        nodes: [
          {
            id: "shard-1",
            icon: "◆",
            label: "监察碎片：它记录着所有轮回者的构筑曲线",
            x: 0.26,
            y: 0.4,
            reward: { type: "fragment", value: "监察碎片·一", coins: 42 },
          },
          {
            id: "shard-2",
            icon: "◆",
            label: "监察碎片：包括你上一次轮回忘记选的技能",
            x: 0.72,
            y: 0.34,
            reward: { type: "fragment", value: "监察碎片·二", coins: 42 },
          },
          {
            id: "echo-1",
            icon: "✦",
            label: "回声火花：虚灵尸在重复别人的死亡姿势",
            x: 0.55,
            y: 0.56,
            reward: { type: "fragment", value: "回声火花·安魂", coins: 30 },
          },
          {
            id: "echo-2",
            icon: "✦",
            label: "回声火花：凛音认出那是黄泉流的安魂调",
            x: 0.4,
            y: 0.26,
            reward: { type: "fragment", value: "回声火花·摇篮曲", coins: 30 },
          },
          {
            id: "clue-1",
            icon: "✧",
            label: "裂口坐标：指向现实层的某个物流仓库",
            x: 0.62,
            y: 0.2,
            reward: { type: "fragment", value: "裂口坐标", coins: 55 },
          },
        ],
        events: [
          {
            id: "kagami-glitch",
            icon: "👁",
            title: "镜零的异常",
            text: "镜零的镜像在裂口前闪烁了三次。『监察者读取你的构筑，复制你的短板。下次轮回，带上它没见过的东西。』",
            x: 0.5,
            y: 0.46,
            choices: [
              {
                id: "listen",
                label: "听完镜零的警告",
                description: "了解主神投影的四阶段权能。",
                coins: 80,
                fragment: "四阶段权能记录",
              },
              {
                id: "pry",
                label: "追问裂口的去向",
                description: "把坐标转交给雨宫凛。",
                coins: 60,
                fragment: "雨宫凛的回信",
              },
            ],
          },
        ],
      },
    ],
  });
})();
