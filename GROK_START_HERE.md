# Grok Bot 接手入口 — 2026-10-10

本分支是《樱夜·尸潮》最新已持久化代码的接手包，包含源码、离线美术、Android 工程、测试、既有审查及本轮未完成计划。它不是已验收成品。

**交接分支：`codex/grok-linux-handoff-20261010`。不要从 `main` 开始修，也不要把旧的全绿 CI 当作当前代码全绿。**

先读 [最新交接与已知失败](docs/GROK_HANDOFF_2026-10-10.md)，再读 [AGENTS.md](AGENTS.md)、[产品交接](docs/HANDOFF.md)、[本轮设计](docs/superpowers/specs/2026-10-08-game-completion-design.md) 和 [实施计划](docs/superpowers/plans/2026-10-08-game-completion.md)。

## 直接给 Grok Bot 的任务

```text
请接手 h1neolzr7f/sakurayo-v46-handoff 的
codex/grok-linux-handoff-20261010 分支，在 Linux 上继续修复和验证。
先完整阅读 GROK_START_HERE.md 和 docs/GROK_HANDOFF_2026-10-10.md。

用户目标：保留离线肉鸽，做成精装修横屏二游，特别重视大厅、战斗反馈、
角色表现、持续挑战和手机操作；坏代码能删则删，精简重构，修根因，
不要叠防御补丁和 update/startGame/finish/damagePlayer 包装层。

先复现交接中列出的四个已知问题，完成收藏政策这轮测试修正；
之后按已写好的设计/计划完成三项离线试炼、表现与音乐、独立平衡矩阵、
真实 Android WebView instrumentation。不要重新做已整合的 F01–F30。
保留原三角色耗时 max/min <1.30 门槛，不删断言或重新加入抽卡属性加成。
无证据不要盲调伤害系数；固定种子、独立存档，区分保护输出和真实受伤。

在 Linux 实际运行源码/离线 HTML 全部验证，Android 编译/lint 和模拟器流程。
每项报告实际代码 SHA、命令、退出状态与日志；未运行就写未运行。
保留 v4.6.0 / Android code61、sakurayoV3 和旧档，不能卸载清档。
完成后更新交接/CHANGELOG/验证文档，并更新草稿 PR #32。
本次授权是继续修复与测试，不合并 main，不发布 APK，不同步玩家发布仓。
实体机温度、扬声器听感及正式签名覆盖升级，必须单独列为待实机验收。
```

Linux 启动和完整测试命令见 [交接文档](docs/GROK_HANDOFF_2026-10-10.md#linux-复现与验证)。GitHub 本分支的 Code → Download ZIP 就是完整源码接手包；clone 更适合继续提交。
