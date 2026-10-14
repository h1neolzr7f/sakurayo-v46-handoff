#!/usr/bin/env python3
"""卡面重合成（去和风背景，人物不重画）：抠好的人物 PNG + 中式科技背景 → 768×1024 卡面。
人物放大到约 90% 卡高、脚底贴底、加一圈主题色轮廓光；叠加切角全息框、扫描线、角标刻度。
用法：recompose_card.py cut.png bg.png out.webp --accent "#6ff3ff" [--accent2 "#ff7fb0"]"""
import argparse, numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageChops
ap = argparse.ArgumentParser(); ap.add_argument('cut'); ap.add_argument('bg'); ap.add_argument('out')
ap.add_argument('--accent', default='#6ff3ff'); ap.add_argument('--accent2', default='#ff7fb0'); ap.add_argument('--h', type=float, default=0.9)
a = ap.parse_args(); W, H = 768, 1024
def rgb(h): h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
A1, A2 = rgb(a.accent), rgb(a.accent2)
bg = Image.open(a.bg).convert('RGB'); s = max(W / bg.width, H / bg.height)
bg = bg.resize((round(bg.width * s), round(bg.height * s)), Image.LANCZOS); l = (bg.width - W) // 2; t = (bg.height - H) // 2
bg = bg.crop((l, t, l + W, t + H)).filter(ImageFilter.GaussianBlur(1.2))
# 压暗边缘、提亮中心，让人物站在光里
yy, xx = np.mgrid[0:H, 0:W]; d = np.sqrt(((xx - W / 2) / (W * .62)) ** 2 + ((yy - H * .55) / (H * .62)) ** 2)
vig = np.clip(1.08 - d * .55, .42, 1.08)[..., None]
bgn = np.clip(np.asarray(bg).astype(np.float32) * vig, 0, 255).astype(np.uint8); card = Image.fromarray(bgn).convert('RGBA')
cut = Image.open(a.cut).convert('RGBA'); bb = cut.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox(); cut = cut.crop(bb)
sc = a.h * H / cut.height
if cut.width * sc > W * .96: sc = W * .96 / cut.width
cut = cut.resize((round(cut.width * sc), round(cut.height * sc)), Image.LANCZOS)
x = (W - cut.width) // 2; y = H - cut.height + int(H * .015)
# 地面投影
sh = Image.new('L', (W, H), 0); ImageDraw.Draw(sh).ellipse((W / 2 - cut.width * .38, H - 46, W / 2 + cut.width * .38, H - 6), fill=150)
card = Image.composite(Image.new('RGBA', (W, H), (0, 0, 0, 255)), card, sh.filter(ImageFilter.GaussianBlur(14)))
# 轮廓光
al = Image.new('L', (W, H), 0); al.paste(cut.getchannel('A'), (x, y))
rim = ImageChops.subtract(al.filter(ImageFilter.MaxFilter(9)), al).filter(ImageFilter.GaussianBlur(5))
card = Image.composite(Image.new('RGBA', (W, H), A1 + (255,)), card, rim.point(lambda v: int(v * .75)))
card.alpha_composite(cut, (x, y))
# 全息框：切角描边 + 内发光 + 刻度
ov = Image.new('RGBA', (W, H), (0, 0, 0, 0)); g = ImageDraw.Draw(ov); c = 34; m = 14
poly = [(m + c, m), (W - m, m), (W - m, H - m - c), (W - m - c, H - m), (m, H - m), (m, m + c)]
glow = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(glow).line(poly + [poly[0]], fill=A1 + (200,), width=6)
ov.alpha_composite(glow.filter(ImageFilter.GaussianBlur(6))); g.line(poly + [poly[0]], fill=A1 + (255,), width=2)
for i in range(6): g.line((m + c + 18 + i * 14, m + 8, m + c + 26 + i * 14, m + 8), fill=A2 + (230,), width=3)
g.polygon([(W - m - 70, H - m), (W - m, H - m - 70), (W - m, H - m)], fill=A2 + (210,))
g.line((m + 8, H * .35, m + 8, H * .62), fill=A1 + (160,), width=2); g.line((W - m - 8, H * .2, W - m - 8, H * .4), fill=A2 + (160,), width=2)
for yy2 in range(0, H, 4): g.line((0, yy2, W, yy2), fill=(120, 240, 255, 7))
card.alpha_composite(ov)
mask = Image.new('L', (W, H), 0); ImageDraw.Draw(mask).polygon([(c, 0), (W, 0), (W, H - c), (W - c, H), (0, H), (0, c)], fill=255)
out = Image.new('RGBA', (W, H), (0, 0, 0, 0)); out.paste(card, (0, 0), mask)
out.save(a.out, quality=88, method=6); print('ok', a.out)
