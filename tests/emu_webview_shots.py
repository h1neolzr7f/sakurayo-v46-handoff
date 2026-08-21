#!/usr/bin/env python3
"""Drive the debug APK WebView on the emulator via CDP and save screenshots.

ATD `adb screencap` is black. Page.captureScreenshot hangs on this image.
We inject html2canvas in the live WebView and export the painted DOM.
"""
from __future__ import annotations

import asyncio
import base64
import json
import os
import sys
import urllib.request

import websockets

CDP = os.environ.get("EMU_CDP", "http://127.0.0.1:9222")
OUT = os.environ.get("EMU_SHOT_DIR", "/opt/cursor/artifacts/screenshots")
H2C = os.environ.get("HTML2CANVAS", "/tmp/html2canvas.min.js")
H2C_URL = "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"
os.makedirs(OUT, exist_ok=True)
if not os.path.isfile(H2C) or os.path.getsize(H2C) < 1000:
    urllib.request.urlretrieve(H2C_URL, H2C)


def list_pages():
    with urllib.request.urlopen(CDP + "/json", timeout=8) as resp:
        return json.loads(resp.read().decode("utf-8"))


class Cdp:
    def __init__(self, ws):
        self.ws = ws
        self.i = 0

    async def send(self, method, timeout=30, **params):
        self.i += 1
        req_id = self.i
        await self.ws.send(json.dumps({"id": req_id, "method": method, "params": params}))
        while True:
            raw = await asyncio.wait_for(self.ws.recv(), timeout=timeout)
            msg = json.loads(raw)
            if msg.get("id") == req_id:
                if "error" in msg:
                    raise RuntimeError(f"{method}: {msg['error']}")
                return msg.get("result") or {}

    async def eval(self, expression, await_promise=False, timeout=30):
        result = await self.send(
            "Runtime.evaluate",
            timeout=timeout,
            expression=expression,
            returnByValue=True,
            awaitPromise=await_promise,
        )
        if result.get("exceptionDetails"):
            raise RuntimeError(result["exceptionDetails"])
        return (result.get("result") or {}).get("value")


INFO_JS = """(() => {
  const box = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), text: String(el.textContent || "").replace(/\\s+/g, " ").slice(0, 48)};
  };
  return {
    href: location.href,
    title: document.title,
    size: {iw: innerWidth, ih: innerHeight},
    landscape: document.documentElement.classList.contains("landscape46"),
    start: box("#start"),
    chrome: !!document.getElementById("homeChrome47"),
    crests: document.querySelectorAll("#homeCrests47 img").length,
    bloom: document.getElementById("homeBloom47")?.textContent || "",
    shard: document.getElementById("homeShard47")?.textContent || "",
    ticket: document.getElementById("homeTicket47")?.textContent || "",
    tutorial: !document.getElementById("tutorialDrawer37")?.classList.contains("hidden"),
    exchange: !document.getElementById("exchangeDrawer47")?.classList.contains("hidden"),
    talk: document.querySelector("#homePickTalk47 span")?.textContent || document.getElementById("homePickTalk47")?.textContent || "",
    float: !!document.querySelector(".homePickFloat47"),
    toast: document.getElementById("toast")?.textContent || ""
  };
})()"""


async def inject_html2canvas(cdp):
    ready = await cdp.eval("typeof html2canvas === 'function'")
    if ready:
        return
    src = open(H2C, encoding="utf-8").read()
    await cdp.eval(src + ";true", timeout=20)
    ok = await cdp.eval("typeof html2canvas === 'function'")
    if not ok:
        raise RuntimeError("html2canvas inject failed")


async def snap(cdp, name):
    data_url = await cdp.eval(
        """html2canvas(document.documentElement, {
          backgroundColor: '#080713',
          useCORS: true,
          allowTaint: true,
          scale: 1,
          logging: false,
          windowWidth: innerWidth,
          windowHeight: innerHeight,
          onclone(doc) {
            const view = doc.defaultView;
            doc.querySelectorAll('*').forEach((el) => {
              const s = view.getComputedStyle(el);
              const bg = s.backgroundImage || '';
              if (bg && bg !== 'none' && /gradient/i.test(bg)) {
                el.style.backgroundImage = 'none';
                el.style.backgroundColor = s.backgroundColor && s.backgroundColor !== 'rgba(0, 0, 0, 0)' ? s.backgroundColor : '#140c24';
              }
            });
          }
        }).then(c => c.toDataURL('image/png'))""",
        await_promise=True,
        timeout=90,
    )
    if not data_url or not str(data_url).startswith("data:image/png"):
        raise RuntimeError(f"bad screenshot payload for {name}")
    raw = base64.b64decode(str(data_url).split(",", 1)[1])
    path = os.path.join(OUT, name)
    with open(path, "wb") as fh:
        fh.write(raw)
    print("SHOT", name, path, len(raw), flush=True)
    return path


async def main():
    pages = [p for p in list_pages() if "android_asset/index.html" in (p.get("url") or "")]
    if not pages:
        print("NO_PAGE", file=sys.stderr)
        return 1
    print("PAGE", pages[0].get("title"), pages[0].get("url"), flush=True)
    async with websockets.connect(pages[0]["webSocketDebuggerUrl"], max_size=20_000_000, ping_interval=None) as ws:
        cdp = Cdp(ws)
        info = None
        for _ in range(80):
            info = await cdp.eval(INFO_JS)
            if info and info.get("tutorial"):
                await cdp.eval("document.getElementById('tutorialSkip37')?.click()")
                await asyncio.sleep(0.35)
                continue
            if info and info.get("chrome") and info.get("start"):
                break
            await asyncio.sleep(0.5)
        print("INFO", json.dumps(info, ensure_ascii=False), flush=True)
        if not info or not info.get("chrome"):
            raise RuntimeError(f"home chrome not ready: {info}")
        await inject_html2canvas(cdp)
        await snap(cdp, "emu-webview-lobby.png")

        bloom0 = int((info or {}).get("bloom") or 0)
        await cdp.eval("""(() => {
          const el = document.getElementById('heroTap46') || document.getElementById('heroLive46');
          el && el.dispatchEvent(new Event('click', {bubbles: true}));
        })()""")
        await asyncio.sleep(0.28)
        pick = await cdp.eval(INFO_JS)
        print("PICK", json.dumps(pick, ensure_ascii=False), flush=True)
        await snap(cdp, "emu-webview-pick.png")

        await cdp.eval("document.querySelector('.homeCoin47[data-home=\"exchange\"]')?.click()")
        await asyncio.sleep(0.4)
        ex = await cdp.eval("""(() => ({
          open: !document.getElementById('exchangeDrawer47')?.classList.contains('hidden'),
          title: document.querySelector('#exchangeDrawer47 h2')?.textContent || '',
          gallery: document.querySelectorAll('#exchangeBody47 img').length,
          cards: [...document.querySelectorAll('#exchangeBody47 .exCard47 b')].map(n => n.textContent)
        }))()""")
        print("EXCHANGE", json.dumps(ex, ensure_ascii=False), flush=True)
        await snap(cdp, "emu-webview-exchange.png")

        await cdp.eval("document.querySelector('#exchangeDrawer47 .close')?.click()")
        await asyncio.sleep(0.25)
        await cdp.eval("document.querySelector('.charCard[data-character=\"aya\"]')?.click()")
        await asyncio.sleep(0.5)
        await cdp.eval("""(() => {
          const el = document.getElementById('heroTap46') || document.getElementById('heroLive46');
          el && el.dispatchEvent(new Event('click', {bubbles: true}));
        })()""")
        await asyncio.sleep(0.28)
        aya = await cdp.eval(INFO_JS)
        print("AYA", json.dumps(aya, ensure_ascii=False), flush=True)
        await snap(cdp, "emu-webview-pick-aya.png")

        await cdp.eval("document.querySelector('.charCard[data-character=\"rion\"]')?.click()")
        await asyncio.sleep(0.5)
        await cdp.eval("""(() => {
          const el = document.getElementById('heroTap46') || document.getElementById('heroLive46');
          el && el.dispatchEvent(new Event('click', {bubbles: true}));
        })()""")
        await asyncio.sleep(0.28)
        rion = await cdp.eval(INFO_JS)
        print("RION", json.dumps(rion, ensure_ascii=False), flush=True)
        await snap(cdp, "emu-webview-pick-rion.png")

        bloom1 = int((pick or {}).get("bloom") or 0)
        ok = bool((info or {}).get("chrome") and bloom1 > bloom0 and ex.get("open") and (ex.get("gallery") or 0) >= 80)
        print("DONE", json.dumps({
            "ok": ok,
            "out": OUT,
            "size": (info or {}).get("size"),
            "bloom": f"{bloom0}->{bloom1}",
            "talk": (pick or {}).get("talk"),
            "gallery": ex.get("gallery"),
        }, ensure_ascii=False), flush=True)
        return 0 if ok else 2


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
