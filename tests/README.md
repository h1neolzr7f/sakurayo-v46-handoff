# 浏览器冒烟测试

```powershell
python tools\static_check.py src\index.html
node --check tests\artifacts\static\index.extracted.js
python tools\check_content_packs.py
node tests\framework_smoke.mjs src\index.html
node tests\browser_smoke.mjs src\index.html
```

Runner 优先使用项目本地 `playwright`；若未安装，会使用 Codex `develop-web-game` 技能自带版本。独立环境可执行：

```powershell
npm install --save-dev playwright
npx playwright install chromium
```

测试输出位于 `tests/artifacts/smoke/`，包括 JSON 报告、主菜单、三角色、升级、Boss、胜负结算和错误面板全页面截图。

框架专项输出位于 `tests/artifacts/framework/`，覆盖旧档扩展字段迁移、官方示例服饰/道具/成就/档案、Image2 探索地图奖励持久化和故意损坏扩展隔离。
