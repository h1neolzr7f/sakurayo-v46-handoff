#!/usr/bin/env python3
"""镜空背景：把 gpt-image-2 生成的俯视地面图做成严格竖向周期（可无缝平铺），月亮单独抠成精灵。
  周期化：取高 H 的图，最后 B 行与开头 B 行做线性交叉淡化，输出高度 H-B → 第 0 行与最后一行在像素上连续。
  验证：拼两张后在接缝处的行差 ≈ 图内相邻行差。"""
import sys, numpy as np
from PIL import Image
G = '/workspace/sakurayo-gen/shmup/'; OUT = 'android-app/app/src/main/assets/game/art/shmup/'
def periodic(src, B=200, W=720):
    a = np.asarray(Image.open(src).convert('RGB'), np.float32); H = a.shape[0]
    w = np.linspace(0, 1, B)[:, None, None]
    head = a[:B] * w + a[H - B:] * (1 - w)  # 开头 B 行由“上一张的末尾”渐变到自身
    o = np.concatenate([head, a[B:H - B]], 0)
    im = Image.fromarray(np.clip(o, 0, 255).astype(np.uint8)); im = im.resize((W, round(im.height * W / im.width)), Image.LANCZOS)
    x = np.asarray(im, np.float32); seam = np.abs(x[0] - x[-1]).mean(); inner = np.abs(np.diff(x, axis=0)).mean()
    return im, seam, inner
for k, v in [('bg1', sys.argv[1] if len(sys.argv) > 1 else 'a'), ('bg2', 'a'), ('bg3', 'a')]:
    im, seam, inner = periodic(G + f'tile_{k}_{v}.png'); im.save(OUT + f'tile_{k[-1]}.webp', quality=86, method=6)
    print(k, im.size, 'seam row diff %.2f vs inner %.2f' % (seam, inner))
m = np.asarray(Image.open(G + 'moon_a.png').convert('RGB'), np.float32)
al = np.clip((m.max(2) - 18) / 120, 0, 1)  # 黑底 → alpha（光晕保留半透明）
rgb = m / np.maximum(al[..., None], 1e-3); rgb = np.clip(rgb, 0, 255)
Image.fromarray(np.dstack([rgb, al * 255]).astype(np.uint8), 'RGBA').resize((400, 400), Image.LANCZOS).save(OUT + 'moon.webp', quality=88, method=6)
print('moon ok')
