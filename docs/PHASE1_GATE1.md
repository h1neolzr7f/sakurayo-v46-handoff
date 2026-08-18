# 第一期检查点 1 — 三页空壳 + 残件加成

2026-08-18。版本仍 **4.6.0**。存档键仍 `sakurayoV3`。未升 4.6.1。

## 交出

- 寻访三页：`remnant` / `fashion` / `weapon`。标题「镜界寻访」。价格 160 / 1440。
- 软保 65、硬保 80、碎镜片 / Spark 200 显示。残片池只有旧 8 张 R 残件。
- 时装 / 武器第一期空壳，`pull` 返回 `{ok:false, reason:"empty"}`，toast「本池尚未写入」。
- 底栏第二格「仓库」，抽屉标题「镜界仓库」。筛：残件 / 基础（基础页「后续写入」）。
- `normalizeOps` 补齐 `shards` / `pool` / `rosterTab` / `fashion` / `weapon`。旧 `pity/owned/pulls` 仍是残片池。
- 默认仍点亮 `sayo_echo`、`aya_petal`。`last_witness` 标题「碎镜后的人」，男人图未覆盖。
- 残件拥有即生效、重复不加，在 `resetP` 里乘一次。残件不能吃 SSR 硬保（该档没货降到 R）。
- 揭示层仍挂 `#gachaDrawer`。传说角标 CSS 已就位。
- **未**把 14 张职业 id 写进存档逻辑。

## 门 A

| 脚本 | 结果 |
|---|---|
| `python3 tools/static_check.py src/index.html` | 绿 |
| `node --check` 抽出 JS | 绿 |
| `node tests/lobby_unit.mjs` | 绿 |
| `node tests/live_unit.mjs` | 绿 |
| `node tests/ops_unit.mjs` | 绿 |
| `node tests/framework_smoke.mjs` | 绿 |
| `node tests/browser_smoke.mjs` | 绿（51 checks） |

## 记账

- P1：430×932 竖屏 `charSelectPanel`（z-index 6）挡住底栏左两格寻访/仓库。检查点 6 同类再修，本点不改大厅布局。
- P2：无。
