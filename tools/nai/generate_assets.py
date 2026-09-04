#!/usr/bin/env python3
"""Generate one free v4.5 Normal still per character. Never spends Anlas."""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from free_v45 import SafetyError, fetch_account, generate_free_image, read_token
from prompts import CHARS, SHOTS, compose_prompt

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "outputs" / "nai" / "raw"
DELAY_SEC = 4.0
SEEDS = {"sayo": 20260824, "aya": 20260825, "rion": 20260826}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Sakurayo NAI v4.5 free asset probe.")
    parser.add_argument("--shot", choices=sorted(SHOTS), default="live")
    parser.add_argument("--chars", default="sayo", help="comma list: sayo,aya,rion")
    parser.add_argument("--extra", default="")
    parser.add_argument("--model", default="full")
    parser.add_argument("--max", type=int, default=3)
    args = parser.parse_args(argv)

    ids = [c.strip() for c in args.chars.split(",") if c.strip()]
    for cid in ids:
        if cid not in CHARS:
            parser.error(f"unknown char {cid}")
    if len(ids) > args.max:
        parser.error(f"refusing {len(ids)} gens; --max {args.max} (shared account)")

    token = read_token()
    account = fetch_account(token)
    print(json.dumps({"account": account, "shot": args.shot, "chars": ids}, ensure_ascii=False))
    if not account["is_opus"]:
        print("SAFETY: not Opus", file=sys.stderr)
        return 2

    size = SHOTS[args.shot]["size"]
    for i, cid in enumerate(ids):
        if i:
            time.sleep(DELAY_SEC)
        prompt, negative = compose_prompt(cid, args.shot, extra=args.extra)
        out = OUT / f"{cid}_{args.shot}_{SEEDS[cid]}.png"
        try:
            result = generate_free_image(
                prompt=prompt,
                token=token,
                size=size,
                model=args.model,
                seed=SEEDS[cid],
                negative=negative,
                out_path=out,
                quality_toggle=False,
            )
        except SafetyError as exc:
            print(f"SAFETY: {exc}", file=sys.stderr)
            return 2
        public = {k: v for k, v in result.items() if k != "png"}
        print(json.dumps(public, ensure_ascii=False, indent=2))
        if result.get("anlas_spent", 0) > 0:
            return 3
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
