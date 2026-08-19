# 模拟器自动打回修虫提示词

新开 Cloud Agent 时，把「开工提示词」围栏全文贴进去，不要拆，不要再贴别的项目。

仓库：`h1neolzr7f/sakurayo-v46-handoff`  
基线：`origin/main` @ `0af3809`  
新分支：`cursor/emu-loop-5030`

---

## 开工提示词（复制从下一行到文末）

```text
你是《樱夜·尸潮》模拟器自动打回修虫。人只看开工和收工。中间不要等人。

查 → 自己写打回条 → 只修一类 → 补回归 → 写清上一轮为何漏 → 再让模拟器/剧本打回你。
一轮只修一类。新问题必须先写「上一轮为什么没发现」，再改。

仓库：h1neolzr7f/sakurayo-v46-handoff。
从 origin/main（必须含 0af3809）开分支 cursor/emu-loop-5030。
基线 src/index.html + src/runtime/*.js。可以改测试、docs/BUGLOOP_LOG.md、docs/SWEEP_LOG.md。

版本仍 4.6.0。存档键仍 sakurayoV3。缺字段只补齐，禁止清档。
禁止升 4.6.1。禁止交 APK / 密钥 / local.properties。禁止卸正式包。
禁止出新图、覆盖任何 gacha webp。
禁止改名 startGame / update / draw / spawnEnemy / showDialogue。不要给 update 再包一层。
禁止恢复每颗子弹扫全部敌人。Boss 不无限招普通怪。
禁止改爆率、价格、保底、Spark、融合/转职百分比。
禁止为了绿删测试或放宽断言。
禁止借修 bug 重做镜头公式、卡池货表、编年 id、大厅布局。
一类 = 同一个根因。复现不了的只记怀疑，不改。

====================
打回官是模拟器，不是人
====================

每一轮「查」必须跑完下面三层。任一层红 = 自动打回，不许跳过等人。
人不会在中间贴评论。你自己往 docs/BUGLOOP_LOG.md 写打回条，然后只修那一类。

打回条格式（必须原样用）：
  自动打回：**未过。不要进入下一类。**
  层：门A / Playwright视口 / Android模拟器
  类：<一句话根因>
  复现：<命令或点击步骤>
  上一轮为什么没发现：<缺了哪一步查法，禁止写没注意>
  回归：<这条不修会红的测试名或剧本步骤>

修完立刻把三层再跑一遍。还红就再打回自己，不要换一类。
最多 5 轮类修复。第 6 次只跑三层、只记账不改。
连续 2 轮三层全绿、无新 P0/P1：SWEEP_LOG 一行，停，等人收工。

====================
第一层：门 A（每次必跑）
====================

python3 tools/static_check.py src/index.html
node tests/lobby_unit.mjs
node tests/live_unit.mjs
node tests/ops_unit.mjs
有则跑：node tests/chronicle_unit.mjs
有则跑：node tests/camera_unit.mjs
缺 Playwright 就装：npm i -D playwright && npx playwright install chromium
然后：node tests/framework_smoke.mjs
      node tests/browser_smoke.mjs
有则跑：node tests/ops_smoke.mjs
        node tests/gacha_visual.mjs
        node tests/testimony_smoke.mjs
为绿删测试 = P0。

====================
第二层：Playwright 手机视口 = 主模拟器（每次必跑）
====================

这是自动打回的主战场。APK 无网、WebView 打开的是 file:///android_asset/index.html，没有 ?test=1。
所以脚本验收必须走浏览器：

1. 起本地静态服，打开 src/index.html?test=1&debug=1
2. 视口至少跑两种：
   - 430×932（browser_smoke 主视口，竖屏射击回退）
   - 932×430 或 2400×1080（横屏大厅/战场，Android 锁 landscape）
3. 用 window.__SAKURAYO_TEST__ 和 render_game_to_text() 跑门 C，不要只看截图：
   - 新档进主菜单；缺字段旧档也能进菜单（自己构造缺 shop40.ops 的旧档 JSON）
   - selectCharacter 小夜/绫/凛音各开一局，10 秒内 snapshot 里有人、怪、攻击
   - 触控：给画布/摇杆区域 dispatch touchstart/move/end，确认能移动、冲刺、主动技能
   - 升一级，选完战斗继续
   - Boss 75 / 50 / 25（测试 API）
   - 剧情和吐槽不同时挡操作
   - 死亡或通关结算能关，能重新开局
   - openDrawer：gacha 三页、roster（含编年三段）、shop、stage 三模式，能开关
   - 镜头：人居中；把玩家夹到世界左边，camX 必须是 0，不许负值半屏空白；spawn 从当前视口外进来
4. 每步截图落到 tests/artifacts/emu/（gitignore，不要 commit）
5. 红了就写打回条。不要说「截图看起来还行」就算过。

优先扫刚进 main 的：镜头夹边、编年点回残片变空墙、三页抽屉叠字、旧档、触控、子弹全量扫。

有 computerUse / 带界面浏览器：横屏点寻访、仓库编年、开一局走左边贴边。视觉打回同样写打回条。没有 GUI 就只靠 Playwright，不算失败。

====================
第三层：Android 模拟器（有 adb 必跑，没有就记账）
====================

先：adb devices。没有设备：在 BUGLOOP_LOG 写「本环境无 adb」，这一层跳过，第一、二层仍要绿。

有设备：
1. 不要卸包。正式包签名冲突（INSTALL_FAILED_UPDATE_INCOMPATIBLE）= 这一层停，改走第二层，禁止卸载清档。
2. 能装才装：先 sync 壳（pwsh android-app/sync-game.ps1，或 python3 tools/build_game.py --source src/index.html --output android-app/app/src/main/assets/index.html --asset-root android-app/app/src/main/assets/game/art），再 assembleDebug，adb install -r。APK 禁止 git add。
3. 冷启动：adb shell am start -n com.sakurayo.zombietide/.MainActivity
   dumpsys 确认 MainActivity 在前台。logcat 扫 FATAL / AndroidRuntime / Uncaught，本游戏进程必须 0。
4. 屏幕是横屏。adb exec-out / 设备端 screencap 再 adb pull 到 tests/artifacts/android/。不要用 PowerShell 重定向 screencap（会坏 PNG）。
5. 模拟器上 APK 没有 ?test=1，只验：能进大厅、能看见出击、点开寻访/仓库不白屏、开一局 10 秒内能看见人。细剧本仍以第二层为准。
6. 崩溃、白屏、进不了菜单 = P0 自动打回。

====================
一轮 6 步（缺一步作废）
====================

1) 三层全查。把红的写成打回条（一类一条，本轮只挑一条修）。
2) 命名这一类：一句话根因。
3) 只修这一类。同类调用点扫完。
4) 补一条会红的回归（node 测试或 browser_smoke 步骤）。
5) 反思写入 docs/BUGLOOP_LOG.md：
   - 本轮新问题
   - 上一轮为什么没发现（具体缺了哪层哪一步）
   - 变成哪条回归
   「没注意」不算。第 1 轮也要写「这一轮怎么查到的」。
6) commit + push。信息：类名、回归名、三层红绿。
   立刻开下一轮三层复查。不要等人口头「再查」。

====================
严重度
====================

P0：崩溃 / 卡死 / 清档 / 核心函数坏 / 10 秒看不见人怪攻击 / 卸了正式包
P1：升级卡死、Boss 不转阶段、结算关不掉、抽屉叠字、触控失灵、旧档进不了菜单、镜头半屏空白、编年点回空墙、子弹又全量扫、门A红、为绿删测试
P2：文案、手感、传说图 — 记 docs/BUGLOOP_P2.md，不修，不挡循环

====================
完成定义
====================

一轮：只修一类 + 新回归会红 + LOG 有为何漏 + 三层能跑的已复跑。
收工：连续 2 轮无新 P0/P1，三层能跑的全绿，SWEEP_LOG 有 emu-loop 行。
版本仍 4.6.0。git 里没有 APK、没有密钥。

回报只讲：轮次、打回条四行、三层红绿、下一轮查哪。不要等人转述。
```
