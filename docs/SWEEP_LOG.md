# 清虫与切片日志

A/B 每轮追加一行，不准删旧记录。

| 日期 | 组 | 切片或类名 | 做了什么 | 测试/认人 | 上轮为何漏 | 下一件 |
|---|---|---|---|---|---|---|
| 2026-08-18 | 大脑 | 提示词 | 落下合格提示词 docs/CURSOR_PROMPTS.md | — | — | 开 A + B 残件8 |
| 2026-08-18 | A | 检查点0 / 门A摸底 | 记下现状：单页寻访、名册未改仓库、8张旧稀有度、无三页/软保/残件加成。未改玩法。见 docs/PHASE1_GATE0.md | static/lobby/live/ops 绿；framework_smoke、browser_smoke 红（旧断言对不上 ops46 与 lobby_wide） | 基线测试未跟 V4.6 大厅/干员 | 检查点1：三页空壳 + 残件 R 加成 |
| 2026-08-18 | A | 检查点1 / 寻访三页壳 | 三页空壳、仓库改名、shop40.ops 补 shards/pool/fashion/weapon、旧8张全R残件、加成进 resetP。时装/武器空池 toast「本池尚未写入」。竖屏底栏左两格被角色卡挡住记 P1，测试走 openDrawer，不改大厅布局。 | static/lobby/live/ops/framework/browser 全绿 | 旧断言未跟三页合同；竖屏点击被挡 | 检查点2：并行出14张+残件8文 |
| 2026-08-18 | B | 残件8文案 | 八张四段写入 docs/gacha/REMNANT_8.md，并接到仓库阅读。不覆盖旧 webp。last_witness 用「他」。 | 文案自检过；等认人 | 本轮才写 | 14张接线（认人/自检后） |
| 2026-08-18 | B | 小夜基础5 / 绫基础5 / 凛音基础4 | 生成并落盘 14 张 768×1024 webp。见 docs/PHASE1_FACE_CHECK.md 与 docs/gacha/SCHOOL_14.md。未把职业 id 写进存档。 | 自检 14/14 能报出人；等人抽查，超 24h 按自检继续 | 基线无职业封面 | 检查点3接线 |
| 2026-08-18 | A | 检查点3 / 14张接线 | 14 张进残片池与仓库基础页；四段阅读；倾向 ×1.3；套装 7/+2%、14/+3%；SSR 硬保降到 shrine/gun/cult，不打残件。 | static/lobby/live/ops/framework/browser 绿 | 认人未回，按自检继续 | 检查点4：时装武器+装备槽 |
| 2026-08-18 | A | 检查点4 / 时装武器 | 时装12+武器12进池；传说6张生成图，其余拼卡；装备槽与 resetP 加成；Spark 200 不能点残件。 | 门A绿 | — | 检查点5：小夜编年 |
| 2026-08-18 | A | 检查点5 / 小夜编年 | 仓库编年页「月城小夜 · 未写完的夜」五条：第零次死亡 / 百目共视 / 零号企业 / 失败者剑冢 / 镜零之后。不进卡池。 | 门A绿 | — | 检查点6清虫 |
| 2026-08-18 | A | 清虫轮1 / 底栏遮挡 | 竖屏角色卡盖住寻访/仓库。nav z-index 8，补 elementFromPoint 回归。 | 门A绿 | 检查点1只改测试没改层级 | 轮2分层 |
| 2026-08-18 | A | 清虫轮2 / 剧情吐槽分层 | 升级模态时断言 dialogue/banter hidden。transientBlocked 已在。 | 门A绿 | 轮1只看大厅点击 | 轮3回归 |
| 2026-08-18 | A | 清虫轮3 / 回归 | 再跑门 A+C。无新 P0/P1。见 docs/PHASE1_GATE6.md | 门A/C绿 | 连续两轮无新洞 | 停，等人收工 |
| 2026-08-19 | A | 残片降级 | 收工打回：残片无 N 时 N 被抬成 SR。downgradeRarity 先降档，走到底取最低档；仅 want=SSR 且无 SSR 才给最高档。want=SSR（硬保/软保）降成 SR 后清 pity，避免卡在 ≥80 后每抽都是 SR。lobby_unit 2000 抽残片 R 远多于 SR。 | 门A绿；门C Playwright 51 checks 绿 | 检查点3接线后没测无 N 池；保底降档后没清 pity | 停，等人再验收 |
| 2026-08-19 | 二期 | 刀2 转职图 | 28 张 job_*.webp：商店礼装、去站桩/同跪、赛璐璐去噪。见 docs/PHASE2_FACE_CHECK.md。未覆盖旧 8/14/传说/公共图。 | 自检 28/28 能报出人 | 首轮抄参考图站桩 | 刀3加成 |
| 2026-08-19 | 二期 | 刀3 加成与保底 | resetP 转职 +0.5% 重复不加；upgradeWeight 基础 ×1.3 后再 ×1.5；want=SSR 的 SR 桶优先未拥有 job/shrine/gun/cult，禁止残件。lobby_unit：28 张、仓库转职页、分布、硬保不是残件、2000 抽 ≥10 个 job_*。 | static/lobby/live/ops/framework 绿 | — | 刀4清虫 |
| 2026-08-19 | 二期 | 刀4 清虫 | 门 A 脚本绿。browser_smoke 核心寻访/仓库/三角色/升级/Boss/结算绿；末尾孤证试炼点 #skill 超时与刀 0 基线相同，本轮未改战斗。无新 P0/P1。未升 4.6.1。 | 门A绿 | 基线已有 #skill 不可见 | 停，等人收工 |
| 2026-08-19 | 二期 | 绫枪姿复检 | 十张绫封面过目视。禁 `aya_petal` 竖举脸边/朝天。整张重画 plagueDoctor / element / bombNinja；barrage / timeMage 一并换构图。sniper / philosopher / bloodDuke / batQueen / shadow 可留。未动旧 8/14/传说/公共图。 | 目视 10/10 枪不贴脸 | 首轮抄默认举枪 | 停，等人收工 |
| 2026-08-19 | 二期 | 表情复检 | 28 张过目视。禁全员抿嘴杀气。可留 hive / warSinger / healingIdol / bloodDuke / beast / heroic / boneKing。其余 21 张整张重画，情绪按 lore 拆开。绫仍禁举枪贴脸。未动旧 8/14/传说/公共图。 | 目视 28/28 能报出不同情绪 | 上轮只修枪姿没拆表情 | 停，等人收工 |
| 2026-08-19 | 二期 | garden 打回 | 只重画 job_garden。上一张围裙跪泥纯哭，和 hive 同属菌校含泪。新图必须看见笑裂，泪只留一滴。其余 27 张、逻辑、旧图不动。 | 目视：嘴角上扬、一滴泪 | 自检写了笑裂图是纯哭 | 这一张过了才能点合并 |
| 2026-08-19 | 三期 | 刀0 摸底 | main @ 0657136 残片 2000 抽仍约 1700 R / 300 SR / 0 SSR。硬保落到 job SR。未改玩法。见 docs/PHASE3_GATE0.md | lobby 绿 | — | 刀1 24 张接线 |
| 2026-08-19 | 三期 | 刀1 数据 | FUSION_CARDS 24 张 SSR 进残片池；仓库融合页 24 格未抽卡背；删「后续写入」。占位图先抄主脸 school_*。 | lobby/live/ops/static 绿 | — | 刀2 出图 |
| 2026-08-19 | 三期 | 刀2 融合图 | 24 张 fusion_*.webp：主脸小夜10 / 绫6 / 凛音8，第二职业只用品。见 docs/PHASE3_FACE_CHECK.md。未覆盖旧 8/14/28/传说/公共图。 | 自检 24/24 能报出人 | 占位是抄图 | 刀3加成 |
| 2026-08-19 | 三期 | 刀3 加成与保底 | resetP 融合 +0.8% 重复不加；upgradeWeight 在 job ×1.5 后再 pair ×1.6。want=SSR 落到融合桶，优先未拥有，禁止残件/转职。lobby_unit：24 张、仓库融合页、分布 1%～8% SSR、硬保是融合、Spark 能点融合。 | static/lobby/live/ops 绿 | — | 刀4清虫 |
| 2026-08-19 | 三期 | 刀4 清虫 | 门 A 全绿：static / lobby / live / ops / framework / browser 51。无新 P0/P1。未升 4.6.1。未交 APK。 | 门A绿 | — | 停，等人认人 24 张后收工 |
