# 清虫与切片日志

A/B 每轮追加一行，不准删旧记录。

| 日期 | 组 | 切片或类名 | 做了什么 | 测试/认人 | 上轮为何漏 | 下一件 |
|---|---|---|---|---|---|---|
| 2026-08-18 | 大脑 | 提示词 | 落下合格提示词 docs/CURSOR_PROMPTS.md | — | — | 开 A + B 残件8 |
| 2026-08-18 | A | 检查点0 / 门A摸底 | 记下现状：单页寻访、名册未改仓库、8张旧稀有度、无三页/软保/残件加成。未改玩法。见 docs/PHASE1_GATE0.md | static/lobby/live/ops 绿；framework_smoke、browser_smoke 红（旧断言对不上 ops46 与 lobby_wide） | 基线测试未跟 V4.6 大厅/干员 | 检查点1：三页空壳 + 残件 R 加成 |
| 2026-08-18 | A | 检查点1 / 寻访三页壳 | 三页空壳、仓库改名、shop40.ops 补 shards/pool/fashion/weapon、旧8张全R残件、加成进 resetP。时装/武器空池 toast「本池尚未写入」。竖屏底栏左两格被角色卡挡住记 P1，测试走 openDrawer，不改大厅布局。 | static/lobby/live/ops/framework/browser 全绿 | 旧断言未跟三页合同；竖屏点击被挡 | 检查点2：并行出14张+残件8文 |
