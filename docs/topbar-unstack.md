# 大厅顶栏拆叠

已并入统一分支 `cursor/unify-v47-da3d`（V4.7.0），不再只活在 `cursor/lobby-topbar-unstack-cadf`。

- 换角圆钮挂进 `.top` flex，不再绝对钉死压货币条
- 横屏藏预览 prism/shard
- 日历/支援缝 12px，「更多」左留 10px
- `hangChars` / `hangLobbyTop` 带 `busy`，避免 MutationObserver 重入卡死
- 顶栏里的换角/钱包/快捷钮自己 `pointer-events:auto`，不把触控修掉
- 未改存档键，未包 `update`，未推公开仓
