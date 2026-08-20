# V4.6 — 横屏大厅与镜界寻访

当前源码 **4.6.7**。versionCode 68。大厅加回二游首页信息密度。

## 4.6.7 — 2026-08-20

用户对照两张大厅图，明确原来那张高密度首页才是二游，4.6.6 极简右栏不像。

- 左上角色状态：名字、Lv、经验条、登录台词
- 左侧竖栏：任务 / 成就 / 邮件 / 公告 / 设置
- 右上四货币 + 背包 / 菜单 / 更多
- 右侧关卡大卡恢复风味文、推荐等级、进度
- 证词模式、主神空间两张卡
- 出击按钮改回 `出击 START >>>`
- 底栏「仓库」改回「名册」
- 立绘和 `lobby_wide` 留下，没有恢复塔防坞，没有新存档键
- 对照生成素材：左栏/启动页/右上邮箱背包改回用已入库图标，不再用字母占位
- 同号增补：樱花币兑换碎镜片/主神点/寻访票；点立绘捡 🌸1，飘 +1，三角色各 6 句随机捡钱台词；成就「石阶拾樱 / 神社守财」
- 右栏改弹性分栏，钱包上四币下四钮，14 职业纹章压成一条；兑换所展 14+28+24 纹章和残件/时装/武器/四章图
- 单文件 SHA-256 `16bf84e8fa88ffabad655c7a914c7e4cdcea89c4e85d2d3a79af7947d30ec589`
- 测试 APK SHA-256 `f4d8456266048d6e475a64c887050e764af89d3d6bc6c0c2d0174f2ddc91530e`

## 4.6.6 — 2026-08-20

用 Playwright 横屏 932×430 截完整 DOM 真图后再改，不再用 canvas 拼图验收。

- 对话去掉 `center 26%/cover` 和 `:after` 暗角，左侧放大高清半身（`dialogue.webp` / NPC `portrait.webp`），底部台词条
- 怪物绘制裁剪改走 `SakurayoCamera.contains`，不再用屏幕宽高把世界坐标敌人裁没
- 战场图按屏铺，不再拉满整张大地图
- 升级层再压到约半屏，横屏隐藏过长 readout
- 拿真图命令：`node tests/real_shots.mjs`
- 单文件 SHA-256 `cd1756dc2862a4426a2fa25f07afaaa0887edfb1f053789252753327b96553a5`
- 测试 APK SHA-256 `7962f564c8cad2774b3769277a968dd69fd4032661fb6958db7629bb9977b1c1`

## 4.6.5 — 2026-08-20

横屏二游手感修补。存档仍 `sakurayoV3`。测试包名不变，可覆盖 4.6.4-test。

- 大厅不再被 `cover_v36_main_god` 盖回去
- 对话用高清半身，底部台词条
- 升级/暂停缩小；抽屉左右滑
- 局内塔防坞退役
- 刷怪加密、怪物描边、地面变亮
- 测试 APK SHA-256 `6b1c1883e5af73bfd8bbbd9c39e0bcb5eb9bb448c92b4ab4d1a7240b702caffe`
- 直链：https://github.com/h1neolzr7f/sakurayo-v46-handoff/releases/download/v4.6.5/Sakurayo-ZombieTide-TEST-v4.6.5.apk

## 4.6.4 画面与操作修补 — 2026-08-20

对标横屏二游手感，不改存档键，不包 `update`。

- 大厅不再被 `cover_v36_main_god` 盖回去，继续用 `lobby_wide`
- 对话优先用高清 `dialogue.webp` / NPC `portrait.webp`，横屏改成左侧半身、底部台词条，不再裁成半张脸
- 升级/暂停层缩小，战场还能看见；横屏抽屉改左右滑，不再上下滑
- 局内 DP 塔防坞退役：不显示、不部署、不画干员
- 刷怪更密，怪物加描边；战场暗角从 0.26 降到 0.08

## 4.6.4 — 2026-08-20

独立测试包，避免覆盖正式「樱夜·尸潮」。`sakurayoV3` 只补字段。

- Debug `applicationId` → `com.sakurayo.zombietide.test`（正式包仍是 `com.sakurayo.zombietide`）
- 桌面名「测试版樱夜」；大厅封面在测试 APK 里也写这个名字
- `versionName` 4.6.4-test / `versionCode` **65**
- 统计导出和平衡报告不再写死 3.8 / 4.1
- 本仓 Release：https://github.com/h1neolzr7f/sakurayo-v46-handoff/releases/tag/v4.6.4
- 单文件 SHA-256：`957a8dbecc1c8e77838430325b7510561d30ade6f0c295244b2d18211843ca88`
- 测试 APK SHA-256：`c6aaf1972ce2d27860514a2dda3a4c0f93b1f10fbe5c80a0d237e4bd521f16e2`
- APK 直链：https://github.com/h1neolzr7f/sakurayo-v46-handoff/releases/download/v4.6.4/Sakurayo-ZombieTide-TEST-v4.6.4.apk

## 4.6.3 — 2026-08-20

升补丁号。叠层修复随 4.6.2 复测一并带上：电台 `bottom ≥ 158px`、`hideExplorationLayer41()`、隐藏关藏 `#menu`。`sakurayoV3` 只补字段。

后续同号修补：关掉 `?beta` / 内测抽屉 / `__SAKURAYO_BETA__` / 立绘 10 连点。`?test=1` 与 `?debug=1` 只在 `src/index.html` 开发源码生效，正式包和 Android 资源打不开。内测 🌸9999 改从大厅邮箱领取；旧档若已用过后门，只收致谢信。

- 离线/Android 单文件 SHA-256：`7a87fbe90d14bd93ea779df37162003bab0d836790b2a48bcf6cb8aa2778be67`（关后门 + 邮箱后重打）
- Debug APK SHA-256：`c886e0820ca2932ff0573f783ad03fdfcca6ea0172d3536c8498a2bdb8a64dda`（关后门 + 邮箱后重打）
- 包名 `com.sakurayo.zombietide`，versionName 4.6.3 / versionCode 64。无正式证书（本环境无 `keystore.properties`），debug 签名。不要卸旧正式包覆盖。
- 本仓 Release：https://github.com/h1neolzr7f/sakurayo-v46-handoff/releases/tag/v4.6.3
- APK 直链：https://github.com/h1neolzr7f/sakurayo-v46-handoff/releases/download/v4.6.3/Sakurayo-ZombieTide-v4.6.3-android-debug.apk

## 4.6.2 — 2026-08-19

证词与演习彻底分账：结算不写 `done` / `unlock` / `endings` / 构筑卡，也不累加 `kills` / `runs` / `best`，不跑 `checkAch()`，局内不点 `lv12` / `flaw` / `phasebreak`。跨章回声按模式分袋。局内存档只在大厅刷新。隐藏关通关标题用完美结局名。`plan` 文案对上稳定度 +8。versionCode 63。存档仍 `sakurayoV3`。

- 离线/Android 单文件 SHA-256：`b873d8d712cfddad93c242aa68a666838bd6c1238dd9a1b5c3375e962b924390`
- Debug APK SHA-256：`e96a16323b2234f2c781d3e2c099114d7c56f04662d97abc35224e65b9364376`
- 包名 `com.sakurayo.zombietide`，versionName 4.6.2 / versionCode 63。无正式证书（本环境无 `keystore.properties`），debug 签名。不要卸旧正式包覆盖。

## 4.6.1 — 2026-08-19

补丁号，方便和 4.6.0 清虫包区分。`sakurayoV3` 只补字段。未打 tag、未交 APK/密钥。

- `VERSION` / `SAKURAYO_GAME_VERSION` / 运行时回退值 / Android `versionName` → **4.6.1**
- `versionCode` 61 → **62**
- `MainActivity` UA `SakurayoAndroid/4.6.1`
- 冒烟断言 `"version": "4.6.1"`
- 结算把本局构筑卡（融合 > 转职 > 基础校 > 角色残件）发进仓库；同卡并星 1–5，按星级加伤害
- 失败时电台播「晚安，小夜 / 绫 / 凛音」
- 去掉「重复不加 / 寻访卡不卖伤害」的过时设定；商店衣装仍只改外观和倾向
- 局内剧情按人味三层重写：先对上情绪，再讲清楚发生了什么。开场、抉择、转阶段、通关改为能听懂的人话。抉择用章节 CG，拥有对应卡则出卡面回声。flag / 编年 / 未归卡正文未改
- 专有词由主角问一句、电台闲聊答：可预测的版本＝数字备份，回收＝拷进机器，备份＝另存一份也会疼的人
- 终章补「突破」宣泄口：先写死悲剧（第318座墓 / 门后只走一个人 / 假人续黄泉流），Boss 死后抢回不在表上的结局。选项名、flag、结局名未改
- 完美结局改为隐藏关：四章八步线索都做对、且已通关前三章，终章先结算写定的最坏结局，再打更强隐藏 Boss 才解锁双生存续 / 姐妹归还 / 黄泉活人道场
- 剧情节奏再收：终章先写人的损失，选项不再剧透隐藏结局，跨章回声读真实 flag，选对线索电台各不相同。1–3 章转阶段用人话，第四章才念最坏结局。flag / 结局名 / 选项名未改
- 档案回顾改成八步人话清单；证词写入 `shop40.ops.story`，隐藏门闩只读演习记忆；公开名单约 +4% 精英；删掉绫/凛音第四章叠着的旧结局层
- 证词通关不再解锁演习章节、档案、结局和构筑卡；跨章回声按当前模式读记忆；局内存档不再刷新大厅；抉择「压强下降」改成「构筑稳定度 +8」

## 4.6.0 — 2026-08-14

versionCode 61。

## 落地

- 大厅改为横屏优先、竖屏回退。出击仍是主按钮；寻访、名册、商店、关卡、档案五格导航。
- 镜界寻访：单抽 160 / 十连 1440，SSR 1%，80 抽证人保底。只进名册，不卖伤害。
- 名册 8 格。旧存档默认点亮小夜、绫两张常见卡。
- 立绘连点 10 下发 9999 樱花币。成就：初访、十连、证人、集齐。
- 存档仍用 `sakurayoV3`，新字段写在 `shop40.ops`。没有再包 `update`。
- 寻访页重做成全屏横幅 + 保底轨 + 翻牌揭示；名册 8 格用独立卡面。
- 新美术：`gacha/banner_bg`、卡背、8 张卡面、三角色抠图立绘、寻访/名册导航图标。只进收藏，不卖伤害。
- A 期去毛坯：寻访大标题、双保底轨写「距保底还有 N 抽」、按钮标 160/1440、落花、立绘底边溶进底栏；名册未回收只用卡背并可点开详情；大厅主按钮固定「出击」。完整计划见 `docs/PLAN_V46_ERYOU.md`。
- B 期：关卡页模式条「回收演习 / 证词模式 / 主神空间」。证词模式复用四章对话与场地，升级只回血不弹卡；第一章与证词都门禁融合/飞升。`selectStage` 仍强制 `story`。
- 大厅宽背景 `ui/lobby_wide.webp`，默认皮肤 `live_idle` 动图 + `live_blink` 仿 Live2D。管线：`tools/image2/live_pipeline.py`（绿幕/黑边视频抽帧抠像）。
- 商店/档案抽屉换成同一套金粉玻璃；档案四格带副标。没有再包 `update`。
- 精装修：对话静帧重抠 + 遮罩抹圆 + 无损 WebP；横屏商店只留钱包一栏；剧情/飞升/成就内页玻璃卡。512 原画锯齿仍在，真绿幕站桩等 I2V。
- C 期玩法骨架：局内 DP + 最多 2 名干员钉地。小夜/绫/凛音互为可部署名单，证词模式关闭。开火走现有 `pushBullet`/`aoe`，`source:"summon"`，不进宠物数组、不卖永久伤害。左下 `#opsDock46`，数字键 1/2 可部署。挂 `combat:after-update`，没有再包 `update`。
- 横屏才是主界面和主战场：Android 锁 `landscape`。`html.landscape46` 默认就在，大厅/寻访左右分栏不再等窗口先变成横的。竖屏只保留射击操作并提示横持。画布跟 `visualViewport` 铺满。
- 仿 Live2D 按 Cubism 教程重做：眨眼用 Mean 2.5s ±2s，不再 5.4s 死循环；注视跟指针并阻尼回正；点头/点身各有一段淡入淡出动作。立绘去掉多层 `drop-shadow`/`blur`，抽屉不再整屏 backdrop-filter。`html.landscape46` 按宽高比铺横屏，不单靠 orientation 媒体查询。
- 局内镜头大地图：世界 4×2 视口（8 屏），角色居中跟随，怪从当前视口外刷。卡池未改。

## 清虫修复（已并入 4.6.1）

2026-08-19。`sakurayoV3` 只补字段。门 A + `emu_loop` 37 绿。

- 结算：脏飞升/融合 ID 不再抛错或写出 `undefined`，`#result` 必出。
- 大厅出击写入关卡胶囊模式；主神须点「进入轮回」；主神胶囊下点章节不再打回 story。
- 大厅 toast 可见，开局清空队列，不再漏进战斗。
- 战斗 toast 不再压 `#mission`；模态收 `#warning`；干员坞抬离摇杆；寻访 pity 抬离抽卡坞。
- 开局不再复述 mission；剧情态藏坞；Boss 规则条让开构筑条。
- 4×2 战场图一帧只铺一张；删竖版回退与横持提示。

### 发布包

- 单文件：`release/樱夜尸潮_V4.6.0_单文件.html`（gitignore，不进 git）
- 与 `android-app/app/src/main/assets/index.html` 同哈希
- SHA-256：`b509755294730094c266865cbfa4b36999bd3701cd53988133e59f527c24ca8f`
- 字节：1990921
- 未打 tag、未交 APK/密钥
