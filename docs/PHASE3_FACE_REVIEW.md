# 第三期认人（指挥官）

2026-08-19。施工 PR：https://github.com/h1neolzr7f/sakurayo-v46-handoff/pull/12  
head：先 `0b992ff`，认人打回后 `dae7774`。基线 `origin/main` @ `0657136`。版本仍 **4.6.0**。

**结论：两张重画过了。可以合并。** 见 `docs/PHASE3_ACCEPT.md`。其余 22 张哈希与 `0b992ff` 相同。lobby / 加成 / 测试、旧 8/14/28/传说/公共图未动。

## 逻辑（本环境复跑）

| 项 | 结果 |
|---|---|
| 24 张 `fusion_*`，全 SSR，id 等于现网 FUSION | 过 |
| 仓库融合页 24 格，未抽卡背，无「后续写入」 | 过（lobby_unit + browser_smoke 已改断言） |
| 拥有 pair ×1.6、全伤害 +0.8%，重复不加 | 过 |
| want=SSR 必须给融合，禁止再降成 SR | 过。`downgradeRarity("SSR")` 现回 SSR |
| 硬保 80 是 fusion SSR，清 pity | 过。`fusion_soulgun` / pity=0 |
| Spark 能点融合；残件 scrap；转职 rarity | 过 |
| 旧图未被覆盖 | 过。无 school_/job_/传说/公共图改动 |
| 2000 抽三籽 | `0x51c0de` 1700 R / 262 SR / 38 SSR（1.9%）；`0x12345678` 1691 / 273 / 36；`0xabcdef01` 1703 / 260 / 37。三籽都抽出 24 个不同 fusion_* |
| 版本 4.6.0 | 过。未交 APK |

## 打回（只这两张）→ `dae7774` 已过

### `fusion_shadowmage` 影法魔女（绫）

要：银白发；手枪在腰前伸，不贴脸、不朝天、不对着镜头举到脸高；太刀在身；残影只用火冰/裂镜交代，封面只留一张脸。

`0b992ff`：枪口对着镜头；裂镜里还有一张完整的脸。不通过。

`dae7774`：手枪在腰侧前伸，枪口朝左下；裂镜只剩火冰碎晶，没有第二张脸。过。

### `fusion_necrospore` 菌尸冥主（凛音）

要：黑红+长刀当杖；魂菇从自己肩上长出来；嫌恶带倦。失败句是「菇从自己身上长」，不是「手里捧着菇」。

`0b992ff`：站着捧一簇发光蘑菇。不通过。

`dae7774`：魂菇从左肩/锁骨长出，菌丝爬胸口；长刀当杖；嫌恶带倦。过。

## 可留 22 张（本轮不重画）

小夜 10：magitech 怔住含泪、机甲裂开；gunshrine 咬牙冲石阶、符飞灰；bloodstar 哭着够冠、血从变身缝漏；bloodmech 遥控器冒烟、机喝血逃；idolgun 空舞台假笑、麦缠枪；thunderpriest 闭眼被雷劈；plagueidol 绿液溅、座席在溶；railsword 喊停、轨自弯；flowerplague 花开在别人身上、人往土沉；fleshshrine 符刻进肉臂。

绫 5：bloodmage 枪在地上、阵喝自己的血；nanoninja 枪朝下、无人机出镜缝（缝里残影算这张失败句，可留）；shadowblade 枪朝下、回头、剑冢空鞘；plagueforge 枪在腰、坩埚反噬（太刀不明显，不挡过）；biogun 枪口朝前不贴脸、弹匣长牙。

凛音 7：bloodsword 折剑+空冠；chimera 看见嵌臂；corpseimmortal 人淡、剑留、冠弃；shikigami 百鬼先朝镜核鞠躬；bloodbeast 红线勒、兽喝署名；elementalbeast 三兽喷向自己、鞭在地上；soulgun 骨马+魂灯（刀举过顶偏英雄骑姿，仍认得出亡骨枪骑，本轮不打回）。

## 施工怎么改

只换 `fusion_shadowmage.webp` 和 `fusion_necrospore.webp`。写进施工 `SWEEP_LOG`。其余 22 张哈希必须与 `0b992ff` 相同。逻辑和测试不要再改。
