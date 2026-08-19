# 第二期刀 0 — 门 A 摸底

2026-08-19。不改玩法，只记基线。版本仍 **4.6.0**。存档键仍 `sakurayoV3`。基线 `origin/main` = `491e548`（镜界寻访第一期）。

## 现状（残片池 / 仓库）

- 寻访三页：残片 / 时装 / 武器。价格 160 / 1440。软保 65、硬保 80、Spark 200。
- 残片池：8R 残件 + 11R 基础 + 3SR 基础（shrine / gun / cult）。**还没有 28 张转职。**
- 稀有度滚动：N/R 落到 R；SR 落到 SR；want=SSR 且无 SSR 时给最高档 SR 并清 pity。
- 仓库页签：残件 / 基础 / 时装 / 武器 / 编年。转职、融合页尚未接线。
- `shop40.ops` 已有 `shards / pool / rosterTab / fashion / weapon`。禁止新顶层 key。
- 旧 8 张、14 张 `school_*`、6 张传说时装/武器、`banner_bg` / `card_back` / `hero_*` 均在，未覆盖。

## 残片 2000 抽（seed `0x51c0de`，未改代码）

| 档 | 次数 | 占比 |
|---|---:|---:|
| N | 0 | 0 |
| R | 1700 | 0.85 |
| SR | 300 | 0.15 |
| SSR | 0 | 0 |

R / 2000 = 0.85 ≥ 0.55。SR / 2000 = 0.15 ∈ [0.04, 0.25]。R > SR×3（1700 > 900）。**R 远多于 SR，不是 99% SR。**

硬保 80（pity=79，rng=0.999）：`school_cult`，kind=`school`，不是残件；pity 清零。

## 门 A

| 脚本 | 结果 |
|---|---|
| `python3 tools/static_check.py src/index.html` | 绿 |
| `node --check` 抽出 JS | 绿 |
| `node tests/lobby_unit.mjs` | 绿 |
| `node tests/live_unit.mjs` | 绿 |
| `node tests/ops_unit.mjs` | 绿 |
| `node tests/framework_smoke.mjs` | 绿（8 checks） |
| `node tests/browser_smoke.mjs` | 寻访/仓库/三角色开局/升级/Boss 75·50·25/结算重开均绿。末尾「孤证试炼」点 `#skill` 超时（按钮 `ready44` 但不可见）。本刀未改玩法，记为基线已有，不先修。 |

## 抄死未动

价格 160 / 1440。爆率 N 0.70 / R 0.22 / SR 0.07 / SSR 0.01。硬保 80。默认点亮 `sayo_echo`、`aya_petal`。未升 4.6.1。未把 28 张转职写进池。
