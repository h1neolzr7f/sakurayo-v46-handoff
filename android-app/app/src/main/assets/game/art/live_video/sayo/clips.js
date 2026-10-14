// 由 pack_mascot_video.py 生成 —— 视频看板娘清单。请勿手改，改动会被下次生成覆盖。
// 规格见 docs/MASCOT_VIDEO.md：idle 无缝循环；taps 播完自动回 idle。
// head / body 各自轮换。any 只在该部位没有专属片段时才用。
// greet 是进大厅时播一次的招呼，播完回到 idle。只给人设里会打招呼的角色。
(window.SakurayoMascotVideoClips = window.SakurayoMascotVideoClips || {})["sayo"] = {
  idle: ["idle.webm", "idle.mp4"],
  taps: {
    head: [["tap_head.webm", "tap_head.mp4"], ["act3.webm", "act3.mp4"]],
    body: [["tap_body.webm", "tap_body.mp4"], ["act2.webm", "act2.mp4"], ["act1.webm", "act1.mp4"]]
  },
  greet: ["act1.webm", "act1.mp4"],
  poster: "poster.webp"
};
