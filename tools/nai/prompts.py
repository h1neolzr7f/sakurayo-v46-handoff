"""Sakurayo NAI v4.5 prompts: artist string, official quality tags, locked characters."""
from __future__ import annotations

from typing import Literal

Shot = Literal["live", "portrait", "dialogue"]
Kind = Literal["char", "scene", "prop", "person"]

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
PERSON_STYLE = "official art, game cg, character illustration, cel shading, clean lineart, detailed face, detailed eyes"
ADULT = "1girl, solo, adult woman, 20 years old"
ADULT_MAN = "1boy, solo, adult man, 25 years old, masculine"

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
PERSON_NEGATIVE = (
    "1girl, 2girls, multiple girls, woman, female protagonist, feminine body, "
    "long purple hair, silver hair, white hair, red inner hair, "
    "cherry blossom hair ornament, blue ribbon, red hair ribbon, "
    "child, loli, shota, nsfw, nude, letterbox, black bars, border, frame, "
    "text, watermark, logo, signature, extra heads, extra arms"
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
    "stage_1_cg": {
        "size": "landscape",
        "canvas": (1600, 900),
        "dest": "stages/stage_1/cg.webp",
        "seed": 20260851,
        "subject": (
            "scenery, location, no humans, no characters, "
            "widescreen cinematic story cg, night shrine outer street, "
            "vermilion torii gate, paper lanterns, wet stone path, "
            "cherry blossom trees in bloom, falling sakura petals, full moon, "
            "distant neon city glow, atmospheric fog, empty street, "
            "game chapter cg, full bleed, no letterbox"
        ),
    },
    "stage_2_cg": {
        "size": "landscape",
        "canvas": (1600, 900),
        "dest": "stages/stage_2/cg.webp",
        "seed": 20260852,
        "subject": (
            "scenery, location, no humans, no characters, "
            "widescreen cinematic story cg, rain neon shopping street at night, "
            "magenta cherry blossom trees, wet asphalt, puddles reflecting cyan and pink neon, "
            "empty crosswalk, abandoned cars in the distance, purple fog, "
            "game chapter cg, full bleed, no letterbox"
        ),
    },
    "stage_3_cg": {
        "size": "landscape",
        "canvas": (1600, 900),
        "dest": "stages/stage_3/cg.webp",
        "seed": 20260853,
        "subject": (
            "scenery, location, no humans, no characters, "
            "widescreen cinematic story cg, sword graveyard at night, "
            "hundreds of katanas planted in dark earth, stone stairs, "
            "red maple leaves, blue spirit lights, crescent moon, rocky cliffs, "
            "empty path, game chapter cg, full bleed, no letterbox"
        ),
    },
    "stage_4_cg": {
        "size": "landscape",
        "canvas": (1600, 900),
        "dest": "stages/stage_4/cg.webp",
        "seed": 20260854,
        "subject": (
            "scenery, location, no humans, no characters, "
            "widescreen cinematic story cg, shattered golden mirrors floating "
            "above a neon abyss, glowing sakura emblem, purple void sky, "
            "cracked glass shards, empty circular platform, "
            "game chapter cg, full bleed, no letterbox"
        ),
    },
    "banner_bg": {
        "size": "landscape",
        "canvas": (1280, 720),
        "dest": "gacha/banner_bg.webp",
        "seed": 20260855,
        "subject": (
            "scenery, location, no humans, no characters, "
            "widescreen gacha banner background, night shrine terrace, "
            "full moon, vermilion torii, falling sakura petals, "
            "neon city skyline far away, gold and purple lighting, "
            "empty walkway, game banner, full bleed, no letterbox, "
            "blank signs, no readable writing"
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
    "card_back": {
        "size": "portrait",
        "canvas": (768, 1024),
        "dest": "gacha/card_back.webp",
        "seed": 20260846,
        "subject": (
            "still life, no humans, ornate gacha card back, cracked golden hand mirror, "
            "sakura petals, purple void, gold filigree frame, centered object, "
            "item illustration, no readable writing, no letters"
        ),
    },
    "weapon_mirror_round": {
        "size": "portrait",
        "canvas": (768, 1024),
        "dest": "gacha/weapon_mirror_round.webp",
        "seed": 20260847,
        "subject": (
            "still life, no humans, round golden hand-mirror shield standing upright, "
            "cracked glass, sakura crest, gold rim, night shrine background soft blur, "
            "item illustration, centered weapon, no readable writing"
        ),
    },
    "weapon_shard_blade": {
        "size": "portrait",
        "canvas": (768, 1024),
        "dest": "gacha/weapon_shard_blade.webp",
        "seed": 20260848,
        "subject": (
            "still life, no humans, katana forged from gold glass shards, "
            "broken mirror blade, red wrapping on hilt, floating fragments, "
            "purple void, item illustration, centered weapon"
        ),
    },
    "weapon_radio_bat": {
        "size": "portrait",
        "canvas": (768, 1024),
        "dest": "gacha/weapon_radio_bat.webp",
        "seed": 20260849,
        "subject": (
            "still life, no humans, wooden baseball bat with a vintage portable radio "
            "taped near the grip, glowing pink dial, sakura sticker, night railing, "
            "item illustration, centered weapon"
        ),
    },
    "weapon_sayo_spare": {
        "size": "portrait",
        "canvas": (768, 1024),
        "dest": "gacha/weapon_sayo_spare.webp",
        "seed": 20260871,
        "subject": (
            "still life, no humans, stack of white rifle magazines with sakura print, "
            "one empty magazine standing, spare ammunition crate, night shrine stone, "
            "full moon, item illustration, centered object, no readable writing"
        ),
    },
    "weapon_sayo_petal": {
        "size": "portrait",
        "canvas": (768, 1024),
        "dest": "gacha/weapon_sayo_petal.webp",
        "seed": 20260872,
        "subject": (
            "still life, no humans, rifle magazine overflowing with pink sakura petals "
            "instead of bullets, petals spilling on wet stone, faint white rifle in soft blur, "
            "night shrine, item illustration, centered object"
        ),
    },
    "weapon_aya_side": {
        "size": "portrait",
        "canvas": (768, 1024),
        "dest": "gacha/weapon_aya_side.webp",
        "seed": 20260873,
        "subject": (
            "still life, no humans, silver pistol lying on its side muzzle pointing down, "
            "blue-sheathed katana beside it still sheathed, spent gold casings on wet pavement, "
            "full moon, item illustration, centered weapons"
        ),
    },
    "weapon_aya_twin": {
        "size": "portrait",
        "canvas": (768, 1024),
        "dest": "gacha/weapon_aya_twin.webp",
        "seed": 20260874,
        "subject": (
            "still life, no humans, silver pistol and unsheathed katana crossed, "
            "sakura petals on both, thin smoke from muzzle, night wet pavement, "
            "item illustration, centered weapons"
        ),
    },
    "weapon_rion_wood": {
        "size": "portrait",
        "canvas": (768, 1024),
        "dest": "gacha/weapon_rion_wood.webp",
        "seed": 20260875,
        "subject": (
            "still life, no humans, broken wooden bokken in two jagged pieces, "
            "splinters on dark wooden floor, moonlight through cracked circular window, "
            "item illustration, centered weapon"
        ),
    },
    "weapon_rion_under": {
        "size": "portrait",
        "canvas": (768, 1024),
        "dest": "gacha/weapon_rion_under.webp",
        "seed": 20260876,
        "subject": (
            "still life, no humans, cracked empty black scabbard standing upright, "
            "red cord tied around the split, no blade inside, sword graveyard blur, "
            "item illustration, centered object"
        ),
    },
    "weapon_sayo_final": {
        "size": "portrait",
        "canvas": (768, 1024),
        "dest": "gacha/weapon_sayo_final.webp",
        "seed": 20260877,
        "subject": (
            "still life, no humans, single glowing sakura-engraved rifle cartridge "
            "standing on an empty white rifle, last round, gold and pink, night shrine moon, "
            "legendary item illustration, centered object, no readable writing"
        ),
    },
    "weapon_aya_mirror": {
        "size": "portrait",
        "canvas": (768, 1024),
        "dest": "gacha/weapon_aya_mirror.webp",
        "seed": 20260878,
        "subject": (
            "still life, no humans, katana whose blade is cracked golden mirror glass, "
            "blue wrapping, gold tsuba, floating shards, purple void, "
            "legendary item illustration, centered weapon"
        ),
    },
    "weapon_rion_burial": {
        "size": "portrait",
        "canvas": (768, 1024),
        "dest": "gacha/weapon_rion_burial.webp",
        "seed": 20260879,
        "subject": (
            "still life, no humans, black funerary katana planted in earth like a gravestone, "
            "red maple leaves, blue spirit lights, sword graveyard, "
            "legendary item illustration, centered weapon"
        ),
    },
}

# The remnant man on last_witness. Not a fourth heroine; not sayo / aya / rion.
PEOPLE: dict[str, dict] = {
    "last_witness": {
        "size": "portrait",
        "canvas": (768, 1024),
        "dest": "gacha/last_witness.webp",
        "seed": 20260861,
        "subject": (
            f"{ADULT_MAN}, "
            "short messy black hair, amber eyes, tired expression, looking at viewer, "
            "dark navy haori, gold embroidery, faint sakura pattern, gold earrings, "
            "fully clothed, safe for work, "
            "standing behind shattered ornate golden oval mirror, cracked glowing glass, "
            "night shrine courtyard, paper lanterns, falling sakura petals, "
            "upper body, portrait, face focus, head complete, "
            "card illustration, witness, not a heroine"
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


def compose_person_prompt(person_id: str, extra: str = "") -> tuple[str, str]:
    if person_id not in PEOPLE:
        raise ValueError(f"unknown person {person_id!r}; use {sorted(PEOPLE)}")
    if person_id in CHARS:
        raise ValueError(f"refusing protagonist id {person_id!r}")
    person = PEOPLE[person_id]
    parts = [
        ARTIST_STRING,
        YEAR_TAGS,
        person["subject"],
        extra,
        PERSON_STYLE,
        QUALITY_TAGS,
    ]
    prompt = ", ".join(p.strip().strip(",") for p in parts if p and p.strip())
    extra_neg = person.get("negative", "")
    negative = ", ".join(p for p in (NEGATIVE, PERSON_NEGATIVE, extra_neg) if p)
    return prompt, negative
