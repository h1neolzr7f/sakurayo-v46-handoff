# 樱夜·尸潮 — 接手说明

这是 **v4.6.0 私有开发快照**，给下一位 AI / 维护者继续做横屏二游大厅和局内干员。公开玩家仓是另一个地址：

https://github.com/h1neolzr7f/sakurayo-zombietide

已发布 APK 仍是 **v4.4.6**。本仓源码已到 4.6.0，**未发版、不要擅自升到 4.6.1**。

完整需求、分期、选择器和陷阱见 **[docs/HANDOFF.md](docs/HANDOFF.md)**。硬约束见 **[AGENTS.md](AGENTS.md)**。一页清单见 **[README_FIRST.md](README_FIRST.md)**。

## 3 分钟上手

1. 读 `docs/HANDOFF.md`、`AGENTS.md`、`docs/PLAN_V46_ERYOU.md`。
2. 用浏览器打开 `src/index.html`（美术在 `android-app/app/src/main/assets/game/art`）。
3. 先跑短测，不要一上来就跑完整 `browser_smoke`：

```powershell
node --check src/runtime/sakurayo-lobby.js
node --check src/runtime/sakurayo-live.js
node --check src/runtime/sakurayo-ops.js
node tests/lobby_unit.mjs
node tests/live_unit.mjs
node tests/ops_unit.mjs
node tests/ops_smoke.mjs
```

全量验证：`powershell -File tools/verify.ps1`（含较长的 `browser_smoke`，主视口仍是 **430×932**）。

存档键必须是 **`sakurayoV3`**。不要清 `localStorage`。

## 产品是什么

离线二次元肉鸽射击。局外做成能横着玩的二游大厅，局内仍是摇杆射击。不换引擎，不引 Vue/Phaser，最终仍出单文件 HTML。

| 角色 | 武器 |
|---|---|
| 月城小夜 `sayo` | 步枪远程 |
| 神代绫 `aya` | 手枪＋太刀 |
| 黑羽凛音 `rion` | 纯太刀 |

必须保住：14 基础职业、28 转职、融合、科技/生物/灵能三相飞升、四章、Boss 四阶段、主神空间、触控摇杆/冲刺/技能。

## 已完成（A / B / C，版本仍 4.6.0）

- **横屏主体验**：Android 锁 `landscape`。`preferLandscape46()` 默认加 `html.landscape46`。窗口宽 `< 640` 才竖屏回退。大厅左约 64% 全身站桩（头要完整），右约 34%、最宽 360 的操作台；三角色圆钮必须在操作台里，不能压在人身上。
- **五房**：寻访 / 名册 / 商店 / 关卡 / 档案。出击是大厅主按钮，不进五格。
- **镜界寻访只收藏**：pity 80 SSR / 10 SR，价格 160 / 1440，N70 / R22 / SR7 / SSR1。字段只写 `shop40.ops`。
- **证词模式**：`runMode36="testimony"`，升级不弹卡。测试 API `selectStage` 仍强制 `story`。
- **干员**：最多 2 人，DP 开局 10 / 上限 20 / 花费 8 / 撤回 +4，约 0.4/s。不进 `pets`。挂 `combat:after-update` / `after-draw`。
- **仿 Live2D**：`src/runtime/sakurayo-live.js`。眨眼 Mean 2.5±2s，注视阻尼，点头/点身。不要再改成 5.4s CSS 死循环。

## 下一步（不要当成已完成）

1. I2V 绿幕重出三角色站桩（需 infsh login）。
2. 有独特动作的融合再补 `skill` / `dash`。
3. 寻访卡扩到 16 以内；大厅宽背景去黑边。
4. 全量 `tools/verify.ps1`。
5. 同步 Android 资源后发版。模拟器上的正式包可能仍是签名对不上的 4.2.3；debug 不能覆盖，**不要擅自卸包清档**。

## 明确不做

清档、改存档键、再包 `update`、抽卡/商店加永久伤害、每日任务/邮件/通行证/广告、联网账号、换引擎、把主神空间删掉或并进寻访。

## 改哪里

```text
src/index.html                         唯一代码基线
src/runtime/sakurayo-lobby.js          大厅 / 寻访 / 名册 / 模式条
src/runtime/sakurayo-live.js           仿 Live2D
src/runtime/sakurayo-ops.js            局内干员 DP
android-app/.../game/art               运行时美术（游戏读这里）
docs/HANDOFF.md                        完整交接规格
docs/PLAN_V46_ERYOU.md                 二游分期原文
docs/MAINTAIN.md                       升版本 / 发版
```

脚本顺序必须是：content-runtime → lifecycle → cutscene → economy → **lobby → live → ops**。

## 必须保住的选择器

`#gachaPull1` `#gachaPull10` `#gachaDrawer` `#rosterWall46` `.rosterSlot46.lock` `#shopDrawer` `.shopTabs40` `#shopWallet44` `#opsDock46` `#heroTap46` `#heroHead46` `#modeBar46` `#rotateHint46`，以及 `[data-open="gacha|roster|shop|stage|archive|story"]`。档案按钮文案仍须含 **剧情档案**。大厅主按钮是 **出击**。

## 测试 API

写在 `src/index.html` 的 `__SAKURAYO_TEST__` **字面量内部**（`Object.freeze`）。新 API 不要挂在 freeze 之后。

| API | 用途 |
|---|---|
| `setRunMode46(mode)` | 同时写 `runMode36` 和 `pendingMode46` |
| `selectStage(id)` | 永远把 `runMode36` 写成 `story` |
| `opsSnapshot46` / `deployOp46` / `retreatOp46` / `grantDp46` | 干员 |
| `liveSnapshot46` / `liveTrigger46` / `liveLook46` | 立绘 |
| `lobby46` / `pullGacha46` / `grantCheat46` / `tapPortrait46` | 大厅 / 寻访 |

`verify.ps1` 目前**没有**跑 `tests/testimony_smoke.mjs` 和 `tests/gacha_visual.mjs`，改证词或寻访视觉时要单独跑。

## 已知陷阱

- 不要再给 `update` 加包装层。局内扩展挂 `CONTENT41.hook("combat:after-update")` / `combat:after-draw`。
- 不要改名 `startGame` / `update` / `draw` / `spawnEnemy` / `showDialogue` 却不改调用点。
- `#hud` 是 `pointer-events:none`。干员坞自己开 `pointer-events:auto`。
- `startGame` 在 `!save.tutorialDone && state==="menu"` 时会打开教程并 **return**。隔离冒烟先点 `#tutorialSkip37`。
- `ART_ROOT`：`/android_asset/` → `game/art`；路径以 `/src/index.html` 结尾 → `../android-app/app/src/main/assets/game/art`；否则 `game/art`。
- 大厅 `live_idle.webp` / `live_blink.webp` 必须是**无损静帧 WebP**，用 CSS/JS 动。不要把动画 WebP 压成 lossy / yuva420p。
- 干员单位放独立 `units`，禁止推进 `pets`（`syncPets` 会清空）。
- `progress.md` 顶部 Original prompt 不得删。
- 仓库不含签名密钥。不要提交 `keystore.properties`、`local.properties`、`*.jks`、`*.apk`、`release/`、`assets/image2/source/`。

## 模拟器

已装正式包若是旧签名 4.2.3 / versionCode 47，debug APK 会 `INSTALL_FAILED_UPDATE_INCOMPATIBLE`。用本机 HTTP 打开 `src/index.html` 验收横屏，不要卸包除非用户接受清档。

---

## 玩家说明（公开仓）

玩家请下公开仓 Releases，不要直接翻这份私有源码。

- 公开仓：https://github.com/h1neolzr7f/sakurayo-zombietide
- 已发布包：[v4.4.6 APK](https://github.com/h1neolzr7f/sakurayo-zombietide/releases/tag/v4.4.6)
- 怎么玩：[docs/user-guide.md](docs/user-guide.md)
- 更新记录：[CHANGELOG.md](CHANGELOG.md)
- 路线图：[ROADMAP.md](ROADMAP.md)

```
Sakurayo-ZombieTide-v4.4.6-android.apk
SHA-256 D3CCD15CF38955951A5917217C22EAB8B136B45CFA82A04D75030D9F5C6B33EB
```

樱夜市被零号企业改写成尸潮试验场。选月城小夜 / 神代绫 / 黑羽凛音，用触控摇杆、冲刺和主动技能在四章里活下去。整局离线，没有账号、没有广告、没有 CDN。存档只在本机，键名 `sakurayoV3`。

代码与本仓库原创内容为 [MIT License](LICENSE)。Kenney 反馈音效为 CC0，见 [docs/THIRD_PARTY_ASSETS.md](docs/THIRD_PARTY_ASSETS.md)。不要提交签名密钥或他人存档。
