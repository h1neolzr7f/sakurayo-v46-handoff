"""P2 纵版素材后处理：中转站原图 → 抠图/切片/缩放 → art/shmup/*.webp。用法：python tools/shmup_assets.py"""
import os, glob
from PIL import Image
from rembg import remove, new_session
RAW = '/workspace/sakurayo-gen/raw'; OUT = os.path.join(os.path.dirname(__file__), '..', 'android-app/app/src/main/assets/game/art/shmup')
os.makedirs(OUT, exist_ok=True); S = new_session('isnet-anime')
def cut(im, size):
    a = remove(im.convert('RGB'), session=S); bb = a.getbbox(); a = a.crop(bb) if bb else a
    a.thumbnail((size, size), Image.LANCZOS); return a
def save(im, name, q=88): im.save(os.path.join(OUT, name), quality=q, method=5); print('->', name, im.size)
for i in (1, 2, 3):
    p = f'{RAW}/v11/shmup/bg{i}.png'
    if os.path.exists(p): save(Image.open(p).convert('RGB').resize((720, 1080), Image.LANCZOS), f'bg{i}.webp', 82)
for s in 'ab':
    p = f'{RAW}/v11/shmup/enemies_{s}.png'
    if not os.path.exists(p): continue
    im = Image.open(p); W, H = im.size
    for r in range(2):
        for c in range(3):
            save(cut(im.crop((c * W // 3, r * H // 2, (c + 1) * W // 3, (r + 1) * H // 2)), 192), f'enemy_{s}{r * 3 + c}.webp')
for i in (1, 2, 3):
    p = f'{RAW}/v11/shmup/boss{i}.png'
    if os.path.exists(p): save(cut(Image.open(p), 512), f'boss{i}.webp')
for ch in ('sayo', 'aya', 'rion'):
    v = sorted(glob.glob(f'{RAW}/p2/ship_{ch}_*.png'))
    if v: save(cut(Image.open(v[0]), 192), f'ship_{ch}.webp', 90)
p = f'{RAW}/p2/wingman_aya.png'
if os.path.exists(p): save(cut(Image.open(p), 96), 'wingman_aya.webp', 90)
p = f'{RAW}/p2/mirror_bits.png'
if os.path.exists(p):
    im = Image.open(p); W, H = im.size
    for k, n in enumerate(['power', 'shield', 'coin', 'heal']):
        save(cut(im.crop((k % 2 * W // 2, k // 2 * H // 2, (k % 2 + 1) * W // 2, (k // 2 + 1) * H // 2)), 64), f'pick_{n}.webp', 90)
