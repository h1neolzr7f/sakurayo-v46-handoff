# 《樱夜·尸潮》开发根目录

当前版本：**V4.4.6**。玩家请看根目录 [README.md](README.md) 和 [Releases](https://github.com/h1neolzr7f/sakurayo-zombietide/releases)。

先读 `AGENTS.md`，发版与升级流程见 `docs/MAINTAIN.md`。

直接打开 `src/index.html`。游戏离线运行，不依赖 CDN。存档键 `sakurayoV3`。

## 立即运行

- 开发打开：`src/index.html`（美术在 `android-app/app/src/main/assets/game/art`）
- 手机发布版：GitHub Releases 里的 `Sakurayo-ZombieTide-v4.4.6-android.apk`
- 验证：`powershell -File tools/verify.ps1`

## 当前版本

- 版本：V4.4.6
- 存档键：`sakurayoV3`
- 代码基线：`src/index.html` 加 `src/runtime/*.js`
- 目标设备：Android 6.0+ WebView / 本地 Chrome

## 包内目录

- `src/`：应修改的源码基线
- `android-app/`：WebView 壳与同步后的美术
- `docs/`：玩法、架构、变更和素材许可
- `tools/`：静态检查、构建和美术后处理
- `tests/`：框架与浏览器冒烟

## 重要提醒

1. 不要以旧版 HTML 覆盖 `src/index.html`。
2. 不要删除或改名 `startGame` / `update` / `draw` / `spawnEnemy` / `showDialogue` 却不改调用点。
3. 保留 `sakurayoV3` 存档兼容，新增字段必须有默认值和迁移逻辑。
4. 吐槽、剧情、系统提示和 Boss 警告必须使用各自队列，不得重新重叠。
5. 商店皮肤只影响外观和职业出现倾向，不直接出售永久伤害。
6. 不要提交签名密钥、`keystore.properties`、`local.properties` 或 APK。
