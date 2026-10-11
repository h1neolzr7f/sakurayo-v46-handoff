#!/usr/bin/env python3
"""Convert inspected Image2.5 scene sources and align eight seal frames offline.

Sources are intentionally untracked. Generation inputs live in
assets/image2/prompts/command-renovation.jsonl. No API calls or secrets here.
"""
from pathlib import Path
import argparse
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path, default=ROOT/'assets/image2/source/renovation')
    parser.add_argument('--skip-missing', action='store_true')
    args = parser.parse_args()
    art = ROOT/'android-app/app/src/main/assets/game/art'
    for chapter in range(1, 5):
        for kind, target in [('battle', 'battle_bg_v2'), ('keyart', 'chapter_keyart_v2')]:
            source=args.source/f'stage-{chapter}-{kind}.png'
            if not source.exists() and args.skip_missing:
                continue
            output=art/f'stages/stage_{chapter}/{target}.webp'
            with Image.open(source) as image:
                temporary=output.with_suffix('.tmp.webp')
                image.convert('RGB').save(temporary, 'WEBP', quality=88, method=6)
                temporary.replace(output)
            print(output.relative_to(ROOT), output.stat().st_size)
            if kind == 'battle':
                with Image.open(source) as image:
                    # Reflect an open central floor crop into a seamless tile;
                    # painted border architecture never becomes an obstacle.
                    y=320 if chapter==1 else 256
                    tile=image.convert('RGB').crop((384,y,1152,y+512)).resize((384,256),Image.Resampling.LANCZOS)
                    texture=Image.new('RGB',(768,512))
                    texture.paste(tile,(0,0))
                    texture.paste(tile.transpose(Image.Transpose.FLIP_LEFT_RIGHT),(384,0))
                    texture.paste(tile.transpose(Image.Transpose.FLIP_TOP_BOTTOM),(0,256))
                    texture.paste(tile.transpose(Image.Transpose.ROTATE_180),(384,256))
                floor=output.with_name('battle_floor_v2.webp')
                temporary=floor.with_suffix('.tmp.webp')
                texture.save(temporary,'WEBP',quality=90,method=6)
                temporary.replace(floor)
    with Image.open(args.source/'command-seal-atlas.png') as atlas:
        # Actual generated cell centers were visually inspected. Align the moon
        # across all frames to prevent artificial camera jitter in the loop.
        centers=[(x,y) for y in (300,724) for x in (196,578,966,1350)]
        frames=[atlas.crop((x-176,y-176,x+176,y+176)).resize((192,192),Image.Resampling.LANCZOS).convert('RGBA') for x,y in centers]
    ui=art/'ui'
    still=ui/'command-seal-still.webp'
    frames[0].save(still.with_suffix('.tmp.webp'),'WEBP',quality=90,method=6)
    still.with_suffix('.tmp.webp').replace(still)
    loop=ui/'command-seal-loop.webp'
    frames[0].save(loop.with_suffix('.tmp.webp'),'WEBP',save_all=True,append_images=frames[1:],duration=140,loop=0,quality=90,method=6)
    loop.with_suffix('.tmp.webp').replace(loop)
    print('Seal: 8 alpha frames, 192x192, 1120ms loop + reduced-motion still')

if __name__ == '__main__':
    main()
