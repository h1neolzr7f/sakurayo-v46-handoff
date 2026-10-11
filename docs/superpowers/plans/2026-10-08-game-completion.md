# 游戏体验收敛 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成本轮六项不足的代码改进及可运行验证，保持开发草稿。

**Architecture:** 收藏逻辑与战斗属性解耦；纯试炼规则模块由现有开局、DP、升级、结算入口调用；表现模块只负责画面与声音。新增测试覆盖源码、离线 HTML 和真实 Android WebView，逐任务提交并审查。

**Tech Stack:** 原生 JavaScript / Canvas / WebAudio、Node、Playwright、Python 打包、Android Java/Gradle。

**Spec:** `docs/superpowers/specs/2026-10-08-game-completion-design.md`

## Global Constraints

- 版本保持 4.6.0 / code61；存档键保持 `sakurayoV3`，禁止清档。
- 三角色、四章、14 基础职业、28 转职、24 融合、三相飞升和三个出击模式保留。
- 寻访卡、寻访衣装及寻访武器只提供收藏、外观和已明示的职业倾向，不改变战斗属性。原有天赋、初始核心、带代价的商店武器道具和主神兑换保留。
- 保留抽卡概率、保底、价格、持有数、装备选择、收据及所有已消费币；不自动出售或删除收藏。
- 离线，无账号、广告、CDN或外部运行时依赖；奖励有限且只能首次领取。
- 直接改现有生产入口，不增加 `update/startGame/finish/damagePlayer` 包装层；实体与效果仍有上限，精简特效和系统减少动态效果有效。
- 继续开发草稿，不合并 main、不发布 APK。Android 模拟器证据与实体机证据分开记录。

## Review Focus

- 满收藏旧档开局不带隐藏加成，正规成长仍生效（Task 1）。
- 试炼重试/模式切换/返回大厅不泄漏规则，重复结算不给币（Task 2）。
- 减少动态效果和后台暂停不吞必要危险提示、不继续发声（Task 3）。
- 平衡流程不借保护玩家掩盖受伤路径，固定存档隔离（Task 4）。
- Android 导出取消和覆盖安装不丢存档，返回键先关当前面板（Task 5）。

---

### Task 1: 收藏与战斗属性解耦

**Files:** Modify `src/runtime/sakurayo-lobby.js`, `src/index.html`, `tests/lobby_unit.mjs`, `.github/workflows/verify.yml`; Create `tests/collection_unit.mjs`, `tests/collection_smoke.mjs`.

**Interfaces:** Consumes 实际 `resetP` 和 `SakurayoLobby` 收藏/升级权重；Produces 开局不应用收藏属性、保留原装备存档及可见收藏规则。

- [ ] 写失败用例：相同正规整备的新档与满收藏档实际开局 `dmg/hp/crit/spd/skillCd/sh/reduce` 相同；装备时装/寻访武器后也相同，收藏/保底/装备选择不丢。
- [ ] 运行 `node tests/collection_unit.mjs`，观察当前持有加成导致断言失败。
- [ ] 删除 `applyOwnedBonus` 的生产调用和实现、无效加成数据/文案；更新旧单位用例中绑定旧加成的断言，保留真实收藏/倾向验证。
- [ ] 运行新增单位、lobby/economy/save/state 检查及静态验证；新增源码/离线 smoke 进入实际开局并比较属性。
- [ ] CI 单独上传 Playwright 浏览器缓存为 `browser-validation-runtime`，保留一天、压缩等级 1；供当前环境恢复浏览器并继续后续本地验证，不替代 CI 实际回归。
- [ ] 提交 `fix: keep gacha collection out of combat stats`，报告 RED/GREEN 和局部限制。

### Task 2: 离线试炼与个人纪录

**Files:** Create `src/runtime/sakurayo-trials.js`, `tests/trials_unit.mjs`, `tests/trials_smoke.mjs`; Modify lobby/save/command/ops 集成和 `src/index.html`。

**Interfaces:** Produces `SakurayoTrials.catalog`, `normalize(raw)`, `available(save,id)`, `complete(save,id,run)`（run 包含 win/damageTaken/duration，返回 success/reward/best），以及由实际入口调用的试炼选择/清除状态。Consuming Tasks 4/5 使用可见活动入口而不绕过规则。

- [ ] 写失败测试：solo/sealed/flawless 门槛、120/180/240 首次奖励、失败不领奖、第二次只更新最佳、无伤资格、非法/旧档归一化与存档保留。
- [ ] 运行 `node tests/trials_unit.mjs` 观察缺失功能失败。
- [ ] 实现规格中的规则和活动 UI；在现有开局/结算/返回/升级/DP 入口直接集成，禁止新增包装。实际返回大厅清除、retry 保留；常规胜利与试炼结果分别显示。
- [ ] 浏览器回归真实点活动/整备/出击，检查封印不弹卡、独行不能部署、无伤成功/受伤失败、重载收据和规则清理；运行 state/services/command/ops/save 单位及静态检查。
- [ ] 提交 `feat: add finite offline trials and personal records`。

### Task 3: 战斗反馈、角色动作与章节音乐

**Files:** Create focused `src/runtime/sakurayo-presentation.js`, `tests/presentation_unit.mjs`, `tests/presentation_smoke.mjs`; Modify live/command、现有 Canvas/声音入口和 `src/index.html`。

**Interfaces:** Produces bounded 表现状态、角色动作配置和章节/Boss 音乐控制；直接使用实际音量和有效 reducedMotion。Consumers 是既有受击、绘制、技能、开局和平台挂起入口。

- [ ] 写失败用例：反馈暂停不消耗、恢复不跨局；三角色反应不同并有冷却；减少动态效果保留危险边界，音量零/后台暂停不继续发声。
- [ ] 运行 `node tests/presentation_unit.mjs` 观察缺失功能失败。
- [ ] 用现有素材实现辨识和反馈、角色专属待机/点触短句、章节旋律/Boss变化；从旧感官包装移入已有入口并删除被替代代码。保持实体上限、伤害及碰撞不变，不造新函数包装。
- [ ] 运行 live/motion/platform/hits/state 单位和新增 smoke；截图检查 1280×720 与 640×360、必要警告/文字遮挡及精简效果。
- [ ] 提交 `feat: sharpen combat feedback and character presentation`。

### Task 4: 平衡矩阵与完整回归

**Files:** Modify `tests/balance_diagnostic.mjs`, `tests/README.md`, `tools/verify.sh`, `tools/verify.ps1`; Create `tests/balance_smoke.mjs`；同步 Android 离线 HTML。

**Interfaces:** Consumes 前三任务的真实行为；Produces 固定种子、独立存档、角色/正规整备/试炼诊断证据和未使用保护的受伤流程，保持原 <1.30 断言。

- [ ] 写并运行失败测试：独立新档矩阵检查实际受伤/攻击/结算与每局重置；多种子诊断生成不同输入的记录，禁止复用长流程存档。
- [ ] 实现测试和诊断，必要时只对证明的实际失衡作根因修正并记录依据；不要无证据调伤害系数。
- [ ] 两种验证脚本均覆盖新增单位/smoke；静态验证重建离线 HTML，完整 CI 运行真实浏览器源码/离线回归与 Android 编译/lint。
- [ ] 提交 `test: extend isolated balance and mobile regressions`。

### Task 5: Android WebView 模拟器验收与交接

**Files:** Modify Android Gradle/测试 manifest 和 `.github/workflows/verify.yml`; Create Android instrumentation（`android-app/app/src/androidTest/`）及 `docs/VALIDATION_GAME_COMPLETION.md`；更新 CHANGELOG/HANDOFF。

**Interfaces:** Consumes 打包真实 WebView 和活动/试炼入口；Produces CI instrumentation、覆盖安装存档保留步骤、有限持续操作日志和准确验收记录。

- [ ] 先写可失败的 instrumentation：实际启动、横屏输入、面板返回、后台恢复、导出取消、覆盖安装标记保留。使用 Android 原生 instrumentation；若依赖受平台约束，说明并选最小可运行替代。
- [ ] 配置 Android 模拟器 CI 与测试构建，运行并修复证明的实际问题；每个新修复需 RED→GREEN。持续操作有超时，区分模拟器和实体机证据。
- [ ] 运行源码/离线完整 CI、Android build/lint 和 instrumentation；记录对应代码 SHA，完成独立全分支审查并修复必须项。
- [ ] 更新草稿 PR 及交接文档，明确实体机温度/听感/正式签名升级仍需实际设备；提交 `test: verify packaged Android WebView lifecycle`。
