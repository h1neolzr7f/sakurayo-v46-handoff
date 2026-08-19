# P2 提示词（整段粘贴，禁止再发明范围）

**作废。** 刀 1 仓库占位已过时（转职/融合已是真卡）。换 18 张拼卡改贴 [CURSOR_PROMPT_FASHION.md](CURSOR_PROMPT_FASHION.md)。基线必须是 `origin/main` @ `4176014` 或更新。

这是**严重度 P2**（第一期漏掉的占位 + 拼卡换图 + 短文补满），**不是**圣经里的「第二期 28 转职进池」。

新开一个 Cloud Agent / 项目时，把下面围栏里的全文贴进去当唯一开工单。不要再贴第一期提示词，不要让模型去「顺便」做转职 28。

仓库：`h1neolzr7f/sakurayo-v46-handoff`  
基线分支：`cursor/autorun-phase1-d70b` @ `219eb4b`（第一期已验收）。  
若 `main` 已合并 [PR #10](https://github.com/h1neolzr7f/sakurayo-v46-handoff/pull/10)，改从 `main` 开 `cursor/p2-polish-5030`。  
**禁止从尚未合并寻访的旧 `main`（`9567de8`）开工。**

---

## 开工提示词（复制从下一行到文末围栏）

```text
你是《樱夜·尸潮》P2 专用施工。只做本提示词写明的三刀。做完停，等人收工。

仓库：h1neolzr7f/sakurayo-v46-handoff。
从 origin/cursor/autorun-phase1-d70b（commit 219eb4b）开新分支 cursor/p2-polish-5030。
若 origin/main 已包含该 commit，则从 origin/main 开同名分支。
禁止从 9567de8 或更旧的 main 开工（那里没有镜界寻访）。
基线 src/index.html + src/runtime/sakurayo-lobby.js。
图只放 android-app/app/src/main/assets/game/art/gacha/{id}.webp，768×1024。

版本仍 4.6.0。存档键仍 sakurayoV3。只允许往 shop40.ops 补字段。禁止清档。禁止新顶层存档 key。
禁止升 4.6.1。禁止交 APK / 密钥 / local.properties / tests/artifacts。禁止卸正式包。
禁止改名 startGame / update / draw / spawnEnemy / showDialogue。不要给 update 再包一层。
禁止恢复每颗子弹扫全部敌人。不引 CDN / Phaser / Pixi / 外部字体图。
禁止覆盖旧 8 张残件图和公共图：
sayo_echo / aya_petal / rion_edge / night_radio / shrine_seal / void_ticket / cherry_crown / last_witness
banner_bg / card_back / hero_sayo / hero_aya / hero_rion
禁止重画 14 张 school_*（认人已过）。
禁止重画 6 张传说（除非文件损坏）：
fashion_sayo_crown / fashion_aya_funeral / fashion_rion_bride
weapon_sayo_final / weapon_aya_mirror / weapon_rion_burial
禁止改抽卡数字、残件加成表、软保硬保、Spark 规则。
禁止把 28 转职或 24 融合的 id / 名字 / 脸写进卡池或存档。
禁止做镜头大地图。禁止另起宇宙。

====================
这不是什么
====================

P2 ≠ 第二期。
第二期才是 28 张转职进残片池。本项目不做。
第三期才是 24 张融合。本项目不做。
第一期已验收：三页寻访、仓库、8 残件、14 基础、时装武器能抽能装备、小夜编年、残片降级（N 缺档走 R；want=SSR 履约清 pity）。不要回滚那两层修复。

====================
抄死（谁改谁停工）
====================

对外：镜界寻访 / 镜界仓库。关卡「证词模式」不改名。
寻访三页：残片 / 时装 / 武器。
仓库筛：残件 / 基础 / 转职 / 融合，另开「月城小夜 · 未写完的夜」。
价格 160 / 1440。爆率 N 0.70 / R 0.22 / SR 0.07 / SSR 0.01。
硬保 80、十连保 SR、软保 65 抬 SSR。Spark 200。
残件不能 Spark，不能吃 SSR 硬保。
缺档先往更低走；走到头取池子最低档（残片是 R）。只有 want=SSR 且池子无 SSR，才给 shrine/gun/cult，并清 pity。
默认点亮 sayo_echo、aya_petal。last_witness 仍是男人。
careers/ 与 fusions/ 闪图不能直接当封面。

认人三件套（换图用）：
小夜紫黑发 + 步枪；绫银白发 + 手枪和太刀；凛音黑里透红 + 长刀。
失败痕迹要看得见。不画第四张脸，不画双人拼脸。

====================
本项目只做这三刀（按序，每刀 commit）
====================

刀 1 · 仓库占位（先做，不出新脸）
- 仓库页签补上「转职」「融合」。保留现有：残件 / 基础 / 时装 / 武器 / 编年。
- 转职页、融合页只铺统一卡背 gacha/card_back.webp + 文案「后续写入」。
- 不露名字、不露脸、不写 28/24 个 id、不进寻访池、不进 owned、不加伤害。
- 可以各铺一排相同卡背（不必真造 28+24 条数据）。点开也只说「后续写入」。
- lobby_unit 断言：仓库有 data-roster="promote" 与 data-roster="fusion"（或同等 data-roster 值，选定后写死）；这两页 HTML 含「后续写入」和 card_back.webp；不含 school_shrine / 蜂群统御 / 星核机甲 等真名。
- 旧档缺 rosterTab 新值时回退残件页。

刀 2 · 18 张非传说拼卡换生成图
只换这些文件（已有 id，禁止改 id）：
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
weapon_mirror_round 圆镜盾刃（公用，可任意角色，封面仍要能认出三人之一或兵器）
weapon_shard_blade 裂镜片刃（公用）
weapon_radio_bat 电台短棍（公用）
路径：android-app/app/src/main/assets/game/art/gacha/{id}.webp
去掉拼卡白线/裁切痕。竖版 768×1024。对齐 sayo_echo / aya_petal / rion_edge 的夜樱气质。
武器封面可以是「人持那把兵器」，不要只画无角色的道具特写（公用三把除外，可偏兵器但不要第四张脸）。
自检：缩到 200px 宽仍能报出发色+兵器。写 docs/P2_FACE_CHECK.md（18 行表）。
超过 24 小时人没回认人，按自检继续，不堵。

刀 3 · 时装/武器四段补满
12 时装 + 12 武器每张 lore 必须 4 句，第一人称「我」，和封面同一人。
结构：她是谁 / 一路怎么走 / 怎么失败 / 临终心路。
不写伤害数字。不另起宇宙。传说 6 张若已有四句且通顺可只润色，不准改标题。
lobby_unit 断言每张 fashion/weapon 的 lore.length === 4，且每句长度明显长于 8 个汉字（禁止再交「灯灭的时候我还在。」这种一行敷衍）。

三刀都做完再跑清虫。不要开刀 4。

====================
完成定义（少一条不能说 P2 收工）
====================

1. 仓库能切到转职、融合；两页只有卡背 +「后续写入」
2. 那两页没有转职/融合真名，也没有新存档字段列表
3. 上列 18 个 webp 已换、体积 > 8KB、无白线裁切痕
4. 6 张传说图和旧 8 张残件图未被覆盖
5. 12+12 的 lore 都是 4 段可读第一人称
6. 新档 + 缺字段旧档仍进主菜单，键仍 sakurayoV3
7. 残片 2000 抽仍是 R 远多于 SR（第一期回归不许坏）
8. 残件仍不能 Spark、不能吃 SSR 硬保；硬保后清 pity
9. 门 A 绿：static_check、lobby_unit、live_unit、ops_unit、framework_smoke、browser_smoke
10. SWEEP_LOG 追加 P2 行，不准删旧记录
11. 版本仍 4.6.0

P0：崩溃/清档/核心函数失效/残片再次锁死成全 SR。
P1：仓库占位页露了真名或进了池、旧图被覆盖、门 A 红、Pity 回归坏了。
P2 美化未完成才算本项目未收工；不要把「我想加转职」写成 P1。

====================
流水线
====================

每刀：改 → 测门 A → commit → push → 更新 PR。
出图可派并行子代理；禁止多个会话同时改 src/index.html。
清虫最多 3 轮类修复。修一类补一条会红的回归。
不要自己把 PR 标成可合并。不要升版本。

人只露脸三次：开工 / 认人（18 张，可打回）/ 收工。
回报格式只讲：当前刀、门 A 红绿、认人表、下一刀。没有新信息就停，不要找活干。
```
