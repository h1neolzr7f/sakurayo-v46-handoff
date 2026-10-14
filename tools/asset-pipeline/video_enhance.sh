#!/usr/bin/env bash
# 视频去 AI 味：抽帧 → realesr-animevideov3 ×4 再缩回（去颗粒/修线）→ ffmpeg 去闪(deflicker) + 压高光(curves) + 轻度时域降噪(hqdn3d) → x264 统一参数。
# 断点续跑：工作目录 $WORK/<name>/{in,sr} 里已完成的帧会跳过。
# FIXFLASH=1：用 drop_face_flash.py（RIFE）重建特效盖脸的帧。
# 用法：video_enhance.sh in.mp4 out.mp4 [extra_vf]   环境：WORK=/workspace/sakurayo-plan/work/video
set -euo pipefail
IN=$1; OUT=$2; EXTRA=${3:-}; WORK=${WORK:-/workspace/sakurayo-plan/work/video}
PY=/workspace/sakurayo-tools/venv/bin/python; M=/workspace/sakurayo-tools/models/realesr-animevideov3.pth; D=$(cd "$(dirname "$0")" && pwd)
N=$(echo "$IN" | sed 's#.*/art/##; s#[/.]#_#g'); W=$WORK/$N; mkdir -p "$W/in" "$W/sr"
FPS=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$IN")
[ -f "$W/in/.done" ] || { ffmpeg -v error -y -i "$IN" "$W/in/%05d.png" && touch "$W/in/.done"; }
"$PY" "$D/sr_batch.py" "$M" "$W/in" "$W/sr" --down
SRC="$W/sr"
if [ "${FIXFLASH:-0}" = 1 ]; then "$PY" "$D/drop_face_flash.py" "$W/sr" "$W/srfix" ${FLASHARGS:-}; SRC="$W/srfix"; fi
HAS_A=$(ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$IN" | head -1)
VF="deflicker=size=7:mode=pm,curves=all='0/0 0.70/0.68 0.88/0.80 1/0.88',hqdn3d=1.5:1.5:3:3${EXTRA:+,$EXTRA},format=yuv420p"
if [ -n "$HAS_A" ]; then
  ffmpeg -v error -y -framerate "$FPS" -i "$SRC/%05d.png" -i "$IN" -map 0:v -map 1:a -vf "$VF" -c:v libx264 -preset slow -crf 20 -profile:v main -movflags +faststart -c:a aac -b:a 96k -shortest "$OUT"
else
  ffmpeg -v error -y -framerate "$FPS" -i "$SRC/%05d.png" -vf "$VF" -c:v libx264 -preset slow -crf 20 -profile:v main -movflags +faststart "$OUT"
fi
echo "OK $OUT"
