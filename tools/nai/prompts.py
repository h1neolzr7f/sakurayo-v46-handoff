"""Sakurayo NAI v4.5 prompts: artist string, official quality tags, locked characters."""
from __future__ import annotations

from typing import Literal

Shot = Literal["live", "portrait", "dialogue"]
Kind = Literal["char", "scene", "prop"]

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
SCENE_STYLE = "official art, game cg, anime background, scenery, cel shading, clean lineart, cinematic lighting"
PROP_STYLE = "official art, game cg, item illustration, cel shading, clean lineart, product shot"
ADULT = "1girl, solo, adult woman, 20 years old"

NEGATIVE = (
    "nsfw, nude, explicit, child, loli, shota, lowres, worst quality, bad quality, "
    "displeasing, very displeasing, jpeg artifacts, scan artifacts, watermark, logo, "
    "text, signature, artist name, twitter username, error, extra fingers, extra limbs, "
    "mutated hands, poorly drawn face, blurry, chromatic aberration, multiple views, "
    "artistic error, film grain, extra heads, cropped, out of frame, bad anatomy, "
    "3d, realistic, photorealistic, western comic, furry"
)
SCENE_NEGATIVE = (
    "people, person, human, 1girl, 1boy, 2girls, multiple girls, character focus, "
    "portrait, close-up face, letterbox, black bars, border, frame, picture frame, "
    "collage, split screen, comic panel, speech bubble, ui, hud, watermark, logo, "
    "text, chinese text, english text, signage, title, signature"
)
PROP_NEGATIVE = (
    "people, person, 1girl, 1boy, full body, landscape, cityscape, letterbox, "
    "black bars, border, frame, text, watermark, logo, signature"
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

# Non-protagonist scenery. Landscape Normal 1216x832, then cover-fit to canvas.
# Do NOT put sayo / aya / rion here.
SCENES: dict[str, dict] = {
    "lobby_wide": {
        "size": "landscape",
        "canvas": (1600, 900),
        "dest": "ui/lobby_wide.webp",
        "seed": 20260831,
        "subject": (
            "scenery, location, no humans, no characters, "
            "widescreen landscape, full bleed, edge to edge, no letterbox, no black bars, "
            "night, full moon, japanese shrine terrace overlooking neon city skyline, "
            "vermilion torii gate, stone lanterns glowing warm orange, wet stone pavement, "
            "cherry blossom trees in bloom, falling sakura petals, purple night sky, "
            "cyberpunk city lights in the distance, atmospheric fog, "
            "cinematic wide establishing shot, empty walkway, game lobby background"
        ),
    },
    "shop_wide": {
        "size": "landscape",
        "canvas": (1600, 900),
        "dest": "ui/shop_wide.webp",
        "seed": 20260832,
        "subject": (
            "scenery, location, no humans, no characters, "
            "widescreen interior of a night sakura shrine souvenir shop, "
            "wooden counter, paper lanterns, hanging ofuda charms, sakura noren curtains, "
            "gold and purple lighting, empty shop interior, wide establishing shot, "
            "game store background, blank signs, no readable writing"
        ),
    },
    "archive_wide": {
        "size": "landscape",
        "canvas": (1600, 900),
        "dest": "ui/archive_wide.webp",
        "seed": 20260833,
        "subject": (
            "scenery, location, no humans, no characters, "
            "widescreen night archive hall inside a shrine, tall shelves of scrolls, "
            "cracked golden mirrors, moonlit windows, sakura petals on the floor, "
            "purple and gold lighting, empty corridor, game archive background, "
            "blank book spines, no readable writing"
        ),
    },
    "stage_1": {
        "size": "landscape",
        "canvas": (1600, 900),
        "dest": "stages/stage_1/battle_bg.webp",
        "seed": 20260834,
        "subject": (
            "scenery, location, no humans, no characters, "
            "widescreen battle background, japanese shrine approach at night, "
            "cracked stone path through the center, red torii gates, stone lanterns, "
            "cherry blossom trees, distant city skyline, full moon, "
            "empty playable ground, slightly high angle, game battle background"
        ),
    },
    "stage_2": {
        "size": "landscape",
        "canvas": (1600, 900),
        "dest": "stages/stage_2/battle_bg.webp",
        "seed": 20260835,
        "subject": (
            "scenery, location, no humans, no characters, "
            "widescreen battle background, wet neon rain street at night, "
            "magenta cherry blossom trees, cyberpunk buildings, puddles reflecting lights, "
            "empty road through the center, slightly high angle, purple and cyan neon, "
            "game battle background"
        ),
    },
    "stage_3": {
        "size": "landscape",
        "canvas": (1600, 900),
        "dest": "stages/stage_3/battle_bg.webp",
        "seed": 20260836,
        "subject": (
            "scenery, location, no humans, no characters, "
            "widescreen battle background, sword graveyard at night, "
            "hundreds of katanas planted in the earth, stone path through the center, "
            "rocky cliffs, red maple leaves, blue spirit lights, crescent moon, "
            "empty playable path, slightly high angle, game battle background"
        ),
    },
    "stage_4": {
        "size": "landscape",
        "canvas": (1600, 900),
        "dest": "stages/stage_4/battle_bg.webp",
        "seed": 20260837,
        "subject": (
            "scenery, location, no humans, no characters, "
            "widescreen battle background, floating circular stone arena above a neon city, "
            "glowing sakura emblem on the floor, cracked golden mirrors floating around, "
            "purple night sky, empty arena floor in the center, slightly high angle, "
            "game battle background"
        ),
    },
}

# Faceless remnants / still-life props. Portrait 832x1216 then cover-fit to 768x1024.
PROPS: dict[str, dict] = {
    "night_radio": {
        "size": "portrait",
        "canvas": (768, 1024),
        "dest": "gacha/night_radio.webp",
        "seed": 20260841,
        "subject": (
            "still life, no humans, vintage portable radio on a wooden railing at night, "
            "sakura painted on the radio, glowing pink tuning dial, full moon, "
            "stone lantern, falling petals, item illustration, centered object"
        ),
    },
    "shrine_seal": {
        "size": "portrait",
        "canvas": (768, 1024),
        "dest": "gacha/shrine_seal.webp",
        "seed": 20260842,
        "subject": (
            "still life, no humans, aged ofuda talisman paper hanging at a night shrine, "
            "red mystic circles, crimson cord, stone lanterns, falling sakura petals, "
            "item illustration, centered object, no readable writing"
        ),
    },
    "void_ticket": {
        "size": "portrait",
        "canvas": (768, 1024),
        "dest": "gacha/void_ticket.webp",
        "seed": 20260843,
        "subject": (
            "still life, no humans, ornate gold ticket floating in a purple void, "
            "filigree, cracked glass shards, one sakura petal, item illustration, "
            "centered object, no readable writing"
        ),
    },
    "cherry_crown": {
        "size": "portrait",
        "canvas": (768, 1024),
        "dest": "gacha/cherry_crown.webp",
        "seed": 20260844,
        "subject": (
            "still life, no humans, broken pink crystal crown with gold filigree floating, "
            "sakura ornaments, night shrine rooftops below, full moon, "
            "item illustration, centered object"
        ),
    },
}


def compose_scene_prompt(scene_id: str, extra: str = "") -> tuple[str, str]:
    if scene_id not in SCENES:
        raise ValueError(f"unknown scene {scene_id!r}; use {sorted(SCENES)}")
    scene = SCENES[scene_id]
    parts = [
        ARTIST_STRING,
        YEAR_TAGS,
        scene["subject"],
        extra,
        SCENE_STYLE,
        QUALITY_TAGS,
    ]
    prompt = ", ".join(p.strip().strip(",") for p in parts if p and p.strip())
    extra_neg = scene.get("negative", "")
    negative = ", ".join(p for p in (NEGATIVE, SCENE_NEGATIVE, extra_neg) if p)
    return prompt, negative


def compose_prop_prompt(prop_id: str, extra: str = "") -> tuple[str, str]:
    if prop_id not in PROPS:
        raise ValueError(f"unknown prop {prop_id!r}; use {sorted(PROPS)}")
    prop = PROPS[prop_id]
    parts = [
        ARTIST_STRING,
        YEAR_TAGS,
        prop["subject"],
        extra,
        PROP_STYLE,
        QUALITY_TAGS,
    ]
    prompt = ", ".join(p.strip().strip(",") for p in parts if p and p.strip())
    extra_neg = prop.get("negative", "")
    negative = ", ".join(p for p in (NEGATIVE, PROP_NEGATIVE, extra_neg) if p)
    return prompt, negative
