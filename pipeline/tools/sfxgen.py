#!/usr/bin/env python3
"""sfxgen — 程序化生成游戏音效，不依赖任何 AI 服务或外部素材。

纯 numpy 合成，输出 WAV。想压体积就用 ffmpeg 转 OGG/WebM：
    ffmpeg -i coin.wav -c:a libvorbis -q:a 3 coin.ogg

用法：
    python sfxgen.py list
    python sfxgen.py all -o sfx/                 # 一次生成全套
    python sfxgen.py coin laser explosion -o sfx/
    python sfxgen.py coin -o sfx/ --sample-rate 22050   # 更小体积

设计取舍：8-bit / 芯片音风格。理由是这类音效风格统一、辨识度高、
体积小（每个几 KB 到几十 KB），很适合塞进离线单文件网页游戏。
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

DEFAULT_SR = 44100


# ---------------------------------------------------------------- 基础波形


def _t(dur: float, sr: int) -> np.ndarray:
    return np.linspace(0.0, dur, int(sr * dur), endpoint=False)


def square(freq, dur, sr, duty=0.5):
    t = _t(dur, sr)
    ph = (t * freq) % 1.0
    return np.where(ph < duty, 1.0, -1.0)


def saw(freq, dur, sr):
    t = _t(dur, sr)
    return 2.0 * ((t * freq) % 1.0) - 1.0


def sine(freq, dur, sr):
    return np.sin(2 * np.pi * freq * _t(dur, sr))


def triangle(freq, dur, sr):
    t = _t(dur, sr)
    return 4.0 * np.abs(((t * freq) % 1.0) - 0.5) - 1.0


def sweep(f0, f1, dur, sr, wave="square", log=True):
    """频率扫描。log=True 走对数扫频（听感更自然）。"""
    t = _t(dur, sr)
    if log:
        freqs = f0 * (f1 / f0) ** (t / max(dur, 1e-6))
    else:
        freqs = np.linspace(f0, f1, len(t))
    phase = np.cumsum(freqs) / sr
    if wave == "square":
        return np.where((phase % 1.0) < 0.5, 1.0, -1.0)
    if wave == "saw":
        return 2.0 * (phase % 1.0) - 1.0
    if wave == "triangle":
        return 4.0 * np.abs((phase % 1.0) - 0.5) - 1.0
    return np.sin(2 * np.pi * phase)


def noise(dur, sr, rng):
    return rng.uniform(-1.0, 1.0, int(sr * dur))


def adsr(n: int, a=0.005, d=0.05, s=0.6, r=0.15, sr=DEFAULT_SR) -> np.ndarray:
    """标准 ADSR 包络，长度 n 个采样。"""
    a_n, d_n, r_n = int(a * sr), int(d * sr), int(r * sr)
    a_n, d_n, r_n = min(a_n, n), min(d_n, n), min(r_n, n)
    s_n = max(0, n - a_n - d_n - r_n)

    parts = []
    if a_n:
        parts.append(np.linspace(0.0, 1.0, a_n))
    if d_n:
        parts.append(np.linspace(1.0, s, d_n))
    if s_n:
        parts.append(np.full(s_n, s))
    if r_n:
        parts.append(np.linspace(s, 0.0, r_n))

    env = np.concatenate(parts) if parts else np.ones(n)
    if len(env) < n:
        env = np.pad(env, (0, n - len(env)))
    return env[:n]


def fade_out(x: np.ndarray, ms=8, sr=DEFAULT_SR) -> np.ndarray:
    """防止结尾爆音。"""
    n = min(len(x), int(sr * ms / 1000))
    if n <= 1:
        return x
    x = x.copy()
    x[-n:] *= np.linspace(1.0, 0.0, n)
    return x


def norm(x: np.ndarray, peak=0.85) -> np.ndarray:
    m = float(np.max(np.abs(x))) or 1.0
    return x / m * peak


def mix(*tracks: tuple[np.ndarray, float]) -> np.ndarray:
    """把 (波形, 增益) 叠加，长度取最长。"""
    length = max(len(t) for t, _ in tracks)
    out = np.zeros(length)
    for track, gain in tracks:
        out[: len(track)] += track * gain
    return out


# ---------------------------------------------------------------- 音效配方


def sfx_coin(sr):
    a = square(988, 0.06, sr, duty=0.25) * adsr(int(sr * 0.06), 0.002, 0.02, 0.5, 0.02, sr)
    b = square(1319, 0.22, sr, duty=0.25) * adsr(int(sr * 0.22), 0.002, 0.03, 0.45, 0.15, sr)
    return mix((a, 1.0), (np.pad(b, (int(sr * 0.055), 0)), 0.9))


def sfx_laser(sr):
    x = sweep(1800, 220, 0.18, sr, "saw") * adsr(int(sr * 0.18), 0.001, 0.02, 0.6, 0.09, sr)
    return x


def sfx_explosion(sr, rng=None):
    rng = rng or np.random.default_rng(7)
    dur = 0.7
    n = int(sr * dur)
    body = noise(dur, sr, rng) * adsr(n, 0.001, 0.06, 0.35, 0.55, sr)
    # 低频"轰"的部分
    sub = sine(60, dur, sr) * adsr(n, 0.002, 0.08, 0.3, 0.5, sr)
    # 噪声做一点低通，去掉刺耳的高频
    kernel = np.ones(9) / 9
    body = np.convolve(body, kernel, mode="same")
    return mix((body, 1.0), (sub, 0.55))


def sfx_hit(sr, rng=None):
    rng = rng or np.random.default_rng(11)
    dur = 0.12
    n = int(sr * dur)
    click = noise(dur, sr, rng) * adsr(n, 0.0005, 0.02, 0.2, 0.09, sr)
    thud = sine(110, dur, sr) * adsr(n, 0.001, 0.03, 0.25, 0.08, sr)
    return mix((click, 0.8), (thud, 0.7))


def sfx_jump(sr):
    return sweep(320, 880, 0.16, sr, "square") * adsr(int(sr * 0.16), 0.004, 0.03, 0.55, 0.1, sr)


def sfx_powerup(sr):
    notes = [523, 659, 784, 1047]
    step = 0.075
    parts = []
    for i, f in enumerate(notes):
        w = square(f, step, sr, duty=0.35) * adsr(int(sr * step), 0.003, 0.02, 0.7, 0.04, sr)
        parts.append(np.pad(w, (int(sr * step * i), 0)))
    length = max(len(p) for p in parts)
    out = np.zeros(length)
    for p in parts:
        out[: len(p)] += p * 0.8
    return out


def sfx_beep(sr):
    return square(880, 0.09, sr, duty=0.5) * adsr(int(sr * 0.09), 0.002, 0.02, 0.6, 0.04, sr)


def sfx_select(sr):
    return square(660, 0.05, sr, duty=0.25) * adsr(int(sr * 0.05), 0.001, 0.015, 0.5, 0.02, sr)


def sfx_hurt(sr):
    x = sweep(500, 120, 0.25, sr, "square") * adsr(int(sr * 0.25), 0.002, 0.04, 0.4, 0.15, sr)
    return x


def sfx_footstep(sr, rng=None):
    rng = rng or np.random.default_rng(23)
    dur = 0.07
    n = int(sr * dur)
    return noise(dur, sr, rng) * adsr(n, 0.001, 0.015, 0.12, 0.045, sr)


def sfx_boss_roar(sr, rng=None):
    rng = rng or np.random.default_rng(31)
    dur = 1.1
    n = int(sr * dur)
    # 低频锯齿 + 缓慢下滑，加噪声层做"砂砾感"
    base = sweep(180, 70, dur, sr, "saw") * adsr(n, 0.05, 0.15, 0.7, 0.5, sr)
    grit = noise(dur, sr, rng) * adsr(n, 0.08, 0.2, 0.45, 0.6, sr)
    kernel = np.ones(5) / 5
    grit = np.convolve(grit, kernel, mode="same")
    return mix((base, 1.0), (grit, 0.45))


def sfx_levelup(sr):
    notes = [659, 784, 988, 1319, 1568]
    step = 0.07
    parts = []
    for i, f in enumerate(notes):
        w = triangle(f, step, sr) * adsr(int(sr * step), 0.003, 0.02, 0.7, 0.04, sr)
        parts.append(np.pad(w, (int(sr * step * i), 0)))
    length = max(len(p) for p in parts)
    out = np.zeros(length)
    for p in parts:
        out[: len(p)] += p * 0.7
    return out


RECIPES = {
    "coin": sfx_coin,
    "laser": sfx_laser,
    "explosion": sfx_explosion,
    "hit": sfx_hit,
    "jump": sfx_jump,
    "powerup": sfx_powerup,
    "levelup": sfx_levelup,
    "beep": sfx_beep,
    "select": sfx_select,
    "hurt": sfx_hurt,
    "footstep": sfx_footstep,
    "boss_roar": sfx_boss_roar,
}


# ---------------------------------------------------------------- CLI


def main() -> int:
    ap = argparse.ArgumentParser(description="程序化生成游戏音效", formatter_class=argparse.RawDescriptionHelpFormatter, epilog=__doc__)
    ap.add_argument("names", nargs="*", help="音效名，或 all，或 list")
    ap.add_argument("-o", "--out", default="sfx")
    ap.add_argument("--sample-rate", type=int, default=DEFAULT_SR)
    ap.add_argument("--peak", type=float, default=0.85)
    args = ap.parse_args()

    if not args.names or args.names[0] == "list":
        print("可用音效：")
        for name in sorted(RECIPES):
            print("  " + name)
        return 0

    names = sorted(RECIPES) if args.names[0] == "all" else args.names
    unknown = [n for n in names if n not in RECIPES]
    if unknown:
        sys.exit(f"未知音效: {', '.join(unknown)}（用 list 看全部）")

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    total = 0
    for name in names:
        wave = RECIPES[name](args.sample_rate)
        wave = fade_out(norm(wave, args.peak), 8, args.sample_rate)
        path = out / f"{name}.wav"
        sf.write(path, wave.astype(np.float32), args.sample_rate, subtype="PCM_16")
        kb = path.stat().st_size / 1024
        total += kb
        print(f"  {name:12} {len(wave)/args.sample_rate:.2f}s  {kb:6.1f} KB")

    print(f"\n共 {len(names)} 个 -> {out}  合计 {total:.0f} KB")
    print("压体积：ffmpeg -i in.wav -c:a libvorbis -q:a 3 out.ogg")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
