# 开发版 夜樱

这是给作者自己试玩的侧载包，不是对玩家发的 4.6.0。

| 项 | 开发版 夜樱 | 正式 樱夜·尸潮 |
|---|---|---|
| 桌面名 | 开发版 夜樱 | 樱夜·尸潮 |
| 包名 | `com.sakurayo.yeying.dev` | `com.sakurayo.zombietide` |
| versionName | `4.6.0-yeying` | `4.4.6`（公开仓） |
| 存档沙盒 | 独立 | 独立 |
| 覆盖安装 | 不会顶掉正式版 | 不会顶掉开发版 |

## 安装

1. 从本仓 GitHub Releases 下载 `YeYing-Dev-v4.6.0-android.apk`
2. 侧载安装。Android 6.0+
3. 手机上会同时看到两个图标：原来的「樱夜·尸潮」和新的「开发版 夜樱」

不要用 `adb install -r` 把这个包装到正式版包名上。它们本来就不是同一个 applicationId。

## 构建

```bash
python3 tools/build_game.py --source src/index.html --output android-app/app/src/main/assets/index.html --asset-root android-app/app/src/main/assets/game/art
cd android-app
./gradlew assembleDebug
```

输出：`android-app/app/build/outputs/apk/debug/app-debug.apk`

当前用 Android debug 证书签名，只适合自己试，不能当正式商店包。
