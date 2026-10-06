(function (global) {
  "use strict";
  // One merchandise catalog for shop rendering, purchase limits and save migration.
  var tal = {
    atk: {
      n: "破魔弹芯",
      i: "⚔️",
      d: "每级基础伤害 +5%",
      max: 10,
      base: 40, step: 35,
    },
    hp: {
      n: "巫女护体",
      i: "💗",
      d: "每级初始生命 +8",
      max: 10,
      base: 35, step: 30,
    },
    luck: {
      n: "神乐祝福",
      i: "✨",
      d: "每级暴击率 +2%",
      max: 8,
      base: 50, step: 45,
    },
    mag: {
      n: "灵核感应",
      i: "🧲",
      d: "每级拾取范围 +12",
      max: 8,
      base: 30, step: 28,
    },
    flow: {
      n: "战斗演算",
      i: "⏱️",
      d: "每级技能与冲刺冷却 -2%",
      max: 8,
      base: 55, step: 42,
    },
  };
  var mainGodUpgrades={power:{n:"权能增幅",i:"⚔️",d:"主神空间全伤害 +6%/级",max:5,base:3,step:4},vitality:{n:"轮回体魄",i:"💗",d:"主神空间生命 +8%/级",max:5,base:3,step:4},tempo:{n:"时间压缩",i:"⏱️",d:"攻速与技能循环 +4%/级",max:5,base:3,step:4},resonance:{n:"经验共鸣",i:"✦",d:"经验获取 +12%/级",max:5,base:3,step:4},fortune:{n:"命运偏斜",i:"🎲",d:"每局重抽次数 +1/级",max:4,base:3,step:4}};
  var mainGodItems={
    regenBlood:{n:"超凡血统·再生序列",i:"🧬",d:"每级生命 +6%，自然恢复 +0.35",max:3,base:10,step:8,group:"血统与灵能"},
    psiLink:{n:"心灵链接芯片",i:"🔮",d:"每级护盾 +22，主动技能威力 +8%",max:3,base:10,step:8,group:"血统与灵能"},
    gunBlade:{n:"枪剑同调印记",i:"⚔️",d:"每级枪弹、刀剑与弹速 +5%",max:3,base:12,step:9,group:"职业与技法"},
    mageCircuit:{n:"多重魔法回路",i:"✨",d:"每级法术与主动技能威力 +10%",max:3,base:12,step:9,group:"职业与技法"},
    summonPage:{n:"英灵召唤契约页",i:"👻",d:"开局获得使魔；每级召唤伤害 +15%",max:3,base:12,step:9,group:"职业与技法"},
    spaceRing:{n:"折叠军械空间戒",i:"💍",d:"永久解锁：主神空间开局额外弹幕、穿透和磁吸",max:1,base:22,step:0,group:"特殊效果道具"},
    rebirthDoll:{n:"因果替身人偶",i:"🪆",d:"永久解锁：每轮第一次致死时重构身体",max:1,base:28,step:0,group:"特殊效果道具"},
    sideKey:{n:"支线剧情权限钥匙",i:"🗝️",d:"每级通关额外奖励点 +2，并解锁隐藏日志",max:3,base:14,step:10,group:"特殊效果道具"},
  };
  mainGodItems.cursedHeart={n:"诅咒遗物·猩红心核",i:"🫀",d:"全伤害 +25%，最大生命 -18%；高风险永久兑换，可在重置时返还",max:1,base:24,step:0,group:"特殊效果道具"};
  var items={
    bait:{n:"丧尸诱饵",i:"🧟",max:3,base:90,step:70,d:"额外刷怪脉冲、普通波次 +8 秒/级、经验 +10%/级；仍受实体上限约束。"},
    ammo:{n:"穿甲弹匣",i:"🔩",max:1,base:140,step:0,d:"枪弹伤害 +12%、穿透 +1；刀剑伤害 -6%。"},
    whetstone:{n:"黄泉磨刀石",i:"🗡️",max:1,base:140,step:0,d:"刀剑伤害 +18%、主动技能 +8%；普通枪弹 -8%。"},
    mirror:{n:"便携镜盾",i:"🔷",max:1,base:155,step:0,d:"开局护盾 +36、减伤 +5%；攻击速度 -5%。"}
  };
  var starters={
    assault:{n:"夜樱火控核心",i:"🎯",d:"伤害、射速与暴击同步成长。适合纯初始挑战。",max:5,base:65,step:55},
    bastion:{n:"镜甲生存核心",i:"🛡️",d:"生命、减伤与基础伤害同步成长。容错最高。",max:5,base:65,step:55},
    flow:{n:"月影身法核心",i:"🌙",d:"移动、冲刺循环与基础伤害同步成长。奖励完美走位。",max:5,base:65,step:55},
    arcane:{n:"三相共鸣核心",i:"🔮",d:"护盾、技能与全伤害同步成长。后期章节收益更高。",max:5,base:65,step:55}
  };
  function level(value, product) {
    var n=Number(value);
    return Math.max(0,Math.min(product.max,Number.isFinite(n)?Math.floor(n):0));
  }
  function price(product, value) {return product.base+product.step*level(value,product);}
  function investment(product, value) {
    var n=level(value,product);
    return n*product.base+product.step*n*(n-1)/2;
  }
  [tal,mainGodUpgrades,mainGodItems,items,starters].forEach(function (group) {
    Object.keys(group).forEach(function (id) {Object.freeze(group[id]);});
    Object.freeze(group);
  });
  global.SakurayoCatalog=Object.freeze({tal:tal,mainGodUpgrades:mainGodUpgrades,mainGodItems:mainGodItems,items:items,starters:starters,level:level,price:price,investment:investment});
})(typeof window !== "undefined" ? window : globalThis);
