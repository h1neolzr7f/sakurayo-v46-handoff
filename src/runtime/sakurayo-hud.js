/* Action-game battle HUD: arc button cluster (attack / skill / burst / dash), burst charge ring,
   burst cut-in, minimap and world-edge fade. Reads game data only through window.SakurayoBattle46. */
(function (global) {
  "use strict";
  var doc = global.document;
  var CSS = [
    "#hud .acts{position:absolute;right:max(14px,env(safe-area-inset-right));bottom:max(12px,env(safe-area-inset-bottom));width:212px;height:178px;display:block!important}",
    "#hud .acts .act{position:absolute;margin:0}",
    "#hud #atk46{right:6px;bottom:6px;width:88px;height:88px;background:radial-gradient(circle at 50% 38%,#ffd8ec,#ff5aa6 58%,#7a2160);font:900 15px/1 system-ui;color:#fff;letter-spacing:.1em;text-shadow:0 1px 3px #0009;border:2px solid #fff6}",
    "#hud #skill{right:104px!important;bottom:4px!important;width:64px!important;height:64px!important}",
    "#hud #ult46{right:82px;bottom:86px;width:62px;height:62px;background:radial-gradient(circle at 50% 40%,#fff3c4,#ffb13b 55%,#7a3f08);font:900 13px/1 system-ui;color:#3a1600;border:2px solid #fff8}",
    "#hud #ult46 svg{position:absolute;inset:-5px;width:calc(100% + 10px);height:calc(100% + 10px);transform:rotate(-90deg);pointer-events:none}",
    "#hud #ult46 circle{fill:none;stroke-width:4}#hud #ult46 .bg{stroke:#0007}#hud #ult46 .fg{stroke:#ffe27a;stroke-linecap:round;transition:stroke-dashoffset .2s}",
    "#hud #ult46:not(.ready){filter:grayscale(.75) brightness(.7)}#hud #ult46.ready{animation:ultPulse46 1.1s ease-in-out infinite}",
    "@keyframes ultPulse46{50%{box-shadow:0 0 0 4px #fff3,0 0 26px #ffcf5a}}",
    "#hud #dash{right:8px!important;bottom:104px!important;width:56px!important;height:56px!important}",
    "#hud #atk46:active,#hud #ult46:active{transform:scale(.92)}",
    "#hud #minimap46{position:absolute!important;left:auto!important;right:max(10px,env(safe-area-inset-right));top:calc(max(8px,env(safe-area-inset-top)) + 112px);width:128px;height:72px;border-radius:10px;border:1px solid #96e4f566;background:#060a18b8;box-shadow:0 4px 14px #0008;pointer-events:none}",
    "@media (max-height:380px){#hud #minimap46{width:104px;height:58px;top:calc(max(6px,env(safe-area-inset-top)) + 104px)}#hud .acts{transform:scale(.88);transform-origin:right bottom}}",
    "#ultCut46{position:fixed;inset:0;z-index:30;pointer-events:none;overflow:hidden;background:linear-gradient(100deg,#0000 0 18%,#05030bdd 18% 82%,#0000 82%);clip-path:polygon(0 30%,100% 18%,100% 70%,0 82%);animation:ultCut46 .95s ease-out forwards}",
    "#ultCut46 img{position:absolute;right:6%;top:-8%;height:130%;object-fit:contain;filter:drop-shadow(0 0 18px #ffb7dd);animation:ultArt46 .95s cubic-bezier(.2,.8,.2,1) forwards}",
    "#ultCut46 b{position:absolute;left:10%;top:42%;font:900 clamp(26px,6vw,54px)/1 system-ui;color:#fff;letter-spacing:.14em;text-shadow:0 0 18px #ff5aa6,0 3px 0 #0008;animation:ultText46 .95s ease-out forwards}",
    "#ultCut46 small{position:absolute;left:10.4%;top:calc(42% + clamp(32px,7vw,62px));font:800 13px/1 system-ui;letter-spacing:.3em;color:#ffe27a}",
    "@keyframes ultCut46{0%{opacity:0;transform:scaleY(.2)}12%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0}}",
    "@keyframes ultArt46{0%{transform:translateX(40%)}20%{transform:translateX(0)}100%{transform:translateX(-6%)}}",
    "@keyframes ultText46{0%{transform:translateX(-30%);opacity:0}25%{transform:none;opacity:1}}",
    "#banter.banter{top:auto!important;bottom:max(12px,env(safe-area-inset-bottom))!important;left:50%!important;right:auto!important;transform:translateX(-50%)!important;width:min(420px,40vw)!important;max-width:none!important;padding:7px 12px!important;font-size:12px!important;opacity:.94}",
    "#bossBreak46{position:absolute;left:50%;top:calc(max(8px,env(safe-area-inset-top)) + 112px);transform:translateX(-50%);width:min(320px,38vw);height:16px;border-radius:9px;background:#0a0716cc;border:1px solid #ffd36b66;overflow:hidden;pointer-events:none}",
    "#bossBreak46 i{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,#ffb13b,#ffe27a);transition:width .15s}",
    "#bossBreak46.broken{border-color:#fff;box-shadow:0 0 14px #ff5aa6}#bossBreak46.broken i{background:linear-gradient(90deg,#ff5aa6,#ffd0e8)}",
    "#bossBreak46.enraged{border-color:#ff3b6b}",
    "#bossBreak46 span{position:relative;display:block;text-align:center;font:800 10.5px/16px system-ui;color:#fff;text-shadow:0 1px 2px #000;letter-spacing:.06em}",
  ].join("\n");
  var built = false, mini = null, last = 0, ring = null;
  function api() { return global.SakurayoBattle46; }
  function build() {
    if (built || !doc) return;
    var acts = doc.querySelector("#hud .acts");
    if (!acts) return;
    built = true;
    var style = doc.createElement("style"); style.id = "sakurayoHud46"; style.textContent = CSS; doc.head.appendChild(style);
    var atk = doc.createElement("button"); atk.className = "act"; atk.id = "atk46"; atk.type = "button"; atk.setAttribute("aria-label", "攻击"); atk.textContent = "攻击";
    var ult = doc.createElement("button"); ult.className = "act"; ult.id = "ult46"; ult.type = "button"; ult.setAttribute("aria-label", "大招");
    ult.innerHTML = '<svg viewBox="0 0 40 40"><circle class="bg" cx="20" cy="20" r="18"/><circle class="fg" cx="20" cy="20" r="18" stroke-dasharray="113.1" stroke-dashoffset="113.1"/></svg><span>大招</span>';
    acts.appendChild(atk); acts.appendChild(ult);
    ring = ult.querySelector(".fg");
    atk.addEventListener("pointerdown", function (e) { e.preventDefault(); e.stopPropagation(); var a = api(); if (a) a.attack(); });
    ult.addEventListener("pointerdown", function (e) { e.preventDefault(); e.stopPropagation(); var a = api(); if (a) a.ult(); });
    mini = doc.createElement("canvas"); mini.id = "minimap46"; mini.width = 256; mini.height = 144;
    doc.getElementById("hud").appendChild(mini);
  }
  function paintMini(m) {
    if (!mini || !m) return;
    var c = mini.getContext("2d"), w = mini.width, h = mini.height, sx = w / m.worldW, sy = h / m.worldH;
    c.clearRect(0, 0, w, h);
    c.fillStyle = "#ffffff10"; c.fillRect(0, 0, w, h);
    c.strokeStyle = "#96e4f5aa"; c.lineWidth = 2; c.strokeRect(m.cam.x * sx, m.cam.y * sy, m.cam.w * sx, m.cam.h * sy);
    function dot(x, y, r, col) { c.fillStyle = col; c.beginPath(); c.arc(x * sx, y * sy, r, 0, Math.PI * 2); c.fill(); }
    (m.elites || []).forEach(function (e) { dot(e.x, e.y, 3, "#ffd36b"); });
    (m.chests || []).forEach(function (p) { c.fillStyle = "#ffcf4a"; c.fillRect(p.x * sx - 4, p.y * sy - 4, 8, 8); });
    (m.shrines || []).forEach(function (p) { dot(p.x, p.y, 4, "#ff9fd0"); });
    if (m.boss) { dot(m.boss.x, m.boss.y, 7, "#ff3b6b"); c.strokeStyle = "#fff"; c.lineWidth = 2; c.stroke(); }
    dot(m.player.x, m.player.y, 5, "#7ff3ff");
  }
  function tick(now) {
    var a = api();
    if (a && doc) {
      build();
      var s = a.state();
      var ult = doc.getElementById("ult46");
      if (ult && s) { ult.classList.toggle("ready", s.ult >= 100); if (ring) ring.setAttribute("stroke-dashoffset", String(113.1 * (1 - Math.min(100, s.ult) / 100))); }
      if (now - last > 120) { last = now; if (s && s.playing) paintMini(a.minimap()); }
    }
    global.requestAnimationFrame(tick);
  }
  function cutIn(art, title, sub) {
    if (!doc) return;
    var old = doc.getElementById("ultCut46"); if (old) old.remove();
    var el = doc.createElement("div"); el.id = "ultCut46";
    el.innerHTML = '<img alt="" src="' + art + '"><b></b><small></small>';
    el.querySelector("b").textContent = title; el.querySelector("small").textContent = sub || "BURST";
    doc.body.appendChild(el);
    global.setTimeout(function () { el.remove(); }, 1000);
  }
  global.SakurayoHud = Object.freeze({ build: build, cutIn: cutIn, paintMini: paintMini });
  if (doc && global.requestAnimationFrame) global.requestAnimationFrame(tick);
})(typeof window !== "undefined" ? window : globalThis);
