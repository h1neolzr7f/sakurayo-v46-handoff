/* Sakurayo UX layer: tap targets, press feedback + tap sound, panel fade-in,
 * lobby red dots and one-time feature hints. Visual/aural only; no game rules. */
(function (root) {
  "use strict";
  var doc = root.document;
  if (!doc) return;
  var HINT_KEY = "sakurayoUx46";
  var HINTS = {
    gachaDrawer: "左侧切换卡池，右下单抽/十连；“详情”可看概率与保底。",
    shopDrawer: "左侧切换分类；第一笔建议先买初始核心。",
    rosterDrawer: "点卡片看详情，时装/武器可在详情里装备。",
    commandDrawer47: "上方切换角色，下方查看衣装与出击配置。",
    trialsDrawer: "试炼有首通奖励；选好试炼后回大厅出击，返回大厅会取消。"
  };
  var CSS = [
    /* tap targets >= 44px */
    ".terminalTop48 button,#gachaDrawer .close,#shopDrawer .close,#rosterDrawer .close,#stageDrawer .close,#commandDrawer47 .close,#achDrawer .close,#pause{min-width:44px!important;min-height:44px!important}",
    "#gachaDrawer .wishV2 .wishLinks46 button,.rosterTabs46 button,#stageDrawer .dbody button,#gachaDrawer .wishSpark46 button{min-height:44px!important;min-width:44px}",
    "#gachaDrawer .wishV2 .wishSpark46{max-height:48px!important}",
    "#shopDrawer .shopItem40 button,#shopDrawer .skinCard>button{min-height:44px!important}",
    /* press feedback */
    "button{-webkit-tap-highlight-color:transparent}",
    "button:not(:disabled):active{transform:scale(.96);filter:brightness(1.12);transition:transform .06s,filter .06s}",
    "@media (prefers-reduced-motion:reduce){button:not(:disabled):active{transform:none}}",
    /* panel fade-in (opacity only so hit boxes never move) */
    "@keyframes syFade46{from{opacity:0}to{opacity:1}}",
    ".drawer:not(.hidden),#gachaReveal46,.wishSheet46:not(.hidden){animation:syFade46 .18s ease-out}",
    "@media (prefers-reduced-motion:reduce){.drawer:not(.hidden),#gachaReveal46,.wishSheet46:not(.hidden){animation:none}}",
    /* equipped/owned buttons read as state, not action */
    "#shopDrawer .skinCard.equipped>button,#shopDrawer .skinCard>button:disabled{background:#ffffff14!important;color:#a9bed6!important;border-color:rgba(150,228,245,.38)!important;box-shadow:none!important}",
    /* red dot */
    ".syDot46{position:relative}.syDot46:after{content:'';position:absolute;top:4px;right:10px;width:9px;height:9px;border-radius:50%;background:#ff4d6d;box-shadow:0 0 0 2px #0b1326,0 0 8px #ff4d6d}",
    /* one-time hint bubble (non-blocking) */
    ".syHint46{position:fixed;z-index:200;left:50%;bottom:calc(12px + env(safe-area-inset-bottom));transform:translateX(-50%);max-width:min(560px,86vw);padding:10px 16px;border-radius:12px;background:rgba(9,15,30,.94);border:1px solid rgba(170,240,255,.6);color:#eef6ff;font:600 13px/1.5 system-ui;letter-spacing:.04em;box-shadow:0 10px 28px rgba(0,6,20,.5);pointer-events:none;animation:syFade46 .2s ease-out}",
    ".syHint46 b{color:#8fe6f5;margin-right:6px}",
    /* skill / dash cooldown seconds */
    "#skill,#dash{position:relative}",
    "#skill:not(.ready44)[data-cd]:not([data-cd=''])::after,#dash:not(.ready44)[data-cd]:not([data-cd=''])::after{content:attr(data-cd);position:absolute;inset:0;display:grid;place-items:center;border-radius:inherit;background:rgba(4,8,18,.55);color:#fff;font:900 18px/1 system-ui;text-shadow:0 1px 4px #000;pointer-events:none}",
    "#dash:not(.ready44)[data-cd]:not([data-cd=''])::after{font-size:14px}",
    /* trial badge rides on the stage strip so it never covers 出击 */
    "#menu .stageMini:has(>.trialBadge46){position:relative;overflow:visible!important}#menu .stageMini:has(>.trialBadge46:not(.hidden)) #sno{visibility:hidden}#menu .stageMini>.trialBadge46{white-space:nowrap;left:var(--trialBadgeX,auto);right:auto;bottom:auto;top:50%;transform:translateY(-50%);padding:3px 3px 3px 10px;font-size:11px}#menu .stageMini>.trialBadge46 button{min-width:28px!important;min-height:28px!important}",
    "@media (max-width:900px){#menu .stageMini>.trialBadge46>b{display:none}#menu .stageMini>.trialBadge46{padding-left:12px}}",
    /* combat feedback: low-HP pulse vignette, combo pop */
    "#hud.lowHp46:before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;box-shadow:inset 0 0 90px 18px rgba(255,30,70,.55);animation:syLow46 1s ease-in-out infinite}",
    "@keyframes syLow46{0%,100%{opacity:.45}50%{opacity:1}}",
    "#combo.pop46{animation:syPop46 .38s cubic-bezier(.2,1.6,.4,1)}@keyframes syPop46{0%{transform:scale(1.6);filter:brightness(1.8)}100%{transform:none}}",
    "@media (prefers-reduced-motion:reduce){#hud.lowHp46:before{animation:none;opacity:.7}#combo.pop46{animation:none}}",
    /* v5 art: item/core/talent icons, loading, result, mail/notice banners */
    ".iconArt46{width:100%;height:100%;object-fit:contain;display:block;filter:drop-shadow(0 3px 6px rgba(0,0,0,.45))}",
    ".shopIcon40:has(.iconArt46),.ticon:has(.iconArt46){padding:4px!important;font-size:0!important;overflow:visible}",
    "#bootArt35{background:linear-gradient(0deg,rgba(9,7,19,.82),rgba(9,7,19,.25) 55%,rgba(9,7,19,.55)),var(--bootArt46,none) center 35%/cover no-repeat,radial-gradient(circle at 50% 42%,#35174d 0,#150d29 34%,#090713 72%)!important}",
    "#result{background:radial-gradient(circle at 50% 30%,rgba(5,4,14,.35),rgba(5,4,14,.86) 70%),var(--resultArt46,none) center/cover no-repeat,#05040e!important}",
    ".cmdBanner5{position:relative;height:clamp(84px,22vh,128px);margin:0 0 12px;border-radius:14px;overflow:hidden;background-size:cover;background-position:center 40%;border:1px solid rgba(150,228,245,.28);display:flex;flex-direction:column;justify-content:flex-end;padding:12px 16px}",
    ".cmdBanner5 small{font:800 10px/1.2 system-ui;letter-spacing:.18em;color:#8fe6f5}.cmdBanner5 b{font:800 20px/1.25 system-ui;letter-spacing:.12em;color:#fff;text-shadow:0 2px 8px #000}",
    /* trial badge + result */
    ".trialBadge46{position:absolute;z-index:5;right:max(16px,env(safe-area-inset-right));bottom:calc(var(--trialBadgeBottom,120px));display:flex;align-items:center;gap:8px;padding:4px 4px 4px 12px;border-radius:999px;background:rgba(9,15,30,.9);border:1px solid #ffb3d1;color:#ffe3ef;font:800 12px/1 system-ui;box-shadow:0 6px 18px rgba(255,90,160,.3)}",
    ".trialBadge46 b{color:#ff9cc6;letter-spacing:.12em}.trialBadge46 button{min-width:32px!important;min-height:32px!important;border-radius:50%;border:0;background:#ffffff1a;color:#fff;font:800 14px/1 system-ui}",
    ".trialResult46{margin:6px 0 10px;padding:10px 14px;border-radius:12px;border:1px solid #9ff0c066;background:rgba(40,120,80,.18);display:flex;flex-direction:column;gap:4px}.trialResult46 b{color:#9ff0c0;font:900 14px/1.2 system-ui}.trialResult46 span{color:#d6e4f4;font:600 12px/1.4 system-ui}",
    ".trialResult46.fail{border-color:#ff9cc666;background:rgba(140,40,80,.18)}.trialResult46.fail b{color:#ff9cc6}"
  ].join("\n");
  function style() {
    if (doc.getElementById("sakurayoUx46")) return;
    var st = doc.createElement("style");
    st.id = "sakurayoUx46";
    st.textContent = CSS;
    (doc.head || doc.documentElement).appendChild(st);
  }
  function seen() { try { return JSON.parse(root.localStorage.getItem(HINT_KEY)) || {}; } catch (e) { return {}; } }
  function markSeen(id) { try { var s = seen(); s[id] = 1; root.localStorage.setItem(HINT_KEY, JSON.stringify(s)); } catch (e) {} }
  var hintTimer = 0;
  function showHint(id) {
    if (!HINTS[id] || seen()[id]) return;
    markSeen(id);
    var old = doc.querySelector(".syHint46");
    if (old) old.remove();
    var el = doc.createElement("div");
    el.className = "syHint46";
    el.setAttribute("role", "status");
    el.innerHTML = "<b>提示</b>" + HINTS[id];
    doc.body.appendChild(el);
    clearTimeout(hintTimer);
    hintTimer = setTimeout(function () { el.remove(); }, 4200);
  }
  function watchPanels() {
    Object.keys(HINTS).forEach(function (id) {
      var el = doc.getElementById(id);
      if (!el || el.__syWatch) return;
      el.__syWatch = true;
      new MutationObserver(function () { if (!el.classList.contains("hidden")) showHint(id); else { var h = doc.querySelector(".syHint46"); if (h) h.remove(); } })
        .observe(el, { attributes: true, attributeFilter: ["class"] });
    });
  }
  function coins() { try { return (JSON.parse(root.localStorage.getItem("sakurayoV3")) || {}).coins || 0; } catch (e) { return 0; } }
  var NAV_KEY = { "寻访": "gacha", "试炼": "trials" };
  function navButton(label) {
    return doc.querySelector('#menu .homeNav46 [data-open="' + NAV_KEY[label] + '"]');
  }

  function dots() {
    var g = navButton("寻访");
    if (g) g.classList.toggle("syDot46", coins() >= 160);
    var t = navButton("试炼"), T = root.SakurayoTrials;
    if (t && T) { var sv = null; try { sv = JSON.parse(root.localStorage.getItem("sakurayoV3")); } catch (e) {} t.classList.toggle("syDot46", !!sv && T.claimable(sv) > 0); }
  }
  function sfx(e) {
    var b = e.target && e.target.closest && e.target.closest("button");
    if (!b || b.disabled) return;
    if (b.id === "skill" || b.id === "dash") return; /* combat buttons have their own sounds */
    if (typeof root.SakurayoSfx === "function") root.SakurayoSfx("tap");
  }
  /* every drawer: whoosh on open / soft close */
  function watchDrawers() {
    var list = doc.querySelectorAll("section.drawer");
    for (var i = 0; i < list.length; i++) (function (el) {
      if (el.__sySfx) return; el.__sySfx = true;
      var open = !el.classList.contains("hidden");
      new MutationObserver(function () {
        var now = !el.classList.contains("hidden");
        if (now === open) return; open = now;
        if (typeof root.SakurayoSfx === "function") root.SakurayoSfx(now ? "open" : "close");
      }).observe(el, { attributes: true, attributeFilter: ["class"] });
    })(list[i]);
  }
  function init() {
    style();
    watchDrawers();
    watchPanels();
    dots();
    doc.addEventListener("pointerdown", sfx, true);
    setInterval(function () { watchPanels(); dots(); }, 1500);
  }
  root.SakurayoUx = Object.freeze({ hints: HINTS, showHint: showHint, dots: dots });
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", init); else init();
})(typeof window !== "undefined" ? window : globalThis);
