# 更新记录

当前版本 **v4.6.7**。完整条目按大版本写在 `docs/CHANGELOG_V*.md`。

## v4.6.7 — 2026-08-20

大厅加回二游首页：经验条、登录台词、左栏、多货币、证词/主神卡、出击 START 辉光。左栏和启动页改回用已生成的 `ui/nav` / `loading_art` / `menu_emblem`，不再用「任/就/邮」和单独一个「樱」字。测试包名仍 `com.sakurayo.zombietide.test`。versionCode 68。测试 APK SHA-256 `f4d8456266048d6e475a64c887050e764af89d3d6bc6c0c2d0174f2ddc91530e`。

## v4.6.6 — 2026-08-20

按横屏真图修对话半身、怪物可见、升级层高度。测试包名仍 `com.sakurayo.zombietide.test`。

## v4.6.5 — 2026-08-20

横屏二游手感：封面、对话半身、升级层、禁止竖滑、去掉塔防坞、刷怪可见。versionCode 66。存档仍 `sakurayoV3`。

下载：[测试 APK](https://github.com/h1neolzr7f/sakurayo-v46-handoff/releases/download/v4.6.5/Sakurayo-ZombieTide-TEST-v4.6.5.apk) · [Release](https://github.com/h1neolzr7f/sakurayo-v46-handoff/releases/tag/v4.6.5)

## v4.6.4 — 2026-08-20

Debug 改成独立测试包「测试版樱夜」，包名 `com.sakurayo.zombietide.test`，不会覆盖正式「樱夜·尸潮」。versionCode 65。存档仍 `sakurayoV3`。测试 APK SHA-256 `c6aaf1972ce2d27860514a2dda3a4c0f93b1f10fbe5c80a0d237e4bd521f16e2`。

下载：[测试 APK](https://github.com/h1neolzr7f/sakurayo-v46-handoff/releases/download/v4.6.4/Sakurayo-ZombieTide-TEST-v4.6.4.apk) · [Release](https://github.com/h1neolzr7f/sakurayo-v46-handoff/releases/tag/v4.6.4)

## v4.6.3 — 2026-08-20

升补丁号，方便和 4.6.2 模拟器叠层修复包区分。横屏矮屏电台不再压摇杆；回大厅 / Android 返回会收起探索层；隐藏关入口藏大厅。versionCode 64。存档仍 `sakurayoV3`。Debug APK SHA-256 `c886e0820ca2932ff0573f783ad03fdfcca6ea0172d3536c8498a2bdb8a64dda`（关后门 + 邮箱后重打）。

同号修补：关掉 `?beta` / 内测抽屉 / 立绘连点。`?test=1` 只在开发源码 `src/index.html` 生效。内测 🌸9999 改从大厅邮箱领取。

下载：[APK](https://github.com/h1neolzr7f/sakurayo-v46-handoff/releases/download/v4.6.3/Sakurayo-ZombieTide-v4.6.3-android-debug.apk) · [Release](https://github.com/h1neolzr7f/sakurayo-v46-handoff/releases/tag/v4.6.3)

## v4.6.2 — 2026-08-19

证词结算与演习进度彻底隔离：不写章节/档案/结局/构筑卡，也不累加击杀、局数、最佳时长和战役成就。局内存档不刷大厅。隐藏关结算用完美结局名。横屏矮屏电台不再压摇杆。回大厅 / Android 返回会收起探索层。versionCode 63。存档仍 `sakurayoV3`。Debug APK SHA-256 `a5d44b64a8a325213027c3503abc8b6ba94eb936ee055d8b92ab367eb3c638be`。

## v4.6.1 — 2026-08-19

清虫包升补丁号，方便和 4.6.0 区分。versionCode 62。存档仍 `sakurayoV3`。未交 APK、未打 tag。

结算发卡：本局构筑卡（融合 > 转职 > 基础校 > 角色残件）入仓库，同卡并星 1–5，按星级加伤害。失败时电台播「晚安，小夜/绫/凛音」。角色寻访卡面全部用于仓库与结算揭示。过时的「重复不加 / 卡不卖伤害」已去掉。

## v4.6.0 — 2026-08-14

横屏大厅、镜界寻访（全屏横幅/翻牌/独立卡面）、8 格名册、头像连点作弊币。A 期去毛坯：寻访保底/价格、名册不剧透、大厅出击。B 期：关卡页回收演习/证词模式/主神；证词不发升级卡；大厅抠图 idle + 眨眼仿 Live2D；商店/档案同一套玻璃房。精装修：立绘软边无损、商店一栏钱包、档案内页玻璃卡。C 期：局内 DP + 2 干员钉地，证词关闭，不进宠物槽。横屏是主体验（Android 锁横屏），竖屏只作回退。仿 Live2D 改为随机眨眼、注视阻尼、点头/点身触发，并去掉卡顿滤镜。不卖伤害，不包 `update`。versionCode 61。v4.5.3 已并入 4.6.0。完整计划见 `docs/PLAN_V46_ERYOU.md`。

## v4.5.2 — 2026-08-14

融合闪图用自己的图，不再借旧融合封面。结算和暂停铺当前闪图，暂停页加衣装待机。图鉴职业/融合/飞升把成型、天敌、代价写在前三行。六套新融合的射击/冲刺/技能带本色特效。紧凑 HUD 藏衣装芯片。没有再包 `update`。versionCode 59。

## v4.5.1 — 2026-08-14

融合真换装：解析改为飞升 > 融合 > 转职 > 商店衣。转职/融合/飞升会打出揭示卡并挡住吐槽；职业与融合也有光环。HUD 与暂停页显示当前衣装名。升级卡和图鉴在有闪图时用职业/融合/飞升背景。融合态双层光环。融合服按资源到位回退。没有再包 `update`。versionCode 58。

## v4.5.0 — 2026-08-14

转职飞升真换装：战斗衣装按飞升 > 转职 > 商店皮肤 > 默认解析。28 条转职 × 三角色 + 三相飞升共 93 套 idle/move/attack，签名 12 套另有 skill/dash；28 张职业闪图齐了。换装淡入与飞升光环，缺图回退。versionCode 57。

详见 [docs/CHANGELOG_V4.4.md](docs/CHANGELOG_V4.4.md)。

## v4.4.6 — 2026-08-14

扩展美术接入：NPC、28 职业全身图、四章 CG、飞升闪图、虚空圣所。猎宠 / 噪声 / 噬魂 / 反影刃四只新怪不再覆盖旧怪图。Release APK 沿用正式证书，可覆盖安装。

详见 [docs/CHANGELOG_V4.4.md](docs/CHANGELOG_V4.4.md)。

## 更早

| 版本 | 摘要 |
|---|---|
| v4.4.5 | 杂兵 `_b` 切帧，受击与召唤物贴图 |
| v4.4.4 | 主页眨眼循环，默认皮肤战斗加帧 |
| v4.4.3 | 二游主页收束，表情差分 |
| v4.4.2 | 击破 Boss 后进入剧情过场 |
| v4.4.1 | 对白演出、商店顶栏、Git 基线 |
| v4.4.0 | 四章地面语言与战斗骨架 |

更早的 V3.5–V4.3 记录仍留在 `docs/`。
