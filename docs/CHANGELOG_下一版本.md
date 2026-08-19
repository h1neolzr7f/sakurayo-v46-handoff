# 《樱夜·尸潮》下一版本 CHANGELOG

## NovelAI 开发期生图（源码仍 4.6.0）

- 内置 GenerateImage 额度用尽后，开发期出图改走用户 NovelAI 会员，用到失效为止。
- 新增 `tools/nai/generate.py`：`check` / `dry-run` / `gen`。Token 只读环境变量或 `secrets/novelai.token`，不进 git。
- 预设任务：三角色绿幕站桩 + 大厅宽背景。源 PNG 仍 gitignore，游戏运行时不访问 NovelAI。
- 默认锁 Opus 免费档（单张 / ≤28 步 / ≤1024×1024）。云主机若被关免费队列，自动改打 Large 扣 Anlas。

## 第一期镜界寻访（源码仍 4.6.0，未下令不升 4.6.1）

- 寻访三页：残片 / 时装 / 武器。价格 160 / 1440。软保 65、硬保 80、碎镜片 Spark 200。
- 底栏第二格改为仓库。旧 8 张降为 R 残件并在 `resetP` 给小加成。`last_witness` 仍是男人。
- 14 张基础职业进残片池和仓库阅读；倾向 ×1.3；套装 7/+2%、14/+3%。SSR 硬保降到 shrine/gun/cult，不打残件。
- 时装 12 + 武器 12，传说可装备。残件不能 Spark。
- 仓库编年五条：第零次死亡 / 百目共视 / 零号企业 / 失败者剑冢 / 镜零之后。
- 编年仍一个页签，三段标题。绫「作废的工号」四条、凛音「未署名的刀」四条。小夜五条未改。不进卡池。
- 存档键仍 `sakurayoV3`，只补 `shop40.ops`。未交 APK/密钥。

## 可靠开发基线

- 继续以 `src/index.html` 为唯一源码，未从 `release/` 或旧版本回填实现。
- 新增开发模式错误面板：使用 `?debug=1` 可显示同步脚本异常和未处理 Promise 拒绝，并支持复制、关闭。
- 新增测试模式：使用 `?test=1` 启用固定 60Hz 的确定性 `advanceTime(ms)`、`render_game_to_text` 与受控 `__SAKURAYO_TEST__` API；普通发布模式不暴露测试 API。
- 补回核心 `update(dt)` 契约，保留原 `fixedUpdate(dt)` 实现；真实运行统一经 `scheduleLoop()` 调度。
- 新增可重复 Playwright 冒烟测试，覆盖主菜单、旧存档、三角色、触控、升级、Boss 三阶段、胜负结算和重开。
- 在单文件内部增加 SAVE、DATA、UI、STORY、COMBAT、RENDER、OBSERVABILITY 分区注释，不改变原业务顺序。

## 兼容性与稳定性

- 将 `character`、`skin`、`ownedSkins` 纳入 `sakurayoV3` 默认 schema，旧存档缺字段时合并默认值并保留已有数据。
- `persist()` 写入失败会进入开发错误记录，游戏内存状态仍可继续。
- 为 `CanvasRenderingContext2D.roundRect` 增加矩形回退。
- 将 `String.replaceAll` 改为 `split/join` 等价实现。
- 修正 `AudioContext || webkitAudioContext` 的标识符兼容写法。
- 动态角色卡、关卡卡和升级选项增加稳定 `data-*` 标识。

## 发布

- 源码：`src/index.html` + `src/runtime/*.js`
- 当前单文件：`release/樱夜尸潮_V4.6.0_单文件.html`（与 Android assets 同步，不进 git）
- SHA-256：`b509755294730094c266865cbfa4b36999bd3701cd53988133e59f527c24ca8f`
- 字节：1990921
- 版本仍 4.6.0，未升 4.6.1，未交 APK

## Image2 角色与 UI 核心美术（2026-07-11）

- 新增月城小夜、神代绫、黑羽凛音三名原创角色的头像、战斗精灵和对话立绘，共 9 个透明 WebP。
- 新增关卡、天赋、剧情、飞升、成就、商店 6 枚无文字导航图标。
- 角色与 UI 使用用户参考图的清爽日系赛璐璐渲染语言，但不复制参考人物身份、服装或构图。
- 新增 15 项资源预加载与状态检查；Android 路径使用 `game/art`，桌面源码使用项目相对路径。
- 菜单角色卡、顶部/HUD 头像、对话立绘、Canvas 战斗角色和底部导航均已接入；图片失败或非默认衣装时自动回退原 SVG/Canvas。
- 后处理新增 alpha 连通域孤岛清理；修复不透明图标 QA 预览的 RGB/RGBA 合成问题。
- Android 同步脚本构建前强制校验 15 项核心资源，防止缺图 APK。
- 最终源码 SHA-256：`93CBDC902F5FF414E438CD112078C39C6BD4739427F45D4101AF05C0D93DA5A4`。
- 最终 APK SHA-256：`9017D2455B3C53DB1E48D56670B5B48D661565DCDF268CD3A6D60DB607AA8CA9`。
