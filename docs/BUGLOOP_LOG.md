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

---

## 轮 2

自动打回：**未过。不要进入下一类。**
层：Playwright视口
类：竖屏战斗时 #rotateHint46 仍 display:block，压住顶部 HUD
复现：430×932 开局后 `getComputedStyle(#rotateHint46).display === "block"` 且高度 25、top=8
上一轮为什么没发现：`emu_loop.mjs` 用 `offsetParent !== null` 判断可见；`position:fixed` 的 offsetParent 恒为 null，提示明明显示却被记成隐藏。缺了用 computed style + 盒子高度这一步。
回归：`tests/emu_loop.mjs` 改成断言 `getComputedStyle(hint).display === "none"`（不看 offsetParent）

本轮新问题：横持提示压 HUD。
变成哪条回归：emu_loop 战斗中 hint display 必须 none。

三层：门A 绿 / Playwright视口 红（本类） / Android 无 adb。

修完复跑：门A 绿（static/lobby/live/ops/chronicle/camera/lifecycle/framework 8/browser 52/ops_smoke/gacha_visual/testimony） / emu_loop 23 绿含「战斗中无横持提示」 / Android 无 adb。

---

## 轮 3

三层能跑的全绿，无新 P0/P1。未改玩法代码。

这一轮怎么查到的：加 `tests/emu_scan.mjs`，在 430×932 / 932×430 / 2400×1080 量寻访页签与标题重叠、elementFromPoint 能否点中、编年卡片点完再回残件墙高与 8 格、子弹循环仍 `grid.near`、走到 `player.x<160` 才断言 `camX≈0`。2400 视口世界宽 9600，12 秒走不到左边，不能当成镜头半屏空白。`emu_loop` 补上寻访叠字与编年点回空墙断言。

三层：门A 绿（static/lobby/live/ops/chronicle/camera/lifecycle/framework 8/browser 52/ops_smoke/gacha_visual/testimony） / Playwright视口 绿（emu_loop 23 + emu_scan 0 P0/P1） / Android 无 adb。

---

## 轮 4

三层能跑的全绿，无新 P0/P1。未改代码。连续第 2 轮全绿，写入 `docs/SWEEP_LOG.md` 后停。

这一轮怎么查到的：复跑门 A + `emu_loop` + `emu_scan`（含 2400×1080 走到左缘、编年点回、寻访叠字、`grid.near`）。`adb devices` 仍无设备。

三层：门A 绿 / Playwright视口 绿 / Android 无 adb。

---

## 轮 5（扩大：不做竖版）

自动打回：**未过。不要进入下一类。**
层：Playwright视口
类：竖版回退（#rotateHint46 / portraitFallback46 / tallWindow46 / top:-4%）仍会进横屏和窄横屏
复现：600×400 仍挂 portraitFallback46 并显示「请横持设备」；932×430 立绘默认 top:-4% 裁头
上一轮为什么没发现：轮 1–4 只在战斗里藏 hint，没删竖版 class；也没测 w<640 的横屏。子智能体横屏审计才标出。
回归：`lobby_unit` 禁止再写提示/竖版回退；`emu_loop` 断言无 hint、无 portraitFallback、立绘 top=0、600×400 仍走横版

本轮新问题：竖版逻辑污染横版。
变成哪条回归：lobby_unit + emu_loop 窄横屏/无提示/立绘 top=0。

三层：门A 绿 / Playwright视口 红（本类） / Android 无 adb。

修完复跑：门A 绿（static/lobby/live/ops/chronicle/camera/lifecycle/framework 8/browser 52/ops_smoke/gacha_visual/testimony） / emu_loop 24 绿含「窄横屏仍走横版」 / emu_scan 0 P0/P1 / Android 无 adb。已 sync `android-app/.../assets/index.html`（未交 APK）。

---

## 轮 6（全游戏，不限横屏）

自动打回：**未过。不要进入下一类。**
层：Playwright视口
类：横屏 #opsDock46 落到左下 bottom:18px，压住默认摇杆点，短触误部署干员
复现：932×430 回收演习开局，在 (W×0.2,H×0.82) 单击，DP 减少并部署凛音
上一轮为什么没发现：emu_loop 摇杆往 #game 派 pointer、冲刺技能 force:true，绕过 elementFromPoint；证词模式坞隐藏，ops_smoke 没点默认摇杆坐标。
回归：`ops_unit` 禁止 landscape 坞 bottom:18px；`emu_loop` 断言坞与 #joy 不重叠，默认摇杆点短触不增 units

本轮新问题：干员坞吞摇杆触控。
变成哪条回归：ops_unit landscape bottom + emu_loop 摇杆点不部署。

三层：门A 待复跑 / Playwright视口 红（本类） / Android 无 adb。

修完复跑：ops_unit 绿 / emu_loop 26 绿含「摇杆点不误部署」 / ops_smoke 绿。
