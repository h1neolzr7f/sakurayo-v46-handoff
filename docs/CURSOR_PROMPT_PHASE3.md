# 第三期提示词（24 融合进残片池）

这是内容批次**第三期**，不是严重度 P2，也不是第二期。P2 换拼卡、第二期转职那两份都不要贴进本项目。

新开 Cloud Agent 时，把下面围栏全文贴进去当唯一开工单。

仓库：`h1neolzr7f/sakurayo-v46-handoff`  
基线：`origin/main` @ `0657136`（第二期已合并）。  
新分支：`cursor/phase3-fusions-5030`。  
禁止从 `cursor/phase2-promos-5030`、第一期旧分支或 `9567de8` 开工。

---

## 开工提示词（复制从下一行到文末围栏）

```text
你是《樱夜·尸潮》第三期专用施工。只做 24 张融合 SSR 进残片池。做完停，等人收工。

仓库：h1neolzr7f/sakurayo-v46-handoff。
从 origin/main（必须含 0657136，镜界寻访第二期）开分支 cursor/phase3-fusions-5030。
基线 src/index.html + src/runtime/sakurayo-lobby.js。
图：android-app/app/src/main/assets/game/art/gacha/fusion_{id}.webp，768×1024。
id 必须等于现网 FUSION / NEW_FUSIONS41 的 id，前面加 fusion_。禁止另起宇宙、禁止改战斗融合效果。

版本仍 4.6.0。存档键仍 sakurayoV3。只往 shop40.ops 补字段。禁止清档。禁止新顶层 key。
禁止升 4.6.1。禁止交 APK / 密钥 / local.properties / tests/artifacts。禁止卸正式包。
禁止改名 startGame / update / draw / spawnEnemy / showDialogue。不要给 update 再包一层。
禁止恢复每颗子弹扫全部敌人。不引 CDN / Phaser / Pixi。
禁止覆盖旧 8 张残件、14 张 school_*、28 张 job_*、6 张传说时装/武器、banner_bg / card_back / hero_*。
禁止回滚第一期残片降级：缺档先走低；残片最低档仍是 R。
禁止做镜头大地图。禁止做飞升进池。禁止改价格和基础爆率数字。
禁止把 fusions/{id}/splash.webp 或 careers/ 闪图直接当仓库封面（那不是这三张脸）。

====================
这不是什么
====================

第三期 ≠ 严重度 P2。不要去做 18 张时装/武器换图。
第二期已在 main：28 张 SR 转职、仓库转职页、该校 ×1.5、全伤害 +0.5%。
第一期已在 main：三页寻访、8 残件、14 基础、时装武器、编年。
本项目只把融合页从「后续写入」换成 24 格真卡。不要改局内 FUSION 触发/数值。

====================
抄死：爆率怎么接 24 张 SSR
====================

价格仍 160 / 1440。N 0.70 / R 0.22 / SR 0.07 / SSR 0.01。
硬保 80、十连保 SR、软保 65 抬 SSR。Spark 200。
残件 kind=scrap 不能 Spark、不能吃 SSR 硬保。
转职 kind=job 是 SR，仍不能 Spark。

24 张融合全部是 SSR，kind="fusion"。不新增 N/R/SR。
残片池变成：8R 残件 + 11R 基础 + 3SR 基础 + 28SR 转职 + 24SSR 融合。
这是残片池第一次真正有 SSR。

稀有度滚动：
- N/R 仍落到 R（残件和 R 基础）
- SR 落到 SR 桶（3 基础 SR + 28 转职）
- want=SSR（硬保/软保/自然 SSR）落到 SSR 桶（24 融合），履约后清 pity
- 禁止再把 want=SSR 降成 SR。池子有 SSR 就必须给 SSR。

want=SSR 履约时：SSR 桶优先还没拥有的融合；禁止落到残件、转职、基础。
全部融合都有了再给重复融合（只加计数和碎镜片，不叠伤）。
融合是 SSR，可以 Spark（200 碎镜片自选一张还缺的融合）。残件/转职/基础仍不能 Spark。

2000 抽分布会变：以前 want=SSR 全变成 SR，现在那些变成真 SSR。
R 仍必须远多于 SR。SR 会比第二期略少。SSR 不再是 0，但绝不能变成半池 SSR。

lobby_unit 必须改断言并保住：
- 残片 2000 抽：R/2000 >= 0.55，SR/2000 在 0.04～0.25，SSR/2000 在 0.01～0.08，SSR > 0，R > SR*3
- 硬保 80 结果 kind 是 fusion、r 是 SSR，不是 scrap / job / school；pity 清零
- 2000 抽里至少出现 8 个不同 fusion_* id
- spark("remnant","fusion_magitech") 在有 200 碎镜片且未拥有时 ok；spark 残件仍 scrap；spark 转职仍 rarity
- 仓库融合页 24 格，未抽只卡背，不再写「后续写入」
- 页面上仍不能在未抽时露出融合真名或 fusion_*.webp

独立再跑至少两个多种子 2000 抽，SSR 都 > 0 且 < 8%。

====================
抄死：拥有加成（resetP 乘一次）
====================

基础 14 不动：R +0.3% / SR +0.6%，该校 upgradeWeight ×1.3，套装 7/+2%、14/+3%。
转职 28 不动：该校 ×1.5，全伤害 +0.5%，重复不加。无转职套装。
每张融合拥有即生效，重复不加：
- 这张卡 pair 里的两校，upgradeWeight 再 ×1.6（顺序：基础 ×1.3 → 转职 ×1.5 → 融合 ×1.6）
- 全伤害 +0.8%（dmg *= 1.008）
不要做「12/24 融合套装」。不要再加暴击/移速/护盾。
时装/武器/残件加成不动。
禁止再发明百分比。不要把单卡改成 +2% 或装备才生效。

====================
抄死：24 张 id / 主脸 / 双校（禁止改 id）
====================

封面只留主脸。第二职业只用道具交代。禁止双人拼脸、禁止第四张脸。
妆和死法可以变。失败痕迹要看得见。
绫的手枪仍不举到脸边、不朝天。
表情禁止全员同一张抿嘴杀气。每张按失败一句能报出不同情绪。

小夜 face=sayo 紫黑发+步枪（10）：
fusion_magitech      星核机甲少女   pair=mech,magical     无人机+星冠，机甲裂开仍是小夜
fusion_gunshrine     祓魔枪巫女     pair=gun,shrine       步枪写符，符烧完
fusion_bloodstar     血月魔法少女   pair=vamp,magical     冠还亮，血从变身缝里漏
fusion_bloodmech     血械猎姬       pair=vamp,mech        无人机喝血，遥控器烫手
fusion_idolgun       枪火偶像       pair=idol,gun         麦和步枪抢同一只手
fusion_thunderpriest 雷火天师       pair=mage,shrine      符接雷，人被天罚先劈
fusion_plagueidol    瘟律歌姬       pair=alch,idol        节拍带腐蚀，观众席在溶
fusion_railsword     磁轨剑阵       pair=mech,cult        飞剑当铆钉，轨道自己弯
fusion_flowerplague  花疫魔女       pair=magical,spore    花弹开在别人身上
fusion_fleshshrine   生体御神子     pair=gene,shrine      符刻进肉，结界是血

绫 face=aya 银白发+手枪太刀（6）：
fusion_shadowmage    影法魔女       pair=ninja,mage       残影带火冰，本体没回来
fusion_bloodmage     血焰术士       pair=vamp,mage        法阵喝自己的血
fusion_nanoninja     纳米机忍       pair=mech,ninja       无人机抄影遁，人留在镜缝
fusion_shadowblade   御剑影忍       pair=ninja,cult       飞剑斩过，影没归鞘
fusion_plagueforge   瘟炼菌海       pair=alch,spore       坩埚里的菌不认署名
fusion_biogun        活体弹仓       pair=gene,gun         弹匣长肉，枪口朝前不贴脸

凛音 face=rion 黑红+长刀（8）：
fusion_bloodsword    血炼剑仙       pair=vamp,cult        飞剑以血为炉，冠空
fusion_chimera       元素嵌合体     pair=gene,mage        看见自己手臂的法阵
fusion_corpseimmortal 尸解剑仙      pair=gene,cult        肉身先走，剑还在振
fusion_shikigami     百鬼阴阳师     pair=summon,shrine    百鬼比主人先鞠躬
fusion_necrospore    菌尸冥主       pair=necro,spore      魂菇从自己肩上长
fusion_bloodbeast    血契兽王       pair=summon,vamp      兽群喝的是署名
fusion_elementalbeast 元素御兽使    pair=summon,mage      使魔喷元素，鞭先断
fusion_soulgun       亡骨枪骑       pair=necro,gun        弹匣收魂，刀当马鞭

仓库标题用「未归·{中文名}」。四段第一人称，和封面同一人：她是谁 / 一路怎么走 / 怎么失败 / 临终心路。不写伤害数字。
lore 每句明显长于 8 个汉字。pair、代价、克制怪可写进「她是谁 / 怎么失败」，不要另造融合玩法。

商店礼装按双校选，不要三个人穿同一套站桩。禁止同一套单膝跪。

====================
本项目只做这几刀（按序，每刀 commit）
====================

刀 0  门 A 摸底。确认 main 上残片 2000 抽仍是大约 1700 R / 300 SR / 0 SSR（第二期基线）。不先改玩法。

刀 1  数据：FUSION_CARDS 24 张进 sakurayo-lobby.js。id/r/kind/pair/face/dmg=0.008 按上表。
      remnantList = 残件 + 基础 + 转职 + 融合。
      仓库融合页改成 24 格，未抽只卡背。删掉「后续写入」。未拥有不露真名、不露 fusion_*.webp。
      旧档缺 owned.fusion_* 时补 0。未拥有不进加成。
      先可用占位图（复制主脸对应 school_*.webp 到 fusion_*.webp 仅作接线），刀 2 换掉。
      占位阶段测试可先不认人。

刀 2  并行出 24 张生成图。可派子代理：小夜 10 / 绫 6 / 凛音 8。
      对齐 sayo_echo / aya_petal / rion_edge，再加 pair 两张 school_* 当道具参考。
      不要第四张脸。不要双人拼脸。
      写 docs/PHASE3_FACE_CHECK.md（24 行：id / 角色 / 发色 / 兵器 / 第二职业道具 / 失败痕迹 / 表情 / 自检）。
      超过 24h 人没回认人，按自检继续。

刀 3  加成接线：resetP 里 applyOwnedBonus 乘融合 +0.8%；upgradeWeight 在 job ×1.5 之后，pair 两校再 ×1.6。
      want=SSR 的 SSR 桶优先未拥有 fusion，禁止残件。
      lobby_unit：改掉「残片 SSR=0」旧断言；补 24 张、仓库融合页、加成、分布、硬保是融合、Spark 能点融合。

刀 4  清虫最多 3 轮类修复。门 A 全绿。能跑再跑 browser_smoke。
      SWEEP_LOG 追加第三期行，不准删旧记录。
      停。等人收工。不要升 4.6.1。

不要开刀 5。不要做飞升进池。不要做镜头。

====================
完成定义（少一条不能说第三期收工）
====================

1. 仓库融合能切，24 格，未抽卡背，抽到能读四段；不再写「后续写入」
2. 未抽时没有融合真名、没有 fusion_*.webp
3. 24 张能在残片池抽到；SSR 桶只含 fusion_*
4. 拥有给 pair 两校倾向 ×1.6 和全伤害 +0.8%，重复不加
5. 残片 2000 抽仍 R 远多于 SR；SSR 在 1%～8%，不是 0，也不是半池
6. 残件仍不能 Spark、不能吃硬保；硬保是融合 SSR 并清 pity；融合能 Spark
7. 新档+缺字段旧档进菜单，键 sakurayoV3
8. school_* / job_* / 旧 8 张 / 传说 / 公共图未被覆盖
9. 门 A 绿（static / lobby / live / ops / framework / browser）
10. 版本仍 4.6.0
11. SWEEP_LOG 有第三期记录

P0：崩溃/清档/核心函数坏/残片再次锁死成全 SR 或全 SSR。
P1：融合进了池却仍把 want=SSR 降成 SR、硬保打在残件上、旧图被覆盖、门 A 红、双人拼脸。
飞升没进池不是 P1。镜头没做不是 P1。

====================
流水线
====================

每刀：改 → 测门 A → commit → push → 更新 PR。
出图可并行；禁止多个会话同时改 src/index.html。
不要自己把 PR 标成可合并。不要升版本。

人只露脸三次：开工 / 认人 24 张 / 收工。
回报只讲：当前刀、门 A 红绿、认人表、下一刀。没有新信息就停。
```
