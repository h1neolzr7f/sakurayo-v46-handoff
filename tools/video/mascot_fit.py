#!/usr/bin/env python3
"""看板娘视频按 docs/MASCOT_VIDEO.md 规格整形（Grok 6 秒片段 → idle 无缝 / 点击 2.5–4 秒）。
- idle：去掉尾部 6 帧，用 RIFE 从倒数第 7 帧补 9 帧过渡回首帧 → 循环无跳变
- 点击/动作：在 [2.2s, 3.5s] 里找最接近 idle 首帧的一帧截断；
  开头若与 idle 首帧差异大，用 RIFE 补一段 idle0→片段首帧的过渡；结尾补 idle 首帧回落过渡。
用法：/workspace/sakurayo-tools/venv/bin/python tools/video/mascot_fit.py <live_video/角色目录> [clip ...]
"""
import sys, os, subprocess, tempfile, json, numpy as np
sys.path.insert(0, '/workspace/sakurayo-tools')
import rife_interp as R
W, H, FPS = 720, 1080, 30
def frames(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-vf', f'scale={W}:{H},fps={FPS}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)
def psnr(a, b):
    m = np.mean((a.astype(np.float32) - b.astype(np.float32)) ** 2); return 99.0 if m == 0 else 10 * np.log10(255 ** 2 / m)
import torch
PH, PW = (H + 63) // 64 * 64, (W + 63) // 64 * 64
@torch.inference_mode()
def rife(a, b, t):
    """RIFE v4.25 单帧插值（RGB，按 64 对齐补边后再裁回）"""
    def T(x):
        x = np.pad(x, ((0, PH - H), (0, PW - W), (0, 0)), mode='edge')
        return torch.from_numpy(np.ascontiguousarray(x)).permute(2, 0, 1)[None].float() / 255
    x0, x1 = T(a), T(b)
    div = torch.tensor([(PW - 1) / 2, (PH - 1) / 2])
    gx = torch.linspace(-1, 1, PW).view(1, 1, 1, PW).expand(-1, -1, PH, -1); gy = torch.linspace(-1, 1, PH).view(1, 1, PH, 1).expand(-1, -1, -1, PW)
    o = R.net(x0, x1, torch.full([1, 1, PH, PW], float(t)), div, torch.cat([gx, gy], 1), R.enc(x0), R.enc(x1))
    return (o[0].permute(1, 2, 0).clamp(0, 1).numpy() * 255).astype(np.uint8)[:H, :W]
def bridge(a, b, n):
    """n 个中间帧（不含两端）"""
    return [rife(a, b, i / (n + 1)) for i in range(1, n + 1)]
def encode(fr, stem):
    tmp = tempfile.mkdtemp()
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-an', '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-crf', '23', '-preset', 'slow', '-movflags', '+faststart', stem + '.mp4'], stdin=subprocess.PIPE)
    for f in fr: p.stdin.write(np.ascontiguousarray(f).tobytes())
    p.stdin.close(); p.wait()
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', stem + '.mp4', '-an', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '37', '-row-mt', '1', stem + '.webm'], check=True)
def fit_idle(d, idle):
    f = frames(os.path.join(d, 'idle.mp4')) if idle is None else idle
    body = list(f[:-6]); out = body + bridge(body[-1], body[0], 9)
    encode(out, os.path.join(d, 'idle')); return f[0], len(out) / FPS
def fit_tap(d, name, idle0, target=3.7):
    """Grok 片段本身是「离开 idle → 动作 → 回到 idle」的 6 秒闭环。
    不截断动作（截断会落在半空，回落只能硬变形），而是：
    1) 去掉首尾仍停在 idle 姿势的静止帧（各留 2 帧）；
    2) 剩余部分若超过 target 秒，按帧重采样整体提速（≤1.6 倍）；
    3) 首尾用 RIFE 各补几帧，严丝合缝接回 idle 首帧。"""
    f = frames(os.path.join(d, name + '.mp4'))
    sim = [psnr(x, idle0) for x in f]
    s0 = 0
    while s0 < len(f) // 3 and sim[s0 + 1] > 36: s0 += 1
    e0 = len(f) - 1
    while e0 > len(f) * 2 // 3 and sim[e0 - 1] > 36: e0 -= 1
    s0 = max(0, s0 - 2); e0 = min(len(f) - 1, e0 + 2)
    core = f[s0:e0 + 1]
    n_target = int(target * FPS) - 14
    speed = max(1.0, min(1.8, len(core) / n_target))
    idx = np.round(np.arange(0, len(core) - 1e-6, speed)).astype(int).clip(0, len(core) - 1)
    core = [core[i] for i in idx]
    p0, pe = psnr(core[0], idle0), psnr(core[-1], idle0)
    if min(p0, pe) < 25 and '--force' not in sys.argv:
        raise SystemExit(f'{d}/{name}: 片段首/尾与 idle 首帧差太远（{p0:.1f}/{pe:.1f} dB，换了机位或模型），RIFE 只会硬变形——请重新生成该片段')
    head = [idle0] + bridge(idle0, core[0], 3 if p0 > 30 else 6) if p0 < 40 else []
    tail = bridge(core[-1], idle0, 4 if pe > 30 else 8) + [idle0]
    out = head + core + tail
    encode(out, os.path.join(d, name)); return len(out) / FPS, p0, pe

if __name__ == '__main__':
    d = sys.argv[1]; names = sys.argv[2:]
    clips = names or sorted({os.path.splitext(x)[0] for x in os.listdir(d) if x.endswith('.mp4') and x != 'idle.mp4'})
    rep = {}
    if not names or 'idle' in names:
        idle0, dur = fit_idle(d, None); rep['idle'] = round(dur, 2); clips = [c for c in clips if c != 'idle']
    idle0 = frames(os.path.join(d, 'idle.mp4'))[0]
    for c in clips:
        dur, p0, pe = fit_tap(d, c, idle0); rep[c] = {'dur': round(dur, 2), 'start_psnr': round(float(p0), 1), 'end_psnr': round(float(pe), 1)}
        print(d, c, rep[c], flush=True)
    print(json.dumps(rep, ensure_ascii=False))
