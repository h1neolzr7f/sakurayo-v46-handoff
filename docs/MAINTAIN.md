# 樱夜·尸潮 — Git 维护与升级

仓库根目录就是本 `source/` 文件夹。`src/index.html` 是唯一代码基线；发版仍是单文件 HTML。离线包写在上一级 `../offline/`，不进本仓库。

## 日常改动

1. 只改 `src/`（`index.html` 与 `src/runtime/*.js`）。
2. 不要再给 `update` 加包装层；不要改名 `startGame` / `update` / `draw` / `spawnEnemy` / `showDialogue`。
3. 存档键保持 `sakurayoV3`。商店皮肤只改外观和职业倾向。
4. 验证（也可直接跑 `powershell -File tools/verify.ps1`）：

```powershell
python tools/static_check.py src/index.html
node --check tests/artifacts/static/index.extracted.js
node tests/framework_smoke.mjs
node tests/browser_smoke.mjs
```

5. 发版：

```powershell
python tools/build_game.py --source src/index.html --output ../offline/index.html --asset-root ../offline/game/art
powershell -File android-app/sync-game.ps1
```

Android 壳版本在 `android-app/app/build.gradle`（`versionName` / `versionCode`）。`MainActivity` UA 读 `BuildConfig.VERSION_NAME`。Debug 测试包会加 `applicationIdSuffix .test` 和 `versionNameSuffix -test`，桌面名「测试版樱夜」，不覆盖正式包。三者与 `window.SAKURAYO_GAME_VERSION` 对齐（测试 APK 的 versionName 会多 `-test`）。

## 升一版时一起改

| 位置 | 作用 |
| --- | --- |
| `VERSION` | 给人/脚本看的当前号 |
| `src/index.html` 的 `SAKURAYO_GAME_VERSION` | 游戏内版本 |
| `src/runtime/sakurayo-lifecycle.js`、`sakurayo-content-runtime.js` 默认值 | 运行时回退版本 |
| `android-app/app/build.gradle` | APK `versionName`；`versionCode` 每次发版 +1 |
| `MainActivity` UA `SakurayoAndroid/x.y.z` | 与上面同一号 |
| `tests/browser_smoke.mjs` 里 `"version": "x.y.z"` | 冒烟会断言 |
| `docs/CHANGELOG_V*.md`、`progress.md` | 给人看的变更 |
| Git tag `vX.Y.Z` | 可回滚的基线 |

补丁号（4.4.x）只做体验/修复；新玩法再动小版本。

发版提交示例：

```powershell
git add -A
git status
git commit -m "Release V4.4.2: 一句话说明为什么升这一版。"
git tag v4.4.2
```

不要把密钥、`local.properties`、APK、`tests/artifacts/` 提交进去。`.gitignore` 已排除。公开仓库的 APK 只挂在 GitHub Releases，不要推进 git。

## 分支建议

- `main`：可玩、已过冒烟的基线
- `wip/短名`：进行中的改动
- 打 tag 再发 APK，方便覆盖安装与回滚

克隆后若要打 Android 包：先跑 `android-app/sync-game.ps1`（会内联 runtime 脚本并校验美术）。仓库里已带上一版同步过的 `android-app/app/src/main/assets/`。
