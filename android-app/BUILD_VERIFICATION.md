# Android APK 构建验证

验证日期：2026-08-17（开发版 夜樱）

## 产物

- 桌面名：`开发版 夜樱`
- 包名：`com.sakurayo.yeying.dev`
- 版本：`4.6.0-yeying`（versionCode 6101）
- 正式版包名未改：`com.sakurayo.zombietide` 仍可同时安装
- minSdk：23
- targetSdk / compileSdk：36
- APK：`YeYing-Dev-v4.6.0-android.apk`
- SHA-256：`2FBFAEA4DAF36D972F6DE4F63033D68760303E4BA43B5DB2AB6D4EB87BBBA815`

## 已实际执行

| 检查 | 结果 |
|---|---|
| `assembleDebug` | 通过 |
| `lintDebug` | 通过 |
| APK v1 签名 | 通过 |
| APK v2 签名 | 通过 |
| 权限检查 | 无 `uses-permission`，无 INTERNET 权限 |
| 包名隔离 | 与正式版 `com.sakurayo.zombietide` 不同 |
| APK 内运行时美术 | 1190 个 WebP |
| feel53 已打进单入口 | `开发版 夜樱` 已打进本地构建的 APK |

APK 当前使用 Android debug 证书签名，适合侧载测试，但不能替代原正式证书。装这个包不会覆盖手机上的正式《樱夜·尸潮》。
