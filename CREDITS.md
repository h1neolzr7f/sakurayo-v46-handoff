# CREDITS / 素材来源与许可

## 背景音乐（`android-app/app/src/main/assets/game/art/bgm/*.ogg`）
- 作曲与编曲：本项目原创，由 `tools/bgm/songs.py` 程序化写谱生成（大厅、寻访、战斗、Boss、胜利、失败）。版权归项目所有。
- 音色：**FluidR3_GM SoundFont**，作者 Frank Wen 等，**MIT License**（Debian 包 `fluid-soundfont-gm`，`/usr/share/doc/fluid-soundfont-gm/copyright`）。MIT 许可允许商用、修改与再分发；用 SoundFont 渲染出的音频不受额外限制，按惯例在此保留署名与许可声明：

  > Copyright © 2000-2002, 2008 Frank Wen. Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.

- 渲染器：FluidSynth（LGPL-2.1，仅作为构建工具使用，未随游戏分发）。

## 音效
- `src/runtime/sakurayo-sfx.js`：WebAudio 实时合成，项目原创，无外部采样。

## 图片
- 角色立绘、卡池/试炼横幅、图标等：通过项目使用的图像生成服务（gpt-image-2）按项目原有人设生成，参见 `docs/GROK_HANDOFF_2026-10-10.md`。

## 动画补帧与抠图工具（2026-10-10，仅离线生成素材，未打包进游戏）

工具与模型放在仓库外 `/workspace/sakurayo-tools/`；仓库只包含生成后的 webp 帧。

| 项目 | 用途 | 许可证 |
| --- | --- | --- |
| [hzwer/Practical-RIFE](https://github.com/hzwer/Practical-RIFE) — RIFE v4.25 权重 | 攻击动画中间帧 `anim_attack_ab/_bc/_ca.webp`（CPU 推理） | MIT |
| [HolyWu/vs-rife](https://github.com/HolyWu/vs-rife) — `IFNet_HDv3_v4_25.py`/`warplayer.py` 网络定义与权重镜像 | 加载 RIFE 模型（未用 VapourSynth） | MIT |
| [PyTorch](https://pytorch.org)（CPU 版） | 推理运行时 | BSD-3-Clause |
| [danielgatis/rembg](https://github.com/danielgatis/rembg)（u2net） | 生成图抠图 | MIT（u2net 模型 Apache-2.0） |
| 中转站 gpt-image-2 | 关键帧/图标原图 | 生成素材归项目使用 |

关键帧对齐、亮度统一、去亮边由自写脚本 `sakurayo-gen/animfix/fix.py`（numpy/Pillow/scipy）完成。

### 2026-10-10 第一章 / 动画补帧追加
- 跑动循环关键帧（三角色各 4 张）、AVG 立绘表情差分（三角色 × 4、雨宫凛 × 2、小灯 × 2）、小灯 Q 版、第一章背景 2 张、CG 2 张、关卡地图：中转站 gpt-image-2 生成。
- 抠图：rembg（MIT）isnet-anime 模型（Apache-2.0）。中间帧：Practical-RIFE v4.25（MIT，经 vs-rife 网络定义加载）。

## 字体
- `game/art/fonts/epic-serif.woff2`：Noto Serif CJK SC Bold 的子集（仅含第一章说书旁白用字），© Adobe / Google，SIL Open Font License 1.1。

## 看板娘动画流水线（tools/anim-pipeline，详见 docs/ANIM_PIPELINE.md）
- lbpcascade_animeface — nagadomi，MIT（工具链使用，不打包进游戏）
- OpenCV — Apache-2.0；rembg (isnet-anime) — MIT；Depth Anything V2 Small — Apache-2.0（仅离线工具链）
- 运行时 src/runtime/sakurayo-rig.js 为本项目自写，无第三方代码。

## 看板娘全身绑定与大幅动作（rig v2 / action 序列）

| 项目 | 用途 | 许可证 |
|---|---|---|
| [Tau-J/rtmlib](https://github.com/Tau-J/rtmlib) + RTMPose-m（OpenMMLab [mmpose](https://github.com/open-mmlab/mmpose)） | 立绘人体 17 关键点 → 自动生成骨骼（肩/肘/腕/髋/膝） | Apache-2.0 |
| [hzwer/Practical-RIFE](https://github.com/hzwer/Practical-RIFE) v4.25（经 [HolyWu/vs-rife](https://github.com/HolyWu/vs-rife) 网络定义加载） | 动作关键帧之间的中间帧（CPU，仅离线工具链） | MIT |
| [danielgatis/rembg](https://github.com/danielgatis/rembg) isnet-anime | 关键帧/拆层抠图 | MIT（模型 Apache-2.0） |
| OpenCV ECC (`findTransformECC`) | 关键帧与原立绘静止区对齐 | Apache-2.0 |
| gpt-image-2（中转站） | 去手臂补全躯干层、动作关键帧、语义 mask | 生成内容归本项目 |
| 评估未采用：[Doubiiu/ToonCrafter](https://github.com/Doubiiu/ToonCrafter) | 官方 HF Space（ZeroGPU）匿名调用返回错误；本机无 GPU，权重约 10 GB、CPU 推理需 >20 GB 内存，盒子仅 15 GB 且与其它进程共享，不可行 | Apache-2.0（代码）|
| 评估未采用：GMFSS / AnimeInterp | 需 CUDA 自定义算子（GMFSS 的 softsplat / AnimeInterp 的 cupy），CPU 不可运行 | MIT / — |
