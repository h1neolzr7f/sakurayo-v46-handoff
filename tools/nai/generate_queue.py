#!/usr/bin/env python3
"""Generate every remaining free v4.5 still that is not sayo/aya/rion.

Resumable. Stops if Anlas moves off 0. Aligns and installs after each image.
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from align_assets import (  # noqa: E402
    install_catalog,
    process_cover,
    process_creature,
    save_webp,
)
from free_v45 import SafetyError, fetch_account, generate_free_image, read_token  # noqa: E402
from more_prompts import (  # noqa: E402
    CARD_PROPS,
    CREATURES,
    EXTRAS,
    RETRY_PROPS,
    SCENES_MORE,
    compose_card_prompt,
    compose_creature_prompt,
    compose_extra_prompt,
)
from prompts import PROPS, compose_prop_prompt  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "outputs" / "nai" / "raw"
ALIGNED = ROOT / "outputs" / "nai" / "aligned"
LOG = ROOT / "outputs" / "nai" / "batch4.jsonl"
DELAY_SEC = 4.0
BLOCKED = frozenset({"sayo", "aya", "rion"})


def plan() -> list[tuple[str, str]]:
    """Combat first, then cards, then leftover scenery/icons, then retries."""
    out: list[tuple[str, str]] = []
    enemies = [k for k in CREATURES if k in (
        "normal", "fast", "tank", "ranged", "bomb", "shield", "disruptor",
        "purifier", "specter", "decay", "seal", "elite", "pethunter",
        "noisecaller", "souleater", "mirrorblade",
    )]
    enemy_b = [f"{k}_b" for k in enemies]
    bosses = [k for k in CREATURES if k.startswith("stage") or k.startswith("void_phase")]
    voids = ["voidling", "voidling_b", "voidmaw", "voidmaw_b"]
    pets = ["bat", "bat_b", "drone", "drone_b", "familiar", "familiar_b", "wisp", "wisp_b"]
    for cid in enemies + enemy_b + bosses + voids + pets:
        out.append(("creature", cid))
    for cid in CARD_PROPS:
        out.append(("card", cid))
    for cid in SCENES_MORE:
        out.append(("extra", cid))
    for cid in EXTRAS:
        out.append(("extra", cid))
    for cid in RETRY_PROPS:
        out.append(("retry", cid))
    return out


def compose(kind: str, cid: str) -> tuple[dict, str, str, int]:
    if kind == "creature":
        spec = CREATURES[cid]
        prompt, negative = compose_creature_prompt(cid)
        return spec, prompt, negative, spec["seed"]
    if kind == "card":
        spec = CARD_PROPS[cid]
        prompt, negative = compose_card_prompt(cid)
        return spec, prompt, negative, spec["seed"]
    if kind == "extra":
        spec = {**SCENES_MORE, **EXTRAS}[cid]
        prompt, negative = compose_extra_prompt(cid)
        return spec, prompt, negative, spec["seed"]
    if kind == "retry":
        spec = PROPS[cid]
        prompt, negative = compose_prop_prompt(cid)
        return spec, prompt, negative, RETRY_PROPS[cid]
    raise ValueError(kind)


def align_install(kind: str, cid: str, spec: dict, src: Path) -> Path:
    canvas = tuple(spec["canvas"])
    dest_rel = spec["dest"]
    if kind == "creature":
        aligned = process_creature(src, canvas)
        lossless = False
    else:
        aligned = process_cover(src, canvas)
        lossless = False
    out = ALIGNED / f"{cid}.webp"
    save_webp(aligned, out, lossless=lossless)
    installed = install_catalog(aligned, dest_rel, cid, lossless=lossless)
    return installed


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Sakurayo free v4.5 leftover queue")
    parser.add_argument("--max", type=int, default=200)
    parser.add_argument("--start", type=int, default=0)
    parser.add_argument("--kinds", default="", help="comma: creature,card,extra,retry")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--skip-existing", action="store_true", default=True)
    parser.add_argument("--no-skip-existing", action="store_true")
    args = parser.parse_args(argv)
    skip = args.skip_existing and not args.no_skip_existing
    wanted = {x.strip() for x in args.kinds.split(",") if x.strip()} or None

    jobs = plan()
    if wanted:
        jobs = [j for j in jobs if j[0] in wanted]
    jobs = jobs[args.start: args.start + args.max]
    hit = [cid for _, cid in jobs if cid in BLOCKED or cid.split("_")[0] in BLOCKED]
    # allow school/job/fusion ids that contain sayo only in lore, not as ids
    blocked_hit = [cid for _, cid in jobs if cid in BLOCKED]
    if blocked_hit:
        parser.error(f"refusing protagonist ids {blocked_hit}")

    token = read_token()
    account = fetch_account(token)
    print(json.dumps({"account": account, "queued": len(jobs)}, ensure_ascii=False))
    if not account["is_opus"]:
        print("SAFETY: not Opus", file=sys.stderr)
        return 2
    if account["anlas"] != 0:
        print(f"SAFETY: anlas={account['anlas']}, refuse to start", file=sys.stderr)
        return 2

    RAW.mkdir(parents=True, exist_ok=True)
    LOG.parent.mkdir(parents=True, exist_ok=True)
    done = 0
    for i, (kind, cid) in enumerate(jobs):
        spec, prompt, negative, seed = compose(kind, cid)
        out = RAW / f"{cid}_{seed}.png"
        if skip and out.is_file() and out.stat().st_size > 8000:
            try:
                installed = align_install(kind, cid, spec, out)
                rec = {"id": cid, "kind": kind, "skipped": True, "installed": str(installed)}
                print(json.dumps(rec, ensure_ascii=False))
                LOG.open("a", encoding="utf-8").write(json.dumps(rec, ensure_ascii=False) + "\n")
                done += 1
                continue
            except Exception as exc:
                print(f"re-align failed {cid}: {exc}", file=sys.stderr)

        if i and not (skip and out.is_file()):
            time.sleep(DELAY_SEC)
        try:
            result = generate_free_image(
                prompt=prompt,
                token=token,
                size=spec["size"],
                seed=seed,
                negative=negative,
                out_path=out,
                quality_toggle=False,
                dry_run=args.dry_run,
            )
        except SafetyError as exc:
            text = str(exc)
            rec = {"id": cid, "kind": kind, "error": text}
            print(json.dumps(rec, ensure_ascii=False))
            LOG.open("a", encoding="utf-8").write(json.dumps(rec, ensure_ascii=False) + "\n")
            if "Anlas" in text or "anlas" in text.lower():
                return 3
            if "HTTP 429" in text or "HTTP 503" in text:
                time.sleep(25)
                try:
                    result = generate_free_image(
                        prompt=prompt,
                        token=token,
                        size=spec["size"],
                        seed=seed,
                        negative=negative,
                        out_path=out,
                        quality_toggle=False,
                        dry_run=args.dry_run,
                    )
                except SafetyError as exc2:
                    rec = {"id": cid, "kind": kind, "error": str(exc2), "retried": True}
                    print(json.dumps(rec, ensure_ascii=False))
                    LOG.open("a", encoding="utf-8").write(json.dumps(rec, ensure_ascii=False) + "\n")
                    return 2
                else:
                    if result.get("anlas_spent", 0) > 0:
                        return 3
                    installed = None
                    if not args.dry_run and out.is_file():
                        installed = str(align_install(kind, cid, spec, out))
                    rec = {
                        "id": cid,
                        "kind": kind,
                        "seed": seed,
                        "bytes": result.get("bytes"),
                        "elapsed": result.get("elapsed_sec"),
                        "anlas": (result.get("account_after") or {}).get("anlas"),
                        "installed": installed,
                        "retried": True,
                    }
                    print(json.dumps(rec, ensure_ascii=False))
                    LOG.open("a", encoding="utf-8").write(json.dumps(rec, ensure_ascii=False) + "\n")
                    done += 1
                    continue
            return 2
        if result.get("anlas_spent", 0) > 0:
            return 3
        installed = None
        if not args.dry_run and out.is_file():
            installed = str(align_install(kind, cid, spec, out))
        rec = {
            "id": cid,
            "kind": kind,
            "seed": seed,
            "bytes": result.get("bytes"),
            "elapsed": result.get("elapsed_sec"),
            "anlas": (result.get("account_after") or {}).get("anlas"),
            "installed": installed,
        }
        print(json.dumps(rec, ensure_ascii=False))
        LOG.open("a", encoding="utf-8").write(json.dumps(rec, ensure_ascii=False) + "\n")
        done += 1
    print(json.dumps({"done": done, "queued": len(jobs)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
