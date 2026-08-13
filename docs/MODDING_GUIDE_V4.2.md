# V4.2 魔改与内容包指南

## 30 秒创建内容包

```powershell
python tools\new_content_pack.py author.my-pack --folder my-pack --title "我的扩展"
python tools\check_content_packs.py
node tests\framework_smoke.mjs
```

脚手架会创建 `src/content/packs/my-pack/pack.js`、美术说明并在 `extensions.manifest.js` 登记。先复制项目或使用 Git 分支；已有目录不会被覆盖。

## 包元数据

```js
SakurayoContent.register({
  id: "author.my-pack",
  version: 1,
  apiVersion: 2,
  game: { min: "4.2.0", maxExclusive: "5.0.0" },
  dependencies: [{ id: "official.framework-example", minVersion: 1 }],
  conflicts: [],
  title: "我的扩展",
  saveDefaults: { purchases: {}, flags: {} },
  migrations: [],
  assets: {},
  shop: { costumes: [], items: [] },
  achievements: [],
  stories: [],
  explorations: [],
  texts: {}
});
```

ID 必须全局唯一，只用小写 ASCII、数字、点、下划线、短横线。依赖不是加载顺序：运行时会先校验再拓扑排序。可参考 `official-modkit-addon/pack.js`。

## 不改核心即可追加的内容

- 资源：放入包的 `art/`，声明路径必须以 `content-packs/<folder>/` 开头，禁止 URL/CDN。缺图会回退。
- 服饰：追加三角色资源和 `shop.costumes` 条目。
- 收藏道具：使用 `shop.items`；状态保存在包命名空间。
- 成就：条件支持 `always`、`ownedSkin`、`ownedItem`、`flag`、`stageComplete`。
- 剧情档案：使用 `stories`，解锁条件同上。
- 探索地图：使用 `explorations` 声明可行走圆/矩形/多边形、奖励节点、事件和选择。

商店条目示例：

```js
shop: { items: [{
  id: "author_note", n: "作者手记", i: "🧩", price: 12, max: 1,
  d: "只改变扩展收藏状态。"
}] }
```

探索地图中的圆形既接受 `radius` 也接受 `r`，运行时统一为 `r`；选择文本既接受 `result`，也可使用内部规范字段。奖励建议写成 `reward: { type: "coins", amount: 10 }`。

## 包版本与迁移

包数据升级必须逐版本连续：

```js
version: 2,
migrations: [{
  from: 1,
  to: 2,
  rename: { oldFlag: "newFlag" },
  set: { choices: {} },
  remove: ["obsolete"]
}]
```

不要跨越版本，不要改根存档，不要删除未知字段。迁移失败只会停用当前包；原扩展数据仍保留。

## 受信代码 Hook

只有必须增加战斗表现时才使用：

```js
SakurayoContent.hook(
  "combat:after-draw",
  function (payload) { /* 只绘制自己的附加表现 */ },
  "author.my-pack",
  100
);
```

可用 Hook 与载荷见 `ARCHITECTURE_V4.2.md`。处理器必须短小、可重入、不得替换 `draw/update/startGame`，不得发网络请求。Hook 异常会隔离，但无限循环无法隔离。

## 条件测试包

Manifest 支持查询参数条件，仅用于测试：

```json
{ "path": "content/packs/broken-fixture/pack.js",
  "when": { "queryParam": "brokenExtension", "equals": "1" } }
```

正式内容不要依赖 `?test=1` 或 `?beta=1`；正式模式不会显示后门。

## 验证与 Android

```powershell
python tools\static_check.py src\index.html
python tools\check_content_packs.py
node tests\framework_smoke.mjs
node tests\browser_smoke.mjs
python tools\build_game.py
powershell -ExecutionPolicy Bypass -File android-app\sync-game.ps1
cd android-app
.\gradlew.bat assembleRelease lintRelease --no-daemon
```

Android 使用打包后的经典单入口，不依赖 `type=module` 或 `fetch(file://...)`；扩展和资源全部离线复制。

