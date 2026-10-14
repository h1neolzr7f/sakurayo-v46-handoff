#!/usr/bin/env bash
# 视频去 AI 味：抽帧 → realesr-animevideov3 ×4 再缩回（去颗粒/修线）→ ffmpeg 去闪(deflicker) + 压高光(curves) + 轻度时域降噪(hqdn3d) → x264。
# 断点续跑：工作目录 $WORK/<name>/{in,sr} 里已完成的帧会跳过。
# FIXFLASH=1：用 drop_face_flash.py（RIFE）重建特效盖脸的帧。
# live_video：CRF 从 24 起，超过 1.45MB 逐步提高 CRF（门禁单段 ≤1.5MB / 角色合计 ≤8MB）。
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

# live_video 体积门禁更严；其余 PV/剧情用 CRF 22
IS_LIVE=0
case "$IN" in */live_video/*) IS_LIVE=1 ;; esac
if [ "$IS_LIVE" = 1 ]; then
  CRF_START=${LIVE_CRF:-24}
  MAX_BYTES=${LIVE_MAX_BYTES:-1450000}
else
  CRF_START=${CRF:-22}
  MAX_BYTES=${MAX_BYTES:-0}
fi

encode_once() {
  local crf=$1 dest=$2
  if [ -n "$HAS_A" ]; then
    ffmpeg -v error -y -framerate "$FPS" -i "$SRC/%05d.png" -i "$IN" -map 0:v -map 1:a -vf "$VF" \
      -c:v libx264 -preset slow -crf "$crf" -profile:v main -movflags +faststart \
      -c:a aac -b:a 96k -shortest "$dest"
  else
    ffmpeg -v error -y -framerate "$FPS" -i "$SRC/%05d.png" -vf "$VF" \
      -c:v libx264 -preset slow -crf "$crf" -profile:v main -movflags +faststart "$dest"
  fi
}

TMP="${OUT}.tmp.mp4"
CRF=$CRF_START
encode_once "$CRF" "$TMP"
if [ "$MAX_BYTES" -gt 0 ]; then
  while [ "$(stat -c%s "$TMP")" -gt "$MAX_BYTES" ] && [ "$CRF" -lt 30 ]; do
    CRF=$((CRF + 2))
    echo "re-encode crf=$CRF (was $(stat -c%s "$TMP") > $MAX_BYTES)" >&2
    encode_once "$CRF" "$TMP"
  done
fi
mv -f "$TMP" "$OUT"
echo "OK $OUT crf=$CRF size=$(stat -c%s "$OUT")"
