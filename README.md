# 🌸 樱夜·尸潮

### v4.4.6 · 原创离线二次元肉鸽射击

**选角 · 四章剧情 · 职业转职 · 跨职融合 · 三相飞升 · 主神空间**

![Release](https://img.shields.io/github/v/release/h1neolzr7f/sakurayo-zombietide?label=Release&color=C026D3)
![Version](https://img.shields.io/badge/Version-4.4.6-db2777)
![Android](https://img.shields.io/badge/Android-6.0%2B-3DDC84?logo=android&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-Canvas-E34F26?logo=html5&logoColor=white)
![License](https://img.shields.io/github/license/h1neolzr7f/sakurayo-zombietide)
![CI](https://img.shields.io/github/actions/workflow/status/h1neolzr7f/sakurayo-zombietide/verify.yml?label=verify)
![Local First](https://img.shields.io/badge/Privacy-Local--first-7A5AF8)

[v4.4.6 Android 包](https://github.com/h1neolzr7f/sakurayo-zombietide/releases/tag/v4.4.6) ·
[怎么玩](docs/user-guide.md) ·
[更新记录](CHANGELOG.md) ·
[路线图](ROADMAP.md) ·
[参与贡献](CONTRIBUTING.md) ·
[负责任使用](RESPONSIBLE_USE.md)

> [!IMPORTANT]
> **原创游戏。** 三角色、四章剧情、职业树和本仓库自制美术都属于本项目，不是任何现有商业游戏的同人、移植或资源提取。少量 UI 反馈音效使用 [Kenney](https://kenney.nl/) 的 CC0 素材，见 [第三方素材说明](docs/THIRD_PARTY_ASSETS.md)。维护者不为把本游戏冒充上架商店、传播签名密钥或清空他人存档提供支持。详见 [免责声明](DISCLAIMER.md)。

> [!NOTE]
> **玩家请下 Releases，不要直接翻源码。** 从 [v4.4.6](https://github.com/h1neolzr7f/sakurayo-zombietide/releases/tag/v4.4.6) 下载 `Sakurayo-ZombieTide-v4.4.6-android.apk`，用发布说明里的 SHA-256 核对后再安装。电脑试玩：克隆仓库后用浏览器打开 `src/index.html`。存档只在本机，键名 `sakurayoV3`。

## 它是做什么的

樱夜市被零号企业改写成尸潮试验场。你从三名幸存者里选一个，用触控摇杆、冲刺和主动技能在四章地图里活下去，边打边选职业、转职、融合，最后面对四阶段 Boss。

整局离线。没有账号、没有广告、没有 CDN。通关或阵亡后，进度写回本机存档，下次接着开。

```mermaid
flowchart LR
    A[选角色] --> B[四章 / 主神空间]
    B --> C[升级三选一]
    C --> D[职业 / 转职 / 融合]
    D --> E[科技 / 生物 / 灵能]
    E --> F[Boss 四阶段]
    F --> G[结算与本地存档]
```

## 小白三步

1. 打开 [Releases](https://github.com/h1neolzr7f/sakurayo-zombietide/releases/tag/v4.4.6)，下载 `Sakurayo-ZombieTide-v4.4.6-android.apk`。
2. 用发布说明中的 SHA-256 核对文件，再侧载安装。覆盖安装旧正式包会保留存档。
3. 选月城小夜 / 神代绫 / 黑羽凛音，左手摇杆移动，右侧冲刺和技能。

电脑没有手机时：

```powershell
git clone https://github.com/h1neolzr7f/sakurayo-zombietide.git
cd sakurayo-zombietide
start src/index.html
```

美术从 `android-app/app/src/main/assets/game/art` 读取。不要改存档键，也不要清 `localStorage`。

## 三角色

| 角色 | 武器 | 定位 |
|---|---|---|
| **月城小夜** | 夜樱突击步枪 | 远程压制。射程稳，每第七发贯穿。 |
| **神代绫** | 手枪＋月切太刀 | 远近切换。每第四枪近身居合。 |
| **黑羽凛音** | 黑羽太刀 | 纯近战。第三刀扩大剑势，没有远程普攻。 |

<p align="center">
  <img src="android-app/app/src/main/assets/game/art/characters/sayo/default/face_smile.webp" alt="月城小夜" width="160">
  <img src="android-app/app/src/main/assets/game/art/characters/aya/default/face_smile.webp" alt="神代绫" width="160">
  <img src="android-app/app/src/main/assets/game/art/characters/rion/default/face_smile.webp" alt="黑羽凛音" width="160">
</p>

## 核心能力

| 能力 | 说明 |
|---|---|
| **完全离线** | 不登录、不联网、不拉外部字体或图片。Android WebView / 本地 Chrome 可直接开。 |
| **本地存档** | 键名固定 `sakurayoV3`。旧档缺字段会自动补齐，不会为了升级清空进度。 |
| **14 职业 · 28 转职** | 升级三选一里成型，9 级选分支，12 / 15 级升阶。 |
| **18 种跨职融合** | 改变攻击循环和代价，不是只加百分比。一局一次正式融合。 |
| **三相飞升** | 科技 / 生物 / 灵能改写终局规则，可与融合叠加。 |
| **四章＋主神空间** | 四章有各自地面和剧情抉择；主神空间是独立高难轮回，强化跨局保留。 |
| **Boss 四阶段** | 75% / 50% / 25% 转阶段。阶段内不无限召唤普通怪。 |
| **商店只改外观** | 衣装影响外观和职业出现倾向，不出售永久伤害。 |
| **手机操作** | 左摇杆、冲刺、主动技能。剧情 / 升级 / 暂停会暂停并收起其他文字。 |

## 界面预览

四章各有自己的地面和过场。职业卡有闪图时会铺在升级选项上。

<p align="center">
  <img src="android-app/app/src/main/assets/game/art/stages/stage_1/cg.webp" alt="第一章过场" width="210">
  <img src="android-app/app/src/main/assets/game/art/stages/stage_2/cg.webp" alt="第二章过场" width="210">
  <img src="android-app/app/src/main/assets/game/art/careers/swordSaint/splash.webp" alt="剑圣闪图" width="210">
</p>

## 硬规则

- 存档键必须是 `sakurayoV3`。缺字段补齐，禁止清档
- 不依赖网络、CDN、外部字体或外部图片
- 商店皮肤只改外观和职业倾向，不卖永久数值
- 不恢复「每颗子弹遍历全部敌人」的无界碰撞
- 敌人、子弹、召唤物、伤害字和粒子都有上限
- 不要给 `update` 再加包装层，也不要改名 `startGame` / `update` / `draw` / `spawnEnemy` / `showDialogue`

## 仓库结构

```text
src/index.html                         唯一代码基线
src/runtime/                           过场、经济、生命周期、内容包
src/content/packs/                     官方内容包（含主神虚空）
android-app/                           WebView 壳与运行时美术
android-app/app/src/main/assets/       同步后的 HTML + game/art
docs/                                  玩法、架构、变更、素材许可
tools/                                 静态检查、构建、美术后处理
tests/                                 框架与浏览器冒烟
```

发版仍是单文件 HTML，再同步进 Android 资源。维护步骤见 [docs/MAINTAIN.md](docs/MAINTAIN.md)。开发约束见 [AGENTS.md](AGENTS.md)。

## 从源码运行

需要能打开本地 HTML 的浏览器。美术路径已经写好，直接打开 `src/index.html` 即可。

验证：

```powershell
powershell -File tools/verify.ps1
```

等价于：

```powershell
python tools/static_check.py src/index.html
node --check tests/artifacts/static/index.extracted.js
node tests/framework_smoke.mjs
node tests/browser_smoke.mjs
```

打 Android 包（需要 JDK 17、Android SDK，以及你自己的 `android-app/keystore.properties`）：

```powershell
python tools/build_game.py --source src/index.html --output ../offline/index.html --asset-root ../offline/game/art
powershell -File android-app/sync-game.ps1
cd android-app
.\gradlew.bat assembleRelease
```

仓库**不含**签名密钥、`local.properties` 和 APK。模板见 `android-app/keystore.properties.example`。

## 隐私与安全

- 进度默认只在本机：浏览器 `localStorage`，或 Android WebView 同源存储
- 不申请账号，不上传存档，不读通讯录或已装应用列表
- 发行包和 git 都不包含你的存档
- 签名密钥、`keystore.properties`、`local.properties` 已被 `.gitignore` 排除

安全问题请不要在公开 Issue 里粘贴完整存档、密钥或本机绝对路径，参见 [SECURITY.md](SECURITY.md)。

## 测试

```powershell
powershell -File tools/verify.ps1
```

浏览器冒烟会开三个角色、打升级、走 Boss 转阶段并检查结算。不要把私人存档 JSON 放进 `tests/`。

## 贡献

欢迎提交：平衡、无障碍操作、缺图回退、文档和小白说明。开始前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

不要提交签名密钥、别人的存档、或给 `update` 再包一层。不接受把商店改成永久伤害、或把存档键改掉导致旧档丢失的改动。

## 路线图

当前维护线是 **v4.4.6**。已完成项与下一步见 [ROADMAP.md](ROADMAP.md)，版本记录见 [CHANGELOG.md](CHANGELOG.md)。

## 许可

代码与本仓库原创内容为 [MIT License](LICENSE)。Kenney 反馈素材为 CC0，见 [docs/THIRD_PARTY_ASSETS.md](docs/THIRD_PARTY_ASSETS.md)。

MIT 不表示你可以冒充官方上架应用商店，也不授予把签名密钥或他人存档一并分发的权利。本项目按现状提供。完整边界见 [DISCLAIMER.md](DISCLAIMER.md) 与 [RESPONSIBLE_USE.md](RESPONSIBLE_USE.md)。

---

**樱夜·尸潮 v4.4.6** · APK 与源码请从 [本仓库 Releases](https://github.com/h1neolzr7f/sakurayo-zombietide/releases/tag/v4.4.6) 下载，并用 SHA-256 核对：

```
Sakurayo-ZombieTide-v4.4.6-android.apk
SHA-256 D3CCD15CF38955951A5917217C22EAB8B136B45CFA82A04D75030D9F5C6B33EB
```

Sakurayo: Zombie Tide is an original offline anime-style roguelite shooter. Three characters, four story chapters plus a high-difficulty loop, local saves only. No account, no CDN.
