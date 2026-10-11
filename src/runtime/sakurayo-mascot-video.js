/* 视频看板娘入口（用户用 Seedance 2.0 等工具自制动态立绘）。规格见 docs/MASCOT_VIDEO.md。
   每个角色一个清单：art/live_video/<角色>/clips.js →
     (window.SakurayoMascotVideoClips = window.SakurayoMascotVideoClips || {})["sayo"] = {
       idle: "idle.mp4",                     // 循环待机（首尾帧相同，无缝循环）
       taps: { head: ["tap_head.mp4"], body: ["tap_body.mp4"], any: ["tap_1.mp4", "tap_2.mp4"] },  // 点击片段：播完自动回 idle
       poster: "poster.webp"                 // 可选：首帧海报，视频加载前显示
     };
   两个 <video> 双缓冲：下一段先在后台缓冲到可播放，再 0.18s 交叉淡入，避免切换黑帧/跳帧。
   清单不存在 → 返回 false，调用方回退到原来的 rig / 静态立绘。 */
(function (global) {
  "use strict";
  var cur = null;
  function has(id) { var c = global.SakurayoMascotVideoClips; return !!(c && c[id] && c[id].idle); }
  function load(id, artUrl) { // 动态加载 clips.js（file:// 下不能 fetch JSON，用 <script>）
    return new Promise(function (res) {
      if (has(id)) return res(true);
      var s = document.createElement("script"); s.src = artUrl("live_video/" + id + "/clips.js");
      s.onload = function () { res(has(id)); }; s.onerror = function () { res(false); }; document.head.appendChild(s);
    });
  }
  function mount(box, id, artUrl, opt) {
    unmount(); opt = opt || {};
    var C = global.SakurayoMascotVideoClips[id], base = function (f) { return artUrl("live_video/" + (C.dir || id) + "/" + f); };
    var wrap = document.createElement("div"); wrap.className = "heroVid46";
    var v = [0, 1].map(function () { var e = document.createElement("video"); e.muted = true; e.playsInline = true; e.setAttribute("playsinline", ""); e.preload = "auto"; if (C.poster) e.poster = base(C.poster); wrap.appendChild(e); return e; });
    box.appendChild(wrap);
    // 浏览器省电策略可能暂停“无手势静音自动播放”的视频（切换瞬间元素还是透明的）→ 当前前台视频被意外暂停就续播
    v.forEach(function (e, i) { e.addEventListener("pause", function () { if (cur === st && st.front === i && !e.ended && !st.stop) setTimeout(function () { if (e.paused && st.front === i && !e.ended) e.play().catch(function () {}); }, 30); }); });
    var st = { id: id, wrap: wrap, v: v, front: 0, clip: "idle", plays: 0 };
    function pick(src) { // 片段可写成数组 ["x.webm","x.mp4"]：按浏览器能力挑第一个能播的（Android WebView: H.264/VP9 都行；桌面 Chromium 测试环境只有 VP9）
      if (!Array.isArray(src)) return src; var t = document.createElement("video");
      for (var i = 0; i < src.length; i++) { var m = /\.webm$/i.test(src[i]) ? 'video/webm; codecs="vp9"' : 'video/mp4; codecs="avc1.42E01E"'; if (t.canPlayType(m)) return src[i]; }
      return src[src.length - 1];
    }
    function show(src, loop, name) {
      src = pick(src); var back = v[1 - st.front], front = v[st.front], done = false;
      back.loop = !!loop; back.onended = null;
      var go = function () { if (done) return; done = true; back.removeEventListener("canplay", go);
        back.currentTime = 0; var pr = back.play(); if (pr && pr.catch) pr.catch(function (e) { st.err = String(e); });
        back.classList.add("on"); front.classList.remove("on"); setTimeout(function () { front.pause(); }, 220);
        st.front = 1 - st.front; st.clip = name === "idle" ? "idle" : "tap:" + src; st.plays++;
        back.onended = loop ? null : function () { show(C.idle, true, "idle"); }; };
      back.addEventListener("canplay", go);
      if (back.getAttribute("data-src") !== src) { back.setAttribute("data-src", src); back.src = base(src); back.load(); }
      else if (back.readyState >= 3) go();
      setTimeout(go, 1500); // 兜底：缓存命中时 canplay 可能不再触发
    }
    show(C.idle, true, "idle");
    st.tap = function (part) {
      var T = C.taps || {}, list = (T[part] && T[part].length ? T[part] : T.any) || [];
      if (!list.length) return null; var f = list[(st.plays + Math.floor(Math.random() * list.length)) % list.length];
      show(f, false, "tap"); return Array.isArray(f) ? f[0] : f;
    };
    st.onTap = function (e) { var r = wrap.getBoundingClientRect(), y = (e.clientY - r.top) / r.height; st.tap(y < 0.3 ? "head" : "body"); };
    wrap.addEventListener("pointerdown", st.onTap);
    cur = st; return st;
  }
  function unmount() { if (!cur) return; cur.stop = true; cur.v.forEach(function (e) { e.pause(); e.removeAttribute("src"); }); cur.wrap.remove(); cur = null; }
  function state() { return cur ? { err: cur.err || null, ended: cur.v.map(function (e) { return e.ended; }), id: cur.id, clip: cur.clip, plays: cur.plays, playing: cur.v.map(function (e) { return !e.paused; }) } : null; }
  global.SakurayoMascotVideo = { has: has, load: load, mount: mount, unmount: unmount, state: state, tap: function (p) { return cur ? cur.tap(p || "any") : null; } };
})(typeof window !== "undefined" ? window : globalThis);
