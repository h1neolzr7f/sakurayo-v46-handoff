# 扩展内容审查修复

日期：2026-10-06。范围：F22、F24、停用包事件契约及对应可删除的重复逻辑。保持 `sakurayoV3`、4.6.0 / Android versionCode 61、三个角色、三种模式、离线内容包。

## 实现与规格复核

- `mergeDefaults` 根据默认记录/数组的形状合并；错误的数组不再覆盖默认字典，错误对象不再覆盖默认数组。合法字段、未知包内字段及已保存的正确收据保留。
- 扩展数据在迁移输入与输出边界统一规范 `purchases`、`collected`、`visits`、`choices` 为字典，`fragments` 为数组。缺少 `saveDefaults` 的包也适用；迁移后删除字段或设置错误形状仍会得到正确的最终容器。
- 按依赖拓扑序决定最终冲突集合；B 被 A 的冲突停用时，依赖 B 的 C 和依赖 C 的 D 都停用，内容与可写状态不会返回。`emit` 与 `runHooks` 共享 `ownerEnabled` 判定，核心 owner 继续工作。
- 真实商品按钮和测试 API 共用 `buyExtensionItem41(item)`，每次读取当前收据和当前钱包，旧按钮 callback 不再使用渲染时的 count/full/state 扣币。
- 删除探索/商品调用点的字典、数组修补以及经过内容 schema 后重复的价格、限购数、奖励币和成就奖励归一；删除旧的被覆盖 `exploreStep41`，保留唯一包含可行走边界与事件处理的函数。
- 保留 register / migration / guard / event / Hook 的错误日志和单包隔离；未增加交易锁、存档 key 或生命周期包装链。未修改 `sakurayo-save.js`、探索键盘释放/拦截逻辑、对白、verify 脚本或生成构建产物。

## 实际验证

先新增 `tests/content_unit.mjs` 执行真实 runtime 与真实商品 render callback：修复前 5 项中 4 项失败，分别复现形状覆盖、无 defaults 迁移收据、冲突下游启用、旧 callback 重复扣币；错误日志隔离测试在修复前已通过。修复后 5/5 通过。

| 命令 | 实际结果 |
| --- | --- |
| `node tests/content_unit.mjs` | 5/5 通过；覆盖 JSON 序列化重载、迁移前后容器、依赖两级下游、停用事件/Hook、旧商品 callback 的当前收据与余额 |
| `node tests/content_receipts_smoke.mjs` | 真实 Chromium 通过；源码 file URL，932×430，坏数组旧档、真实事件按钮、真实购买按钮、旧 callback、刷新后重复拒绝 |
| `node tests/framework_smoke.mjs` | 8/8 通过；官方五包、迁移、探索、依赖、坏包和日志隔离 |
| `node tests/browser_smoke.mjs` | 完整源码 53/53 通过，新增 F22 收据回归已接入主 browser smoke |
| `python tools/static_check.py src/index.html` | 通过，16 必需符号、17 scripts |
| `node --check tests/artifacts/static/index.extracted.js` | 通过 |
| `node --check src/runtime/sakurayo-content-runtime.js` | 通过 |
| `node --check tests/browser_smoke.mjs` | 通过 |
| `git diff --cached --check` | 通过 |

真实收据回归使用自建旧档，初始币 500。鸟居补给 +12、封印碎片 +8、事件保留残响 +10，到 530；实际购买限购一次的 observer_manual -25 到 505。再次调用同一旧按钮 callback、测试购买 API、刷新再领取和购买都保持 505。持久化 JSON 具有 `purchases.observer_manual = 1`、两个 `collected` 收据、`choices["shrine-outskirts:echo-altar"] = "preserve"`、两条 fragments；第二次打开场景 `visits = 2`。pageerror 为零。

本地证据（生成且未提交）：`tests/artifacts/content/receipts.json`、`tests/artifacts/smoke/content-receipts.json`、`tests/artifacts/smoke/report.json`、`tests/artifacts/framework/report.json`。

## 浏览器与发布边界

本轮起初本地 Chromium binary/zip 截断并 SIGSEGV；root 随后完成 CRC 校验及完整解压，默认 Playwright cache 的浏览器已恢复。因此以上源码浏览器断言确已实际运行，不能再把本轮描述为“本地浏览器未跑”。没有在本工作分支构建离线 HTML 或修改 verify；整合后源码 + 新构建离线版的全量 CI、Android 实机/覆盖安装仍由 root 与发布流程验收。本报告不把源码通过等同 APK 发布验收。

## 质量自审与远程持久化

确认旧正确收据保留；fresh / 无 defaults / v1→v2 迁移边界均覆盖；冲突导致的依赖闭包与事件/Hook启用语义一致；真实按钮、旧 callback 和测试 API 的购买效果一致；日志隔离仍有执行证据。按基线重新组装远程 tree，只提交本组五个源码/测试文件，未携带工作区历史文档差异。

- 本地源码提交：`ab67fb5f146be34d6a5f69081d8769d14c1041f8`。
- 远程分支：`codex/audit-fix-content`，仓库 `h1neolzr7f/sakurayo-v46-handoff`。
- 远程源码修复 commit：`1209d7b982af3158d48166515793821a9b9fc0be`。
- 远程源码修复 tree：`433c0ab2455716e8d4f3c208c8a93ae04eb9a6e8`。
- 远程 parent：`a334be6087f4ebe0e03d10ec2ada75f5ab475fa7`；base tree：`e8fff5277d89f9ea7c55d76cb06d8fe300a7fa49`。
- 五个 blob 均由精确 git index bytes 转 base64 创建，并核对 GitHub 返回 SHA 与 `git rev-parse :path` 一致。

本报告将作为后续报告提交加入同一远程分支；最终 branch head/tree SHA 由交付消息记录，避免报告自引用 SHA。
