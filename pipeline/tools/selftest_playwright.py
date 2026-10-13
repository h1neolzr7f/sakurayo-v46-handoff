"""验证 Playwright 能否真驱动浏览器 —— 游戏自动化测试的前置条件。

跑完会：启动 chromium -> 打开本地 HTML -> 读 DOM -> 截图 -> 关掉。
不联网（用 data URL / 本地文件）。
"""

import sys
from pathlib import Path

OUT = Path(__file__).resolve().parent / "_selftest_pw"
OUT.mkdir(exist_ok=True)

HTML = """<!doctype html><html><head><meta charset="utf-8"><title>probe</title></head>
<body><canvas id="c" width="320" height="180"></canvas>
<script>
const ctx = document.getElementById('c').getContext('2d');
ctx.fillStyle = '#123456'; ctx.fillRect(0,0,320,180);
ctx.fillStyle = '#ffcc00'; ctx.fillRect(20,20,60,60);
let frames = 0;
// 暴露一个"只读观测桥"——真实游戏里用它给测试读状态
window.__PROBE__ = Object.freeze({
  frames: () => frames,
  snapshot: () => ({ frames, w: 320, h: 180 }),
});
(function loop(){ frames++; requestAnimationFrame(loop); })();
</script></body></html>
"""

probe = OUT / "probe.html"
probe.write_text(HTML, encoding="utf-8")

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    sys.exit("playwright 未安装：python -m pip install playwright")

with sync_playwright() as p:
    print("chromium 路径:", p.chromium.executable_path)
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1280, "height": 720})
    page.goto(probe.as_uri())

    # 1) 能读 DOM
    title = page.title()
    print("  标题:", title)

    # 2) 能执行 JS 读游戏内部状态
    snap1 = page.evaluate("window.__PROBE__.snapshot()")
    print("  快照1:", snap1)

    # 3) 时间推进：等 rAF 真的跑起来
    page.wait_for_function("window.__PROBE__.frames() > 10", timeout=5000)
    snap2 = page.evaluate("window.__PROBE__.snapshot()")
    print("  快照2:", snap2)
    assert snap2["frames"] > snap1["frames"], "rAF 没有推进"

    # 4) 能截图
    shot = OUT / "probe.png"
    page.screenshot(path=str(shot))
    print(f"  截图: {shot} ({shot.stat().st_size/1024:.1f} KB)")

    # 5) 能读 canvas 像素（验证渲染真的发生了）
    px = page.evaluate(
        """() => {
            const c = document.getElementById('c');
            const d = c.getContext('2d').getImageData(25, 25, 1, 1).data;
            return [d[0], d[1], d[2], d[3]];
        }"""
    )
    print("  canvas(25,25) 像素 RGBA:", px)
    assert px[0] > 200 and px[1] > 150, "canvas 渲染结果不对"

    browser.close()

print("\nPlaywright 可用：能开 chromium、能跑 JS 读状态、能等 rAF、能截图、能读 canvas 像素。")
