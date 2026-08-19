# 第三期开工单（24 融合进残片池）

完整提示词：`docs/CURSOR_PROMPT_PHASE3.md`。不要和 `CURSOR_PROMPT_P2.md`（严重度 P2）或 `CURSOR_PROMPT_PHASE2.md`（第二期）混用。

## 基线

- `origin/main` @ `0657136`（第二期已合并）
- 新分支 `cursor/phase3-fusions-5030`
- 版本仍 **4.6.0**，存档键仍 `sakurayoV3`

## 人只露脸 3 次

1. **开工**：已开。施工 PR https://github.com/h1neolzr7f/sakurayo-v46-handoff/pull/12
2. **认人**：先打回 `fusion_shadowmage`、`fusion_necrospore`。`dae7774` 两张过了。见 `docs/PHASE3_FACE_REVIEW.md`。
3. **收工**：可以合并。你点合并 #12。不要升 4.6.1。

## 已锁死（开工后不准改）

- 24 张全是 SSR，`kind=fusion`，id = `fusion_{现网FUSION.id}`
- 残片池第一次有真 SSR；want=SSR 必须给融合，禁止再降成 SR
- 硬保/软保优先未拥有融合，禁止残件；履约清 pity
- 融合能 Spark；残件/转职不能
- 拥有：pair 两校倾向 ×1.6，全伤害 +0.8%；无融合套装
- 主脸小夜 10 / 绫 6 / 凛音 8，见提示词表
- 飞升、镜头不做

## Agent 四刀

0 摸底（应仍是 ~1700 R / 300 SR / 0 SSR）→ 1 数据+仓库融合页 → 2 并行出图 → 3 加成与断言改写 → 4 清虫停
