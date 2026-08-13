# Android APK 构建验证

验证日期：2026-07-11

## 产物

- 包名：`com.sakurayo.zombietide`
- 版本：`3.5.0`（versionCode 35）
- minSdk：23
- targetSdk / compileSdk：36
- APK：`app/build/outputs/apk/debug/app-debug.apk`
- 大小：2,595,155 bytes
- SHA-256：`9017D2455B3C53DB1E48D56670B5B48D661565DCDF268CD3A6D60DB607AA8CA9`

## 已实际执行

| 检查 | 结果 |
|---|---|
| `assembleDebug` | 通过 |
| `lintDebug` | 通过，No issues found |
| APK v1 签名 | 通过 |
| APK v2 签名 | 通过 |
| `zipalign -c -v 4` | 通过 |
| `aapt dump badging` | 包名、版本、SDK 和启动 Activity 正确 |
| 权限检查 | 无 `uses-permission`，无 INTERNET 权限 |
| APK 内 `assets/index.html` 与 `src/index.html` SHA-256 | 完全一致 |
| APK 内 Image2 核心资源 | 15 个 WebP，全部存在 |
| Android 35 模拟器安装 | `adb install -r` 返回 `Success` |
| 冷启动 | `Status: ok`，`LaunchState: COLD`，MainActivity 为 top resumed activity |
| 运行进程 | `com.sakurayo.zombietide` PID 存在 |
| 页面流程 | 已人工查看主菜单、开场对话和 7 秒战斗画面 |
| 运行错误 | 未发现应用崩溃、AndroidRuntime fatal 或 Sakurayo/Chromium 页面错误 |
| Image2 视觉 | 角色卡、HUD 头像、6 枚导航图标和战斗玩家精灵均已人工查看 |

APK 当前使用 Android debug 证书签名，适合直接侧载测试。安装验证设备为 Android 35 `TFModLab_API35` 模拟器，物理分辨率 1080×2400、density 420。截图保存在 `tests/artifacts/android/`。尚未在用户的实体手机上测试。
