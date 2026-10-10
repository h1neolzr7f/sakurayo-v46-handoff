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
    /* ===== v2 layout & hierarchy (landscape) ===== */
    "@media (orientation:landscape){",
    /* lobby: top capsule */
    "#menu.terminalLobby48 .top{gap:0;padding:3px;border-radius:999px;background:var(--sy-glass-strong);border:1px solid var(--sy-rim);box-shadow:var(--sy-shadow)}",
    "#menu.terminalLobby48 .top .coins,#menu.terminalLobby48 .terminalTop48 button{background:transparent!important;border:0!important;box-shadow:none!important;border-radius:999px!important}",
    "#menu.terminalLobby48 .top .coins{color:var(--sy-gold);font-weight:800;border-right:1px solid var(--sy-rim)!important;border-radius:999px 0 0 999px!important}",
    /* lobby: tactical deck = two tiles + hero CTA */
    "#menu.terminalLobby48 .tacticalDeck48{grid-template-columns:1fr 1fr;grid-template-rows:minmax(64px,1fr) minmax(78px,1.25fr) 38px;gap:8px}",
    "#menu.terminalLobby48 .tacticalDeck48>#commandCharacter47,#menu.terminalLobby48 .tacticalDeck48>#commandPrepare47{margin:0;width:100%;flex-direction:column;justify-content:center;gap:4px;padding:8px;border:1px solid var(--sy-rim);border-radius:var(--sy-radius);background:var(--sy-glass);backdrop-filter:blur(8px);text-align:center}",
    "#menu.terminalLobby48 .tacticalDeck48>#commandCharacter47:after,#menu.terminalLobby48 .tacticalDeck48>#commandPrepare47:after{display:none}",
    "#menu.terminalLobby48 .tacticalDeck48>#commandCharacter47 .terminalLabel48,#menu.terminalLobby48 .tacticalDeck48>#commandPrepare47 .terminalLabel48{align-items:center;text-align:center}",
    "#menu.terminalLobby48 .tacticalDeck48>#commandCharacter47 b,#menu.terminalLobby48 .tacticalDeck48>#commandPrepare47 b{font-size:17px}",
    "#menu.terminalLobby48 .tacticalDeck48>#start{grid-column:1/-1;border:1px solid var(--sy-rim-hi)!important;border-radius:calc(var(--sy-radius) + 4px)!important;background:linear-gradient(120deg,#ff6fae,#ff9fcf 45%,#8fe6f5)!important;color:#081426!important;box-shadow:0 0 0 1px rgba(255,255,255,.25) inset,0 10px 30px rgba(143,230,245,.35)}",
    "#menu.terminalLobby48 .tacticalDeck48>#start b,#menu.terminalLobby48 .tacticalDeck48>#start small,#menu.terminalLobby48 .tacticalDeck48>#start:after{color:#081426!important;text-shadow:none!important}",
    "#menu.terminalLobby48 .tacticalDeck48>#start svg{color:#081426!important;filter:none!important}",
    "#menu.terminalLobby48 .tacticalDeck48>.stageMini{grid-column:1/-1;border-radius:var(--sy-radius);background:var(--sy-glass-strong);border:1px solid var(--sy-rim)}",
    /* lobby: unified bottom dock */
    "#menu.homeDock46.terminalLobby48 .homeNav46{gap:0!important;padding:3px;border-radius:calc(var(--sy-radius) + 4px);background:var(--sy-glass-strong);border:1px solid var(--sy-rim);box-shadow:var(--sy-shadow);backdrop-filter:blur(10px)}",
    "#menu.homeDock46.terminalLobby48 .homeNav46 button{background:transparent!important;border:0!important;border-radius:var(--sy-radius)!important;box-shadow:none!important;position:relative}",
    "#menu.homeDock46.terminalLobby48 .homeNav46 button+button:before{content:'';position:absolute;left:0;top:22%;bottom:22%;width:1px;background:var(--sy-rim)}",
    "#menu.homeDock46.terminalLobby48 .homeNav46 button:hover,#menu.homeDock46.terminalLobby48 .homeNav46 button:focus-visible{background:rgba(143,230,245,.16)!important}",
    /* gacha: actions get the weight, pity compact */
    "#gachaDrawer .gachaActions46 button{border-radius:calc(var(--sy-radius) + 4px)!important;min-height:58px;font-size:17px}",
    "#gachaDrawer .gachaActions46 button:last-child{background:linear-gradient(120deg,rgba(255,143,196,.95),rgba(143,230,245,.95))!important;color:#081426!important;box-shadow:0 10px 26px rgba(255,143,196,.35)}",
    "#gachaDrawer .wishPity46{padding:8px 12px}",
    "#gachaDrawer .wishSpark46{max-height:66px;overflow:auto}",
    /* shop: sticky header + segmented tabs */
    "#shopDrawer .dhead{position:sticky;top:calc(-1 * max(17px,env(safe-area-inset-top)));z-index:3;background:linear-gradient(180deg,#0b1326 80%,rgba(11,19,38,0));margin:0 -13px;padding-left:13px;padding-right:13px}",
    "#shopDrawer .shopMoney{padding:6px 14px;border-radius:999px;background:var(--sy-glass-strong);border:1px solid var(--sy-rim);color:var(--sy-gold);font-weight:800}",
    "#shopDrawer .shopTabs40{padding:4px;border-radius:calc(var(--sy-radius) + 4px);background:var(--sy-glass-strong)!important;border:1px solid var(--sy-rim)!important;gap:4px}",
    "#shopDrawer .shopTabs40 button{border-color:transparent;background:transparent}",
    /* battle HUD: compact left column, slim stage bar */
    "#hud .hudtop .hero{padding:6px 10px 6px 6px;clip-path:none}",
    "#hud .wave{height:20px;border-radius:999px}",
    "#hud .wave span{font-size:10px;letter-spacing:.06em}",
    "#hud .mission{max-width:min(46vw,420px)}",
    "#hud .rinfo{padding:6px 12px;text-align:right}",
    "#hud .rinfo b{font-size:18px;letter-spacing:.06em;color:var(--sy-text)}",
    "#hud .combo{text-shadow:0 0 12px rgba(255,215,122,.55)}",
    "}",
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
