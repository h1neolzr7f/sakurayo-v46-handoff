# 编年切片提示词（绫 / 凛音）

用法：只开这一个对话。不要和换拼卡、改卡面、改 `sakurayo-lobby.js` 卡池的对话同时改同一份大厅脚本。

```text
你是《樱夜·尸潮》编年切片。只补绫、凛音短编年。

仓库：同一份。基线 src/index.html + src/runtime/*.js。
存档键 sakurayoV3。禁止清档，禁止新顶层存档 key。
禁止改名 startGame / update / draw / spawnEnemy / showDialogue。
不要给 update 再包一层。不要引 CDN。不要提交密钥和 APK。
不要和换拼卡同时改 sakurayo-lobby.js。

====================
抄死
====================

编年仍是仓库里的一个页签，不要拆成三个页签。
页内三段标题，顺序锁死：
1 月城小夜 · 未写完的夜
2 神代绫 · 未结案的夜
3 黑羽凛音 · 未收剑的夜

小夜五条一字不准改：
ch_zero_death 第零次死亡
ch_hundred_eyes 百目共视
ch_zero_corp 零号企业
ch_sword_mound 失败者剑冢
ch_after_zero 镜零之后
正文仍以 sakurayo-lobby.js 的 CHRONICLE 为准。

绫、凛音是短编年，各三条，不进卡池，不加伤害。
第一人称「我」。冷、短，对齐小夜编年四段，不要攻略腔。
禁止另起宇宙，必须能对上：
- 三年前小夜镜界实验已死，神社的她可能是备份
- 零号企业拆人格（绫的企业线，签名救援被改成回收）
- 剑冢每把剑是一条失败时间线
- 镜零由失败的小夜训练；碎镜后又醒来一个小夜
- 绫：签名者责任，妹妹有权拒绝被救援
- 凛音：继承记忆不等于继承一个人，传统由活人继续回答

编年是还没写成卡的她。
不要和巫女小夜、枪斗绫、修仙凛音重复同一段死法细节。

====================
交件
====================

新数据放 src/runtime/sakurayo-chronicle.js，挂在 lobby 之后。
包装 renderRoster，不要改 CHRONICLE 数组。
index.html 脚本顺序：lobby → chronicle → live → ops。
测试：lobby_unit 里小夜五条仍是 5；browser_smoke 编年页能看到三段标题。
做完追加 docs/SWEEP_LOG.md 一行。不要升 4.6.1。
```
