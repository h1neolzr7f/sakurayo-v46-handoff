# 打包测试修虫提示词

这是**测试包 + 修 P0/P1**，不是正式发版，不是第四期加伤，不是重画传说。生图额度用完了，本项目禁止出新图。

新开 Cloud Agent 时，把下面围栏全文贴进去当唯一开工单。

仓库：`h1neolzr7f/sakurayo-v46-handoff`  
基线：`origin/main` @ `0af3809`（编年 #13 + 镜头 #14 + 换拼卡 #15 已并）。  
新分支：`cursor/pack-test-5030`。  
不要等传说封面 #16。不要从施工旧分支开工。

配合只读：[BUG_SWEEP.md](BUG_SWEEP.md)、[MAINTAIN.md](MAINTAIN.md)、[HANDOFF.md](HANDOFF.md)。

---

## 开工提示词（复制从下一行到文末围栏）

```text
你是《樱夜·尸潮》打包测试修虫专用施工。只做：把门 A/C 跑绿、修新并进来的 P0/P1、把现网源码打成可测包。做完停，等人收工。

仓库：h1neolzr7f/sakurayo-v46-handoff。
从 origin/main（必须含 0af3809：编年+镜头+18张拼卡已进 main）开分支 cursor/pack-test-5030。
基线 src/index.html + src/runtime/*.js。可以改测试、docs/CHANGELOG_下一版本.md、docs/SWEEP_LOG.md、android-app 同步产物。

版本仍 4.6.0。存档键仍 sakurayoV3。缺字段只补齐，禁止清档。
禁止升 4.6.1。禁止打 tag。禁止交密钥 / local.properties / 正式签名包。
禁止把 APK 推进 git。release/ 在 .gitignore 里，单文件 HTML 只作本地/产物，不要强行 git add 被忽略的包。
禁止卸签名冲突的正式包（会清档）。INSTALL_FAILED_UPDATE_INCOMPATIBLE 就改走 HTTP 打开 src/index.html，不要卸包。
禁止改名 startGame / update / draw / spawnEnemy / showDialogue。不要给 update 再包一层。
禁止恢复每颗子弹扫全部敌人。实体上限照旧。Boss 阶段不无限召唤。
不引 CDN / Phaser / Pixi。不改爆率、价格、保底、Spark、融合/转职百分比。

====================
这不是什么
====================

不是正式上架。公开仓 sakurayo-zombietide 的 v4.4.6 正式包不要动。
不是第四期加伤。不是飞升进池。不是 I2V 站桩。
不是重画传说 6 张，也不是再换 18 张。生图额度用完了：禁止 GenerateImage / 新 webp / 覆盖任何 gacha 图。
#16 传说封面未并：当它不存在。不要 cherry-pick，不要等认人。
不要开新 applicationId、不要做「夜樱」侧载马甲包（那是另一条线）。

现网已经有、必须保住：
- 残片 74（8+14+28+24）、时装 12、武器 12、三页寻访/仓库
- 编年一个页签三段：小夜 5 + 绫 4 + 凛音 4
- 局内 4×2 镜头，夹边，怪从当前视口外刷
- 三角色、四章、Boss 75/50/25、摇杆冲刺技能

====================
抄死：测试包怎么打
====================

1) 门 A（Linux 也可逐条跑，不必死等 PowerShell）：
   python3 tools/static_check.py src/index.html
   node --check tests/artifacts/static/index.extracted.js
   node --check 每个 src/runtime/sakurayo-*.js
   node tests/lobby_unit.mjs
   node tests/live_unit.mjs
   node tests/ops_unit.mjs
   node tests/chronicle_unit.mjs   （有则跑）
   node tests/camera_unit.mjs      （有则跑）
   有 Playwright 再跑 framework_smoke / browser_smoke
   有 pwsh 再跑 tools/verify.ps1
   为了绿而删测试或放宽版本断言 = P0。

2) 同步 Android 壳（大厅壳还是旧的，这是本项目必须做的）：
   pwsh -File android-app/sync-game.ps1
   没有 pwsh：用 python3 tools/build_game.py --source src/index.html --output android-app/app/src/main/assets/index.html --asset-root android-app/app/src/main/assets/game/art
   然后按 sync-game.ps1 后半段校验美术清单。同步后的 assets/index.html 可以进 git（这是壳，不是 APK）。

3) 单文件 HTML（给人浏览器测）：
   python3 tools/build_game.py --source src/index.html --output /tmp/sakurayo-460-test.html --asset-root android-app/app/src/main/assets/game/art
   记下 SHA-256。不要把 APK/HTML 大包 commit 进仓库。PR 里写产物路径和哈希。

4) debug APK（能打再打，打不了就写原因停这一步）：
   android-app/build-debug.ps1 或 gradlew assembleDebug
   输出留在 app/build/outputs/apk/debug/，禁止 git add。
   安装只用 adb install -r。applicationId 仍是 com.sakurayo.zombietide。
   签名对不上正式包就不要装、不要卸。

5) 门 C 剧本（?test=1 或 HTTP 打开 src/index.html，主视口 430×932）：
   新档进主菜单；缺字段旧档也能进菜单
   小夜 / 绫 / 凛音各开一局，10 秒内看见人、怪、攻击
   摇杆、冲刺、主动技能
   升一级，选完战斗继续
   Boss 75 / 50 / 25（可用测试 API）
   剧情和吐槽不同时挡操作
   死亡或通关结算能关，能重新开局
   寻访三页、仓库（含编年三段）、商店、关卡三模式能开关
   镜头：人居中；走到世界左边镜头夹住，不许半屏空白；怪从视口外进画面

====================
抄死：只修这些类（门 B，最多 5 轮）
====================

只修能复现的 P0/P1。一类一个根因，修完补一条会红的回归。第二轮起必须写「上一轮为什么漏」并变成测试或剧本步骤。
复现不了的只记怀疑，不改。

优先扫这几类（都是刚并进 main 的）：
- 镜头：follow/snap 没夹边、怪刷在世界尽头、HUD 被 translate 拖走、10 秒看不见战斗
- 编年：点回残片页变成空墙、小夜五条被冲掉、顶栏被改成「三角色」
- 寻访/仓库：抽屉叠字、三页切不过、旧档进不了菜单
- 存档：新字段没补齐、清档、新顶层 key
- 核心循环：升级卡死、Boss 不转阶段、结算关不掉、update 又被包一层
- 触控：摇杆/冲刺/技能失灵
- 性能：子弹又全量扫敌人、Boss 无限招普通怪

P2（文案、手感、传说图不够买、I2V）只记 docs/PACKTEST_P2.md，不挡收工。

====================
本项目只做这几刀（按序，每刀 commit）
====================

刀 0  摸底。写下 docs/PACKTEST_GATE0.md：main SHA、版本仍 4.6.0、门 A 现状红绿、Android 壳 assets/index.html 是否旧于 src、有没有 SDK 能打 APK。不改玩法。

刀 1  把门 A 能跑的跑绿。只修测试红出来的真 P0/P1。

刀 2  同步 Android 壳（sync-game 或等价 python）。确认壳里能搜到 SakurayoCamera / SakurayoChronicle / 三页寻访。

刀 3  打单文件 HTML 产物（gitignore 外的路径）。能打 debug APK 就打，产物不进 git。

刀 4  门 B 最多 5 轮 + 门 C 剧本。连续两轮无新 P0/P1 再往下。

刀 5  更新 docs/CHANGELOG_下一版本.md（写清测试包含镜头/编年/74 残片，版本仍 4.6.0）。SWEEP_LOG 追加打包行。开 PR。停。等人收工。

不要开刀 6。不要升 4.6.1。不要推公开仓。不要出新图。

====================
完成定义（少一条不能说打包收工）
====================

1. 门 A 能跑的全绿；有 Playwright 则 framework/browser 也绿
2. Android 壳已同步，不再是旧大厅
3. 单文件 HTML 产物有路径和 SHA-256（PR 正文写明）
4. 门 C 剧本全绿，或用测试 API 跑完等价步骤并记账
5. 新档和缺字段旧档都能进主菜单
6. 三角色 10 秒内能看见人、怪、攻击；镜头夹边
7. 核心函数没改名，update 没有新包装层
8. 版本仍 4.6.0，存档键仍 sakurayoV3
9. git 里没有 APK、没有密钥、没有 local.properties
10. SWEEP_LOG 有本项目行

P0：崩溃/清档/核心函数坏/10 秒看不见战斗/卸了正式包。
P1：门 A 红、壳没同步、镜头半屏空白、编年点回空墙、子弹又全量扫、为绿删测试。
传说图没重画不是 P1。正式 4.6.1 没升不是 P1。公开仓没推不是 P1。

人只露脸两次：开工 / 收工（附门 A 红绿、产物路径和哈希、修了哪几类）。
回报只讲：当前刀、门 A/C 红绿、修了哪类、产物在哪、下一刀。
```
