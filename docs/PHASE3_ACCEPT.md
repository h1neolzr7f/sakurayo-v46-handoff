# 第三期验收

2026-08-19。对照 `docs/CURSOR_PROMPT_PHASE3.md` 完成定义。施工 PR：https://github.com/h1neolzr7f/sakurayo-v46-handoff/pull/12。

**结论：可以合并。** head `dae7774`。版本仍 **4.6.0**。没有交 APK，也没有动密钥。

并之前先改掉正文「未收工、不要合并」，再标 ready，再 merge commit。不要升 4.6.1。

- `0b992ff`：四刀做完。逻辑过，封面打回 `fusion_shadowmage`、`fusion_necrospore`。
- `dae7774`：只换这两张 webp + 施工 `SWEEP_LOG`。其余 22 张哈希与 `0b992ff` 相同。lobby / index / 测试未动。

## 完成定义

| # | 条 | 结果 |
|---|---|---|
| 1 | 仓库融合 24 格，未抽卡背，抽到能读四段；不再写「后续写入」 | 过 |
| 2 | 未抽时没有融合真名、没有 `fusion_*.webp` | 过 |
| 3 | 24 张能在残片池抽到；SSR 桶只含 `fusion_*` | 过。三籽 2000 抽各抽出 24 个不同 fusion_* |
| 4 | 拥有 pair 两校 ×1.6、全伤害 +0.8%，重复不加 | 过 |
| 5 | 残片 2000 抽 R 远多于 SR；SSR 在 1%～8% | 过。`0x51c0de` 1700/262/38（1.9%）；`0x12345678` 1691/273/36；`0xabcdef01` 1703/260/37 |
| 6 | 残件不能 Spark、不能吃硬保；硬保是融合 SSR 并清 pity；融合能 Spark | 过 |
| 7 | 新档+缺字段旧档，键 `sakurayoV3` | 过 |
| 8 | school_* / job_* / 旧 8 / 传说 / 公共图未被覆盖 | 过 |
| 9 | 门 A 绿 | 施工记 static / lobby / live / ops / framework / browser 51。本轮未改逻辑 |
| 10 | 版本仍 4.6.0 | 过。未交 APK / 密钥 |
| 11 | SWEEP_LOG 有第三期记录 | 施工仓有。本仓本行补大脑验收 |

## 认人复检（两张打回）

### `fusion_shadowmage`（`dae7774` 过）

绫，银白发。手枪在腰侧前伸，枪口朝左下，不贴脸、不朝天、不对着镜头。太刀在腰。右侧裂镜只剩火冰碎晶，没有第二张脸。`0b992ff` 那张枪对镜头+镜里第二张脸作废。

### `fusion_necrospore`（`dae7774` 过）

凛音，黑红。魂菇从左肩/锁骨长出，菌丝爬上胸口和左臂。左手是碰到它们，不是捧着。长刀当杖拄地。表情嫌恶带倦。`0b992ff` 那张捧菇立绘作废。

其余 22 张仍按 `docs/PHASE3_FACE_REVIEW.md` 可留，本轮未改。
