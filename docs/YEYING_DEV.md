# 开发版 夜樱

这是给作者自己试玩的侧载包，不是对玩家发的正式版。

| 项 | 开发版 夜樱 | 正式 樱夜·尸潮 |
|---|---|---|
| 桌面名 | 开发版 夜樱 | 樱夜·尸潮 |
| 包名 | `com.sakurayo.yeying.dev` | `com.sakurayo.zombietide` |
| versionName | `4.7.0-yeying` | `4.4.6`（公开仓） |
| 存档沙盒 | 独立 | 独立 |
| 覆盖安装 | 不会顶掉正式版 | 不会顶掉开发版 |

## 安装

1. 从本仓 GitHub Releases 的 `yeying-dev-v4.7.0` 预发布下载 `YeYing-Dev-v4.7.0-android.apk`
2. 若 Release 还没出来，到本分支 Actions 工作流 `yeying-dev-apk` 的 Artifacts 里下同名文件
3. 侧载安装。Android 6.0+
4. 手机上会同时看到两个图标：原来的「樱夜·尸潮」和新的「开发版 夜樱」

不要用 `adb install -r` 把这个包装到正式版包名上。它们本来就不是同一个 applicationId。

本机已验证的一份 SHA-256：

```
2FBFAEA4DAF36D972F6DE4F63033D68760303E4BA43B5DB2AB6D4EB87BBBA815
```

Actions 重新打包后校验和会变，以 Release / Artifact 页面为准。

## 构建

```bash
python3 tools/build_game.py --source src/index.html --output android-app/app/src/main/assets/index.html --asset-root android-app/app/src/main/assets/game/art
cd android-app
./gradlew assembleDebug
```

输出：`android-app/app/build/outputs/apk/debug/app-debug.apk`

当前用 Android debug 证书签名，只适合自己试，不能当正式商店包。

## 4.6.0 开发版触控修复

手机锁横屏后，WebView 有时仍上报竖屏宽度（`view.w < 640`）。页面会同时套 `landscape46` 和 `portraitFallback46`：立绘/指挥台视觉叠在一起，出击等按钮的命中盒却还在另一处，表现为「按了没反应」。

本包在 Android 壳注入 `__SAKURAYO_ANDROID_LANDSCAPE__`，由 `sakurayo-layout52.js` 强制横屏大厅、打开按钮 `pointer-events`，并把 `html,body` 的 `touch-action` 从 `none` 改成 `manipulation`（画布和摇杆仍是 `none`）。

覆盖安装 `versionCode 6110` 即可，不会动正式《樱夜·尸潮》。

大厅点按若仍落到画布上，`sakurayo-touch54.js` 会拦住 UI 层、用触摸位置补一次 click，覆盖出击、换角、寻访、商店、关卡、暂停、升级和结算。
