#!/usr/bin/env python3
"""第二章素材：背景/CG → 1280 宽 webp；老保安立绘 → rembg 抠图，与其它 NPC 同尺寸（高 960）。"""
import os, sys
from PIL import Image
G = '/workspace/sakurayo-gen/story2/'; A = 'android-app/app/src/main/assets/game/art/'
os.makedirs(A + 'story/ch2', exist_ok=True); os.makedirs(A + 'npc/guard', exist_ok=True)
pick = dict(a.split('=') for a in sys.argv[1:])
for k, out in (('bg_ch2_street', 'bg_street'), ('bg_ch2_shateki', 'bg_shateki'), ('cg_ch2_kawaraban', 'cg_kawaraban'), ('cg_ch2_ashes', 'cg_ashes')):
    f = G + f'{k}_{pick.get(k, "a")}.png'
    if not os.path.exists(f): print('missing', f); continue
    im = Image.open(f).convert('RGB'); im = im.resize((1280, round(im.height * 1280 / im.width)), Image.LANCZOS); im.save(A + f'story/ch2/{out}.webp', quality=84, method=6); print('ok', out)
f = G + f'guard_{pick.get("guard", "a")}.png'
if os.path.exists(f):
    from rembg import remove, new_session
    im = remove(Image.open(f).convert('RGB'), session=new_session('isnet-anime')); bb = im.getbbox(); im = im.crop(bb)
    im = im.resize((round(im.width * 960 / im.height), 960), Image.LANCZOS); im.save(A + 'npc/guard/avg_calm.webp', quality=88, method=6); print('ok guard')
else: print('missing guard')
