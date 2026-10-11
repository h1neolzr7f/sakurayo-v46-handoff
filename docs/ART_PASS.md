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

## ② 割草地面与可读性
- 新地面素材 `stages/stage_{1..4}/ground_v3.webp`（gpt-image-2，俯视中式科技广场：六角 / 矩形石金属板、极淡青色电路缝、褪色云纹刻痕）。
- `SakurayoLifecycle.groundMosaic`：1024² 素材切 4 块，在 2048² 画布上 4×4 随机挑块 + 随机 90° 旋转 / 翻转，统一 `saturate(.55) contrast(.78) brightness(.82)`，块缝画暗色地砖缝，再散布 26 个低透明度装饰（六角框、云纹弧、导流虚线）。按图片缓存，平铺周期从 768 px 变成 2048 px。
- 轮廓光：`SakurayoLifecycle.rimSprite` 给精灵离屏烘一圈 2–3 px 令牌色描边（自机 primary-strong、普通敌人 danger、精英 rare-ssr），按图片缓存，战斗中零额外开销。
- 影子：敌人改为按精灵尺寸缩放的贴地椭圆影子；宝石加影子、白色描边和高光面。
- 尺寸：自机 ×1.30（桌面）/ ×1.16（窄屏），非 Boss 敌人 ×1.15，宝石 ×1.4。
- **可读性测试** `tools/readability.py`（已接入 verify.sh）：按运行时同样的处理计算地面，要求地面 p10–p90 亮度跨度 ≤ 0.06、平均饱和度 ≤ 0.22；19 个精灵（三名自机 + 全部敌人）与地面 WCAG 对比 ≥ 3.0，宝石 ≥ 4.5。第一次跑时 mirrorblade / tank / bomb 只有 2.7–2.99，把敌人轮廓光不透明度从 0.6 提到 0.8 后最低 3.28。
