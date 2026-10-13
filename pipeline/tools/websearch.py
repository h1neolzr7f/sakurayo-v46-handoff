#!/usr/bin/env python3
"""websearch — 免 key 的联网搜索，基于社区元搜索库 ddgs。

为什么用 ddgs 而不是自己抓页面：
    裸 HTTP 打 DuckDuckGo 只会拿到挑战页（HTTP 202 + 几十处 anomaly），
    SearXNG 公共实例的 JSON API 基本被禁，用 Playwright 自己写选择器又要
    逐个引擎维护。ddgs（原 duckduckgo-search，GitHub: deedy5/ddgs）是社区
    维护的元搜索库，已经处理好反爬与多后端聚合 —— 直接用它。

实测要点（都是踩过的）：
    - **不要传 proxy**。本机走代理反而把结果从 3 条打到 1 条；直连最好。
    - **单个后端会偶发空结果**（限流），所以按后端列表依次回退 + 重试。
    - 同一个 DDGS 实例连续查多个词容易空，每次查询用独立实例。

用法：
    python websearch.py "查询词"
    python websearch.py "查询词" --limit 15 --json
    python websearch.py "查询词" --backend bing
    python websearch.py "查询词" --type news|images
"""

from __future__ import annotations

import argparse
import json
import sys
import time

# 按实测可用性排序
BACKENDS = ["duckduckgo", "bing", "brave", "mojeek", "google", "yahoo"]


def _normalize(r: dict) -> dict:
    """不同后端的字段名不一致，统一成 title/url/snippet。"""
    return {
        "title": (r.get("title") or "").strip(),
        "url": (r.get("href") or r.get("url") or "").strip(),
        "snippet": (r.get("body") or r.get("description") or "").strip(),
        "source": (r.get("source") or "").strip(),
        "date": (r.get("date") or "").strip(),
    }


def _run(kind: str, **kw):
    from ddgs import DDGS

    with DDGS(timeout=30) as d:
        if kind == "news":
            return list(d.news(**kw))
        if kind == "images":
            return list(d.images(**kw))
        return list(d.text(**kw))


def search(
    query: str,
    limit: int = 10,
    kind: str = "text",
    only_backend: str | None = None,
    retries: int = 2,
) -> tuple[list[dict], str | None]:
    """依次尝试各后端，返回 (结果, 命中的后端)。"""
    backends = [only_backend] if only_backend else BACKENDS
    for backend in backends:
        for attempt in range(retries):
            try:
                raw = _run(kind, query=query, backend=backend, max_results=limit)
                if raw:
                    seen: set[str] = set()
                    out: list[dict] = []
                    for r in raw:
                        n = _normalize(r)
                        if not n["url"] or n["url"] in seen:
                            continue
                        seen.add(n["url"])
                        out.append(n)
                    if out:
                        return out, backend
            except Exception:  # noqa: BLE001
                pass
            if attempt < retries - 1:
                time.sleep(1.2)
    return [], None


def main() -> int:
    ap = argparse.ArgumentParser(description="免 key 联网搜索（ddgs 元搜索）")
    ap.add_argument("query")
    ap.add_argument("--limit", type=int, default=10)
    ap.add_argument("--backend", help=f"只用一个后端：{', '.join(BACKENDS)}")
    ap.add_argument("--type", dest="kind", default="text", choices=["text", "news", "images"])
    ap.add_argument("--json", action="store_true", dest="as_json")
    args = ap.parse_args()

    results, used = search(args.query, args.limit, args.kind, args.backend)

    if args.as_json:
        print(json.dumps(
            {"query": args.query, "kind": args.kind, "backend": used, "results": results},
            ensure_ascii=False, indent=2))
        return 0 if results else 2

    if not results:
        print(f'"{args.query}" 没有结果（后端都试过了；可能是限流，稍后再试）')
        return 2

    print(f'"{args.query}"  [{args.kind} via {used}]  共 {len(results)} 条\n')
    for i, r in enumerate(results, 1):
        print(f"{i:2}. {r['title']}")
        print(f"    {r['url']}")
        if r["snippet"]:
            s = r["snippet"].replace("\n", " ")
            print(f"    {s[:170]}{'…' if len(s) > 170 else ''}")
        print()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
