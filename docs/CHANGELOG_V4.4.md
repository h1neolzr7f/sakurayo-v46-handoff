# V4.5.2 闪图结算、图鉴三行、融合色特效

- 新 6 融合升级卡改用自己的 `fusions/{id}/splash.webp`，不再借旧融合封面。
- 通关/死亡结算和暂停页铺当前衣装闪图；暂停页加待机立绘。
- 职业图鉴把「成型 / 天敌 / 代价」固定到前三行；融合与飞升同样改成「成型」标签。
- 亡骨枪、纳米忍、生体御神子、血焰术、元素御兽、瘟律歌姬的射击/冲刺/技能带本色特效；其他融合射击也跟衣装色。
- 紧凑 HUD 藏顶栏衣装芯片，名称仍在暂停页。
- 没有再包 `update`。存档键仍是 `sakurayoV3`。
- 版本 4.5.2 / versionCode 59 / UA `SakurayoAndroid/4.5.2`。

# V4.5.1 融合换装与揭示卡

- 战斗换装解析：飞升 > 融合 > 转职 > 商店皮肤 > 默认。缺图回退上一档。
- 转职 / 融合 / 飞升时打出短揭示卡（闪图 + 待机立绘 + 名称），揭示期间吐槽电台让路。
- 职业与融合也有光环，融合另加外环；HUD 芯片和暂停页写当前衣装名。
- 升级卡与职业图鉴在有闪图时铺背景。
- 首批融合战斗服与融合闪图按资源到位接入；没有再包 `update`。存档键仍是 `sakurayoV3`。
- 版本 4.5.1 / versionCode 58 / UA `SakurayoAndroid/4.5.1`。

# V4.5.0 转职飞升真换装

- 战斗换装解析顺序：飞升形态 > 转职衣装 > 商店皮肤 > 默认。
- 28 条转职 × 三角色 × idle/move/attack，加上三相飞升，共 93 套战斗服；签名 12 套另有 skill/dash。
- 28 张职业闪图齐了。虚空尸/噬空尸有 `_b` 切帧。
- 换装淡入淡出，飞升形态有光环。职业服的 skill 帧会真正用上。缺图回退上一档。
- 没有再包 `update`。存档键仍是 `sakurayoV3`。
- 版本 4.5.0 / versionCode 57 / UA `SakurayoAndroid/4.5.0`。

# V4.4.6 扩展美术接入与克制怪分图

- 接入另一套 expansion 素材：NPC 立绘/表情、28 职业全身图、四章 CG、飞升闪图、虚空圣所包。离线包与 Android 资源对齐。
- 修正猎宠/噪声/噬魂/反影刃四张新怪被写成精英/干扰/幽灵/快速副本的问题；旧四怪从 git 恢复，新四怪用独立源图重导出。
- 旧四怪 `_b` 按恢复后的原图重做；新四怪补 `_b` 切帧。无名剑主补齐 calm/serious/smile/surprised。
- 职业升级卡有闪图时作背景；职业图鉴显示两分支全身缩略图。没有再包 `update`。
- 版本 4.4.6 / versionCode 56 / UA `SakurayoAndroid/4.4.6`。存档键仍是 `sakurayoV3`。离线/Android 包 SHA-256 `0F17E128372E6197F45DC2A46ED5EC1214A4CC1EFCDADCEF6382A18687E4CD9D`。
- Release APK：GitHub Releases 的 `Sakurayo-ZombieTide-v4.4.6-android.apk`，SHA-256 `D3CCD15CF38955951A5917217C22EAB8B136B45CFA82A04D75030D9F5C6B33EB`。沿用 V3.7 正式证书，v1/v2 通过。

# V4.4.5 尸潮加帧、受击与召唤物

- 12 类杂兵各有 `_b` 迈步/扑击切帧；不改 `COMBAT_ART38` 的 28 项清单，缺图回退基础贴图。
- 默认皮肤受击切 `hit_b`；碎裂与升级特效后半段切 `_b`。
- 无人机 / 夜蝠 / 使魔 / 魂灯改为贴图并切 `_b`，缺图仍走原来的矢量。没有再包 `update`。
- 版本 4.4.5 / versionCode 55 / UA `SakurayoAndroid/4.4.5`。存档键仍是 `sakurayoV3`。离线/Android 包 SHA-256 `0D747E5DC7199606C55A4A8D672DEBF1FB85C0757C809C577B1C394B0314E151`。

# V4.4.4 主页动图与战斗加帧

- 默认皮肤主页用 `live_idle.webp` 循环眨眼，失败回退 dialogue；不进 CORE_ART，不走 `artImage()`。
- 默认皮肤战斗加 idle_c / move_b / attack_c / skill_b / dash_b，按时间切帧；衣装缺加帧时只回退基础 pose，避免 404。
- 斩击、枪口、受击、技能、冲刺、掉落特效后半段切 `_b` 帧；冲刺画一层残影。没有再包 `update`。
- 版本 4.4.4 / versionCode 54 / UA `SakurayoAndroid/4.4.4`。存档键仍是 `sakurayoV3`。离线/Android 包 SHA-256 `52CDE02153DA4CF7E1ABAAB7672DC9085389CF68C2E3717A97FF1702DA2E5325`。

# V4.4.3 二游主页与扩展补齐

- 主页按二游主界面收：角色占满竖屏、底边渐隐吃掉立绘黑矩形、去掉 `lighten` 洗白；三角色收到左侧圆头像，开始键和六格导航贴底。
- 开场/转阶段/Boss/低血对白改用 smile、surprised、mad、sad 等表情；缺图仍回退 calm 或 dialogue。
- 四只新怪图覆盖到现有 ID（干扰/幽灵/精英/快速），不改 11 类剪影。幻影衣装走官方示例包，商店 11 张皮肤，不新增第 5 个内容包。
- 版本 4.4.3 / versionCode 53 / UA `SakurayoAndroid/4.4.3`。存档键仍是 `sakurayoV3`。

# V4.4.2 击破 Boss 后进入剧情过场

- 打完 Boss 先全屏剧情过场（章节地图缓推 + 角色立绘），再进入原来的结束对白和结算。
- 点击跳过每一镜；测试模式关掉自动计时，`dismissDialogue` 仍能一次走完到「净化」结算。
- 四章和主神空间各有自己的过场文案。没有新 CDN，没有改 `showDialogue` 函数名。
- 版本 4.4.2 / versionCode 52 / UA `SakurayoAndroid/4.4.2`。

# V4.4.1 过场、商店与 Git 基线

- 对白有章节色条、立绘缓推和打字机；点击先出全文，测试模式仍一次一行，不卡 `dismissDialogue`。
- Boss 转阶段有短闪；抉择/结算/警告入场淡入。没有改 `showDialogue` 函数名，也没有新 CDN。
- 商店顶栏显示钱包、角色推荐和下一步可买；买不起写清还差多少；记住上次页签。皮肤仍 10 张、页签仍 5 个、`shopItem40` 仍 24。
- 结算拆开击破/等级/精英/通关/首通。首通 +40 樱花币。主神空间仍不发普通币。初始核心价格未改，500 币仍买得起 assault。
- 新增 `src/runtime/sakurayo-cutscene.js`、`sakurayo-economy.js`。版本 4.4.1 / versionCode 51 / UA `SakurayoAndroid/4.4.1`。
- 本目录初始化 Git：`.gitignore`、`.gitattributes`、`README.md`、`docs/MAINTAIN.md`、`tools/verify.ps1`、静态检查 CI。维护步骤见该文档。

# V4.4.0 场面与骨架

- 四章战场各自有地面语言：石板参道鸟居挡弹、雨夜沥青车挡直线、剑冢飞剑区减速近战加伤、碎镜折射一次。
- 第一章前二十秒缩短刷怪间隔、在场不足 8 只时补员，不提高生命、不突破 `caps().e`。
- 十一类杂兵剪影放大；桌面宽屏角色视觉略放大，碰撞半径仍是 96。
- 战斗 HUD 默认只留任务一行（点开才有稳定度/天敌）；技能和冲刺就绪会发亮；暂停页列出学校 1/2 分支点与最近融合。
- 开场对白、章节抉择、绫/凛音专属事件、电台和教程都贴上对应地面；电台按角色分流，提示只弹一次。
- 新增 `src/runtime/sakurayo-lifecycle.js`，地面、障碍、密度和剪影从这里画。没有再给 `update` 加第 9 层包装。
- 版本 4.4.0 / versionCode 50 / UA `SakurayoAndroid/4.4.0`。存档键仍是 `sakurayoV3`。
