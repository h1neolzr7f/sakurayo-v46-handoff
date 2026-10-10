/* Sakurayo unified UI theme (v4.6 renovation).
 * One stylesheet, appended once, that aligns lobby, gacha, shop and battle HUD on the
 * lobby's glass language: deep navy translucent panels, 1px ice-cyan rim, sakura accent.
 * Purely visual: no layout-critical sizes, no game logic. */
(function (root) {
  "use strict";
  var ID = "sakurayoTheme46";
  var CSS = [
    ":root{--sy-glass:rgba(12,20,38,.72);--sy-glass-strong:rgba(9,15,30,.88);--sy-rim:rgba(150,228,245,.38);--sy-rim-hi:rgba(170,240,255,.85);--sy-ice:#8fe6f5;--sy-sakura:#ff8fc4;--sy-gold:#ffd77a;--sy-text:#eef6ff;--sy-mute:#a9bed6;--sy-radius:10px;--sy-shadow:0 10px 28px rgba(0,6,20,.45)}",
    /* drawers: shop & generic */
    "#shopDrawer,#achDrawer{background:radial-gradient(120% 90% at 85% -10%,rgba(143,230,245,.16),transparent 55%),radial-gradient(90% 70% at -10% 110%,rgba(255,143,196,.12),transparent 60%),linear-gradient(180deg,#0b1326,#070c1a)}",
    "#shopDrawer .dhead,#achDrawer .dhead{border-bottom:1px solid var(--sy-rim);padding-bottom:10px}",
    "#shopDrawer .dhead h2,#achDrawer .dhead h2{letter-spacing:.18em;color:var(--sy-text);text-shadow:0 0 14px rgba(143,230,245,.35)}",
    "#shopDrawer .shopNotice{background:var(--sy-glass);border:1px solid var(--sy-rim);border-radius:var(--sy-radius);backdrop-filter:blur(8px)}",
    "#shopDrawer .shopTabs40{background:transparent;border:0;gap:6px}",
    "#shopDrawer .shopTabs40 button{background:var(--sy-glass);border:1px solid var(--sy-rim);border-radius:var(--sy-radius);color:var(--sy-mute);transition:background .15s,color .15s,border-color .15s}",
    "#shopDrawer .shopTabs40 button.on,#shopDrawer .shopTabs40 button[aria-selected=true]{background:linear-gradient(135deg,rgba(143,230,245,.95),rgba(186,244,255,.9));color:#06202a;border-color:var(--sy-rim-hi);box-shadow:0 0 16px rgba(143,230,245,.35)}",
    "#shopDrawer .shopItem40,#shopDrawer .shopCard40{background:var(--sy-glass);border:1px solid var(--sy-rim);border-radius:var(--sy-radius);box-shadow:var(--sy-shadow)}",
    "#shopDrawer .close,#gachaDrawer .close,#achDrawer .close{border-radius:var(--sy-radius);border:1px solid var(--sy-rim-hi);background:var(--sy-glass-strong);color:var(--sy-text)}",
    /* gacha */
    "#gachaDrawer .wishTitle46 h3{text-shadow:0 2px 14px rgba(0,10,30,.75)}",
    "#gachaDrawer .wishTitle46 p,#gachaDrawer .wishTitle46 small{display:inline-block;margin-top:4px;padding:3px 10px;border-radius:999px;background:var(--sy-glass-strong);color:var(--sy-text);border:1px solid var(--sy-rim)}",
    "#gachaDrawer .wishPity46,#gachaDrawer .wishPills46>*{background:var(--sy-glass-strong);border:1px solid var(--sy-rim);border-radius:var(--sy-radius)}",
    "#gachaDrawer .pityRail46{background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden}",
    "#gachaDrawer .wishSpark46 button{background:var(--sy-glass-strong);border:1px solid rgba(255,143,196,.45);color:#ffe3f0;border-radius:999px}",
    "#gachaDrawer .wishSpark46 button:disabled{opacity:.62}",
    /* battle HUD */
    "#hud .hudtop .hero,#hud .rinfo,#hud .wave{background:var(--sy-glass);border:1px solid var(--sy-rim);border-radius:var(--sy-radius);backdrop-filter:blur(6px);box-shadow:var(--sy-shadow)}",
    "#hud .bar{border-radius:999px;background:rgba(255,255,255,.08)}",
    "#hud #hpF{background:linear-gradient(90deg,#ff5d8f,var(--sy-sakura))}",
    "#hud #xpF,#hud #waveF{background:linear-gradient(90deg,#5fd0ea,var(--sy-ice))}",
    "#hud #pause{border-radius:var(--sy-radius);border:1px solid var(--sy-rim-hi);background:var(--sy-glass-strong)}",
    "#hud .mission{background:var(--sy-glass);border-left:2px solid var(--sy-ice);border-radius:0 var(--sy-radius) var(--sy-radius) 0}",
    "#hud .mission br{display:none}",
    ".opsRail46{background:var(--sy-glass)!important;border:1px solid var(--sy-rim)!important;border-radius:var(--sy-radius)!important;backdrop-filter:blur(6px)}",
    "#banter{background:var(--sy-glass-strong)!important;border:1px solid var(--sy-rim)!important;border-radius:var(--sy-radius)!important}",
    "@media (prefers-reduced-motion:reduce){#shopDrawer .shopTabs40 button{transition:none}}"
  ].join("\n");
  function apply(doc) {
    doc = doc || root.document;
    if (!doc || doc.getElementById(ID)) return false;
    var style = doc.createElement("style");
    style.id = ID;
    style.textContent = CSS;
    (doc.head || doc.documentElement).appendChild(style);
    return true;
  }
  root.SakurayoTheme = Object.freeze({ id: ID, css: CSS, apply: apply });
  if (root.document) {
    if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", function () { apply(); });
    else apply();
  }
})(typeof window !== "undefined" ? window : globalThis);
