# 模拟器自动打回日志

版本仍 4.6.0。存档键仍 `sakurayoV3`。分支 `cursor/emu-loop-5030` ← `origin/main` `@ 0af3809`。

第三层：本环境无 adb，跳过。第一、二层必须绿。

---

## 轮 1

自动打回：**未过。不要进入下一类。**
层：Playwright视口
类：4×2 镜头把同一张 battle_bg 按 visibleChunks 每格 drawCover 一次，一帧最多 6 张拼缝
复现：`node tests/emu_loop.mjs`（HTTP `src/index.html?test=1`，430×932 走到世界左边后统计 `drawImage` 里 battle_bg 次数，实际 6）
上一轮为什么没发现：这一轮怎么查到的——门 A 的 `browser_smoke` 只断言 `camX` 居中/夹边数字，没有统计每帧战场图 `drawImage` 次数，也没有在 430×932 走到左缘后采「一帧几张图」。pack-test 实测看到拼缝但那条修复还在另一分支，没有并进 main。
回归：`tests/lifecycle_unit.mjs`（铺图次数必须是 1）；`tests/emu_loop.mjs` 的 `p430 镜头夹边且战场图不按格重铺`

本轮新问题：战场图按格重铺。
变成哪条回归：lifecycle_unit + emu_loop battle_bg 计数。

三层：门A 绿 / Playwright视口 红（本类） / Android 无 adb。

修完复跑：门A 绿（static/lobby/live/ops/chronicle/camera/lifecycle/framework 8/browser 52） / emu_loop 23 绿 / Android 无 adb。
