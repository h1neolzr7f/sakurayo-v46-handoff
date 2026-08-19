# 《樱夜·尸潮》V4.6.0 交接规格

2026-08-14。给下一位 AI / 维护者。先读根目录 [README.md](../README.md)，再读本文和 [AGENTS.md](../AGENTS.md)。二游分期原文在 [PLAN_V46_ERYOU.md](PLAN_V46_ERYOU.md)。升版本见 [MAINTAIN.md](MAINTAIN.md)。

这不是另做一款原神。局外做成能横着玩的二次元手游大厅，局内继续是离线肉鸽射击。

## 1. 仓库与版本

| 项 | 值 |
|---|---|
| 源码版本 | **4.6.0**（未发版，不要擅自升 4.6.1） |
| Android `versionName` / `versionCode` | 4.6.0 / **61** |
| 公开仓 | https://github.com/h1neolzr7f/sakurayo-zombietide |
| 已发布 APK | **v4.4.6** |
| 存档键 | **`sakurayoV3`** |
| 代码基线 | `src/index.html` + `src/runtime/*.js` |
| 运行时美术 | `android-app/app/src/main/assets/game/art` |
| 生成源 PNG | `assets/image2/source/`（gitignore，约 329MB，不进本仓） |

`progress.md` 顶部 Original prompt 不得删除或改写。

## 2. 产品边界（不可破）

- 三名角色：月城小夜（步枪远程）、神代绫（手枪＋太刀）、黑羽凛音（纯太刀）。
- 14 基础职业、28 转职、融合、科技/生物/灵能三相飞升。
- 四章剧情、Boss 四阶段（75% / 50% / 25%）、主神空间。
- 触控摇杆、冲刺、主动技能必须可用。
- 继续 `sakurayoV3`。旧档缺字段自动补齐，禁止清档。
- 不依赖网络、CDN、外部字体或外部图片。
- 商店衣装与寻访卡**都不卖永久伤害**。卡只进名册。
- 不要再给 `update` 加包装层。不要改名 `startGame` / `update` / `draw` / `spawnEnemy` / `showDialogue` 却不改调用点。
- 不允许恢复「每颗子弹遍历全部敌人」的无界碰撞。敌人、子弹、Boss 弹、召唤物、伤害字、粒子都有上限。Boss 阶段不无限召唤普通怪。
- Android WebView 锁横屏（`landscape`）。大厅/寻访/战场默认就是横版，不靠窗口先变成横的才切换。竖屏只保留射击操作并提示横持。
- 最终发布仍需单文件 HTML。

## 3. 玩家闭环

```
大厅看立绘
  → 寻访抽证词卡（收藏）
  → 名册点亮 / 点开看详情
  → 商店买衣与初始核心
  → 选模式出击
  → 结算回大厅
```

作弊只保留一种：大厅立绘 10 连点 → 9999 樱花币。不另开商店卖数值。

底栏五格：寻访 / 名册 / 商店 / 关卡 / 档案。出击是大厅主按钮，不进五格。

## 4. 分期状态

| 期 | 内容 | 状态 |
|---|---|---|
| A | 寻访/名册/大厅去毛坯，像卡池而不是说明书 | 已落地 |
| B | 关卡页：回收演习 / 证词 / 主神 | 已落地 |
| 局外精装修 | 五房同一套玻璃、立绘软边无损、商店一栏钱包 | 已落地 |
| C | 局内 DP + 最多 2 干员钉地 | 已落地 |
| 横屏主体验 | `html.landscape46` 默认就在；Android 锁 `landscape` | 已落地 |
| 仿 Live2D | 随机眨眼 / 注视 / 点触，去掉卡顿滤镜 | 已落地 |
| D | 寻访卡扩到 16 以内；站桩与大厅背景重出；商店/档案换皮 | **未做** |
| E | 全量 `verify.ps1`、`release/`、APK、CHANGELOG | **未做** |

### 下一步（按优先级）

1. I2V 绿幕重出三角色站桩（需 infsh login）。现用 `battle.webp` / `live_idle` 静帧 + JS 动。
2. 有独特动作的融合再补 `anim_skill.webp` / `anim_dash.webp`。缺图回退，不要借错融合的图。
3. 寻访卡扩到 16 以内；`ui/lobby_wide.webp` 去左右黑边。
4. 全量 `powershell -File tools/verify.ps1`（`browser_smoke` 主视口仍是 430×932）。
5. `android-app/sync-game.ps1` 后发版。模拟器上的正式包可能仍是签名对不上的 **4.2.3 / versionCode 47**；debug 不能覆盖（`INSTALL_FAILED_UPDATE_INCOMPATIBLE`）。不要擅自卸包清档。用本机 HTTP 打开 `src/index.html` 验收。

### 明确不做

- 抽卡加攻击、加生命、加暴击。
- 每日任务、邮件、赛季、通行证、广告复活。
- 联网账号与排行榜。
- 换引擎，引 Vue / Phaser / 原神素材。
- 把主神空间删掉或并进寻访。
- 把竖屏重新做成主体验。

## 5. 大厅布局（必须保持）

宽于 640 走左右分栏：

- 左约 **64%**：当前角色全身立绘，**头要完整**。立绘 `height:100%`，不要再写成 138% 裁头。`object-position: center 10%`。标题「樱夜·尸潮」贴左上，角色名贴左下。
- 右约 **34%**、最宽 **360**：币/更多 → 三角色横排圆钮 → 关卡胶囊 → **出击** → 五格导航。
- 圆钮必须在操作台里，禁止漂到立绘上。
- 出击文案固定「出击」，不要「角色名 · 进入樱夜」。
- 更窄才叠成竖屏回退，并显示 `#rotateHint46`（「请横持设备」）。提示在顶栏中央，不得挡住出击。

`preferLandscape46()` 在 [`src/index.html`](../src/index.html)：

- 永远 `classList.add("landscape46")`
- `portraitFallback46` 仅当 `width < 640`
- `tallWindow46` 当高>宽且宽仍 ≥ 640
- 尝试 `screen.orientation.lock("landscape")`
- 画布跟 `visualViewport` 铺满

大厅背景：`paintHomeBg46()` 用 `ui/lobby_wide.webp`，必须跑在 `installCover36` 之后。

## 6. 三种出击模式

`runMode36` 与 `pendingMode46` 并存。关卡页 `#modeBar46` 改的是 `pendingMode46`；真正开局时再写入 `runMode36`。

| 模式 | `runMode36` | 规则 |
|---|---|---|
| 回收演习 | `story` | 现有肉鸽四章，规则不动 |
| 证词模式 | `testimony` | 复用章节/对话/场地；升级只回血，不打开 `#level`；关闭干员坞；第一章与证词都门禁融合/飞升 |
| 主神空间 | `mainGod` | 已有高难。`isMainGodRun36()` 只认 `mainGod`。证词不是主神 |

测试约定：

- `setRunMode46(mode)` 同时写 `runMode36` 和 `pendingMode46`，然后 `menuUpdate()`。
- `__SAKURAYO_TEST__.selectStage(id)` **永远**把 `runMode36` 写成 `"story"`。不要改这个行为去「修」证词测试。
- 证词对 `openLevel` 的包装在现有 `P.noUpgradeChallenge40` 包装**外面**，证词分支要先 return。
- `storyTeachChapter45()` 在 `runMode36==="testimony"` 或第一章时为真。
- `renderStages` 的大厅包装必须留在探索包装（`exploreEntry41`）**之后**，并放在 `installLobby46` 里。

## 7. 寻访与名册

实现：[`src/runtime/sakurayo-lobby.js`](../src/runtime/sakurayo-lobby.js)（`window.SakurayoLobby`）。

爆率与价格**不改**：

```
N 0.70 / R 0.22 / SR 0.07 / SSR 0.01
pitySSR 80 / pitySR 10
单抽 160 / 十连 1440
默认点亮 sayo_echo、aya_petal
```

存档只写在已有对象 `shop40.ops`：

```
pity, pitySR, pulls, tenPulls, owned, last, cheatUsed
```

禁止新 top-level save key。证词进度若以后要记，加 `shop40.ops.story` 或沿用现有剧情字段。

名册 8 格。未回收只用卡背，禁止灰图剧透。点开详情。重复只加计数，不进战斗。锁卡脚注「待寻访」，墙上仍可写「未回收」。

揭示层挂在 `#gachaDrawer`，不要挂在 `#gachaBody46`（刷新会抹掉翻牌）。`TEST_MODE` / `?test=1` 立即翻开。

`injectStyle` 会替换 `#sakurayo-lobby-css`。

## 8. 干员 DP

实现：[`src/runtime/sakurayo-ops.js`](../src/runtime/sakurayo-ops.js)（`window.SakurayoOps`）。

| 项 | 值 |
|---|---|
| 最多人数 | 2 |
| 开局 DP | 10 |
| 上限 | 20 |
| 部署花费 | 8 |
| 撤回返还 | 4 |
| 回复 | 约 0.4/s |
| 伤害 | `P.dmg * 0.32`，`source:"summon"` |
| 名单 | 另外两名角色（不是寻访卡） |
| 开火 | `pushBullet` / `aoe` |
| 启用 | `story` 与 `mainGod` |
| 关闭 | `testimony` |

单位放独立 `deployed[]` / `units`。**禁止推进 `pets`**（`syncPets` 会清空宠物数组）。钉在落点。HUD `#opsDock46`。数字键 1/2。钩子 owner `"core.ops46"`。`#hud` 是 `pointer-events:none`，坞必须自己 `pointer-events:auto`。

## 9. 仿 Live2D

实现：[`src/runtime/sakurayo-live.js`](../src/runtime/sakurayo-live.js)（`window.SakurayoLive`）。脚本在 lobby 之后、ops 之前。

- 眨眼：Cubism Mean **2.5 ± 2s**，不要 5.4s CSS `steps` 循环。
- 注视阻尼，松手回正。
- `#heroTap46` + `#heroHead46`：TapHead / TapBody 淡入淡出。
- 立绘 10 连点作弊仍走 lobby 的 `portraitTap`。
- 不要给站桩叠多层 `drop-shadow` / `blur`。不要给抽屉整屏 `backdrop-filter`。横屏菜单不要 14px 毛玻璃。
- `sakurayo-live.js` 不得覆盖大厅 dock / 角色圆钮布局。

默认皮肤用 `live_idle.webp` + `live_blink.webp`。必须是**无损静帧 WebP**，用 CSS/JS 动。不要把动画 WebP 压成 lossy / yuva420p。

管线：`tools/image2/live_pipeline.py`（现有黑底抠边，或 `--video clip.mp4 --cid sayo` 抽帧扣绿幕）。

## 10. 必须保住的选择器

```
#gachaPull1
#gachaPull10
#gachaDrawer
#rosterWall46
.rosterSlot46.lock
#shopDrawer
.shopTabs40
#shopWallet44
#opsDock46
#heroTap46
#heroHead46
#modeBar46
#rotateHint46
#start
[data-open="gacha|roster|shop|stage|archive|story"]
```

档案按钮文案仍须包含 **剧情档案**。`.shopNotice` 仍在 DOM（横屏商店只显示 `#shopWallet44` 一栏）。

## 11. 测试 API

`window.__SAKURAYO_TEST__` 是 `Object.freeze({...})` 字面量（约 `src/index.html` 6928 行附近）。新 API 必须写进这个字面量内部，freeze 之后再赋值无效。

| API | 行为 |
|---|---|
| `setRunMode46(mode)` | `story` / `testimony` / `mainGod`；同时写两个 mode 变量 |
| `selectStage(id)` | 选章并把 `runMode36` 强制为 `story` |
| `opsSnapshot46()` | 干员快照 |
| `deployOp46(id)` | 部署/切换 |
| `retreatOp46(id)` | 撤回 |
| `grantDp46(n)` | 加 DP |
| `liveSnapshot46()` | 立绘状态 |
| `liveTrigger46(kind)` | `tapHead` / `tapBody` |
| `liveLook46(x,y)` | 注视 |
| `lobby46()` | 大厅快照 |
| `pullGacha46(count)` | 抽卡 |
| `grantCheat46()` | 发币 |
| `tapPortrait46(times)` | 连点立绘 |
| `snapshot35()` | 含 `live`、`ops`、`runMode` |

`startGame` 的 v37 包装：若 `!save.tutorialDone && state==="menu"`，打开教程并 **return**。隔离冒烟必须先结束教程（`#tutorialSkip37` / `#tutorialNext37`）。

`#dialogue` 点击即 `nextDialogue`，没有 `#next` 按钮。

## 12. 脚本顺序与 ART_ROOT

`src/index.html` 中的顺序不可乱：

```
sakurayo-content-runtime.js
sakurayo-lifecycle.js
sakurayo-camera.js
sakurayo-cutscene.js
sakurayo-economy.js
sakurayo-lobby.js
sakurayo-chronicle.js
sakurayo-live.js
sakurayo-ops.js
```

```
ART_ROOT =
  /android_asset/          → game/art
  路径以 /src/index.html 结尾 → ../android-app/app/src/main/assets/game/art
  其他                     → game/art
```

实体上限按 `sqrt(W*H/(430*932))` 缩放，夹在 0.78–1.18。

## 13. 美术规则

- 游戏只读 `android-app/app/src/main/assets/game/art` 下的 WebP。
- 出图：无字、无水印。角色绿幕 `#00ff00`。
- 新图同时考虑进 `game/art`；源 PNG 在 `assets/image2/source/`（本仓未收录）。
- 规格见 [IMAGE2_ASSET_SPEC.md](IMAGE2_ASSET_SPEC.md)。
- 已入库但未发版的包括：职业/融合闪图、三角色 career/form/fusion 战斗帧、`gacha/`、`ui/lobby_wide.webp`、寻访/名册/档案导航图。
- 还缺：I2V 绿幕全身站桩、无缝大厅宽背景、部分融合的 skill/dash。

## 14. 怎么跑

开发：直接打开 `src/index.html`。

短测（改大厅/立绘/干员时先跑这些）：

```powershell
node --check src/runtime/sakurayo-lobby.js
node --check src/runtime/sakurayo-chronicle.js
node --check src/runtime/sakurayo-live.js
node --check src/runtime/sakurayo-ops.js
node tests/lobby_unit.mjs
node tests/chronicle_unit.mjs
node tests/live_unit.mjs
node tests/ops_unit.mjs
node tests/ops_smoke.mjs
```

全量：

```powershell
powershell -File tools/verify.ps1
```

`verify.ps1` 目前包含：`static_check`、各 runtime 语法、`lobby_unit`、`chronicle_unit`、`live_unit`、`ops_unit`、`ops_smoke`、`framework_smoke`、`browser_smoke`。

**没有**自动跑：

- `tests/testimony_smoke.mjs`
- `tests/gacha_visual.mjs`（会出 932×430 截图到 `tests/artifacts/gacha/`，该目录 gitignore）

改证词或寻访视觉时请单独跑这两项。`browser_smoke.mjs` 断言版本 `"4.6.0"`，主视口 430×932；竖屏回退仍须能点 `#start` / 出击 / 五格 / 商店钱包。

发版（用户明确要求再做）：

```powershell
python tools/build_game.py --source src/index.html --output ../offline/index.html --asset-root ../offline/game/art
powershell -File android-app/sync-game.ps1
```

对齐：`VERSION`、`SAKURAYO_GAME_VERSION`、`android-app/app/build.gradle` 的 `versionName`/`versionCode`、`MainActivity` UA `SakurayoAndroid/x.y.z`、`tests/browser_smoke.mjs` 的 `"version"`。

## 15. 不要提交

`.gitignore` 已排除。推仓前再确认没有这些文件：

- `android-app/keystore.properties`、`local.properties`、`*.jks`、`*.keystore`
- `*.apk`、`release/`
- `tests/artifacts/`
- `assets/image2/source/`、`processed/`、`previews/`
- `.env`、`.cursor/`

公开仓 `origin` 不要 force-push。本交接快照走 `private` remote。

## 16. UI 信息优先级

从高到低：剧情/抉择/升级/暂停/结算 → Boss 转阶段与场地警告 → 顶部系统提示 → 底部吐槽电台。模态出现时暂停并收起其他文本；退出后按队列继续，禁止文字重叠挡住操作。
