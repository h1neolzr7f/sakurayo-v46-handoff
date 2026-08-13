# 《樱夜·尸潮》V4.1 架构

## 目标与非目标

V4.1 从已验证的 V4.0.0 开始，建立可扩展 seam，但不重写战斗实现。`startGame()`、`update()`、`draw()`、刷怪、碰撞和数值仍在 `src/index.html` 的核心 IIFE 中。

非目标：本轮不把 6000 行核心机械切成几十个浅 Module，也不允许内容包直接取得战斗数组或替换帧循环。

## 目录约定

```text
src/
  index.html                         # 开发入口；核心玩法与两个本地经典脚本标签
  runtime/
    sakurayo-content-runtime.js      # 内容包注册、迁移、事件、错误隔离
  content/
    extensions.manifest.js           # 有序内容包清单
    packs/
      <pack-id>/
        pack.js                       # 数据声明
        art/                          # 包拥有的离线图片源
tools/
  build_game.py                       # 内联脚本、复制包美术，生成单入口
  static_check.py                     # 核心符号与脚本结构检查
  check_content_packs.py              # 清单、ID、路径、远程依赖检查
tests/
  framework_smoke.mjs                 # 内容包/坏包/旧档/探索专项
  browser_smoke.mjs                   # V4.0 完整玩法回归
android-app/
  sync-game.ps1                       # 调用构建器，不再直接复制单体源码
```

## 五个主要 Module

### 内容注册 Module

Interface 是 `window.SakurayoContent` 的 `register`、`content`、`migrateSave`、`state`、`on/emit`、`guard` 和只读状态查询。实现负责：

- 检查包 ID、版本和列表类型；
- 拒绝重复 ID；
- 独立记录注册、迁移、内容应用、资源和事件错误；
- 提供声明式迁移，不要求扩展运行任意迁移函数。

删除该 Module 后，校验、故障隔离、迁移和内容合并会重新散落到商店、成就、剧情和 Android 构建中，因此它是深 Module。

### 核心内容 Adapter

位于 `src/index.html` 的 `V4.1 CONTENT PACK ADAPTER`。它是注册数据进入旧核心的唯一 seam：

- `costumes` 合入 `SKINS35`；
- `achievements` 合入 `ACH`；
- `items` 渲染为独立“扩展补给”标签；
- `stories` 追加到档案；
- `explorations` 进入独立探索场景。

Adapter 不暴露 `P`、敌人数组、`update()` 或 `draw()`。

### 存档 Adapter

本体仍以 `sakurayoV3` 读写。扩展数据只放入：

```json
{
  "extensions": {
    "official.framework-example": {
      "__version": 1,
      "data": {}
    }
  }
}
```

旧档没有 `extensions` 时自动补空对象；每个包的 `saveDefaults` 深合并，包迁移失败时只把该包标成 `__disabled`，其他档案和本体字段保留。

### 资源 Adapter

包内 `art/` 在构建时复制到 `game/art/content-packs/<folder>/`。内容声明使用这个运行时相对路径。图片加载失败时：

- 角色服饰回退现有 SVG；
- 探索地图回退程序化紫黑渐变；
- 本体图片继续使用原 Canvas/SVG 回退。

不允许 CDN、远程字体或远程图片。

### 构建 Module

开发态用经典脚本按解析顺序加载，兼容 `file://`；发布/Android 由 `tools/build_game.py` 内联运行时、清单和包脚本，消除脚本 CORS/模块加载差异。包美术仍作为 APK 本地 asset。

Android WebView 继续加载 `file:///android_asset/index.html`：最终入口不含外部脚本、JSON fetch 或 ES Modules，只读取 APK 内图片，因此无需打开 file URL 跨域权限。

## 启动与失败隔离顺序

```text
错误显示层
  → 内容运行时
  → 清单同步装载包
  → 核心 IIFE 读取注册数据
  → 迁移 sakurayoV3
  → 内容 Adapter 合并
  → 菜单启动
```

包脚本缺失时记录 `load` 错误；数据类型错误时 `register` 返回 false；迁移错误只禁用对应包；条目渲染错误由 `guard` 隔离。上述情况均不阻断核心 IIFE。

无法隔离的范围：扩展脚本本身若包含死循环或主动篡改全局对象，浏览器内同权限脚本无法安全沙箱化。因此公开内容包应视为受信任本地代码，并坚持数据声明格式。

## 当前两个真实 Adapter

- `official.framework-example`：服饰、收藏道具、成就、档案与扩展存档。
- `official.story-exploration`：四张 Image2 地图、移动、奖励节点和收集记录。
- `official.feedback`：CC0 音效与 VFX 资源映射；核心通过 `SakurayoContent.assets(packId)` 读取，资源缺失时保留程序化反馈。

## V4.1.2 的渐进式边界

- 启动资源表分成 `BOOT_ART` 与战斗资源注册表。前者只负责首屏头像/导航，后者由敌人生成、Boss 登场与转阶段触发；资源缺失仍回退 Canvas/SVG。
- 探索 Adapter 只消费内容包中的 `walkable`、`nodes`、`events` 数据。碰撞、分轴移动、事件弹窗和持久化由通用 Adapter 负责，新增地图不需要修改战斗 `update()` / `draw()`。
- 敌人轮廓与 Boss 过渡是核心绘制函数的附加层，不改变实体半径、碰撞、受伤、刷怪或阶段阈值；低画质可以只关闭附加场景层。
- 已有 16 张 Boss 阶段图继续通过资源注册表访问，不复制第二套素材，也不把它们重新列入启动预载。

两个正常 Adapter 加一个坏包夹具使内容注册 seam 成为真实 seam，而不是只有一个实现的假抽象。
