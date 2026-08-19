# 第二期验收

2026-08-19。对照 `docs/CURSOR_PROMPT_PHASE2.md` 11 条。施工 PR：https://github.com/h1neolzr7f/sakurayo-v46-handoff/pull/11。

**结论：收工。可以合并 PR #11 @ `fcb9279`。** 不要升 4.6.1，不要交 APK。

- `8193eed`：打回 `job_garden`（围裙跪泥纯哭，和 `hive` 叠泪）。
- `fcb9279`：只改 `job_garden.webp` + 施工 `SWEEP_LOG`。新图笑裂（嘴角上扬、露出一点上齿），泪只留左脸一滴；步枪当锄、炼金围裙、尸花里镜核还在。其余 27 张 webp、lobby/index/测试、旧 8/14/传说/公共图哈希与 `8193eed` 相同。

## 11 条

| # | 条 | 结果 |
|---|---|---|
| 1 | 仓库转职 28 格，未抽卡背，抽到能读四段 | 过。`renderRoster` job 页 28 槽；未拥有用 `card_back.webp`，不露 `job_*.webp`；`lore` 各 4 行 |
| 2 | 融合页仍「后续写入」，无融合真名 | 过。断言无「星核机甲少女」「血炼剑仙」 |
| 3 | 28 张能在残片池抽到 | 过。独立三籽 2000 抽各抽出 28 个不同 `job_*` |
| 4 | 拥有：该校 ×1.5、全伤害 +0.5%，重复不加 | 过。`applyOwnedBonus` 按卡一次 ×1.005；`upgradeWeight` 在基础 ×1.3 后再 `hasJob` ×1.5。无 14/28 转职套装 |
| 5 | 2000 抽 R 远多于 SR，无 99% SR | 过。`0x51c0de` 1700/300/0；`0x12345678` 1691/309/0；`0xabcdef01` 1703/297/0 |
| 6 | 残件不能 Spark、不能吃硬保；履约清 pity | 过。`spark` 残件 `scrap`、转职 `rarity`；三籽硬保打在残件上 0 次 |
| 7 | 新档+缺字段旧档，键 `sakurayoV3` | 过。lobby_unit 有缺字段补齐；键未改 |
| 8 | 14 张 `school_*` 与旧 8 张图未被覆盖 | 过。与 `origin/main` blob SHA 全同；传说 6 张、`banner_bg` / `card_back` / `hero_*` 也同 |
| 9 | 门 A 绿 | 本环境：static / lobby / live / ops 绿。framework 缺 Playwright 未复跑。施工记 browser 末尾孤证 `#skill` 超时与刀 0 同基线 |
| 10 | 版本仍 4.6.0 | 过。未交 APK / 密钥 |
| 11 | SWEEP_LOG 有第二期记录 | 施工仓有。本仓本行补大脑验收 |

## 表情复检（28 张）

禁全员同一张抿嘴杀气。每张按 lore 报情绪。绫枪不贴脸。

### garden（`fcb9279` 过）

- **`job_garden`**：对着尸花/镜核笑裂，嘴角上扬、牙齿露一点，左脸一滴泪。步枪当锄、炼金围裙还在。和 `hive`（躺倒虚脱、菌从甲缝长出）拆开。`8193eed` 那张纯哭作废。

### 可留 7 张（施工未改，本轮仍过）

| id | 报出的情绪 |
|---|---|
| hive | 躺倒虚脱，菌从甲缝长出 |
| warSinger | 张嘴唱，尸手后拉 |
| healingIdol | 喊着跑，药箱洒花 |
| bloodDuke | 疼、眼湿，空瓶滑落；枪口朝下 |
| beast | 被更高影子拖走，咬牙挣 |
| heroic | 睁大眼够「契約」 |
| boneKing | 捧冠颅。表写咬牙按冠，实际更像含泪；构图能分开 soulHerd，不另打回 |

### 重画 20 张过

小夜：`swarm` 怔住含泪握坠毁机；`railLord` 磁轨上喊；`starIdol` 假笑撑不住、妆/手血；`miracle` 坠空哭着够碎冠；`exorcist` 咬牙怒冲石阶；`guardian` 含泪伸手送乌鸦，步枪靠鸟居。

绫：`barrage` 露齿狠笑，枪腰胸前伸；`sniper` 卧射打空愣住；`plagueDoctor` 绿液溅脸，枪在腰；`philosopher` 哭着够作废券，枪在地；`batQueen` 尖牙冷笑，侧伸平瞄；`element` 反噬眯眼咬牙，VOID 券+火冰，枪浮旋涡；`timeMage` 慌到要哭够碎表；`shadow` 玻璃划脸龇牙，枪朝镜头不贴脸；`bombNinja` 炸光狂笑，枪被掀飞。

凛音：`swordSaint` 悲愤喊劈、飞剑已折；`thunderLord` 冠落水、雷在身/刃上嘶喊（构图仍近下劈，靠祭典服+落水冠和万剑仙分开，不打回）；`titan` 看见晶臂的怕；`berserk` 失控怒吼；`soulHerd` 回头含泪浅笑。

同校两条都能靠道具/姿势分开。28 张 webp 哈希互不撞，也不撞 `school_*` / 残件 / 传说。

## 不挡收工的债

- `android-app/.../assets/index.html` 未跑 `sync-game.ps1`，APK 壳仍是旧大厅。第二期不交包，基线仍是 `src/`。
- 根 `CHANGELOG.md` 未写第二期。
- 第一期遗留拼卡：`fashion_sayo_neon`=`weapon_radio_bat`，`weapon_rion_wood`=`fashion_rion_keiko`。

## 下一件

人点合并 PR #11。不要升 4.6.1。第三期 24 融合另开，不要塞进本 PR。
