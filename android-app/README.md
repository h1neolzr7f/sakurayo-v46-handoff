# 开发版 夜樱 Android WebView 壳

最小原生 Java Android 工程。游戏运行于应用内 WebView，HTML 从
`app/src/main/assets/index.html` 加载，APK 不申请 `INTERNET` 权限。

当前侧载身份：

- 桌面名：`开发版 夜樱`
- applicationId：`com.sakurayo.yeying.dev`
- versionName：`4.7.3-yeying`

它和正式包 `com.sakurayo.zombietide`（樱夜·尸潮）是两个应用，可以同时装，不会互相覆盖。

页面加载完成后，`MainActivity` 会把 `assets/runtime/sakurayo-feel53.js` 注入 WebView。即使旧的单入口 HTML 还没内联 feel53，角标、寻访仪式和结算钩子也会出现。`install()` 可重复调用，不会叠两套观察器。

## 同步游戏源码

```powershell
cd android-app
.\sync-game.ps1
```

该脚本只复制 `../src/index.html`，并校验源文件与 APK asset 的 SHA256；不会修改源文件。

## 构建 debug APK

```powershell
$env:JAVA_HOME='E:\Android\jdk-17'
$env:ANDROID_SDK_ROOT='E:\Android\android-sdk'
.\gradlew.bat --offline assembleDebug
```

也可以同步 asset、构建并执行 Android Lint：

```powershell
.\build-debug.ps1
```

输出：`app/build/outputs/apk/debug/app-debug.apk`

## WebView 行为

- JavaScript、DOM Storage、数据库存储启用，`sakurayoV3` localStorage 会保存在应用数据中。
- APK 更新时，只要 applicationId 和签名不变，应用数据与存档不会被主动清理。
- 没有网络权限，WebViewClient 也会拦截 HTTP/HTTPS 请求。
- 系统栏使用沉浸式隐藏，可从屏幕边缘临时滑出。
- 返回键依次处理抽屉、结算、暂停与游戏中暂停；菜单下连续按两次退出。
- `onPause/onResume` 转发给 WebView，页面自身的 `visibilitychange` 可暂停战斗。
- Debug 构建允许 Chrome WebView 调试，Release 构建关闭。

## 安装到连接的设备

```powershell
& 'E:\Android\android-sdk\platform-tools\adb.exe' install -r `
  '.\app\build\outputs\apk\debug\app-debug.apk'
```

使用 `install -r` 更新且保持相同 applicationId/签名时，WebView 的 localStorage 会保留；不要先卸载应用。
