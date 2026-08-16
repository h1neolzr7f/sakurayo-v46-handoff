# V4.6 第二轮成熟化验证结果

日期：2026-08-16
基线：`613c85c`

- 唯一源码：`src/index.html`
- 单入口发布：`release/樱夜尸潮_V4.6_第二轮成熟版_单文件.html`
- Android Debug：`release/樱夜尸潮_V4.6_第二轮成熟版_Android_Debug.apk`
- 源码 SHA-256：`824B3C57071B03678CACD33819FC9E8F7056B51186CC983FB2D5D4452BE03AFE`
- 单入口 / Android 内 `assets/index.html` SHA-256：`415844A549AD6C842F8CAEF3D3014506F2D47D59DAEAB6263073445571612C4C`
- Debug APK SHA-256：`F0F44F12FE8D7FD24F41C46DC06B107EE6A9E39A360B7F17133B233430B86A0D`
- 静态核心符号、10 个脚本语法、6 个内容包：通过
- Unit：lobby / live / ops，3/3 通过
- Framework smoke：8/8 通过
- Browser smoke：开发入口 52/52；离线单入口 52/52
- Testimony / Ops smoke：通过
- Visual：寻访/名册与 932×430 战斗通过
- 覆盖：新档、缺字段旧档、三角色、触控、升级、24 融合、飞升、双干员、四章 Boss 三阶段、胜负结算、重开与主神空间
- 外部 HTTP(S) 请求：0；console/page error：0
- Android：4.6.0 / versionCode 61；`assembleDebug`、`lintDebug` 通过
- APK：无 INTERNET 权限，1190 个 WebP，v1/v2 Debug 签名通过，包内单入口哈希一致

尚未验证：正式证书签名、实体 Android 覆盖安装、刘海安全区、长时发热和厂商 WebView 长测。
