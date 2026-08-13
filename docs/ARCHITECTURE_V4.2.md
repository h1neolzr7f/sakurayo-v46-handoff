# 《樱夜·尸潮》V4.2 架构

## 目标与边界

V4.2 采用“稳定单体战斗核心 + 内容包运行时 + 确定性打包器”。没有重写 `update()`、`draw()` 或现有数值系统；旧战斗逻辑仍在 `src/index.html`，扩展内容从注册表接入。这样可以逐步拆分，避免一次重写再次出现误删 `draw()` 导致整局停摆。

## 目录约定

```text
src/
  index.html                         # 开发入口、现有战斗核心与 UI 适配器
  runtime/sakurayo-content-runtime.js # API v2：校验、依赖、迁移、隔离、Hook
  content/extensions.manifest.js     # 内容包候选清单
  content/packs/<folder>/
    pack.js                           # 包声明
    art/                              # 包私有离线资源
tools/
  new_content_pack.py                 # 新建并登记内容包
  check_content_packs.py              # 语法、结构、资源门禁
  build_game.py                       # 多文件开发入口 -> 离线单入口
android-app/
  sync-game.ps1                       # 构建并同步到 WebView assets
tests/
  framework_smoke.mjs                 # 框架、旧档、坏包隔离
  browser_smoke.mjs                   # 完整产品流程
```

## 启动顺序

1. 经典脚本加载运行时。
2. Manifest 按顺序加载候选包；单包编译和注册都在 `try/catch` 中。
3. `finalize()` 校验 API/游戏版本、依赖、冲突与循环，生成稳定拓扑顺序。
4. 读取 `sakurayoV3`，根存档缺字段补默认值，再逐包执行连续迁移。
5. 内容适配器把服饰、商店、成就、档案、探索数据合入既有界面。
6. 稳定生命周期接缝调用已登记 Hook；Hook 报错被记录，不中断后续 Hook 和核心循环。

## 失败隔离

- 单包语法错误：`loadBundledPack()` 记录 `compile` 错误，其他脚本继续。
- Schema、版本或引用错误：只禁用该包。
- 缺依赖、冲突、依赖循环：只禁用受影响包，原因显示在 Mod Kit 面板。
- 迁移链缺步：保留原扩展数据，只禁用该包的存档状态。
- 图片缺失：适配器退回程序化角色/场景效果。
- Hook 抛错：记录错误，继续执行剩余 Hook。

内容包是同页可信脚本，不是安全沙箱。死循环仍能卡住 WebView；正式发布只应收录审查过的包。普通内容优先使用声明式字段，不使用 Hook。

## 生命周期接缝

当前稳定 Hook：`boss:before-spawn`、`boss:after-spawn`、`boss:before-phase`、`boss:after-phase`、`combat:after-update`、`combat:after-draw`。核心用固定优先级注册 Boss 指针、机制提示和阶段美术，证明无需再次包裹 `draw()`。

Hook 是受信代码 Mod 接口，不是通用内容数据接口。目前职业、融合、敌人 AI 和数值表尚未数据化；不要宣称仅加数据即可扩这些系统。后续应逐类增加明确 Adapter，而不是让包任意修改全局对象。

## 存档

根键保持 `sakurayoV3`。扩展状态位于：

```text
save.extensions[packId] = { version, enabled, data }
```

根存档继续采用缺字段默认合并；包迁移只允许 `from -> from+1` 的连续声明式步骤。移除内容包不会清空其命名空间，重新安装可继续使用。核心和包都禁止静默删除未知字段。

