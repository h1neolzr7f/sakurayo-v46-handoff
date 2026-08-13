# V4.2 验证说明

本文件记录 2026-07-13 的实际验证结果。

## 静态与内容包

```powershell
python tools\static_check.py src\index.html
python tools\check_content_packs.py
python -m py_compile tools\build_game.py tools\check_content_packs.py tools\new_content_pack.py
```

门禁覆盖脚本语法、包 ID、API/游戏版本、依赖引用、资源路径和资源存在性。

## 框架契约

```powershell
node tests\framework_smoke.mjs
```

结果：7/7 通过。覆盖旧档补字段、官方内容、购买/成就、扩展持久化、探索、依赖/迁移/Hook/编译隔离、坏包隔离。

## 完整浏览器

```powershell
node tests\browser_smoke.mjs
```

结果：41/41 通过。覆盖菜单、Mod Kit 面板、三角色、战斗、升级、Boss、结算、商店、主神空间、存档、怪海预算、离线请求和错误面板。第二次确定性复跑的纯初始强化终章用时为 221/210/198 秒。

## 脚手架实测

```powershell
python tools\new_content_pack.py author.demo-pack --folder demo-pack --title "演示扩展" --dry-run
```

另在临时工程中实际创建并登记，生成的 `pack.js` 通过 `node --check`；工具不会覆盖已有目录。

## Android 与发布包

```powershell
powershell -ExecutionPolicy Bypass -File android-app\sync-game.ps1
cd android-app
.\gradlew.bat assembleRelease lintRelease --no-daemon
```

结果：同步校验 15 项核心美术、116 项 UI、15 项角色动画、168 项服饰；Release 与 Lint 成功。APK 为 versionCode 44 / versionName 4.2.0，v1/v2 签名和 Zipalign 通过，未声明 INTERNET 权限。Android 15 模拟器覆盖安装成功，`MainActivity` 前台；本游戏进程 `FATAL EXCEPTION/Uncaught` 为 0。实机视口截图确认 4/4 扩展启用及依赖信息完整显示。
