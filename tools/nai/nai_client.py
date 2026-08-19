#!/usr/bin/env python3
"""NovelAI image client for Sakurayo art. Never prints or writes the token."""
from __future__ import annotations

import base64
import io
import json
import os
import re
import time
import urllib.error
import urllib.request
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
IMAGE_API = "https://image.novelai.net"
USER_API = "https://api.novelai.net"
DEFAULT_MODEL = "nai-diffusion-4-5-full"
DEFAULT_SAMPLER = "k_euler_ancestral"
DEFAULT_NEGATIVE = (
    "blurry, lowres, error, film grain, scan artifacts, worst quality, bad quality, "
    "jpeg artifacts, very displeasing, chromatic aberration, logo, dated, signature, "
    "multiple views, watermark, text, letters, numbers, speech bubble, ui, "
    "english text, chinese text"
)
GREEN_SCREEN_TAGS = (
    "solid bright green background, chroma key, #00ff00, no shadow, no floor, "
    "no gradient, no scenery"
)

SIZE_PRESETS = {
    "portrait": (832, 1216),
    "portrait_large": (1024, 1536),
    "landscape": (1216, 832),
    "landscape_wide": (1536, 1024),
    "square": (1024, 1024),
}

TOKEN_ENV_KEYS = ("NOVELAI_TOKEN", "NAI_TOKEN", "NOVELAI_ACCESS_KEY")
TOKEN_FILES = (
    ROOT / "secrets" / "novelai.token",
    ROOT / "secrets" / "nai.token",
)

TIER_NAMES = {
    0: "Paper",
    1: "Tablet",
    2: "Scroll",
    3: "Opus",
}


class NaiError(RuntimeError):
    pass


def redact(text: str, token: str | None) -> str:
    if not token or not text:
        return text
    return text.replace(token, "[redacted-nai-token]")


def _read_token_file(path: Path) -> str | None:
    if not path.is_file():
        return None
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        return line
    return None


def load_token(explicit: str | None = None, search_files: tuple[Path, ...] | None = None) -> str:
    if explicit:
        token = explicit.strip()
        if token:
            return token
    for key in TOKEN_ENV_KEYS:
        value = (os.environ.get(key) or "").strip()
        if value:
            return value
    files = TOKEN_FILES if search_files is None else search_files
    for path in files:
        value = _read_token_file(path)
        if value:
            return value
    raise NaiError(
        "NovelAI token not found. Set NOVELAI_TOKEN, or put the Persistent API "
        "token in secrets/novelai.token. Do not paste the token into chat or git."
    )


def resolve_size(size: str | None = None, width: int | None = None, height: int | None = None) -> tuple[int, int]:
    if width and height:
        pair = (int(width), int(height))
    elif size:
        if size not in SIZE_PRESETS:
            known = ", ".join(SIZE_PRESETS)
            raise NaiError(f"Unknown size preset {size!r}. Use one of: {known}")
        pair = SIZE_PRESETS[size]
    else:
        pair = SIZE_PRESETS["portrait"]
    for value in pair:
        if value < 64 or value % 64 != 0:
            raise NaiError(f"NAI size must be a multiple of 64, got {pair}")
    return pair


def compose_prompt(prompt: str, *, greenscreen: bool = False) -> str:
    text = " ".join((prompt or "").split())
    if greenscreen and "chroma key" not in text.lower() and "#00ff00" not in text:
        text = f"{text}, {GREEN_SCREEN_TAGS}" if text else GREEN_SCREEN_TAGS
    return text


def is_v4_model(model: str) -> bool:
    name = (model or "").lower()
    return "nai-diffusion-4" in name or name.startswith("nai-diffusion-4")


def build_payload(
    prompt: str,
    *,
    model: str = DEFAULT_MODEL,
    size: str | None = "portrait",
    width: int | None = None,
    height: int | None = None,
    negative: str = DEFAULT_NEGATIVE,
    steps: int = 28,
    scale: float = 6.0,
    sampler: str = DEFAULT_SAMPLER,
    seed: int = 0,
    greenscreen: bool = False,
    n_samples: int = 1,
) -> dict[str, Any]:
    if n_samples < 1 or n_samples > 4:
        raise NaiError("n_samples must be 1-4")
    if steps < 1 or steps > 50:
        raise NaiError("steps must be 1-50")
    final_prompt = compose_prompt(prompt, greenscreen=greenscreen)
    if not final_prompt:
        raise NaiError("prompt is empty")
    w, h = resolve_size(size, width, height)
    parameters: dict[str, Any] = {
        "params_version": 3,
        "width": w,
        "height": h,
        "scale": scale,
        "sampler": sampler,
        "steps": steps,
        "n_samples": n_samples,
        "ucPreset": 0,
        "qualityToggle": True,
        "autoSmea": False,
        "dynamic_thresholding": False,
        "controlnet_strength": 1,
        "legacy": False,
        "add_original_image": True,
        "cfg_rescale": 0,
        "noise_schedule": "karras",
        "legacy_v3_extend": False,
        "legacy_uc": False,
        "negative_prompt": negative,
        "seed": int(seed) if seed else 0,
    }
    if is_v4_model(model):
        parameters["v4_prompt"] = {
            "caption": {"base_caption": final_prompt, "char_captions": []},
            "use_coords": False,
            "use_order": True,
        }
        parameters["v4_negative_prompt"] = {
            "caption": {"base_caption": negative, "char_captions": []},
            "legacy_uc": False,
        }
    return {
        "input": final_prompt,
        "model": model,
        "action": "generate",
        "parameters": parameters,
    }


def _request(url: str, token: str, *, data: bytes | None = None, accept: str = "application/json") -> bytes:
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": accept,
        "User-Agent": "sakurayo-nai-pipeline/1.0",
    }
    if data is not None:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method="POST" if data is not None else "GET")
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            return resp.read()
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise NaiError(redact(f"NAI HTTP {exc.code}: {body[:400]}", token)) from None
    except urllib.error.URLError as exc:
        raise NaiError(f"NAI network error: {exc.reason}") from None


def check_subscription(token: str) -> dict[str, Any]:
    raw = _request(f"{USER_API}/user/subscription", token)
    info = json.loads(raw.decode("utf-8"))
    expires = info.get("expiresAt")
    expires_text = None
    if isinstance(expires, (int, float)) and expires > 0:
        expires_text = datetime.fromtimestamp(expires, tz=timezone.utc).isoformat()
    steps_left = info.get("trainingStepsLeft") or {}
    return {
        "active": bool(info.get("active")),
        "tier": info.get("tier"),
        "tierName": TIER_NAMES.get(info.get("tier"), str(info.get("tier"))),
        "expiresAt": expires,
        "expiresAtUtc": expires_text,
        "isGracePeriod": bool(info.get("isGracePeriod")),
        "fixedTrainingStepsLeft": steps_left.get("fixedTrainingStepsLeft"),
        "purchasedTrainingSteps": steps_left.get("purchasedTrainingSteps"),
    }


def _decode_images(raw: bytes, token: str) -> list[bytes]:
    if raw[:2] == b"PK":
        images: list[bytes] = []
        with zipfile.ZipFile(io.BytesIO(raw)) as zf:
            for name in zf.namelist():
                if name.lower().endswith((".png", ".webp", ".jpg", ".jpeg")):
                    images.append(zf.read(name))
        if not images:
            raise NaiError("NAI zip contained no images")
        return images
    try:
        payload = json.loads(raw.decode("utf-8"))
    except UnicodeDecodeError as exc:
        raise NaiError(redact(f"NAI returned an unknown binary payload ({len(raw)} bytes)", token)) from exc
    images = []
    if isinstance(payload, dict):
        items = payload.get("images") or payload.get("data") or []
    else:
        items = payload
    for item in items:
        encoded = item.get("image") if isinstance(item, dict) else item
        if not encoded:
            continue
        images.append(base64.b64decode(encoded))
    if not images:
        raise NaiError(redact(f"NAI JSON contained no images: {str(payload)[:200]}", token))
    return images


def generate_image(token: str, payload: dict[str, Any]) -> list[bytes]:
    raw = _request(
        f"{IMAGE_API}/ai/generate-image",
        token,
        data=json.dumps(payload).encode("utf-8"),
        accept="application/json",
    )
    return _decode_images(raw, token)


def load_jobs(path: Path) -> list[dict[str, Any]]:
    jobs: list[dict[str, Any]] = []
    text = path.read_text(encoding="utf-8")
    if path.suffix.lower() == ".jsonl":
        for line_no, line in enumerate(text.splitlines(), 1):
            raw = line.strip()
            if not raw or raw.startswith("#"):
                continue
            try:
                jobs.append(json.loads(raw))
            except json.JSONDecodeError as exc:
                raise NaiError(f"Invalid JSONL at {path}:{line_no}: {exc}") from exc
    else:
        data = json.loads(text)
        if isinstance(data, dict):
            jobs = list(data.get("jobs") or [])
        elif isinstance(data, list):
            jobs = data
        else:
            raise NaiError(f"Unsupported jobs file: {path}")
    for job in jobs:
        if not job.get("id"):
            raise NaiError("Each NAI job needs an id")
        if not job.get("prompt"):
            raise NaiError(f"Job {job['id']} is missing prompt")
    return jobs


def job_to_payload(job: dict[str, Any]) -> dict[str, Any]:
    return build_payload(
        job["prompt"],
        model=job.get("model") or DEFAULT_MODEL,
        size=job.get("size"),
        width=job.get("width"),
        height=job.get("height"),
        negative=job.get("negative") or DEFAULT_NEGATIVE,
        steps=int(job.get("steps") or 28),
        scale=float(job.get("scale") or 6.0),
        sampler=job.get("sampler") or DEFAULT_SAMPLER,
        seed=int(job.get("seed") or 0),
        greenscreen=bool(job.get("greenscreen")),
        n_samples=int(job.get("n_samples") or 1),
    )


def safe_job_id(job_id: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9._-]+", "_", job_id).strip("._")
    if not cleaned:
        raise NaiError("job id is empty after sanitizing")
    return cleaned


def write_pngs(images: list[bytes], out_path: Path) -> list[Path]:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []
    if len(images) == 1:
        out_path.write_bytes(images[0])
        written.append(out_path)
        return written
    stem, suffix = out_path.stem, out_path.suffix or ".png"
    for index, data in enumerate(images):
        dest = out_path.with_name(f"{stem}_{index}{suffix}")
        dest.write_bytes(data)
        written.append(dest)
    return written


def sleep_between(seconds: float = 1.5) -> None:
    if seconds > 0:
        time.sleep(seconds)
