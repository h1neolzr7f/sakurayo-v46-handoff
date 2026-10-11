# Tactical Terminal Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline, followed by one independent branch review.

**Goal:** 按用户纠正重做战术终端大厅并补齐可用的邮箱、公告、任务和七日签到。
**Architecture:** services 模块处理有限奖励和存档归一化；command 模块负责图标、面板和布局；入口提供持久化及既有导航回调。
**Tech Stack:** 原生 JavaScript/CSS/SVG、Playwright、Pillow。
**Spec:** ../specs/2026-10-05-tactical-terminal-design.md

## Global Constraints
- 版本仍为 4.6.0，使用 sakurayoV3，保留现有战斗及存档。
- 不引入运行时外部依赖、联网请求或品牌素材。
- 七日奖励固定 60/80/100/120/140/160/240；欢迎邮件 200；里程碑与任务共用领取记录。

## Review Focus
- 缺字段和畸形 services 数据不破坏旧存档。
- 同日、回拨日期、重复邮件和一键领取不能重复奖励。
- menuUpdate 重建原按钮后新图标和点击映射保持有效。
- 小屏功能入口无覆盖；重绘后对话框焦点留在内部。
- 源码与 Android 打包页面加载顺序一致。

### Task 1: services 数据与迁移
- [x] 写 services_unit.mjs：缺模块先红；测试邮件共享领取、已读重载、日期回拨/非法日期/七次上限与迁移保留。
- [x] 新增 src/runtime/sakurayo-services.js，导出 normalize/mailbox/markRead/claimMail/claimAll/loginStatus/claimLogin。
- [x] 接入 lobby.normalizeOps 与 index 加载顺序，运行新旧单元测试。

### Task 2: 大厅与服务面板
- [x] 写 tactical_smoke.mjs：验证新增入口缺失先红，之后全入口实际点击、40px、五尺寸、状态重载。
- [x] command 模块新增原创 SVG 图标、疏朗三入口与六图标底栏、邮箱/签到/公告面板；index 提供 persist 回调。
- [x] 调整实际截图，跑 command/tactical smoke 源码与离线入口。

### Task 3: 验收与交付
- [x] 重建 Android 入口、完整 verify、独立审查并修复重要发现。
- [x] 更新验收/变更记录/README 与截图，提交原 PR 的后续修订。

验收：bash tools/verify.sh 退出0，VERIFY PASS；源/离线各52，触控37，P0/P1均0；10张新素材全部验算。最终独立审查记录见 docs/VALIDATION_TACTICAL_LOBBY.md。交付延用原 PR #32，无正式 APK。

最终审查追加：恢复设置中的存档管理；真实点击/邮件及签到导出回归 RED→GREEN，独立复审下载/导入/关闭通过。
