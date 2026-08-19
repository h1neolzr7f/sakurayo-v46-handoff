# 换拼卡刀 0 摸底

2026-08-19。基线 `origin/main` @ `4176014`。分支 `cursor/fashion-art-5030`。不改玩法。

路径：`android-app/app/src/main/assets/game/art/gacha/{id}.webp`。18 张非传说时装/武器仍是拼卡站桩，体积 69–88KB，小于传说生成图（125–182KB）。

现网两对哈希相同，必须拆开：

| 对 | id | sha256 |
|---|---|---|
| 霓虹=电台 | `fashion_sayo_neon` = `weapon_radio_bat` | `1b83879598b0534b25b63af0370301bee4a44cbfded053254928662c9dd9c9a6` |
| 稽古=木刀 | `fashion_rion_keiko` = `weapon_rion_wood` | `16968de04851a1a3d44722d09511a5f6dc3bd2b525d61f0df3f775129509913f` |

传说 6 张本项目不准动：

| id | sha256 |
|---|---|
| fashion_sayo_crown | `b313dd1872cdf4793d138d5c8d9490d8357a9348ace5b3deb3c656f039a1484f` |
| fashion_aya_funeral | `5d07014661d7d90ec4cd6febf944a3b2538c6e5dc5c08e6829ae747cabb9cdea` |
| fashion_rion_bride | `abf79d5ae6e1ce299dda578bf6c88d80580fe85b18f1e3c5c899e3dde28e03f1` |
| weapon_sayo_final | `8f8b58bb150a2253b94e2dca43d0bfe4a2f96ebe5fbfdb8907060632729a7e38` |
| weapon_aya_mirror | `04c2bc41f4d71aa9691735de6e04937488b3fed3715910ff4de03d3f86ff75dc` |
| weapon_rion_burial | `544626968de7ff0f184e186370a26839ffd0908c3c655ed5cdb8771a354b20d5` |

旧 8 / 14 `school_*` / 28 `job_*` / 24 `fusion_*` / `banner_bg` / `card_back` / `hero_*` 未改。

`node tests/lobby_unit.mjs` 绿。下一刀出 18 张生成图。
