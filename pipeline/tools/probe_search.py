"""探测免费搜索端点的可用性与返回结构，为自建搜索工具选型。

只用 httpx，走本机代理。输出每个端点的状态、大小、以及"结果条目"的识别情况。
"""

import re
import sys

import httpx

PROXY = "http://127.0.0.1:7897"
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)
QUERY = "sakurayo github"


def fetch(url: str, params: dict | None = None) -> httpx.Response | None:
    try:
        return httpx.get(
            url,
            params=params,
            proxy=PROXY,
            headers={"User-Agent": UA, "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"},
            timeout=30,
            follow_redirects=True,
        )
    except Exception as e:  # noqa: BLE001
        print(f"    !! 请求失败: {type(e).__name__}: {e}")
        return None


def probe_ddg_lite() -> None:
    print("[1] DuckDuckGo lite")
    r = fetch("https://lite.duckduckgo.com/lite/", {"q": QUERY})
    if not r:
        return
    print(f"    HTTP {r.status_code}  {len(r.text)} 字符")
    text = r.text
    # 常见几种结构都找一遍
    patterns = {
        "result-link": r'class="result-link"',
        "a.result-link": r'<a[^>]+class="[^"]*result-link[^"]*"',
        "links_main": r'class="links_main"',
        "result-snippet": r'class="result-snippet"',
        "任何 href=http": r'href="https?://[^"]+"',
        "anomaly/挑战": r'(anomaly|challenge|blocked|captcha)',
    }
    for name, pat in patterns.items():
        print(f"    {name:16} 命中 {len(re.findall(pat, text, re.I))}")
    print("    --- 前 600 字符 ---")
    print("    " + text[:600].replace("\n", "\n    "))


def probe_ddg_html() -> None:
    print("\n[2] DuckDuckGo html")
    r = fetch("https://html.duckduckgo.com/html/", {"q": QUERY})
    if not r:
        return
    print(f"    HTTP {r.status_code}  {len(r.text)} 字符")
    for name, pat in {
        "result__a": r'class="result__a"',
        "result__snippet": r'class="result__snippet"',
        "anomaly": r'(anomaly|challenge|blocked)',
    }.items():
        print(f"    {name:16} 命中 {len(re.findall(pat, r.text, re.I))}")


def probe_searxng_instances() -> None:
    print("\n[3] SearXNG 公共实例（JSON API）")
    instances = [
        "https://searx.be/search",
        "https://search.bus-hit.me/search",
        "https://priv.au/search",
        "https://searxng.site/search",
        "https://search.inetol.net/search",
    ]
    for base in instances:
        r = fetch(base, {"q": QUERY, "format": "json"})
        if not r:
            continue
        head = r.text[:120].replace("\n", " ")
        print(f"    {base:38} HTTP {r.status_code}  {len(r.text):7} 字符  {head[:70]}")


def probe_json_apis() -> None:
    print("\n[4] 结构化 API（免 key）")
    apis = [
        ("Wikipedia 中文", "https://zh.wikipedia.org/w/api.php",
         {"action": "query", "list": "search", "srsearch": "樱夜", "format": "json", "srlimit": 3}),
        ("GitHub 仓库", "https://api.github.com/search/repositories",
         {"q": "html5 game engine", "per_page": 3}),
        ("GitHub 代码", "https://api.github.com/search/code",
         {"q": "render_game_to_text", "per_page": 3}),
    ]
    for name, url, params in apis:
        r = fetch(url, params)
        if not r:
            continue
        ok = "JSON" if r.text.lstrip().startswith(("{", "[")) else "非JSON"
        print(f"    {name:16} HTTP {r.status_code}  {len(r.text):7} 字符  {ok}")


if __name__ == "__main__":
    print(f"代理 {PROXY}  查询 {QUERY!r}\n")
    probe_ddg_lite()
    probe_ddg_html()
    probe_searxng_instances()
    probe_json_apis()
    print("\n完成。")
