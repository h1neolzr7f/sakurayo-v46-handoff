#!/usr/bin/env python3
"""Sakurayo 动画流水线（docs/ANIM_PIPELINE.md）。一条命令：

  python tools/anim-pipeline/run.py rig --name sayo --base art.png [--gen] [--diffs closed,talk,happy,shy]

阶段：gen（中转站 gpt-image-2 编辑出差分）→ cutout（rembg 抠图）→ align（OpenCV ECC 配准差分，提取补丁）
     → landmarks（由差分自动定位眼、嘴、头）→ depth（Depth Anything V2 Small）→ regions（头/发/裙/胸权重）
     → mesh（网格 + 每顶点权重）→ export（atlas.webp + rig.js，游戏直接加载）。
CPU 即可运行。产物：android-app/.../game/art/live/<name>/{base.webp,atlas.webp,rig.js}
"""
import argparse, base64, json, os, sys, subprocess
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ART = os.path.join(ROOT, 'android-app/app/src/main/assets/game/art')
GEN = '/workspace/sakurayo-gen'
DIFF_PROMPTS = {
    'closed': 'eyes gently closed (natural blink, eyelids down with eyelashes), mouth unchanged',
    'talk': 'mouth slightly open as if talking, eyes unchanged',
    'happy': 'happy smile with eyes closed in upward curves (^ ^), light blush, mouth open smiling',
    'shy': 'flustered: wide eyes looking aside, strong blush, small wavy mouth',
}
# 语义分割也交给 gpt-image-2：把某部件涂成纯色，配准后按颜色取 mask（比颜色聚类可靠，黑发/黑衣也能分开）
MASK_PROMPTS = {
    'hairmask': ('Edit this exact image. Keep the pose, framing and everything else identical, but recolor ALL of the hair '
                 '(bangs, side locks, back hair, ponytails, every strand) to flat pure magenta #FF00FF with no shading. Do not recolor anything else.', (255, 0, 255)),
    'skirtmask': ('Edit this exact image. Keep the pose, framing and everything else identical, but recolor the skirt and any coat tails / '
                  'hanging cloth below the waist to flat pure cyan #00FFFF with no shading. Do not recolor legs, weapon or anything else.', (0, 255, 255)),
}
EDIT = ('Edit this exact image. Keep EVERYTHING identical: same pose, same framing, same position and size, same hair, '
        'outfit, colors, lighting, white background. Only change the face: ')

def log(*a): print('[anim]', *a, flush=True)

def stage_gen(name, base_png, diffs, work):
    sys.path.insert(0, GEN); import gen  # relay client (reads RELAY_* env)
    jobs = []
    for d in diffs:
        for v in 'ab':
            out = os.path.join(work, f'{name}_{d}_{v}.png')
            if not os.path.exists(out): jobs.append((EDIT + DIFF_PROMPTS[d], out))
    for k, (pr, _) in MASK_PROMPTS.items():
        out = os.path.join(work, f'{name}_{k}.png')
        if not os.path.exists(out): jobs.append((pr, out))
    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(6) as ex:
        list(ex.map(lambda j: gen.gen(j[0], '1024x1536', j[1], [base_png]), jobs))

def load_rgba(p):
    return Image.open(p).convert('RGBA')

def stage_cutout(img):
    a = np.asarray(img)
    if a[..., 3].min() < 250: return img
    from rembg import remove, new_session
    return remove(img.convert('RGB'), session=new_session('isnet-anime'), alpha_matting=True)

CASCADE = '/workspace/sakurayo-tools/lbpcascade_animeface.xml'  # nagadomi/lbpcascade_animeface (MIT)

def face_box(rgb):
    import cv2
    g = cv2.equalizeHist(cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY))
    f = cv2.CascadeClassifier(CASCADE).detectMultiScale(g, 1.05, 4, minSize=(100, 100))
    if len(f) == 0: H, W = g.shape; return (W // 3, H // 10, W // 3, W // 3)
    return tuple(int(v) for v in max(f, key=lambda r: r[2]))

def align_patch(base_rgb, diff_rgb, alpha, face):
    import cv2
    b = cv2.cvtColor(base_rgb, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    d = cv2.cvtColor(diff_rgb, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    fx, fy, fw, fh = face; H, W = b.shape
    x0 = max(0, int(fx - fw * 0.12)); x1 = min(W, int(fx + fw * 1.12)); y0 = max(0, int(fy + fh * 0.05)); y1 = min(H, int(fy + fh * 1.08))
    warp = np.eye(2, 3, dtype=np.float32)
    try:
        roi = np.zeros_like(b, np.uint8); roi[y0:y1, x0:x1] = 1
        _, warp = cv2.findTransformECC(b, d, warp, cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-5), roi, 5)
    except cv2.error:
        pass
    al = cv2.warpAffine(diff_rgb, warp, (b.shape[1], b.shape[0]), flags=cv2.INTER_LINEAR + cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)
    da = cv2.cvtColor(al, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    diff = cv2.GaussianBlur(np.abs(b - da), (0, 0), 3)
    mask = (diff > 0.05).astype(np.uint8); mask[:y0] = 0; mask[y1:] = 0; mask[:, :x0] = 0; mask[:, x1:] = 0
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
    mask = cv2.dilate(mask, np.ones((9, 9), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(mask)
    keep = np.zeros_like(mask)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] > 120: keep[lab == i] = 1
    soft = cv2.GaussianBlur(keep.astype(np.float32), (0, 0), 5) * (alpha / 255.0)
    resid = float(np.abs(b - da)[y0:y1, x0:x1][keep[y0:y1, x0:x1] == 0].mean()) if keep.any() else 1.0
    return (al, soft, keep), resid

def landmarks(patches, W, H, face=None):
    import cv2
    out = {}
    if 'closed' in patches:
        keep = patches['closed']['keep']
        n, lab, st, cen = cv2.connectedComponentsWithStats(keep)
        comps = sorted([(st[i, cv2.CC_STAT_AREA], cen[i]) for i in range(1, n)], key=lambda q: -q[0])[:2]
        if len(comps) == 2:
            e = sorted([c[1] for c in comps], key=lambda p: p[0]); out['eyes'] = [[float(e[0][0]), float(e[0][1])], [float(e[1][0]), float(e[1][1])]]
    if 'eyes' not in out:  # fallback: centre of any patch
        ys, xs = np.nonzero(next(iter(patches.values()))['keep']); out['eyes'] = [[float(xs.mean() - 50), float(ys.mean())], [float(xs.mean() + 50), float(ys.mean())]]
    (ax, ay), (bx, by) = out['eyes']; ed = max(40.0, float(np.hypot(bx - ax, by - ay)))
    if 'talk' in patches:
        ys, xs = np.nonzero(patches['talk']['keep']); sel = ys > (ay + by) / 2 + ed * 0.25
        out['mouth'] = [float(xs[sel].mean()), float(ys[sel].mean())] if sel.any() else [float((ax + bx) / 2), float((ay + by) / 2 + ed * 0.8)]
    else: out['mouth'] = [float((ax + bx) / 2), float((ay + by) / 2 + ed * 0.8)]
    out['eyeDist'] = ed
    fx, fy, fw, fh = face
    out['face'] = [fx, fy, fw, fh]
    out['head'] = [float(fx + fw / 2), float(fy + fh * 0.45)]
    out['headR'] = float(fw * 0.85)
    ed = fw * 0.55
    out['neck'] = [out['head'][0], out['head'][1] + ed * 1.6]
    out['chest'] = [out['head'][0], out['head'][1] + ed * 3.2]
    return out

def depth_map(img):
    from transformers import pipeline
    p = pipeline('depth-estimation', model='depth-anything/Depth-Anything-V2-Small-hf', device='cpu')
    rgb = Image.new('RGB', img.size, (128, 128, 128)); rgb.paste(img, mask=img.split()[3])
    d = np.asarray(p(rgb)['predicted_depth'], dtype=np.float32); d = d[0] if d.ndim == 3 else d
    d = (d - d.min()) / (d.max() - d.min() + 1e-6)
    return np.asarray(Image.fromarray((d * 255).astype(np.uint8)).resize(img.size, Image.BILINEAR)).astype(np.float32) / 255

def color_mask(path, size, rgb, alpha):
    import cv2
    if not os.path.exists(path): return None
    e = np.asarray(Image.open(path).convert('RGB').resize(size)).astype(np.float32)
    m = ((np.linalg.norm(e - np.array(rgb, np.float32), axis=2) < 110) & (alpha > 0.4)).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    return m.astype(np.float32) if m.sum() > 2000 else None

def regions(img, lm, depth, masks=None):
    import cv2
    masks = masks or {}
    a = np.asarray(img).astype(np.float32); alpha = a[..., 3] / 255; H, W = alpha.shape
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    hx, hy = lm['head']; R = lm['headR']; ed = lm['eyeDist']
    head = np.clip(1 - (np.hypot(xs - hx, (ys - hy) * 0.95) - R * 0.95) / (R * 0.55), 0, 1)
    head[ys > lm['neck'][1]] *= np.clip(1 - (ys - lm['neck'][1]) / (ed * 0.6), 0, 1)[ys > lm['neck'][1]]
    lab = cv2.cvtColor(a[..., :3].astype(np.uint8), cv2.COLOR_RGB2LAB).astype(np.float32)
    fx, fy, fw, fh = lm['face']
    band = (ys > fy - fh * 0.35) & (ys < fy + fh * 0.12) & (np.abs(xs - hx) < fw * 0.4) & (alpha > 0.9)
    hc = np.median(lab[band], axis=0) if band.sum() > 50 else lab[int(hy - R * 0.8), int(hx)]
    dist = np.linalg.norm(lab - hc, axis=2)
    ax_ = np.abs(xs - hx)
    geom = ((ys < fy + fh * 0.18) & (np.hypot(xs - hx, ys - hy) < R * 1.25)) | ((ax_ > fw * 0.42) & (ax_ < fw * 1.35) & (ys > fy) & (ys < fy + fh * 3.2))
    hair = (geom & (dist < 70) & (alpha > 0.5)).astype(np.float32)
    hair = cv2.morphologyEx(hair, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    n, labc, st, _ = cv2.connectedComponentsWithStats(hair.astype(np.uint8))
    top = np.zeros_like(hair)
    for i in range(1, n):  # keep hair blobs connected to the head area
        m = labc == i
        if st[i, cv2.CC_STAT_AREA] > 400: top[m] = 1
    if masks.get('hairmask') is not None: top = masks['hairmask']
    hair = cv2.GaussianBlur(top, (0, 0), 6)
    length = np.clip((ys - (hy - R * 0.3)) / (H * 0.45), 0, 1)  # longer strands swing more
    hairW = hair * (0.25 + 0.75 * length) * (1 - 0.7 * np.clip(head * (ys < hy + ed * 0.3), 0, 1))
    body_ys = ys[alpha > 0.5]; feet = float(body_ys.max()) if body_ys.size else H
    hip = lm['chest'][1] + (feet - lm['chest'][1]) * 0.42
    skirt = np.clip(1 - np.abs(ys - (hip + ed * 1.6)) / (ed * 1.8), 0, 1) * np.clip((np.abs(xs - hx) - ed * 0.2) / (ed * 2.5), 0.15, 1) * (alpha > 0.3)
    if masks.get('skirtmask') is not None:
        sm = masks['skirtmask']; yy = ys[sm > 0]; t0 = float(yy.min())
        skirt = cv2.GaussianBlur(sm, (0, 0), 8) * np.clip((ys - t0) / max(1.0, float(yy.max()) - t0), 0, 1)
    cx, cy = lm['chest']
    chest = np.exp(-(((xs - cx) / (ed * 1.9)) ** 2 + ((ys - cy) / (ed * 1.3)) ** 2))
    upper = np.clip((hip - ys) / (hip - (hy - R)), 0, 1)  # 0 at hips → 1 at head
    eyes = np.zeros_like(alpha)
    for ex, ey in lm['eyes']: eyes = np.maximum(eyes, np.exp(-(((xs - ex) / (ed * 0.32)) ** 2 + ((ys - ey) / (ed * 0.22)) ** 2)))
    return dict(head=head, hair=np.clip(hairW, 0, 1), skirt=skirt, chest=chest, upper=upper, depth=depth, eyes=eyes), dict(hip=hip, feet=feet)

def export(name, img, patches, lm, R, extra, out_dir, gx=40, gy=60):
    os.makedirs(out_dir, exist_ok=True)
    a = np.asarray(img); alpha = a[..., 3]; ys, xs = np.nonzero(alpha > 8)
    x0, x1, y0, y1 = int(xs.min()), int(xs.max()) + 1, int(ys.min()), int(ys.max()) + 1
    W, H = img.size
    img.save(os.path.join(out_dir, 'base.webp'), quality=90, method=5)
    # atlas: patches side by side (cropped)
    rects, tiles, x = {}, [], 0
    for k, p in patches.items():
        al, soft, keep = p['img'], p['soft'], p['keep']
        yy, xx = np.nonzero(soft > 0.02)
        px0, px1, py0, py1 = int(xx.min()), int(xx.max()) + 1, int(yy.min()), int(yy.max()) + 1
        tile = np.dstack([al[py0:py1, px0:px1], (soft[py0:py1, px0:px1] * 255).astype(np.uint8)])
        tiles.append((x, Image.fromarray(tile, 'RGBA'))); rects[k] = dict(ax=x, ay=0, w=px1 - px0, h=py1 - py0, x=px0, y=py0); x += px1 - px0 + 4
    if tiles:
        atlas = Image.new('RGBA', (x, max(t.height for _, t in tiles)), (0, 0, 0, 0))
        for ox, t in tiles: atlas.paste(t, (ox, 0))
        atlas.save(os.path.join(out_dir, 'atlas.webp'), quality=92, method=5)
    # grid vertices + weights (sampled from region maps)
    vx = np.linspace(x0, x1, gx); vy = np.linspace(y0, y1, gy)
    W8 = {}
    for k, m in R.items():
        s = m[np.clip(vy.astype(int), 0, H - 1)][:, np.clip(vx.astype(int), 0, W - 1)]
        W8[k] = base64.b64encode((np.clip(s, 0, 1) * 255).astype(np.uint8).tobytes()).decode()
    rig = dict(v=1, name=name, w=W, h=H, bbox=[x0, y0, x1, y1], grid=[gx, gy], landmarks=lm, extra=extra, patches=rects, weights=W8)
    with open(os.path.join(out_dir, 'rig.js'), 'w') as f:
        f.write('(window.SakurayoRigData=window.SakurayoRigData||{})[%s]=%s;\n' % (json.dumps(name), json.dumps(rig, separators=(',', ':'))))
    log('exported', out_dir, 'patches', list(rects), 'atlas', x)

def cmd_rig(args):
    work = os.path.join(GEN, 'live'); os.makedirs(work, exist_ok=True)
    diffs = [d for d in args.diffs.split(',') if d]
    base = load_rgba(args.base); base = stage_cutout(base)
    base_png = os.path.join(work, f'{args.name}_base.png')
    if not os.path.exists(base_png):
        bg = Image.new('RGBA', base.size, (255, 255, 255, 255)); bg.alpha_composite(base); bg.convert('RGB').save(base_png)
    if args.gen: stage_gen(args.name, base_png, diffs, work)
    brgb = np.asarray(Image.open(base_png).convert('RGB')); alpha = np.asarray(base)[..., 3].astype(np.float32)
    face = face_box(brgb); log('face', face)
    patches = {}
    for d in diffs:
        best = None
        for v in 'ab':
            p = os.path.join(work, f'{args.name}_{d}_{v}.png')
            if not os.path.exists(p): continue
            r, resid = align_patch(brgb, np.asarray(Image.open(p).convert('RGB').resize(base.size)), alpha, face)
            if r and (best is None or resid < best[1]): best = (r, resid, v)
        if best:
            al, soft, keep = best[0]; patches[d] = dict(img=al, soft=soft, keep=keep); log(d, 'variant', best[2], 'resid %.4f' % best[1])
    lm = landmarks(patches, *base.size, face=face)
    depth = depth_map(base)
    masks = {k: color_mask(os.path.join(work, f'{args.name}_{k}.png'), base.size, c, alpha / 255) for k, (_, c) in MASK_PROMPTS.items()}
    log('masks', {k: v is not None for k, v in masks.items()})
    R, extra = regions(base, lm, depth, masks)
    out = os.path.join(ART, 'live', args.name)
    export(args.name, base, patches, lm, R, extra, out)
    if args.debug:
        dbg = Image.fromarray(np.dstack([(R['hair'] * 255).astype(np.uint8), (R['head'] * 255).astype(np.uint8), (R['skirt'] * 255).astype(np.uint8)]))
        dbg.save(os.path.join(work, f'{args.name}_regions.png'))

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); sp = ap.add_subparsers(dest='cmd', required=True)
    r = sp.add_parser('rig'); r.add_argument('--name', required=True); r.add_argument('--base', required=True)
    r.add_argument('--diffs', default='closed,talk,happy,shy'); r.add_argument('--gen', action='store_true'); r.add_argument('--debug', action='store_true')
    a = ap.parse_args(); {'rig': cmd_rig}[a.cmd](a)
