/* 立绘头部锚点定位：让立绘的头顶落在“头部安全线”之下（页头横幅 / 顶栏的底边 + 间距），
   不随屏幕比例被裁掉或被 UI 盖住。立绘图都是 2:3 全身像，HEAD 记录头顶在图中的相对高度。 */
(function (global) {
  "use strict";
  if (typeof document === "undefined") return;
  var HEAD = { sayo: 0.035, aya: 0.06, rion: 0.03, crown: 0.0 };
  function headOf(img) { var m = /up_(\w+)\.webp/.exec(img.currentSrc || img.src || ""); return m && HEAD[m[1]] != null ? HEAD[m[1]] : 0.03; }
  // 头部安全线：所有“盖在立绘上方”的 UI 的底边最大值
  function safeLine(img, sel, x0, x1) {
    var y = 0; (img.closest(".drawer") || document).querySelectorAll(sel).forEach(function (e) { var r = e.getBoundingClientRect(); if (r.height && r.bottom < innerHeight * 0.5 && r.right > x0 && r.left < x1) y = Math.max(y, r.bottom); });
    return y;
  }
  function fit(img, o) {
    var box = img.offsetParent; if (!box || !img.naturalWidth) return;
    var br = box.getBoundingClientRect(); if (!br.height) return;
    var gap = Math.max(8, br.height * 0.03), safe = Math.max(br.top, safeLine(img, o.cover, img.getBoundingClientRect().left, img.getBoundingClientRect().right)) + gap - br.top;
    var ar = img.naturalWidth / img.naturalHeight, head = headOf(img);
    // 可用高度 → 显示 keep 比例的全身（脚下可裁），头顶贴安全线
    var H = (br.height - safe) / (o.keep - head);
    var maxW = br.width * o.maxW; if (H * ar > maxW) H = maxW / ar;
    var top = safe - head * H;
    var s = img.style;
    s.setProperty("top", top + "px", "important"); s.setProperty("bottom", "auto", "important");
    s.setProperty("height", H + "px", "important"); s.setProperty("width", H * ar + "px", "important");
    s.setProperty("object-fit", "contain", "important"); s.setProperty("object-position", "50% 0", "important");
    img.setAttribute("data-head-fit", Math.round(safe));
  }
  var RULES = [{ sel: "#gachaDrawer .wishHero46", cover: ".dhead,.wishTitle46", keep: 0.9, maxW: 0.5 }];
  function run() { RULES.forEach(function (r) { document.querySelectorAll(r.sel).forEach(function (img) { if (img.complete) fit(img, r); else img.addEventListener("load", function () { fit(img, r); }, { once: true }); }); }); }
  var t = 0; function later() { if (!t) t = requestAnimationFrame(function () { t = 0; run(); }); }
  function boot() { new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) for (var j = 0; j < ms[i].addedNodes.length; j++) { var n = ms[i].addedNodes[j]; if (n.nodeType === 1 && (n.matches(".wishHero46,.wishStage46") || n.querySelector && n.querySelector(".wishHero46"))) { later(); return; } } }).observe(document.body, { childList: true, subtree: true }); addEventListener("resize", later); document.addEventListener("transitionend", function (e) { if (e.target && e.target.classList && e.target.classList.contains("drawer")) later(); }); later(); }
  if (document.body) boot(); else document.addEventListener("DOMContentLoaded", boot);
  global.SyPortrait = { fit: fit, run: run, HEAD: HEAD };
})(window);
