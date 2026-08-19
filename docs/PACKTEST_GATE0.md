# 打包测试检查点 0 — 门 A 摸底

2026-08-19。不改玩法，只记基线。版本仍 **4.6.0**。存档键仍 `sakurayoV3`。分支 `cursor/pack-test-5030`。

## 仓库

| 项 | 值 |
|---|---|
| 仓 | `h1neolzr7f/sakurayo-v46-handoff` |
| `origin/main` SHA | `0af3809`（Merge PR #15：换 18 张非传说时装/武器拼卡） |
| 含编年 + 镜头 | 是（#13 / #14 已进 main，再并 #15） |
| 源码版本 | 4.6.0（`SAKURAYO_GAME_VERSION` / runtime / gradle `versionName`） |
| Android `versionCode` | 61 |
| 存档键 | `sakurayoV3` |
| 传说 #16 | 未并，当不存在 |

现网已有、本轮必须保住：残片 74（8+14+28+24）、时装 12、武器 12、三页寻访/仓库、编年一段三页签（小夜 5 + 绫 4 + 凛音 4）、局内 4×2 镜头、三角色、四章、Boss 75/50/25、摇杆冲刺技能。

## 门 A 现状

| 脚本 | 结果 |
|---|---|
| `python3 tools/static_check.py src/index.html` | 绿（16 symbols / 12 scripts） |
| `node --check tests/artifacts/static/index.extracted.js` | 绿 |
| `node --check src/runtime/sakurayo-*.js`（9 个） | 绿 |
| `node tests/lobby_unit.mjs` | 绿 |
| `node tests/live_unit.mjs` | 绿 |
| `node tests/ops_unit.mjs` | 绿 |
| `node tests/chronicle_unit.mjs` | 绿 |
| `node tests/camera_unit.mjs` | 绿 |
| `node tests/framework_smoke.mjs` | 未跑：`require("playwright")` 失败；本机无项目 `node_modules`，也无 `~/.codex/.../playwright` |
| `node tests/browser_smoke.mjs` | 未跑（同上） |
| `pwsh tools/verify.ps1` | 未跑：无 pwsh |

`npx playwright --version` 能打出 1.62.1（缓存在 `~/.npm/_npx/...`），但测试脚本默认 import 路径对不上。刀 1 已在本机安装 Playwright Chromium（`node_modules/` gitignore，不进仓）并补跑。禁止为绿删测试或放宽 `"4.6.0"`。

## 刀 1 门 A 复跑（2026-08-19）

未改玩法、未删测试、未放宽版本断言。

| 脚本 | 结果 |
|---|---|
| static / node --check / lobby / live / ops / chronicle / camera | 绿（与刀 0 同） |
| `node tests/framework_smoke.mjs` | **绿** 8 checks |
| `node tests/browser_smoke.mjs` | **绿** 52 checks |

无测试红，无代码修复。下一刀同步 Android 壳。

核心函数未改名：`startGame` / `update` / `draw` / `spawnEnemy` / `showDialogue` 仍在 `src/index.html`。`update(dt)` 仍是 `return fixedUpdate(dt)`，无新包装层。

## Android 壳

| 项 | 值 |
|---|---|
| `src/index.html` SHA-256 | `80568096c40c53c90ed28d02d700884a054dd61d0375e31778c687253c393848` |
| `android-app/app/src/main/assets/index.html` SHA-256 | `b8dc56b55bf191ae0757dabc216204d299622a98bda427c3a4c5f1d61dae1dfe` |
| 壳是否旧于 src | **是**（mtime 更早，哈希不同） |
| 壳内 `SakurayoLobby` | 有（旧大厅内联） |
| 壳内 `SakurayoCamera` | **无** |
| 壳内 `SakurayoChronicle` | **无** |
| 壳内三页寻访 | 旧内联，未跟 main 编年/镜头 |

刀 2 必须同步。无 pwsh，走 `python3 tools/build_game.py --source src/index.html --output android-app/app/src/main/assets/index.html --asset-root android-app/app/src/main/assets/game/art`，再按 `sync-game.ps1` 后半段校验美术清单。

## Debug APK / SDK

| 项 | 值 |
|---|---|
| `ANDROID_HOME` / `ANDROID_SDK_ROOT` | 未设置 |
| 系统 android.jar | 未找到 |
| `android-app/local.properties` | 无（正确，不提交） |
| `android-app/gradlew` | 有 |
| Java | OpenJDK 21.0.10 |
| 结论 | **本环境打不了 APK**。刀 3 写原因停这一步，不装 SDK、不交密钥。 |

签名冲突的正式包不要卸。本环境也没有 adb 设备。

## 抄死未动

价格 160 / 1440。爆率 N 0.70 / R 0.22 / SR 0.07 / SSR 0.01。硬保 80 / 软保 65 / Spark 200。未升 4.6.1。未打 tag。未出新图。未改 `update` 包装。
