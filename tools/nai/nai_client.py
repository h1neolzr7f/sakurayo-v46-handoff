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
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
IMAGE_API = "https://image.novelai.net"
USER_API = "https://image.novelai.net"
DEFAULT_MODEL = "nai-diffusion-4-5-full"
FREE_MAX_PIXELS = 1024 * 1024
FREE_MAX_STEPS = 28
FREE_MAX_LONG_EDGE = 1216
DEFAULT_SAMPLER = "k_euler_ancestral"
DEFAULT_SCALE = 5.0
DEFAULT_NEGATIVE = (
    "blurry, lowres, error, film grain, scan artifacts, worst quality, bad quality, "
    "jpeg artifacts, very displeasing, chromatic aberration, logo, dated, signature, "
    "multiple views, watermark, text, letters, numbers, speech bubble, ui, "
    "english text, chinese text"
)
SFW_NEGATIVE = "nsfw, explicit, nude, nipples, pussy, penis, sex, uncensored"
NSFW_TAGS = "nsfw, explicit, uncensored"
MINOR_PROMPT_RE = re.compile(
    r"\b(loli|shota|child|children|underage|prepubescent|toddler|kid|kids|"
    r"little girl|little boy|young girl|young boy)\b",
    re.IGNORECASE,
)
GREEN_SCREEN_TAGS = (
    "solid bright green background, chroma key, #00ff00, no shadow, no floor, "
    "no gradient, no scenery"
)
DEFAULT_ARTIST_STRING = (
    "artist:ciloranko, artist:sho (sho l tw), artist:qhi, artist:reoen, "
    "artist:onineko, artist:wada arco, year 2024"
)
CR_CANVAS = (1024, 1536)
DEFAULT_CR_STRENGTH = 0.65
DEFAULT_CR_FIDELITY = 0.5

SIZE_PRESETS = {
    "small": (512, 768),
    "small_landscape": (768, 512),
    "small_square": (640, 640),
    "portrait": (832, 1216),
    "landscape": (1216, 832),
    "square": (1024, 1024),
    "portrait_large": (1024, 1536),
    "landscape_wide": (1536, 1024),
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


class NaiHttpError(NaiError):
    def __init__(
        self,
        message: str,
        *,
        status: int | None = None,
        retry_safe: bool = False,
        billing_uncertain: bool = False,
        free_blocked: bool = False,
    ) -> None:
        super().__init__(message)
        self.status = status
        self.retry_safe = retry_safe
        self.billing_uncertain = billing_uncertain
        self.free_blocked = free_blocked


@dataclass
class CompileResult:
    payload: dict[str, Any]
    snapshot: dict[str, Any]
    dest: Path
    job_id: str = ""
    character_ref_paths: list[str] = field(default_factory=list)


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


def is_free_quota(
    width: int,
    height: int,
    steps: int = 28,
    n_samples: int = 1,
    *,
    has_reference: bool = False,
    smea: bool = False,
) -> bool:
    if has_reference or smea:
        return False
    return (
        n_samples == 1
        and steps <= FREE_MAX_STEPS
        and max(width, height) <= FREE_MAX_LONG_EDGE
        and width * height <= FREE_MAX_PIXELS
    )


def payload_smea(payload: dict[str, Any]) -> bool:
    params = payload.get("parameters") or {}
    return bool(params.get("autoSmea") or params.get("sm") or params.get("sm_dyn"))


def classify_http_error(status: int, body: str) -> NaiHttpError:
    text = body[:400]
    message = f"NAI HTTP {status}: {text}"
    lowered = text.lower()
    if status == 429:
        return NaiHttpError(message, status=status, retry_safe=True)
    if status >= 500:
        return NaiHttpError(message, status=status, retry_safe=False, billing_uncertain=True)
    if "free generations are unavailable" in lowered:
        return NaiHttpError(message, status=status, retry_safe=True, free_blocked=True)
    if status in (401, 403):
        return NaiHttpError(message, status=status, retry_safe=False)
    return NaiHttpError(message, status=status, retry_safe=status < 500)


def fit_opus_free_size(width: int, height: int) -> tuple[int, int, bool]:
    if width <= 0 or height <= 0:
        return 832, 1216, True
    long_edge = max(width, height)
    pixel_count = width * height
    if long_edge <= FREE_MAX_LONG_EDGE and pixel_count <= FREE_MAX_PIXELS:
        return width, height, False
    scale = min(FREE_MAX_LONG_EDGE / long_edge, (FREE_MAX_PIXELS / pixel_count) ** 0.5)
    new_width = max(64, int(width * scale // 64) * 64)
    new_height = max(64, int(height * scale // 64) * 64)
    while new_width * new_height > FREE_MAX_PIXELS:
        if new_width >= new_height and new_width > 64:
            new_width -= 64
        elif new_height > 64:
            new_height -= 64
        else:
            break
    return new_width, new_height, True


def payload_has_reference(payload: dict[str, Any]) -> bool:
    params = payload.get("parameters") or {}
    return bool(params.get("director_reference_images"))


def assert_free_quota(payload: dict[str, Any], *, spend_anlas: bool = False) -> None:
    params = payload["parameters"]
    width = int(params["width"])
    height = int(params["height"])
    steps = int(params["steps"])
    n_samples = int(params["n_samples"])
    if is_free_quota(
        width,
        height,
        steps,
        n_samples,
        has_reference=payload_has_reference(payload),
        smea=payload_smea(payload),
    ):
        return
    if spend_anlas:
        return
    raise NaiError(
        f"{width}x{height} steps={steps} n={n_samples} refs={int(payload_has_reference(payload))} "
        "would spend Anlas. Opus free quota is 1 image, <=28 steps, <=1024x1024, no reference. "
        "Use a small/normal preset, or pass --spend-anlas."
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


def compose_negative(negative: str | None = None, *, nsfw: bool = False) -> str:
    text = " ".join((negative or DEFAULT_NEGATIVE).split())
    if not nsfw and SFW_NEGATIVE not in text:
        text = f"{text}, {SFW_NEGATIVE}" if text else SFW_NEGATIVE
    return text


def compose_prompt(prompt: str, *, greenscreen: bool = False, artist: str | bool | None = True, nsfw: bool = False) -> str:
    text = " ".join((prompt or "").split())
    if nsfw:
        if MINOR_PROMPT_RE.search(text):
            raise NaiError("NSFW mode refuses minor-related prompts")
        if "adult" not in text.lower():
            text = f"adult, {text}" if text else "adult"
        if "nsfw" not in text.lower():
            text = f"{NSFW_TAGS}, {text}" if text else NSFW_TAGS
    artist_text = ""
    if artist is True:
        artist_text = DEFAULT_ARTIST_STRING
    elif isinstance(artist, str) and artist.strip() and artist.strip().lower() not in {"0", "false", "off", "none"}:
        artist_text = " ".join(artist.split())
    if artist_text and artist_text not in text:
        text = f"{artist_text}, {text}" if text else artist_text
    if greenscreen and "chroma key" not in text.lower() and "#00ff00" not in text:
        text = f"{text}, {GREEN_SCREEN_TAGS}" if text else GREEN_SCREEN_TAGS
    return text


def is_v4_model(model: str) -> bool:
    name = (model or "").lower()
    return "nai-diffusion-4" in name or name.startswith("nai-diffusion-4")


def encode_character_ref(path: Path, canvas: tuple[int, int] = CR_CANVAS) -> str:
    try:
        from PIL import Image
    except ImportError as exc:
        raise NaiError("Character reference needs Pillow. pip install pillow") from exc
    if not path.is_file():
        raise NaiError(f"Character reference not found: {path}")
    source = Image.open(path).convert("RGBA")
    opaque = Image.new("RGBA", source.size, (0, 0, 0, 255))
    opaque.alpha_composite(source)
    rgb = opaque.convert("RGB")
    target_w, target_h = canvas
    scale = min(target_w / rgb.width, target_h / rgb.height)
    new_w = max(1, int(rgb.width * scale))
    new_h = max(1, int(rgb.height * scale))
    rgb = rgb.resize((new_w, new_h), Image.Resampling.LANCZOS)
    canvas_im = Image.new("RGB", canvas, (0, 0, 0))
    canvas_im.paste(rgb, ((target_w - new_w) // 2, (target_h - new_h) // 2))
    buf = io.BytesIO()
    canvas_im.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("ascii")


def attach_character_refs(
    parameters: dict[str, Any],
    paths: list[Path],
    *,
    strength: float = DEFAULT_CR_STRENGTH,
    fidelity: float = DEFAULT_CR_FIDELITY,
) -> None:
    if not paths:
        return
    if strength < 0 or strength > 1 or fidelity < 0 or fidelity > 1:
        raise NaiError("Character reference strength/fidelity must be 0-1")
    images = [encode_character_ref(path) for path in paths]
    parameters["director_reference_images"] = images
    parameters["director_reference_descriptions"] = [
        {"caption": {"base_caption": "character", "char_captions": []}, "legacy_uc": False}
        for _ in images
    ]
    parameters["director_reference_strength_values"] = [float(strength)] * len(images)
    parameters["director_reference_secondary_strength_values"] = [1.0 - float(fidelity)] * len(images)
    parameters["director_reference_information_extracted"] = [1.0] * len(images)


def resolve_ref_paths(raw_paths: list[str] | None) -> list[Path]:
    paths: list[Path] = []
    for item in raw_paths or []:
        path = Path(item)
        if not path.is_absolute():
            path = ROOT / path
        paths.append(path)
    return paths


def with_paid_size(payload: dict[str, Any]) -> dict[str, Any]:
    paid = dict(payload)
    params = dict(payload["parameters"])
    if int(params["height"]) >= int(params["width"]):
        params["width"], params["height"] = SIZE_PRESETS["portrait_large"]
    else:
        params["width"], params["height"] = SIZE_PRESETS["landscape_wide"]
    paid["parameters"] = params
    return paid


def build_payload(
    prompt: str,
    *,
    model: str = DEFAULT_MODEL,
    size: str | None = "portrait",
    width: int | None = None,
    height: int | None = None,
    negative: str = DEFAULT_NEGATIVE,
    steps: int = 28,
    scale: float = DEFAULT_SCALE,
    sampler: str = DEFAULT_SAMPLER,
    seed: int = 0,
    greenscreen: bool = False,
    n_samples: int = 1,
    artist: str | bool | None = True,
    character_refs: list[Path] | None = None,
    cr_strength: float = DEFAULT_CR_STRENGTH,
    cr_fidelity: float = DEFAULT_CR_FIDELITY,
    nsfw: bool = False,
) -> dict[str, Any]:
    if n_samples < 1 or n_samples > 4:
        raise NaiError("n_samples must be 1-4")
    if steps < 1 or steps > 50:
        raise NaiError("steps must be 1-50")
    final_prompt = compose_prompt(prompt, greenscreen=greenscreen, artist=artist, nsfw=nsfw)
    if not final_prompt:
        raise NaiError("prompt is empty")
    final_negative = compose_negative(negative, nsfw=nsfw)
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
        "negative_prompt": final_negative,
        "seed": int(seed) if seed else 0,
    }
    if is_v4_model(model):
        parameters["v4_prompt"] = {
            "caption": {"base_caption": final_prompt, "char_captions": []},
            "use_coords": False,
            "use_order": True,
        }
        parameters["v4_negative_prompt"] = {
            "caption": {"base_caption": final_negative, "char_captions": []},
            "legacy_uc": False,
        }
    attach_character_refs(
        parameters,
        list(character_refs or []),
        strength=cr_strength,
        fidelity=cr_fidelity,
    )
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
        raise classify_http_error(exc.code, redact(body, token)) from None
    except TimeoutError as exc:
        raise NaiHttpError(
            f"NAI request timed out after send: {exc}",
            retry_safe=False,
            billing_uncertain=True,
        ) from exc
    except urllib.error.URLError as exc:
        reason = str(exc.reason)
        raise NaiHttpError(
            f"NAI network error: {reason}",
            retry_safe=True,
            billing_uncertain=False,
        ) from None


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
    artist = job.get("artist", True)
    return build_payload(
        job["prompt"],
        model=job.get("model") or DEFAULT_MODEL,
        size=job.get("size"),
        width=job.get("width"),
        height=job.get("height"),
        negative=job.get("negative") or DEFAULT_NEGATIVE,
        steps=int(job.get("steps") or 28),
        scale=float(job.get("scale") or DEFAULT_SCALE),
        sampler=job.get("sampler") or DEFAULT_SAMPLER,
        seed=int(job.get("seed") or 0),
        greenscreen=bool(job.get("greenscreen")),
        n_samples=int(job.get("n_samples") or 1),
        artist=artist,
        character_refs=resolve_ref_paths(job.get("character_refs") or job.get("char_refs")),
        cr_strength=float(job.get("cr_strength") or DEFAULT_CR_STRENGTH),
        cr_fidelity=float(job.get("cr_fidelity") or DEFAULT_CR_FIDELITY),
        nsfw=bool(job.get("nsfw")),
    )


def snapshot_from_compile(
    payload: dict[str, Any],
    *,
    job_id: str = "",
    dest: Path | None = None,
    character_ref_paths: list[str] | None = None,
    resized: bool = False,
    nsfw: bool = False,
) -> dict[str, Any]:
    params = payload["parameters"]
    has_ref = payload_has_reference(payload)
    smea = payload_smea(payload)
    free = is_free_quota(
        int(params["width"]),
        int(params["height"]),
        int(params["steps"]),
        int(params["n_samples"]),
        has_reference=has_ref,
        smea=smea,
    )
    reasons: list[str] = []
    if has_ref:
        reasons.append("character_reference")
    if smea:
        reasons.append("smea")
    if int(params["steps"]) > FREE_MAX_STEPS:
        reasons.append("steps")
    if max(int(params["width"]), int(params["height"])) > FREE_MAX_LONG_EDGE:
        reasons.append("long_edge")
    if int(params["width"]) * int(params["height"]) > FREE_MAX_PIXELS:
        reasons.append("pixels")
    if int(params["n_samples"]) != 1:
        reasons.append("n_samples")
    return {
        "id": job_id,
        "out": str(dest) if dest else "",
        "frozen": True,
        "model": payload["model"],
        "action": payload["action"],
        "input": payload["input"],
        "width": params["width"],
        "height": params["height"],
        "steps": params["steps"],
        "scale": params["scale"],
        "sampler": params["sampler"],
        "seed": params.get("seed", 0),
        "artist": payload["input"].startswith("artist:"),
        "characterRefCount": len(params.get("director_reference_images") or []),
        "characterRefType": "character" if has_ref else None,
        "characterRefPaths": list(character_ref_paths or []),
        "freeEligible": free,
        "wouldSpendAnlas": not free,
        "resizedToFree": resized,
        "spendReasons": reasons,
        "nsfw": bool(nsfw),
    }


def compile_job(job: dict[str, Any], *, dest: Path | None = None) -> CompileResult:
    payload = job_to_payload(job)
    ref_paths = [str(path) for path in resolve_ref_paths(job.get("character_refs") or job.get("char_refs"))]
    job_id = str(job.get("id") or "")
    if dest is not None:
        out = dest
    elif job.get("out"):
        out = Path(job["out"])
        if not out.is_absolute():
            out = ROOT / out
    else:
        out = ROOT / "assets" / "image2" / "source" / "nai" / f"{safe_job_id(job_id) or 'manual'}.png"
    snapshot = snapshot_from_compile(
        payload,
        job_id=job_id,
        dest=out,
        character_ref_paths=ref_paths,
        nsfw=bool(job.get("nsfw")),
    )
    return CompileResult(
        payload=payload,
        snapshot=snapshot,
        dest=out,
        job_id=job_id,
        character_ref_paths=ref_paths,
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
