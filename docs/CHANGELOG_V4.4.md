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
