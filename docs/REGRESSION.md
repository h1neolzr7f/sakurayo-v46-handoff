# 已修错误，禁止回潮

统一版 V4.7.0 收口。改大厅 / 触控 / 商店 / 图标时先对照这一页，再跑 `node tests/regression_v47.mjs`。

| 已修问题 | 正确做法 | 禁止再做 |
|---|---|---|
| Android 点出击没反应 | `layout52` 强制 `androidLandscape46`，按钮 `pointer-events:auto`，`html,body` 用 `touch-action:manipulation` | 再按 `view.w < 640` 套 `portraitFallback46` 却锁横屏 |
| 点到画布上 | `touch54` 用 `elementFromPoint` 补 click | 大厅层 `pointer-events:none` 且不补点 |
| 口令观察者卡死 WebView | `applyPassword.busy`，只观察 `childList` | `characterData: true` 或无门禁改 `#start` 文本 |
| 简报时暂停是死按钮 | `syncCinematicHud` 在简报藏 HUD | 简报盖住 `#pause` 还不让点 |
| 橱窗刷新崩大厅 | `decorateShop` 的 `busy` / `__boutique6106` | 装饰函数里再触发自己 |
| `sakurayo-shell.js` 被截断 | 体积必须 > 50KB，workflow 会救回 | 用 Contents API 硬推大文件导致半截 |
| 换角压货币条 | 圆钮 `position:static` 挂进 `.top` flex | `position:absolute; left:max(220px,…)` |
| 日历/支援/「更多」金边挨在一起 | `#homeQuick46` gap 12px，「更多」左留 10px | 再绝对叠在钱包上 |
| 草稿 emoji 回潮 | 保留 `chrome6109` 覆盖层 | 大厅/抽屉改回裸 emoji |
| 图标层把按钮抖到点不稳 | `injectStyle` 只写一次，`dress.busy` + 180ms 节流，🌸/✦ 只替换一次 | 观察者里反复写 `style.textContent` 或 `n>40` 连刷 `hook()` |
| 横屏出击下方挤出「新手说明」三钮 | 横屏藏 `.utilityButtons37`，声音走左栏设置 | 再把桌面用工具条叠回 412px 高的手机大厅 |
| 干员被 `syncPets` 清掉 | 单位走独立 `deployed[]` | `pets.push` |
| 再包 `update` | 局内扩展走 hook | `update = function` 包装层 |
| 清档 | 旧档缺字段只补齐 | `localStorage.clear` 或改键 `sakurayoV3` |
| 覆盖正式包 | 开发版包名 `com.sakurayo.yeying.dev` | 改回正式 `applicationId` 再让人覆盖安装 |

选择器与测试 API 仍以 [HANDOFF.md](HANDOFF.md) 为准。`selectStage` 永远把 `runMode36` 写成 `"story"`。
