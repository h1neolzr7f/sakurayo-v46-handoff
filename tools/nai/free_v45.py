#!/usr/bin/env python3
"""NovelAI v4.5 Opus-free helper.

Hard rules (protect a shared rented account):
- Only nai-diffusion-4-5-full / nai-diffusion-4-5-curated (never V5).
- Only Normal free sizes: 832x1216 / 1216x832 / 1024x1024.
- One image, <=28 steps, text-to-image only.
- Refuse anything that can spend Anlas: img2img, vibe, director, SMEA, upscale.
- Opus Small (512x768) is rejected: NovelAI bills that size even on Opus.
"""
from __future__ import annotations

import json
import os
import random
import string
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

IMAGE_HOST = "https://image.novelai.net"
GENERATE_URL = f"{IMAGE_HOST}/ai/generate-image"
SUBSCRIPTION_URL = f"{IMAGE_HOST}/user/subscription"
INFORMATION_URL = f"{IMAGE_HOST}/user/information"
DATA_URL = f"{IMAGE_HOST}/user/data"

TIER_OPUS = 3
TIER_NAMES = {0: "paper", 1: "tablet", 2: "scroll", 3: "opus"}

ALLOWED_MODELS = frozenset({
    "nai-diffusion-4-5-full",
    "nai-diffusion-4-5-curated",
})
MODEL_ALIASES = {
    "full": "nai-diffusion-4-5-full",
    "curated": "nai-diffusion-4-5-curated",
    "v4.5": "nai-diffusion-4-5-full",
    "4.5": "nai-diffusion-4-5-full",
}

# Official Opus free perk is Normal size, not the UI "Small" preset.
FREE_SIZES = {
    "portrait": (832, 1216),
    "landscape": (1216, 832),
    "square": (1024, 1024),
}
FREE_SIZE_SET = frozenset(FREE_SIZES.values())
MAX_FREE_PIXELS = 1024 * 1024
MAX_FREE_STEPS = 28
DEFAULT_STEPS = 28
DEFAULT_SCALE = 5.5
DEFAULT_SAMPLER = "k_euler_ancestral"

DEFAULT_NEGATIVE = (
    "nsfw, nude, explicit, child, loli, shota, lowres, worst quality, bad quality, "
    "jpeg artifacts, scan artifacts, watermark, logo, text, error, extra fingers, "
    "extra limbs, mutated hands, poorly drawn face, blurry, chromatic aberration, "
    "multiple views, artistic error, very displeasing"
)

CHAR_PRESETS = {
    "sayo": (
        "1girl, solo, adult woman, 20 years old, "
        "long dark purple hair, purple-black hair, soft pink inner highlights, wavy hair, sidelocks, "
        "pink eyes, gentle expression, looking at viewer, "
        "modern shrine maiden, combat miko, "
        "white haori with purple trim, pink-purple combat skirt, thigh straps, "
        "holding a sleek cherry-blossom assault rifle, rifle at rest beside hip, muzzle down, "
        "night sakura petals, ruined neon city, moonlight, "
        "cel shading, official art, anime screenshot, clean lineart, detailed face, detailed eyes, "
        "full body, standing, boots, fully clothed, safe for work"
    ),
    "aya": (
        "1girl, solo, adult woman, 20 years old, "
        "long silver-white hair, straight hair, blue eyes, calm sharp expression, looking at viewer, "
        "tactical white-and-blue coat, moonlight color scheme, "
        "holding a compact pistol at the hip muzzle down and a sheathed moonlight katana, "
        "night city, cherry petals, "
        "cel shading, official art, anime screenshot, clean lineart, detailed face, "
        "full body, standing, fully clothed, safe for work"
    ),
    "rion": (
        "1girl, solo, adult woman, 20 years old, "
        "very long black hair, dark red undertone, red eyes, calm expression, looking at viewer, "
        "black and crimson swordswoman outfit, dark haori, "
        "holding a single long katana, blade down, "
        "night shrine, spider lilies, moonlight, "
        "cel shading, official art, anime screenshot, clean lineart, detailed face, "
        "full body, standing, fully clothed, safe for work"
    ),
}


class SafetyError(ValueError):
    """Request would risk Anlas, V5 quota, or the shared account."""


def resolve_model(name: str) -> str:
    key = (name or "").strip()
    return MODEL_ALIASES.get(key.lower(), key)


def resolve_size(name_or_pair: str | tuple[int, int]) -> tuple[int, int]:
    if isinstance(name_or_pair, tuple):
        return int(name_or_pair[0]), int(name_or_pair[1])
    key = (name_or_pair or "portrait").strip().lower()
    if key not in FREE_SIZES:
        raise SafetyError(
            f"size {name_or_pair!r} is not a free Normal preset; "
            f"use one of {sorted(FREE_SIZES)}"
        )
    return FREE_SIZES[key]


def validate_free_request(
    *,
    model: str,
    width: int,
    height: int,
    steps: int,
    n_samples: int = 1,
    action: str = "generate",
    extra_keys: set[str] | None = None,
) -> list[str]:
    errors: list[str] = []
    model = resolve_model(model)
    if model not in ALLOWED_MODELS:
        errors.append(
            f"model {model!r} is blocked; only {sorted(ALLOWED_MODELS)} "
            "(V5 and older paid routes are refused)"
        )
    if (width, height) not in FREE_SIZE_SET:
        errors.append(
            f"size {width}x{height} is not a free Normal size "
            f"{sorted(FREE_SIZE_SET)}; Small 512x768 can cost Anlas on Opus"
        )
    if width * height > MAX_FREE_PIXELS:
        errors.append(f"pixels {width * height} exceed {MAX_FREE_PIXELS}")
    if steps > MAX_FREE_STEPS or steps < 1:
        errors.append(f"steps {steps} must be 1..{MAX_FREE_STEPS}")
    if n_samples != 1:
        errors.append(f"n_samples {n_samples} must be 1")
    if action != "generate":
        errors.append(f"action {action!r} is blocked; only text-to-image generate")
    banned = {
        "image", "mask", "img2img", "upscale", "upscaled_enhance",
        "reference_image", "reference_image_multiple",
        "director_reference_images", "controlnet_condition",
        "sm", "sm_dyn", "strength",
    }
    extra = extra_keys or set()
    hit = sorted(extra & banned)
    if hit:
        errors.append(f"paid/extra fields blocked: {hit}")
    return errors


def require_free_request(**kwargs: Any) -> None:
    errors = validate_free_request(**kwargs)
    if errors:
        raise SafetyError("; ".join(errors))


def anlas_from_subscription(sub: dict[str, Any]) -> int:
    left = sub.get("trainingStepsLeft") or {}
    return int(left.get("fixedTrainingStepsLeft") or 0) + int(
        left.get("purchasedTrainingSteps") or 0
    )


def summarize_account(sub: dict[str, Any], info: dict[str, Any] | None = None) -> dict[str, Any]:
    tier = int(sub.get("tier") or 0)
    usage = sub.get("usage") or {}
    expires = sub.get("expiresAt")
    expires_iso = None
    if expires:
        expires_iso = datetime.fromtimestamp(int(expires), tz=timezone.utc).isoformat()
    return {
        "tier": tier,
        "tier_name": TIER_NAMES.get(tier, f"unknown-{tier}"),
        "active": bool(sub.get("active")),
        "is_opus": tier == TIER_OPUS and bool(sub.get("active")),
        "expires_at": expires_iso,
        "anlas": anlas_from_subscription(sub),
        "subscription_anlas": int((sub.get("trainingStepsLeft") or {}).get("fixedTrainingStepsLeft") or 0),
        "paid_anlas": int((sub.get("trainingStepsLeft") or {}).get("purchasedTrainingSteps") or 0),
        "v5_usage_percent": usage.get("percent"),
        "v5_usage_negative": usage.get("isNegative"),
        "ban_status": (info or {}).get("banStatus"),
        "grace_period": bool(sub.get("isGracePeriod")),
    }


def assert_safe_to_generate(account: dict[str, Any]) -> None:
    if account.get("ban_status") not in (None, "not_banned"):
        raise SafetyError(f"account ban_status={account.get('ban_status')!r}; refuse to generate")
    if not account.get("is_opus"):
        raise SafetyError(
            f"tier={account.get('tier_name')!r} active={account.get('active')!r}; "
            "only active Opus can generate without Anlas"
        )


def build_payload(
    *,
    prompt: str,
    negative: str,
    model: str,
    width: int,
    height: int,
    steps: int,
    seed: int,
    scale: float = DEFAULT_SCALE,
) -> dict[str, Any]:
    require_free_request(
        model=model,
        width=width,
        height=height,
        steps=steps,
        n_samples=1,
        action="generate",
    )
    return {
        "input": prompt,
        "model": model,
        "action": "generate",
        "parameters": {
            "params_version": 3,
            "width": width,
            "height": height,
            "scale": scale,
            "sampler": DEFAULT_SAMPLER,
            "steps": steps,
            "n_samples": 1,
            "ucPreset": 0,
            "qualityToggle": True,
            "sm": False,
            "sm_dyn": False,
            "dynamic_thresholding": False,
            "controlnet_strength": 1,
            "legacy": False,
            "add_original_image": False,
            "cfg_rescale": 0,
            "noise_schedule": "karras",
            "legacy_v3_extend": False,
            "skip_cfg_above_sigma": None,
            "use_coords": False,
            "legacy_uc": False,
            "prefer_brownian": True,
            "deliberate_euler_ancestral_bug": False,
            "seed": seed,
            "negative_prompt": negative,
            "v4_prompt": {
                "caption": {
                    "base_caption": prompt,
                    "char_captions": [],
                },
                "use_coords": False,
                "use_order": True,
            },
            "v4_negative_prompt": {
                "caption": {
                    "base_caption": negative,
                    "char_captions": [],
                },
                "legacy_uc": False,
            },
        },
    }


def read_token() -> str:
    for key in ("NAI_API_TOKEN", "NOVELAI_API_TOKEN"):
        value = (os.environ.get(key) or "").strip()
        if value:
            return value
    token_file = Path(__file__).resolve().parent / ".token"
    if token_file.is_file():
        value = token_file.read_text(encoding="utf-8").strip()
        if value:
            return value
    raise SafetyError(
        "missing token; set NAI_API_TOKEN in the environment "
        "(do not paste it into git, chat logs, or commit files)"
    )


def _request_json(url: str, token: str, data: bytes | None = None, accept: str = "application/json") -> tuple[int, Any, bytes]:
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": accept,
        "User-Agent": "SakurayoNaiFree/1.0",
    }
    if data is not None:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method="POST" if data is not None else "GET")
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            raw = resp.read()
            ctype = (resp.headers.get("Content-Type") or "").split(";")[0].strip()
            parsed: Any
            if ctype.endswith("json") or raw[:1] in (b"{", b"["):
                parsed = json.loads(raw.decode("utf-8"))
            else:
                parsed = None
            return resp.status, parsed, raw
    except urllib.error.HTTPError as exc:
        body = exc.read()
        text = body.decode("utf-8", "replace")
        raise SafetyError(f"HTTP {exc.code} {url.split('?')[0]}: {text[:500]}") from exc


def fetch_account(token: str) -> dict[str, Any]:
    _, sub, _ = _request_json(SUBSCRIPTION_URL, token)
    try:
        _, info, _ = _request_json(INFORMATION_URL, token)
    except SafetyError:
        info = {}
    if not isinstance(sub, dict):
        raise SafetyError("subscription response was not JSON")
    return summarize_account(sub, info if isinstance(info, dict) else {})


def generate_free_image(
    *,
    prompt: str,
    token: str | None = None,
    char: str | None = None,
    size: str = "portrait",
    model: str = "full",
    steps: int = DEFAULT_STEPS,
    seed: int | None = None,
    negative: str = DEFAULT_NEGATIVE,
    out_path: Path | None = None,
    dry_run: bool = False,
) -> dict[str, Any]:
    token = token or read_token()
    model = resolve_model(model)
    width, height = resolve_size(size)
    if char:
        preset = CHAR_PRESETS.get(char)
        if not preset:
            raise SafetyError(f"unknown char {char!r}; use {sorted(CHAR_PRESETS)}")
        prompt = f"{preset}, {prompt}" if prompt and prompt != preset else preset
    if not prompt.strip():
        raise SafetyError("prompt is empty")
    seed = int(seed if seed is not None else random.randint(0, 2**31 - 1))
    payload = build_payload(
        prompt=prompt,
        negative=negative,
        model=model,
        width=width,
        height=height,
        steps=steps,
        seed=seed,
    )
    account_before = fetch_account(token)
    assert_safe_to_generate(account_before)
    result: dict[str, Any] = {
        "model": model,
        "width": width,
        "height": height,
        "steps": steps,
        "seed": seed,
        "prompt": prompt,
        "negative": negative,
        "account_before": account_before,
        "dry_run": dry_run,
        "anlas_spent": 0,
    }
    if dry_run:
        result["payload_keys"] = sorted(payload.keys())
        return result

    corr = "".join(random.choice(string.ascii_letters + string.digits) for _ in range(6))
    body = json.dumps(payload).encode("utf-8")
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "SakurayoNaiFree/1.0",
        "x-correlation-id": corr,
    }
    req = urllib.request.Request(GENERATE_URL, data=body, headers=headers, method="POST")
    started = time.time()
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            raw = resp.read()
            status = resp.status
            ctype = (resp.headers.get("Content-Type") or "").split(";")[0].strip()
    except urllib.error.HTTPError as exc:
        err_body = exc.read().decode("utf-8", "replace")
        raise SafetyError(f"generate HTTP {exc.code}: {err_body[:800]}") from exc

    png = _extract_png(raw, ctype)
    elapsed = round(time.time() - started, 2)
    time.sleep(1.2)
    account_after = fetch_account(token)
    spent = account_before["anlas"] - account_after["anlas"]
    result.update({
        "http_status": status,
        "elapsed_sec": elapsed,
        "account_after": account_after,
        "anlas_spent": spent,
        "correlation_id": corr,
        "bytes": len(png),
    })
    if spent > 0:
        raise SafetyError(
            f"CRITICAL: Anlas dropped {account_before['anlas']} -> {account_after['anlas']}; "
            "further generation is aborted"
        )
    if out_path:
        out_path = Path(out_path)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_bytes(png)
        side = out_path.with_suffix(".json")
        safe_meta = {k: v for k, v in result.items() if k != "prompt" or True}
        side.write_text(json.dumps(safe_meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        result["out_path"] = str(out_path)
        result["meta_path"] = str(side)
    result["png"] = png
    return result


def _extract_png(raw: bytes, ctype: str) -> bytes:
    if raw[:8] == b"\x89PNG\r\n\x1a\n":
        return raw
    if ctype.endswith("json") or raw[:1] in (b"{", b"["):
        data = json.loads(raw.decode("utf-8"))
        images = data.get("images") if isinstance(data, dict) else data
        if not images:
            raise SafetyError(f"JSON response had no images: {str(data)[:300]}")
        first = images[0]
        b64 = first["image"] if isinstance(first, dict) else first
        import base64
        return base64.b64decode(b64)
    if raw[:2] == b"PK":
        import io
        import zipfile
        with zipfile.ZipFile(io.BytesIO(raw)) as zf:
            names = [n for n in zf.namelist() if n.lower().endswith((".png", ".webp"))]
            if not names:
                raise SafetyError(f"zip had no image: {zf.namelist()[:8]}")
            return zf.read(names[0])
    raise SafetyError(f"unexpected generate payload ctype={ctype!r} head={raw[:20]!r}")
