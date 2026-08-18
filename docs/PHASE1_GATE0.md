# 第一期检查点 0 — 门 A 摸底

2026-08-18。不改玩法，只记基线。版本仍 **4.6.0**。存档键仍 `sakurayoV3`。

## 现状（寻访 / 仓库）

- 寻访单页，标题已是「镜界寻访」。副标仍写「只进名册 · 不改枪口」。
- 底栏第二格仍是「名册」；抽屉标题仍是「证词名册」。
- 卡池只有旧 8 张。稀有度仍是 N/N/R/R/R/SR/SR/SSR，不是提示词〇要求的全 R 残件。
- 文案仍写「不改枪口 / 不加伤害」。`last_witness` 图是男人，未改画。
- 没有残片 / 时装 / 武器三页，没有软保 65、碎镜片、Spark。
- `shop40.ops` 只有 `pity / pitySR / pulls / tenPulls / owned / last / cheatUsed`。
- 残件加成未进 `resetP`。商店旧皮肤仍不卖伤害。
- 旧 8 张 webp 都在 `game/art/gacha/`，未覆盖。

## 门 A

| 脚本 | 结果 |
|---|---|
| `python tools/static_check.py src/index.html` | 绿 |
| `node --check` 抽出 JS | 绿 |
| `node tests/lobby_unit.mjs` | 绿 |
| `node tests/live_unit.mjs` | 绿 |
| `node tests/ops_unit.mjs` | 绿 |
| `node tests/framework_smoke.mjs` | 红：`combat:after-draw` 现有 `core.ops46` 排第一，断言仍写旧四项 |
| `node tests/browser_smoke.mjs` | 红：大厅背景已是 `ui/lobby_wide.webp`，断言仍要 `cover_v36_main_god.webp` |

两条红都是旧断言没跟上已落地的 V4.6 大厅 / 干员钩子，不是本轮引入。检查点 1 接线后改对应测试，不删、不放宽版本 `"4.6.0"`。

## 抄死未动

价格 160 / 1440。爆率 N 0.70 / R 0.22 / SR 0.07 / SSR 0.01。硬保 80。默认点亮 `sayo_echo`、`aya_petal`。未升 4.6.1。
