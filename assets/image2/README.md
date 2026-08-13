# gpt-image-2 游戏素材流水线

本目录保存《樱夜·尸潮》Android 版的生成式美术输入、提示词、原始图集、抠图结果、预览和 QA 报告。当前流水线固定使用 `gpt-image-2`，不使用旧模型。

## 当前状态

- 17 个生成任务、233 个最终 WebP 文件已经写入 `asset_manifest.json`。
- 17/17 个任务已通过 CLI `--dry-run` 参数检查。
- 色键抠图、切格、统一画布、透明角检测和覆盖率检测已通过合成图集测试。
- 正式生成需要本机环境变量 `OPENAI_API_KEY`；脚本不会打印或保存密钥。

## 目录

- `reference/`：用户风格参考图与游戏构图参考图。
- `prompts/`：每张图集的最终提示词，以及 `jobs.jsonl`。
- `source/`：gpt-image-2 返回的未处理 PNG 图集。
- `processed/`：色键转透明后的完整 PNG 图集。
- `previews/`：切分结果联系表，供人工目检。
- `reports/`：逐格尺寸、透明角、主体覆盖率和输出路径报告。
- `asset_manifest.json`：17 个任务及 233 个运行时素材的唯一清单。

最终游戏素材写入：

```text
android-app/app/src/main/assets/game/art/
```

## 运行

在 PowerShell 中仅在本机设置密钥，不要把密钥写入项目：

```powershell
[Environment]::SetEnvironmentVariable('OPENAI_API_KEY', '你的密钥', 'User')
```

重新打开 PowerShell 后执行：

```powershell
cd C:\Users\tzzcomputer\Desktop\樱夜尸潮_V3.5_Codex续作

# 只检查全部参数，不产生费用
.\tools\image2\run_image2.ps1 -Phase all -DryRun

# 正式生成全部 17 张图集并自动抠图、切分、验证
.\tools\image2\run_image2.ps1 -Phase all
```

也可分阶段生成：

```powershell
.\tools\image2\run_image2.ps1 -Phase essential
.\tools\image2\run_image2.ps1 -Phase skins
.\tools\image2\run_image2.ps1 -Phase skills
.\tools\image2\run_image2.ps1 -Phase progression
```

单独重做一个任务：

```powershell
.\tools\image2\run_image2.ps1 -JobId atlas_skin_festival -Force
```

## 抠图规则

- 角色服装图集：纯 `#00ff00` 色键。
- 敌人、Boss、宠物、掉落和危险物：纯 `#ff7a00` 色键，避免误删绿色僵尸和晶体。
- 透明素材使用官方 `remove_chroma_key.py`，启用 border 自动取色、soft matte 与 despill。
- 每格必须满足：四角 alpha 小于等于 8；主体覆盖率在 1%–90%；输出尺寸与清单一致。
- 如果正式素材仍有一像素色边，可对对应任务用 `postprocess_assets.py --edge-contract` 重新处理。

## 非生成式素材边界

中文标题、数值、按钮文字、HUD 框体、摇杆、子弹、伤害数字和高频粒子继续由 HTML/CSS/Canvas 绘制。这些内容需要动态更新、清晰缩放或高频渲染，使用生成图反而会产生乱码、模糊和性能问题；它们不是缺失素材。

