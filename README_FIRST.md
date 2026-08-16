# 接手检查清单

当前：**V4.6.0 源码，未发版。** 公开玩家仓是 https://github.com/h1neolzr7f/sakurayo-zombietide ，已发布 APK 仍是 v4.4.6。

按这个顺序读：

1. [README.md](README.md)
2. [docs/HANDOFF.md](docs/HANDOFF.md)
3. [AGENTS.md](AGENTS.md)
4. [docs/PLAN_V46_ERYOU.md](docs/PLAN_V46_ERYOU.md)
5. [docs/MAINTAIN.md](docs/MAINTAIN.md)

然后打开 `src/index.html`。存档键 `sakurayoV3`。不要清档。

## 立刻能跑

```powershell
start src/index.html
node tests/lobby_unit.mjs
node tests/live_unit.mjs
node tests/ops_unit.mjs
```

全量：`powershell -File tools/verify.ps1`

## 这一版已经有了

横屏大厅、五房、镜界寻访（只收藏）、证词模式、局内 2 干员 DP、仿 Live2D。版本号仍是 4.6.0。

## 当前交付状态

16 卡寻访、真实随机眨眼、六套融合 skill/dash、横屏作战简报、四阶段机制条、双栏战术结算、全量回归、单入口和 Android Debug 已完成。先读 `docs/FINAL_UPGRADE_REPORT.md`；下一步是使用原正式证书做 Release，并在实体横屏 Android 设备完成覆盖安装与长时性能验收。

## 不要做

- 再包 `update`
- 改存档键或清档
- 抽卡/商店卖永久伤害
- 改名 `startGame` / `update` / `draw` / `spawnEnemy` / `showDialogue` 却不改调用点
- 提交 `keystore.properties`、`local.properties`、APK、`assets/image2/source/`
- 卸掉模拟器上签名对不上的旧正式包（会清档）
- 删 `progress.md` 顶部 Original prompt
- 把竖屏重新做成主体验

## 目录

- `src/` 唯一代码基线
- `src/runtime/sakurayo-lobby.js` 大厅/寻访
- `src/runtime/sakurayo-live.js` 立绘
- `src/runtime/sakurayo-ops.js` 干员
- `android-app/app/src/main/assets/game/art` 运行时美术
