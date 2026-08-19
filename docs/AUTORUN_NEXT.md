# 下一轮怎么开（卡池货齐了）

第三期已进 `main`：`4176014`。下一轮三份也已进 `main`：`0af3809`（#13 编年 → #14 镜头 → #15 换拼卡）。版本仍 **4.6.0**。残片 74 张齐了，**不要再开第四期升级/加伤**。

三件事三份提示词，**三个 Cloud Agent**。禁止贴进同一个项目。

| 项目 | 提示词 | 新分支 | 改哪里 | 和谁并行 |
|---|---|---|---|---|
| **镜头大地图**（先开） | `docs/CURSOR_PROMPT_CAMERA.md` | `cursor/camera-world-5030` | 局内 `src/index.html` | 可与换拼卡并行 |
| **换 18 张拼卡** | `docs/CURSOR_PROMPT_FASHION.md` | `cursor/fashion-art-5030` | `sakurayo-lobby.js` + 18 张 webp | 可与镜头并行；**不要和编年并行** |
| **绫 / 凛音编年** | `docs/CURSOR_PROMPT_CHRONICLE.md` | `cursor/chronicle-sides-5030` | `sakurayo-lobby.js` 编年页 | 等换拼卡并完，或镜头并完后再开 |

发版债（`sync-game.ps1`、根 CHANGELOG、升 4.6.1、APK）**不进这三份**。未下令不做。

## 2026-08-19 入库

三份已进 `main`。详见 `docs/NEXT_REVIEW.md`。

- 编年 #13 → `fc67ddf`
- 镜头 #14 → `12b4f49`
- 换拼卡 #15 → `0af3809`（现 `main` 头）

发版债改走单独项目：`docs/AUTORUN_PACKTEST.md`。未下令不升 4.6.1、不交正式包。传说 #16 不挡打包。

旧的 `CURSOR_PROMPT_P2.md` 作废：刀 1 仓库占位已过时（转职/融合已是真卡）。

人只露脸：每个项目开工 / 认人（有图的才认）/ 收工。
