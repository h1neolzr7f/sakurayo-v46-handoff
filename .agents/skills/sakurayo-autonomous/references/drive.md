# 运行时怎么开、怎么验

普通打开 `src/index.html` **不会**暴露测试 API。自动化必须带 `?test=1&debug=1`。

教程未完成时 `startGame` 会打开教程并 return。隔离测试先点掉 `#tutorialSkip37` 或 `#tutorialNext37`。

`#dialogue` 点击即下一句，没有 `#next`。

## 常用 `__SAKURAYO_TEST__`

| API | 用途 |
| --- | --- |
| `selectCharacter(id)` | `sayo` / `aya` / `rin` |
| `start()` | 开局 |
| `dismissDialogue()` | 清对话直到不在 dialogue |
| `protectPlayer()` / `freezeProgression()` | 避免测手感时暴毙或乱升级 |
| `attackNow()` / `dashNow()` | 立刻攻击/冲刺 |
| `spawnEnemyNear(type, distance)` | 近处刷怪 |
| `triggerUpgrade()` / `chooseUpgrade(index)` | 升级并点第 N 项 |
| `spawnBossNow()` / `setBossHpRatio(r)` | 拉 Boss、打到转阶段 |
| `bossVisualState412()` | 看 phase |
| `killPlayer()` / `finish(win)` / `backMenu()` | 结算与回大厅 |
| `lobby46()` / `pullGacha46(n)` / `liveSnapshot46()` | 局外 |
| `saveSnapshot()` | 查旧档补齐，键必须仍是 `sakurayoV3` |

读状态：`window.render_game_to_text()`（仅测试模式）。

## AGENTS.md 七条怎么对到 API

1. 语法：`bash tools/verify.sh` 前半段。
2. 旧档：`localStorage` 写入缺字段的 `sakurayoV3`，打开后 `saveSnapshot()`。
3. 三角色：分别 `selectCharacter` → 跳过教程 → `start` → `spawnEnemyNear` → `attackNow`，10 秒内要有角色、敌人、子弹或刀。
4. 升级：`triggerUpgrade` → 看见 `#choices` → `chooseUpgrade(0)` → `state==="play"`。
5. Boss：`spawnBossNow`，把 HP 收到 0.74 / 0.49 / 0.24，确认 phase 为 2 / 3 / 4，不能一次跳过。
6. 剧情：对话出现时 `#radio` 和系统提示应收起；`dismissDialogue` 后战斗继续。
7. 结算：`killPlayer` 或 `finish(true)`，关结算，`start` 再开一局。

`browser_smoke.mjs` 已经覆盖其中大部分。全绿则这七条算过；红了先修再谈优化。

## 视口

主验收视口仍是 **430×932**。大厅布局另看 **932×430**。不要把竖屏当成主体验。
