#!/bin/bash
# 把抠好的并排视频装进 live_video/<角色>/alpha/，并生成桌面调试用 VP9 版；全部片段齐了才登记到 alpha.js
ART=/workspace/sakurayo-v46-handoff/android-app/app/src/main/assets/game/art/live_video
ids=()
for c in sayo aya rion; do
  ok=1; mkdir -p $ART/$c/alpha
  for f in $ART/$c/*.mp4; do n=$(basename $f .mp4); o=/workspace/mascot_cut/out/${c}_$n.mp4
    [ -f $o ] || { ok=0; continue; }
    [ $ART/$c/alpha/$n.mp4 -nt $o ] || ffmpeg -v error -y -i $o -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 27 -preset slow -movflags +faststart $ART/$c/alpha/$n.mp4
    [ -f $ART/$c/alpha/$n.webm ] || ffmpeg -v error -y -i $o -c:v libvpx-vp9 -crf 40 -b:v 0 -row-mt 1 -deadline good -cpu-used 4 $ART/$c/alpha/$n.webm
  done
  [ $ok = 1 ] && ids+=("\"$c\"")
done
echo "// 登记已有透明看板娘（alpha/ 左右并排：左彩色右遮罩）的角色。由 tools/video/mascot_alpha 管线生成。" > $ART/alpha.js
echo "window.SakurayoMascotAlpha = [$(IFS=,; echo "${ids[*]}")];" >> $ART/alpha.js
cat $ART/alpha.js
