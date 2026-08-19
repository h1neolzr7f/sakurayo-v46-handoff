# 打包测试产物（仍 4.6.0，非正式发版）

2026-08-19。源码 `origin/main` `@ 0af3809` + 本分支同步壳。版本仍 **4.6.0**。存档键仍 `sakurayoV3`。

## 单文件 HTML（给人浏览器测）

| 项 | 值 |
|---|---|
| 路径 | `/tmp/sakurayo-460-test.html` |
| 字节 | 1990342 |
| SHA-256 | `18ee4eb9014eec07f82c0470d24b6c14fd28e4f6b208e751f40446e53ccfacfc` |
| 命令 | `python3 tools/build_game.py --source src/index.html --output /tmp/sakurayo-460-test.html --asset-root android-app/app/src/main/assets/game/art` |

与 Android 壳 `android-app/app/src/main/assets/index.html` 同哈希（同一套内联产物）。含 `SakurayoCamera` / `SakurayoChronicle` / 三页寻访。未把该 HTML 大包 commit 进仓库。

美术仍读 `android-app/app/src/main/assets/game/art`。浏览器测可 `python3 -m http.server` 打开 `src/index.html?test=1`，或把该单文件与 `game/art` 放到同一离线目录。

## debug APK（本步停）

| 项 | 值 |
|---|---|
| `ANDROID_HOME` / `ANDROID_SDK_ROOT` | 未设置 |
| 系统 `android.jar` | 未找到 |
| `android-app/gradlew` | 存在但无执行权限（Permission denied） |
| `local.properties` | 无（正确，不提交） |
| 结论 | **打不了 APK**。不装 SDK、不交密钥、不卸正式包。 |

applicationId 仍是 `com.sakurayo.zombietide`。签名对不上正式包就不要装、不要卸。
