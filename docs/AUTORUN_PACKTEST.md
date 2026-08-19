# 打包测试怎么开

2026-08-19。卡池和镜头/编年/18 张拼卡已进 `main` `0af3809`。生图额度用完。下一件是**测试包 + 修 P0/P1**，不是正式 4.6.1。

一个 Cloud Agent。提示词：`docs/CURSOR_PROMPT_PACKTEST.md`。  
新分支：`cursor/pack-test-5030`。  
基线：`origin/main` @ `0af3809`。

不要等传说封面 #16。不要和图、第四期加伤贴进同一个项目。

## 人要看到的收工物

- 门 A 绿（能跑的）
- Android 壳已 `sync-game`，不再是旧大厅
- 单文件 HTML 的路径 + SHA-256
- debug APK 能打就打，**不进 git**
- 修过的 P0/P1 类名；P2 只记账
- 版本仍 4.6.0

## 明确不做

- 升 4.6.1、打 tag、交密钥、卸正式包
- 推公开仓 `sakurayo-zombietide`
- 重画任何 gacha 图
- 第四期加伤、飞升进池、I2V
