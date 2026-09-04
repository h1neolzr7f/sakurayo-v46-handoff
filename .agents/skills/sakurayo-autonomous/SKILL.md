---
name: sakurayo-autonomous
description: Autonomously optimize and accept 樱夜·尸潮. Use when the user wants 自主优化, 甩手掌柜, 自己改自己验, optimize and verify, cloud unattended polish, or a skill that improves the game then gates on tests. Do not use to generate a new Phaser/VibeGame project.
---

# 樱夜·尸潮 — 自主优化验收

用户要的是：**自己找最低分项、自己改、自己验、不过就返工**，不要只出计划。

执行者是当前 Cursor Agent。默认保留 `src/index.html` + `src/runtime/*.js`。不要克隆 VibeGame，不要迁 Phaser / Godot / Unity。

验收细则见 [references/constraints.md](references/constraints.md)、[references/scorecard.md](references/scorecard.md)、[references/drive.md](references/drive.md)。

## 何时用

- 「自主优化」「自己验收」「甩手掌柜」「继续打磨」
- 云端开着不管，要看得见的成品提升
- 只要验收、不改代码时改走 `/vibegame-playtest`

## 硬规则

- 不问用户能自己决定的事。只有密钥、签名、不可逆产品转向才停。
- 先改再写总结。一轮只做一个可验收切片，做完必须过门再开下一刀。
- 实现者和终审不能是同一个子代理。
- 存档键 `sakurayoV3`。不清档。不给 `update` 加包装层。
- 不改名 `startGame` / `update` / `draw` / `spawnEnemy` / `showDialogue` 却漏调用点。
- 不恢复无界子弹碰撞。实体保持上限。
- 寻访/商店不卖永久攻击、生命、暴击。
- 不提交密钥、`local.properties`、APK、`assets/image2/source/`。
- 版本号仍是 4.6.0，除非用户明确要求发版。
- 正式 UI 字由游戏渲染，生图不要写中文/英文。

## 主循环（重复直到门过或硬阻塞）

### 0. 读现状（每会话一次）

读 `README.md`、`docs/HANDOFF.md`、`AGENTS.md`、`README_FIRST.md`、`docs/PLAN_V46_ERYOU.md`。冲突时：效果优先以 README 为准，但**本 skill 默认不换引擎**。

### 1. 评分，锁最低桶

按 [references/scorecard.md](references/scorecard.md) 给 13 项打 1–10。只修**最低分且本轮能做完**的一项。并列时按这个顺序：

1. 稳定性 / 验收门（红就先修测试和崩溃）
2. 大厅立绘完整、黑边、UI 挡操作
3. 三角色一致（大厅 / 头像 / 卡面 / 战斗）
4. 缺图回退（融合 skill/dash 禁止借错图）
5. 局内手感、升级、Boss 75/50/25、剧情叠字
6. 寻访卡质量（不超过 16）
7. VFX / 演出 / 音频

缺 `docs/ART_BIBLE.md` 且本轮动角色图：先写一页 Art Bible（发色、发型、瞳色、服装、武器、气质），再生图。

### 2. 写 5 行任务单（不要停在这里）

```
切片:
保住:
改哪些文件:
怎么验:
不做:
```

### 3. 实现

能并行就开子代理：`explore` 定位，`generalPurpose` 改代码，Image 补图，`computerUse` 点界面。美术走：生成/编辑 → 查手脸武器/透视/边缘/文字 → 写入 `android-app/app/src/main/assets/game/art` → 游戏里截图 → 再改。第一张图不是终稿。

角色绿幕用 `#00ff00`。缺融合动作：回退到该融合自己的 idle，**不要借别的融合的图**。

### 4. 验收门（必须跑，失败就返工）

实现中途可先跑（跳过所有 Playwright：`ops_smoke` / `framework_smoke` / `browser_smoke`）：

```bash
VERIFY_SKIP_BROWSER=1 bash tools/verify.sh
```

过门必须再跑 Linux 全量（与 `tools/verify.ps1` 对齐）：

```bash
bash tools/verify.sh
```

缺 Playwright 时先装再跑：

```bash
npm i -D playwright
npx playwright install chromium
bash tools/verify.sh
```

装不了就把 `browser_smoke` 标 `blocked`，仍须跑完 `verify.sh` 里它之前的步骤，并用 [references/drive.md](references/drive.md) 或 `computerUse` 补 AGENTS.md 那 7 条。

**门没过不许开下一刀，不许对用户说完成。**

### 5. 对抗终审

另开一个不改产品代码的 reviewer：对照任务单 + 截图 + 测试输出。失败写成「文件 + 现象 + 期望」，交回实现。最多返工 3 轮；第 4 次仍失败就停，报告阻塞，不要用改规则把测试变绿。

### 6. 回复

用中文，先结论。必须有：

- 本轮切片和是否过门
- 评分表（改前 → 改后），最低分项标出来
- 验收表：检查项 / 通过·失败·未做 / 证据
- 下一刀是什么（已开做或留给下次）

## 默认切片（文档未另指定时按此做）

1. `ui/lobby_wide.webp` 左右黑边、立绘头完整、出击不被挡
2. 融合缺 `anim_skill.webp` / `anim_dash.webp` 时的正确回退
3. 三角色 10 秒内可见角色、怪物、攻击
4. 升级可选且选完继续
5. Boss 75% / 50% / 25% 不跳阶段
6. 剧情出现时吐槽和系统提示收起
7. 结算可关并再开一局

## 本仓锚点

- `src/index.html`、`src/runtime/sakurayo-lobby.js`、`sakurayo-live.js`、`sakurayo-ops.js`
- 测试钩子：`?test=1&debug=1` 下的 `window.__SAKURAYO_TEST__`
- 运行时图：`android-app/app/src/main/assets/game/art`
