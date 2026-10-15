# asset-pipeline（草案）
环境：/workspace/sakurayo-tools/venv（torch 2.14 CPU、torchvision 0.29、spandrel 0.4.2、opencv 5、av）；模型放在 /workspace/sakurayo-tools/models 和 nunif/waifu2x/pretrained_models。
- `quality_score.py <dir> [--json] [--gate]`：评分门禁，看噪声、模糊、过曝和宽高比。
- `sr_spandrel.py model.pth in out [--down]`：超分；加 --down 缩回原尺寸，用来降噪和修线。
- waifu2x：`cd nunif && python -m waifu2x.cli -m noise -n 1 --style art --gpu -1 -i in -o outdir`
- 视频（预设）：抽帧 → `sr_spandrel.py realesr-animevideov3.pth --down` → ffmpeg `hqdn3d=2:2:4:4,deflicker=size=5,curves=all='0/0 0.8/0.78 1/0.92'` → x264 CRF 20。
状态：试点阶段，还没有全量运行，也还没接进 verify。
