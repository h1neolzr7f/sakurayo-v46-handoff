# 第二期提示词（28 转职进池）

这是内容批次**第二期**，不是严重度 P2。P2 换拼卡那份不要贴进本项目。

新开 Cloud Agent 时，把下面围栏全文贴进去当唯一开工单。

仓库：`h1neolzr7f/sakurayo-v46-handoff`  
基线：`origin/main` @ `491e548`（第一期已合并）。  
新分支：`cursor/phase2-promos-5030`。  
禁止从第一期未合并的旧分支或 `9567de8` 开工。

---

## 开工提示词（复制从下一行到文末围栏）

```text
你是《樱夜·尸潮》第二期专用施工。只做 28 张转职进残片池。做完停，等人收工。

仓库：h1neolzr7f/sakurayo-v46-handoff。
从 origin/main（必须含 491e548，镜界寻访第一期）开分支 cursor/phase2-promos-5030。
基线 src/index.html + src/runtime/sakurayo-lobby.js。
图：android-app/app/src/main/assets/game/art/gacha/job_{id}.webp，768×1024。

版本仍 4.6.0。存档键仍 sakurayoV3。只往 shop40.ops 补字段。禁止清档。禁止新顶层 key。
禁止升 4.6.1。禁止交 APK / 密钥 / local.properties / tests/artifacts。禁止卸正式包。
禁止改名 startGame / update / draw / spawnEnemy / showDialogue。不要给 update 再包一层。
禁止恢复每颗子弹扫全部敌人。不引 CDN / Phaser / Pixi。
禁止覆盖旧 8 张残件、14 张 school_*、6 张传说时装/武器、banner_bg / card_back / hero_*。
禁止回滚第一期残片降级：缺档先走低，残片最低档是 R；want=SSR 且无 SSR 才给最高档并清 pity。
禁止把 24 融合写进卡池。禁止做镜头大地图。禁止另起宇宙。
禁止改价格和基础爆率数字。

====================
这不是什么
====================

第二期 ≠ 严重度 P2。不要去做 18 张时装/武器换图，除非顺手且不挡转职。
第三期才是 24 融合。融合仓库页本项目只允许继续「后续写入」卡背。
第一期已在 main：三页寻访、8 残件、14 基础、时装武器、编年、残片 R 远多于 SR。

====================
抄死：爆率怎么接 28 张 SR
====================

价格仍 160 / 1440。N 0.70 / R 0.22 / SR 0.07 / SSR 0.01。
硬保 80、十连保 SR、软保 65 抬 SSR。Spark 200。
残件 kind=scrap 不能 Spark、不能吃 SSR 硬保。

28 张转职全部是 SR，kind="job"。不新增 N，不新增 SSR。
残片池变成：8R 残件 + 11R 基础 + 3SR 基础 + 28SR 转职。
稀有度滚动不要改：N/R 仍然落到 R（残件和 R 基础）；SR 落到 SR 桶（3 基础 SR + 28 转职）；want=SSR 仍降成 SR 并清 pity。
因此 2000 抽仍必须 R 远多于 SR（大约六七成 R，SR 约一成）。变的是 SR 桶里更常出转职，不是把整池抬成 SR。

want=SSR 履约时（硬保/软保/自然 SSR），在 SR 桶里优先还没拥有的（转职或 shrine/gun/cult），禁止落到残件。
转职是 SR，不能 Spark（Spark 仍只对 SSR/传说）。

lobby_unit 必须保住：
- 残片 2000 抽：R/2000 >= 0.55，SR/2000 在 0.04～0.25，SSR=0，R > SR*3
- 硬保 80 结果 kind 是 job 或 school，不是 scrap；pity 清零；下一抽 0.99 是 R
- 2000 抽里至少出现 10 个不同 job_* id

====================
抄死：拥有加成（resetP 乘一次）
====================

基础 14 不动：R +0.3% / SR +0.6%，该校 upgradeWeight ×1.3，套装 7/+2%、14/+3%。
每张转职拥有即生效，重复不加：
- 该校 upgradeWeight 再 ×1.5（与基础卡 ×1.3 可叠，先基础后转职）
- 全伤害 +0.5%（dmg *= 1.005）
不要做「14/28 转职套装」。不要再加暴击/移速/护盾。
时装/武器/残件加成不动。
开局三池+商店仍按大约 +25%～35% 量级理解；禁止再发明百分比。

====================
抄死：28 张 id / 脸 / 母校（禁止改 id）
====================

封面不换脸。妆和死法可以变。失败痕迹要看得见。
careers/{id}/ 闪图只可当背景，不可直接当仓库封面。

小夜 face=sayo 紫黑发+步枪（10）：
job_swarm        蜂群统御     school=mech      母卡 school_mech
job_railLord     天穹磁轨     school=mech
job_hive         万菌母巢     school=spore     母卡 school_spore
job_garden       尸骸花园     school=spore
job_starIdol     星穹偶像     school=magical   母卡 school_magical
job_miracle      奇迹魔女     school=magical
job_exorcist     祓魔执行官   school=shrine    母卡 school_shrine
job_guardian     八咫守护者   school=shrine
job_warSinger    尸潮歌姬     school=idol      母卡 school_idol
job_healingIdol  治愈偶像     school=idol

绫 face=aya 银白发+手枪太刀（10）：
job_barrage      弹幕暴君     school=gun       母卡 school_gun
job_sniper       处刑狙击     school=gun
job_plagueDoctor 瘟疫医师     school=alch      母卡 school_alch
job_philosopher  贤者之石     school=alch
job_bloodDuke    鲜血公爵     school=vamp      母卡 school_vamp
job_batQueen     夜蝠女王     school=vamp
job_element      元素统御     school=mage      母卡 school_mage
job_timeMage     时序魔导师   school=mage
job_shadow       无明影刃     school=ninja     母卡 school_ninja
job_bombNinja    爆符忍军     school=ninja

凛音 face=rion 黑红+长刀（8）：
job_swordSaint   万剑仙       school=cult      母卡 school_cult
job_thunderLord  雷劫道君     school=cult
job_titan        再生泰坦     school=gene      母卡 school_gene
job_berserk      超载狂战     school=gene
job_beast        百兽统御     school=summon    母卡 school_summon
job_heroic       英灵契约     school=summon
job_boneKing     白骨君王     school=necro     母卡 school_necro
job_soulHerd     群魂牧者     school=necro

仓库标题用「未归·{中文名}」。四段第一人称，和封面同一人：她是谁 / 一路怎么走 / 怎么失败 / 临终心路。不写伤害数字。
lore 每句明显长于 8 个汉字。

====================
本项目只做这几刀（按序，每刀 commit）
====================

刀 0  门 A 摸底。确认 main 上残片 2000 抽仍 R 远多于 SR。不先改玩法。

刀 1  数据：JOB_CARDS 28 张进 sakurayo-lobby.js。id/r/kind/school/face/dmg=0.005 按上表。
      remnantList = 残件 + 基础 + 转职。
      仓库页签：残件 / 基础 / 转职 / 融合 / 时装 / 武器 / 编年。
      转职页未抽只卡背。融合页仍是统一卡背「后续写入」，不露 24 个真名。
      旧档缺 rosterTab=job 时回退残件。未拥有不进加成。
      先可用占位图（复制对应母校 school_*.webp 到 job_*.webp 仅作接线），刀 2 换掉。

刀 2  并行出 28 张生成图。可派子代理：小夜 10 / 绫 10 / 凛音 8。
      对齐 sayo_echo / aya_petal / rion_edge。不要第四张脸。
      写 docs/PHASE2_FACE_CHECK.md（28 行：id / 角色 / 发色 / 兵器 / 失败痕迹 / 自检）。
      超过 24h 人没回认人，按自检继续。

刀 3  加成接线：resetP 里 applyOwnedBonus 乘转职 +0.5%；upgradeWeight 在基础 ×1.3 之后，有对应 job 再 ×1.5。
      want=SSR 时 SR 桶优先未拥有。
      lobby_unit 补 28 张、仓库转职页、加成、分布、硬保不是残件。

刀 4  清虫最多 3 轮类修复。门 A 全绿。能跑再跑 browser_smoke。
      SWEEP_LOG 追加第二期行，不准删旧记录。
      停。等人收工。不要升 4.6.1。

不要开刀 5。不要做融合进池。

====================
完成定义（少一条不能说第二期收工）
====================

1. 仓库转职能切，28 格，未抽卡背，抽到能读四段
2. 融合页仍是「后续写入」，没有融合真名
3. 28 张能在残片池抽到；SR 桶含 job_*
4. 拥有给该校倾向 ×1.5 和全伤害 +0.5%，重复不加
5. 残片 2000 抽仍 R 远多于 SR，没有 99% SR
6. 残件仍不能 Spark、不能吃 SSR 硬保；硬保后清 pity
7. 新档+缺字段旧档进菜单，键 sakurayoV3
8. 14 张 school_* 与旧 8 张图未被覆盖
9. 门 A 绿（static / lobby / live / ops / framework / browser）
10. 版本仍 4.6.0
11. SWEEP_LOG 有第二期记录

P0：崩溃/清档/核心函数坏/残片再次锁死成全 SR。
P1：转职进了池却坏了降级、硬保打在残件上、旧图被覆盖、门 A 红。
融合没进池不是 P1。

====================
流水线
====================

每刀：改 → 测门 A → commit → push → 更新 PR。
出图可并行；禁止多个会话同时改 src/index.html。
不要自己把 PR 标成可合并。不要升版本。

人只露脸三次：开工 / 认人 28 张 / 收工。
回报只讲：当前刀、门 A 红绿、认人表、下一刀。没有新信息就停。
```
