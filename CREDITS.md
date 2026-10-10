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
