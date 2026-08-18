# 清虫门：类修复 + 固定剧本 + 再打包

配合 [MIRROR_GACHA_BIBLE.md](MIRROR_GACHA_BIBLE.md) 与 [AGENT_SPLIT.md](AGENT_SPLIT.md)。  
「挖不到 bug」不是停条件。P0/P1 挖到停，P2 记账。

## 严重度

- **P0** 崩溃 / 卡死 / 清档 / 核心函数失效 / 三角色 10 秒内看不见人、怪、攻击
- **P1** 升级、Boss 75/50/25、结算重开、寻访仓库商店抽屉叠字、触控失灵、旧档进不了菜单
- **P2** 文案、手感、极端美化 — 记清单，不挡打包

## 三道门

```
门 A  脚本
  python tools/static_check.py src/index.html
  node tests/lobby_unit.mjs
  node tests/live_unit.mjs
  node tests/ops_unit.mjs
  node tests/framework_smoke.mjs
  node tests/browser_smoke.mjs
  能跑再跑 tools/verify.ps1

门 B  类迭代（最多 5 轮，第 6 轮只跑剧本）
  复现 → 命名这一类 → 修同类根因 → 补一条会红的回归
  第二轮起必须写「上一轮为什么没找到」，并变成测试或剧本步骤

门 C  固定游玩剧本（?test=1 或 HTTP 打开 src/index.html）
  不要卸签名冲突的正式包（会清档）
```

门 C 步骤：

1. 新档进主菜单；缺字段旧档也能进菜单  
2. 小夜 / 绫 / 凛音各开一局，10 秒内看见人、怪、攻击  
3. 摇杆、冲刺、主动技能  
4. 升一级，选完战斗继续  
5. Boss 75% / 50% / 25%（可用测试 API）  
6. 剧情和吐槽不同时挡操作  
7. 死亡或通关结算能关，能重新开局  
8. 寻访三页、仓库、商店、关卡三模式能开关  

剧本冒出新 P0/P1：回到门 B，不要继续往下点。

## 停与打包

连续 **2 轮**挖不出新的 P0/P1，且门 A + 门 C 全绿，才：

1. 更新 `docs/CHANGELOG_下一版本.md` / 相关交接  
2. 需要发版时再同步 `release/`、`android-app/sync-game.ps1`  
3. commit / push  

不要把 APK、密钥、`tests/artifacts/` 推进 git。公开仓 APK 只走 GitHub Releases。

## 禁区

复现不了的只记怀疑，不改。  
禁止为了绿而删测试或放宽断言。  
禁止借修 bug 重做镜头、卡池货表或平衡。  
一类 = 同一个根因，不是重写大厅。
