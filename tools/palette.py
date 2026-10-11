"""色板生成器：在 OKLCH 空间定义主色、强调色和中性色阶，输出 CSS 设计令牌，并校验 WCAG 对比度。
用法：python3 tools/palette.py [A|B|C] > out.css；不带参数时打印三套候选的对比度报告。"""
import math, sys

def oklch_to_srgb(L, C, h):
    a, b = C * math.cos(math.radians(h)), C * math.sin(math.radians(h))
    l_ = L + 0.3963377774 * a + 0.2158037573 * b; m_ = L - 0.1055613458 * a - 0.0638541728 * b; s_ = L - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_ ** 3, m_ ** 3, s_ ** 3
    r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s; g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s; bb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    f = lambda x: 12.92 * x if x <= 0.0031308 else 1.055 * x ** (1 / 2.4) - 0.055
    return tuple(max(0, min(255, round(f(max(0, min(1, x))) * 255))) for x in (r, g, bb))

def hexc(t): return "#%02x%02x%02x" % t
def lum(t):
    f = lambda c: (c / 255) / 12.92 if c / 255 <= 0.04045 else ((c / 255 + 0.055) / 1.055) ** 2.4
    r, g, b = map(f, t); return 0.2126 * r + 0.7152 * g + 0.0722 * b
def contrast(a, b): la, lb = sorted((lum(a), lum(b)), reverse=True); return (la + 0.05) / (lb + 0.05)

# 三套候选。中性色阶的色相跟随立绘主色（靛蓝 225–265°），低彩度
CANDIDATES = {
    "A": dict(name="月夜靛蓝（主色取自立绘的靛蓝，强调色取樱粉）", nh=262, nc=0.035, primary=(0.76, 0.12, 262), accent=(0.80, 0.11, 352)),
    "B": dict(name="崩三青（主色青蓝，强调樱粉）", nh=245, nc=0.03, primary=(0.82, 0.12, 215), accent=(0.78, 0.13, 352)),
    "C": dict(name="雾紫（主色淡紫，强调暖金）", nh=285, nc=0.035, primary=(0.78, 0.11, 295), accent=(0.84, 0.12, 80)),
}
NEUTRAL_L = [0.16, 0.21, 0.27, 0.36, 0.60, 0.80, 0.95]  # n0 背景 … n6 正文高亮，7 级

def build(k):
    c = CANDIDATES[k]; T = {}
    for i, L in enumerate(NEUTRAL_L): T["n%d" % i] = oklch_to_srgb(L, c["nc"] * (1 if i < 5 else 0.5), c["nh"])
    T["primary"] = oklch_to_srgb(*c["primary"]); T["primary-strong"] = oklch_to_srgb(c["primary"][0] + 0.08, c["primary"][1] * 0.8, c["primary"][2])
    T["on-primary"] = oklch_to_srgb(0.18, 0.04, c["primary"][2])
    T["accent"] = oklch_to_srgb(*c["accent"]); T["on-accent"] = oklch_to_srgb(0.2, 0.04, c["accent"][2])
    # 稀有度色、功能色：与主题无关，固定
    T["rare-n"] = oklch_to_srgb(0.72, 0.02, 260); T["rare-r"] = oklch_to_srgb(0.72, 0.11, 240); T["rare-sr"] = oklch_to_srgb(0.70, 0.15, 305); T["rare-ssr"] = oklch_to_srgb(0.84, 0.14, 85)
    T["ok"] = oklch_to_srgb(0.76, 0.14, 155); T["warn"] = oklch_to_srgb(0.82, 0.14, 75); T["danger"] = oklch_to_srgb(0.66, 0.19, 25)
    return T

def css(k):
    T = build(k); out = ["/* tokens:start — 由 tools/palette.py %s 生成：%s */" % (k, CANDIDATES[k]["name"]), ":root{"]
    for n, v in T.items(): out.append("--c-%s:%s;--c-%s-rgb:%d %d %d;" % (n, hexc(v), n, *v))
    out.append("}"); out.append("/* tokens:end */"); return "\n".join(out)

def report(k):
    T = build(k); bg = T["n0"]; rows = []
    for fg, on in [("n6", "n0"), ("n5", "n0"), ("n5", "n1"), ("n4", "n0"), ("primary", "n0"), ("accent", "n0"), ("on-primary", "primary"), ("on-accent", "accent"), ("n6", "n2")]:
        rows.append("%-10s on %-8s %.2f %s" % (fg, on, contrast(T[fg], T[on]), "AA" if contrast(T[fg], T[on]) >= 4.5 else ("AA-large" if contrast(T[fg], T[on]) >= 3 else "FAIL")))
    return rows

if __name__ == "__main__":
    if len(sys.argv) > 1: print(css(sys.argv[1]))
    else:
        for k in CANDIDATES:
            print("==", k, CANDIDATES[k]["name"]); print("  ", " ".join(hexc(v) for v in build(k).values())); [print("  ", r) for r in report(k)]
