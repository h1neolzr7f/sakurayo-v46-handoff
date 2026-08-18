# 大厅顶栏拆叠（独立分支，不覆盖其他进程）

分支：`cursor/lobby-topbar-unstack-cadf`
从 `cursor/combat-director-hud-cadf` 分出，只改 `src/runtime/sakurayo-layout52.js`（ops 启动后加载）。

- 换角圆钮挂进 `.top` flex，不再绝对钉死压货币条
- 横屏藏预览 prism/shard
- 日历/支援缝 12px，「更多」左留 10px
- 未改 `main`，未 force-push 其他 `cursor/*` 分支，未推公开仓 `sakurayo-zombietide`
- 版本仍 4.6.0，存档键未动
