# 接手检查清单

当前 **4.6.0 / Android code61 开发预发布**，存档 `sakurayoV3`。玩家稳定仓仍为 [sakurayo-zombietide](https://github.com/h1neolzr7f/sakurayo-zombietide)。

先读 [README.md](README.md)、[AGENTS.md](AGENTS.md)、[交接](docs/HANDOFF.md) 与 [全项目审查](docs/AUDIT_2026-10-05.md)。此次修复对应 [执行计划](docs/plans/2026-10-05-full-repair.md)。

当前已有疏朗横屏大厅、三主入口、六图标底栏、邮箱/公告/活动/任务/有限七日登录、三卡池寻访、名册、商店、四章环境动画、证词/主神模式、最多2名干员与仿Live角色表现。素材全部离线；不另加账号联网。

开发打开 `src/index.html`，交付单文件 `android-app/app/src/main/assets/index.html`。Linux/macOS `bash tools/verify.sh`，Windows `powershell -File tools/verify.ps1`；`--static` / `-Static` 不启动浏览器。

不要改版本或存档键、清档、叠加update包装、恢复逐弹全敌遍历、提交凭据/APK/签名/源PNG，或卸载旧正式包。代码与回归先验证，再同步单HTML和现有PR；未完成真机验收仍保持预发布。
