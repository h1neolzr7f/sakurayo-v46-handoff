#!/usr/bin/env python3
"""修“特效盖脸”：量每帧脸部区域（默认上部居中）平均亮度，比整段中位数高出 --thr 的帧连同前后 --pad 帧标为坏帧，
用 RIFE v4.25 在坏帧段两端的干净帧之间插值重建（时长不变、动作连贯），输出完整帧序列。
用法：/workspace/sakurayo-tools/venv/bin/python drop_face_flash.py frames_dir out_dir [--box x,y,w,h] [--thr 22] [--pad 2]"""
import argparse, os, sys, shutil, numpy as np, torch
from PIL import Image
sys.path.insert(0, '/workspace/sakurayo-tools'); import rife_interp as R
ap = argparse.ArgumentParser(); ap.add_argument('ind'); ap.add_argument('outd')
ap.add_argument('--box', default='0.25,0.03,0.5,0.22'); ap.add_argument('--thr', type=float, default=22); ap.add_argument('--pad', type=int, default=2); a = ap.parse_args()
x, y, w, h = map(float, a.box.split(',')); fs = sorted(f for f in os.listdir(a.ind) if f.endswith('.png'))
load = lambda f: np.asarray(Image.open(os.path.join(a.ind, f)).convert('RGB'))
lum = []
for f in fs:
    im = Image.open(os.path.join(a.ind, f)).convert('L'); W, H = im.size
    lum.append(np.asarray(im.crop((int(x * W), int(y * H), int((x + w) * W), int((y + h) * H)))).mean())
lum = np.array(lum); bad = lum > np.median(lum) + a.thr; drop = bad.copy()
for i in np.where(bad)[0]: drop[max(0, i - a.pad):i + a.pad + 1] = True
PH, PW = (H + 63) // 64 * 64, (W + 63) // 64 * 64
@torch.inference_mode()
def rife(p, q, t):
    T = lambda z: torch.from_numpy(np.ascontiguousarray(np.pad(z, ((0, PH - H), (0, PW - W), (0, 0)), mode='edge'))).permute(2, 0, 1)[None].float() / 255
    x0, x1 = T(p), T(q); div = torch.tensor([(PW - 1) / 2, (PH - 1) / 2])
    gx = torch.linspace(-1, 1, PW).view(1, 1, 1, PW).expand(-1, -1, PH, -1); gy = torch.linspace(-1, 1, PH).view(1, 1, PH, 1).expand(-1, -1, -1, PW)
    o = R.net(x0, x1, torch.full([1, 1, PH, PW], float(t)), div, torch.cat([gx, gy], 1), R.enc(x0), R.enc(x1))
    return (o[0].permute(1, 2, 0).clamp(0, 1).numpy() * 255).astype(np.uint8)[:H, :W]
shutil.rmtree(a.outd, ignore_errors=True); os.makedirs(a.outd); i = 0; n = len(fs); fixed = 0
while i < n:
    if not drop[i]: os.link(os.path.join(a.ind, fs[i]), os.path.join(a.outd, '%05d.png' % (i + 1))); i += 1; continue
    j = i
    while j < n and drop[j]: j += 1
    L, Rr = (i - 1 if i > 0 else j), (j if j < n else i - 1)
    A, B = load(fs[L]), load(fs[Rr]); run = j - i
    for k in range(run):
        Image.fromarray(rife(A, B, (k + 1) / (run + 1))).save(os.path.join(a.outd, '%05d.png' % (i + k + 1)))
    fixed += run; i = j
print('frames %d, rebuilt %d (face-covering flash)' % (n, fixed))
