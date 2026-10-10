#!/usr/bin/env python3
"""弹珠/格斗素材后处理：v11 生成的格斗舞台、弹珠场景 → webp；弹珠角色球 = AVG 头像人脸圆形裁切（lbpcascade_animeface 定位）。"""
import cv2, numpy as np
from PIL import Image, ImageDraw
A = 'android-app/app/src/main/assets/game/art/'; R = '/workspace/sakurayo-gen/raw/v11/'
import os; os.makedirs(A + 'duel', exist_ok=True); os.makedirs(A + 'pinball', exist_ok=True)
for i in (1, 2, 3):
    im = Image.open(R + f'fight/stage{i}.png').convert('RGB'); im.thumbnail((1280, 1280)); im.save(A + f'duel/stage{i}.webp', quality=84, method=6)
for i in (1, 2):
    im = Image.open(R + f'pinball/scene{i}.png').convert('RGB'); im.thumbnail((1080, 1080)); im.save(A + f'pinball/scene{i}.webp', quality=84, method=6)
cas = cv2.CascadeClassifier('/workspace/sakurayo-tools/lbpcascade_animeface.xml')
for c in ('sayo', 'aya', 'rion'):
    im = Image.open(A + f'characters/{c}/default/avg_calm.webp').convert('RGBA'); g = cv2.cvtColor(np.asarray(im.convert('RGB')), cv2.COLOR_RGB2GRAY)
    f = cas.detectMultiScale(cv2.equalizeHist(g), 1.05, 3, minSize=(60, 60))
    x, y, w, h = max(f, key=lambda r: r[2] * r[3]) if len(f) else (im.width // 3, im.height // 8, im.width // 3, im.width // 3)
    cx, cy, s = x + w / 2, y + h * 0.55, w * 0.85
    face = im.crop((int(cx - s), int(cy - s), int(cx + s), int(cy + s))).resize((160, 160), Image.LANCZOS)
    bg = Image.new('RGBA', (160, 160), (255, 236, 244, 255)); bg.alpha_composite(face)
    m = Image.new('L', (160, 160), 0); ImageDraw.Draw(m).ellipse((0, 0, 159, 159), fill=255); bg.putalpha(m)
    bg.save(A + f'pinball/ball_{c}.webp', quality=88); print(c, 'face', (x, y, w, h))
