#!/usr/bin/env python3
"""素材质量评分（门禁辅助）：噪声（高频残差）、模糊（拉普拉斯方差，统一缩到 512 长边）、过曝比例、宽高比。
用法：quality_score.py <目录或文件...> [--json out.json] [--gate]  门禁阈值见 THRESH；--gate 时不达标返回 1。"""
import sys, json, glob, os, numpy as np, cv2
THRESH = dict(noise=4.5, blur_min=60, over=6.0)
def score(f):
    im = cv2.imread(f, cv2.IMREAD_UNCHANGED)
    if im is None or min(im.shape[:2]) < 96: return None
    a = im[..., 3] if im.ndim == 3 and im.shape[2] == 4 else None
    bgr = im[..., :3] if im.ndim == 3 else cv2.cvtColor(im, cv2.COLOR_GRAY2BGR)
    h, w = bgr.shape[:2]; s = 1024 / max(h, w)
    if s < 1: bgr = cv2.resize(bgr, (int(w * s), int(h * s)), interpolation=cv2.INTER_AREA); a = None if a is None else cv2.resize(a, (bgr.shape[1], bgr.shape[0]))
    g = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY); m = a > 128 if a is not None else np.ones(g.shape, bool)
    if m.sum() < 1000: return None
    # 只在平坦区估计颗粒：先 5×5 中值平滑，梯度小的像素才计入，避免把线稿/边缘当噪声
    sm = cv2.medianBlur(g, 5); gr = cv2.magnitude(cv2.Sobel(sm, cv2.CV_32F, 1, 0), cv2.Sobel(sm, cv2.CV_32F, 0, 1))
    flat = m & (gr < 24) & (sm > 18)
    noise = float(np.abs(g.astype(np.float32) - sm)[flat].mean()) if flat.sum() > 500 else 0.0
    s2 = 512 / max(g.shape); gs = cv2.resize(g, (max(1, int(g.shape[1] * s2)), max(1, int(g.shape[0] * s2))), interpolation=cv2.INTER_AREA)
    blur = float(cv2.Laplacian(gs, cv2.CV_32F).var()); over = float((g[m] >= 250).mean() * 100)
    fxwhite = any(t in f for t in ('/fx/', '/vfx/', 'anim_', '/shmup/', '/duel/', '/live/'))
    bad = [k for k, ok in (('noise', noise <= THRESH['noise']), ('blur', blur >= THRESH['blur_min']), ('over', fxwhite or over <= THRESH['over'])) if not ok and not (k != 'noise' and fxwhite) and not (k == 'noise' and w * h < 400000)]
    return dict(f=f, w=w, h=h, ratio=round(w / h, 3), noise=round(noise, 2), blur=round(blur, 1), over=round(over, 2), bad=bad)
def main():
    args = [x for x in sys.argv[1:] if not x.startswith('--')]; js = sys.argv[sys.argv.index('--json') + 1] if '--json' in sys.argv else None
    if js in args: args.remove(js)
    files = []
    for p in args: files += [p] if os.path.isfile(p) else [f for e in ('webp', 'png', 'jpg') for f in glob.glob(p + '/**/*.' + e, recursive=True)]
    res = [r for r in map(score, files) if r]
    if js: json.dump(res, open(js, 'w'), ensure_ascii=False, indent=0)
    bad = [r for r in res if r['bad']]; print('scored %d, flagged %d' % (len(res), len(bad)))
    if '--gate' not in sys.argv: return 0
    # ratchet：已登记的旧素材允许暂时不达标（只许减少），新增或替换后的素材必须达标
    bl = set(json.load(open(os.path.join(os.path.dirname(__file__), 'quality_baseline.json'))))
    new = [r for r in bad if r['f'].split('game/art/')[-1] not in bl]
    for r in new: print('QUALITY FAIL', r['f'], r['bad'], 'noise', r['noise'], 'blur', r['blur'], 'over', r['over'])
    print('quality gate: %d legacy flagged (baseline %d), %d new failures' % (len(bad) - len(new), len(bl), len(new)))
    return 1 if new else 0
sys.exit(main())
