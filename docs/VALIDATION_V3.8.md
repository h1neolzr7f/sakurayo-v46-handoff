# V3.8 验证记录

## 自动验证

- `python tools/static_check.py`：通过。
- 抽取后的内联 JavaScript `node --check`：通过。
- `node tests/browser_smoke.mjs`：30 项通过。
- 28 个敌人与 Boss WebP：全部完成浏览器本地解码，尺寸均为 512×512。
- 24 套三角色服饰：全部完成商店切换与解码。
- 旧存档缺字段迁移：通过。
- 三角色事件选择跨章节保存：通过。
- Boss 离屏方向箭头：通过。
- 430×932 怪海压力测试：请求生成 240 只时未突破动态硬上限；固定步推进 8 秒完成，子弹和敌弹均未突破独立预算。
- 标准/紧凑 HUD 设置切换与存档：通过。
- 四章 Boss 三次转阶段：通过。
- 主神永久强化与普通章节隔离：通过。

## Android

- Gradle `:app:assembleRelease`：成功。
- APK：versionName 3.8.0 / versionCode 38 / targetSdk 36 / minSdk 23。
- APK 签名：v1、v2 验证通过；证书 SHA-256 为 `03a493a3447a507abf407e1b66c1462ad8fa046028e73ba4f3e408a95b91a30b`。
- APK 内新战斗美术条目：28。
- Android 模拟器 `install -r`：成功，可覆盖 V3.7。
- 启动日志：无 FATAL EXCEPTION、无 JavaScript Uncaught 错误。

## 人工视觉检查

- 菜单四个工具按钮在 1080×2400 设备上保持单行文字。
- 普通敌人、角色、枪身和弹道在手机尺寸下可辨识。
- 升级卡数值条不遮挡技能图标与说明。
- Boss 离屏箭头显示方向和距离。
- 四阶段 Boss 素材与危险区同时出现时仍可识别主要攻击区域。
