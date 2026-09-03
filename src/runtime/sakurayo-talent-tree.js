(function (global) {
  "use strict";

  var VERSION = "4.6.0";
  var styleInjected = false;
  var selectedId = "atk";

  var BRANCH_META = [
    { id: "luck", angle: -90, color: "#ffe08a", glow: "#ffe6a366", flavor: "神乐落在枝顶。暴击是夜樱忽然亮起来的那一下。" },
    { id: "atk", angle: -18, color: "#ff7eb6", glow: "#ff7eb666", flavor: "弹芯沿着右枝往外长。每一级都是更干净的贯穿。" },
    { id: "flow", angle: 54, color: "#8fe8ff", glow: "#8fe8ff55", flavor: "演算坠在右下。冷却变短，脚步就更像在跳舞。" },
    { id: "mag", angle: 126, color: "#c9a6ff", glow: "#c9a6ff55", flavor: "灵核朝左下伸。拾取半径变大，宝石会自己找你。" },
    { id: "hp", angle: 198, color: "#ff8aa8", glow: "#ff8aa866", flavor: "护体守着左枝。血条变厚，巫女才敢站到更近的地方。" },
  ];

  var DEFAULT_TALENTS = {
    atk: { n: "破魔弹芯", i: "⚔️", d: "每级基础伤害 +5%", max: 10, c: function (l) { return 40 + l * 35; } },
    hp: { n: "巫女护体", i: "💗", d: "每级初始生命 +8", max: 10, c: function (l) { return 35 + l * 30; } },
    luck: { n: "神乐祝福", i: "✨", d: "每级暴击率 +2%", max: 8, c: function (l) { return 50 + l * 45; } },
    mag: { n: "灵核感应", i: "🧲", d: "每级拾取范围 +12", max: 8, c: function (l) { return 30 + l * 28; } },
    flow: { n: "战斗演算", i: "⏱️", d: "每级技能与冲刺冷却 -2%", max: 8, c: function (l) { return 55 + l * 42; } },
  };

  function injectStyle() {
    if (styleInjected || !global.document) return;
    styleInjected = true;
    var style = global.document.createElement("style");
    style.id = "sakurayo-talent-tree-css";
    style.textContent =
      "#talentDrawer{background:radial-gradient(circle at 18% 0,#ff72b438 0%,#1a1030 34%,#060410 100%)}" +
      "#talentDrawer>.dhead h2{letter-spacing:.2em}" +
      "#talentDrawer>.dhead small{letter-spacing:.08em;color:#ffe6a3}" +
      "#talentList{display:block;max-width:none}" +
      ".talentTree46{display:grid;grid-template-columns:minmax(0,1fr) minmax(210px,30%);gap:12px;min-height:calc(100dvh - 96px);align-items:stretch}" +
      ".treeSky46{position:relative;overflow:hidden;border-radius:22px;border:1px solid #ffe6a344;background:" +
        "radial-gradient(circle at 50% 46%,#3a1840cc 0%,#12081ccc 42%,#070410f2 100%);box-shadow:inset 0 0 80px #ff70c222}" +
      ".treeSky46:before{content:\"\";position:absolute;inset:-20%;background:" +
        "radial-gradient(circle at 20% 18%,#ff9bcc22 0 8%,transparent 22%)," +
        "radial-gradient(circle at 78% 24%,#ffe08a18 0 10%,transparent 26%)," +
        "radial-gradient(circle at 62% 80%,#8fe8ff14 0 9%,transparent 24%);pointer-events:none}" +
      ".treePetal46{position:absolute;width:7px;height:10px;border-radius:70% 10% 70% 10%;background:#ffb7d688;opacity:.45;filter:blur(.2px);pointer-events:none}" +
      ".treeSvg46{position:absolute;inset:0;width:100%;height:100%;display:block}" +
      ".treeHit46{position:absolute;transform:translate(-50%,-50%);border:0;padding:0;background:transparent;color:inherit;cursor:pointer}" +
      ".treeHit46:focus-visible{outline:2px solid #ffe6a3aa;outline-offset:3px;border-radius:50%}" +
      ".treeCore46{width:86px;height:86px;border-radius:50%;border:1px solid #ffe6a388;background:radial-gradient(circle at 35% 30%,#ffe6a3,#ff72b4 42%,#3a1238 78%);box-shadow:0 0 28px #ff70c466,inset 0 0 18px #fff6}" +
      ".treeCore46 b,.treeCore46 small{display:block;color:#fff7fb;text-shadow:0 1px 6px #3a1038}" +
      ".treeCore46 b{font-size:22px;letter-spacing:.18em}" +
      ".treeCore46 small{margin-top:2px;font-size:10px;letter-spacing:.12em}" +
      ".treeNode46{width:44px;height:44px;border-radius:50%;border:1px solid #ffe6a355;background:#160c22ee;color:#fff7fb;box-shadow:0 0 0 3px #05020d88;display:grid;place-items:center;font-size:18px}" +
      ".treeNode46.on{box-shadow:0 0 16px var(--glow),0 0 0 3px #05020d88;border-color:#fff8}" +
      ".treeNode46.next{animation:treePulse46 1.6s ease-in-out infinite;border-color:#ffe6a3}" +
      ".treeNode46.lock{opacity:.42;filter:saturate(.4)}" +
      ".treeNode46.sel{box-shadow:0 0 0 3px #ffe6a3cc,0 0 22px var(--glow)}" +
      ".treeNode46 em{position:absolute;bottom:-15px;left:50%;transform:translateX(-50%);font-size:9px;font-style:normal;letter-spacing:.08em;color:#f7e7ff;white-space:nowrap;text-shadow:0 1px 4px #000}" +
      ".treePanel46{display:flex;flex-direction:column;gap:10px;padding:16px 14px 14px;border-radius:22px;border:1px solid #ffe6a344;background:linear-gradient(180deg,#1a1238f2,#0b0818f5)}" +
      ".treePanel46 .kicker46{color:#ffe6a3;letter-spacing:.28em;font-size:10px}" +
      ".treePanel46 h3{margin:0;color:#fff7fb;font-size:22px;letter-spacing:.08em}" +
      ".treePanel46 h3 small{margin-left:8px;color:#ffd3ea;font-size:12px;letter-spacing:0}" +
      ".treePanel46 p{margin:0;color:#d7cce4;font-size:13px;line-height:1.55}" +
      ".treePanel46 .flavor46{color:#bfb1d3;font-size:11px;line-height:1.5}" +
      ".treePips46{display:flex;flex-wrap:wrap;gap:5px}" +
      ".treePips46 i{width:12px;height:12px;border-radius:50%;background:#ffffff18;border:1px solid #ffe6a322}" +
      ".treePips46 i.on{background:linear-gradient(180deg,#ffe08a,#ff72b4);box-shadow:0 0 8px #ff70c466}" +
      ".treeCost46{color:#ffe6a3;font-size:13px;font-weight:800}" +
      ".treeBuy46{min-height:46px;border:0;border-radius:14px;background:linear-gradient(180deg,#ff86cc,#b02078);color:#fff;font-weight:800;letter-spacing:.12em}" +
      ".treeBuy46:disabled{opacity:.45;background:#2a2038;color:#cbbfd8}" +
      ".treeEffect46{display:flex;justify-content:space-between;gap:8px;padding:8px 0 2px;border-top:1px solid #ffe6a322;color:#fff7fb;font-size:12px}" +
      "@keyframes treePulse46{0%,100%{box-shadow:0 0 8px var(--glow)}50%{box-shadow:0 0 20px var(--glow)}}" +
      "html.landscape46 #talentDrawer>.dbody{max-width:none;padding:0 16px 16px}" +
      "html.landscape46 .talentTree46{min-height:calc(100dvh - 84px)}" +
      "@media(max-width:700px){.talentTree46{grid-template-columns:1fr;min-height:auto}.treeSky46{min-height:320px}.treePanel46{min-height:auto}}";
    global.document.head.appendChild(style);
  }

  function talentsOf(view) {
    return (view && view.talents) || DEFAULT_TALENTS;
  }

  function normalizeTal(tal) {
    var out = { atk: 0, hp: 0, luck: 0, mag: 0, flow: 0 };
    var src = tal && typeof tal === "object" ? tal : {};
    Object.keys(out).forEach(function (id) {
      var n = Math.floor(Number(src[id]) || 0);
      out[id] = n < 0 ? 0 : n;
    });
    return out;
  }

  function milestones(max) {
    if (max >= 10) return [1, 4, 7, 10];
    return [1, 3, 6, 8];
  }

  function branchOf(id) {
    for (var i = 0; i < BRANCH_META.length; i++) if (BRANCH_META[i].id === id) return BRANCH_META[i];
    return BRANCH_META[1];
  }

  function costOf(id, level, talents) {
    var def = (talents || DEFAULT_TALENTS)[id];
    if (!def) return 0;
    return def.c(Math.max(0, Math.floor(Number(level) || 0)));
  }

  function canBuy(id, tal, coins, talents) {
    var defs = talents || DEFAULT_TALENTS;
    var def = defs[id];
    if (!def) return { ok: false, reason: "unknown" };
    var lv = normalizeTal(tal)[id] || 0;
    if (lv >= def.max) return { ok: false, reason: "max", level: lv, max: def.max };
    var cost = def.c(lv);
    var wallet = Math.max(0, Math.floor(Number(coins) || 0));
    if (wallet < cost) return { ok: false, reason: "coins", cost: cost, coins: wallet, level: lv };
    return { ok: true, cost: cost, level: lv, next: lv + 1, max: def.max };
  }

  function polar(cx, cy, angle, radius) {
    var rad = (angle * Math.PI) / 180;
    return { x: cx + Math.cos(rad) * radius, y: cy + Math.sin(rad) * radius };
  }

  function layout(view) {
    var defs = talentsOf(view);
    var tal = normalizeTal(view && view.tal);
    var cx = 320;
    var cy = 228;
    var nodes = [];
    BRANCH_META.forEach(function (meta) {
      var def = defs[meta.id];
      if (!def) return;
      var lv = tal[meta.id] || 0;
      var marks = milestones(def.max);
      marks.forEach(function (need, idx) {
        var pt = polar(cx, cy, meta.angle, 68 + idx * 40);
        var filled = lv >= need;
        var nextNeed = idx === 0 ? 1 : marks[idx - 1] + 1;
        var isNext = !filled && lv + 1 >= nextNeed && lv < need && lv < def.max;
        nodes.push({
          id: meta.id,
          level: need,
          x: pt.x,
          y: pt.y,
          filled: filled,
          next: isNext,
          color: meta.color,
          glow: meta.glow,
          icon: def.i,
          name: def.n,
        });
      });
    });
    return { cx: cx, cy: cy, nodes: nodes, tal: tal, defs: defs };
  }

  function effectLine(id, level) {
    if (id === "atk") return "基础伤害 +" + level * 5 + "%";
    if (id === "hp") return "初始生命 +" + level * 8;
    if (id === "luck") return "暴击率 +" + level * 2 + "%";
    if (id === "mag") return "拾取范围 +" + level * 12;
    if (id === "flow") return "冷却 -" + level * 2 + "%";
    return "";
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]);
    });
  }

  function petalHtml() {
    var bits = [];
    var spots = [
      [12, 18, 18, 0.7], [78, 14, 32, 1.1], [22, 72, 26, 0.9],
      [88, 66, 14, 1.4], [40, 8, 40, 0.8], [64, 82, 22, 1.2],
    ];
    spots.forEach(function (p, i) {
      bits.push(
        '<i class="treePetal46" style="left:' + p[0] + "%;top:" + p[1] + "%;transform:rotate(" +
          p[2] + "deg);animation:treePulse46 " + p[3] + "s " + (i * 0.2) + 's ease-in-out infinite"></i>'
      );
    });
    return bits.join("");
  }

  function svgHtml(map) {
    var lines = [];
    BRANCH_META.forEach(function (meta) {
      var def = map.defs[meta.id];
      if (!def) return;
      var lv = map.tal[meta.id] || 0;
      var end = polar(map.cx, map.cy, meta.angle, 196);
      var fill = polar(map.cx, map.cy, meta.angle, 62 + Math.min(def.max, lv) * (128 / def.max));
      lines.push(
        '<line x1="' + map.cx + '" y1="' + map.cy + '" x2="' + end.x.toFixed(1) + '" y2="' + end.y.toFixed(1) +
          '" stroke="#ffe6a322" stroke-width="6" stroke-linecap="round"/>'
      );
      lines.push(
        '<line x1="' + map.cx + '" y1="' + map.cy + '" x2="' + fill.x.toFixed(1) + '" y2="' + fill.y.toFixed(1) +
          '" stroke="' + meta.color + '" stroke-width="3.2" stroke-linecap="round" opacity="0.9"/>'
      );
    });
    return (
      '<svg class="treeSvg46" viewBox="0 0 640 420" aria-hidden="true">' +
      '<defs><radialGradient id="treeCoreGlow46" cx="50%" cy="45%"><stop offset="0%" stop-color="#ffe6a3aa"/><stop offset="100%" stop-color="#ff70c400"/></radialGradient></defs>' +
      '<circle cx="320" cy="228" r="86" fill="url(#treeCoreGlow46)"/>' +
      lines.join("") +
      "</svg>"
    );
  }

  function nodeButtons(map, selected) {
    return map.nodes.map(function (node) {
      var cls = "treeNode46" + (node.filled ? " on" : "") + (node.next ? " next" : "") + (!node.filled && !node.next ? " lock" : "") + (selected === node.id ? " sel" : "");
      var left = ((node.x / 640) * 100).toFixed(2);
      var top = ((node.y / 420) * 100).toFixed(2);
      return (
        '<button type="button" class="treeHit46" data-branch="' + node.id + '" data-level="' + node.level +
          '" style="left:' + left + "%;top:" + top + '%" aria-label="' + escapeHtml(node.name) + " Lv." + node.level + '">' +
        '<span class="' + cls + '" style="--glow:' + node.glow + '">' + node.icon +
        "<em>Lv." + node.level + "</em></span></button>"
      );
    }).join("");
  }

  function pipsHtml(level, max) {
    var bits = [];
    for (var i = 1; i <= max; i++) bits.push('<i class="' + (i <= level ? "on" : "") + '"></i>');
    return '<div class="treePips46">' + bits.join("") + "</div>";
  }

  function panelHtml(view, map) {
    var id = selectedId;
    if (!map.defs[id]) id = "atk";
    var def = map.defs[id];
    var meta = branchOf(id);
    var lv = map.tal[id] || 0;
    var check = canBuy(id, map.tal, view && view.coins, map.defs);
    var charName = (view && view.character && (view.character.short || view.character.name)) || "小夜";
    var nextText = lv >= def.max ? "已满级" : effectLine(id, lv + 1);
    var buyLabel = check.ok ? ("点枝 🌸 " + check.cost) : check.reason === "max" ? "MAX" : ("还差 🌸 " + (check.cost - (check.coins || 0)));
    return (
      '<aside class="treePanel46">' +
      '<div class="kicker46">樱核树 · ' + escapeHtml(charName) + "</div>" +
      "<h3>" + escapeHtml(def.n) + "<small>Lv." + lv + "/" + def.max + "</small></h3>" +
      "<p>" + escapeHtml(def.d) + "</p>" +
      pipsHtml(lv, def.max) +
      '<div class="treeEffect46"><span>当前 ' + escapeHtml(effectLine(id, lv) || "尚未点亮") +
        "</span><span>下级 " + escapeHtml(nextText) + "</span></div>" +
      '<p class="flavor46">' + escapeHtml(meta.flavor) + "</p>" +
      '<div class="treeCost46">' + (check.reason === "max" ? "这一枝已经开到尽头" : ("下次点枝 🌸 " + check.cost)) + "</div>" +
      '<button type="button" class="treeBuy46" data-buy="' + id + '"' + (check.ok ? "" : " disabled") + ">" + buyLabel + "</button>" +
      "</aside>"
    );
  }

  function html(view) {
    var map = layout(view);
    if (!map.defs[selectedId]) selectedId = "atk";
    var rank = Math.max(1, Math.floor(Number(view && view.rank) || 1));
    var short = (view && view.character && view.character.short) || "小夜";
    return (
      '<div class="talentTree46">' +
      '<div class="treeSky46">' +
      petalHtml() +
      svgHtml(map) +
      '<button type="button" class="treeHit46 treeCore46" data-branch="' + selectedId + '" style="left:50%;top:54%" aria-label="樱核">' +
      "<b>樱</b><small>" + escapeHtml(short) + " · " + rank + "</small></button>" +
      nodeButtons(map, selectedId) +
      "</div>" +
      panelHtml(view, map) +
      "</div>"
    );
  }

  function bind(box, view) {
    if (!box || !box.querySelectorAll) return;
    var hits = box.querySelectorAll("[data-branch]");
    for (var i = 0; i < hits.length; i++) {
      hits[i].onclick = function () {
        selectedId = this.getAttribute("data-branch") || "atk";
        render(box, view);
      };
    }
    var buy = box.querySelector("[data-buy]");
    if (buy) {
      buy.onclick = function () {
        var id = this.getAttribute("data-buy");
        if (typeof view.onBuy === "function") view.onBuy(id);
        else render(box, view);
      };
    }
  }

  function render(box, view) {
    injectStyle();
    if (!box) return null;
    var next = view || {};
    if (next.selected && talentsOf(next)[next.selected]) selectedId = next.selected;
    box.innerHTML = html(next);
    bind(box, next);
    return { selected: selectedId, layout: layout(next) };
  }

  global.SakurayoTalentTree = {
    version: VERSION,
    BRANCHES: BRANCH_META,
    DEFAULT_TALENTS: DEFAULT_TALENTS,
    normalizeTal: normalizeTal,
    milestones: milestones,
    costOf: costOf,
    canBuy: canBuy,
    layout: layout,
    effectLine: effectLine,
    html: html,
    render: render,
    selected: function () { return selectedId; },
    select: function (id) {
      if (DEFAULT_TALENTS[id] || id === "atk") selectedId = id;
      return selectedId;
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
