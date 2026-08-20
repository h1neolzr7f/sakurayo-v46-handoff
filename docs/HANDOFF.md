# 《樱夜·尸潮》V4.6.8 交接规格

2026-08-20。给下一位 AI / 维护者。先读根目录 [README.md](../README.md)，再读本文和 [AGENTS.md](../AGENTS.md)。二游分期原文在 [PLAN_V46_ERYOU.md](PLAN_V46_ERYOU.md)。升版本见 [MAINTAIN.md](MAINTAIN.md)。

这不是另做一款原神。局外做成能横着玩的二次元手游大厅，局内继续是离线肉鸽射击。

## 1. 仓库与版本

| 项 | 值 |
|---|---|
| 源码版本 | **4.6.8** |
| Android `versionName` / `versionCode` | 4.6.8-test / **69** |
| 测试包名 / 桌面名 | `com.sakurayo.zombietide.test` / **测试版樱夜**（不覆盖正式包） |
| 公开仓 | https://github.com/h1neolzr7f/sakurayo-zombietide |
| 已发布 APK | 公开仓仍 **v4.4.6**；本仓测试包以 Releases 最新 `v4.6.8` 为准 |
| 存档键 | **`sakurayoV3`** |
| 代码基线 | `src/index.html` + `src/runtime/*.js` |
| 运行时美术 | `android-app/app/src/main/assets/game/art` |
| 生成源 PNG | `assets/image2/source/`（gitignore，约 329MB，不进本仓） |

`progress.md` 顶部 Original prompt 不得删除或改写。

## 2. 产品边界（不可破）

- 三名角色：月城小夜（步枪远程）、神代绫（手枪＋太刀）、黑羽凛音（纯太刀）。
- 14 基础职业、28 转职、融合、科技/生物/灵能三相飞升。
- 四章剧情、Boss 四阶段（75% / 50% / 25%）、主神空间。局内对白先对人话、对准情绪（放不下的人 / 被写成办完 / 接过位置却填不上名字），设定和仓库卡后置。终章先落地人的损失，再打出写定的最坏结局；八步线索都做对且通关前三章后，才进更强隐藏关，打完才给完美结局。档案回顾用人话标八步，只写做没做，不剧透隐藏结局。证词记忆与演习记忆分开。专有词由主角问、电台答，不要开场论文，也不要谜语。选项描述不剧透隐藏结局。选项 flag 与未归卡四段、小夜编年五条不要改正文。凛「先问她想不想活」和失败电台「晚安，小夜 / 绫 / 凛音」不要改。
- 触控摇杆、冲刺、主动技能必须可用。
- 继续 `sakurayoV3`。旧档缺字段自动补齐，禁止清档。
- 不依赖网络、CDN、外部字体或外部图片。
- 商店衣装只改外观和职业倾向，不直接卖永久伤害。寻访卡与结算构筑卡**按星级加伤害**（同卡并星，最高五星）。
- 不要再给 `update` 加包装层。不要改名 `startGame` / `update` / `draw` / `spawnEnemy` / `showDialogue` 却不改调用点。
- 不允许恢复「每颗子弹遍历全部敌人」的无界碰撞。敌人、子弹、Boss 弹、召唤物、伤害字、粒子都有上限。Boss 阶段不无限召唤普通怪。
- Android WebView 锁横屏（`landscape`）。大厅/寻访/战场默认就是横版，不靠窗口先变成横的才切换。竖屏只保留射击操作并提示横持。
- Android 11 WebView（Chrome 83）不认 `inset`。全屏层必须同时写 `top/right/bottom/left`。只写 `inset:0` 时 `#hud` 会收成 0×0，摇杆/冲刺/技能飞出屏幕。`.menu` 同样：不补四边时操作台缩到左上，压在立绘上。横屏大厅还要写 `left:auto;right:0`。
- 横屏 360 高时电台 `bottom` 必须 ≥ 158px，且宽度避开左侧干员坞和右侧冲刺/技能。`@media(max-height:700px)` 不得把 `bottom` 降到 118px，否则压住摇杆。
- `backMenu()` / Android 返回必须先 `hideExplorationLayer41()`。探索层 z=90，漏关会挡住整个大厅。`enterHiddenArena47()` 必须藏 `#menu`。
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

内测后门、`?beta`、立绘 10 连点全部关闭。内测奖励只走大厅邮箱领取，不另开商店卖数值。

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
| E | 全量 `verify.ps1`、`release/`、APK、CHANGELOG | **本轮交付 4.6.4 / versionCode 65 / 测试包** |

### 下一步（按优先级）

1. 画面必须先跑 `node tests/real_shots.mjs` 看完整 DOM 真图，再改。不要用 canvas 拼图或无窗口 `adb screencap` 当过关。
2. I2V 绿幕重出三角色站桩（需 infsh login）。现用 `battle.webp` / `live_idle` 静帧 + JS 动。
3. 有独特动作的融合再补 `anim_skill.webp` / `anim_dash.webp`。缺图回退，不要借错融合的图。
4. 寻访卡扩到 16 以内；`ui/lobby_wide.webp` 去左右黑边。
5. 全量 `powershell -File tools/verify.ps1`（`browser_smoke` 主视口仍是 430×932）。
6. `android-app/sync-game.ps1` 后发版。本云主机是 KVM 套娃，API 34 Google APIs 开加速会内核崩溃；软件模拟用 Android 30 AOSP ATD 更稳。Debug 测试包 applicationId 是 `com.sakurayo.zombietide.test`，桌面名「测试版樱夜」，和正式包并排安装，不会覆盖。不要擅自卸正式包清档。

### 明确不做

- 商店衣装加攻击、加生命、加暴击。寻访/构筑卡按星级加伤是正规则。
- 每日任务、赛季、通行证、广告复活。邮箱只发内测致谢，不做运营活动。
- 联网账号与排行榜。
- 换引擎，引 Vue / Phaser / 原神素材。
- 把主神空间删掉或并进寻访。
- 把竖屏重新做成主体验。
- 不要再把大厅收成「立绘 + 一条右栏工具条」。4.6.0–4.6.6 按旧规格砍过经验条、登录台词、左栏、多货币、证词/主神卡，用户已经否决。
- `PLAN_V46_ERYOU.md` 旧 §4.1「右 34% 关卡胶囊 + 出击」已作废。大厅完成态只认本节和下面 §5。

用户已经签字、未经点名不要拆：

| 画面 | 从哪一版起算做好 | 禁止回退 |
|---|---|---|
| 大厅二游密度 | 4.6.7 | 再收成右栏工具条；改回「仓库」/光「出击」；左上当主标题写「测试版樱夜」 |
| 立绘 + `lobby_wide` | 4.6.5 | 用 `cover_v36_main_god` 盖回去 |
| 对话高清半身 + 底栏台词 | 4.6.5 / 4.6.6 | `center 26%/cover`、`:after` 暗角、表情包脸 |
| 怪物按镜头裁剪、密度 | 4.6.6 | `e.x > W` 裁世界坐标 |
| 升级/暂停半屏、抽屉左右滑 | 4.6.5 / 4.6.6 | 铺满屏、竖滑。升级横屏改为右栏单手点，不要再摆回正中大卡 |
| 局内塔防坞退役 | 4.6.5 | 恢复部署坞 |
| 邮箱领内测补给、后门关 | 4.6.3+ | 立绘连点 / `?beta` |
| 测试包不覆盖正式包 | 4.6.4+ | debug `applicationId` 改回 `com.sakurayo.zombietide` |

## 5. 大厅布局（必须保持）

**4.6.7 起大厅是商业二游首页，不是极简操作台。** 用户对照过两张图，高密度那张才算过关。不要为了「不挡立绘」再拆控件。

宽于 640 走左右分栏，信息可以叠在立绘外侧，但不能把人挡死：

- 左：全身立绘 + `lobby_wide` 夜神社。头要完整。`height:100%`，`object-position: center 10%`。不要再写成 138% 裁头。
- 左上角色状态：名字、Lv、经验条、当日台词。有未读邮件时台词提醒先领补给。
- 左侧竖栏必须在：任务 / 成就 / 邮件 / 公告 / 设置。
- 顶中：三角色圆头切换。
- 右侧：四货币（主神点 / 碎镜片 / 樱花币 / **寻访票**）+ 背包 / 菜单 / 更多；关卡大卡要有风味文、推荐等级、进度；证词模式卡、主神空间卡；出击上方 14 格职业纹章；**出击 START >>>**；底栏五格 **寻访 / 名册 / 商店 / 关卡 / 档案**。
- 四货币的 `+` 打开樱花兑换所：🌸20→💠1、🌸40→💎1、🌸160→🎫1。🎫 是真账户寻访票，不是保底倒计时。
- 大厅点立绘一次捡 🌸1，飘 `+1`，随机捡钱台词，计入 `shop40.ops.picks`。成就「石阶拾樱 / 神社守财」。这和十连点后门不是一回事，`portraitTap()` 仍 `granted:false`。
- 出击不要改成「角色名 · 进入樱夜」。也不要再改回光秃秃的「出击」。
- 底栏不要再改回「仓库」。抽屉功能可以仍叫镜界仓库。
- **不做竖版。** 不要 `#rotateHint46`、不要 `portraitFallback46` / `tallWindow46`。
- 用户已经签字的画面（大厅密度、对话半身、怪物可见、升级半屏、塔防坞退役、邮箱领补给）未经点名不要拆。

`preferLandscape46()` 在 [`src/index.html`](../src/index.html)：

- 永远 `classList.add("landscape46")`，并去掉竖版 class 与横持提示节点
- 尝试 `screen.orientation.lock("landscape")`
- 画布跟 `visualViewport` 铺满

大厅背景：`paintHomeBg46()` 用 `ui/lobby_wide.webp`。`installCover36` 只写标题，不再盖回 `cover_v36_main_god.webp`。局内 DP 坞已退役，不画、不部署。

## 6. 三种出击模式

`runMode36` 与 `pendingMode46` 并存。关卡页 `#modeBar46` 改的是 `pendingMode46`；真正开局时再写入 `runMode36`。

| 模式 | `runMode36` | 规则 |
|---|---|---|
| 回收演习 | `story` | 现有肉鸽四章，规则不动 |
| 证词模式 | `testimony` | 复用章节/对话/场地；升级只回血，不打开 `#level`；关闭干员坞；第一章与证词都门禁融合/飞升。结算只记证词战绩和樱花币，不写 `save.done` / `unlock` / `story` / `endings`，不发构筑卡，不触发孤证者。跨章回声读 `ops.story` |
| 主神空间 | `mainGod` | 已有高难。`isMainGodRun36()` 只认 `mainGod`。证词不是主神 |

测试约定：

- `setRunMode46(mode)` 同时写 `runMode36` 和 `pendingMode46`，然后 `menuUpdate()`。
- `__SAKURAYO_TEST__.selectStage(id)` **永远**把 `runMode36` 写成 `"story"`。不要改这个行为去「修」证词测试。
- 证词对 `openLevel` 的包装在现有 `P.noUpgradeChallenge40` 包装**外面**，证词分支要先 return。
- `storyTeachChapter45()` 在 `runMode36==="testimony"` 或第一章时为真。
- `renderStages` 的大厅包装必须留在探索包装（`exploreEntry41`）**之后**，并放在 `installLobby46` 里。

## 7. 寻访与名册

实现：[`src/runtime/sakurayo-lobby.js`](../src/runtime/sakurayo-lobby.js)（`window.SakurayoLobby`）。

局终 `grantBuildCard`：融合 > 转职分支 > 成型基础校 > 角色残件。同卡 `owned` 计数即星级，1–5 星按星乘算卡上伤害。失败电台 `playGoodnight46`。

爆率与价格**不改**：

```
N 0.70 / R 0.22 / SR 0.07 / SSR 0.01
pitySSR 80 / pitySR 10
单抽 160 / 十连 1440
默认点亮 sayo_echo、aya_petal
```

存档只写在已有对象 `shop40.ops`：

```
pity, pitySR, pulls, tenPulls, owned, last, cheatUsed, shards, tickets, picks
```

寻访先扣票再扣币。纯票也能抽。`tickets` / `picks` 不是新的 top-level key。

除 `mail46`（内测致谢邮箱）外，不要再加新的 top-level save key。证词进度写在 `shop40.ops.story`（`{sayo,aya,rion}`）。隐藏门闩只读 `storyChoices38`（回收演习）。`normalizeOps` 必须保留 `ops.story`，否则大厅一刷新证词记忆就没了。旧档缺字段当空，不要清档。

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
- 立绘连点和 `?beta` / `__SAKURAYO_BETA__` 已封。`grantCheat()` / `portraitTap()` 继续 `granted:false` / `blocked:1`，十连点不加 🌸9999。大厅点立绘捡 🌸1 走 `pickPortraitCoin47()`，不要把两套混回去。
- 内测 🌸9999 走 `save.mail46` 邮箱信 `beta-thanks-463`。已用过旧后门的存档只收致谢信，不再补发。
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
| `tapPortrait46(times)` | 只走旧 `portraitTap`，不加币，`granted:false` |
| `pickPortrait47()` | 大厅点立绘捡 🌸1 |
| `openExchange47()` / `exchange47(kind,n)` | 打开兑换所 / 兑碎镜片、主神点、寻访票 |
| `wallet47()` | 四货币 + `picks` |
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
- 已入库且必须继续接线：职业/融合闪图、三角色 career/form/fusion 战斗帧、`gacha/` 98 张卡面、`ui/lobby_wide.webp`、底栏 `ui/nav/*.webp`、大厅左栏/启动页 `ui/nav` + `ui/loading_art.webp` + `ui/menu_emblem.webp`、桌面图标 `ui/app_icon.webp`（已进 mipmap）。
- 大厅出击上方用 14 张 `classes/*/icon.webp`。兑换所再展 14 职业 + 28 转职 + 24 融合 + 8 残件 + 12 时装 + 12 武器 + 四章 CG + 三相飞升，不要为了用满 1284 张把大厅铺满。
- 不要把左栏/启动页再改回「任/就/邮」或单独一个「樱」字。底栏已经在用生成图标，不要改回字母。
- 编年五条是正文，不进卡池，本来就没有封面图。
- 寻访卡池仍是残件/时装/武器；14+28+24 职业卡在名册里，扩池到 16 另做，不要当漏接。
- 还缺：I2V 绿幕全身站桩、无缝大厅宽背景、部分融合的 skill/dash、独立货币图标（四货币暂时用 emoji，不要拿寻访图标冒充樱花币）。

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

改证词或寻访视觉时请单独跑这两项。`browser_smoke.mjs` 断言版本 `"4.6.8"`，主视口 430×932；竖屏回退仍须能点 `#start` / 出击 / 五格 / 商店钱包。画面必须用 `node tests/real_shots.mjs` 拿横屏完整 DOM 真图，禁止再用 canvas 拼图或全黑 screencap 当过关。

模拟器 ATD 的 `adb screencap` 是全黑。要从正在跑的测试包截图：

```
adb forward tcp:9222 localabstract:webview_devtools_remote_$(adb shell pidof com.sakurayo.zombietide.test)
python3 tests/emu_webview_shots.py
```

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
