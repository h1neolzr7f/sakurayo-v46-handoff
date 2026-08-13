# V3.6 验证结果

- 唯一源码：`src/index.html`
- Android 发布文件：`release/樱夜尸潮_V3.6_轮回主神篇.apk`
- 源码 SHA-256：`C6BF24D36525C0EB9866FE16CE81CB04F5A742D6F0D1E5EBB18BEA34C5AE5CB1`
- APK SHA-256：`34541561E89E7D72FD81674854DE7EBE40B6EE4695FBEE75720F5F287444C8AA`
- 静态核心符号、离线资源与 Node.js 语法检查：通过
- Playwright 浏览器冒烟：26 项通过
- 视口：430×932、360×800、932×430
- 核心流程外部 HTTP(S) 请求：0
- 武器方向：枪身、枪口与最近敌人弹道保持共线；移动方向不覆盖攻击方向
- 太刀判定：普通斩击与第三刀均使用前方距离＋夹角判定，身后目标不受刀伤
- 三角色吐槽：每人 8 个语义触发彩蛋，共 24 组
- 主神空间：T1–T3、高速成长、两次契约、四阶段高难 Boss 与独立结算通过
- 主神兑换：13 件基础、血统、职业和特殊道具；兑换跨局保留，局内技能重置，普通章节不受污染
- 新版封面：浏览器菜单与 Android API 35 模拟器均已截图验收
- Android：versionName 3.6.0、versionCode 36；`assembleDebug` 与 `lintDebug` 通过（0 errors，1 warning）
- Android 模拟器：安装、冷启动、进入菜单与新版封面显示通过

尚未验证：物理真机长时间发热，以及大量真人战局下各主神强化、职业组合与 Boss 的最终胜率平衡。

机器报告：`tests/artifacts/smoke/report.json`。
