# 经济与存档修复验收

2026-10-06。覆盖审查 F01、F02、F06、F19、F20、F21、F23。

## 行为与规格复核

- F01：删除 localStorage 写探针和伪成功存储。读取直接在启动边界执行，写入失败不会遮蔽原有可读档。`writeSave` 返回实际成功布尔值，并保留独立的可见写入失败提示；后续交易成功 toast 不会清掉该提示，仅真正写入成功才清除。
- 导入先把通过迁移、规范化的候选档写入成功，再原地替换运行存档对象并刷新界面。磁盘写失败时旧运行状态、旧磁盘内容及导入抽屉均保持，未显示导入成功。
- F02：符咒购买与装备拆为两个生产动作。购买只扣一次 80 币并持有，不占排除槽；装备再检查现有持有和槽位。旧购买按钮再次调用只读取当前持有关系，不重复扣币或追加 owned。
- F06：已有诱饵显示真实升级按钮，使用现有 `buyItem40` 升至 Lv.2/Lv.3，依照实际余额禁用，满级不再显示升级按钮。
- F19：三个卡池、作弊增币和大厅快照均直接使用已由存档边界规范化的累计余额；删除独立 99999999 裁剪。
- F20：存档装备关系边界要求普通武器已有等级大于零，未持有 ammo 的旧档/导入档不再装备 ammo。
- F21：删除 cheapestBuy、排序和重复价格推断，以及钱包中“本局可买”商品推荐。保留钱包、角色静态建议、真实商品按钮。
- F23：新增唯一 `SakurayoCatalog` 目录，天赋、主神兑换、普通道具与初始核心共用真实等级上限、价格元数据。存档规范化引用此目录，累计币/主神奖励点仍保留安全整数范围内的合法大额进度。主神投资退款采用有界等级的算术级数闭式公式，每次只遍历有限商品目录。

保留 sakurayoV3、离线加载、4.6.0 / Android code 61、三角色和三模式。未修改翻牌/UI 栈、扩展实现、reset40 或其他局内状态重置链。未执行 build、未修改 verify、未生成或同步发布 HTML/APK。

## 验证证据

修复前 `node --test tests/economy_unit.mjs`：7 个生产行为回归全部失败，分别复现空读取、余额裁剪、超商品等级、符咒负余额、无诱饵升级入口、退款 150ms 超时、过时钱包推荐。

修复后实际通过：

- `node --test tests/economy_unit.mjs tests/save_unit.mjs`：20 项通过。包含新增的写入布尔值/持续错误提示、导入提交先后顺序和全部 27 项商品上限检查。
- `node tests/lobby_unit.mjs`、`node tests/command_unit.mjs`、`node tests/services_unit.mjs` 通过。
- `python tools/static_check.py src/index.html` 及 `node --check tests/artifacts/static/index.extracted.js` 通过；四个改动 runtime 的 `node --check` 通过。
- `node tests/economy_smoke.mjs`：真实浏览器与实际导入/商店/卡池/主神重置控件通过。123456789 币在各卡池单抽扣 160、十连扣 1440；符咒满槽购买仅扣 80、再次装备不误扣；诱饵 Lv.1 → 2 → 3，400 → 240 → 10；主神退款正确返还 133。
- `node tests/quota_smoke.mjs`：真实浏览器模拟 Storage.setItem 的 QuotaExceededError。旧档 12345 币/四章仍可读；失败导入不替换旧状态；交易 toast 后失败警示仍可见；解除故障重试写入成功且警示消失。
- `node tests/save_import_smoke.mjs`：既有旧档/导入/收据/设置/选择恢复回归通过。
- `node tests/browser_smoke.mjs src/index.html`：SMOKE PASS，52 checks。
- `git diff --check` 通过。

初始本地 Chromium/zip 曾被截断并 SIGSEGV；本轮主代理以 CRC 完整 zip 恢复浏览器后，上述浏览器断言已实际执行通过。因此不把早期无法启动浏览器的结果当作验收证据。离线生成版、合并后的完整 CI 和真实 Android 覆盖安装/导出/触控仍由主代理后续验收。

新增 smoke 均接受 `SAKURAYO_ENTRY || argv[2] || src/index.html`，可用于主代理的源码和单 HTML 双入口回归。

## 质量自审与持久化

代码仅把真实商品定义集中到明确目录，未新增交易锁、空存储、无操作兜底或版本 reset 包装。测试直接执行 runtime 或提取生产函数；浏览器测试点实际玩家控件，未以复制逻辑替代生产交易。商品目录在 save runtime 之前加载，独立 save 单测显式加载目录，无重复生产目录兜底。

远程仓库：h1neolzr7f/sakurayo-v46-handoff。

持久分支：`codex/audit-fix-economy`。

源代码远程提交：`cb8cab2fb806d4124f54bdb2fa658d983770ec4b`。

源代码远程树：`37a58a8c5cc3a83bc237b2a310850711aeca57cd`。

发布基于远程基线提交 `a334be6087f4ebe0e03d10ec2ada75f5ab475fa7` / 树 `e8fff5277d89f9ea7c55d76cb06d8fe300a7fa49`；仅上传本次九个源码/测试文件，不上传本地基线文档差异。每个上传 blob 均读取 Git index 精确字节（大 HTML 分 60000 字符 base64 块收集）并验证 GitHub 返回 SHA 与 index blob SHA 相同。本报告随后以独立报告提交追加到同一分支；最终分支头 SHA 在交付消息记录。
