// 由 pack_mascot_video.py 生成 —— 视频看板娘清单。请勿手改，改动会被下次生成覆盖。
// 规格见 docs/MASCOT_VIDEO.md：idle 无缝循环；taps 播完自动回 idle。
// any 是不分部位的动作库，运行时在其内部随机轮换（head/body 与 any 合并后一起抽）。
(window.SakurayoMascotVideoClips = window.SakurayoMascotVideoClips || {})["rion"] = {
  idle: ["idle.webm", "idle.mp4"],
  taps: {
    head: [["tap_head.webm", "tap_head.mp4"]],
    body: [["tap_body.webm", "tap_body.mp4"]],
    any: [["act1.webm", "act1.mp4"], ["act2.webm", "act2.mp4"], ["act3.webm", "act3.mp4"]]
  },
  poster: "poster.webp"
};
