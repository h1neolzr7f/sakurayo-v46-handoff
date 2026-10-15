#!/usr/bin/env python3
"""衣橱素材：v11 传说外观立绘（15）、大招特写（15）、武器外观（12）、特效包预览（6）→ webp。"""
import os, glob
from PIL import Image
R = '/workspace/sakurayo-gen/raw/v11/'; A = 'android-app/app/src/main/assets/game/art/wardrobe/'
os.makedirs(A, exist_ok=True)
for d, box in (('legend', (640, 960)), ('ult', (960, 960)), ('weapons', (512, 512)), ('fx', (512, 512))):
    for f in sorted(glob.glob(R + d + '/*.png')):
        im = Image.open(f).convert('RGB'); im.thumbnail(box, Image.LANCZOS)
        im.save(A + os.path.basename(f)[:-4] + '.webp', quality=82, method=6)
print(len(os.listdir(A)), 'files')
