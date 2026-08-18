# 已修错误，禁止回潮

统一版 V4.7.0 收口。改大厅 / 触控 / 商店 / 图标时先对照这一页，再跑 `node tests/regression_v47.mjs`。

| 已修问题 | 正确做法 | 禁止再做 |
|---|---|---|
| 开局/换角卡死主线程 | `persist` 只在 `state==="menu"` 时 `menuUpdate`；隐藏抽屉不重绘；出击键用 `dataset.cmd47` 就地改字，不拆 `.pass53` | `persist` 在对白/战斗里整页重建大厅，或每次把 `#start` 写成 `textContent` |
| 量触控热区卡死 | `resize.busy`，画布尺寸没变不重设 `canvas.width`，resize 里不再改出击键 | `resize` 里写 `cv.width` 再触发 `visualViewport`/`getBoundingClientRect` 重入 |
| 关对白卡死 | 吐槽/过场用 `requestAnimationFrame` 重启动画，禁止 `void offsetWidth` | `playBanter` / 过场里强制回流再叠 `resize` |
| 口令观察者脉冲 | `#start` childList 同一帧最多 6 次 `applyPassword` | 无上限同步改 `#start` 文本 |
| 进战斗电台卡死 | `#banter` 只在 hidden→显示时 `startRadio`；`live53` 已在则不加 | 观察 class 时反复 `add("live53")` 重入 |
| Android 点出击没反应 | `layout52` 强制 `androidLandscape46`，按钮 `pointer-events:auto`，`html,body` 用 `touch-action:manipulation` | 再按 `view.w < 640` 套 `portraitFallback46` 却锁横屏 |
| 点到画布上 | `touch54` 用 `elementFromPoint` 补 click | 大厅层 `pointer-events:none` 且不补点 |
| 口令观察者卡死 WebView | `applyPassword.busy`，只观察 `childList` | `characterData: true` 或无门禁改 `#start` 文本 |
| 简报时暂停是死按钮 | `syncCinematicHud` 在简报藏 HUD | 简报盖住 `#pause` 还不让点 |
| 橱窗刷新崩大厅 | `decorateShop` 的 `busy` / `__boutique6106` | 装饰函数里再触发自己 |
| `sakurayo-shell.js` 被截断 | 体积必须 > 50KB，workflow 会救回 | 用 Contents API 硬推大文件导致半截 |
| 换角压货币条 | 圆钮 `position:static` 挂进 `.top` flex | `position:absolute; left:max(220px,…)` |
| 日历/支援/「更多」金边挨在一起 | `#homeQuick46` gap 12px，「更多」左留 10px | 再绝对叠在钱包上 |
| 草稿 emoji 回潮 | 保留 `chrome6109` 覆盖层 | 大厅/抽屉改回裸 emoji |
| 图标层把按钮抖到点不稳 | `injectStyle` 只写一次，`dress.busy` 节流，装完后不再对整棵 DOM 开 `MutationObserver` | 观察 `documentElement`+`subtree` 或扫遍 `button, p, small, em` |
| 横屏出击下方挤出「新手说明」三钮 | 横屏藏 `.utilityButtons37`，声音走左栏设置 | 再把桌面用工具条叠回 412px 高的手机大厅 |
| 干员被 `syncPets` 清掉 | 单位走独立 `deployed[]` | `pets.push` |
| 再包 `update` | 局内扩展走 hook | `update = function` 包装层 |
| 清档 | 旧档缺字段只补齐 | `localStorage.clear` 或改键 `sakurayoV3` |
| 覆盖正式包 | 开发版包名 `com.sakurayo.yeying.dev` | 改回正式 `applicationId` 再让人覆盖安装 |
| 出击斜切热区被甲板截走 | `#start` 横屏 `clip-path:none`；`#homeDeck46` `pointer-events:none`，子按钮再打开 | 再给出击键切掉四角却让甲板接点击 |
| 问候条像关不掉的签到层 | 412px 高藏 `#homeGreet46`，`pointer-events:none`；日历红点仍在 | 把长句问候绝对钉在左栏上抢点击 |
| 结算/暂停次要钮看不清 | `#back`/`#quit` 实心底+金边；矮横屏暂停不铺闪图 | 再把 `.secondary` 做成 6% 白底，或给暂停盖全屏闪图 |
| 暂停只剩模糊光圈 | `sakurayoCutIn` 不再从 opacity 0 起；`#paused .modal{opacity:1}` | 再让过场 `from{opacity:0}` 或 `animation:none` 停在透明帧 |

选择器与测试 API 仍以 [HANDOFF.md](HANDOFF.md) 为准。`selectStage` 永远把 `runMode36` 写成 `"story"`。
