# Android APK 构建验证

验证日期：2026-08-16（V4.6 第二轮成熟化）

## 产物

- 包名：`com.sakurayo.zombietide`
- 版本：`4.6.0`（versionCode 61）
- minSdk：23
- targetSdk / compileSdk：36
- APK：`app/build/outputs/apk/debug/app-debug.apk`
- SHA-256：`CE760C4A3BF890445768812E3D9452233625EE2BC05EA7914C9522C03E3C8291`

## 已实际执行

| 检查 | 结果 |
|---|---|
| `assembleDebug` | 通过 |
| `lintDebug` | 通过 |
| APK v1 签名 | 通过 |
| APK v2 签名 | 通过 |
| 权限检查 | 无 `uses-permission`，无 INTERNET 权限 |
| APK 内 `assets/index.html` 与离线单入口 SHA-256 | 完全一致 |
| APK 内运行时美术 | 1190 个 WebP |
| 浏览器等价流程 | 开发入口与离线单入口各 52/52 |
| 横屏视觉 | 5/5 作战导演门禁；主动技能＋双干员、Boss P2 阶段演出通过 |

APK 当前使用 Android debug 证书签名，适合侧载测试，但不能替代原正式证书。本轮环境没有 AVD 或实体设备，因此未声称安装、冷启动、刘海安全区或长时发热通过；战斗截图保存在 `tests/artifacts/combat/`。
