"""Batch-4 catalogs: faceless combat sprites, emblem cards, leftover scenery.

Never put sayo / aya / rion here. School/job/fusion cards are still-life emblems,
not heroine portraits. Enemies are yokai/zombies, not cute girls.
"""
from __future__ import annotations

from prompts import (
    ARTIST_STRING,
    NEGATIVE,
    PROP_NEGATIVE,
    PROP_STYLE,
    QUALITY_TAGS,
    SCENE_NEGATIVE,
    SCENE_STYLE,
    YEAR_TAGS,
)

CREATURE_STYLE = (
    "official art, game cg, chibi monster sprite, cel shading, clean lineart, "
    "enemy unit, mascot monster"
)
CREATURE_NEGATIVE = (
    "1girl, 1boy, 2girls, cute girl, beautiful girl, cat ears, nekomimi, "
    "long purple hair, silver hair, white hair, red inner hair, "
    "cherry blossom hair ornament, blue ribbon, red hair ribbon, "
    "people, person, human face, photorealistic, location, scenery, "
    "letterbox, black bars, text, watermark, logo, signature, extra heads"
)
CREATURE_BASE = (
    "chibi monster, yokai, no humans, no 1girl, no cute girl, no cat ears, "
    "full body, standing, facing viewer, entire body in frame, feet visible, "
    "simple background, chroma key, #00ff00, neon green background, solid color background"
)

ICON_STYLE = "official art, game icon, item emblem, cel shading, clean lineart, centered symbol"


def _entry(size, canvas, dest, seed, subject):
    return {
        "size": size,
        "canvas": canvas,
        "dest": dest,
        "seed": seed,
        "subject": subject,
    }


def _creature(dest, seed, subject, canvas=(512, 512)):
    return _entry("portrait", canvas, dest, seed, f"{CREATURE_BASE}, {subject}")


ENEMY_LOOK = {
    "normal": "faceless shrine zombie, ofuda wrapping a blank head, torn white haori, clawed hands, pale grey skin, no face",
    "fast": "skinny sprinting corpse spirit, torn paper limbs, pink petal trails, blank mask, claws forward",
    "tank": "bulky stone lantern golem, cracked moss armor, shrine debris shield-belly, tiny glowing seal eyes",
    "ranged": "faceless archer revenant, ofuda arrows in a quiver, wooden bow, blank paper head",
    "bomb": "bloated talisman bomb yokai, paper charms strapped to a round body, burning fuse cord, no face",
    "shield": "walking cracked golden hand-mirror, short stone legs, shield-first pose, no human body",
    "disruptor": "radio-headed revenant, vintage portable radio for a head, sparking antenna, torn haori, no face",
    "purifier": "ofuda-wrapped mummy yokai, red mystic circles, crimson cords, blank head, no girl",
    "specter": "translucent blue shrine ghost wisp, tattered veil, no face, floating lantern core",
    "decay": "mushroom rotting corpse yokai, glowing pink fungi, crumbling wooden body, no face",
    "seal": "walking ofuda pillar, stacked talismans, stone feet, glowing red seal, no face",
    "elite": "gold-cracked mirror knight yokai, ornate purple armor, floating magenta eyes, no cute face",
    "pethunter": "beast-skulled hunter yokai, antlered bone mask, torn cloak, claw polearm, no girl",
    "noisecaller": "speaker-headed corpse, stacked radios, pink glowing dials, torn cords, no face",
    "souleater": "hollow gold-mouth spirit, cracked mirror torso, floating shards, no human face",
    "mirrorblade": "walking shard-blade yokai, body made of gold glass shards, katana arms, no face",
}

CREATURES: dict[str, dict] = {}
for i, eid in enumerate(ENEMY_LOOK):
    CREATURES[eid] = _creature(f"enemies/{eid}.webp", 20260901 + i, ENEMY_LOOK[eid])
    CREATURES[f"{eid}_b"] = _creature(
        f"enemies/{eid}_b.webp",
        20261001 + i,
        ENEMY_LOOK[eid] + ", animation frame 2, claw raised, weight shifted",
    )

BOSS_LOOK = {
    "stage1_phase1": "small cracked shrine mirror yokai, gold oval frame, paper charms, one magenta eye, chibi boss",
    "stage1_phase2": "shrine mirror yokai growing stone lantern arms, more floating eyes, torn vermilion cloth",
    "stage1_phase3": "multi-eyed shrine mirror beast, torii horns, sakura aura, cracked gold armor",
    "stage1_phase4": "final shrine mirror colossus, broken torii crown, storm of petals and ofuda, many magenta eyes",
    "stage2_phase1": "neon rain umbrella yokai, wet chrome, pink and cyan lights, no face, chibi boss",
    "stage2_phase2": "corporate mannequin yokai, void ticket body, neon cables, blank head",
    "stage2_phase3": "rain-street hydra of speaker heads, magenta neon, puddle reflections",
    "stage2_phase4": "final neon abyss boss, cracked billboard halo, storm of umbrellas, no girl",
    "stage3_phase1": "small sword-grave spirit, planted katana body, blue ghost lights, chibi boss",
    "stage3_phase2": "armor of a hundred broken katanas, red maple, crescent moon glow",
    "stage3_phase3": "sword mound beast, flying blades orbit, blue spirit fire, no face",
    "stage3_phase4": "final sword-grave colossus, forest of blades, red maple storm, hollow helmet",
    "stage4_phase1": "small floating golden shard core, sakura emblem, purple void, chibi boss",
    "stage4_phase2": "mirror-abyss knight, cracked gold plates, floating glass rings",
    "stage4_phase3": "void arena leviathan of shards, many gold mirrors, purple lightning",
    "stage4_phase4": "final shattered-mirror godcore, huge sakura seal, storm of gold glass, no face",
    "void_phase1": "tiny purple void seed, gold cracks, chibi boss, no face",
    "void_phase2": "void maw yokai, gold teeth, purple nebula body",
    "void_phase3": "void throne beast, broken ticket halo, many eyes of gold glass",
    "void_phase4": "final void cathedral colossus, crushed mirrors, purple abyss crown, no girl",
}
for i, (bid, look) in enumerate(BOSS_LOOK.items()):
    dest = (
        f"content-packs/maingod-void/bosses/{bid}.webp"
        if bid.startswith("void_")
        else f"bosses/{bid}.webp"
    )
    CREATURES[bid] = _creature(dest, 20260940 + i, look + ", larger than normal enemy, boss monster")

VOID_LOOK = {
    "voidling": "tiny purple void grub, gold cracks, chibi monster, no face",
    "voidmaw": "small purple maw yokai, gold teeth, floating, no girl",
}
for i, (vid, look) in enumerate(VOID_LOOK.items()):
    CREATURES[vid] = _creature(
        f"content-packs/maingod-void/enemies/{vid}.webp", 20260980 + i, look
    )
    CREATURES[f"{vid}_b"] = _creature(
        f"content-packs/maingod-void/enemies/{vid}_b.webp",
        20260984 + i,
        look + ", animation frame 2, mouth open",
    )

PET_LOOK = {
    "bat": "tiny crimson spirit bat, gold earrings, chibi familiar, no girl",
    "drone": "small sakura-painted scout drone, pink lens, chibi machine, no face",
    "familiar": "tiny paper shikigami fox, ofuda body, blue spirit fire, no girl",
    "wisp": "small pink soul wisp, lantern core, sakura trail, no face",
}
for i, (pid, look) in enumerate(PET_LOOK.items()):
    CREATURES[pid] = _creature(f"pets/{pid}.webp", 20260970 + i, look, canvas=(384, 384))
    CREATURES[f"{pid}_b"] = _creature(
        f"pets/{pid}_b.webp",
        20260974 + i,
        look + ", animation frame 2, wings or petals shifted",
        canvas=(384, 384),
    )

CARD_PROPS: dict[str, dict] = {}

SCHOOL_EMBLEM = {
    "school_shrine": "still life, no humans, white shrine rifle wrapped in ofuda, vermilion cord, stone lantern, night",
    "school_idol": "still life, no humans, vintage radio and unused microphone on an empty stage, pink spotlight, petals",
    "school_magical": "still life, no humans, cracked pink crystal crown and one unused glove, gold filigree, night shrine",
    "school_mech": "still life, no humans, crashed sakura-painted drone and a wrench, sparks, wet stone",
    "school_spore": "still life, no humans, glowing pink mushrooms overtaking a rifle grip, spores in moonlight",
    "school_gun": "still life, no humans, silver pistol and blue-sheathed katana on wet pavement, spent casings",
    "school_mage": "still life, no humans, gold void ticket sinking into a water-drawn magic circle, purple glow",
    "school_alch": "still life, no humans, cracked glass crucible with burning ofuda lid, green fumes",
    "school_ninja": "still life, no humans, kunai and torn shadow-cloak on a cracked mirror, no body",
    "school_vamp": "still life, no humans, empty ornate blood vial labeled with a blank seal, wilted rose, moonlight",
    "school_cult": "still life, no humans, snapped flying sword planted in a sword graveyard, blue spirit lights",
    "school_necro": "still life, no humans, soul-fire lantern and a nameless tablet, blue flame, night",
    "school_gene": "still life, no humans, cracked specimen vial with red crystal growth, lab lamp and torii shadow",
    "school_summon": "still life, no humans, burnt contract scroll and red binding cord, shadow taller than the paper",
}
for i, (cid, sub) in enumerate(SCHOOL_EMBLEM.items()):
    CARD_PROPS[cid] = _entry("portrait", (768, 1024), f"gacha/{cid}.webp", 20261001 + i, sub + ", item illustration, centered object, no readable writing")

JOB_EMBLEM = {
    "job_swarm": "still life, no humans, swarm of tiny sakura drones ignoring a glowing remote",
    "job_railLord": "still life, no humans, bent magnetic rail and a white rifle used as insulator, night sky",
    "job_hive": "still life, no humans, fungal hive swallowing a rifle, glowing pink spores",
    "job_garden": "still life, no humans, corpse-garden of glowing flowers, rifle used as a hoe, no body shown",
    "job_starIdol": "still life, no humans, sinking stage lights and a glowing cracked crown, unused glowsticks",
    "job_miracle": "still life, no humans, half-finished magical staff that is still a rifle, cracked gold crown",
    "job_exorcist": "still life, no humans, stamped voided ofuda on a shrine rifle, vermilion ink",
    "job_guardian": "still life, no humans, fallen yatagarasu feather pile at a torii, rifle leaning",
    "job_warSinger": "still life, no humans, microphone on a stage facing a dark crowd of silhouettes only, radio",
    "job_healingIdol": "still life, no humans, first-aid kit full of lyric sheets, unused microphone",
    "job_barrage": "still life, no humans, storm of spent casings and an empty silver pistol, blue sheath",
    "job_sniper": "still life, no humans, empty sniper cartridge on a rooftop, city neon, unused sidearm",
    "job_plagueDoctor": "still life, no humans, plague-doctor mask and a boiling crucible, green fumes",
    "job_philosopher": "still life, no humans, cracked philosopher stone slag in a dead furnace, gold dust",
    "job_bloodDuke": "still life, no humans, empty ducal goblet and a blank crown, dried rose",
    "job_batQueen": "still life, no humans, fallen bat-wing cloak and an empty throne, moonlight",
    "job_element": "still life, no humans, fire ice and lightning orbs crushing a gold ticket",
    "job_timeMage": "still life, no humans, shattered pocket watch fused to a magic circle, frozen second hand",
    "job_shadow": "still life, no humans, empty ninja cloak standing by itself, pistol on the floor",
    "job_bombNinja": "still life, no humans, exploded ofuda scraps and a burnt kunai, smoke",
    "job_swordSaint": "still life, no humans, forest of broken flying swords, one nameless hilt in hand-height",
    "job_thunderLord": "still life, no humans, lightning-split katana and a scorched dao crown, night",
    "job_titan": "still life, no humans, oversized cracked gauntlet with red crystal tumors, lab light",
    "job_berserk": "still life, no humans, overheated katana melted into the floor, no wielder",
    "job_beast": "still life, no humans, torn summoning contract and claw marks, red cord",
    "job_heroic": "still life, no humans, heroic spirit tablet taking a contract, empty offering bowl",
    "job_boneKing": "still life, no humans, crowned skull on a nameless throne, blue soul fire",
    "job_soulHerd": "still life, no humans, shepherd lantern leading a line of soul wisps, empty staff",
}
for i, (cid, sub) in enumerate(JOB_EMBLEM.items()):
    CARD_PROPS[cid] = _entry("portrait", (768, 1024), f"gacha/{cid}.webp", 20261021 + i, sub + ", item illustration, centered object, no readable writing")

FUSION_EMBLEM = {
    "fusion_magitech": "still life, no humans, cracked mecha chestplate with a glowing sakura star-core and unused crown",
    "fusion_gunshrine": "still life, no humans, shrine rifle whose barrel is wrapped as a mini torii, burnt ofuda",
    "fusion_bloodstar": "still life, no humans, bloodstained cracked magical crown and an unused glove, red moon",
    "fusion_bloodmech": "still life, no humans, drone with blood-red lenses and a burnt remote",
    "fusion_idolgun": "still life, no humans, microphone taped to a white sakura rifle, empty stage",
    "fusion_thunderpriest": "still life, no humans, ofuda acting as a lightning rod on a rifle, scorched paper",
    "fusion_plagueidol": "still life, no humans, melting microphone dripping green acid onto petals",
    "fusion_railsword": "still life, no humans, flying swords used as rivets on a bent magnetic rail",
    "fusion_flowerplague": "still life, no humans, exploding flower-bombs of spores, unused cracked crown",
    "fusion_fleshshrine": "still life, no humans, ofuda growing like skin over a shrine bell, red veins, no body",
    "fusion_shadowmage": "still life, no humans, residual fire and ice bursting from an empty cloak",
    "fusion_bloodmage": "still life, no humans, magic circle drinking from a cracked blood vial",
    "fusion_nanoninja": "still life, no humans, tiny drones copying a disappearing kunai afterimage",
    "fusion_shadowblade": "still life, no humans, flying sword that is only a shadow, empty scabbard",
    "fusion_plagueforge": "still life, no humans, crucible overflowing with glowing mushrooms",
    "fusion_biogun": "still life, no humans, living toothed magazine beside a silver pistol",
    "fusion_bloodsword": "still life, no humans, flying sword forged in a bowl of blood, empty crown",
    "fusion_chimera": "still life, no humans, severed crystal arm with fire ice lightning runes, no person",
    "fusion_corpseimmortal": "still life, no humans, empty immortal robe and a still-vibrating planted sword",
    "fusion_shikigami": "still life, no humans, paper ghosts bowing to a mirror core, unused ofuda",
    "fusion_necrospore": "still life, no humans, soul mushrooms growing from a lantern, blue fire",
    "fusion_bloodbeast": "still life, no humans, beast-shadow taller than a signed blood contract",
    "fusion_elementalbeast": "still life, no humans, familiar statues spraying fire frost lightning, snapped whip",
    "fusion_soulgun": "still life, no humans, bone saddle and a magazine of soul-fire cartridges, empty reins",
}
for i, (cid, sub) in enumerate(FUSION_EMBLEM.items()):
    CARD_PROPS[cid] = _entry("portrait", (768, 1024), f"gacha/{cid}.webp", 20261061 + i, sub + ", item illustration, centered object, no readable writing")

SCENES_MORE: dict[str, dict] = {
    "map_chapter1": _entry(
        "landscape", (1280, 853), "content-packs/official-exploration/maps/chapter1.webp", 20261101,
        "scenery, location, no humans, no characters, widescreen exploration map painting, "
        "night shrine streets, vermilion torii, stone paths, lanterns, sakura, empty, "
        "game map background, full bleed, no letterbox, blank signs",
    ),
    "map_chapter2": _entry(
        "landscape", (1280, 853), "content-packs/official-exploration/maps/chapter2.webp", 20261102,
        "scenery, location, no humans, no characters, widescreen exploration map painting, "
        "rain neon shopping streets, wet asphalt, magenta sakura, empty crosswalks, "
        "game map background, full bleed, no letterbox, blank signs",
    ),
    "map_chapter3": _entry(
        "landscape", (1280, 853), "content-packs/official-exploration/maps/chapter3.webp", 20261103,
        "scenery, location, no humans, no characters, widescreen exploration map painting, "
        "sword graveyard paths, planted katanas, red maple, blue spirit lights, empty, "
        "game map background, full bleed, no letterbox",
    ),
    "map_chapter4": _entry(
        "landscape", (1280, 853), "content-packs/official-exploration/maps/chapter4.webp", 20261104,
        "scenery, location, no humans, no characters, widescreen exploration map painting, "
        "shattered golden mirrors over a neon abyss, sakura emblem platforms, empty, "
        "game map background, full bleed, no letterbox",
    ),
    "map_chapter5": _entry(
        "landscape", (1280, 853), "content-packs/maingod-void/maps/chapter5.webp", 20261105,
        "scenery, location, no humans, no characters, widescreen void cathedral map, "
        "purple abyss, gold cracks, floating tickets, empty walkways, "
        "game map background, full bleed, no letterbox",
    ),
}

CAREER_SPLASH = {
    "barrage": "storm of unmarked casings over wet neon pavement",
    "batQueen": "empty throne and fallen bat wings in moonlight",
    "beast": "torn summoning cords across a dark courtyard",
    "berserk": "melted katana stuck in cracked earth",
    "bloodDuke": "empty goblet and wilted roses in a crypt",
    "bombNinja": "burnt ofuda drifting over stone stairs",
    "boneKing": "crowned skull on a nameless throne, blue fire",
    "element": "fire ice lightning orbs over a gold ticket",
    "exorcist": "voided ofuda nailed to a shrine rifle",
    "garden": "glowing corpse-flowers along a shrine path",
    "guardian": "fallen black feathers at a vermilion torii",
    "healingIdol": "open first-aid kit of blank lyric sheets",
    "heroic": "spirit tablet taking a contract on an altar",
    "hive": "fungal hive swallowing a rifle in moonlight",
    "miracle": "cracked crown and a rifle that failed to become a staff",
    "philosopher": "dead furnace full of gold slag",
    "plagueDoctor": "plague mask beside a boiling crucible",
    "railLord": "bent magnetic rail against the night sky",
    "shadow": "empty cloak standing in a cracked mirror hall",
    "sniper": "empty cartridge on a neon rooftop",
    "soulHerd": "lantern leading a line of wisps into fog",
    "starIdol": "sinking stage lights and unused glowsticks",
    "swarm": "sakura drones ignoring a glowing remote",
    "swordSaint": "forest of broken flying swords",
    "thunderLord": "lightning-split blade in a sword graveyard",
    "timeMage": "frozen pocket watch in a water circle",
    "titan": "oversized cracked gauntlet with red crystals",
    "warSinger": "microphone facing a dark empty audience",
}
for i, (cid, look) in enumerate(CAREER_SPLASH.items()):
    SCENES_MORE[f"splash_{cid}"] = _entry(
        "landscape", (1024, 576), f"careers/{cid}/splash.webp", 20261201 + i,
        "scenery, location, no humans, no characters, widescreen splash, "
        f"{look}, empty, game class splash, full bleed, no letterbox, no text",
    )

FUSION_SPLASH = {
    "biogun": "toothed living magazine beside a silver pistol",
    "bloodbeast": "beast shadow taller than a signed contract",
    "bloodmage": "magic circle drinking a cracked vial",
    "bloodmech": "blood-lensed drone and a burnt remote",
    "bloodstar": "bloodstained cracked crown under a red moon",
    "bloodsword": "flying sword cooling in a bowl of blood",
    "chimera": "crystal arm etched with fire ice lightning",
    "corpseimmortal": "empty robe and a still-vibrating planted sword",
    "elementalbeast": "familiar statues spraying fire frost lightning",
    "fleshshrine": "ofuda growing like skin over a shrine bell",
    "flowerplague": "spore flower-bombs along a garden path",
    "gunshrine": "rifle barrel wrapped as a tiny torii",
    "idolgun": "microphone taped to a sakura rifle on an empty stage",
    "magitech": "cracked mecha chestplate with a sakura star-core",
    "nanoninja": "tiny drones copying a kunai afterimage",
    "necrospore": "soul mushrooms around a lantern",
    "plagueforge": "crucible overflowing with mushrooms",
    "plagueidol": "melting microphone dripping onto petals",
    "railsword": "flying swords riveted into a bent rail",
    "shadowblade": "shadow-only flying sword and empty sheath",
    "shadowmage": "empty cloak bursting residual fire and ice",
    "shikigami": "paper ghosts bowing to a mirror core",
    "soulgun": "bone saddle and soul-fire cartridges",
    "thunderpriest": "ofuda lightning rod on a shrine rifle",
}
for i, (cid, look) in enumerate(FUSION_SPLASH.items()):
    SCENES_MORE[f"fsplash_{cid}"] = _entry(
        "landscape", (1024, 576), f"fusions/{cid}/splash.webp", 20261240 + i,
        "scenery, location, no humans, no characters, widescreen splash, "
        f"{look}, empty, game class splash, full bleed, no letterbox, no text",
    )

SCENES_MORE["splash_bio"] = _entry(
    "landscape", (1024, 576), "ascensions/bio/splash.webp", 20261110,
    "scenery, location, no humans, no characters, widescreen splash, "
    "bioluminescent greenhouse of flesh-flowers, pink spores, wet glass, empty, "
    "game class splash, full bleed, no letterbox, no text",
)
SCENES_MORE["splash_psi"] = _entry(
    "landscape", (1024, 576), "ascensions/psi/splash.webp", 20261111,
    "scenery, location, no humans, no characters, widescreen splash, "
    "psychic shrine of floating gold mirrors, purple lightning, empty corridor, "
    "game class splash, full bleed, no letterbox, no text",
)
SCENES_MORE["splash_tech"] = _entry(
    "landscape", (1024, 576), "ascensions/tech/splash.webp", 20261112,
    "scenery, location, no humans, no characters, widescreen splash, "
    "abandoned sakura-painted machine hall, drones on the floor, cyan sparks, empty, "
    "game class splash, full bleed, no letterbox, no text",
)
SCENES_MORE["void_arena"] = _entry(
    "landscape", (1600, 900), "content-packs/maingod-void/maps/void_arena.webp", 20261106,
    "scenery, location, no humans, no characters, widescreen battle background, "
    "circular void arena, glowing gold cracks, purple nebula, empty floor center, "
    "slightly high angle, game battle background, full bleed, no letterbox",
)

EXTRAS: dict[str, dict] = {
    "cover_v36_main_god": _entry(
        "portrait", (1080, 1920), "ui/cover_v36_main_god.webp", 20261120,
        "scenery, location, no humans, no characters, tall vertical cinematic key art, "
        "broken golden mirror over a neon abyss, sakura petals, purple void, full moon, "
        "empty circular platform, game title background, full bleed, no letterbox, no text",
    ),
    "loading_art": _entry(
        "square", (512, 512), "ui/loading_art.webp", 20261121,
        "scenery, location, no humans, cracked golden hand-mirror on night shrine stone, "
        "sakura petals, purple glow, game loading illustration, no text",
    ),
    "menu_emblem": _entry(
        "square", (512, 512), "ui/menu_emblem.webp", 20261122,
        "still life, no humans, ornate cracked golden oval hand-mirror emblem, "
        "sakura crest, purple void, centered symbol, no text, no letters",
    ),
}

NAV_LOOK = {
    "gacha": "cracked golden hand-mirror facing the viewer, sakura petals",
    "roster": "stack of ornate empty gacha cards, gold filigree",
    "shop": "shrine souvenir pouch and paper lantern, coins as unmarked discs",
    "stage": "tiny vermilion torii and a stone path",
    "archive": "scrolls and a cracked mirror on a shelf",
    "talent": "glowing sakura seed in a glass vial",
    "story": "open blank chronicle book with falling petals",
    "ascension": "three orbiting cores, gold purple and green, no text",
    "achievement": "broken gold laurel around a blank seal",
}
for i, (nid, look) in enumerate(NAV_LOOK.items()):
    EXTRAS[f"nav_{nid}"] = _entry(
        "square", (256, 256), f"ui/nav/{nid}.webp", 20261140 + i,
        f"still life, no humans, {look}, game ui icon, centered object, no text, no letters",
    )

CLASS_LOOK = {
    "shrine": "ofuda and vermilion cord",
    "idol": "vintage radio dial",
    "magical": "cracked pink crown shard",
    "mech": "tiny sakura drone",
    "spore": "glowing mushroom",
    "gun": "silver pistol silhouette",
    "mage": "gold void ticket",
    "alch": "cracked crucible",
    "ninja": "kunai and shadow",
    "vamp": "empty ornate vial",
    "cult": "planted broken flying sword",
    "necro": "blue soul lantern",
    "gene": "red crystal vial",
    "summon": "burning contract scroll",
}
for i, (cid, look) in enumerate(CLASS_LOOK.items()):
    EXTRAS[f"class_{cid}"] = _entry(
        "square", (256, 256), f"classes/{cid}/icon.webp", 20261160 + i,
        f"still life, no humans, {look}, game class icon, centered object, no text",
    )

for i, (cid, look) in enumerate(CAREER_SPLASH.items()):
    EXTRAS[f"cicon_{cid}"] = _entry(
        "square", (256, 256), f"careers/{cid}/icon.webp", 20261401 + i,
        f"still life, no humans, {look}, game career icon, centered symbol, no text, no letters",
    )

for i, (cid, look) in enumerate(FUSION_SPLASH.items()):
    EXTRAS[f"ficon_{cid}"] = _entry(
        "square", (256, 256), f"fusions/{cid}/icon.webp", 20261440 + i,
        f"still life, no humans, {look}, game fusion icon, centered symbol, no text, no letters",
    )

ASC_ICON = {
    "bio": "bioluminescent flesh-flower seed in a glass vial, pink spores",
    "psi": "cracked gold mirror shard orbiting a purple core",
    "tech": "tiny sakura-painted machine core, cyan sparks",
}
for i, (cid, look) in enumerate(ASC_ICON.items()):
    EXTRAS[f"aicon_{cid}"] = _entry(
        "square", (256, 256), f"ascensions/{cid}/icon.webp", 20261470 + i,
        f"still life, no humans, {look}, game ascension icon, centered symbol, no text",
    )

SKILL_LOOK = {
    "acid": "cracked flask dripping green acid, no hands",
    "barrier": "hexagonal ofuda shield, vermilion cords",
    "bat": "tiny crimson spirit bat silhouette, gold earring",
    "beat": "vintage radio speaker pulsing pink sound rings",
    "blast": "alchemical explosion burst from a crucible",
    "bloodnova": "crimson nova ring and empty vial",
    "bone": "crowned bone spike, blue soul fire",
    "carapace": "cracked keratin armor plate",
    "chain": "lightning chain arcs between ofuda",
    "cloud": "green spore fog cloud, no face",
    "contract": "burning red contract scroll, no writing",
    "crit": "cracked gold critical star",
    "cyber": "sakura-painted cyber core, cyan sparks",
    "dmg": "glowing pink damage rune stone",
    "drone": "tiny sakura scout drone, pink lens",
    "encore": "unused microphone under a pink encore light",
    "familiar": "paper shikigami fox, ofuda body",
    "fireball": "pink-gold fireball, sakura embers",
    "frost": "ice crystal shard, frost mist",
    "harvest": "soul-harvest sickle and a blue wisp",
    "kunai": "ofuda-wrapped tracking kunai",
    "magnet": "bent magnetic rail shard",
    "mark": "glowing blank mark seal",
    "multi": "twin sakura bullets crossing",
    "nano": "nano armor plate with sakura etch",
    "overdrive": "overheating white rifle barrel glow, no hands",
    "pierce": "piercing gold needle of light",
    "qi": "swirling qi circle, no body",
    "rail": "magnetic rail spear of light",
    "raise": "rising blue soul from cracked earth",
    "rate": "spinning unmarked cartridge drum",
    "regen": "healing sakura petal swirl",
    "ribbon": "defensive satin ribbon knot",
    "sacrifice": "cracked blood vial offering",
    "shadowstep": "empty cloak afterimage",
    "skill": "sakura skill burst emblem",
    "soul": "blue soul lantern",
    "speed": "motion-blurred petal streak",
    "spirit": "pale spirit flame",
    "spore": "glowing pink mushroom cluster",
    "spotlight": "empty stage spotlight cone",
    "star": "magical star shard, gold filigree",
    "steal": "empty ornate blood vial",
    "sword": "planted flying sword, no wielder",
    "talisman": "stacked ofuda charms",
    "thunder": "lightning-split ofuda",
    "transform": "cracked magical crown",
    "transmute": "philosopher slag in a crucible",
}
for i, (sid, look) in enumerate(SKILL_LOOK.items()):
    EXTRAS[f"skill_{sid}"] = _entry(
        "square", (256, 256), f"skills/{sid}.webp", 20261301 + i,
        f"still life, no humans, {look}, game skill icon, centered object, no text, no letters",
    )

EXTRAS["ui_locked"] = _entry(
    "square", (256, 256), "ui/locked.webp", 20261480,
    "still life, no humans, cracked golden lock over a blank sakura seal, night, "
    "game ui icon, centered object, no text, no letters",
)
EXTRAS["ui_app_icon"] = _entry(
    "square", (512, 512), "ui/app_icon.webp", 20261481,
    "still life, no humans, cracked golden oval hand-mirror emblem, sakura crest, "
    "purple void, square app icon, centered symbol, no text, no letters",
)
EXTRAS["ui_achievement_master"] = _entry(
    "square", (512, 512), "ui/achievement_master.webp", 20261482,
    "still life, no humans, broken gold laurel around a blank sakura seal, "
    "game achievement emblem, centered symbol, no text, no letters",
)

CAREER_FULL: dict[str, dict] = {}
for i, (jid, sub) in enumerate(JOB_EMBLEM.items()):
    cid = jid.removeprefix("job_")
    CAREER_FULL[f"cfull_{cid}"] = _entry(
        "square",
        (512, 512),
        f"careers/{cid}/full.webp",
        20261501 + i,
        sub + ", square item illustration, centered object, no readable writing",
    )

FX_BASE = (
    "no humans, no 1girl, no hands, no people, "
    "simple background, chroma key, #00ff00, neon green background, solid color background"
)
FX_LOOK = {
    "muzzle": "sakura-colored muzzle flash burst, sparks, no gun body",
    "slash": "crescent katana slash arc, pink gold energy, no wielder",
    "hit": "impact burst of petals and gold sparks",
    "dash": "speed afterimage streaks, pink petals",
    "skill": "sakura skill nova ring, gold filigree",
    "shatter": "exploding gold mirror shards",
    "levelup": "rising gold seal and falling petals",
    "loot": "glowing loot sparkle cluster, unmarked coins as discs",
}
FX: dict[str, dict] = {}
for i, (fid, look) in enumerate(FX_LOOK.items()):
    FX[fid] = _entry(
        "square", (384, 384), f"fx/{fid}.webp", 20261601 + i,
        f"{FX_BASE}, {look}",
    )
    FX[f"{fid}_b"] = _entry(
        "square", (384, 384), f"fx/{fid}_b.webp", 20261621 + i,
        f"{FX_BASE}, {look}, animation frame 2, larger burst",
    )


def compose_creature_prompt(cid: str, extra: str = "") -> tuple[str, str]:
    if cid not in CREATURES:
        raise ValueError(f"unknown creature {cid!r}")
    spec = CREATURES[cid]
    parts = [ARTIST_STRING, YEAR_TAGS, spec["subject"], extra, CREATURE_STYLE, QUALITY_TAGS]
    prompt = ", ".join(p.strip().strip(",") for p in parts if p and p.strip())
    negative = ", ".join(p for p in (NEGATIVE, CREATURE_NEGATIVE) if p)
    return prompt, negative


def compose_card_prompt(cid: str, extra: str = "") -> tuple[str, str]:
    if cid not in CARD_PROPS:
        raise ValueError(f"unknown card {cid!r}")
    spec = CARD_PROPS[cid]
    parts = [ARTIST_STRING, YEAR_TAGS, spec["subject"], extra, PROP_STYLE, QUALITY_TAGS]
    prompt = ", ".join(p.strip().strip(",") for p in parts if p and p.strip())
    negative = ", ".join(p for p in (NEGATIVE, PROP_NEGATIVE) if p)
    return prompt, negative


def compose_extra_prompt(cid: str, extra: str = "") -> tuple[str, str]:
    if cid in SCENES_MORE:
        spec = SCENES_MORE[cid]
        parts = [ARTIST_STRING, YEAR_TAGS, spec["subject"], extra, SCENE_STYLE, QUALITY_TAGS]
        prompt = ", ".join(p.strip().strip(",") for p in parts if p and p.strip())
        return prompt, ", ".join(p for p in (NEGATIVE, SCENE_NEGATIVE) if p)
    if cid not in EXTRAS:
        raise ValueError(f"unknown extra {cid!r}")
    spec = EXTRAS[cid]
    style = SCENE_STYLE if "scenery" in spec["subject"] else ICON_STYLE
    neg = SCENE_NEGATIVE if "scenery" in spec["subject"] else PROP_NEGATIVE
    parts = [ARTIST_STRING, YEAR_TAGS, spec["subject"], extra, style, QUALITY_TAGS]
    prompt = ", ".join(p.strip().strip(",") for p in parts if p and p.strip())
    return prompt, ", ".join(p for p in (NEGATIVE, neg) if p)


def compose_full_prompt(cid: str, extra: str = "") -> tuple[str, str]:
    if cid not in CAREER_FULL:
        raise ValueError(f"unknown career full {cid!r}")
    spec = CAREER_FULL[cid]
    parts = [ARTIST_STRING, YEAR_TAGS, spec["subject"], extra, PROP_STYLE, QUALITY_TAGS]
    prompt = ", ".join(p.strip().strip(",") for p in parts if p and p.strip())
    return prompt, ", ".join(p for p in (NEGATIVE, PROP_NEGATIVE) if p)


def compose_fx_prompt(cid: str, extra: str = "") -> tuple[str, str]:
    if cid not in FX:
        raise ValueError(f"unknown fx {cid!r}")
    spec = FX[cid]
    parts = [ARTIST_STRING, YEAR_TAGS, spec["subject"], extra, CREATURE_STYLE, QUALITY_TAGS]
    prompt = ", ".join(p.strip().strip(",") for p in parts if p and p.strip())
    return prompt, ", ".join(p for p in (NEGATIVE, CREATURE_NEGATIVE) if p)


RETRY_PROPS = {
    "cherry_crown": 20260894,
    "weapon_aya_twin": 20260895,
    "weapon_rion_under": 20260896,
    "weapon_sayo_final": 20260897,
}
