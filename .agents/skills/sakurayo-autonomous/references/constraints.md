# 自主优化时不能破的边界

## 产品

- 三角色定位不变：月城小夜步枪远程、神代绫手枪＋太刀、黑羽凛音纯太刀。
- 14 基础职业、28 转职、融合、科技/生物/灵能飞升、四章、Boss 四阶段、主神空间都要还在。
- 触控摇杆、冲刺、主动技能必须能用。
- 寻访只收藏/证词。不卖永久攻击、生命、暴击。
- 不接账号、广告、通行证、每日任务、排行榜。
- 不删主神空间，不把主神并进寻访。
- 竖屏不是主体验。宽 ≥ 640 必须是横屏大厅。

## 代码

- 基线：`src/index.html` + `src/runtime/*.js`。最终仍要能出单文件 HTML。
- 存档键：`sakurayoV3`。旧档缺字段只补齐。
- 不要给 `update` 再包一层。
- 不要改名 `startGame` / `update` / `draw` / `spawnEnemy` / `showDialogue` 却不改调用点。
- 干员不要塞进 `pets`。
- 不要恢复「每颗子弹遍历全部敌人」。
- 敌人、子弹、Boss 弹、召唤物、伤害字、粒子有上限。Boss 阶段不无限召唤普通怪。
- `__SAKURAYO_TEST__` 是 `Object.freeze` 字面量。新测试 API 必须写进字面量内部。
- `__SAKURAYO_TEST__.selectStage(id)` 必须继续把 `runMode36` 写成 `"story"`。
- 脚本顺序不可乱：content-runtime → lifecycle → cutscene → economy → lobby → live → ops。

## 大厅

- 宽于 640：左约 64% 全身立绘，**头要完整**，`height:100%`，`object-position: center 10%`。
- 右约 34%、最宽 360：币/更多 → 三角色圆钮 → 关卡胶囊 → **出击** → 五格。
- 圆钮不能漂到立绘上。出击文案就是「出击」。
- `paintHomeBg46()` 必须跑在 `installCover36` 之后。

## 提交

- 不提交密钥、JKS、APK、`release/`、`assets/image2/source/`、`local.properties`、`keystore.properties`。
- 不删 `progress.md` 顶部 Original prompt。
- 不要开工就改 `VERSION` / `SAKURAYO_GAME_VERSION`。
