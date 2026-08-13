# 当前单文件架构定位

`src/index.html` 约 1.46 MB，图片与代码均内嵌。以下位置用于快速导航，行号可能随修改变化，请同时用函数名搜索。

- 存档初始化与兼容：文件前部，搜索 `sakurayoV3`
- 战斗实体数组：搜索 `let bullets =`
- 场地危险：`updateArenaHazards()` / `drawArenaHazards()`
- 职业数据与成型：`const CAREERS` / `updateCareerFormation()`
- 开局：`startGame()`
- 剧情模态：`showDialogue()`
- 刷怪：`spawnEnemy()`
- HUD：`updateHud()`
- 主渲染：`draw()`
- 三角色数据：`const CHARACTERS35`
- 皮肤数据：`const SKINS35`
- 商店：`renderShop35()`
- 角色绘制：`drawChar35()`

## 已知历史事故

V3.4 曾在合并代码时删除 `draw()`，造成第一帧抛出 `ReferenceError`，角色、怪物、计时和刷怪全部停止。任何自动重构后都应检查核心函数定义和调用完整性。

## 建议重构方式

开发阶段可拆为：

- `data/`：角色、皮肤、职业、融合、敌人、关卡、剧情
- `core/`：主循环、固定步长、碰撞、实体池
- `systems/`：升级、职业、飞升、商店、存档、成就
- `ui/`：菜单、HUD、对话、吐槽、图鉴、结算
- `render/`：角色、敌人、弹幕、场地和特效

使用构建脚本重新内联到单文件发布版。不要一开始就大规模重写全部运行逻辑。
# V4.1 架构入口

- 详细架构：`docs/ARCHITECTURE_V4.1.md`
- 内容包说明：`docs/EXTENSION_GUIDE.md`
- 内容运行时：`src/runtime/sakurayo-content-runtime.js`
- 内容包清单：`src/content/extensions.manifest.js`
- 构建入口：`tools/build_game.py`
- Android 同步：`android-app/sync-game.ps1`
