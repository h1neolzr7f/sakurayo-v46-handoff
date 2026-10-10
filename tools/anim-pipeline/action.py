#!/usr/bin/env python3
"""大幅动作 = gpt-image-2 关键帧 + RIFE 补帧（不靠网格硬拉）。
  python tools/anim-pipeline/action.py --name sayo --act pin --keys 'k1h,k1m,k2' [--gen-prompts prompts.json]
步骤：
 1. 每个关键帧槽位有多张候选（live/act/<name>_<act>_<slot>_<v>.png），以原立绘为参考 edit 生成，同构图同机位。
 2. 全图 ECC 仿射对齐到原立绘（只用“静止区”= 动作区外的像素求变换），按静止区残差挑最优候选。
 3. 颜色：在静止区做逐通道均值/方差匹配 → 消除 AI 重绘带来的整体亮度/色偏闪烁。
 4. 静止区直接回填原图像素（运动 mask 羽化）→ 除了真正在动的手臂，其余像素逐帧完全一致，从根上去闪烁。
 5. 相邻关键帧之间用 Practical-RIFE v4.25 递归补帧（CPU），补出的帧同样做静止区回填。
 6. 首尾帧 == 原立绘（保证从待机无缝切入/切出）；输出 = 运动区包围盒内的帧序列图集 + 元数据，合入 rig.js 的 actions。
 7. 闪烁检测：静止区逐帧亮度差、运动区相邻帧平均差，写进日志。
"""
import argparse, json, os, sys, glob
import numpy as np, cv2
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__)); import run as R
sys.path.insert(0, '/workspace/sakurayo-tools'); import rife_interp as RI

def ecc(base, img, static):
    b = cv2.cvtColor(base, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255; d = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    w = np.eye(2, 3, dtype=np.float32)
    try: _, w = cv2.findTransformECC(b, d, w, cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6), static.astype(np.uint8) * 255, 5)
    except cv2.error: pass
    return cv2.warpAffine(img, w, (b.shape[1], b.shape[0]), flags=cv2.INTER_LINEAR + cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)

def colmatch(img, base, static):
    o = img.astype(np.float32)
    for c in range(3):
        a, b = o[..., c][static], base[..., c][static].astype(np.float32)
        o[..., c] = (o[..., c] - a.mean()) / (a.std() + 1e-3) * b.std() + b.mean()
    return np.clip(o, 0, 255).astype(np.uint8)

def motion(base, img, alpha_b, alpha_i):
    d = np.abs(base.astype(np.float32) - img.astype(np.float32)).mean(2) / 255 + np.abs(alpha_b - alpha_i)
    m = (cv2.GaussianBlur(d, (0, 0), 3) > 0.06).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m); keep = np.zeros_like(m)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] > 2500: keep[lab == i] = 1
    return cv2.dilate(keep, np.ones((31, 31), np.uint8))

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--name', required=True); ap.add_argument('--act', required=True); ap.add_argument('--keys', required=True)
    ap.add_argument('--inbetween', type=int, default=3, help='每段递归二分次数 → 2^n-1 个中间帧'); ap.add_argument('--hold', type=int, default=0)
    ap.add_argument('--scale', type=float, default=0.65); ap.add_argument('--side', choices=['l', 'r']); ap.add_argument('--auto-order', action='store_true', help='按动作进度自动排序/挑选关键帧'); a = ap.parse_args()
    work = os.path.join(R.GEN, 'live'); name = a.name
    base = np.asarray(Image.open(os.path.join(work, f'{name}_base.png')).convert('RGB')); H, W = base.shape[:2]
    from rembg import remove, new_session; sess = new_session('isnet-anime')
    cut = lambda rgb: np.asarray(remove(Image.fromarray(rgb), session=sess))[..., 3].astype(np.float32) / 255
    ab = cut(base)
    keys = []  # (rgb, alpha)
    def progress(m):  # 动作进度 = 运动区最高点（抬手越高，运动区顶端越靠上）。gpt-image-2 常把“刚抬手”画成“已到胸前”，槽位名不可信。
        rows = np.where((m > 0).sum(1) > 12)[0]; return 0.0 if not len(rows) else float(H - rows.min()) / H
    pool = []
    slots = a.keys.split(',')
    for slot in slots:
        cands = sorted(glob.glob(os.path.join(work, 'act', f'{name}_{a.act}_{slot}_*.png')))
        if not cands: raise SystemExit('no candidates for ' + slot)
        for p in cands:
            img = np.asarray(Image.open(p).convert('RGB').resize((W, H), Image.LANCZOS))
            m0 = motion(base, img, ab, ab); static = (m0 == 0) & (ab > 0.5)
            al = ecc(base, img, static); al = colmatch(al, base, static)
            m1 = motion(base, al, ab, ab); st = (m1 == 0) & (ab > 0.5)
            res = float(np.abs(base.astype(np.float32) - al.astype(np.float32)).mean(2)[st].mean())
            pr = progress(m1); R.log(f'{slot} {os.path.basename(p)} static residual {res:.2f} motion {m1.mean():.3f} progress {pr:.3f}')
            pool.append(dict(slot=slot, p=p, al=al, res=res, pr=pr))
    if a.auto_order:
        # 终点 = 最后一个槽位里残差最小的候选；其余关键帧按“进度”均匀取样，每个目标进度挑 残差+进度偏差+与上一帧连续性 最小者，保证单调、不回跳。
        last = min([c for c in pool if c['slot'] == slots[-1]], key=lambda c: c['res']); P1 = last['pr']
        n = len(slots) - 1; used = {last['p']}; prev = base; prog = 0.0
        for i in range(n):
            tgt = P1 * (i + 1) / (n + 1)
            ok = [c for c in pool if c['p'] not in used and prog < c['pr'] < P1 - 0.01]
            if not ok: continue
            def sc(c): return c['res'] + 60 * abs(c['pr'] - tgt) + float(np.abs(prev.astype(np.float32) - c['al'].astype(np.float32)).mean()) / 4
            b = min(ok, key=sc); used.add(b['p']); keys.append(b['al']); prev = b['al']; prog = b['pr']
            R.log(f'  key {i + 1}: {os.path.basename(b["p"])} progress {b["pr"]:.3f} (target {tgt:.3f})')
        keys.append(last['al']); R.log(f'  key end: {os.path.basename(last["p"])} progress {P1:.3f}')
    else:
        for slot in slots:
            best = None; prev = keys[-1] if keys else base  # 时间连续性：与上一关键帧差异过大（姿态跳跃/画风漂移）的候选扣分
            for c in [c for c in pool if c['slot'] == slot]:
                cont = float(np.abs(prev.astype(np.float32) - c['al'].astype(np.float32)).mean()) / 4; score = c['res'] + cont
                if best is None or score < best[0]: best = (score, c['al'])
            keys.append(best[1])
    seq_keys = [base] + keys
    if a.hold: pass
    # 关键帧 alpha + 运动 mask，静止区回填原图
    def stabilize(rgb, mask=None):
        al = cut(rgb)
        m = motion(base, rgb, ab, al) if mask is None else mask
        f = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 6)
        out = (rgb.astype(np.float32) * f[..., None] + base.astype(np.float32) * (1 - f[..., None]))
        oa = al * f + ab * (1 - f)
        return np.dstack([np.clip(out, 0, 255), oa * 255]).astype(np.uint8), m
    kst = [np.dstack([base, ab * 255]).astype(np.uint8)]; masks = [np.zeros((H, W), np.uint8)]
    for k in keys: s, m = stabilize(k); kst.append(s); masks.append(m)
    # 先算运动区包围盒，只在包围盒内补帧（省内存：盒子上与其它进程共享 15G，整图 RIFE 会被 OOM）
    union = np.zeros((H, W), np.uint8)
    for m in masks: union = np.maximum(union, m)
    ys, xs = np.nonzero(union); pad = 24
    x0, y0, x1, y1 = max(0, xs.min() - pad), max(0, ys.min() - pad), min(W, xs.max() + pad), min(H, ys.max() + pad)
    # 动作手臂在运行时会隐藏 rig 的手臂层，所以包围盒必须完整覆盖该手臂层
    try:
        import re as _re; rd = json.loads(_re.search(r'=(\{.*\});', open(os.path.join(R.ART, 'live', name, 'rig.js')).readline()).group(1))
        A = rd['arms'][a.side or rd['bones']['pinSide']]; x0, y0, x1, y1 = min(x0, A['x'] - 8), min(y0, A['y'] - 8), max(x1, A['x'] + A['w'] + 8), max(y1, A['y'] + A['h'] + 8)
        x0, y0, x1, y1 = max(0, x0), max(0, y0), min(W, x1), min(H, y1)
    except Exception as e: R.log('arm bbox skipped', e)
    x1 = min(W, x0 + ((x1 - x0 + 63) // 64) * 64); y1 = min(H, y0 + ((y1 - y0 + 63) // 64) * 64)
    if (x1 - x0) % 64: x0 = max(0, x1 - ((x1 - x0 + 63) // 64) * 64)
    if (y1 - y0) % 64: y0 = max(0, y1 - ((y1 - y0 + 63) // 64) * 64)
    crop = lambda a: np.ascontiguousarray(a[y0:y1, x0:x1])
    kst = [crop(k) for k in kst]; masks = [crop(m) for m in masks]; base_c = kst[0]
    frames = [kst[0]]
    def rec(f0, f1, depth, out):
        if depth == 0: return
        mid = RI_uncomp(RI.mid(RI_comp(f0), RI_comp(f1), 0.5))
        rec(f0, mid, depth - 1, out); out.append(mid); rec(mid, f1, depth - 1, out)
    for i in range(1, len(kst)):
        mids = []; rec(kst[i - 1], kst[i], a.inbetween, mids)
        f = cv2.GaussianBlur(np.maximum(masks[i - 1], masks[i]).astype(np.float32), (0, 0), 6)[..., None]
        for m in mids: frames.append(np.clip(m.astype(np.float32) * f + base_c.astype(np.float32) * (1 - f), 0, 255).astype(np.uint8))
        frames.append(kst[i])
    union_c = crop(union); ab_c = crop(ab)
    # 闪烁检测
    st = (union_c == 0) & (ab_c > 0.5); lum = [float(f[..., :3].mean(2)[st].mean()) for f in frames]
    md = [float(np.abs(frames[i].astype(np.float32) - frames[i - 1].astype(np.float32)).mean()) for i in range(1, len(frames))]
    R.log('frames', len(frames), 'static lum span %.3f' % (max(lum) - min(lum)), 'max adjacent motion diff %.2f mean %.2f' % (max(md), np.mean(md)))
    sc = a.scale
    while True:  # 图集不超过 4096（部分 Android WebView 的最大纹理）
        tw, th = int((x1 - x0) * sc), int((y1 - y0) * sc); cols = max(1, 4096 // tw); rows = (len(frames) + cols - 1) // cols
        if rows * th <= 4096: break
        sc *= 0.95
    atlas = Image.new('RGBA', (cols * tw, rows * th), (0, 0, 0, 0)); fr = []
    for i, f in enumerate(frames):
        cx, cy = (i % cols) * tw, (i // cols) * th
        atlas.paste(Image.fromarray(f, 'RGBA').resize((tw, th), Image.LANCZOS), (cx, cy)); fr.append([cx, cy])
    out = os.path.join(R.ART, 'live', name); atlas.save(os.path.join(out, f'act_{a.act}.webp'), quality=88, method=5)
    meta = dict(rect=[int(x0), int(y0), int(x1 - x0), int(y1 - y0)], tw=tw, th=th, frames=fr, keys=[0] + [ (i + 1) * (2 ** a.inbetween) for i in range(len(keys))], fps=24, side=a.side)
    rp = os.path.join(out, 'rig.js'); key = '(window.SakurayoRigData[%s].actions=' % json.dumps(name)
    lines = [l for l in open(rp).read().splitlines() if not (l.startswith(key) and ('))[%s]=' % json.dumps(a.act)) in l)]
    lines.append('%s(window.SakurayoRigData[%s].actions||{}))[%s]=%s;' % (key, json.dumps(name), json.dumps(a.act), json.dumps(meta, separators=(',', ':'))))
    open(rp, 'w').write('\n'.join(lines) + '\n')
    sheet = atlas.copy(); sheet.thumbnail((1600, 1600)); bg = Image.new('RGB', sheet.size, (40, 40, 48)); bg.paste(sheet, mask=sheet.split()[3]); bg.save(f'/tmp/sy/act_{name}_{a.act}.png')
    R.log('action exported', a.act, meta['rect'], len(frames), 'frames')

BG = np.array([40, 40, 48], np.float32)
def RI_comp(f):
    a = f.astype(np.float32); al = a[..., 3:] / 255; a[..., :3] = a[..., :3] * al + BG * (1 - al); return a.astype(np.uint8)
def RI_uncomp(r):
    r = r.astype(np.float32); al = r[..., 3:] / 255
    r[..., :3] = np.where(al > 0.02, (r[..., :3] - BG * (1 - al)) / np.maximum(al, 0.02), 0); return np.clip(r, 0, 255).astype(np.uint8)

if __name__ == '__main__': main()
