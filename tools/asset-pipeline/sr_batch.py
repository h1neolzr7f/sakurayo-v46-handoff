#!/usr/bin/env python3
"""目录批量超分/降噪（模型只加载一次，断点续跑：输出已存在就跳过）。
用法：sr_batch.py model.pth in_dir out_dir [--down] [--tile 256]"""
import argparse, os, sys, time, numpy as np, torch
from PIL import Image
from spandrel import ModelLoader
ap = argparse.ArgumentParser(); ap.add_argument('model'); ap.add_argument('ind'); ap.add_argument('outd')
ap.add_argument('--down', action='store_true'); ap.add_argument('--tile', type=int, default=256); a = ap.parse_args()
torch.set_num_threads(int(os.environ.get('SR_THREADS', '8')))
m = ModelLoader().load_from_file(a.model).eval(); S = m.scale; os.makedirs(a.outd, exist_ok=True)
def run(im):
    x = torch.from_numpy(np.array(im)).permute(2, 0, 1).float()[None] / 255
    _, _, H, W = x.shape; out = torch.zeros(1, 3, H * S, W * S); t, p = a.tile, 16
    with torch.inference_mode():
        for y in range(0, H, t):
            for xx in range(0, W, t):
                y0, x0 = max(y - p, 0), max(xx - p, 0); y1, x1 = min(y + t + p, H), min(xx + t + p, W)
                r = m(x[:, :, y0:y1, x0:x1]).clamp(0, 1); oy, ox = (y - y0) * S, (xx - x0) * S
                hh, ww = min(t, H - y) * S, min(t, W - xx) * S
                out[:, :, y * S:y * S + hh, xx * S:xx * S + ww] = r[:, :, oy:oy + hh, ox:ox + ww]
    o = Image.fromarray((out[0].permute(1, 2, 0).numpy() * 255 + .5).astype(np.uint8))
    return o.resize((W, H), Image.LANCZOS) if a.down else o
fs = sorted(f for f in os.listdir(a.ind) if f.lower().endswith(('.png', '.jpg', '.webp'))); t0 = time.time(); n = 0
for i, f in enumerate(fs):
    o = os.path.join(a.outd, os.path.splitext(f)[0] + '.png')
    if os.path.exists(o): continue
    run(Image.open(os.path.join(a.ind, f)).convert('RGB')).save(o + '.tmp.png'); os.replace(o + '.tmp.png', o); n += 1
    if n % 10 == 0: print('%d/%d %.1fs/frame' % (i + 1, len(fs), (time.time() - t0) / n), flush=True)
print('done', len(fs), 'new', n, flush=True)
