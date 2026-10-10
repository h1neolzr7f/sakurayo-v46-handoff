# PLAYBOOK — 这条线上验证过的做法与坑

> 面向接手的人/agent。每条都是踩过坑后留下的“怎么做才对”。

## 1. 中转站出图（gpt-image-2）
- 脚本：`/workspace/sakurayo-gen/gen.py`，凭据在 `/workspace/.secrets/sakurayo-relay.env`（不要入库）。
- **必须带浏览器 UA**（`User-Agent: Mozilla/5.0 …`），否则中转站的 WAF 会直接 403/断连。
- `503 no_available_account` = 账号池暂时打满：退避 90–120 s 重试，最多 80 次；不要高频重试（会拖垮其它任务）。并发 4–6。
- 每个资产出 2–3 个变体再自动/人工挑；edit 任务一律把原立绘作为 `ref`，提示词开头写“Keep … pixel-identical”。
- 语义 mask 的套路：让模型把某部位“涂成纯色 #00FF00/#FFFF00/#0000FF”，再按颜色阈值取 mask，比分割模型稳。

## 2. 抠图 rembg
- 立绘/动漫用 `isnet-anime` 会话；会话对象复用（`new_session` 一次），否则每张都重载模型。
- 白底生成图：先 rembg，再对 alpha 做 0.8 px 高斯，避免锯齿亮边。不要用“非白即前景”的阈值判断（米白阴影会变成白块）。

## 3. 对齐 ECC
- `cv2.findTransformECC(..., MOTION_AFFINE, mask=静止区)`：只用**不动的区域**求变换，否则动作本身会把变换带偏。
- 输入灰度 float32/255；失败时 `cv2.error` 退回单位阵。
- OpenCV 5 移走了 `CascadeClassifier`：钉 `opencv-python-headless<5`。

## 4. RIFE 补帧（CPU）
- `/workspace/sakurayo-tools/rife_interp.py`（Practical-RIFE v4.25 权重 + vs-rife 网络定义，MIT）。
- 输入宽高必须是 **64 的倍数**（32 不够，多尺度金字塔会 1248≠1280 报错）。
- RGBA：先合成到中性灰底再插值，再反合成；alpha 通道单独插。
- 只在**运动区包围盒**里插，整图 1024×1536 在共享 15 GB 的盒子上会被 OOM killer 杀（dmesg 可见）。
- 大动作别指望一次插：用 gpt-image-2 多出 2–3 个中间关键帧，每段再递归二分 3 次（7 帧）。

## 5. 去闪烁 / 闪烁检测
- 根因通常是：AI 重绘造成整体亮度/色偏不同、抠图边缘每帧不同、锚点漂移、重采样模糊。
- 做法：静止区逐通道均值/方差匹配 → **静止区直接回填原图像素**（运动 mask 羽化）→ 首尾帧 == 原图。
- 检测：静止区平均亮度跨帧极差（应 <0.5）、相邻帧运动区平均差、录像逐帧差的尖峰（接缝跳帧会出现 >4 的孤立尖峰）。
- WCAG：`tests/flicker_smoke.mjs` 要求“减少闪光”开/关两种模式都 ≤3 次/秒。不要用删效果来过测试——用缓动曲线、峰值上限、交叉淡化。

## 6. 动作与 rig 的分工
- 小幅（呼吸、眨眼、头发、重心、转头联动）= rig v2 网格+骨骼（`tools/anim-pipeline/body.py`）。
- 大幅（抬手、伸懒腰、招手）= 关键帧+补帧序列（`tools/anim-pipeline/action.py`），序列网格仍采样身体权重，所以播放中呼吸/重心不断。
- 无缝切换：先把手臂待机摆动收为 0（0.25 s），序列淡入（首帧 == 待机），倒放回首帧后淡出。网格硬拉大动作会把袖子扯断——别再这么做。

## 7. 录像 / 截图 / 相机裁剪
- swiftshader 下 WebGL 很慢：录像不要用 Playwright `clock.install()`，改用 `window.__rigManual=1` + `SakurayoRig.step(1/30)` 逐帧推进再截图（`tools/record_mascot.mjs`）。
- 截图超时调到 180 s；用 jpeg 帧再 ffmpeg 合成 `-framerate 30 -c:v libx264 -pix_fmt yuv420p -crf 18`。
- 战斗录像的相机裁剪：先确认玩家/敌人在视口内（曾出现玩家在左上角以外时敌人不绘制的剔除 bug），竖屏/平板三种尺寸都截一遍（`tests/mascot_sizes_smoke.mjs`）。
- Read 工具会缓存同路径图片：复核新截图时先复制成新文件名再看。

## 8. 回归测试防抖
- `localStorage` 写入与 `page.reload()` 竞争：reload 后等新文档的测试 API（如 `saveSnapshot`）出现，而不是等旧元素消失。
- 固定 `waitForTimeout` 在高负载下会抖：改 `page.waitForFunction(条件)`。
- 剧情行号会随文本改动：按说话人/内容找行，不要写死下标。
- 护送 NPC 在 CPU 抢占时会被打死：测试 API `healNpc46` 兜底；时间限制留余量（4-1 = 115 s）。
- `tools/verify.sh` 跑全量；浏览器崩溃多半是内存竞争，先单独重跑该测试确认，再查其它进程占用。

## 9. 被中断后的保护
- 开工前 `git status`；有未提交改动先 `git stash push -u -m wip-<时间>` 或提交到本地 WIP 提交，再继续。
- 长任务拆小步：每步 → 单测 → 提交；全量回归通过后再 push 到 PR #32。
- 后台任务输出写到 `/tmp/sy/*.log`，末尾追加 `EXIT $?`，中断后能判断跑到哪。

## 10. 存档兼容
- 新字段只增不改；旧字段读入后忽略（例如 DP 部署字段、永久数值天赋 → 一次性退还樱币 `talRefund46`）。
- `sakurayo-save.js` 的 `sanitize` 对每个新模块调用其 `sanitize`，单测覆盖旧存档导入。

## 11. build_smoke「图鉴解锁没保存」的真实根因
- 不是游戏没写存档：5 个并发复现时，页面内 localStorage 已含 evo46，但 reload 后（甚至新开同源页面）读回的是种子存档——高负载下 Chromium 丢了渲染进程未提交的 localStorage 写入。
- 修法：测试改为调用 `rebootSave46()`，走与启动时完全相同的 `bootLoadSave()` 读档管线；种子用 localStorage 标记只写一次。
