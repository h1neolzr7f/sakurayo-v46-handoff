"""ART_PASS ② 割草可读性测试：角色、敌人、宝石与地面的亮度对比必须达到阈值，地面本身必须低对比、低饱和。
地面按运行时同样的处理（saturate .55 / contrast .78 / brightness .82 + 26% 夜色压暗）计算；
精灵取“轮廓光 + 主体亮部（p75）”中较亮的一个，与地面平均亮度算 WCAG 对比度。
用法：python tools/readability.py  （verify.sh 调用；不达标退出码 1）"""
import json, pathlib, re, sys
import numpy as np
from PIL import Image
ROOT = pathlib.Path(__file__).resolve().parents[1]; ART = ROOT / "android-app/app/src/main/assets/game/art"
TOK = json.loads(re.search(r"var SETS = (\{.*?\});", (ROOT / "src/runtime/sakurayo-ui-tokens.js").read_text()).group(1))["A"]
tok = lambda n: np.array([int(v) for v in TOK[n].split()], float) / 255
def lin(c): return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
def lum(rgb): l = lin(rgb); return 0.2126 * l[..., 0] + 0.7152 * l[..., 1] + 0.0722 * l[..., 2]
def ratio(a, b): a, b = max(a, b), min(a, b); return (a + 0.05) / (b + 0.05)
def ground(stage):
    a = np.asarray(Image.open(ART / f"stages/stage_{stage}/ground_v3.webp").convert("RGB"), float) / 255
    g = a.mean(-1, keepdims=True); a = g + (a - g) * 0.55                       # saturate(.55)
    a = (a - 0.5) * 0.78 + 0.5; a = np.clip(a * 0.82, 0, 1)                    # contrast(.78) brightness(.82)
    a = a * 0.74 + np.array([5, 4, 14]) / 255 * 0.26                           # 夜色压暗层
    L = lum(a); mx, mn = a.max(-1), a.min(-1); sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    return float(L.mean()), float(np.percentile(L, 90) - np.percentile(L, 10)), float(sat.mean())
def sprite(path, rim, rim_a):
    im = np.asarray(Image.open(path).convert("RGBA"), float) / 255; al = im[..., 3] > 0.5
    body = float(np.percentile(lum(im[..., :3])[al], 75)); return body, rim, rim_a
SPR = {"自机 sayo": (ART / "characters/sayo/default/anim_idle.webp", "primary-strong", .75),
       "自机 aya": (ART / "characters/aya/default/anim_idle.webp", "primary-strong", .75),
       "自机 rion": (ART / "characters/rion/default/anim_idle.webp", "primary-strong", .75),
       **{f"敌人 {p.stem}": (p, "danger", .8) for p in sorted((ART / "enemies").glob("*.webp")) if not p.stem.endswith("_b") and p.stem != "elite"},
       "敌人 elite": (ART / "enemies/elite.webp", "rare-ssr", .85)}
GEM = np.array([0x65, 0xe9, 0xff]) / 255
MIN_SPRITE, MIN_GEM, MAX_SPREAD, MAX_SAT = 3.0, 4.5, 0.06, 0.22
bad = []; rows = []
for st in range(1, 5):
    gL, spread, sat = ground(st); rows.append(f"stage_{st} 地面：平均亮度 {gL:.3f}，p10–p90 亮度跨度 {spread:.3f}（≤{MAX_SPREAD}），平均饱和度 {sat:.2f}（≤{MAX_SAT}）")
    if spread > MAX_SPREAD: bad.append(f"stage_{st} 地面对比过高 {spread:.3f}")
    if sat > MAX_SAT: bad.append(f"stage_{st} 地面饱和过高 {sat:.2f}")
    gbg = None
    worst = (9, "")
    for name, (p, rim, ra) in SPR.items():
        body, rim, ra = sprite(p, rim, ra)
        # 轮廓光按透明度叠在地面上的实际亮度
        rimL = gL * (1 - ra) + float(lum(tok(rim))) * ra
        c = max(ratio(body, gL), ratio(rimL, gL)); worst = min(worst, (c, name))
        if c < MIN_SPRITE: bad.append(f"stage_{st} {name} 对比 {c:.2f} < {MIN_SPRITE}")
    gc = ratio(float(lum(GEM)), gL); rows.append(f"  精灵最低对比 {worst[0]:.2f}（{worst[1]}），宝石对比 {gc:.2f}")
    if gc < MIN_GEM: bad.append(f"stage_{st} 宝石对比 {gc:.2f} < {MIN_GEM}")
print("\n".join(rows))
if bad: print("READABILITY FAIL\n" + "\n".join(bad)); sys.exit(1)
print(f"PASS readability: 4 张地面 × {len(SPR)} 个精灵 + 宝石，对比度均达标（精灵 ≥{MIN_SPRITE}，宝石 ≥{MIN_GEM}）")
