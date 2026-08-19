#!/usr/bin/env python3
"""Human-triggered NovelAI generation for Sakurayo. Token stays local."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

if str(Path(__file__).resolve().parent) not in sys.path:
    sys.path.insert(0, str(Path(__file__).resolve().parent))

from nai_client import (  # noqa: E402
    DEFAULT_MODEL,
    DEFAULT_SCALE,
    CompileResult,
    NaiError,
    NaiHttpError,
    ROOT as CLIENT_ROOT,
    assert_free_quota,
    build_payload,
    check_subscription,
    compile_job,
    generate_image,
    load_jobs,
    load_token,
    resolve_ref_paths,
    safe_job_id,
    sleep_between,
    snapshot_from_compile,
    with_paid_size,
    write_pngs,
)

DEFAULT_JOBS = CLIENT_ROOT / "assets" / "nai" / "jobs.jsonl"
DEFAULT_OUT_DIR = CLIENT_ROOT / "assets" / "image2" / "source" / "nai"


def _print(msg: str) -> None:
    print(msg, flush=True)


def cmd_check(_: argparse.Namespace) -> int:
    info = check_subscription(load_token())
    _print("NAI subscription")
    _print(f"  active: {info['active']}")
    _print(f"  tier: {info['tierName']}")
    _print(f"  expiresAtUtc: {info['expiresAtUtc']}")
    _print(f"  grace: {info['isGracePeriod']}")
    _print(f"  anlasLeft: {info['fixedTrainingStepsLeft']}")
    _print(f"  purchasedAnlas: {info['purchasedTrainingSteps']}")
    _print("  freeQuota: 1 image, <=28 steps, long-edge<=1216, <=1024x1024, no reference")
    if not info["active"]:
        raise NaiError("NovelAI subscription is not active")
    return 0


def cmd_compile(args: argparse.Namespace) -> int:
    for compiled in _iter_compiled(args):
        _print(f"COMPILE {compiled.dest}")
        _print(json.dumps(compiled.snapshot, ensure_ascii=False, indent=2))
    return 0


def cmd_gen(args: argparse.Namespace) -> int:
    token = load_token()
    targets = list(_iter_compiled(args))
    if len(targets) > 4 and not args.allow_batch:
        raise NaiError(
            f"{len(targets)} images requested. NovelAI ToS requires human-initiated "
            "generation and forbids excessive automation. Pass --allow-batch only "
            "for a deliberate, limited batch."
        )
    written: list[Path] = []
    for index, compiled in enumerate(targets):
        dest = compiled.dest
        payload = compiled.payload
        if dest.exists() and not args.force:
            _print(f"SKIP existing {dest}")
            continue
        assert_free_quota(payload, spend_anlas=args.spend_anlas)
        _print(f"GEN {dest} [{compiled.snapshot['model']} {compiled.snapshot['width']}x{compiled.snapshot['height']}]")
        _print(f"FROZEN spend={compiled.snapshot['wouldSpendAnlas']} reasons={compiled.snapshot['spendReasons']}")
        try:
            images = generate_image(token, payload)
        except NaiHttpError as exc:
            if exc.billing_uncertain:
                raise NaiError(
                    f"{exc} Already sent; do not retry automatically (billing uncertain)."
                ) from exc
            if exc.free_blocked and not args.no_fallback_paid:
                payload = with_paid_size(payload)
                _print(f"FREE_BLOCKED, one paid retry {payload['parameters']['width']}x{payload['parameters']['height']}")
                try:
                    images = generate_image(token, payload)
                except NaiHttpError as paid_exc:
                    if paid_exc.billing_uncertain:
                        raise NaiError(
                            f"{paid_exc} Paid retry already sent; do not retry automatically."
                        ) from paid_exc
                    raise
            else:
                raise
        written.extend(write_pngs(images, dest))
        if index < len(targets) - 1:
            sleep_between(args.delay)
    if written:
        _print("Wrote:")
        for path in written:
            _print(f"  {path}")
    else:
        _print("No new files written.")
    return 0


def _iter_compiled(args: argparse.Namespace):
    if args.prompt:
        dest = Path(args.out) if args.out else DEFAULT_OUT_DIR / "manual.png"
        if not dest.is_absolute():
            dest = CLIENT_ROOT / dest
        refs = resolve_ref_paths(args.char_ref or [])
        payload = build_payload(
            args.prompt,
            model=args.model,
            size=args.size,
            width=args.width,
            height=args.height,
            steps=args.steps,
            scale=args.scale,
            seed=args.seed,
            greenscreen=args.greenscreen,
            artist=False if args.no_artist else True,
            character_refs=refs,
            cr_strength=args.cr_strength,
            cr_fidelity=args.cr_fidelity,
            nsfw=bool(args.nsfw),
        )
        snapshot = snapshot_from_compile(
            payload,
            job_id="manual",
            dest=dest,
            character_ref_paths=[str(path) for path in refs],
            nsfw=bool(args.nsfw),
        )
        yield CompileResult(payload=payload, snapshot=snapshot, dest=dest, job_id="manual")
        return
    jobs_path = Path(args.jobs) if args.jobs else DEFAULT_JOBS
    if not jobs_path.is_absolute():
        jobs_path = CLIENT_ROOT / jobs_path
    jobs = load_jobs(jobs_path)
    if args.job_id:
        jobs = [job for job in jobs if job["id"] == args.job_id]
        if not jobs:
            raise NaiError(f"Job not found: {args.job_id}")
    out_dir = Path(args.out_dir) if args.out_dir else DEFAULT_OUT_DIR
    if not out_dir.is_absolute():
        out_dir = CLIENT_ROOT / out_dir
    for job in jobs:
        if args.nsfw:
            job = dict(job)
            job["nsfw"] = True
        dest = Path(job["out"]) if job.get("out") else out_dir / f"{safe_job_id(job['id'])}.png"
        if not dest.is_absolute():
            dest = CLIENT_ROOT / dest
        yield compile_job(job, dest=dest)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Sakurayo NovelAI image pipeline")
    sub = parser.add_subparsers(dest="cmd", required=True)

    check = sub.add_parser("check", help="Validate local token and print subscription status")
    check.set_defaults(func=cmd_check)

    def add_common(p: argparse.ArgumentParser) -> None:
        p.add_argument("--prompt", help="Direct prompt instead of a jobs file")
        p.add_argument("--job-id", help="Run one id from the jobs file")
        p.add_argument("--jobs", default=str(DEFAULT_JOBS), help="jobs.json / jobs.jsonl")
        p.add_argument("--out", help="Output PNG for --prompt")
        p.add_argument("--out-dir", help="Directory for job outputs")
        p.add_argument("--model", default=DEFAULT_MODEL)
        p.add_argument("--size", default="portrait")
        p.add_argument("--width", type=int)
        p.add_argument("--height", type=int)
        p.add_argument("--steps", type=int, default=28)
        p.add_argument("--scale", type=float, default=DEFAULT_SCALE)
        p.add_argument("--seed", type=int, default=0)
        p.add_argument("--greenscreen", action="store_true")
        p.add_argument("--nsfw", action="store_true", help="Adult prompt tags; omit SFW negatives. Refuses minor terms.")
        p.add_argument("--no-artist", action="store_true", help="Do not prepend the default artist string")
        p.add_argument("--char-ref", action="append", default=[], help="Character reference image path. Repeatable.")
        p.add_argument("--cr-strength", type=float, default=0.65)
        p.add_argument("--cr-fidelity", type=float, default=0.5)

    compile_cmd = sub.add_parser("compile", help="Freeze job into a snapshot. No network, no Anlas.")
    add_common(compile_cmd)
    compile_cmd.set_defaults(func=cmd_compile)

    dry = sub.add_parser("dry-run", help="Alias of compile")
    add_common(dry)
    dry.set_defaults(func=cmd_compile)

    gen = sub.add_parser("gen", help="Send a frozen snapshot. 5xx is never auto-retried.")
    add_common(gen)
    gen.add_argument("--force", action="store_true")
    gen.add_argument("--allow-batch", action="store_true")
    gen.add_argument("--spend-anlas", action="store_true", help="Allow sizes/refs that cost Anlas")
    gen.add_argument("--no-fallback-paid", action="store_true", help="Do not retry Large after a free-queue 403")
    gen.add_argument("--delay", type=float, default=1.5)
    gen.set_defaults(func=cmd_gen)
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        return args.func(args)
    except NaiError as exc:
        _print(f"ERROR: {exc}")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
