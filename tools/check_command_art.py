#!/usr/bin/env python3
"""Validate every renovation asset, including the actual animated WebP frames."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
art = ROOT/'android-app/app/src/main/assets/game/art'
paths = ['ui/lobby-command-v2.webp', 'ui/command-seal-still.webp', 'ui/command-seal-loop.webp']
paths += [f'stages/stage_{chapter}/{kind}_v2.webp' for chapter in range(1,5) for kind in ('battle_bg','battle_floor','chapter_keyart')]
total = 0
for relative in paths:
    path = art/relative
    assert path.stat().st_size > 100, f'empty asset: {relative}'
    total += path.stat().st_size
    with Image.open(path) as image:
        for frame in range(getattr(image,'n_frames',1)):
            image.seek(frame)
            image.load()
        if 'seal-loop' in relative:
            assert image.n_frames == 8 and image.size == (192,192)
        elif 'battle_floor' in relative:
            assert image.size == (768,512)
        elif 'seal-still' in relative:
            assert image.size == (192,192) and image.mode == 'RGBA'
        else:
            assert image.size == (1536,1024)
print(f'COMMAND ART PASS: {len(paths)} local WebP files, 8 animation frames, {total:,} bytes')
