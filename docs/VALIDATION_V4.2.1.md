# V4.2.1 验证说明

## 已完成

- 静态抽取与 `node --check` 通过。
- 内容包检查通过：5 个候选、4 个正式启用、1 个条件坏包。
- 框架专项 7/7：旧档、依赖、迁移、Hook、坏包隔离均通过。
- 完整浏览器流程 41 项通过；新增验证发光设置默认“柔和”且三档可循环。
- 人工检查普通关卡、怪海、Boss 和设置截图：普通攻击与常驻 UI 降亮，Boss 阶段警告仍清晰。
- 网页游戏客户端在本地 HTTP 下完成两轮动作、截图和状态导出。

## 平衡测试说明

纯初始强化测试仍要求三名角色分别完成终章。单局模拟存在 Boss 路径与技能点击时序波动，观测范围约为 199–247 秒；因此用 30% 作为单样本防退化门槛，不将其描述为真人平衡结论。

## Android

- `android-app/sync-game.ps1` 通过：15 项核心美术、116 项 UI、15 项基础动画、168 项服饰均已同步；离线包哈希为 `38F449757578923F41991A84E1CEAC6B7C555E45479D7D76E80F4E154C25F836`。
- `assembleRelease lintRelease --no-daemon -q` 返回 0。
- `aapt` 复核为 versionCode 45 / versionName 4.2.1；Release APK 大小 22,596,780 bytes。
- `apksigner` 复核 v1 / v2 签名均为 true。
- Android 15 模拟器覆盖安装成功；`MainActivity` 前台启动 `Status: ok`，应用 PID 存在，启动后 `FATAL/Uncaught` 匹配为 0。
