# ART_PASS：美术整改（细节决定成败）

对比图目录：`/workspace/sakurayo-shots/art-pass/`。截图来自 `tools/sweep.mjs`（修前用 `git worktree` 检出 0afe074 跑同一脚本），拼图用 `tools/compare_pair.py`。素材全部由中转站 gpt-image-2 生成，社区图片只作参考。

## ⑥ 统一组件 `src/runtime/sakurayo-ui-kit.js`
- Canvas：`SyKit.bar`（切角血条 + 白色延迟扣血 + 虚血段）、`SyKit.meter`（分段发光气槽 + 等级数字）、`SyKit.panel`（切角信息面板）、`SyKit.hex / diamond / cut`。
- DOM：`.sykBar`、`.sykPanel`、`.sykBtn.dia / .sykBtn.hex`（菱形 / 六边形按键，`.on` 发光）。
- 只用设计令牌（`SakurayoTok` / `var(--c-*)`），文件名符合 `sakurayo-ui-*.js`，受 `tools/check_colors.py` 严格检查。

## ③ 格斗
- **推挤（MUGEN `size.ground.front/back`、`size.height`）**：每人一个推挤框（地面前 32 / 后 28，空中 28，高 190、蹲 120）。横纵都重叠才推；一方贴版边时另一方承担全部位移；两轮迭代硬分离。投技距离 62→70，保证贴身仍能投。`tests/duel_push_unit.mjs` 跑 18 场 AI 对局逐帧验证零重叠，另测版边和完全重合。平衡回归：Boss 满构筑胜率 0.764（要求 0.75–0.85），三角色用时比 1.23。
- **影子**：脚下径向渐变椭圆，始终贴地，离地越高越小越淡（跳跃时看得清落点）。
- **HUD（崩三 × 拳皇）**：切角血条带斜纹刻度，受伤后白段停 0.6 s 再追上；六边形头像框（我方强调色、敌方稀有紫 / Boss 危险红）；六边形计时，≤10 s 变红；菱形回合胜点；POWER 三段气槽满段发光、显示等级 / MAX；斜体大号连击数 + HITS，连段结束后停留 1 s。气槽从底部移到血条下方，给触屏键让位。
- **触屏键**：六边形摇杆座 + 菱形摇杆头；轻 / 重 / 投 / 防为菱形，必杀 / 超必为六边形，超必有气时呼吸发光。
- **出招表**：底部一行小字改为顶部“出招表”按钮，点开是切角面板（9 条指令），可滚动。
