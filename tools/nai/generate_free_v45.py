#!/usr/bin/env python3
"""CLI: NovelAI v4.5 Opus-free Normal images only. Never spends Anlas."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from free_v45 import (
    CHAR_PRESETS,
    DEFAULT_NEGATIVE,
    DEFAULT_STEPS,
    FREE_SIZES,
    SafetyError,
    fetch_account,
    generate_free_image,
    read_token,
)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Generate one NovelAI v4.5 Normal image using the Opus free perk only."
    )
    parser.add_argument("--status", action="store_true", help="print subscription / Anlas and exit")
    parser.add_argument("--dry-run", action="store_true", help="validate and print plan, do not generate")
    parser.add_argument("--char", choices=sorted(CHAR_PRESETS), help="use a Sakurayo character preset")
    parser.add_argument("--prompt", default="", help="extra prompt tags (or full prompt if no --char)")
    parser.add_argument("--negative", default=DEFAULT_NEGATIVE)
    parser.add_argument("--size", choices=sorted(FREE_SIZES), default="portrait")
    parser.add_argument("--model", default="full", help="full | curated | nai-diffusion-4-5-full")
    parser.add_argument("--steps", type=int, default=DEFAULT_STEPS)
    parser.add_argument("--seed", type=int, default=None)
    parser.add_argument(
        "--out",
        default="",
        help="output PNG path (default outputs/nai/<char-or-probe>_<seed>.png)",
    )
    args = parser.parse_args(argv)

    try:
        token = read_token()
        if args.status:
            account = fetch_account(token)
            print(json.dumps(account, ensure_ascii=False, indent=2))
            if not account["is_opus"]:
                print("REFUSE: not an active Opus account; free unlimited v4.5 is unavailable.", file=sys.stderr)
                return 2
            if (account.get("v5_usage_percent") or 0) >= 100:
                print("NOTE: V5 usage meter is already >= 100%. This tool never calls V5.", file=sys.stderr)
            return 0

        if not args.char and not args.prompt.strip():
            parser.error("need --char and/or --prompt (or use --status)")

        out = Path(args.out) if args.out else None
        if out is None and not args.dry_run:
            root = Path(__file__).resolve().parents[2]
            name = args.char or "probe"
            out = root / "outputs" / "nai" / f"{name}_pending.png"

        result = generate_free_image(
            prompt=args.prompt,
            token=token,
            char=args.char,
            size=args.size,
            model=args.model,
            steps=args.steps,
            seed=args.seed,
            negative=args.negative,
            out_path=out,
            dry_run=args.dry_run,
        )
        if out and result.get("out_path") and result.get("seed") and "pending" in Path(result["out_path"]).name:
            final = Path(result["out_path"]).with_name(f"{args.char or 'probe'}_{result['seed']}.png")
            Path(result["out_path"]).rename(final)
            meta = Path(result["meta_path"])
            final_meta = final.with_suffix(".json")
            if meta.is_file():
                meta.rename(final_meta)
            result["out_path"] = str(final)
            result["meta_path"] = str(final_meta)

        public = {k: v for k, v in result.items() if k != "png"}
        print(json.dumps(public, ensure_ascii=False, indent=2))
        if result.get("anlas_spent", 0) > 0:
            return 3
        return 0
    except SafetyError as exc:
        print(f"SAFETY: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
