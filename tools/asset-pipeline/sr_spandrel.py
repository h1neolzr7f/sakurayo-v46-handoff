#!/usr/bin/env python3
"""用 spandrel 加载任意 OpenModelDB / Real-ESRGAN 权重做超分。--down 回到原尺寸（超分后再缩小，等于“去噪 + 修线”）。
用法：sr_spandrel.py model.pth in.png out.png [--down] [--tile 256]"""
import argparse, time, numpy as np, torch
from PIL import Image
from spandrel import ModelLoader
ap = argparse.ArgumentParser(); ap.add_argument('model'); ap.add_argument('inp'); ap.add_argument('out')
ap.add_argument('--down', action='store_true'); ap.add_argument('--tile', type=int, default=256); a = ap.parse_args()
torch.set_num_threads(8)
m = ModelLoader().load_from_file(a.model).eval(); S = m.scale
im = Image.open(a.inp).convert('RGB'); x = torch.from_numpy(np.asarray(im)).permute(2, 0, 1).float()[None] / 255
_, _, H, W = x.shape; out = torch.zeros(1, 3, H * S, W * S); t, p = a.tile, 16; t0 = time.time()
with torch.inference_mode():
    for y in range(0, H, t):
        for xx in range(0, W, t):
            y0, x0 = max(y - p, 0), max(xx - p, 0); y1, x1 = min(y + t + p, H), min(xx + t + p, W)
            r = m(x[:, :, y0:y1, x0:x1]).clamp(0, 1)
            oy, ox = (y - y0) * S, (xx - x0) * S; hh, ww = min(t, H - y) * S, min(t, W - xx) * S
            out[:, :, y * S:y * S + hh, xx * S:xx * S + ww] = r[:, :, oy:oy + hh, ox:ox + ww]
o = Image.fromarray((out[0].permute(1, 2, 0).numpy() * 255 + .5).astype(np.uint8))
if a.down: o = o.resize((W, H), Image.LANCZOS)
o.save(a.out); print('%s x%d %.1fs' % (a.model.split('/')[-1], S, time.time() - t0))
