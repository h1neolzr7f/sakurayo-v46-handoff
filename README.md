# 樱夜·尸潮 v4.6 开发仓

这是《樱夜·尸潮》的 **v4.6.0 预发布开发基线**，用于继续开发、回归测试和整理发布内容。玩家下载稳定版请前往 [sakurayo-zombietide](https://github.com/h1neolzr7f/sakurayo-zombietide)；当前玩家发布线仍是 v4.4.6。

[玩家仓](https://github.com/h1neolzr7f/sakurayo-zombietide) · [开发交接](docs/HANDOFF.md) · [v4.6 计划](docs/PLAN_V46_ERYOU.md) · [维护手册](docs/MAINTAIN.md)

![v4.6 开发版首页](docs/screenshots/development-home.png)

> 截图由本仓库当前 `main` 源码以测试模式在本地浏览器启动后采集。它展示开发基线，不代表已经发布的玩家版本。

## 与玩家仓的关系

| 仓库 | 用途 | 版本状态 |
| --- | --- | --- |
| `sakurayo-zombietide` | 玩家说明、稳定源码与 Release 下载 | v4.4.6 已发布 |
| `sakurayo-v46-handoff` | v4.6 功能开发、视觉迭代与回归 | v4.6.0 预发布 |

只有通过回归、Android 构建和发布检查的提交才应同步到玩家仓。本仓库的 `VERSION` 或截图不能替代正式 Release。

## 当前开发基线

v4.6 在原有三角色、四章、职业/转职/融合/飞升、Boss 与主神空间基础上，加入横屏大厅、寻访、名册、商店、档案、出击模式、局内 DP 干员和角色待机表现。详细变更见 [CHANGELOG.md](CHANGELOG.md)。

核心兼容约束：

- 保留本地存档键 `sakurayoV3`，迁移缺字段而不清档；
- 保持离线优先，不加入账号、广告或每日任务；
- 不提交签名密钥、JKS、APK、`local.properties` 或构建输出；
- 改动战斗循环时继续遵守对象上限和现有测试 API。

## 本地运行

```powershell
git clone https://github.com/h1neolzr7f/sakurayo-v46-handoff.git
cd sakurayo-v46-handoff
python -m http.server 8000
```

浏览器打开 `http://127.0.0.1:8000/src/index.html`。

## 验证

```powershell
powershell -File tools/verify.ps1
```

本地验证包含静态/语法检查、镜头与生命周期单元测试、大厅/档案/角色表现/DP 系统测试、扩展框架冒烟和真实浏览器冒烟。当前 GitHub Actions 的 `verify.yml` 只运行静态和语法子集。

本次整理实际通过了静态检查、camera/lifecycle/lobby/chronicle/live/ops 单元测试、ops smoke 与 framework smoke 8 项检查，并在真实浏览器中启动当前源码。详细命令见 [docs/VALIDATION.md](docs/VALIDATION.md)。

## 发版前要求

1. 完成 `tools/verify.ps1` 的全部检查。
2. 在横屏浏览器和 Android WebView 中走通大厅 → 出击 → Boss/结算 → 返回大厅。
3. 检查旧 `sakurayoV3` 存档迁移和覆盖安装。
4. 使用维护者签名构建 APK，并在 Release 中提供校验值。
5. 将玩家文档、版本号和变更记录同步到玩家仓。

本仓当前没有证据表明 v4.6 已完成 Android 发布回归，因此应继续标为预发布开发线。

## 许可证与素材

代码按 [MIT License](LICENSE) 发布。第三方素材和再分发边界沿用玩家仓的素材说明；提交新素材时必须记录来源与许可证，不能把签名密钥、私人存档或无权再分发的资源放入仓库。
