#!/usr/bin/env python3
"""全身绑定（rig v2）：拆层 + 骨骼 + 蒙皮。一条命令：
  python tools/anim-pipeline/body.py --name sayo --base <lobby_idle.webp> [--gen]
阶段：gen（gpt-image-2：表情差分、头发/裙摆/饰品语义 mask、去手臂并补全躯干的 body 层）
    → pose（rtmlib RTMPose，Apache-2.0，CPU，人体 17 关键点）→ split（base 与 body 层做差 → 手臂层，按骨段距离分左右）
    → bones（骨盆/腰/胸/颈/头 + 双臂上臂/前臂；腿以脚踝为根随骨盆剪切）→ skin（平滑带状权重 + 关节处 smoothstep 过渡）
    → export（rig.js v2 + body.webp + arms.webp + atlas.webp）
"""
import argparse, base64, json, os, sys
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
import run as R

KP = 'nose leye reye lear rear lsho rsho lelb relb lwri rwri lhip rhip lknee rknee lank rank'.split()
BODY_PROMPTS = {
    'noarms': R.EDIT.replace('Only change the face: ', '') + 'Erase the arms, sleeves and hands entirely and inpaint the hidden torso, coat and skirt behind them, as a clean base layer for 2D rigging. Keep any weapon in place. White background.',
}
ACC = ('Edit this exact image. Keep pose, framing, size, position and everything else pixel-identical. Recolor all small dangling accessories '
       '(hair ornaments, tassels, ribbons, cords, charms hanging from the weapon or clothes) to flat pure yellow #FFFF00. Do not recolor anything else.', (255, 255, 0))

def b64(a): return base64.b64encode((np.clip(a, 0, 1) * 255).astype(np.uint8).tobytes()).decode()

def gen_body(name, base_png, work):
    sys.path.insert(0, R.GEN); import gen
    from concurrent.futures import ThreadPoolExecutor
    jobs = []
    for v in 'ab':
        o = os.path.join(work, f'{name}_noarms_{v}.png')
        if not os.path.exists(o): jobs.append((BODY_PROMPTS['noarms'], o))
    o = os.path.join(work, f'{name}_accmask.png')
    if not os.path.exists(o): jobs.append((ACC[0], o))
    with ThreadPoolExecutor(4) as ex: list(ex.map(lambda j: gen.gen(j[0], '1024x1536', j[1], [base_png]), jobs))

def pose(rgb):
    from rtmlib import Body
    k, s = Body(mode='balanced', backend='onnxruntime', device='cpu')(rgb[..., ::-1].copy())
    i = int(np.argmax(s.mean(1))); return {n: [float(k[i][j][0]), float(k[i][j][1]), float(s[i][j])] for j, n in enumerate(KP)}

def align_full(base_rgb, other_rgb):
    import cv2
    b = cv2.cvtColor(base_rgb, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255; d = cv2.cvtColor(other_rgb, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    warp = np.eye(2, 3, dtype=np.float32)
    try: _, warp = cv2.findTransformECC(b, d, warp, cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 150, 1e-5), None, 5)
    except cv2.error: pass
    return cv2.warpAffine(other_rgb, warp, (b.shape[1], b.shape[0]), flags=cv2.INTER_LINEAR + cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)

def seg_dist(xs, ys, a, b):
    ax, ay = a; bx, by = b; vx, vy = bx - ax, by - ay; L = vx * vx + vy * vy + 1e-6
    t = np.clip(((xs - ax) * vx + (ys - ay) * vy) / L, 0, 1); return np.hypot(xs - (ax + t * vx), ys - (ay + t * vy)), t

def smooth(e0, e1, x): t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)

def main():
    import cv2
    ap = argparse.ArgumentParser(); ap.add_argument('--name', required=True); ap.add_argument('--base', required=True); ap.add_argument('--gen', action='store_true'); ap.add_argument('--pin', choices=['l', 'r'], help='整理发夹用哪只手（默认按头饰位置自动判断）')
    ap.add_argument('--diffs', default='closed,talk,happy,shy'); a = ap.parse_args()
    work = os.path.join(R.GEN, 'live'); name = a.name
    base = R.stage_cutout(R.load_rgba(a.base)); W, H = base.size
    base_png = os.path.join(work, f'{name}_base.png')
    if not os.path.exists(base_png):
        bg = Image.new('RGBA', base.size, (255, 255, 255, 255)); bg.alpha_composite(base); bg.convert('RGB').save(base_png)
    if a.gen: R.stage_gen(name, base_png, a.diffs.split(','), work); gen_body(name, base_png, work)
    brgb = np.asarray(Image.open(base_png).convert('RGB')); alpha = np.asarray(base)[..., 3].astype(np.float32) / 255
    # —— 表情补丁 / 脸部关键点（沿用 v1 阶段）——
    face = R.face_box(brgb); patches = {}
    for d in a.diffs.split(','):
        best = None
        for v in 'ab':
            p = os.path.join(work, f'{name}_{d}_{v}.png')
            if not os.path.exists(p): continue
            r, resid = R.align_patch(brgb, np.asarray(Image.open(p).convert('RGB').resize(base.size)), alpha * 255, face)
            if r and (best is None or resid < best[1]): best = (r, resid)
        if best: al, soft, keep = best[0]; patches[d] = dict(img=al, soft=soft, keep=keep)
    lm = R.landmarks(patches, W, H, face=face)
    kp = pose(brgb); R.log('pose', {k: [int(v[0]), int(v[1])] for k, v in kp.items() if k[1:4] in ('sho', 'elb', 'wri', 'hip')})
    # —— 拆层：body（去手臂补全）与手臂层 ——
    cands = []
    for v in 'abc':
        p = os.path.join(work, f'{name}_noarms_{v}.png')
        if os.path.exists(p): cands.append(align_full(brgb, np.asarray(Image.open(p).convert('RGB').resize(base.size))))
    if not cands: raise SystemExit('no noarms layer; run with --gen')
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    S = {s: np.array(kp[s + 'sho'][:2]) for s in 'lr'}; E = {s: np.array(kp[s + 'elb'][:2]) for s in 'lr'}; Wr = {s: np.array(kp[s + 'wri'][:2]) for s in 'lr'}
    armd = {}
    for s in 'lr':
        d1, _ = seg_dist(xs, ys, S[s], E[s]); d2, _ = seg_dist(xs, ys, E[s], Wr[s]); armd[s] = np.minimum(d1, d2)
    def arm_mask(bodyrgb):
        diff = cv2.GaussianBlur(np.abs(brgb.astype(np.float32) - bodyrgb.astype(np.float32)).mean(2) / 255, (0, 0), 2)
        m = ((diff > 0.07) & (alpha > 0.5)).astype(np.uint8)
        m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8)); m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((31, 31), np.uint8))
        ff = m.copy() * 255; hh, ww = ff.shape; fl = np.zeros((hh + 2, ww + 2), np.uint8); cv2.floodFill(ff, fl, (0, 0), 128)
        m = ((ff != 128) | (m > 0)).astype(np.uint8) * (alpha > 0.3)  # 填洞：被包围的空洞并入手臂层
        near = np.minimum(armd['l'], armd['r']) < max(W, H) * 0.16; m = m * near  # 只保留骨段附近（去掉 AI 改动的无关区域）
        n, lab, st, _ = cv2.connectedComponentsWithStats(m.astype(np.uint8)); keep = np.zeros_like(m)
        for i in range(1, n):
            if st[i, cv2.CC_STAT_AREA] > 1500: keep[lab == i] = 1
        return keep
    wm = R.color_mask(os.path.join(work, f'{name}_weaponmask.png'), base.size, (0, 0, 255), alpha)
    wmask = cv2.dilate(wm.astype(np.uint8), np.ones((5, 5), np.uint8)) if wm is not None else None
    scores = []; union = None
    for c in cands:
        m0 = arm_mask(c); union = m0 if union is None else np.maximum(union, m0)
    for c in cands:
        m = arm_mask(c); bone = np.minimum(armd['l'], armd['r']) < 22
        cover = float(m[bone & (alpha > 0.5)].mean())  # 骨段上被移除的比例越高，说明手臂擦得越干净
        out = np.abs(brgb.astype(np.float32) - c.astype(np.float32)).mean(2)[m == 0].mean() / 255
        clean = float(np.abs(brgb.astype(np.float32) - c.astype(np.float32)).mean(2)[union > 0].mean()) / 255  # 手臂区域被重绘得越彻底越好
        scores.append((cover + clean * 8 - out * 4, m, c)); R.log('noarms cand cover %.2f clean %.3f out %.3f' % (cover, clean, out))
    _, amask, body_rgb = max(scores, key=lambda q: q[0])
    # 手臂胶囊：上臂/前臂骨段附近的像素一律归手臂层（AI 补全常保留上臂，若不并入，抬手时手臂会断开）
    cap = np.zeros_like(amask)
    for sd in 'lr':
        L1 = float(np.hypot(*(E[sd] - S[sd]))); d1, t1 = seg_dist(xs, ys, S[sd] + (E[sd] - S[sd]) * 0.18, E[sd]); d2, _ = seg_dist(xs, ys, E[sd], Wr[sd])
        cap |= ((d1 < L1 * 0.2) | (d2 < L1 * 0.2)).astype(cap.dtype)
    amask = np.maximum(amask, cap * (alpha > 0.5) * (1 - (R.face_box and 0)))
    if wmask is not None:  # 武器留在 body 层，不随手臂移动（握把下的手仍在手臂层）
        hands = np.minimum(np.hypot(xs - Wr['l'][0], ys - Wr['l'][1]), np.hypot(xs - Wr['r'][0], ys - Wr["r"][1])) < max(W, H) * 0.022
        amask = amask * (1 - wmask)
    soft = cv2.GaussianBlur(amask.astype(np.float32), (0, 0), 1.5) * alpha
    side = np.where(armd['l'] < armd['r'], 1, 0)  # 1 = l
    # body 层 alpha：原 alpha ∪ 补全区域（白底外的像素）
    from rembg import remove, new_session
    nb = np.asarray(remove(Image.fromarray(body_rgb), session=new_session('isnet-anime')))[..., 3] > 128  # 补全区域的轮廓也重新抠
    body_a = (nb & (cv2.dilate((alpha > 0.1).astype(np.uint8), np.ones((9, 9), np.uint8)) > 0)).astype(np.float32)
    body_a = cv2.GaussianBlur(body_a.astype(np.float32), (0, 0), 0.8)
    out = os.path.join(R.ART, 'live', name); os.makedirs(out, exist_ok=True)
    Image.fromarray(np.dstack([body_rgb, (body_a * 255).astype(np.uint8)]), 'RGBA').save(os.path.join(out, 'body.webp'), quality=90, method=5)
    # 手臂图集：左右分别裁切
    arms, ax = {}, 0; tiles = []
    for s in 'lr':
        m = soft * (side == (1 if s == 'l' else 0))
        yy, xx = np.nonzero(m > 0.02)
        if len(xx) < 500: continue
        x0, x1, y0, y1 = int(xx.min()), int(xx.max()) + 1, int(yy.min()), int(yy.max()) + 1
        tiles.append((ax, Image.fromarray(np.dstack([brgb[y0:y1, x0:x1], (m[y0:y1, x0:x1] * 255).astype(np.uint8)]), 'RGBA')))
        arms[s] = dict(ax=ax, ay=0, w=x1 - x0, h=y1 - y0, x=x0, y=y0, S=S[s].tolist(), E=E[s].tolist(), Wr=Wr[s].tolist()); ax += x1 - x0 + 4
    at = Image.new('RGBA', (ax, max(t.height for _, t in tiles)), (0, 0, 0, 0))
    for ox, t in tiles: at.paste(t, (ox, 0))
    at.save(os.path.join(out, 'arms.webp'), quality=90, method=5)
    # —— 区域场（头/发/裙/饰品/深度）——
    depth = R.depth_map(base)
    masks = {k: R.color_mask(os.path.join(work, f'{name}_{k}.png'), base.size, c, alpha) for k, (_, c) in R.MASK_PROMPTS.items()}
    masks['accmask'] = R.color_mask(os.path.join(work, f'{name}_accmask.png'), base.size, ACC[1], alpha)
    F, extra = R.regions(base, lm, depth, masks)
    acc = cv2.GaussianBlur(masks['accmask'], (0, 0), 5) if masks['accmask'] is not None else np.zeros_like(alpha)
    # —— 骨骼 ——
    hip = (np.array(kp['lhip'][:2]) + np.array(kp['rhip'][:2])) / 2; sho = (S['l'] + S['r']) / 2
    neck = np.array([lm['head'][0], face[1] + face[3] * 1.0]); chest = sho + (hip - sho) * 0.22; waist = sho + (hip - sho) * 0.62
    ank = max(kp['lank'][1], kp['rank'][1], kp['lknee'][1], kp['rknee'][1]); feet = float(extra['feet'])
    bones = dict(pelvis=hip.tolist(), waist=waist.tolist(), chest=chest.tolist(), neck=neck.tolist(), head=[float(neck[0]), float(neck[1])], feet=feet)
    # 脊柱带状权重（沿 y 的帽函数，单位分解）；头部再用头部场加强
    Y = [neck[1] - 1e4, neck[1], chest[1], waist[1], hip[1]]  # head, neck, chest, waist, pelvis 中心
    def hat(y, i):
        c = Y[i]; lo = Y[i - 1] if i > 0 else c - 1e4; hi = Y[i + 1] if i < len(Y) - 1 else c + 1e4
        return np.where(y < c, smooth(lo, c, y), 1 - smooth(c, hi, y))
    spine = {k: hat(ys, i) for i, k in enumerate(['head', 'neck', 'chest', 'waist', 'pelvis'])}
    spine['head'] = np.maximum(spine['head'] * (ys < neck[1]), F['head'] ** 1.5)
    tot = sum(spine.values()) + 1e-6
    for k in spine: spine[k] = spine[k] / tot
    leg = np.clip((feet - ys) / max(1.0, feet - hip[1]), 0, 1) * (ys > hip[1])  # 0 at feet → 1 at hips
    leg = leg * leg * (3 - 2 * leg)
    # 网格采样
    def grid_from(bbox, gx, gy, fields):
        x0, y0, x1, y1 = bbox; vx = np.linspace(x0, x1 - 1, gx).astype(int); vy = np.linspace(y0, y1 - 1, gy).astype(int)
        return {k: b64(f[vy][:, vx]) for k, f in fields.items()}
    yy, xx = np.nonzero(body_a > 0.03); bb = [int(xx.min()), int(yy.min()), int(xx.max()) + 1, int(yy.max()) + 1]
    fields = dict(spine.items()); fields.update(leg=leg, hair=F['hair'], skirt=F['skirt'], chestw=F['chest'], acc=acc, depth=F['depth'], eyes=F['eyes'], headf=F['head'])
    G = (40, 60)
    body_w = grid_from(bb, G[0], G[1], fields)
    # 手臂权重：前臂 smoothstep（肘部过渡 ~ 上臂长 25%）
    for s, A in arms.items():
        Sx, Ex, Wx = np.array(A['S']), np.array(A['E']), np.array(A['Wr'])
        ux = Ex - Sx; L = np.hypot(*ux) + 1e-6
        u = ((xs - Sx[0]) * ux[0] + (ys - Sx[1]) * ux[1]) / (L * L)
        fore = smooth(0.82, 1.12, u); shoulder = 1 - smooth(-0.05, 0.25, u)  # 肩头附近跟随胸
        A['grid'] = [24, 34]; A['weights'] = grid_from([A['x'], A['y'], A['x'] + A['w'], A['y'] + A['h']], 24, 34, dict(fore=fore, root=shoulder, hair=F['hair'], acc=acc))
    # 表情补丁图集
    rects, tiles, x = {}, [], 0
    for k, p in patches.items():
        al, sf = p['img'], p['soft']; yy2, xx2 = np.nonzero(sf > 0.02)
        px0, px1, py0, py1 = int(xx2.min()), int(xx2.max()) + 1, int(yy2.min()), int(yy2.max()) + 1
        tiles.append((x, Image.fromarray(np.dstack([al[py0:py1, px0:px1], (sf[py0:py1, px0:px1] * 255).astype(np.uint8)]), 'RGBA')))
        rects[k] = dict(ax=x, ay=0, w=px1 - px0, h=py1 - py0, x=px0, y=py0); x += px1 - px0 + 4
    if tiles:
        atl = Image.new('RGBA', (x, max(t.height for _, t in tiles)), (0, 0, 0, 0))
        for ox, t in tiles: atl.paste(t, (ox, 0))
        atl.save(os.path.join(out, 'atlas.webp'), quality=92, method=5)
    # 表情补丁取样用的完整场（头部权重）
    pin = 'l'
    if masks['accmask'] is not None:
        hm = masks['accmask'] * (F['head'] > 0.3); yy3, xx3 = np.nonzero(hm)
        if len(xx3) > 50: pin = 'l' if xx3.mean() > lm['head'][0] else 'r'
    hp = [float(xx3.mean()), float(yy3.mean())] if masks['accmask'] is not None and len(xx3) > 50 else [lm['head'][0] + face[2] * 0.4, face[1]]
    if a.pin: pin = a.pin
    bones['pinSide'] = pin; bones['pin'] = hp; bones['hip'] = float(hip[1])
    rig = dict(v=2, name=name, w=W, h=H, bbox=bb, grid=list(G), landmarks=lm, pose={k: v for k, v in kp.items()}, bones=bones, arms=arms, patches=rects, weights=body_w, extra=extra)
    with open(os.path.join(out, 'rig.js'), 'w') as f:
        f.write('(window.SakurayoRigData=window.SakurayoRigData||{})[%s]=%s;\n' % (json.dumps(name), json.dumps(rig, separators=(',', ':'))))
    dbg = np.dstack([(spine['head'] + spine['chest'] * 0.5) * 255, (leg * 255), (soft * 255)]).astype(np.uint8)
    Image.fromarray(dbg).save(os.path.join(work, f'{name}_skin.png')); R.log('rig v2 exported', out, 'arms', list(arms))

if __name__ == '__main__': main()
