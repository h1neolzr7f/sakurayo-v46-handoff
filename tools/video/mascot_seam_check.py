#!/usr/bin/env python3
"""看板娘接缝 / 时长门禁（docs/MASCOT_VIDEO.md）。不达标退出码 1，供回归与打包前调用。
检查：idle 4–8 秒且首尾 PSNR ≥ 35；每个点击/动作片段 1.5–4 秒，首帧与尾帧对 idle 首帧 PSNR ≥ 35；
mp4 与 webm 成对；单段 ≤ 1.5 MB；单角色合计 ≤ 8 MB（安卓包只计 mp4）。
用法：python3 tools/video/mascot_seam_check.py [live_video 根目录]"""
import sys, os, subprocess, json, numpy as np
ROOT = sys.argv[1] if len(sys.argv) > 1 else 'android-app/app/src/main/assets/game/art/live_video'
TH = 35.0
def frame(p, last=False):
    args = ['ffmpeg', '-v', 'error'] + (['-sseof', '-0.05'] if last else []) + ['-i', p, '-frames:v', '1', '-vf', 'scale=360:540', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']
    return np.frombuffer(subprocess.run(args, capture_output=True, check=True).stdout, np.uint8).astype(np.float32)
def psnr(a, b):
    m = np.mean((a - b) ** 2); return 99.0 if m == 0 else 10 * np.log10(255 ** 2 / m)
def dur(p): return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p], capture_output=True, text=True).stdout)
bad = []
for ch in sorted(os.listdir(ROOT)):
    d = os.path.join(ROOT, ch)
    if not os.path.isdir(d) or ch.startswith('_'): continue
    mp4 = sorted(x for x in os.listdir(d) if x.endswith('.mp4'))
    if 'idle.mp4' not in mp4: bad.append(f'{ch}: 缺 idle.mp4'); continue
    i0 = frame(os.path.join(d, 'idle.mp4')); total = 0
    for x in mp4:
        p = os.path.join(d, x); n = x[:-4]; t = dur(p); sz = os.path.getsize(p); total += sz
        if not os.path.exists(p[:-4] + '.webm'): bad.append(f'{ch}/{n}: 缺 webm')
        if sz > 1.5e6: bad.append(f'{ch}/{n}: {sz/1e6:.2f}MB > 1.5MB')
        a, b = frame(p), frame(p, True)
        if n == 'idle':
            if not 4 <= t <= 8.05: bad.append(f'{ch}/idle: 时长 {t:.2f}s 不在 4–8s')
            q = psnr(a, b)
            if q < TH: bad.append(f'{ch}/idle: 循环接缝 PSNR {q:.1f} < {TH}')
        else:
            if not 1.5 <= t <= 4.05: bad.append(f'{ch}/{n}: 时长 {t:.2f}s 不在 1.5–4s')
            qa, qb = psnr(a, i0), psnr(b, i0)
            if qa < TH: bad.append(f'{ch}/{n}: 首帧对 idle PSNR {qa:.1f} < {TH}')
            if qb < TH: bad.append(f'{ch}/{n}: 尾帧对 idle PSNR {qb:.1f} < {TH}')
    if total > 8e6: bad.append(f'{ch}: mp4 合计 {total/1e6:.2f}MB > 8MB')
if bad:
    print('FAIL mascot seam check:'); print('\n'.join('  - ' + b for b in bad)); sys.exit(1)
print('PASS mascot seam check:', ROOT)
