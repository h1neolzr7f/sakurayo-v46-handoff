# 《樱夜·尸潮》开发根目录

当前版本：**V4.4.1**。先读 `AGENTS.md`，发版与升级流程见 `docs/MAINTAIN.md`。

直接打开 `src/index.html`。游戏离线运行，不依赖 CDN。存档键 `sakurayoV3`。

---

# 《樱夜·尸潮》V3.5 Codex 交接包

这是当前可运行的最新基线。请让 Codex 优先读取根目录的 `AGENTS.md` 与 `CODEX_TASK.md`。

## 立即运行

- 直接打开：`src/index.html`
- 手机发布版：`release/樱夜尸潮_V3.5_三刃协奏_单文件.html`
- 游戏完全离线运行，不依赖 CDN 或服务器。

## 当前版本

- 版本：V3.5「三刃协奏」
- 存档键：`sakurayoV3`
- 核心形态：单个 HTML，CSS、JavaScript 和图片数据均内嵌
- 目标设备：Android 手机浏览器 / Android WebView

## 包内目录

- `src/`：Codex 应修改的源码基线
- `release/`：当前可直接发布的单文件版本
- `docs/`：玩法、角色、职业、融合、商店、问题与测试记录
- `tests/screenshots/`：三名角色的手机尺寸回归截图
- `assets/reference/`：Image2 生成的美术与 UI 概念参考
- `tools/`：本地静态检查脚本

## 重要提醒

1. 不要以旧版 V3/V3.4 文件覆盖 `src/index.html`。
2. 之前出现过主渲染函数 `draw()` 被误删，导致角色和怪物全部消失；修改战斗循环后必须运行静态检查。
3. 保留 `sakurayoV3` 存档兼容，新增字段必须有默认值和迁移逻辑。
4. 吐槽、剧情、系统提示和 Boss 警告必须使用各自队列，不得重新重叠。
5. 新角色、职业、皮肤和融合必须有玩法机制与代价，不能只做百分比加成。
