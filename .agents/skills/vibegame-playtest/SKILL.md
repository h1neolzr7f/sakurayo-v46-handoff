---
name: vibegame-playtest
description: Run a VibeGame-style adversarial playtest on 樱夜·尸潮 in Cursor Cloud or local Agent. Use when the user mentions VibeGame, 对抗验收, playtest, 局内验收, auditor/player/reviewer, or wants a cloud agent to verify upgrade, Boss phases, dialogue overlap, and restart. Do not use this to install Phaser, clone tettethu/VibeGame, or rewrite the game.
---

# VibeGame 式对抗验收（樱夜·尸潮）

这个 skill 把 [VibeGame](https://github.com/tettethu/VibeGame) 的「生成和验收拆开」接到本仓现有闭环上。

执行者是 **当前 Cursor Agent**，不是南京大学那套 Claude Code / Codex 八人小队，也不要去装 Phaser。

需要原版 VibeGame 引擎时，先读 [references/limits.md](references/limits.md)。默认不要走那条路。

## 何时用

- 用户说「用 VibeGame」「对抗验收」「云端 skill」「playtest」
- 改完局内/大厅后要按 AGENTS.md 做交付验收
- 需要独立角色来找回归，而不是实现者自己说一声过了

## 禁止

- 不要 `git clone https://github.com/tettethu/VibeGame` 当本仓依赖
- 不要把 `src/index.html` 迁到 Phaser / Godot / Unity
- 不要改名 `startGame` / `update` / `draw` / `spawnEnemy` / `showDialogue` 却不改调用点
- 不要改存档键 `sakurayoV3`，不要清档
- 不要给 `update` 再加包装层
- 商店/寻访不卖永久伤害

## 角色（用 Cursor 子代理，不要再起外部 CLI）

实现和验收必须拆开。能开子代理时，实现者不要兼终审。

| 角色 | 做什么 | 不做什么 |
| --- | --- | --- |
| orchestrator | 当前对话主人。写验收范围、分派、汇总、决定是否返工 | 不自己改核心战斗逻辑来「凑过」 |
| designer | 对照 `docs/HANDOFF.md` 和玩法边界，列出本轮必须保住的体验 | 不写实现代码 |
| auditor | 静态：语法、调用点、存档键、碰撞/对象上限、UI 层级 | 不跑游戏、不改玩法 |
| player | 运行时：开局、攻击、升级、Boss 转阶段、剧情/吐槽、结算重开 | 不改产品规则来让测试变绿 |
| reviewer | 对照用户请求和 GDD/HANDOFF 做终审，给出通过或返工清单 | 不直接改代码 |

子代理类型优先：`explore`（读代码）、`generalPurpose`（改测试/小修）、`computerUse`（真开页面点）。没有 `computerUse` 时，player 用 `tests/*.mjs` + 能跑的浏览器冒烟代替，并在结论里写明「未做真机点击」。

## 流水线

1. **对齐范围**  
   用 5 行写清：改了哪条路径、三个角色是否都要验、要不要打到 Boss 转阶段。

2. **Auditor（静态）** 至少跑：

   ```bash
   python tools/static_check.py src/index.html
   node tests/lobby_unit.mjs
   node tests/live_unit.mjs
   node tests/ops_unit.mjs
   node tests/framework_smoke.mjs
   ```

   有时间再跑 `node tests/browser_smoke.mjs`。Windows 全量是 `powershell -File tools/verify.ps1`。  
   另外人工核对：存档键仍是 `sakurayoV3`；没有恢复「每颗子弹遍历全部敌人」。

3. **Player（运行时）** 按 AGENTS.md 交付清单，能做几条做几条，做不到的标 `blocked`：

   1. 语法检查通过  
   2. 新档和缺字段旧档都能进主菜单  
   3. 三个角色 10 秒内能看到角色、怪物、攻击  
   4. 至少选一次升级，选完战斗继续  
   5. Boss 进入 75% / 50% / 25%  
   6. 剧情和吐槽不同时挡操作  
   7. 死亡/通关结算可关，并能重新开局  

   模态层出现时必须暂停并收起其它文本。

4. **Reviewer**  
   任一条失败 → 写成返工任务（文件 + 现象 + 期望），交回实现，不要在审查角色里直接大改。

5. **回复用户**  
   用中文给一张表：检查项 / 结果（通过·失败·未做） / 证据（命令输出或截图路径）。先写结论。

## 本仓锚点

- 代码基线：`src/index.html`，运行时在 `src/runtime/*.js`
- 大厅/寻访：`src/runtime/sakurayo-lobby.js`
- 立绘：`src/runtime/sakurayo-live.js`
- 干员：`src/runtime/sakurayo-ops.js`
- 约束：根目录 `AGENTS.md`、`docs/HANDOFF.md`、`README_FIRST.md`
