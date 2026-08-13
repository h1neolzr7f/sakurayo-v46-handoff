# 内容包扩展说明

V4.2 已升级到 Content API v2。完整说明请阅读：

- `MODDING_GUIDE_V4.2.md`：创建、资源、商店、成就、剧情、探索、迁移、Hook 与测试。
- `ARCHITECTURE_V4.2.md`：运行顺序、失败隔离、存档边界与真实限制。
- `official-modkit-addon/pack.js`：带依赖的官方可运行示例。

最快开始：

```powershell
python tools\new_content_pack.py author.my-pack --folder my-pack --title "我的扩展"
python tools\check_content_packs.py
node tests\framework_smoke.mjs
```

不要直接包裹或覆盖 `update()`、`draw()`、`startGame()`；不要引入 CDN；正式包不得依赖内测后门。
