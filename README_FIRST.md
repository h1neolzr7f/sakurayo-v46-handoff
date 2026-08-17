# 接手检查清单

当前：**V4.6.0 源码，未正式发版。** 公开玩家仓已发布 APK 仍是 v4.4.6。

## GitHub 在哪

| 项 | 值 |
|---|---|
| 开发仓 | https://github.com/h1neolzr7f/sakurayo-v46-handoff |
| 工作分支 | `cursor/bc-a381488d-90d5-4ff1-914f-6cabd630c2b2-074d` |
| 最新提交 | `fabbdfa` |
| 草稿 PR | https://github.com/h1neolzr7f/sakurayo-v46-handoff/pull/1 |
| `main` | 还没有这批 4.6 精修 |
| 公开玩家仓 | https://github.com/h1neolzr7f/sakurayo-zombietide |

代码已经推到开发仓草稿 PR。**没有合进 `main`，也没有对玩家发 4.6.0。**

按这个顺序读：

1. [README.md](README.md)
2. [docs/HANDOFF.md](docs/HANDOFF.md)
3. [AGENTS.md](AGENTS.md)
4. [docs/FINAL_UPGRADE_REPORT.md](docs/FINAL_UPGRADE_REPORT.md)
5. [docs/MAINTAIN.md](docs/MAINTAIN.md)

然后打开 `src/index.html`。存档键 `sakurayoV3`。不要清档。

## 立刻能跑

```bash
npm ci
npx playwright install chromium
npm test
npm run test:visual
```

Windows 也可：`powershell -File tools/verify.ps1`

## 这一版已经有了

横屏大厅、五房、16 卡寻访（只收藏）、证词模式、局内 2 干员 DP、真实眨眼、作战简报、四阶段机制条、Boss 阶段字幕、三角色技能演出、分层打击反馈、三相飞升签名。版本号仍是 4.6.0。

## 当前交付状态

候选版、全量回归、单入口和 Android Debug 已完成并上传到开发仓 PR。下一步是：原正式证书打 Release、实体横屏机长测、再决定是否合并 `main` / 同步公开仓。

## 不要做

- 再包 `update`
- 改存档键或清档
- 抽卡/商店卖永久伤害
- 改名 `startGame` / `update` / `draw` / `spawnEnemy` / `showDialogue` 却不改调用点
- 提交 `keystore.properties`、`local.properties`、APK、`assets/image2/source/`
- 卸掉模拟器上签名对不上的旧正式包（会清档）
- 删 `progress.md` 顶部 Original prompt
- 把竖屏重新做成主体验
- 重复做已经落地的 16 卡、闭眼帧、作战简报、Boss 字幕、飞升签名

## 目录

- `src/` 唯一代码基线
- `src/runtime/sakurayo-lobby.js` 大厅/寻访
- `src/runtime/sakurayo-shell.js` 缺系统的预览壳
- `src/runtime/sakurayo-live.js` 立绘
- `src/runtime/sakurayo-ops.js` 干员
- `android-app/app/src/main/assets/game/art` 运行时美术
- `release/` 本机同步的单入口与 Debug APK（不作为公开发版）
