"""修前 / 修后对比图：python tools/compare_pair.py <before.png> <after.png> <out.png> "标题" ["修前说明" "修后说明"]"""
import sys
from PIL import Image, ImageDraw, ImageFont
a, b, out, title = sys.argv[1:5]
la = sys.argv[5] if len(sys.argv) > 5 else "修前"; lb = sys.argv[6] if len(sys.argv) > 6 else "修后"
A, B = Image.open(a).convert("RGB"), Image.open(b).convert("RGB")
W = 960; A = A.resize((W, int(A.height * W / A.width))); B = B.resize((W, int(B.height * W / B.width)))
H = max(A.height, B.height); S = Image.new("RGB", (W * 2 + 30, H + 96), (12, 16, 28)); d = ImageDraw.Draw(S)
F = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"
ft, fl = ImageFont.truetype(F, 28), ImageFont.truetype(F, 20)
d.text((10, 8), title, font=ft, fill=(232, 239, 251))
d.text((10, 56), "修前 · " + la, font=fl, fill=(240, 120, 120)); d.text((W + 20, 56), "修后 · " + lb, font=fl, fill=(135, 177, 253))
S.paste(A, (10, 86)); S.paste(B, (W + 20, 86)); S.save(out); print(out)
