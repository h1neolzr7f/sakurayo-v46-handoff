(function (global) {
  "use strict";

  var VERSION = "4.6.0";
  // Live2D Cubism AutoEyeBlinkInput defaults: Mean 2.5, Maximum Deviation 2.
  // https://docs.live2d.com/en/cubism-sdk-tutorials/eyeblink/
  var BLINK = Object.freeze({
    mean: 2.5,
    deviation: 2,
    close: 0.08,
    hold: 0.05,
    open: 0.12,
    doubleChance: 0.18,
    doubleGap: 0.14,
  });
  // CubismLookController damping ~0.15s, then return to center when idle.
  var LOOK = Object.freeze({ damp: 0.16, maxX: 7.2, maxY: 4.8, maxTX: 1.35, maxTY: 0.7, idle: 1.35 });
  var IDLE = Object.freeze({ swayA: 4.7, swayB: 7.3, drift: 5.6, breath: 3.15, hair: 0.22 });
  var MOTIONS = Object.freeze({
    tapHead: Object.freeze({ dur: 0.92, fadeIn: 0.1, fadeOut: 0.26, lean: -2.6, lift: 0.7, lookY: -0.38 }),
    tapBody: Object.freeze({ dur: 1.12, fadeIn: 0.12, fadeOut: 0.34, lean: 3.1, lift: -0.45, lookY: 0.18 }),
  });

  var CSS =
    ".heroLivePhys46,.heroLiveLook46{height:100%;width:100%;display:grid;place-items:end center;pointer-events:none}" +
    ".heroLivePhys46{transform-origin:50% 6%}" +
    ".heroLiveLook46{position:relative;height:100%;width:100%;transform-origin:50% 28%}" +
    ".heroLive46.livePuppet46 .heroLiveSway46,.heroLive46.livePuppet46 .heroLiveBreath46,.heroLive46.livePuppet46 .heroLiveBlink46,.heroLive46.livePuppet46 .heroLiveBase46{animation:none!important}" +
    ".heroLive46.livePuppet46 .heroLiveSway46,.heroLive46.livePuppet46 .heroLivePhys46,.heroLive46.livePuppet46 .heroLiveBreath46,.heroLive46.livePuppet46 .heroLiveLook46{will-change:transform}" +
    ".heroLive46.livePaused46 .heroLiveSway46,.heroLive46.livePaused46 .heroLivePhys46,.heroLive46.livePaused46 .heroLiveBreath46,.heroLive46.livePaused46 .heroLiveLook46{will-change:auto}" +
    ".heroHead46{position:absolute;z-index:3;left:16%;width:22%;top:8%;height:30%;pointer-events:auto;background:transparent;border:0}" +
    ".heroLive46 .heroTap46{left:12%;width:30%;top:38%;bottom:10%}" +
    ".heroLiveBreath46:after{content:\"\";position:absolute;left:28%;right:28%;bottom:7%;height:16px;border-radius:50%;background:radial-gradient(ellipse,#05020d88 0%,#05020d00 72%);pointer-events:none}" +
    "#menu.homeDock46 .heroLiveBreath46 img,.wishHero46{filter:none!important}" +
    "#menu.homeDock46 .heroLiveBreath46:before{filter:none!important;background:radial-gradient(ellipse at 50% 78%,#1a103066 0%,#12081c00 70%)}" +
    ".drawer.hidden .wishPetals46 i,.drawer.hidden .wishStage46:before{animation:none!important}" +
    "#menu.homeDock46 .heroLiveBreath46{height:78%;width:min(42vw,440px);max-height:78%;justify-self:start;margin:0 0 0 7%}" +
    "html.landscape46 #menu.homeDock46 .heroLive46{top:0;bottom:0;left:0;right:auto;width:64%}" +
    "html.landscape46 #menu.homeDock46 .heroLiveBreath46{height:78%;width:min(42vw,440px);max-height:78%}" +
    "html.landscape46 #menu.homeDock46 .heroLiveBreath46 img{object-fit:contain;object-position:center 10%}" +
    "html.landscape46 #menu.homeDock46 .menu{width:min(34vw,360px);max-width:360px;margin-left:auto}" +
    "html.landscape46 #menu.homeDock46 #coverTitle36{left:max(16px,env(safe-area-inset-left));right:auto;transform:none;text-align:left}" +
    "html.landscape46 .nav,html.landscape46 .homeNav46{grid-template-columns:repeat(5,minmax(0,1fr))!important}" +
    "html.landscape46 .heroHead46{left:22%;width:18%;top:8%;height:26%}" +
    "html.landscape46 .heroLive46 .heroTap46{left:18%;width:28%;top:34%;bottom:14%}" +
    "@media(orientation:landscape){.heroHead46{left:18%;width:16%;top:10%;height:28%}.heroLive46 .heroTap46{left:14%;width:22%;top:36%;bottom:12%}}" +
    "@media(prefers-reduced-motion:reduce){.heroLive46.livePuppet46 .heroLiveSway46,.heroLive46.livePuppet46 .heroLivePhys46,.heroLive46.livePuppet46 .heroLiveBreath46,.heroLive46.livePuppet46 .heroLiveLook46{transform:none!important}}";

  var puppet = null;

  function clamp(n, min, max) {
    return n < min ? min : n > max ? max : n;
  }

  function nextBlinkWait(rand) {
    var roll = typeof rand === "function" ? rand() : Math.random();
    return Math.max(0.55, BLINK.mean + (roll * 2 - 1) * BLINK.deviation);
  }

  function blinkEnvelope(t) {
    if (t < 0) return 1;
    if (t < BLINK.close) return 1 - t / BLINK.close;
    if (t < BLINK.close + BLINK.hold) return 0;
    var openT = t - BLINK.close - BLINK.hold;
    if (openT < BLINK.open) return openT / BLINK.open;
    return 1;
  }

  function blinkDuration() {
    return BLINK.close + BLINK.hold + BLINK.open;
  }

  function damp(cur, target, dt, time) {
    var k = 1 - Math.exp(-dt / Math.max(0.001, time));
    return cur + (target - cur) * k;
  }

  function motionWeight(t, motion) {
    if (!motion || t <= 0 || t >= motion.dur) return 0;
    if (t < motion.fadeIn) return t / motion.fadeIn;
    if (t > motion.dur - motion.fadeOut) return (motion.dur - t) / motion.fadeOut;
    return 1;
  }

  function idlePose(t) {
    var sway =
      Math.sin((t * Math.PI * 2) / IDLE.swayA) * 0.82 +
      Math.sin((t * Math.PI * 2) / IDLE.swayB + 1.07) * 0.34;
    var x = Math.sin((t * Math.PI * 2) / IDLE.drift + 0.41) * 0.52;
    var breath = 0.5 + 0.5 * Math.sin((t * Math.PI * 2) / IDLE.breath);
    return { sway: sway, x: x, breath: breath };
  }

  function createState(opts) {
    opts = opts || {};
    return {
      t: 0,
      lookX: 0,
      lookY: 0,
      targetX: 0,
      targetY: 0,
      idleLook: 0,
      hair: 0,
      hairV: 0,
      eye: 1,
      blinkT: -1,
      blinkWait: opts.test ? 1e9 : nextBlinkWait(opts.rand),
      pendingDouble: false,
      doubleGap: false,
      motionId: "",
      motionT: 0,
      lastKind: "",
      test: !!opts.test,
    };
  }

  function startBlink(state) {
    state.blinkT = 0;
    state.eye = 1;
  }

  function rollDouble(state, rand) {
    if (state.test) return;
    state.pendingDouble = (typeof rand === "function" ? rand() : Math.random()) < BLINK.doubleChance;
  }

  function triggerState(state, kind, rand) {
    if (kind === "blink") {
      startBlink(state);
      state.pendingDouble = false;
      state.lastKind = "blink";
      return state;
    }
    var id = kind === "tapHead" ? "tapHead" : "tapBody";
    state.motionId = id;
    state.motionT = 0;
    state.lastKind = id;
    startBlink(state);
    state.pendingDouble = kind === "tapHead";
    if (kind !== "tapHead") rollDouble(state, rand);
    return state;
  }

  function stepState(state, dt, rand) {
    dt = clamp(Number(dt) || 0, 0, 0.05);
    state.t += dt;
    state.idleLook += dt;
    if (state.idleLook > LOOK.idle) {
      state.targetX = damp(state.targetX, 0, dt, 0.45);
      state.targetY = damp(state.targetY, 0, dt, 0.45);
    }
    state.lookX = damp(state.lookX, state.targetX, dt, LOOK.damp);
    state.lookY = damp(state.lookY, state.targetY, dt, LOOK.damp);

    var idle = idlePose(state.t);
    state.hairV += (idle.sway - state.hair) * (dt / IDLE.hair);
    state.hairV *= Math.pow(0.08, dt);
    state.hair += state.hairV * dt;

    if (state.blinkT >= 0) {
      state.blinkT += dt;
      state.eye = blinkEnvelope(state.blinkT);
      if (state.blinkT >= blinkDuration()) {
        state.blinkT = -1;
        state.eye = 1;
        if (state.pendingDouble) {
          state.pendingDouble = false;
          state.blinkWait = BLINK.doubleGap;
          state.doubleGap = true;
        } else {
          state.blinkWait = state.test ? 1e9 : nextBlinkWait(rand);
          state.doubleGap = false;
        }
      }
    } else {
      state.blinkWait -= dt;
      if (state.blinkWait <= 0) {
        var gap = state.doubleGap;
        state.doubleGap = false;
        startBlink(state);
        if (!gap) rollDouble(state, rand);
      }
    }

    var motion = MOTIONS[state.motionId];
    var weight = 0;
    if (motion) {
      state.motionT += dt;
      weight = motionWeight(state.motionT, motion);
      if (state.motionT >= motion.dur) {
        state.motionId = "";
        state.motionT = 0;
        motion = null;
        weight = 0;
      }
    }

    var lean = idle.sway + (motion ? motion.lean * weight : 0);
    var lift = idle.breath * 0.85 + (motion ? motion.lift * weight : 0);
    var lookY = state.lookY + (motion ? motion.lookY * weight : 0);
    return {
      sway: lean,
      x: idle.x + state.lookX * 0.35,
      breath: idle.breath,
      lift: lift,
      hair: state.hair,
      lookX: state.lookX,
      lookY: lookY,
      eye: state.eye,
      motion: state.motionId,
      weight: weight,
    };
  }

  function applyPose(nodes, pose) {
    if (!nodes) return pose;
    var sway = "rotate(" + pose.sway.toFixed(3) + "deg) translate3d(" + pose.x.toFixed(3) + "%,0,0)";
    var phys = "rotate(" + (pose.hair * 0.55).toFixed(3) + "deg)";
    var breath =
      "translate3d(0," +
      (-pose.lift * 0.85).toFixed(3) +
      "%,0) scale(" +
      (1 + pose.breath * 0.012).toFixed(4) +
      "," +
      (1 + pose.breath * 0.018).toFixed(4) +
      ")";
    var look =
      "translate3d(" +
      (pose.lookX * LOOK.maxTX).toFixed(3) +
      "%," +
      (-pose.lookY * LOOK.maxTY).toFixed(3) +
      "%,0) rotate(" +
      (pose.lookX * LOOK.maxX * 0.18).toFixed(3) +
      "deg)";
    if (nodes.sway) nodes.sway.style.transform = sway;
    if (nodes.phys) nodes.phys.style.transform = phys;
    if (nodes.breath) nodes.breath.style.transform = breath;
    if (nodes.look) nodes.look.style.transform = look;
    if (nodes.base) nodes.base.style.opacity = pose.eye > 0.42 ? "1" : "0";
    if (nodes.blink) nodes.blink.style.opacity = pose.eye < 0.72 ? String(1 - pose.eye) : "0";
    return pose;
  }

  function injectStyle() {
    if (!global.document) return;
    var style = global.document.getElementById("sakurayo-live-css");
    if (style && style.parentNode) style.parentNode.removeChild(style);
    style = global.document.createElement("style");
    style.id = "sakurayo-live-css";
    style.textContent = CSS;
    (global.document.head || global.document.documentElement).appendChild(style);
  }

  function wrap(parent, className, kids) {
    var node = parent.querySelector("." + className);
    if (node) return node;
    node = global.document.createElement("div");
    node.className = className;
    while (parent.firstChild) node.appendChild(parent.firstChild);
    parent.appendChild(node);
    if (kids) kids.forEach(function (k) { if (k && k.parentNode !== node) node.appendChild(k); });
    return node;
  }

  function ensureLayers(root) {
    var sway = root.querySelector(".heroLiveSway46");
    if (!sway) {
      sway = global.document.createElement("div");
      sway.className = "heroLiveSway46";
      root.insertBefore(sway, root.firstChild);
    }
    var phys = wrap(sway, "heroLivePhys46");
    var breath = phys.querySelector(".heroLiveBreath46");
    if (!breath) breath = wrap(phys, "heroLiveBreath46");
    var look = breath.querySelector(".heroLiveLook46");
    if (!look) {
      look = global.document.createElement("div");
      look.className = "heroLiveLook46";
      ["heroLiveBase46", "heroLiveBlink46", "heroLiveHair46"].forEach(function (cls) {
        var img = breath.querySelector("." + cls);
        if (img) look.appendChild(img);
      });
      breath.insertBefore(look, breath.firstChild);
    }
    return {
      root: root,
      sway: sway,
      phys: phys,
      breath: breath,
      look: look,
      base: look.querySelector(".heroLiveBase46"),
      blink: look.querySelector(".heroLiveBlink46"),
    };
  }

  function reducedMotion() {
    return !!(global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function attach(root, opts) {
    injectStyle();
    if (!root || !global.document) return null;
    opts = opts || {};
    if (puppet && puppet.root === root) {
      puppet.opts = opts;
      puppet.state.test = !!opts.test;
      root.classList.add("livePuppet46");
      return snapshot();
    }
    detach();
    var nodes = ensureLayers(root);
    root.classList.add("livePuppet46");
    puppet = {
      root: root,
      nodes: nodes,
      state: createState({ test: !!opts.test }),
      opts: opts,
      last: 0,
      raf: 0,
      pose: idlePose(0),
    };
    var move = function (ev) {
      if (!puppet) return;
      var box = root.getBoundingClientRect();
      if (!box.width || !box.height) return;
      puppet.state.targetX = clamp((ev.clientX - (box.left + box.width * 0.42)) / (box.width * 0.5), -1, 1);
      puppet.state.targetY = clamp((box.top + box.height * 0.28 - ev.clientY) / (box.height * 0.5), -1, 1);
      puppet.state.idleLook = 0;
    };
    root.ownerDocument.addEventListener("pointermove", move, { passive: true });
    puppet.move = move;
    function loop(now) {
      if (!puppet) return;
      var hidden = typeof puppet.opts.hidden === "function" ? puppet.opts.hidden() : false;
      var pause = hidden || document.hidden || reducedMotion();
      root.classList.toggle("livePaused46", pause);
      if (!pause) {
        var dt = puppet.last ? (now - puppet.last) / 1000 : 0.016;
        puppet.pose = applyPose(puppet.nodes, stepState(puppet.state, dt, Math.random));
      }
      puppet.last = now;
      puppet.raf = global.requestAnimationFrame(loop);
    }
    if (global.requestAnimationFrame) puppet.raf = global.requestAnimationFrame(loop);
    return snapshot();
  }

  function detach() {
    if (!puppet) return;
    if (puppet.move && puppet.root && puppet.root.ownerDocument) {
      puppet.root.ownerDocument.removeEventListener("pointermove", puppet.move);
    }
    if (puppet.raf && global.cancelAnimationFrame) global.cancelAnimationFrame(puppet.raf);
    if (puppet.root) {
      puppet.root.classList.remove("livePuppet46", "livePaused46");
    }
    puppet = null;
  }

  function trigger(kind, rand) {
    if (!puppet) return null;
    triggerState(puppet.state, kind, rand);
    return snapshot();
  }

  function lookAt(x, y) {
    if (!puppet) return null;
    puppet.state.targetX = clamp(Number(x) || 0, -1, 1);
    puppet.state.targetY = clamp(Number(y) || 0, -1, 1);
    puppet.state.idleLook = 0;
    return snapshot();
  }

  function snapshot() {
    if (!puppet) return { attached: false, version: VERSION };
    return {
      attached: true,
      version: VERSION,
      eye: puppet.state.eye,
      blink: puppet.state.blinkT >= 0,
      motion: puppet.state.motionId || "",
      lastKind: puppet.state.lastKind,
      lookX: puppet.state.lookX,
      lookY: puppet.state.lookY,
      t: puppet.state.t,
    };
  }

  global.SakurayoLive = {
    version: VERSION,
    BLINK: BLINK,
    LOOK: LOOK,
    MOTIONS: MOTIONS,
    nextBlinkWait: nextBlinkWait,
    blinkEnvelope: blinkEnvelope,
    blinkDuration: blinkDuration,
    damp: damp,
    idlePose: idlePose,
    createState: createState,
    stepState: stepState,
    triggerState: triggerState,
    injectStyle: injectStyle,
    attach: attach,
    detach: detach,
    trigger: trigger,
    lookAt: lookAt,
    snapshot: snapshot,
  };
})(typeof window !== "undefined" ? window : globalThis);
