# NovelAI 生图管线

Cursor 内置 `GenerateImage` 额度用尽后，本项目用用户的 NovelAI 会员出图，用到会员失效为止。游戏发布包仍然离线，不在运行时访问 NovelAI。

借鉴 [Nai学长工作室开发版](https://github.com/h1neolzr7f/NaiXueZhang-Studio-Dev) 的编译思路，但只留 Agent 能用的薄层：大模型写 jobs，脚本只负责冻结参数、免费档判断和一次发送。不搬图库、换角 UI、多 Token 调度、Pixiv。

```text
大模型写 jobs.jsonl（画师串 / 角色参考路径 / 提示词）
  → compile 冻结快照（不打网、不扣点）
  → 人看 spendReasons
  → gen 只发送冻结体；5xx / 超时不自动重试
```

## 安全

- Token 只放本机：`NOVELAI_TOKEN` 或 `secrets/novelai.token`。
- 禁止写入 git、`src/index.html`、聊天或 PR。
- 脚本不会打印 token。Cloud Agent 虚拟机是一次性的，换一次会话就要重新放入 token。
- NovelAI ToS：每次出图必须由人发起；禁止无节制自动刷图。默认一次最多 4 张，更大批次要显式 `--allow-batch`。

## 命令

先确认会员还有效（会访问 `api.novelai.net`，不扣 Anlas）：

```bash
python tools/nai/generate.py check
```

```powershell
powershell -File tools/nai/run_nai.ps1 -Command check
```

先冻结、再出图：

```bash
python tools/nai/generate.py compile --job-id sayo_stand_greenscreen
python tools/nai/generate.py gen --job-id sayo_stand_greenscreen
```

`dry-run` 是 `compile` 的别名。快照里只有路径和参数，没有参考图 base64。`5xx` 或发送后超时视为扣费未知，禁止自动再打。免费队列 403 才允许一次 Large 补打。

出一张图：

```bash
python tools/nai/generate.py gen --job-id sayo_stand_greenscreen
```

或直接写提示词：

```bash
python tools/nai/generate.py gen \
  --prompt "1girl, solo, adult, long purple hair, shrine maiden, full body" \
  --greenscreen --nsfw --size portrait_large \
  --out assets/image2/source/nai/manual.png
```

Windows：

```powershell
powershell -File tools/nai/run_nai.ps1 -Command gen -JobId sayo_stand_greenscreen
```

预设任务在 `assets/nai/jobs.jsonl`：三角色绿幕站桩 + 大厅宽背景。源 PNG 进 `assets/image2/source/nai/`（gitignore）。过目检后再走现有抠图 / WebP 流程，写入 `android-app/app/src/main/assets/game/art`。

用户账号为 **Opus**。免费无限出图条件（官方）：单张、步数 ≤28、面积不超过 1024×1024。本机默认先走这档。

Cloud Agent / 数据中心 IP 可能被 NovelAI 判定「异常活动」并关闭免费队列。此时脚本会自动改打 Large（约 30 Anlas/张）并写 `FREE_BLOCKED, retry paid`。会员到期前剩余 Anlas 不用也会作废。不要免费额度时加 `--no-fallback-paid`。

接口一律走 `https://image.novelai.net`。

角色图默认前置画师串，并用现有 `portrait.webp` + `battle.webp` 做 V4.5 **Character Reference**（`director_reference_*`，类型 `character`，strength 0.65，fidelity 0.5）。参考图会黑底垫到 1024×1536。带参考图会扣 Anlas。

三角色任务默认 `"nsfw": true`：正向补 `nsfw, explicit, uncensored` 和 `adult`，负向不再挡成人标签。大厅任务保持 SFW。CLI 可用 `--nsfw` 覆盖单次 `--prompt` 或整批 jobs。NSFW 模式会拒绝 `loli` / `shota` / `child` 等未成年词。

## 默认参数

| 项 | 值 |
|---|---|
| 模型 | `nai-diffusion-4-5-full` |
| 采样 | `k_euler_ancestral` |
| 步数 | 28 |
| 角色绿幕 | `#00ff00` 纯底，无地面阴影 |
| 免费尺寸 | `small` 512×768；`portrait` 832×1216；`landscape` 1216×832；`square` 1024×1024 |
| 扣点尺寸 | `portrait_large` 1024×1536；`landscape_wide` 1536×1024 |

NAI 擅长单张二次元立绘，不适合一次出整页图集。需要图集时分张生成再切，或继续用旧 Image2 管线。

## 授权边界

用户已说明：生图账号不再续费，本项目可使用该 NovelAI 会员直到失效。失效后删掉本地 token，不要另找绕过。商用素材仍以 NovelAI 当时条款为准。
