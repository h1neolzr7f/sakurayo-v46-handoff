# 2026-10-05 全项目修复

用户已批准全部修复，原审查 docs/AUDIT_2026-10-05.md 的 F01–F30 及已证实附加问题全部纳入。遵循删除、简化、统一实际状态归属，避免新包装链、静默吞错或交易锁。保留 4.6.0 / code61、sakurayoV3、三角色三模式、职业融合和离线单HTML。

独立 worktree 并行修复，顺序合并；每组先失败回归，再根因修复。纯VM用 *_unit.mjs，浏览器用 *_smoke.mjs；不以静态扫描无错误替代行为验证。仅root更新打包HTML、verify脚本与远程PR，不发布APK、不合并main。素材只在实际缺图时使用用户授权中转站API。

| 组 | 修复映射 | 代码职责 |
| --- | --- | --- |
| state | F08 F09 F17 F18、首次娃娃、重复结算、HUD重建 | reset/start/finish/gainXp/openLevel与阶段退出、ops |
| hits | F03 F10 F11 F12 F13 F14 F15 F16 F30、效果窄相 | 命中/数值/弹体/空间/Boss世界坐标 |
| economy | F01 F02 F06 F19 F20 F21 F23 | 可读失败写store、商店/余额/等级/装备/退款 |
| UI | F04 F05 F25 F26 F27 F28 F29 | 用户FX、pointer、UI栈、对白、眨眼、释放输入、死代码 |
| content | F22 F24、停用事件、重复exploreStep | schema边界/启用集合/购买入口 |
| platform | F07、原生导出/后台/重建、音源0/计时暂停 | 稳定平台接口/SAF/WebView/音频/cutscene/Android编译CI |

UI releaseInputs40() 为统一输入清理。原生 window.SakurayoPlatform 由平台组实现，visibility对应 suspend/resume；resume不自动恢复战斗。伤害倍率仅damageEnemy所有，宠物opt.pet标记由子弹生产者提供。动态抽屉和翻牌直接纳入现有UI控制器。

验证：新增回归全纳入 Bash/PowerShell，源码与离线行为相同；固定源码语法、所有unit、资源校验、浏览器战斗/输入/经济/扩展/平台，GitHubCI Android assembleDebug/lintDebug。真机导出/返回/后台/覆盖安装与长期性能不可从桌面或编译结果宣称通过。

进度：执行环境切换导致未推送工作区丢失，已从已保存基线恢复，后续分批远程检查点。浏览器缓存被截断，本地启动失败；浏览器验证在CI真实运行，不伪造通过。
