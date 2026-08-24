# NovelAI v4.5 免费 Normal 图（护号）

给《樱夜·尸潮》美术试线用。只走 **Opus 免费 perk**，不花 Anlas。

合租号规则：

- Token 只放环境变量 `NAI_API_TOKEN`，或本目录被 gitignore 的 `.token`。不要写进仓库、PR、文档。
- 只允许 `nai-diffusion-4-5-full` / `nai-diffusion-4-5-curated`。**禁止 V5**（V5 有用量条，超了会扣点）。
- 只允许 Normal 免费尺寸：`832x1216` / `1216x832` / `1024x1024`。
- NovelAI 的 UI「Small」`512x768` 在 Opus 上**可能扣点**，本工具会拒绝。
- 单张、`steps<=28`、纯文生图。img2img / vibe / director / SMEA / 放大一律拒绝。
- 默认一次一张。出图前后都会读 Anlas；若点数下降立即报 `CRITICAL` 并停。

中文里说的「无限小图」= Opus 对 V4.5 及更早模型的 **Normal 免费张**，不是大图，也不是 V5。

提示词在 `tools/nai/prompts.py`：画师串（ciloranko / tianliang / sho / hiten / anmi）+ v4.5 质量词。角色绿幕不要写 `location`；风景要写。角色锁见 `docs/ART_BIBLE.md`。

默认补非主角：大厅 / 商店 / 档案 / 四章战场。不要用这个脚本刷三角色。

```bash
export NAI_API_TOKEN='pst-...'   # 不要把这一行提交进 git
python tools/nai/generate_free_v45.py --status
python tools/nai/generate_other_assets.py --kind scene --ids lobby_wide --max 1
python tools/nai/align_assets.py --src outputs/nai/raw/lobby_wide_20260831.png --scene lobby_wide --install
# 角色站桩另走（现在先停）：
# python tools/nai/generate_assets.py --shot live --chars sayo
```

出图写到 gitignore 的 `outputs/nai/`。不要把 PNG 或 token 推进公开仓。质量开关默认关，质量词自己写进提示词，避免官方 `location` 乱加背景。
