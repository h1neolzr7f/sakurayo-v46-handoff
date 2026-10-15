/* 颜色设计令牌（唯一的颜色来源）。由 tools/palette.py 在 OKLCH 空间生成，见 docs/COLOR_SYSTEM.md。
   UI 层（sakurayo-ui-*.js）禁止写死颜色，tools/check_colors.py 会检查。
   候选色板 A/B/C 可用 ?palette=B 或 SakurayoPalette("B") 切换，用于出效果图对比；默认使用选定的那一套。 */
(function (global) {
  "use strict";
  if (typeof document === "undefined") return;
  /* tokens:start */
  var SETS = {"A": {"n0": "5 13 28", "n1": "15 24 40", "n2": "29 38 56", "n3": "51 61 80", "n4": "117 129 150", "n5": "184 190 201", "n6": "232 239 251", "primary": "135 177 253", "primary-strong": "168 203 255", "on-primary": "8 17 35", "accent": "245 160 197", "on-accent": "35 14 24", "rare-n": "157 165 177", "rare-r": "94 173 226", "rare-sr": "180 132 232", "rare-ssr": "244 195 82", "ok": "92 203 137", "warn": "249 182 79", "danger": "240 86 83"}, "B": {"n0": "3 14 25", "n1": "12 26 37", "n2": "26 40 52", "n3": "48 63 76", "n4": "114 131 145", "n5": "182 191 199", "n6": "231 240 248", "primary": "84 216 244", "primary-strong": "143 239 255", "on-primary": "0 22 28", "accent": "246 147 192", "on-accent": "35 14 24", "rare-n": "157 165 177", "rare-r": "94 173 226", "rare-sr": "180 132 232", "rare-ssr": "244 195 82", "ok": "92 203 137", "warn": "249 182 79", "danger": "240 86 83"}, "C": {"n0": "12 11 28", "n1": "23 22 40", "n2": "37 36 55", "n3": "59 59 79", "n4": "126 126 149", "n5": "188 188 201", "n6": "237 237 250", "primary": "188 169 247", "primary-strong": "213 198 255", "on-primary": "19 13 33", "accent": "244 194 106", "on-accent": "31 20 1", "rare-n": "157 165 177", "rare-r": "94 173 226", "rare-sr": "180 132 232", "rare-ssr": "244 195 82", "ok": "92 203 137", "warn": "249 182 79", "danger": "240 86 83"}};
  var HEX = {"A": {"n0": "#050d1c", "n1": "#0f1828", "n2": "#1d2638", "n3": "#333d50", "n4": "#758196", "n5": "#b8bec9", "n6": "#e8effb", "primary": "#87b1fd", "primary-strong": "#a8cbff", "on-primary": "#081123", "accent": "#f5a0c5", "on-accent": "#230e18", "rare-n": "#9da5b1", "rare-r": "#5eade2", "rare-sr": "#b484e8", "rare-ssr": "#f4c352", "ok": "#5ccb89", "warn": "#f9b64f", "danger": "#f05653"}, "B": {"n0": "#030e19", "n1": "#0c1a25", "n2": "#1a2834", "n3": "#303f4c", "n4": "#728391", "n5": "#b6bfc7", "n6": "#e7f0f8", "primary": "#54d8f4", "primary-strong": "#8fefff", "on-primary": "#00161c", "accent": "#f693c0", "on-accent": "#230e18", "rare-n": "#9da5b1", "rare-r": "#5eade2", "rare-sr": "#b484e8", "rare-ssr": "#f4c352", "ok": "#5ccb89", "warn": "#f9b64f", "danger": "#f05653"}, "C": {"n0": "#0c0b1c", "n1": "#171628", "n2": "#252437", "n3": "#3b3b4f", "n4": "#7e7e95", "n5": "#bcbcc9", "n6": "#ededfa", "primary": "#bca9f7", "primary-strong": "#d5c6ff", "on-primary": "#130d21", "accent": "#f4c26a", "on-accent": "#1f1401", "rare-n": "#9da5b1", "rare-r": "#5eade2", "rare-sr": "#b484e8", "rare-ssr": "#f4c352", "ok": "#5ccb89", "warn": "#f9b64f", "danger": "#f05653"}};
  /* tokens:end */
  var CHOSEN = "A";
  function apply(k) { k = SETS[k] ? k : CHOSEN; var css = ":root{", s = SETS[k], h = HEX[k], n;
    for (n in s) css += "--c-" + n + ":" + h[n] + ";--c-" + n + "-rgb:" + s[n] + ";";
    // 语义别名：三个明度层级（背景 / 容器 / 悬浮）+ 线 + 文字
    css += "--c-surface-0:var(--c-n0);--c-surface-1:var(--c-n1);--c-surface-2:var(--c-n2);--c-line:rgb(var(--c-n3-rgb) / .9);--c-line-strong:rgb(var(--c-n4-rgb) / .9);--c-text-1:var(--c-n6);--c-text-2:var(--c-n5);--c-text-3:var(--c-n4);";
    // 兼容第 1～3 轮的旧令牌名
    css += "--sy-c-ink:var(--c-n6);--sy-c-sub:var(--c-n5);--sy-c-cyan:var(--c-primary);--sy-c-cyan-d:var(--c-primary);--sy-c-pink:var(--c-accent);--sy-c-red:var(--c-danger);--sy-c-gold:var(--c-rare-ssr);--sy-c-bg:var(--c-n0);--sy-c-panel:rgb(var(--c-n1-rgb) / .92);--sy-c-line:var(--c-line)}";
    var st = document.getElementById("syTokens") || document.head.appendChild(Object.assign(document.createElement("style"), { id: "syTokens" })); st.textContent = css; document.documentElement.dataset.palette = k;
    try { dispatchEvent(new Event("sakurayo-theme")); } catch (e) { } }
  var q = /[?&]palette=([ABC])/.exec(location.search || ""); apply(q ? q[1] : CHOSEN);
  global.SakurayoPalette = apply; global.SakurayoPaletteSets = HEX;
})(typeof window !== "undefined" ? window : globalThis);
