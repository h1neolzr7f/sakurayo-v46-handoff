# 下一轮三份验收（指挥官）

2026-08-19。基线 `origin/main` 仍是 `4176014`。三份都还在 PR，**都没进 main**。

| 项目 | PR | head | 结论 |
|---|---|---|---|
| 镜头 | [#14](https://github.com/h1neolzr7f/sakurayo-v46-handoff/pull/14) `cursor/camera-world-7db2` | `566697d` | **未过。** 4×2 和视口外刷怪有了，镜头没夹在世界边。不要合并。 |
| 换拼卡 | [#15](https://github.com/h1neolzr7f/sakurayo-v46-handoff/pull/15) `cursor/fashion-art-5030` | `ca1ee17` | **逻辑过，认人抽查可留。** 仍是 draft。你点过后再并。 |
| 编年 | [#13](https://github.com/h1neolzr7f/sakurayo-v46-handoff/pull/13) `cursor/chronicle-sides-5030` | `36a93bd` | **功能过，锁死表没按。** 他们做的是 3+3 和另一套标题。你定：收下，或打回改成 4+4。 |

版本都还是 4.6.0。卡池数字没被动。lobby 和镜头两份没抢同一文件。

## 镜头 #14

有：`sakurayo-camera.js` 4×2；`WORLD=4W×2H`；人开局世界中心；`spawnOutside` 从视口四边外刷；`draw` 用 `apply` 平移；HUD 仍是 `position:fixed`；`update` 没有新包装层；`camera_unit` 本环境绿。

缺：`follow` / `snap` **不夹** `camX/camY` 到 `[0, WORLD-view]`。人走到世界左边，相机会出负值，露出半屏空白。围栏写的是 `camX = clamp(P.x - W/2, 0, WORLD_W - W)`。

施工只补镜头夹边。不要改卡池。补完再收工。

## 换拼卡 #15

18 张互不相同；`neon≠radio_bat`、`keiko≠wood`；6 传说和旧 8/14/28/24/公共图哈希未动；四段已加长；`lobby_unit` 绿。本环境抽查 12 张：发色兵器对，绫枪朝下，两对重复已拆成不同构图。

## 编年 #13

一个页签、三段、小夜五条未改 `sakurayo-lobby.js`、不进池。另文件包装 `renderRoster`，避免和换拼卡抢 lobby。

他们按自己写的提示词做了 **绫 3 / 凛音 3**，标题是「未结案的夜 / 未收剑的夜」。指挥官围栏锁的是 **4+4** 和「作废的工号 / 未署名的刀」那 8 个 id。正文能对上零号企业、剑冢，不是另起宇宙。
