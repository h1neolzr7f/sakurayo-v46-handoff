# 下一轮三份验收（指挥官）

2026-08-19 复验。基线 `origin/main` 仍是 `4176014`。三份都还在 PR，**都没进 main**。施工已按打回改完。

| 项目 | PR | head | 结论 |
|---|---|---|---|
| 镜头 | [#14](https://github.com/h1neolzr7f/sakurayo-v46-handoff/pull/14) `cursor/camera-world-7db2` | `c2df4f8` | **夹边已补。可以合并。** ready。 |
| 换拼卡 | [#15](https://github.com/h1neolzr7f/sakurayo-v46-handoff/pull/15) `cursor/fashion-art-5030` | `ca1ee17` | **逻辑过，认人抽查可留。** 仍是 draft。你点过后标 ready 再并。 |
| 编年 | [#13](https://github.com/h1neolzr7f/sakurayo-v46-handoff/pull/13) `cursor/chronicle-sides-5030` | `2593e1a` | **4+4 已按锁死表改完。可以合并。** ready。 |

版本都还是 4.6.0。卡池数字没被动。换拼卡和编年不抢 `sakurayo-lobby.js`，可先并哪份都行；#14 改战斗，单独并。

## 镜头 #14

有：`sakurayo-camera.js` 4×2；`WORLD=4W×2H`；人开局世界中心；`spawnOutside` 从视口四边外刷；`draw` 用 `apply` 平移；HUD 仍是 `position:fixed`；`update` 没有新包装层。

`c2df4f8` 补了 `clampCam`：`follow` / `snap` / `targetOf` 都夹到 `[0, world-view]`。`camera_unit` 覆盖左上/右下贴边。未改卡池、未升 4.6.1、未再包 `update`。

## 换拼卡 #15

18 张互不相同；`neon≠radio_bat`、`keiko≠wood`；6 传说和旧 8/14/28/24/公共图哈希未动；四段已加长；`lobby_unit` 绿。本环境抽查 12 张：发色兵器对，绫枪朝下，两对重复已拆成不同构图。施工未再改（正确）。

## 编年 #13

一个页签、三段、小夜五条未改 `sakurayo-lobby.js`、不进池。独立 `sakurayo-chronicle.js` 包装 `renderRoster`。

`14f94c8` / `2593e1a` 已改成锁死 4+4：

- 神代绫 · 作废的工号：`ch_aya_badge` / `void` / `petal` / `seam`
- 黑羽凛音 · 未署名的刀：`ch_rion_page` / `mound` / `unsaid` / `bride`

旧 id（`ch_aya_sign` 等）已删。顶栏没改成「三角色 · 未写完的夜」。lore 无 ≤8 汉字句。`chronicle_unit` / `lobby_unit` 绿。

## 人点合并顺序

1. #15 换拼卡：draft → ready → merge
2. #13 编年：merge
3. #14 镜头：单独 merge（改战斗）

并完 `main` 才会离开 `4176014`。不升 4.6.1，不交 APK。
