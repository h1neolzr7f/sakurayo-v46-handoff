# V4.2.2 验证说明

## 目标

普通战斗不依赖发光定位角色；使用平面轮廓、暗色落脚影和方向标保证识别。Boss 与主神空间的高危警告不受影响。

## 验证状态

- 开发入口静态抽取、`node --check` 与内容包门禁通过：5 个候选包、4 个启用、1 个条件坏包。
- 框架专项 7/7、完整浏览器流程 41/41 通过；旧 V4.2.1 `glow: soft` 存档迁移为 `off`。
- 普通战斗、Boss 与设置截图已人工检查：普通战斗无角色光环和常驻青色环，Boss 危险层级仍清晰。
- 官方网页游戏客户端完成两轮动作、状态与截图导出；完整战斗画面由项目浏览器回归覆盖。
- Android 同步通过：15 项核心美术、116 项 UI、15 项基础动画、168 项服饰；离线包 SHA-256 为 `8ABB5B860D1AE0CBCEE8658D6E25A2C424A0174E11C0E42859FEDB0690706F4B`。
- Android `assembleRelease lintRelease` 返回 0；APK versionCode 46 / versionName 4.2.2，v1/v2 签名通过。
- Android 15 模拟器覆盖安装成功，`MainActivity` 为前台 Activity，应用 PID 存在，`FATAL/Uncaught` 匹配为 0。
