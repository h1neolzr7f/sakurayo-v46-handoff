#!/usr/bin/env python3
"""Generate non-protagonist free v4.5 Normal stills. Never spends Anlas."""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from free_v45 import SafetyError, fetch_account, generate_free_image, read_token
from prompts import PROPS, SCENES, compose_prop_prompt, compose_scene_prompt

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "outputs" / "nai" / "raw"
DELAY_SEC = 4.0
DEFAULT_SCENES = (
    "lobby_wide,shop_wide,archive_wide,stage_1,stage_2,stage_3,stage_4"
)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Sakurayo NAI v4.5 scenery/prop probe. Does not generate sayo/aya/rion."
    )
    parser.add_argument("--kind", choices=("scene", "prop"), default="scene")
    parser.add_argument("--ids", default="", help="comma list; default is the 7 scenery pack")
    parser.add_argument("--extra", default="")
    parser.add_argument("--model", default="full")
    parser.add_argument("--max", type=int, default=7)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args(argv)

    catalog = SCENES if args.kind == "scene" else PROPS
    compose = compose_scene_prompt if args.kind == "scene" else compose_prop_prompt
    raw_ids = args.ids.strip() or (DEFAULT_SCENES if args.kind == "scene" else ",".join(PROPS))
    ids = [x.strip() for x in raw_ids.split(",") if x.strip()]
    blocked = {"sayo", "aya", "rion"}
    hit = [x for x in ids if x in blocked]
    if hit:
        parser.error(f"refusing protagonist ids {hit}; use generate_assets.py for those")
    for aid in ids:
        if aid not in catalog:
            parser.error(f"unknown {args.kind} {aid}; use {sorted(catalog)}")
    if len(ids) > args.max:
        parser.error(f"refusing {len(ids)} gens; --max {args.max} (shared account)")

    token = read_token()
    account = fetch_account(token)
    print(json.dumps({"account": account, "kind": args.kind, "ids": ids}, ensure_ascii=False))
    if not account["is_opus"]:
        print("SAFETY: not Opus", file=sys.stderr)
        return 2

    for i, aid in enumerate(ids):
        if i:
            time.sleep(DELAY_SEC)
        spec = catalog[aid]
        prompt, negative = compose(aid, extra=args.extra)
        out = OUT / f"{aid}_{spec['seed']}.png"
        try:
            result = generate_free_image(
                prompt=prompt,
                token=token,
                size=spec["size"],
                model=args.model,
                seed=spec["seed"],
                negative=negative,
                out_path=out,
                quality_toggle=False,
                dry_run=args.dry_run,
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
