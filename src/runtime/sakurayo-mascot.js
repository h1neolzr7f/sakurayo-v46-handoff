/* Sakurayo lobby mascot ("看板娘"): large framing, face-safe placement,
 * tap speech bubbles and the per-save mascot choice. Presentation only. */
(function (root) {
  "use strict";
  var doc = root.document;
  var IDS = ["follow", "sayo", "aya", "rion"];
  var LABEL = { follow: "跟随出战角色", sayo: "月城小夜", aya: "神代绫", rion: "黑羽凛音" };
  var LINES = {
    sayo: {
      tapHead: ["……头发会乱的。好吧，就一下。", "别摸了，监控那边的凛在笑。", "嗯？你也睡不着吗。"],
      tapBody: ["枪已经校准好了，随时可以出发。", "今晚的神社，好像比昨天安静。", "要去回收证词吗？我陪你。", "樱花落在枪管上了……不用擦，挺好看的。"]
    },
    aya: {
      tapHead: ["请、请不要突然这样……", "发带歪了吗？谢谢提醒。", "这种接触不在作战规程里。"],
      tapBody: ["装备检查完毕，左轮六发、太刀一振。", "指挥官，今天也请多指教。", "我会守住你的侧翼。", "补给清单我已经核对过两遍了。"]
    },
    rion: {
      tapHead: ["哼，胆子不小嘛。", "再碰一下，刀鞘可不长眼。", "……就当你在给我整理红绳。"],
      tapBody: ["夜还长，刀还没饮够。", "别站那么近，会被血溅到。", "想看我拔刀？先活过下一波尸潮。", "黑羽家的刀，只为认可的人出鞘。"]
    }
  };
  var CSS = [
    /* big hero, bleeding off the bottom; head sits at ~x50% / y12-22% (UI-free band) */
    "html.landscape46 #menu.homeDock46 .heroLive46{position:absolute!important;top:-3vh!important;bottom:auto!important;right:auto!important;height:152vh!important;width:152vh!important;max-width:none!important;left:calc(var(--mascotX,50%) - 152vh * var(--mascotHead,.53))!important;overflow:visible!important;-webkit-mask-image:none!important;mask-image:none!important}",
    "html.landscape46 #menu.homeDock46 .heroLive46 .heroLiveBase46,html.landscape46 #menu.homeDock46 .heroLive46 .heroLiveBlink46{width:100%!important;height:100%!important;object-fit:contain!important;object-position:50% 0!important;inset:0!important}",
    "html.landscape46 #menu.homeDock46 .heroLive46 .heroLiveLook46,html.landscape46 #menu.homeDock46 .heroLive46 .heroLivePhys46{place-items:start center!important}",
    "html.landscape46 #menu.homeDock46 .heroLive46 .heroLiveBreath46:after{display:none}",
    "html.landscape46 #menu.homeDock46 .heroLive46 .heroHead46{left:43%!important;width:20%!important;top:2%!important;height:15%!important;bottom:auto!important}",
    "html.landscape46 #menu.homeDock46 .heroLive46 .heroTap46{left:34%!important;width:36%!important;top:17%!important;bottom:auto!important;height:46%!important}",
    "#menu.homeDock46>.heroLiveName46{position:absolute;z-index:6;left:calc(env(safe-area-inset-left) + 4.4vw);bottom:33vh;top:auto;max-width:34vw;margin:0;display:flex;flex-direction:column;gap:3px;padding:6px 40px 6px 14px;border-left:2px solid #b9eaf4;background:linear-gradient(90deg,rgba(8,16,30,.8),rgba(8,16,30,.5) 60%,rgba(8,16,30,0));color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.6);pointer-events:none}",
    "#menu.homeDock46>.heroLiveName46 b{font:600 clamp(21px,2.7vw,35px)/1.1 system-ui;letter-spacing:.14em}",
    "#menu.homeDock46>.heroLiveName46 small{font:700 10px/1.2 system-ui;letter-spacing:.1em;color:#cfe3f1}",
    "@media (max-height:380px){#menu.homeDock46>.heroLiveName46{bottom:36vh}#menu.homeDock46>.heroLiveName46 b{font-size:22px}}",
    "html:not(.landscape46) #menu.homeDock46>.heroLiveName46{bottom:36%;left:4%;max-width:75%}",
    /* hi-res three-quarter lobby art (2:3): bigger, face at x50% y8-20% */
    "html.landscape46 #menu.homeDock46 .heroLive46.lobbyArt46{top:0!important;height:134vh!important;width:89.3vh!important;left:calc(var(--mascotX,50%) - 44.65vh)!important}",
    "html.landscape46 #menu.homeDock46 .heroLive46.lobbyArt46 .heroHead46{left:30%!important;width:40%!important;top:3%!important;height:18%!important}",
    "html.landscape46 #menu.homeDock46 .heroLive46.lobbyArt46 .heroTap46{left:15%!important;width:70%!important;top:22%!important;height:50%!important}",
    "html:not(.landscape46) #menu.homeDock46 .heroLive46.lobbyArt46 .heroLiveBase46{object-fit:contain;object-position:50% 0}",
    "html.landscape46 #menu.homeDock46 .heroLive46.lobbyArt46 .heroLiveSway46,html.landscape46 #menu.homeDock46 .heroLive46.lobbyArt46 .heroLivePhys46,html.landscape46 #menu.homeDock46 .heroLive46.lobbyArt46 .heroLiveBreath46,html.landscape46 #menu.homeDock46 .heroLive46.lobbyArt46 .heroLiveLook46{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;min-width:0!important;max-width:none!important;margin:0!important}",
    ".heroLive46 .heroLiveExpr46{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:50% 0;opacity:0;transition:opacity .22s ease;pointer-events:none}",
    ".heroLive46.expr46 .heroLiveExpr46{opacity:1}.heroLive46.expr46 .heroLiveBase46{opacity:0!important;transition:opacity .22s ease}",
    ".heroLive46.lobbyArt46 .heroLiveBlink46{display:none!important}",
    /* character file portrait: hi-res three-quarter art, face anchored to top */
    "#commandDrawer47 .cmdPortrait47{overflow:hidden}",
    "#commandDrawer47 .cmdPortrait47 img:not(.fullBody47){width:100%!important;height:100%!important;max-height:none!important;object-fit:cover!important;object-position:50% 6%!important}",
    /* gacha pull buttons: never wrap the label on narrow phones */
    "#gachaDrawer .wishV2 .wishDock46 button b,#gachaDrawer .wishV2 .wishDock46 button>span:first-child{white-space:nowrap}",
    "@media (max-width:700px) and (orientation:landscape){#gachaPull1,#gachaPull10{font-size:14px!important;letter-spacing:.04em!important;padding-left:10px!important;padding-right:8px!important;gap:6px!important;min-width:0!important;overflow:hidden!important}#gachaPull1 small,#gachaPull10 small{padding-left:6px!important;padding-right:8px!important}}",
    /* bubble */
    ".mascotBubble46{position:absolute;z-index:7;right:calc(100% - var(--mascotX,50%) + 11vh);top:8vh;max-width:min(220px,26vw);padding:9px 14px;border-radius:14px 14px 4px 14px;background:rgba(255,255,255,.95);color:#2a1c33;font:700 13px/1.5 system-ui;box-shadow:0 8px 22px rgba(10,6,30,.35);pointer-events:none;opacity:0;transform:translateY(6px) scale(.96);transition:opacity .18s,transform .18s}",
    ".mascotBubble46.on{opacity:1;transform:none}",
    ".mascotBubble46 b{display:block;color:#d0487f;font:900 11px/1.2 system-ui;letter-spacing:.1em;margin-bottom:2px}",
    "@media (max-height:380px){.mascotBubble46{font-size:12px;padding:7px 11px}}"
  ].join("\n");
  function pick(list, last) {
    if (!list || !list.length) return "";
    var i = Math.floor(Math.random() * list.length);
    if (list.length > 1 && list[i] === last) i = (i + 1) % list.length;
    return list[i];
  }
  function normalize(v) { return IDS.indexOf(v) >= 0 ? v : "follow"; }
  function resolve(setting, selected) { setting = normalize(setting); return setting === "follow" ? selected : setting; }
  function next(setting) { var i = IDS.indexOf(normalize(setting)); return IDS[(i + 1) % IDS.length]; }
  var lastLine = "", timer = 0;
  function say(menu, id, name, kind) {
    if (!menu) return "";
    var b = menu.querySelector(".mascotBubble46");
    if (!b) { b = doc.createElement("div"); b.className = "mascotBubble46"; b.setAttribute("role", "status"); menu.appendChild(b); }
    var set = LINES[id] || LINES.sayo;
    var line = pick(kind === "tapHead" ? set.tapHead : set.tapBody, lastLine);
    lastLine = line;
    b.innerHTML = "<b>" + String(name || "").replace(/[<>&]/g, "") + "</b>" + line;
    b.classList.add("on");
    clearTimeout(timer);
    timer = setTimeout(function () { b.classList.remove("on"); }, 2600);
    return line;
  }
  var exprTimer = 0;
  function express(root, id, kind, art) {
    if (!root || !root.classList.contains("lobbyArt46")) return "";
    var look = root.querySelector(".heroLiveLook46");
    if (!look) return "";
    var img = look.querySelector(".heroLiveExpr46");
    if (!img) { img = doc.createElement("img"); img.className = "heroLiveExpr46"; img.alt = ""; look.appendChild(img); }
    var e = kind === "tapHead" ? "shy" : "happy";
    var src = art("characters/" + id + "/default/lobby_" + e + ".webp");
    var show = function () { root.classList.add("expr46"); };
    if (img.getAttribute("src") !== src) { img.onload = show; img.src = src; } else show();
    clearTimeout(exprTimer);
    exprTimer = setTimeout(function () { root.classList.remove("expr46"); }, 2600);
    return e;
  }
  function adopt(menu) {
    var n = menu && menu.querySelector(".heroLive46 .heroLiveName46");
    if (n) menu.appendChild(n);
  }
  function style() {
    if (!doc || doc.getElementById("sakurayoMascot46")) return;
    var st = doc.createElement("style"); st.id = "sakurayoMascot46"; st.textContent = CSS;
    (doc.head || doc.documentElement).appendChild(st);
  }
  if (doc) { if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", style); else style(); }
  root.SakurayoMascot = Object.freeze({ IDS: IDS, LABEL: LABEL, LINES: LINES, normalize: normalize, resolve: resolve, next: next, say: say, adopt: adopt, express: express });
})(typeof window !== "undefined" ? window : globalThis);
