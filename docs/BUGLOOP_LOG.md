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

---

## 轮 7

自动打回：**未过。不要进入下一类。**
层：Playwright视口
类：hideTransient 不收 #warning，升级/剧情模态时 Boss 警告仍叠在卡上
复现：spawnBossNow 后 triggerUpgrade，#level 与 #warning 同时可见
上一轮为什么没发现：emu_loop 升级项只断言 dialogue/banter hidden，没断言 #warning；子智能体全游戏扫才点到 hideTransient 漏 warning。
回归：`emu_loop` 升级模态时 #warning 必须 hidden；hideTransient 收 warning

本轮新问题：模态层与场地警告叠字。
变成哪条回归：emu_loop 升级时 warning hidden。

修完复跑：emu_loop 26 绿（升级/Boss 降临后再升级均断言 warning hidden）。

---

## 轮 8

自动打回：**未过。不要进入下一类。**
层：Playwright视口
类：寻访 .wishPity46 bottom:118px 与 .wishDock46 在矮横屏叠字
复现：932×430 开寻访，保底条与底部抽卡坞重叠数千 px²
上一轮为什么没发现：emu_loop 只量页签互叠和标题叠页签，没量 pity vs dock。
回归：`emu_loop` 寻访保底条叠抽卡坞 area≤8

本轮新问题：寻访保底条压抽卡按钮。
变成哪条回归：emu_loop pityDock。

修完复跑：emu_loop 26 绿（pityDock≤8）。

---

## 轮 9

自动打回：**未过。不要进入下一类。**
层：Playwright视口
类：开局 toast(hint44) 与 #mission 同一句场地提示叠两层
复现：回收演习开局数秒，toast 与 mission 都是「鸟居挡弹不挡人…」
上一轮为什么没发现：全游戏扫已标重复 hint，但当时只修坞/warning/pity，没点开局 toast。
回归：`emu_loop` 开局 toast 不得复述 mission 首行

本轮新问题：场地提示双显。
变成哪条回归：emu_loop 开局 toast≠mission。

修完复跑：去掉 startGame toast(hint44)。

---

## 轮 10

自动打回：**未过。不要进入下一类。**
层：Playwright视口
类：剧情态 opsPaint 仍显示干员坞，挡住开场对话
复现：start 后 #dialogue 未关时 #opsDock46 仍在
上一轮为什么没发现：只测了 play 态坞与摇杆，没在 dismissDialogue 前看坞。
回归：`emu_loop` 剧情模态时坞 hidden

---

## 轮 11

自动打回：**未过。不要进入下一类。**
层：Playwright视口
类：#bossRule39 top:96/112 与 #mission 同带叠字
复现：Boss 战后规则条与构筑条重叠约 900px²
上一轮为什么没发现：emu_loop 只断言 phase 数字，不量 bossRule 盒子。
回归：`emu_loop` bossRule∩mission ≤8

---

## 轮 12（全游戏，不限横屏）

自动打回：**未过。不要进入下一类。**
层：Playwright视口
类：finish() 写 #rsub/#rstats 时 `ASC.find(a=>a.id===P.form).n` 无 `?.`，脏飞升 ID 抛错，state 已是 result 但 #result 未打开
复现：回收演习开局后 `seedProgression45({form:'corrupt_form_id'})` 再 `finish(true)`，mode=result 且 result/menu 都 hidden
上一轮为什么没发现：轮 9–11 只量 toast/坞/bossRule 叠盒；emu_loop 用 killPlayer 走正常死亡，从不注入非法 P.form。暂停页 2824 已有 `?.`，结算两处漏了。
回归：`emu_loop` 脏飞升 ID 仍弹出 #result 且能回大厅

本轮新问题：结算软锁。
变成哪条回归：emu_loop 无效飞升仍弹出结算。

修完复跑：门A 绿（static/lobby/live/ops/chronicle/camera/lifecycle/framework 8/browser 52/ops_smoke） / emu_loop 27 绿含「无效飞升仍弹出结算」 / emu_scan 0 P0/P1 / Android 无 adb。

---

## 轮 13（全游戏，不限横屏）

自动打回：**未过。不要进入下一类。**
层：Playwright视口
类：play 态 #toast 仍用 translate(-50%,-50%) 锚在 118/96，与 top:91 的 #mission 同带叠字
复现：430×932 证词模式 triggerUpgrade，toast「证词模式 · Lv.2…」∩ mission ≈ 4200px²
上一轮为什么没发现：轮 9 只删了开局同文案 toast，没量其它 play 态 toast 盒子；emu_loop 升级项走普通关会开 #level（hideTransient 收 toast），证词/孤证不弹卡却仍 toast。
回归：`emu_loop` 证词升级 toast∩mission ≤8

本轮新问题：系统提示压构筑条。
变成哪条回归：emu_loop 证词 toast 不压 mission。

修完复跑：static 绿 / emu_loop 28 绿含「证词升级 toast 不压 mission」。

---

## 轮 14（全游戏，不限横屏）

自动打回：**未过。不要进入下一类。**
层：Playwright视口
类：#modeBar46 只改 pendingMode46，#start→startGame 不写入 runMode36；关卡页点证词/主神胶囊后直接出击仍走 story
复现：关卡抽屉点「证词模式」→关抽屉→出击→triggerUpgrade 弹出 #level；主神胶囊同路径进普通四章
上一轮为什么没发现：emu_loop / browser_smoke 的证词都走 setRunMode46（同时写两个变量），从不点胶囊再点大厅出击。HANDOFF §6 写了「真正开局时再写入」但代码没做。
回归：`emu_loop` 点证词胶囊出击不弹升级卡；主神胶囊未点进入轮回时留在大厅并打开关卡页。`lobby_unit` 断言 startGame 同步 pendingMode46

本轮新问题：出击模式胶囊无效。
变成哪条回归：emu_loop 关卡胶囊出击写入正确模式。

修完复跑：lobby_unit 绿 / emu_loop 29 绿含「关卡胶囊出击写入正确模式」。

---

## 轮 15（全游戏，不限横屏）

自动打回：**未过。不要进入下一类。**
层：Playwright视口
类：transientBlocked 含 menu，大厅 toast 只入队不播放；startGame 不清 toastQueue，局内下一次 toast 先弹出「出击角色：…」
复现：大厅换绫，#toast 无 show；出击后 triggerUpgrade 选卡，战斗中冒出「出击角色：神代绫」
上一轮为什么没发现：轮 13–14 只量战斗态 toast 与 mission/模式胶囊；emu_loop 从不在大厅断言 #toast.show，换角/寻访只看抽屉开关。
回归：`emu_loop` 大厅换角 toast 可见，开局后不得再冒出击角色。`lobby_unit` 禁止 transientBlocked 含 menu

本轮新问题：大厅提示被吞、漏进战斗。
变成哪条回归：emu_loop 大厅 toast 可见且不漏进战斗。

修完复跑：static 绿 / lobby_unit 绿 / emu_loop 31 绿含大厅 toast 两条。

---

## 轮 16（全游戏，不限横屏）

自动打回：**未过。不要进入下一类。**
层：Playwright视口
类：pendingMode46=mainGod 时点普通章节仍把 runMode36 写成 story，出击只能反复打开关卡抽屉
复现：关卡页点主神胶囊再点第一章「选择关卡」，抽屉关掉且 toast「已选择」；再出击又被拦回抽屉
上一轮为什么没发现：轮 14 只测了胶囊→出击，没在主神胶囊高亮时再点章节按钮。bindStageModes46 的章节 onclick 只有证词/story 两路。
回归：`emu_loop` 主神胶囊下点章节不关抽屉、不写「已选择」

本轮新问题：主神胶囊被章节按钮打回 story。
变成哪条回归：emu_loop 主神胶囊下点章节不改回 story。

修完复跑：emu_loop 32 绿 / browser_smoke 52 / ops_smoke 绿。

---

## 轮 17（五房全查：寻访 / 名册 / 商店 / 主神 / 结算）

自动打回：**未过。不要进入下一类。**
层：Playwright视口
类：finish() 融合名 `P.fusion?fusionData()?.n:"未融合"`，脏 fusion id 把字面 `undefined` 写进 #rsub/#rstats
复现：`seedProgression45({fusion:'invalid_fusion_xyz'})` 再 `finish(true)`，结算可见但文案「融合：undefined」
上一轮为什么没发现：轮 12 只补了 ASC.find 飞升 `?.`，融合支路仍用 truthy P.fusion 直接取 `.n`；五房扫结算才注入非法 fusion。寻访/名册/商店/主神本轮实测无新 P0/P1。
回归：`emu_loop` 无效融合结算不得出现 undefined；并加寻访 0 币、名册六页、商店四页、主神开局+结算探针

本轮新问题：结算融合脏 ID 写 undefined。
变成哪条回归：emu_loop 无效融合结算不写 undefined + 五房探针。

修完复跑：static 绿 / emu_loop 37 绿含五房探针与无效融合文案 / 寻访名册商店主神本轮无新 P0/P1。
