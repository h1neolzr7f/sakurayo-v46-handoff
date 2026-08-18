# 接手检查清单

当前：**V4.7.0 源码，开发版 夜樱可侧载。** 公开玩家仓已发布 APK 仍是 v4.4.6。

## GitHub 在哪

| 项 | 值 |
|---|---|
| 开发仓 | https://github.com/h1neolzr7f/sakurayo-v46-handoff |
| 工作分支 | `cursor/unify-v47-da3d` |
| 开发版包名 | `com.sakurayo.yeying.dev` |
| 桌面名 | 开发版 夜樱 |
| 正式版包名 | `com.sakurayo.zombietide` |
| `main` | 还没有这批 4.6 精修 |
| 公开玩家仓 | https://github.com/h1neolzr7f/sakurayo-zombietide |

开发版和正式版可以同时装。**没有对玩家发正式 4.7.0。** 侧载包走本仓 Releases 预发布 `yeying-dev-v4.7.0` 的 `YeYing-Dev-v4.7.0-android.apk`。已修错误见 [docs/REGRESSION.md](docs/REGRESSION.md)。

## 本机模拟器侧载（当前可下）

最新开发包已挂在预发布，对应提交 `884d7c5`（含 412px 横屏热区/对比度修复）。**不要把 APK 提交进 git。**

- 下载：https://github.com/h1neolzr7f/sakurayo-v46-handoff/releases/download/yeying-dev-v4.7.0/YeYing-Dev-v4.7.0-android.apk
- 发布页：https://github.com/h1neolzr7f/sakurayo-v46-handoff/releases/tag/yeying-dev-v4.7.0
- SHA256：`f618362956dfd544764c1fb0866d4d28950e2460931d66cac4dcffab8da650b9`
- 桌面名：开发版 夜樱 / 包名 `com.sakurayo.yeying.dev` / `4.7.0-yeying` / versionCode **6110**
- Debug 签名，只给自己装。可与正式包 `com.sakurayo.zombietide` 并存，**不要卸正式包**（会清档）。

```bash
adb install -r YeYing-Dev-v4.7.0-android.apk
adb shell settings put system user_rotation 1
adb shell am start -n com.sakurayo.yeying.dev/com.sakurayo.zombietide.MainActivity
```

模拟器请锁横屏。存档键仍是 `sakurayoV3`。

按这个顺序读：

1. [README.md](README.md)
2. [docs/HANDOFF.md](docs/HANDOFF.md)
3. [AGENTS.md](AGENTS.md)
4. [docs/FINAL_UPGRADE_REPORT.md](docs/FINAL_UPGRADE_REPORT.md)
5. [docs/MAINTAIN.md](docs/MAINTAIN.md)

然后打开 `src/index.html`。存档键 `sakurayoV3`。不要清档。

## 立刻能跑

```bash
npm ci
npx playwright install chromium
npm test
npm run test:visual
```

Windows 也可：`powershell -File tools/verify.ps1`

## 这一版已经有了

横屏大厅、五房、16 卡寻访（只收藏）、证词模式、局内 2 干员 DP、真实眨眼、作战简报、四阶段机制条、Boss 阶段字幕、三角色技能演出、分层打击反馈、三相飞升签名、触控修复、图标精装、顶栏拆叠。版本号 **4.7.0**。

## 当前交付状态

候选版、全量回归、单入口和 Android Debug 已完成并上传到开发仓 PR。下一步是：原正式证书打 Release、实体横屏机长测、再决定是否合并 `main` / 同步公开仓。

## 不要做

- 再包 `update`
- 改存档键或清档
- 抽卡/商店卖永久伤害
- 改名 `startGame` / `update` / `draw` / `spawnEnemy` / `showDialogue` 却不改调用点
- 提交 `keystore.properties`、`local.properties`、APK、`assets/image2/source/`
- 卸掉模拟器上签名对不上的旧正式包（会清档）
- 删 `progress.md` 顶部 Original prompt
- 把竖屏重新做成主体验
- 重复做已经落地的 16 卡、闭眼帧、作战简报、Boss 字幕、飞升签名

## 目录

- `src/` 唯一代码基线
- `src/runtime/sakurayo-lobby.js` 大厅/寻访
- `src/runtime/sakurayo-shell.js` 缺系统的预览壳
- `src/runtime/sakurayo-live.js` 立绘
- `src/runtime/sakurayo-ops.js` 干员
- `android-app/app/src/main/assets/game/art` 运行时美术
- `release/` 本机同步的单入口与 Debug APK（不作为公开发版）
