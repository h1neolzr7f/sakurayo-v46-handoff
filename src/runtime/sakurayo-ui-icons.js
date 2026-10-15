/* 大厅矢量图标套（2026-10-11）：粗线 + 实心块，24×24 viewBox，颜色全部用 currentColor（跟随令牌）。
   替换底栏、右上角功能键、左下任务/签到和货币的旧位图/细线图标。设计规则见 docs/COLOR_SYSTEM.md §8。 */
(function (global) {
  "use strict";
  if (typeof document === "undefined") return;
  var S = 'stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"';
  var F = 'fill="currentColor"';
  var I = {
    // —— 夜行地图节点（ART_PASS ⑤）——
    n_fight: '<path d="M4 4l11 11M20 4 9 15" fill="none" ' + S + ' stroke-width="2.6"/><path d="M13.5 16.5l4-4 2 2-4 4ZM10.5 16.5l-4-4-2 2 4 4Z" ' + F + '/>',
    n_elite: '<path d="M4 6l3 3 2-5 3 4 3-4 2 5 3-3-1.5 10h-13Z" ' + F + '/><path d="M6 19.5h12" fill="none" ' + S + '/>',
    n_goal: '<path d="M6 3.5h11a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2H6Z" ' + F + '/><path d="M9 8h6M9 11.5h6M9 15h4" fill="none" stroke="var(--c-n1)" stroke-width="1.8" stroke-linecap="round"/>',
    n_event: '<circle cx="12" cy="12" r="9.5" ' + F + '/><path d="M9.3 9.2a2.8 2.8 0 1 1 3.9 2.6c-.8.4-1.2 1-1.2 1.9v.6" fill="none" stroke="var(--c-n1)" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="17.3" r="1.3" fill="var(--c-n1)"/>',
    n_shop: '<path d="M4.5 8h15l-1.2 12.5H5.7Z" ' + F + '/><path d="M8.5 10V6.5a3.5 3.5 0 0 1 7 0V10" fill="none" ' + S + '/>',
    n_shrine: '<path d="M2 9.5c3 0 6-2 10-6 4 4 7 6 10 6" fill="none" ' + S + '/><path d="M5.5 9.5h13v2h-13Z" ' + F + '/><path d="M7 11.5v9M17 11.5v9M10 14.5h4v6h-4Z" fill="none" ' + S + '/>',
    n_sky: '<path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4Z" ' + F + '/>',
    n_duel: '<path d="M3 5l7 7-7 7M21 5l-7 7 7 7" fill="none" ' + S + ' stroke-width="2.8"/>',
    n_mask: '<path d="M4 5c5-2 11-2 16 0v6c0 5-4 9-8 9s-8-4-8-9Z" ' + F + '/><path d="M7.5 10l2.5 1.5M16.5 10 14 11.5M9.5 16c1.5 1 3.5 1 5 0" fill="none" stroke="var(--c-n1)" stroke-width="1.9" stroke-linecap="round"/>',
    n_boss: '<path d="M3 4l4 5 5-6 5 6 4-5-1.5 13h-15Z" ' + F + '/><path d="M9 12.5h.01M15 12.5h.01" stroke="var(--c-n1)" stroke-width="2.6" stroke-linecap="round"/><path d="M5 20.5h14" fill="none" ' + S + '/>',
    n_shard: '<path d="M12 2 18.5 9 12 22 5.5 9Z" ' + F + '/><path d="M5.5 9h13M12 2 9.5 9 12 22l2.5-13Z" fill="none" stroke="var(--c-n1)" stroke-width="1.2" stroke-linejoin="round"/>',
    n_lock: '<rect x="5" y="10.5" width="14" height="10" rx="1.5" ' + F + '/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" ' + S + '/>',
    n_check: '<path d="M4.5 12.5l4.5 4.5 10.5-10.5" fill="none" ' + S + ' stroke-width="3"/>',
    // 寻访：菱形框里的实心四芒星（召唤 / 抽卡）
    gacha: '<path d="M12 2.5 21.5 12 12 21.5 2.5 12Z" fill="none" ' + S + '/><path d="M12 6.5 13.6 10.4 17.5 12 13.6 13.6 12 17.5 10.4 13.6 6.5 12 10.4 10.4Z" ' + F + '/>',
    // 仓库：实心立方体（箱子）
    roster: '<path d="M12 2.8 20.5 7.2V16.8L12 21.2 3.5 16.8V7.2Z" fill="none" ' + S + '/><path d="M3.8 7.4 12 11.6 20.2 7.4 12 3.2Z" ' + F + '/><path d="M12 11.6V21" ' + S + '/>',
    // 采购：购物袋
    shop: '<path d="M4.5 8h15l-1.2 12.5H5.7Z" ' + F + '/><path d="M8.5 10V6.5a3.5 3.5 0 0 1 7 0V10" fill="none" ' + S + '/>',
    // 关卡：旗帜
    stage: '<path d="M5 21.5V3" fill="none" ' + S + '/><path d="M6 3.5h12.5l-3 4.5 3 4.5H6Z" ' + F + '/>',
    // 试炼：交叉双剑
    trials: '<path d="M4 4l11 11M20 4 9 15" fill="none" ' + S + ' stroke-width="2.6"/><path d="M13.5 16.5l4-4 2 2-4 4ZM10.5 16.5l-4-4-2 2 4 4Z" ' + F + '/><path d="M18 18.5l2.5 2.5M6 18.5 3.5 21" ' + S + '/>',
    // 档案：打开的书
    archive: '<path d="M12 6.2C10 4.6 6.8 4.2 3 4.6V19c3.8-.4 7 0 9 1.6Z" ' + F + '/><path d="M12 6.2c2-1.6 5.2-2 9-1.6V19c-3.8-.4-7 0-9 1.6Z" fill="none" ' + S + '/>',
    // 战绩：奖杯
    records: '<path d="M7 3.5h10v5a5 5 0 0 1-10 0Z" ' + F + '/><path d="M7 5.5H3.8a3.2 3.2 0 0 0 3.6 4.4M17 5.5h3.2a3.2 3.2 0 0 1-3.6 4.4M12 13.5v4M8 20.5h8" fill="none" ' + S + '/>',
    // 邮箱：信封
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="1.5" ' + F + '/><path d="M3.8 6.5 12 13l8.2-6.5" fill="none" stroke="var(--c-n1)" stroke-width="2" stroke-linejoin="round"/>',
    // 公告：喇叭
    notice: '<path d="M3.5 9.5h4l8-5v15l-8-5h-4Z" ' + F + '/><path d="M18.5 9a4 4 0 0 1 0 6M7.5 14.5l1.5 5.5" fill="none" ' + S + '/>',
    // 设置：齿轮
    settings: '<path d="M10.3 2.5h3.4l.5 2.6 1.9.8 2.2-1.5 2.4 2.4-1.5 2.2.8 1.9 2.5.5v3.4l-2.5.5-.8 1.9 1.5 2.2-2.4 2.4-2.2-1.5-1.9.8-.5 2.6h-3.4l-.5-2.6-1.9-.8-2.2 1.5-2.4-2.4 1.5-2.2-.8-1.9-2.6-.5v-3.4l2.6-.5.8-1.9-1.5-2.2 2.4-2.4 2.2 1.5 1.9-.8Z" ' + F + '/><circle cx="12" cy="12" r="3.2" fill="var(--c-n1)"/>',
    // 任务补给：清单板
    supplies: '<rect x="4.5" y="4" width="15" height="17.5" rx="1.5" ' + F + '/><rect x="8.5" y="2.5" width="7" height="3.5" rx="1" fill="var(--c-n1)" stroke="currentColor" stroke-width="1.6"/><path d="M8 11.5l1.6 1.6L12.5 10M8 16.5h8" fill="none" stroke="var(--c-n1)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    // 签到：日历打勾
    login: '<rect x="3.5" y="5" width="17" height="15.5" rx="1.5" ' + F + '/><path d="M7.5 3v4M16.5 3v4" fill="none" ' + S + '/><path d="M8 13.5l2.6 2.6L16 11" fill="none" stroke="var(--c-n1)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
    // 天赋：六芒星
    talent: '<path d="M12 2.5l2.6 5.2 5.7.8-4.1 4 1 5.7L12 15.5l-5.2 2.7 1-5.7-4.1-4 5.7-.8Z" ' + F + '/><path d="M12 19.5v2.5" fill="none" ' + S + '/>',
    // 职业与飞升：上升双箭头 + 底座
    ascend: '<path d="M6 12.5 12 6.5l6 6" fill="none" ' + S + '/><path d="M6 18 12 12l6 6" fill="none" ' + S + '/><path d="M8 3h8" fill="none" ' + S + '/>',
    // 樱花币：圆币 + 五瓣樱花
    coin: '<circle cx="12" cy="12" r="10" fill="var(--c-rare-ssr)"/><g fill="var(--c-on-accent)" transform="translate(12 12)"><path id="syPetal" d="M0-1.2C-2-3-2.4-6.2 0-7.2 2.4-6.2 2-3 0-1.2Z"/><use href="#syPetal" transform="rotate(72)"/><use href="#syPetal" transform="rotate(144)"/><use href="#syPetal" transform="rotate(216)"/><use href="#syPetal" transform="rotate(288)"/></g>'
  };
  function svg(k) { return '<svg class="syIco" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + I[k] + "</svg>"; }
  var NAV = { gacha: "gacha", roster: "roster", shop: "shop", stage: "stage", trials: "trials", archive: "archive" };
  function put(el, k) { if (!el || el.getAttribute("data-sy-ico") === k) return; var old = el.querySelector(":scope > svg:not(.syIco)"); if (old) old.remove(); var cur = el.querySelector(":scope > .syIco"); if (cur) cur.remove(); el.insertAdjacentHTML("afterbegin", svg(k)); el.setAttribute("data-sy-ico", k); }
  function apply() {
    document.querySelectorAll(".homeNav46>button").forEach(function (b) { var k = NAV[b.getAttribute("data-open")] || (b.id === "commandHistory47" ? "records" : null); if (k) put(b.querySelector(".terminalIcon48"), k); });
    put(document.getElementById("commandMail48"), "mail"); put(document.getElementById("commandNotice48"), "notice"); put(document.getElementById("commandSettings47"), "settings");
    put(document.getElementById("commandSupplies47"), "supplies"); put(document.getElementById("commandLogin48"), "login");
    var ARC = { trials: "trials", talent: "talent", story: "archive", asc: "ascend", ach: "records" };
    document.querySelectorAll("#archiveDrawer .archiveDock46>button").forEach(function (b) { var k = ARC[b.getAttribute("data-open")]; if (!k) return; var w = b.querySelector(":scope>.syArcIco"); if (!w) { w = document.createElement("i"); w.className = "syArcIco"; b.insertBefore(w, b.firstChild); } put(w, k); });
    document.querySelectorAll("#menu .coins").forEach(function (c) { put(c, "coin"); });
  }
  var css = `
html body #menu .homeNav46>button .terminalIcon48{background:none!important;width:30px!important;height:30px!important;min-width:30px;display:grid!important;place-items:center;filter:none!important;color:var(--c-n6)!important;transition:scale .18s var(--sy-ease-back,ease),color .18s,filter .18s}
html body #menu .homeNav46>button .terminalIcon48>svg:not(.syIco){display:none!important}
html body:not(#sy0) .syIco{width:100%;height:100%;display:block!important;opacity:1!important;visibility:visible!important;overflow:visible;pointer-events:none}
html body #menu .homeNav46>button b{color:var(--c-n6)!important;font-size:13px!important;font-weight:700!important;letter-spacing:.06em}
html body #menu .homeNav46>button small{color:var(--c-n5)!important;font-size:9.5px!important;opacity:1!important;letter-spacing:.12em}
html body:not(#sy0):not(#sy1) #menu .homeNav46>button[data-sy-on] .terminalIcon48{color:var(--c-primary)!important;scale:1.12;filter:drop-shadow(0 0 6px rgb(var(--c-primary-rgb) / .75))!important}
html body:not(#sy0):not(#sy1) #menu .homeNav46>button[data-sy-on] b{color:var(--c-primary)!important}
html body:not(#sy0):not(#sy1) #menu .homeNav46>button[data-sy-on]::before{content:"";position:absolute;left:18%;right:18%;bottom:2px;height:3px;background:var(--c-primary)!important;box-shadow:0 0 8px rgb(var(--c-primary-rgb) / .7)!important}
@media (hover:hover){html body #menu .homeNav46>button:hover .terminalIcon48{color:var(--c-primary-strong)!important}}
html body #menu #commandMail48>.syIco,html body #menu #commandNotice48>.syIco,html body #menu #commandSettings47>.syIco{width:26px;height:26px;color:var(--c-n6)}
html body #menu #commandMail48 span,html body #menu #commandNotice48 span,html body #menu #commandSettings47 span{color:var(--c-n6)!important;font-size:11px!important;font-weight:700}
html body #menu #commandSupplies47>.syIco,html body #menu #commandLogin48>.syIco{width:28px;height:28px;color:var(--c-n6);flex:none}
html body #menu #commandSupplies47,html body #menu #commandLogin48{color:var(--c-n6)!important;font-weight:700}
html body #menu .coins>.syIco{width:22px;height:22px;flex:none}
/* 樱夜档案入口：原来是一整块主色色块（毛坯），改成深色卡片 + 主色图标 + 左侧主色竖条 */
html body:not(#sy0):not(#sy1) #archiveDrawer .archiveDock46 button{display:flex!important;flex-direction:column;align-items:flex-start;justify-content:flex-end;gap:6px;text-align:left;background:linear-gradient(160deg,var(--c-surface-2),var(--c-surface-1))!important;color:var(--c-n6)!important;border:1px solid var(--c-line)!important;border-left:3px solid var(--c-primary)!important;box-shadow:inset 0 1px 0 rgb(var(--c-n6-rgb) / .06)!important;clip-path:polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,0 100%);transition:translate .15s,box-shadow .15s}
html body:not(#sy0):not(#sy1) #archiveDrawer .archiveDock46 button{font:700 18px var(--sy-font-title,sans-serif)!important;letter-spacing:.06em}
html body:not(#sy0):not(#sy1) #archiveDrawer .archiveDock46 button b{color:var(--c-n6)!important}
html body:not(#sy0):not(#sy1) #archiveDrawer .archiveDock46 button small{color:var(--c-n5)!important;opacity:1!important}
html body:not(#sy0):not(#sy1) #archiveDrawer .archiveDock46 button:hover{translate:0 -2px;box-shadow:0 0 0 1px var(--c-primary),0 6px 18px rgb(var(--c-primary-rgb) / .25)!important}
html body #archiveDrawer .syArcIco{display:block;width:40px;height:40px;color:var(--c-primary);margin-bottom:auto;filter:drop-shadow(0 0 6px rgb(var(--c-primary-rgb) / .45))}
@media (max-height:440px){html body #archiveDrawer .syArcIco{width:28px;height:28px}html body:not(#sy0):not(#sy1) #archiveDrawer .archiveDock46 button{min-height:96px!important;padding:12px!important}}
html body #menu .coins{color:var(--c-n6)!important;font-weight:800}
@media (max-width:520px){html body #menu .homeNav46>button .terminalIcon48{width:28px!important;height:28px!important;min-width:28px}html body #menu .homeNav46>button small{display:none!important}}
@media (max-height:440px) and (orientation:landscape){html body #menu .homeNav46>button{flex-direction:row!important;gap:5px!important;padding-top:2px!important;padding-bottom:2px!important}html body #menu .homeNav46>button .terminalIcon48{width:28px!important;height:28px!important;min-width:28px}html body #menu .homeNav46>button small{display:none!important}}
`;
  var st = document.createElement("style"); st.id = "syIcons"; st.textContent = css; document.head.appendChild(st);
  apply(); var n = 0, t = setInterval(function () { apply(); if (++n > 20) clearInterval(t); }, 250);
  global.SakurayoIcons = { svg: svg, apply: apply, list: Object.keys(I) };
})(typeof window !== "undefined" ? window : globalThis);
