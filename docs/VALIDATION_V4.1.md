# 《樱夜·尸潮 V4.1》验证说明

## V4.1.2 镜路探索增量

- 启动门禁断言首屏只预载 9 项资源，15 项核心资源中其余 6 项保持未解码；28 项战斗资源初始加载数为 0，并在测试显式请求或敌人/Boss 出现后按需加载。
- 框架专项 6/6：验证五段可行走区域、道路边界碰撞、分轴滑动、线索解锁事件、两种事件选择、隐藏奖励显现和扩展存档持久化。
- 完整浏览器流程 40/40：三角色从菜单到结算、商店、存档继续通过；增加 11 类敌人轮廓元数据、实画截图和 Boss 阶段过渡检查；无控制台错误、无外部请求。
- 源码入口三角色纯初始终章复跑样本为小夜 221 秒、绫 208 秒、凛音 196 秒；最终离线包独立复跑为 221/210/233 秒，最大/最小约 1.11，仍低于既有 1.25 门禁；本轮未以这些样本调整数值。
- `sync-game.ps1` 同步 4 个内容包脚本、37 项包内资源与全部本体资源；Gradle Release 和 Lint 共 49 项任务成功。
- Android 15 模拟器彻底卸载旧签名包后安装正式 APK，`dumpsys` 确认 4.1.2/43；冷启动约 6 秒截图已显示完整封面、角色头像/卡片和导航，致命日志匹配为 0。

当前验证日期：2026-07-13。

## V4.1.1 角色识别增量

- 清除模拟器应用数据后进行冷启动：Android 15 原生启动页已由白底改为 `#080611` 深色，应用图标可见；13 秒后菜单完整解码，致命日志匹配为 0。
- Web 启动层不再依赖 `loading_art.webp`；普通与坏扩展场景均等待启动层正常退场，框架 6/6 与完整流程 39/39 继续通过。
- 探索角色视觉尺寸 118px，碰撞半径 16px；自动化断言验证二者不绑定。
- 自动化验证探索角色向左移动会切换朝向，并保持奖励拾取与扩展存档正常。
- 浏览器完整流程 39/39、扩展专项 6/6 通过；角色定位环在三角色战斗截图和怪海截图中人工确认可见。
- 内容包检查覆盖 `official.feedback`，并验证音效/VFX 资源映射能够通过注册表读取；发布包继续保持零外部请求。

验证日期：2026-07-13。基线：V4.0.0。

## 静态与构建

执行：

```powershell
python tools\static_check.py src\index.html --out tests\artifacts\static\index.extracted.js
node --check tests\artifacts\static\index.extracted.js
python tools\check_content_packs.py
python tools\build_game.py
powershell -ExecutionPolicy Bypass -File android-app\sync-game.ps1
node --check tests\artifacts\static\android.bundle.extracted.js
```

结果：

- 16 个核心/框架符号齐全；开发入口 4 个脚本，其中 2 个本地经典脚本。
- 发布与 Android 入口已内联，0 个外部脚本标签。
- 内容包检查通过：2 个启用官方包、1 个条件坏包夹具。
- Android 同步确认核心美术 15、成长/UI 116、动画 15、原服饰 168，另同步内容包美术 25 个。

## 框架专项

```powershell
node tests\framework_smoke.mjs src\index.html
```

结果：6/6。

1. 缺字段旧 `sakurayoV3` 保留金币/天赋并补齐包版本和默认字段。
2. 官方包注册服饰、商店、成就、档案。
3. 示例服饰图片解码、购买并触发成就。
4. 扩展道具独立持久化并解锁档案。
5. Image2 地图可进入、移动、拾取奖励并持久化。
6. 非法包被拒绝，本体和两个正常包继续启动，无 page error。

## V4.0 完整玩法回归

```powershell
node tests\browser_smoke.mjs src\index.html
```

V4.1.2 开发入口结果为 40/40。覆盖菜单、三角色、战斗、升级、Boss 四阶段、结算、商店、存档、24 种融合、主神空间、怪海预算、敌人轮廓、Boss 变身和正式模式测试接口隔离。最终离线 Web 包的独立结果记录于发布验证段。

## Android

- Gradle `assembleRelease --no-daemon`：成功。
- 包名：`com.sakurayo.zombietide`。
- 版本：versionCode 42 / versionName 4.1.1。
- 签名：v1/v2 通过；沿用证书 SHA-256 `03a493a3447a507abf407e1b66c1462ad8fa046028e73ba4f3e408a95b91a30b`。
- 模拟器覆盖安装：成功。
- 启动：`MainActivity` 为 `topResumedActivity`；FATAL/Uncaught 匹配数 0。
- 实机样式模拟器截图确认关卡卡显示“探索地图”，探索页显示 Image2 背景、Q 版角色、摇杆、奖励光点与退出按钮。

## 离线与 SFW

- 浏览器完整回归外部请求为 0。
- 所有新增地图、服饰和脚本均打入本地包；没有 CDN、远程字体和远程图片。
- 四张探索背景无人物、无敌人、无血腥表现、无文字烘焙；本体保持既有 SFW 二次元表现。

## 已知边界

- 内容包是同页面受信任脚本。注册、迁移、应用和资源错误可隔离，但恶意死循环无法在同线程安全隔离。
- 战斗核心仍保留在大 IIFE；这是有意的渐进式策略。后续应按已建立 seam 逐步搬数据，不应一次重写帧循环。
