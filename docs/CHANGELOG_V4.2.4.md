# V4.2.4 正式包卫生与存档白名单

- 正式包标题连点不再打开内测后门；`?beta=1` / `?test=1` 仍可通过按钮进入。
- 存档 `merge` 跳过 `__proto__` / `constructor` / `prototype`；导入只保留白名单字段，未知顶层键丢弃。
- `persist()` 写入失败会 toast 提示空间已满或写入失败，不再只记开发日志。
- 扩展商店描述与扩展档案文案做 HTML 转义；官方内容包仍以 `Function()` 编译（不是沙箱，只信任随包源码）。
- 生产模式不再挂 `window.render_game_to_text`；测试钩子仅 `?test=1` 注入。
- 去掉残留的 V3.8 / V3.9 标题写入；Android UA 改为 `SakurayoAndroid/4.2.4`。
- `static_check.py` 不再强制发版 HTML 出现 `advanceTime` / `__SAKURAYO_TEST__` 字符串。
- 未拆开 8 层 `update` 包装（G2），留给 V4.4 战斗循环模块，避免再误删 `draw()`。
- 将 V3.7 正式签名密钥 zip 移出 `outputs/`，与 APK 交付目录隔离。
