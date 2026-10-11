/* 共用 UI 组件（ART_PASS ⑥ 统一规范）：血条、分段气槽、切角信息面板、菱形 / 六边形按键。
   各模式（割草 HUD、弹幕右侧面板、格斗 HUD、夜行地图顶栏）都从这里取，颜色只用设计令牌（SakurayoTok / var(--c-*)）。
   Canvas 版：SyKit.bar / SyKit.meter / SyKit.panel / SyKit.hex / SyKit.cut；DOM 版：.sykBar / .sykBtn.dia / .sykBtn.hex / .sykPanel。 */
(function (global) {
  "use strict";
  var T = function (n, a) { return global.SakurayoTok ? global.SakurayoTok(n, a) : "gray"; };
  // 切角四边形：左上、右下切角（崩三面板语言）；flip 时镜像
  function cut(g, x, y, w, h, c, flip) {
    c = Math.min(c == null ? h * 0.5 : c, w / 2, h);
    g.beginPath();
    if (!flip) { g.moveTo(x + c, y); g.lineTo(x + w, y); g.lineTo(x + w - c, y + h); g.lineTo(x, y + h); g.lineTo(x, y + h - 0); g.closePath(); }
    else { g.moveTo(x, y); g.lineTo(x + w - c, y); g.lineTo(x + w, y + h); g.lineTo(x + c, y + h); g.closePath(); }
  }
  function hex(g, cx, cy, r, flat) { g.beginPath(); for (var i = 0; i < 6; i++) { var a = Math.PI / 3 * i + (flat ? 0 : Math.PI / 6); g[i ? "lineTo" : "moveTo"](cx + r * Math.cos(a), cy + r * Math.sin(a)); } g.closePath(); }
  function diamond(g, cx, cy, r) { g.beginPath(); g.moveTo(cx, cy - r); g.lineTo(cx + r, cy); g.lineTo(cx, cy + r); g.lineTo(cx - r, cy); g.closePath(); }
  /* 血条：o = {x,y,w,h,v,delay,regen,right,low}
     v 当前血量比例；delay 白色延迟扣血（拳皇式：受伤后白段停留再追上）；regen 可回复段（虚血）；right 从右往左长 */
  function bar(g, o) {
    var x = o.x, y = o.y, w = o.w, h = o.h, c = o.cut == null ? h * 0.9 : o.cut, R = !!o.right, sk = h * 0.6;
    var seg = function (f) { f = Math.max(0, Math.min(1, f)); var ww = w * f; return R ? [x + w - ww, ww] : [x, ww]; };
    g.save();
    cut(g, x - 3, y - 3, w + 6, h + 6, c + 2, R); g.fillStyle = T("n0", 0.78); g.fill();
    g.lineWidth = 1.5; g.strokeStyle = T("n5", 0.55); g.stroke();
    cut(g, x, y, w, h, c, R); g.clip();
    g.fillStyle = T("n2", 0.9); g.fillRect(x, y, w, h);
    var s;
    if (o.regen > 0) { s = seg(o.v + o.regen); g.fillStyle = T("primary", 0.28); g.fillRect(s[0], y, s[1], h); }
    if (o.delay > o.v) { s = seg(o.delay); g.fillStyle = T("n6", 0.92); g.fillRect(s[0], y, s[1], h); }
    s = seg(o.v); var low = o.v < (o.low || 0.3), gr = g.createLinearGradient(0, y, 0, y + h);
    gr.addColorStop(0, T(low ? "danger" : "warn", 1)); gr.addColorStop(0.55, T(low ? "danger" : "rare-ssr", 1)); gr.addColorStop(1, T(low ? "danger" : "warn", 0.75));
    g.fillStyle = gr; g.fillRect(s[0], y, s[1], h);
    g.fillStyle = T("n6", 0.35); g.fillRect(s[0], y + 1, s[1], Math.max(1, h * 0.18)); // 高光
    // 斜纹刻度
    g.strokeStyle = T("n0", 0.35); g.lineWidth = 1; for (var i = 1; i < 10; i++) { var tx = x + w * i / 10; g.beginPath(); g.moveTo(tx + sk / 2, y); g.lineTo(tx - sk / 2, y + h); g.stroke(); }
    g.restore();
  }
  /* 分段气槽：o = {x,y,w,h,n,v,right,t}；满格段发光、当前充能段半透明，右端显示等级数字 */
  function meter(g, o) {
    var n = o.n || 3, gap = 5, sw = (o.w - gap * (n - 1)) / n, R = !!o.right, pulse = 0.6 + 0.4 * Math.sin((o.t || 0) * 6);
    g.save();
    for (var i = 0; i < n; i++) {
      var sx = R ? o.x + o.w - (i + 1) * sw - i * gap : o.x + i * (sw + gap), f = Math.max(0, Math.min(1, o.v - i));
      cut(g, sx, o.y, sw, o.h, o.h * 0.8, R); g.fillStyle = T("n0", 0.75); g.fill(); g.lineWidth = 1; g.strokeStyle = T("primary", 0.45); g.stroke();
      if (f > 0) { g.save(); cut(g, sx, o.y, sw, o.h, o.h * 0.8, R); g.clip(); var fx = R ? sx + sw * (1 - f) : sx;
        if (f >= 1) { g.shadowColor = T("primary-strong", 1); g.shadowBlur = 10 * pulse; g.fillStyle = T("primary-strong", 1); } else g.fillStyle = T("primary", 0.55);
        g.fillRect(fx, o.y, sw * f, o.h); g.restore(); }
    }
    var lv = Math.floor(o.v); g.font = "900 " + Math.round(o.h * 1.9) + "px SyTitleEn, SyTitle, sans-serif"; g.textAlign = R ? "right" : "left"; g.textBaseline = "middle";
    g.fillStyle = lv ? T("primary-strong", 1) : T("n4", 1); if (lv) { g.shadowColor = T("primary", 1); g.shadowBlur = 8 * pulse; }
    g.fillText(lv >= n ? "MAX" : String(lv), R ? o.x - 10 : o.x + o.w + 10, o.y + o.h / 2 + 1);
    g.restore();
  }
  /* 切角信息面板：o = {x,y,w,h,title} */
  function panel(g, o) {
    g.save(); var c = o.cut == null ? 14 : o.cut;
    g.beginPath(); g.moveTo(o.x + c, o.y); g.lineTo(o.x + o.w, o.y); g.lineTo(o.x + o.w, o.y + o.h - c); g.lineTo(o.x + o.w - c, o.y + o.h); g.lineTo(o.x, o.y + o.h); g.lineTo(o.x, o.y + c); g.closePath();
    g.fillStyle = T("n1", o.alpha == null ? 0.86 : o.alpha); g.fill(); g.lineWidth = 1.2; g.strokeStyle = T("n3", 1); g.stroke();
    g.fillStyle = T("primary", 1); g.fillRect(o.x + c, o.y, Math.min(48, o.w / 3), 2); // 顶边主色短条
    if (o.title) { g.font = "700 12px SyTitleEn, sans-serif"; g.textAlign = "left"; g.textBaseline = "top"; g.fillStyle = T("primary-strong", 1); g.fillText(o.title, o.x + c + 2, o.y + 8); }
    g.restore();
  }
  var CSS = ".sykPanel{background:rgb(var(--c-n1-rgb) / .88);border:1px solid rgb(var(--c-n3-rgb) / 1);clip-path:polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px);position:relative}"
    + ".sykPanel::before{content:'';position:absolute;left:14px;top:0;width:44px;height:2px;background:var(--c-primary)}"
    + ".sykPanel>.t{font:700 11px var(--sy-font-title,sans-serif);letter-spacing:.12em;color:var(--c-primary-strong)}"
    + ".sykBar{--v:1;--d:1;position:relative;height:10px;background:rgb(var(--c-n2-rgb) / .95);clip-path:polygon(6px 0,100% 0,calc(100% - 6px) 100%,0 100%);overflow:hidden}"
    + ".sykBar>i,.sykBar>b{position:absolute;left:0;top:0;bottom:0}.sykBar>b{width:calc(var(--d) * 100%);background:var(--c-n6);transition:width .6s .35s}"
    + ".sykBar>i{width:calc(var(--v) * 100%);background:linear-gradient(180deg,var(--c-rare-ssr),var(--c-warn));transition:width .12s}.sykBar.low>i{background:var(--c-danger)}.sykBar.mp>i{background:linear-gradient(180deg,var(--c-primary-strong),var(--c-primary))}"
    + ".sykBtn{position:relative;isolation:isolate;z-index:0;display:grid;place-items:center;border:0!important;padding:0!important;background:none!important;color:var(--c-n6);font:800 13px/1.05 var(--sy-font-title,sans-serif);text-shadow:0 1px 2px rgb(var(--c-n0-rgb) / .9);touch-action:none}"
    + ".sykBtn::before,.sykBtn::after{content:'';position:absolute;inset:0;z-index:-1}"
    + ".sykBtn::before{background:rgb(var(--c-n6-rgb) / .55)}.sykBtn::after{inset:2px;background:linear-gradient(160deg,rgb(var(--c-n2-rgb) / .92),rgb(var(--c-n0-rgb) / .88))}"
    + ".sykBtn.dia::before,.sykBtn.dia::after{clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)}"
    + ".sykBtn.hex::before,.sykBtn.hex::after{clip-path:polygon(25% 3%,75% 3%,100% 50%,75% 97%,25% 97%,0 50%)}"
    + ".sykBtn small{display:block;font:600 9px/1 sans-serif;color:var(--c-text-2,var(--c-n5));margin-top:2px}"
    + ".sykBtn.pri::before{background:var(--c-primary)}.sykBtn.acc::before{background:var(--c-accent)}"
    + ".sykBtn.on::before{background:var(--c-primary-strong);filter:drop-shadow(0 0 8px var(--c-primary))}.sykBtn.on{animation:sykGlow 1s ease-in-out infinite alternate}"
    + ".sykBtn:active::after,.sykBtn.down::after{background:linear-gradient(160deg,rgb(var(--c-primary-rgb) / .55),rgb(var(--c-n0-rgb) / .9))}"
    + "@keyframes sykGlow{from{filter:drop-shadow(0 0 2px rgb(var(--c-primary-rgb) / .6))}to{filter:drop-shadow(0 0 10px rgb(var(--c-primary-rgb) / 1))}}";
  if (typeof document !== "undefined" && !document.getElementById("sykCss")) { var st = document.createElement("style"); st.id = "sykCss"; st.textContent = CSS; (document.head || document.documentElement).appendChild(st); }
  global.SyKit = { T: T, cut: cut, hex: hex, diamond: diamond, bar: bar, meter: meter, panel: panel };
})(typeof window !== "undefined" ? window : globalThis);
