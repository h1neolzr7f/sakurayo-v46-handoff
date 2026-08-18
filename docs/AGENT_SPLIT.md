# Cursor 分组提示词

先读 [MIRROR_GACHA_BIBLE.md](MIRROR_GACHA_BIBLE.md) 和 [BUG_SWEEP.md](BUG_SWEEP.md)。圣经只读。

## A 组 — 稳组（不要多开改 index.html）

适合 **1 个** Agent 串行：修 P0/P1 → 收视觉 → 把 B 已验收的货接进代码。

```text
你是《樱夜·尸潮》A 组。只读 docs/MIRROR_GACHA_BIBLE.md 与 docs/BUG_SWEEP.md。
基线 src/index.html + src/runtime/*.js。存档键 sakurayoV3，缺字段只补齐。
禁止改名 startGame / update / draw / spawnEnemy / showDialogue。
不要给 update 再包一层。不要引 CDN/新引擎。不要提交密钥和 APK。

本轮只做：P0/P1 类修复、借公式收视觉、把已验收的 gacha 货接到寻访/仓库/resetP。
不要新写 66 段失败故事，不要批量出新卡面，不要重做镜头大地图。

流程按 BUG_SWEEP 三道门。最多 5 轮类迭代。
每修一类补回归。第二轮起写清「上轮为何漏」并变成测试。
门 C 固定剧本全绿、连续两轮无新 P0/P1 再谈打包。
借鉴只借公式（软保、镜头跟随），不引进 Phaser/Pixi/商业立绘。
商店旧皮肤仍不卖伤害；寻访可以卖伤害，数字以圣经为准。
```

## B 组 — 内容组（可按货表多开）

每个 Agent **一张切片**：图 + 同一张卡的四段文 + 文件名。不要改 `src/index.html` 战斗。

```text
你是《樱夜·尸潮》B 组。只读 docs/MIRROR_GACHA_BIBLE.md。
只产出 game/art/gacha/ 新图（或草稿 PNG）和仓库四段文案。
禁止改 startGame/update/draw、禁止清档、禁止引 CDN。

封面必须能认出小夜/绫/凛音：发色 + 兵器剪影锁死，失败看得见。
旧 8 张残件不覆盖原文件，只改文案。男人 last_witness 不当女主。
careers/ 与 fusions/ 闪图不能直接当封面。
四段各约 80–120 字，临终更短，第一人称，和封面是同一个人。
第一期只做：8 残件文案 + 14 基础职业卡 + 小夜编年骨架。
转职 28、融合 24、时装传说、武器传说等圣经稳了再开下一波。
交收：远看能报出是谁；文件名用圣经里的 id；不发明新宇宙（接第零次死亡/剑冢/镜零）。
```

B 并行槽（第一期）：

1. 残件 8 文案  
2. 小夜基础五张  
3. 绫基础五张  
4. 凛音基础四张  
5. 小夜编年  

## 汇合

B 认人验收通过 → A 接线 → 门 A/C → 打包。  
不要 B 还在画时就把半套 id 写进存档迁移。
