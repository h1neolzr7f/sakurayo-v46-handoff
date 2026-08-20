# 接手检查清单

当前：**V4.6.4 测试版。** 公开玩家仓是 https://github.com/h1neolzr7f/sakurayo-zombietide 。
最新测试 APK：https://github.com/h1neolzr7f/sakurayo-v46-handoff/releases/download/v4.6.4/Sakurayo-ZombieTide-TEST-v4.6.4.apk
桌面名「测试版樱夜」，包名 `com.sakurayo.zombietide.test`，不会覆盖正式包。

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

横屏大厅、五房、镜界寻访（只收藏）、证词模式、局内 2 干员 DP、仿 Live2D。版本号是 4.6.4。

## 你接下来做

I2V 绿幕站桩、融合 skill/dash、寻访卡扩到 16、全量 verify、再发版。细节在 `docs/HANDOFF.md`。

## 不要做

- 再包 `update`
- 改存档键或清档
- 商店衣装直接卖永久伤害（寻访/构筑卡按星级加伤是正规则）
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
