#!/usr/bin/env bash
# 把非 16:9 的演出视频烘成 1280x720：
#   square/portrait → 主体完整居中（contain），两侧用同一画面放大模糊铺底（不裁人物）
#   near-16:9（1280x864/708）→ 等比缩放后居中裁到 720 高
# 同时可选首尾 0.4s 交叉淡化闭合循环（loop=1）。输出 mp4(H.264) + webm(VP9)，无音轨。
# 用法: fit_landscape.sh in.mp4 out_stem [contain|cover] [loop]
set -euo pipefail
in=$1; out=$2; mode=${3:-contain}; loop=${4:-0}
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$in")
if [ "$mode" = contain ]; then
  vf="[0:v]split[a][b];[a]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,boxblur=24:2,eq=brightness=-0.12:saturation=0.85[bg];[b]scale=1280:720:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,fps=30,format=yuv420p"
else
  vf="[0:v]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=30,format=yuv420p"
fi
if [ "$loop" = 1 ]; then
  # 尾部 0.4s 与开头 0.4s 交叉淡化，片长缩短 0.4s，首尾帧一致
  x=0.4; L=$(python3 -c "print(round($dur-$x,3))")
  vf="$vf,split[m][h];[h]trim=0:$x,setpts=PTS-STARTPTS,fps=30[head];[m]trim=$x:$dur,setpts=PTS-STARTPTS,fps=30[body];[body][head]xfade=transition=fade:duration=$x:offset=$(python3 -c "print(round($dur-2*$x,3))"),format=yuv420p"
fi
tmp=$(mktemp -d)
ffmpeg -v error -y -i "$in" -filter_complex "$vf" -an -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 24 -preset slow -movflags +faststart "$tmp/o.mp4"
ffmpeg -v error -y -i "$tmp/o.mp4" -an -c:v libvpx-vp9 -b:v 0 -crf 37 -row-mt 1 "$tmp/o.webm"
mv "$tmp/o.mp4" "$out.mp4"; mv "$tmp/o.webm" "$out.webm"; rm -rf "$tmp"
ffprobe -v error -select_streams v:0 -show_entries stream=width,height:format=duration,size -of csv=p=0 "$out.mp4" | tr '\n' ' '; echo " $out"
