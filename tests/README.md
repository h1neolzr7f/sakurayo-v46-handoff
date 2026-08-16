# 自动回归测试

首次克隆后安装开发依赖与匹配浏览器：

```bash
npm ci
npx playwright install chromium
```

日常完整验证：

```bash
npm test
npm run test:visual
```

`npm test` 依次执行静态/语法、内容包、lobby/live/ops 单元测试，以及 ops、框架、证词、932×430 横屏战斗导演和完整玩家流程冒烟。`test:visual` 额外输出 932×430 大厅、寻访、名册、商店、关卡和档案截图。

Runner 优先使用项目本地 `playwright`；历史 Codex fallback 仅用于旧环境，不属于项目依赖。

测试输出位于 `tests/artifacts/smoke/` 与 `tests/artifacts/landscape/`，包括 JSON 报告、主菜单、三角色、升级、Boss、胜负结算、横屏战斗/阶段/战术结算和错误面板截图。

框架专项输出位于 `tests/artifacts/framework/`，覆盖旧档扩展字段迁移、官方示例服饰/道具/成就/档案、Image2 探索地图奖励持久化和故意损坏扩展隔离。
