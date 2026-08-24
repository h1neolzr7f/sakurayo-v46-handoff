"""Sakurayo NAI v4.5 prompts: artist string, official quality tags, locked characters."""
from __future__ import annotations

from typing import Literal

Shot = Literal["live", "portrait", "dialogue"]

# Clean official-game CG, not the loli-weighted 5-pack (no baku-p / tsubasa).
# ciloranko + tianliang + sho = common v4.5 干净底；hiten + anmi 往二游官图/战术少女靠。
ARTIST_STRING = (
    "{artist:ciloranko}, [artist:tianliang duohe fangdongye], "
    "[artist:sho (sho lwlw)], artist:hiten, artist:anmi"
)

# V4.5 Full official quality set, but omit `location` (it fights greenscreen).
QUALITY_TAGS = (
    "best quality, amazing quality, very aesthetic, masterpiece, absurdres, no text"
)
YEAR_TAGS = "year 2024"
STYLE_TAGS = "official art, game cg, cel shading, clean lineart, detailed face, detailed eyes"
ADULT = "1girl, solo, adult woman, 20 years old"

NEGATIVE = (
    "nsfw, nude, explicit, child, loli, shota, lowres, worst quality, bad quality, "
    "displeasing, very displeasing, jpeg artifacts, scan artifacts, watermark, logo, "
    "text, signature, artist name, twitter username, error, extra fingers, extra limbs, "
    "mutated hands, poorly drawn face, blurry, chromatic aberration, multiple views, "
    "artistic error, film grain, extra heads, cropped, out of frame, bad anatomy, "
    "3d, realistic, photorealistic, western comic, furry"
)

CHARS: dict[str, dict[str, str]] = {
    "sayo": {
        "name": "月城小夜",
        "identity": (
            "long hair, dark purple hair, straight bangs, sidelocks, purple eyes, "
            "cherry blossom hair ornament, pink flower, white tassel, light blush, "
            "gentle expression, looking at viewer"
        ),
        "outfit": (
            "white haori, sakura print, cherry blossom print, "
            "dark blue serafuku, dark blue pleated skirt, red corded necktie, "
            "black pantyhose, dark blue combat boots, fingerless gloves, thigh strap, "
            "fully clothed, safe for work"
        ),
        "weapon": (
            "holding assault rifle, white rifle, sakura print weapon, holographic sight, "
            "rifle held across chest, muzzle up"
        ),
    },
    "aya": {
        "name": "神代绫",
        "identity": (
            "short hair, silver hair, white hair, messy hair, bangs, blue eyes, "
            "blue ribbon, side braid, confident smirk, looking at viewer"
        ),
        "outfit": (
            "white tactical jacket, black collared shirt, blue necktie, epaulettes, "
            "black pleated miniskirt, blue stripe, black pantyhose, white combat boots, "
            "fingerless gloves, tactical belt, thigh holster, fully clothed, safe for work"
        ),
        "weapon": (
            "holding pistol, handgun in right hand, katana at hip, blue scabbard, "
            "sheathed sword, muzzle down"
        ),
    },
    "rion": {
        "name": "黑羽凛音",
        "identity": (
            "very long hair, black hair, red inner hair, blunt bangs, red eyes, "
            "red hair ribbon, calm expression, looking at viewer"
        ),
        "outfit": (
            "black haori, red floral print, red lining, gold emblem, high collar, "
            "black pleated skirt, red trim, black pantyhose, black heeled combat boots, "
            "red laces, fingerless gloves, gold buckle, fully clothed, safe for work"
        ),
        "weapon": (
            "holding katana, single sword, one sword, no extra swords, "
            "red hilt wrap, gold tsuba, black scabbard, red sageo, blade down"
        ),
    },
}

SHOTS: dict[str, dict[str, str]] = {
    "live": {
        "framing": "full body, standing, facing viewer, entire body in frame, head to toe, shoes visible",
        "background": "simple background, chroma key, #00ff00, neon green background, solid color background",
        "negative": "location, scenery, cityscape, detailed background, shadow on ground, floor, "
        "multiple girls, cowboy shot, close-up, portrait, cropped legs, missing feet",
        "size": "portrait",
    },
    "portrait": {
        "framing": "upper body, portrait, looking at viewer, face focus, head complete",
        "background": "simple background, black background, solid color background",
        "negative": "location, scenery, full body, extra people, text, frame, circle crop, border",
        "size": "portrait",
    },
    "dialogue": {
        "framing": "cowboy shot, upper body, looking at viewer, head complete",
        "background": "simple background, chroma key, #00ff00, neon green background, solid color background",
        "negative": "location, scenery, cityscape, detailed background, shadow on ground, text",
        "size": "portrait",
    },
}


def compose_prompt(char_id: str, shot: Shot = "live", extra: str = "") -> tuple[str, str]:
    if char_id not in CHARS:
        raise ValueError(f"unknown char {char_id!r}; use {sorted(CHARS)}")
    if shot not in SHOTS:
        raise ValueError(f"unknown shot {shot!r}; use {sorted(SHOTS)}")
    ch, sh = CHARS[char_id], SHOTS[shot]
    parts = [
        ARTIST_STRING,
        YEAR_TAGS,
        ADULT,
        ch["identity"],
        ch["outfit"],
        ch["weapon"],
        sh["framing"],
        sh["background"],
        extra,
        STYLE_TAGS,
        QUALITY_TAGS,
    ]
    prompt = ", ".join(p.strip().strip(",") for p in parts if p and p.strip())
    negative = f"{NEGATIVE}, {sh['negative']}"
    return prompt, negative


CHAR_PRESETS = {cid: compose_prompt(cid, "live")[0] for cid in CHARS}
