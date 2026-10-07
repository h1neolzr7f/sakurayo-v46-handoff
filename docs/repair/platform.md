# 平台修复记录

范围：F07 Android 返回，以及关联的前后台生命周期、音频零音量、JSON 原生落地与 Android debug CI。保留离线、sakurayoV3、4.6.0 / code 61、三角色与三模式。

## 实现与规格复核

- `window.SakurayoPlatform` 在源码末端提供稳定 `back/suspend/resume`；原生返回不再扫描 drawer DOM 或恢复 WebView 历史。返回优先级是胜利展示/对白、升级与抉择、结算、暂停、UI 栈顶、探索事件/探索、战斗暂停、大厅原生退出。
- suspend 调用 UI 修复的 `releaseInputs40`，暂停战斗，取消探索 RAF 保持坐标，停止打字/胜利计时、AudioContext 和正在播放的样本。resume 重置探索时钟、恢复剧情剩余计时与媒体；战斗保留暂停页，须手动继续。重复 suspend/resume 不重复操作。
- 两个真实统计/存档按钮共用 `exportJson48`。Android 用 `SakurayoAndroid.exportJson` + SAF `ACTION_CREATE_DOCUMENT` 写 UTF-8；桌面保留 Blob 下载。
- JSON 缓存在应用 cache 文件，Bundle 保存待导出 boolean；Activity 重建重新载入干净大厅，保留 localStorage 与待写 JSON，不用 `WebView.restoreState` 假装恢复 JS 战斗。选择器取消不提示成功，IOException 提示错误，流使用 try-with-resources，所有完成/取消路径清除缓存。
- 原生页面导航只允许本地 `file:///android_asset/index.html`，不增加联网权限。总音量/音效零时不创建振荡器或样本；音乐零时不初始化音源，既有音乐增益目标为真实 0。播放 promise 只忽略预期 NotAllowedError/AbortError，其余记录开发错误。
- CI static 改为现有 `bash tools/verify.sh --static`（覆盖全部 unit，安装 Pillow）；offline job 在源码/单文件再跑 platform smoke；新增 Java 17 + SDK 36 `assembleDebug lintDebug`。没有修改 verify 脚本、构建单 HTML、签名或发布 APK。

## 检查证据与限制

先运行新增 platform_unit 与 cutscene_unit，分别因缺少平台入口、缺少 suspend 实际失败；音乐静音新增断言也先复现 source 初始化，修复后通过。

通过：所有 `tests/*_unit.mjs`（camera/chapter_design/command/cutscene/lifecycle/live/lobby/ops/platform/save/services）、源码 static_check 与提取 JS syntax、cutscene syntax、content pack check、command art check、tactical art check、git diff --check。新增 unit 执行生产平台函数、生产 sound/sample/music 函数和完整 cutscene runtime，覆盖返回顺序、重复暂停、保坐标、Unicode 桥参数、零音源/真实零增益、非预期媒体错误报告、打字与胜利剩余计时和取消。

本地 Chromium 起初二进制/zip 截断并 SIGSEGV；协调者随后恢复完整二进制。本 worker 已真实运行 `node tests/platform_smoke.mjs` 的前半段：大厅退出、名册嵌套返回、开场对白、战斗暂停/继续、升级不可丢弃均通过；暂停处因 UI worker 的 `releaseInputs40` 尚未合并而 `ReferenceError` 中止。这不是整套 smoke 通过。后续输入/探索/导出按钮断言、离线单文件全测须集成后执行；没有生产 fallback 掩盖跨分支依赖。

Android SDK、模拟器和实体机不在本 worker 环境。debug 编译/lint、SAF 取消/写入失败/Activity 重建、真实手势返回/后台音频仍待 CI/设备验证，不能据此发布正式 APK。

## 自审

没有增加返回选择器副本、update 包装、存档键或假保存。平台只负责生命周期边界，输入释放由 UI 分支所有，剧情计时由 cutscene 所有。原生 Bundle 保存的是待导出状态，不保存战斗 JS；缓存只用于用户主动发起的本地 JSON 导出。源与平台测试尚需与 UI 修复集成验收。

## 远程持久化

修复分支：`codex/audit-fix-platform`，源基线 `a334be6087f4ebe0e03d10ec2ada75f5ab475fa7`。首个完整修复已持久化：commit `34bae94c7f925fe0d607ad90aa7997687c50e70d`，tree `8f128c6df73a80c2b9427bceea8c2838d09645b6`。各源/测试/report blob 与本地 git index SHA 逐一一致；随后仅回执更新继续提交在同一分支。
