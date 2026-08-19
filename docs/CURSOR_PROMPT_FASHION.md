# 换拼卡提示词（18 张时装/武器）

这是**严重度 P2 的剩货**：只换 18 张非传说拼卡并补四段。不是第二期转职，不是第三期融合，不是镜头。

旧 `CURSOR_PROMPT_P2.md` 作废（那份还在铺仓库「后续写入」，现网转职/融合已是真卡）。

新开 Cloud Agent 时，把下面围栏全文贴进去当唯一开工单。

仓库：`h1neolzr7f/sakurayo-v46-handoff`  
基线：`origin/main` @ `4176014`（第三期已合并）。  
新分支：`cursor/fashion-art-5030`。  

---

## 开工提示词（复制从下一行到文末围栏）

```text
你是《樱夜·尸潮》换拼卡专用施工。只换 18 张非传说时装/武器图，并补满四段。做完停，等人收工。

仓库：h1neolzr7f/sakurayo-v46-handoff。
从 origin/main（必须含 4176014）开分支 cursor/fashion-art-5030。
基线 src/runtime/sakurayo-lobby.js + android-app/app/src/main/assets/game/art/gacha/{id}.webp。
禁止改 src/index.html 战斗循环。禁止改抽卡数字、保底、Spark、融合/转职加成。

版本仍 4.6.0。存档键仍 sakurayoV3。禁止清档。
禁止升 4.6.1。禁止交 APK / 密钥。禁止卸正式包。
禁止改名 startGame / update / draw / spawnEnemy / showDialogue。
禁止覆盖旧 8 张残件、14 张 school_*、28 张 job_*、24 张 fusion_*、6 张传说、banner_bg / card_back / hero_*。
禁止做镜头。禁止做绫凛编年。禁止飞升进池。

====================
抄死：只换这 18 个 id（禁止改 id）
====================

时装 N/R/SR：
fashion_sayo_plain 未归·常服小夜
fashion_sayo_neon 未归·霓虹小夜
fashion_sayo_night 未归·夜巡小夜
fashion_aya_suit 未归·制服绫
fashion_aya_coat 未归·风衣绫
fashion_aya_veil 未归·面纱绫
fashion_rion_keiko 未归·稽古凛音
fashion_rion_haori 未归·羽织凛音
fashion_rion_bloom 未归·花葬凛音
武器 N/R/SR：
weapon_sayo_spare 备用夜樱弹
weapon_sayo_petal 花瓣弹匣
weapon_aya_side 侧持短铳
weapon_aya_twin 双持月切
weapon_rion_wood 无铭木刀
weapon_rion_under 鞘中黑羽
weapon_mirror_round 圆镜盾刃（公用，封面仍要能认出三人之一或兵器，禁止第四张脸）
weapon_shard_blade 裂镜片刃（公用）
weapon_radio_bat 电台短棍（公用）

768×1024 webp。对齐 sayo_echo / aya_petal / rion_edge。
现网两对是同一张图，必须拆开：
- fashion_sayo_neon 不得再等于 weapon_radio_bat
- weapon_rion_wood 不得再等于 fashion_rion_keiko
武器封面可以是「人持那把兵器」。绫枪不举到脸边、不朝天。不画双人拼脸。

传说 6 张不准动：
fashion_sayo_crown / fashion_aya_funeral / fashion_rion_bride
weapon_sayo_final / weapon_aya_mirror / weapon_rion_burial

====================
抄死：四段
====================

12 时装 + 12 武器（含传说）每张 lore 必须 4 句，第一人称「我」，和封面同一人。
她是谁 / 一路怎么走 / 怎么失败 / 临终心路。
不写伤害数字。不另起宇宙。
每句汉字数明显长于 8（禁止再交「灯灭的时候我还在。」）。
传说 6 张只准加长润色，不准改标题。

====================
本项目只做这几刀（按序，每刀 commit）
====================

刀 0  摸底。确认 18 张仍是拼卡/重复图；lobby_unit 绿。不改玩法。

刀 1  并行出 18 张生成图。写 docs/FASHION_FACE_CHECK.md（18 行：id / 角色或兵器 / 是否与另一 id 哈希相同 / 自检）。
      超过 24h 人没回认人，按自检继续。

刀 2  补满 12+12 的四段。lobby_unit：lore.length===4，每句汉字>8；18 张体积>8KB；6 传说和旧 8/14/28/24 哈希未变；两对重复图已拆开。

刀 3  门 A 能跑则跑。SWEEP_LOG 追加换拼卡行。停。等人认人 18 张后收工。

不要开刀 4。不要改残片池。不要做镜头。

====================
完成定义
====================

1. 上列 18 个 webp 已换、无白线裁切痕、互不相同
2. 6 张传说和旧残件/职业/转职/融合/公共图未被覆盖
3. 12+12 lore 都是 4 段、每句汉字>8
4. 残片 2000 抽回归仍 R 远多于 SR，SSR 仍在 1%～8%
5. 门 A 绿
6. 版本仍 4.6.0
7. SWEEP_LOG 有本项目行

P0：崩溃/清档/核心函数坏。
P1：旧图被覆盖、两对还是同一张、门 A 红、抽卡回归坏。
镜头没做不是 P1。

人只露脸三次：开工 / 认人 18 张 / 收工。
回报只讲：当前刀、门 A 红绿、认人表、下一刀。
```
