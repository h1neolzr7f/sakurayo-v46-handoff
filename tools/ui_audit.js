/* 图标与文字可读性自动检查（被 tools/sweep.mjs 注入页面）。规则见 docs/PLAYBOOK.md「图标与文字」。
   返回 {fails:[...], stats:{...}}；fails 非空 = 不达标。 */
(function (global) {
  function rgb(s) { var o = String(s).match(/oklch\(([^)]+)\)/); if (o && !/rgba?\(/.test(String(s).slice(0, o.index))) { var q = o[1].split(/[ ,/]+/).filter(Boolean), L = parseFloat(q[0]) / (/%/.test(q[0]) ? 100 : 1), lin = L * L * L, sv = lin <= 0.0031308 ? 12.92 * lin : 1.055 * Math.pow(lin, 1 / 2.4) - 0.055; return { r: sv * 255, g: sv * 255, b: sv * 255, a: q.length > 3 ? parseFloat(q[3]) / (/%/.test(q[3]) ? 100 : 1) : 1 }; } var m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null; var p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; }
  function lum(c) { function f(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); } return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); }
  function ratio(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function mix(top, bot) { var a = top.a; return { r: top.r * a + bot.r * (1 - a), g: top.g * a + bot.g * (1 - a), b: top.b * a + bot.b * (1 - a), a: 1 }; }
  // 向上找背景：纯色叠加；遇到图片 / 渐变 / canvas / 立绘 => 视为“压在图上”
  function backdrop(el) {
    var layers = [], e = el;
    while (e && e.nodeType === 1) {
      var c = getComputedStyle(e), bi = c.backgroundImage;
      var col = rgb(c.backgroundColor);
      if (bi && bi !== "none") { var gm = bi.match(/(?:rgba?|oklch)\([^)]+\)/); if (/url\(/.test(bi) && !(col && col.a > 0.85)) return { image: true, layers: layers }; if (gm) { var gc = rgb(gm[0]); if (gc && gc.a > 0) layers.push(gc); if (gc && gc.a > 0.85) break; } }
      if (col && col.a > 0) { layers.push(col); if (col.a > 0.85) break; }
      e = e.parentElement;
    }
    if (!e || e.nodeType !== 1 || e === document.documentElement) {
      // 到顶都没有实底：下面是 canvas 或场景图
      var under = document.elementsFromPoint ? null : null;
      return { image: true, layers: layers };
    }
    var base = layers.pop(); while (layers.length) base = mix(layers.pop(), base);
    return { color: base };
  }
  function visible(e, c, r) { return c.visibility !== "hidden" && +c.opacity > 0.05 && r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth; }
  function covered(e, r) { var x = Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2)), y = Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2)); var t = document.elementFromPoint(x, y); return t && t !== e && !e.contains(t) && !t.contains(e) && !(t.closest && t.closest("[data-sy-audit-ignore]")); }
  function name(e) { return (e.id ? "#" + e.id : (typeof e.className === "string" && e.className ? "." + e.className.trim().split(/\s+/)[0] : e.tagName.toLowerCase())); }
  function audit(opts) {
    opts = opts || {}; var touch = !!opts.touch, desktop = innerWidth >= 1000;
    var bodyMin = desktop ? 14 : 12, auxMin = 11, fails = [], st = { text: 0, icons: 0, targets: 0, canvasText: 0 };
    var all = document.querySelectorAll("body *");
    for (var i = 0; i < all.length; i++) {
      var e = all[i]; if (e.closest("[data-sy-audit-ignore],script,style,svg")) continue;
      var c = getComputedStyle(e), r = e.getBoundingClientRect(); if (!visible(e, c, r)) continue;
      var own = ""; for (var k = 0; k < e.childNodes.length; k++) if (e.childNodes[k].nodeType === 3) own += e.childNodes[k].textContent; own = own.trim();
      if (own && /[\p{L}\p{N}]/u.test(own) && !covered(e, r)) {
        st.text++;
        var fs = parseFloat(c.fontSize), fw = +c.fontWeight || 400, isAux = own.length <= 8 || e.tagName === "SMALL" || fs < bodyMin && own.length <= 14;
        var need = isAux ? auxMin : bodyMin;
        if (fs < need - 0.25) fails.push("font:" + name(e) + ":" + Math.round(fs * 10) / 10 + "<" + need + ":" + own.slice(0, 12));
        var fg = rgb(c.color); if (fg) {
          fg = { r: fg.r, g: fg.g, b: fg.b, a: 1 };
          var big = fs >= 24 || fs >= 18.66 && fw >= 700, min = big ? 3 : 4.5;
          var bd = backdrop(e);
          if (bd.image) { var plate = c.textShadow !== "none" || parseFloat(c.webkitTextStrokeWidth) > 0; if (!plate) fails.push("noplate:" + name(e) + ":" + own.slice(0, 12)); }
          else if (bd.color) { var rr = ratio(fg, bd.color); if (rr < min - 0.05) fails.push("contrast:" + name(e) + ":" + rr.toFixed(2) + "<" + min + ":" + own.slice(0, 12)); }
        }
        if (c.overflow !== "visible" && c.webkitLineClamp === "none" && !(c.textOverflow === "ellipsis" && c.whiteSpace === "nowrap") && (e.scrollWidth > e.clientWidth + 2 || e.scrollHeight > e.clientHeight + 4 && c.overflowY === "hidden")) fails.push("trunc:" + name(e) + ":" + own.slice(0, 12));
      }
      // 图标
      var isIcon = e.matches("svg.syIco") ? false : (e.tagName === "IMG" && r.width <= 64 && r.height <= 64);
      if (e.tagName === "IMG" && isIcon && !covered(e, r)) {
        st.icons++;
        var main = !!e.closest("[data-sy-main],#nav46,.navBar46,.modeRow46");
        var mn = main ? 28 : 20; if (Math.min(r.width, r.height) < mn - 0.5) fails.push("icon:" + name(e) + ":" + Math.round(Math.min(r.width, r.height)) + "<" + mn);
        if (e.naturalWidth && e.naturalWidth < r.width * 2 - 1 && !/\.svg/.test(e.currentSrc || "")) fails.push("icon1x:" + name(e) + ":" + e.naturalWidth + "px@" + Math.round(r.width));
      }
      if (touch && (e.tagName === "BUTTON" || e.getAttribute("role") === "button") && !e.disabled && !covered(e, r)) {
        st.targets++;
        if (Math.min(r.width, r.height) < 43.5) fails.push("target:" + name(e) + ":" + Math.round(r.width) + "x" + Math.round(r.height) + ":" + (e.textContent || "").trim().slice(0, 8));
      }
    }
    document.querySelectorAll("svg.syIco").forEach(function (s) {
      var r = s.getBoundingClientRect(), c = getComputedStyle(s); if (!visible(s, c, r) || covered(s, r)) return; st.icons++;
      var main = !!s.closest("[data-sy-main],#nav46,.navBar46,.modeRow46"), mn = main ? 28 : 20;
      if (Math.min(r.width, r.height) < mn - 0.5 && !s.closest("[data-sy-badge]")) fails.push("icon:" + name(s.parentElement) + ":" + Math.round(Math.min(r.width, r.height)) + "<" + mn);
    });
    // Canvas 文字（弹幕信息面板 / 格斗 HUD / 出招表等），由 initScript 钩 fillText 记录实际像素字号
    (global.__syCanvasText || []).forEach(function (t) { st.canvasText++; if (t.px < auxMin - 0.25) fails.push("cfont:" + t.where + ":" + t.px.toFixed(1) + "<" + auxMin + ":" + t.s); if (t.body && t.px < bodyMin - 0.25) fails.push("cfont:" + t.where + ":" + t.px.toFixed(1) + "<" + bodyMin + ":" + t.s); });
    var uniq = Array.from(new Set(fails));
    return { fails: uniq, stats: st };
  }
  global.SyAudit = { audit: audit };
  // fillText 钩子
  if (global.CanvasRenderingContext2D && !global.__syHook) {
    global.__syHook = 1; global.__syCanvasText = []; var seen = {}; global.__syCanvasReset = function () { global.__syCanvasText = []; seen = {}; };
    var P = CanvasRenderingContext2D.prototype, ft = P.fillText;
    P.fillText = function (s, x, y) {
      try {
        var cv = this.canvas; if (cv && cv.isConnected && cv.clientWidth) {
          var m = this.getTransform(), sc = Math.hypot(m.a, m.b) * cv.clientWidth / cv.width, px = (parseFloat((this.font.match(/([\d.]+)px/) || [])[1]) || 10) * sc;
          var a = this.globalAlpha; var str = String(s);
          if (a > 0.3 && /[\p{L}\p{N}]/u.test(str)) { var key = str.slice(0, 10) + "|" + Math.round(px); if (!seen[key]) { seen[key] = 1; global.__syCanvasText.push({ s: str.slice(0, 10), px: px, where: cv.id || cv.parentElement && (cv.parentElement.id || cv.parentElement.className) || "canvas", body: str.length > 12 }); if (global.__syCanvasText.length > 400) global.__syCanvasText.shift(); } }
        }
      } catch (e) {}
      return ft.apply(this, arguments);
    };
  }
})(window);
