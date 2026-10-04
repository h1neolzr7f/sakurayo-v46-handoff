# 樱夜指挥大厅 Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline; verify each task before continuing.

**Goal:** 完整的横屏大厅、角色资料、出击整备及离线补给。
**Architecture:** 新增独立原生 JS 模块，读取主游戏的视图模型与回调；不改战斗 update/draw。CSS 由新模块统一管理，资源本地 WebP。
**Tech Stack:** Vanilla JavaScript/CSS, Node tests, Playwright, Python offline bundler.
**Spec:** docs/superpowers/specs/2026-10-04-command-lobby-design.md

## Global Constraints
- sakurayoV3 不清档；新状态仅 shop40.ops.supplies。
- 不联网运行、不改寻访数值与战斗机制、不包 update。
- 横屏默认、全部现有选择器与五入口保留。

## Review Focus
- 旧档缺少 shop40/ops 不应丢已有金币与字段。
- 连续领取或重载不能重复加币。
- 未解锁里程碑不能提前领奖。
- 角色与衣装切换后整备信息必须同步。
- 低矮横屏、竖屏各入口可点，不被角色立绘覆盖。

### Task 1: 指挥大厅模块与补给状态
**Files:** src/runtime/sakurayo-command.js; tests/command_unit.mjs
**Interfaces:** inbox(save) returns finite milestone rows; claimSupply(save,id) returns {ok,reason,reward}.
- [x] 写旧档、重复领取、锁定里程碑断言并观察失败。
- [x] 实现视图模块与安全一次领取逻辑。
- [x] 跑 command_unit 与现有 lobby_unit/live_unit/ops_unit。

### Task 2: 大厅视觉、角色资料与出击整备
**Files:** src/index.html; src/runtime/sakurayo-command.js; local art/ui/lobby-command-v2.webp
**Interfaces:** mount({art,model,open,prepare,start,selectCharacter,claim,settings,saveManager}); model() reads current save and loadout.
- [x] 接入角色资料、整备、补给、战绩面板与现有游戏回调。
- [x] 用指定 API 出图、检查后本地化 WebP，记录提示词及来源。
- [x] 浏览器检查所有入口、领取与重载、三个角色及布局；修复实际问题。

### Task 3: 交付与回归
**Files:** tools/verify.sh; README.md; CHANGELOG.md; docs/VALIDATION_COMMAND_LOBBY.md; Android game/index.html
- [x] 完成静态、语法、单元和真实浏览器冒烟。
- [x] 构建离线 HTML，同步 Android 入口，写出验证结果。
- [x] 审查变更后通过 GitHub 插件提交独立分支与 PR。

### Task 4: 四章场景与动画追加
**Files:** local art/stages/stage_N/{battle_bg_v2,chapter_keyart_v2}.webp; art/ui/command-seal-*; src/runtime/sakurayo-lifecycle.js; tests/chapter_design_unit.mjs
- [x] 生成四章地图地面/章节插画及八帧图集，检查构图和可读性。
- [x] 地图照片上添加固定预算的章节环境动画、障碍清晰绘制及镜面回声。
- [x] 以八帧循环 WebP 接入大厅，减少动态偏好使用静帧。
- [x] 最终集中回归、同步离线入口并提交可审阅 GitHub PR。
