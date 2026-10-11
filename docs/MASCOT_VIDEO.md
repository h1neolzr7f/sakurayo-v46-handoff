# 视频看板娘接入规格（Seedance 2.0 等工具自制）

rig 不再继续开发。大厅看板娘优先播放视频；某个角色没有视频清单时，自动回退到现有的 rig / 静态立绘。

## 放置位置
```
android-app/app/src/main/assets/game/art/live_video/<角色>/   # 角色：sayo / aya / rion
  clips.js        # 清单（必需）
  idle.mp4 idle.webm
  tap_head.mp4 tap_head.webm  tap_body.mp4 ...
  poster.webp     # 可选，视频加载前显示的首帧
```
`clips.js` 示例：
```js
(window.SakurayoMascotVideoClips = window.SakurayoMascotVideoClips || {})["sayo"] = {
  idle: ["idle.webm", "idle.mp4"],                       // 循环待机
  taps: {                                                // 点击片段：播完自动回到 idle
    head: [["tap_head.webm", "tap_head.mp4"]],           // 点头部（立绘上方 30%）
    body: [["tap_body.webm", "tap_body.mp4"]],           // 点身体
    any:  [["tap_1.webm", "tap_1.mp4"], ["tap_2.webm", "tap_2.mp4"]]  // 对应部位没有片段时从这里轮换
  },
  poster: "poster.webp"
};
```
每个片段可以写成数组 `[webm, mp4]`，运行时挑第一个当前浏览器能播的格式。安卓 WebView 两种格式都能播；桌面测试用的 Chromium 只能播 VP9，所以建议两种格式都放。

## 视频规格
| 项 | 要求 |
|---|---|
| 画面 | 竖构图，**宽:高 = 2:3**（推荐 720×1080，最低 540×810），人物从头到膝或全身，**脚底/画面底边对齐**（运行时 `object-fit: contain`，底部居中） |
| 背景 | **纯色或透明不可用于叠加** → 请直接带大厅同色系夜景背景，或纯深色 `#090714`；不需要抠像 |
| 机位 | 固定机位，不推拉、不平移；人物在所有片段里**位置、大小一致**（同一张首帧图生成） |
| 循环 idle | 4–8 秒；**首帧与尾帧完全一致**（Seedance 用同一张图作首尾帧，或生成后正放+倒放拼接）；动作克制：呼吸、眨眼、发丝/裙摆轻摆 |
| 点击片段 | 1.5–4 秒；**首帧和尾帧都与 idle 的首帧一致**（从 idle 姿势出发并回到 idle 姿势），保证切换无跳变 |
| 帧率 | 24 或 30 fps，恒定帧率 |
| 编码 | MP4：H.264 High/Main，yuv420p，`-movflags +faststart`，CRF 20–24；WebM：VP9，CRF 32–38；**无音轨** |
| 体积 | 每段 ≤ 1.5 MB（APK 体积考虑）；单角色合计 ≤ 8 MB |
| 安全区 | 头顶留 5% 空白；左右 10% 内不要放关键动作（窄屏会被 UI 遮挡） |

转码参考：
```
ffmpeg -i in.mp4 -vf "scale=720:1080:flags=lanczos,fps=30" -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 22 -an -movflags +faststart idle.mp4
ffmpeg -i in.mp4 -vf "scale=720:1080,fps=30" -c:v libvpx-vp9 -b:v 0 -crf 36 -row-mt 1 -an idle.webm
```
无缝循环（正放 + 倒放）：`ffmpeg -i raw.mp4 -filter_complex "[0]split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1" loop.mp4`

## 运行时行为
- 两个 `<video>` 双缓冲：下一段先在后台缓冲到可以播放，再用 0.18 秒交叉淡入切换，没有黑帧。
- 点击片段播完自动回到 idle。快速连点时，以最后一次点击为准。
- 画面设置里的「特效 = 0」（省电/减弱动态）时不播放视频，显示静态立绘。
- 演示素材：`art/live_video/_demo/`（从现有录像裁出来的绫，只用于测试）。清单里写 `dir: "_demo"` 就可以指向它。
- 测试：`tests/mascot_video_smoke.mjs`（idle 循环 → 点击片段 → 回到 idle，并且不挂载 rig）。
