# 参与贡献

感谢你愿意改进《樱夜·尸潮》。

## 开始前

1. 阅读 [AGENTS.md](AGENTS.md)、[DISCLAIMER.md](DISCLAIMER.md) 和 [RESPONSIBLE_USE.md](RESPONSIBLE_USE.md)。
2. 不要提交签名密钥、`keystore.properties`、`local.properties` 或别人的存档。
3. 代码基线是 `src/index.html`。不要用旧版 HTML 覆盖它。

## 本地开发

用浏览器打开 `src/index.html`。美术在 `android-app/app/src/main/assets/game/art`。

```powershell
powershell -File tools/verify.ps1
```

Android 工程在 `android-app/`，需要 JDK 17 与 Android SDK。先同步再编译：

```powershell
powershell -File android-app/sync-game.ps1
cd android-app
.\gradlew.bat assembleDebug
```

签名包需要你自己的 `android-app/keystore.properties`，模板见 `android-app/keystore.properties.example`。

## 欢迎的改动

- 缺图回退、触控和信息层级（剧情 / 警告 / 提示 / 电台不要重叠）
- 职业、融合、飞升的机制与代价写清楚
- 平衡、无障碍和中端安卓性能
- 文档、小白说明和可复现测试

## 不接受的改动

- 改存档键，或升级时清空旧档
- 给 `update` 再加包装层，或改名 `startGame` / `update` / `draw` / `spawnEnemy` / `showDialogue` 却不改调用点
- 商店出售永久伤害
- 恢复「每颗子弹遍历全部敌人」的无界碰撞
- 把新怪图写进旧怪文件名，覆盖已有敌人

## 怎么提

- 缺陷用 [Bug 模板](https://github.com/h1neolzr7f/sakurayo-zombietide/issues/new?template=bug_report.yml)
- 建议用 [功能模板](https://github.com/h1neolzr7f/sakurayo-zombietide/issues/new?template=feature_request.yml)
- 安全问题走 [SECURITY.md](SECURITY.md)，不要在公开 Issue 里贴存档或密钥
- Pull Request 请说明为什么改、改了什么，并写明验证命令已通过
