/* 字号阶梯与可读性底线（只用设计令牌）。
   阶梯：--fs-aux 11 / --fs-body 14（844 宽横屏 12）/ --fs-sub 16 / --fs-title 20 / --fs-hero 28。
   1) CSS：触屏点击区 ≥44px、次要图标 ≥20px、压图文字统一描边底板。
   2) 运行时兜底 SyType.enforce()：任何低于阶梯的文字抬到 --fs-aux / --fs-body；对比度不足的辅助文字改用 --c-n5/--c-n6；
      压在图片 / 场景上且没底板的文字加 --sy-plate 描边。DOM 变化后去抖执行，不碰 canvas。 */
(function (global) {
  "use strict";
  if (typeof document === "undefined") return;
  var css = ""
    + ":root{--fs-aux:11px;--fs-body:14px;--fs-sub:16px;--fs-title:20px;--fs-hero:28px;--sy-plate:0 1px 2px rgb(var(--c-n0-rgb) / .95),0 0 6px rgb(var(--c-n0-rgb) / .85)}"
    + "@media (max-width:1000px){:root{--fs-body:12px;--fs-sub:14px;--fs-title:18px;--fs-hero:24px}}"
    + "@media (pointer:coarse){html body:not(#sy0):not(#sy1):not(#sy2):not(#sy3) button:not(.syTypeSmallOk){min-height:44px!important;min-width:44px!important}}"
    + "html body .r46Shard .syIco,html body .wishCoin46{min-width:20px;min-height:20px}"
    + "html body #run46 .rn46 .st46{width:24px!important;height:24px!important;right:-8px!important;bottom:-6px!important}html body #run46 .rn46 .st46 .syIco{width:20px!important;height:20px!important}"
    + "html body:not(#sy0):not(#sy1):not(#sy2):not(#sy3):not(#sy4):not(#sy5) #start small,html body:not(#sy0):not(#sy1):not(#sy2):not(#sy3):not(#sy4):not(#sy5) #start b{text-shadow:0 0 4px rgb(var(--c-n6-rgb) / .7),0 0 1px rgb(var(--c-n6-rgb) / .9)!important}"
    + "html body:not(#sy0):not(#sy1):not(#sy2):not(#sy3) .gachaActions46 button small{background:rgb(var(--c-n0-rgb) / .62)!important}"
    /* 窄横屏放不下的装饰性英文 / 重复信息：隐藏而不是缩到 11px 以下 */
    + "html body:not(#sy0):not(#sy1):not(#sy2) :is(#runBtn46,#levelMapBtn46,#wdBtn46,#pachiBtn46)>small{display:none!important}"
    + "@media (max-width:1000px){html body .coverTitle36>span{display:none!important}html body #syTod{display:none!important}html body .commandHeading47>small{visibility:hidden!important;white-space:nowrap!important;overflow:hidden}}"
    + "html body .syPlate{text-shadow:var(--sy-plate)!important}";
  var st = document.createElement("style"); st.id = "syType"; st.textContent = css; (document.head || document.documentElement).appendChild(st);

  function rgb(s) { var o = String(s).match(/oklch\(([^)]+)\)/); if (o && !/rgba?\(/.test(String(s).slice(0, o.index))) { var q = o[1].split(/[ ,/]+/).filter(Boolean), L = parseFloat(q[0]) / (/%/.test(q[0]) ? 100 : 1), lin = L * L * L, sv = lin <= 0.0031308 ? 12.92 * lin : 1.055 * Math.pow(lin, 1 / 2.4) - 0.055; return { r: sv * 255, g: sv * 255, b: sv * 255, a: q.length > 3 ? parseFloat(q[3]) / (/%/.test(q[3]) ? 100 : 1) : 1 }; } var m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null; var p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; }
  function lum(c) { function f(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); } return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); }
  function mix(t, b) { var a = t.a; return { r: t.r * a + b.r * (1 - a), g: t.g * a + b.g * (1 - a), b: t.b * a + b.b * (1 - a), a: 1 }; }
  function backdrop(el) {
    var layers = [], e = el;
    while (e && e.nodeType === 1 && e !== document.documentElement) {
      var c = getComputedStyle(e), bi = c.backgroundImage, col = rgb(c.backgroundColor);
      if (bi && bi !== "none") { if (/url\(/.test(bi) && !(col && col.a > 0.85)) return null; var gm = bi.match(/(?:rgba?|oklch)\([^)]+\)/); if (gm) { var gc = rgb(gm[0]); if (gc && gc.a > 0) layers.push(gc); if (gc && gc.a > 0.85) break; } }
      if (col && col.a > 0) { layers.push(col); if (col.a > 0.85) break; }
      e = e.parentElement;
    }
    if (!e || e === document.documentElement) return null;
    var base = layers.pop(); while (layers.length) base = mix(layers.pop(), base); return base;
  }
  var n5, n6, n0;
  function tok() { var r = getComputedStyle(document.documentElement); function g(n) { var v = r.getPropertyValue(n).trim().split(/\s+/).map(Number); return v.length >= 3 ? { r: v[0], g: v[1], b: v[2], a: 1 } : null; } n5 = g("--c-n5-rgb") || { r: 184, g: 190, b: 201 }; n6 = g("--c-n6-rgb") || { r: 240, g: 243, b: 250 }; n0 = g("--c-n0-rgb") || { r: 10, g: 12, b: 20 }; }
  function ratio(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function enforce(root) {
    if (!n5) tok();
    var desk = innerWidth >= 1000, body = desk ? 14 : 12;
    var all = (root || document.body).querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      var e = all[i]; if (e.closest("svg,script,style,canvas,[data-sy-type-skip]")) continue;
      var own = ""; for (var k = 0; k < e.childNodes.length; k++) if (e.childNodes[k].nodeType === 3) own += e.childNodes[k].textContent; own = own.trim();
      if (!own || !/[\p{L}\p{N}]/u.test(own)) continue;
      var c = getComputedStyle(e); if (c.display === "none") continue;
      var fs = parseFloat(c.fontSize), isAux = own.length <= 8 || e.tagName === "SMALL" || fs < body && own.length <= 14;
      var need = isAux ? 11 : body;
      if (fs < need - 0.25) { e.style.setProperty("font-size", isAux ? "var(--fs-aux)" : "var(--fs-body)", "important"); e.setAttribute("data-sy-fs", "1"); }
      if (c.overflow !== "visible" && c.webkitLineClamp === "none" && (c.textOverflow !== "ellipsis" || c.whiteSpace !== "nowrap") && (e.scrollWidth > e.clientWidth + 2 || e.scrollHeight > e.clientHeight + 4)) { e.style.setProperty("text-overflow", "ellipsis", "important"); e.style.setProperty("white-space", "nowrap", "important"); if (!e.title) e.title = own; }
      var bd = backdrop(e), fg = rgb(c.color); if (!fg) continue;
      if (!bd) { if (c.textShadow === "none" && !(parseFloat(c.webkitTextStrokeWidth) > 0)) e.classList.add("syPlate"); continue; }
      var big = fs >= 24 || fs >= 18.66 && (+c.fontWeight || 400) >= 700, min = big ? 3 : 4.5;
      if (ratio({ r: fg.r, g: fg.g, b: fg.b, a: 1 }, bd) < min) {
        var dark = lum(bd) < 0.25;
        e.style.setProperty("color", dark ? (ratio(n5, bd) >= min ? "var(--c-n5)" : "var(--c-n6)") : "var(--c-n0)", "important");
      }
    }
  }
  /* 只处理新增 / 换 class 的子树；纯文字更新（计时、击破数）跳过，避免战斗中反复全量计算样式 */
  var pend = new Set(), t = 0;
  function flush() { t = 0; var list = Array.from(pend); pend.clear(); try { list.forEach(function (n) { if (n.isConnected) { enforceOne(n); enforce(n); } }); } catch (e) {} }
  function queue(n) { if (n && n.nodeType === 1) { pend.add(n); if (!t) t = setTimeout(flush, 150); } }
  function onMut(ms) {
    for (var i = 0; i < ms.length; i++) {
      var m = ms[i];
      if (m.type === "attributes") { queue(m.target); continue; }
      for (var j = 0; j < m.addedNodes.length; j++) queue(m.addedNodes[j]);
    }
  }
  function enforceOne(e) { var w = document.createElement("div"); w = null; if (e.parentElement) enforce(e.parentElement.contains(e) ? wrap(e) : e); }
  function wrap(e) { return { querySelectorAll: function () { return [e]; } }; }
  function fixTrunc() {
    document.querySelectorAll("[data-sy-fs],small,p").forEach(function (e) { var c = getComputedStyle(e); if (c.overflow !== "visible" && e.scrollWidth > e.clientWidth + 2) { e.style.setProperty("text-overflow", "ellipsis", "important"); e.style.setProperty("white-space", "nowrap", "important"); if (!e.title) e.title = e.textContent.trim(); } });
  }
  function full() { try { enforce(); fixTrunc(); } catch (e) {} }
  function boot() { full(); setTimeout(full, 1500); new MutationObserver(function (ms) { onMut(ms); clearTimeout(boot.ft); boot.ft = setTimeout(fixTrunc, 400); }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] }); addEventListener("resize", function () { document.querySelectorAll("[data-sy-fs]").forEach(function (e) { e.style.removeProperty("font-size"); }); full(); }); }
  if (document.body) boot(); else document.addEventListener("DOMContentLoaded", boot);
  global.SyType = { enforce: enforce };
})(window);
