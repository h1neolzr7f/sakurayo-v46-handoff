/* 横屏锁定：游戏只支持横屏。竖屏时盖一层全屏旋转提示（崩三风格：手机旋转动画 + “请横屏游玩”），
   提示期间通过 SakurayoPlatform 暂停时钟、释放输入，并挡住所有触摸；支持的环境里尝试 screen.orientation.lock。 */
(function (global) {
  "use strict";
  var doc = global.document;
  var css = `
#syRotate{position:fixed;inset:0;z-index:2147483000;display:none;flex-direction:column;align-items:center;justify-content:center;gap:22px;background:radial-gradient(ellipse at 50% 42%,rgb(var(--c-primary-rgb) / .2),transparent 68%),var(--c-n0);color:var(--c-n6);touch-action:none;user-select:none;-webkit-user-select:none}
#syRotate.on{display:flex}
#syRotate::before{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgb(var(--c-n6-rgb) / .03) 0 1px,transparent 1px 3px)}
#syRotate .ph{position:relative;width:64px;height:112px;border:4px solid var(--c-n6);border-radius:12px;animation:syRot 2.4s cubic-bezier(.6,0,.3,1) infinite;box-shadow:0 0 18px rgb(var(--c-primary-rgb) / .55)}
#syRotate .ph::before{content:"";position:absolute;left:50%;top:6px;width:18px;height:3px;margin-left:-9px;border-radius:2px;background:var(--c-n6)}
#syRotate .ph::after{content:"";position:absolute;inset:14px 6px;background:linear-gradient(135deg,rgb(var(--c-primary-rgb) / .55),rgb(var(--c-accent-rgb) / .35))}
#syRotate .arc{position:absolute;width:150px;height:150px;border:3px solid transparent;border-top-color:var(--c-primary);border-right-color:var(--c-primary);border-radius:50%;animation:syArc 2.4s cubic-bezier(.6,0,.3,1) infinite;opacity:.8}
#syRotate .stage{position:relative;display:grid;place-items:center;width:160px;height:160px}
#syRotate b{font:italic 800 22px var(--sy-font-title,sans-serif);letter-spacing:.2em;padding:6px 34px 6px 26px;background:var(--c-primary);color:var(--c-on-primary);clip-path:polygon(0 0,100% 0,calc(100% - 16px) 100%,0 100%)}
#syRotate small{font:700 11px sans-serif;letter-spacing:.32em;color:var(--c-n5)}
@keyframes syRot{0%,18%{rotate:0deg}48%,82%{rotate:-90deg}100%{rotate:0deg}}
@keyframes syArc{0%,18%{rotate:0deg;opacity:0}30%{opacity:.8}48%,82%{rotate:-90deg;opacity:.8}100%{rotate:0deg;opacity:0}}
@media (prefers-reduced-motion:reduce){#syRotate .ph{animation:none;rotate:-90deg}#syRotate .arc{animation:none}}
`;
  var st = doc.createElement("style"); st.id = "syRotateCss"; st.textContent = css; doc.head.appendChild(st);
  var el = doc.createElement("div"); el.id = "syRotate"; el.setAttribute("role", "alert"); el.setAttribute("aria-live", "assertive");
  el.innerHTML = '<div class="stage"><i class="arc"></i><i class="ph"></i></div><b>请横屏游玩</b><small>ROTATE YOUR DEVICE</small>';
  var mq = global.matchMedia("(orientation:portrait)");
  var on = false;
  function stop(e) { e.stopPropagation(); e.preventDefault(); }
  ["pointerdown", "pointerup", "touchstart", "touchend", "click", "keydown"].forEach(function (t) { el.addEventListener(t, stop, { passive: false }); });
  function tryLock() { try { var o = global.screen && global.screen.orientation; if (o && o.lock) o.lock("landscape").catch(function () {}); } catch (e) {} }
  function apply() {
    var want = mq.matches;
    if (want === on) return;
    on = want;
    if (!el.isConnected) doc.body.appendChild(el);
    el.classList.toggle("on", on);
    doc.documentElement.classList.toggle("syPortraitBlocked", on);
    global.__syRotateBlocked = on;
    var P = global.SakurayoPlatform;
    if (on) { if (P) P.suspend(); tryLock(); }
    else if (P && !doc.hidden) P.resume();
  }
  function keyGuard(e) { if (on) { e.stopImmediatePropagation(); e.preventDefault(); } }
  global.addEventListener("keydown", keyGuard, true); global.addEventListener("keyup", keyGuard, true);
  if (mq.addEventListener) mq.addEventListener("change", apply); else mq.addListener(apply);
  global.addEventListener("resize", apply);
  doc.addEventListener("pointerdown", tryLock, { once: true, capture: true });
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", apply); else apply();
  global.SakurayoRotate = { state: function () { return on; }, apply: apply };
})(window);
