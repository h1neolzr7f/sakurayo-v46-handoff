from __future__ import annotations

import json
import shutil
from pathlib import Path

ROOT = Path(r"C:\Users\tzzcomputer\Desktop\樱夜尸潮_V3.5_Codex续作")
BASE = ROOT / "assets" / "image2"
for name in ["reference", "prompts", "source", "processed", "previews", "reports"]:
    (BASE / name).mkdir(parents=True, exist_ok=True)

refs = {
    "style_character.jpg": Path(r"E:\qq文件\qqLIAOTIAN\511466459\FileRecv\MobileFile\Image_1783684703372.jpg"),
    "style_game_ui.png": ROOT / "assets" / "reference" / "战斗与成长界面概念图.png",
}
for out, source in refs.items():
    shutil.copy2(source, BASE / "reference" / out)

STYLE = (
    "Image 1 is the PRIMARY visual-style reference only: clean Japanese anime cel illustration, "
    "delicate dark outlines, warm soft skin colors, smooth two-step shading, cute readable silhouettes, "
    "polished but uncluttered details. Image 2 is composition/game-scale reference only. "
    "Create original Sakurayo Zombie Tide assets; do not copy the reference character, clothing, logos, or text. "
    "No text, letters, numbers, labels, signatures, UI captions, or watermark."
)
def key_prompt(key: str) -> str:
    return (
        f"Perfectly flat solid {key} chroma-key background. No shadows, gradients, texture, reflection, floor plane, "
        f"fog, glow outside the silhouette, or lighting variation on the background. Never use {key} in subjects."
    )
GRID = (
    "Strict {cols} by {rows} equal grid, row-major in the exact listed order. One centered isolated asset per cell, "
    "uniform scale and anchor, 8 percent safe margin, nothing crosses cell boundaries, no grid lines."
)

characters = [
    ("sayo", "月城小夜", "purple-haired shrine-gunner girl with a compact cherry-blossom assault rifle, pink and violet combat shrine outfit"),
    ("aya", "神代绫", "silver-haired agile tracker girl carrying a compact pistol and a moonlight katana, blue-white tactical school outfit"),
    ("rion", "黑羽凛音", "long black-haired pure katana swordswoman, dark red and black modern sword-school outfit, calm fierce expression"),
]
skins = [
    ("techcoat", "霓虹战术风衣", "cyan and navy neon tactical trench coat with compact armored panels"),
    ("biodress", "绯血生体礼服", "crimson organic evening combat dress with subtle biotech vein motifs"),
    ("psirobe", "星辉灵能裙装", "violet star-glow psychic layered skirt outfit with crystal ornaments"),
    ("haori", "剑道部夜羽织", "midnight blue modern kendo haori with pale moon feather trim"),
    ("idol", "末日舞台演出服", "pink black post-apocalypse idol stage costume with practical boots"),
    ("apron", "炼金防污围裙", "lime cream alchemist work apron with potion belt and protective gloves"),
    ("summon", "百鬼召唤睡衣", "teal spirit-summoner pajama outfit with cute ghost talismans"),
    ("festival", "镜夜祭典巫女服", "magenta white mirror-night festival shrine maiden outfit"),
]
enemies = [
    ("normal", "普通僵尸"), ("fast", "迅捷僵尸"), ("tank", "重甲僵尸"), ("ranged", "远程僵尸"),
    ("bomb", "自爆僵尸"), ("shield", "结界尸"), ("disruptor", "干扰尸"), ("purifier", "净化尸"),
    ("specter", "幽魂尸"), ("decay", "腐败祭司"), ("seal", "封灵尸"), ("pet_hunter", "猎宠尸"),
    ("noise_zombie", "噪声尸"), ("soul_eater", "噬魂尸"), ("anti_shadow_ninja", "反影忍者"), ("reserved", "空白占位"),
]
bosses = [
    ("boss_stage_1", "百目尸将", "armored undead general covered in ritual eyes"),
    ("boss_stage_2", "雨魇行者", "slender rain nightmare stalker with broken umbrellas and blue violet rain armor"),
    ("boss_stage_3", "黄泉御前", "elegant underworld sword princess with spectral blades"),
    ("boss_stage_4", "八重镜姬", "mirror-core princess with layered cracked mirror halo"),
]
utility = [
    *[(f"{bid}", name) for bid, name, _ in bosses],
    ("pet_drone", "夜樱无人机"), ("pet_bat", "夜蝠"), ("pet_familiar", "灵兽使魔"), ("pet_wisp", "魂灯"),
    ("drop_xp", "灵核经验晶体"), ("drop_coin", "樱花币"), ("drop_health", "生命补给"), ("drop_core", "三相灵核"),
    ("hazard_eye", "百目预警"), ("hazard_emp", "EMP预警"), ("hazard_sword", "剑阵预警"), ("hazard_mirror", "镜界预警"),
]
schools = [
    ("mech", "机械师"), ("gun", "枪斗术"), ("alch", "炼金术"), ("gene", "基因战士"),
    ("vamp", "血族"), ("spore", "菌群术"), ("magical", "魔法少女"), ("cult", "修仙"),
    ("mage", "魔法师"), ("shrine", "巫女"), ("summon", "召唤师"), ("ninja", "忍者"),
    ("idol", "战场歌姬"), ("necro", "死灵术士"),
]
branches = [
    ("swarm", "蜂群统御"), ("railLord", "天穹磁轨"), ("barrage", "弹幕暴君"), ("sniper", "处刑狙击"),
    ("plagueDoctor", "瘟疫医师"), ("philosopher", "贤者之石"), ("titan", "再生泰坦"), ("berserk", "超载狂战"),
    ("bloodDuke", "鲜血公爵"), ("batQueen", "夜蝠女王"), ("hive", "万菌母巢"), ("garden", "尸骸花园"),
    ("starIdol", "星穹偶像"), ("miracle", "奇迹魔女"), ("swordSaint", "万剑仙"), ("thunderLord", "雷劫道君"),
    ("element", "元素统御"), ("timeMage", "时序魔导师"), ("exorcist", "祓魔执行官"), ("guardian", "八咫守护者"),
    ("beast", "百兽统御"), ("heroic", "英灵契约"), ("shadow", "无明影刃"), ("bombNinja", "爆符忍军"),
    ("warSinger", "尸潮歌姬"), ("healingIdol", "治愈偶像"), ("boneKing", "白骨君王"), ("soulHerd", "群魂牧者"),
]
fusions = [
    ("magitech", "星核机甲少女"), ("bloodsword", "血炼剑仙"), ("plagueforge", "瘟炼菌海"),
    ("gunshrine", "祓魔枪巫女"), ("chimera", "元素嵌合体"), ("railsword", "磁轨剑阵"),
    ("bloodstar", "血月魔法少女"), ("biogun", "活体弹仓"), ("thunderpriest", "雷火天师"),
    ("corpseimmortal", "尸解剑仙"), ("bloodmech", "血械猎姬"), ("flowerplague", "花疫魔女"),
    ("shikigami", "百鬼阴阳师"), ("shadowmage", "影法魔女"), ("idolgun", "枪火偶像"),
    ("necrospore", "菌尸冥主"), ("bloodbeast", "血契兽王"), ("shadowblade", "御剑影忍"),
]
ascensions = [("tech", "科技飞升·机神巫女"), ("bio", "生物飞升·绯血神躯"), ("psi", "灵能飞升·万象灵体")]
stages = [
    ("stage_1", "神社外街", "night cyber shrine outer street, cherry blossoms, broken seals, readable top-down combat lanes"),
    ("stage_2", "雨夜商圈", "rainy neon shopping district, wet asphalt, abandoned signs without text, readable top-down lanes"),
    ("stage_3", "黄泉参道", "underworld shrine approach with spectral swords and stone lanterns, readable top-down lanes"),
    ("stage_4", "镜界核心", "surreal mirror-core arena with cracked reflections and magenta cyan circuitry, readable top-down lanes"),
]
skills = [
    ("dmg", "绯樱弹芯"), ("rate", "疾风扳机"), ("speed", "轻羽足袋"), ("crit", "红瞳锁定"),
    ("magnet", "灵核感应"), ("skill", "樱华爆发"), ("drone", "夜樱无人机"), ("nano", "纳米护甲"),
    ("rail", "磁轨过载"), ("multi", "双生弹幕"), ("pierce", "破甲银针"), ("cyber", "机械义体"),
    ("acid", "腐蚀炼成"), ("blast", "灵爆催化剂"), ("transmute", "晶核转化"), ("regen", "超速再生"),
    ("carapace", "角质装甲"), ("overdrive", "血肉超载"), ("steal", "猩红血契"), ("bloodnova", "血月爆裂"),
    ("bat", "夜蝠眷属"), ("spore", "孢子感染"), ("cloud", "菌云扩散"), ("harvest", "尸骸收割"),
    ("star", "星辉弹幕"), ("ribbon", "缎带守护"), ("transform", "奇迹变身"), ("sword", "御剑术"),
    ("qi", "周天运气"), ("thunder", "雷劫引法"), ("fireball", "炎爆术"), ("frost", "霜环术"),
    ("chain", "连锁雷光"), ("talisman", "灵符护身"), ("barrier", "八咫结界"), ("spirit", "灵体化"),
    ("familiar", "灵兽使魔"), ("contract", "强化契约"), ("sacrifice", "代偿召唤"), ("kunai", "追魂苦无"),
    ("shadowstep", "影遁步"), ("mark", "死线标记"), ("beat", "尸潮节拍"), ("encore", "安可时间"),
    ("spotlight", "聚光舞台"), ("soul", "拘魂灯"), ("bone", "白骨装甲"), ("raise", "亡魂役使"),
]

jobs: list[dict] = []

def cell_path(category: str, item_id: str) -> str:
    return f"game/art/{category}/{item_id}.webp"

def atlas(job_id: str, phase: str, size: str, cols: int, rows: int, items: list[tuple[str, str]], category: str,
          prompt: str, transparent: bool, cell_size: int = 256, chroma_key: str = "#00ff00") -> None:
    cells = []
    for index, (item_id, name) in enumerate(items):
        cells.append({"index": index, "id": item_id, "name": name, "output": cell_path(category, item_id), "size": [cell_size, cell_size]})
    jobs.append({
        "id": job_id, "phase": phase, "kind": "atlas", "size": size, "quality": "high",
        "transparent": transparent, "chroma_key": chroma_key if transparent else None,
        "source": f"assets/image2/source/{job_id}.png", "processed": f"assets/image2/processed/{job_id}.png",
        "grid": {"columns": cols, "rows": rows, "cells": cells},
        "prompt": f"{STYLE} {GRID.format(cols=cols, rows=rows)} {prompt} " + (key_prompt(chroma_key) if transparent else "Opaque deep navy square tile backgrounds, consistent icon material and no transparency."),
    })

# Character sheet: avatar / battle full body / dialogue bust.
char_items = []
for row in ["portrait", "battle", "dialogue"]:
    for cid, name, _ in characters:
        char_items.append((f"{cid}_{row}", f"{name} {row}"))
atlas("atlas_characters", "essential", "2304x2304", 3, 3, char_items, "characters/default",
      "Rows are: circular clean avatar busts; compact full-body top-down battle sprites facing front; expressive waist-up dialogue portraits. Columns are Sayo, Aya, Rion. Preserve each character identity across rows.", True, 512)
char_job = jobs[-1]
for cell in char_job["grid"]["cells"]:
    cid, kind = cell["id"].split("_", 1)
    cell["output"] = f"game/art/characters/{cid}/default/{kind}.webp"

# Eight alternate outfits, each with all three characters and all three runtime
# representations. Separate sheets keep identities and garment silhouettes more
# consistent than one extremely dense 72-cell sheet.
identity_prompt = "; ".join(f"{name}: {desc}" for _, name, desc in characters)
for skin_id, skin_name, skin_desc in skins:
    atlas(
        f"atlas_skin_{skin_id}", "skins", "2304x2304", 3, 3, char_items, f"characters/{skin_id}",
        f"Same exact row and column roles as the default character sheet. Character identities: {identity_prompt}. "
        f"Dress all three in the shared {skin_name} theme: {skin_desc}. Weapons and faces remain character-specific; "
        "the outfit must be visibly different from the default and consistent across portrait, battle and dialogue rows.",
        True, 512,
    )
    skin_job = jobs[-1]
    for cell in skin_job["grid"]["cells"]:
        cid, kind = cell["id"].split("_", 1)
        cell["output"] = f"game/art/characters/{cid}/{skin_id}/{kind}.webp"

atlas("atlas_enemies", "essential", "2048x2048", 4, 4, enemies, "enemies",
      "Cute-horror chibi zombie combat sprites in strict order: " + "; ".join(name for _, name in enemies) + ". Distinct silhouettes and readable gameplay roles; use gray, olive, black-yellow or deep red accents, but no orange or brown dominant colors.", True, 256, "#ff7a00")
atlas("atlas_boss_utility", "essential", "2048x2048", 4, 4, utility, "utility",
      "Row 1 four imposing chibi bosses: " + ", ".join(name for _, name, _ in bosses) + ". Row 2 four friendly summons. Row 3 four collectible items. Row 4 four clean hazard telegraph emblems. No loose particles outside silhouettes; avoid orange and brown dominant colors.", True, 384, "#ff7a00")
utility_job = jobs[-1]
for cell in utility_job["grid"]["cells"]:
    item_id = cell["id"]
    if item_id.startswith("boss_"):
        cell["output"] = f"game/art/bosses/{item_id}.webp"
    elif item_id.startswith("pet_"):
        cell["output"] = f"game/art/pets/{item_id.removeprefix('pet_')}.webp"
    elif item_id.startswith("drop_"):
        cell["output"] = f"game/art/items/{item_id.removeprefix('drop_')}.webp"
    else:
        cell["output"] = f"game/art/hazards/{item_id.removeprefix('hazard_')}.webp"

atlas("atlas_progression_a", "progression", "3072x1536", 8, 4, schools + branches[:18], "progression",
      "Thirty-two premium square RPG ability icons in exact order: " + "; ".join(name for _, name in schools + branches[:18]) + ". Symbol-only, no characters unless needed as a simple silhouette.", False, 256)
atlas("atlas_progression_b", "progression", "3072x1536", 8, 4, branches[18:] + fusions + ascensions + [("locked", "锁定节点")], "progression",
      "Thirty-two premium square RPG ability icons in exact order: " + "; ".join(name for _, name in branches[18:] + fusions + ascensions + [("locked", "锁定节点")]) + ". Fusion icons visibly combine two motifs; ascensions feel final-tier.", False, 256)
for job in jobs[-2:]:
    for cell in job["grid"]["cells"]:
        item_id = cell["id"]
        if item_id in {x for x, _ in schools}:
            cell["output"] = f"game/art/classes/{item_id}/icon.webp"
        elif item_id in {x for x, _ in branches}:
            cell["output"] = f"game/art/careers/{item_id}/icon.webp"
        elif item_id in {x for x, _ in fusions}:
            cell["output"] = f"game/art/fusions/{item_id}/icon.webp"
        elif item_id in {x for x, _ in ascensions}:
            cell["output"] = f"game/art/ascensions/{item_id}/icon.webp"
        else:
            cell["output"] = "game/art/ui/locked.webp"

atlas("atlas_skills_a", "skills", "3072x1536", 8, 3, skills[:24], "skills",
      "Twenty-four square combat skill icons in exact order: " + "; ".join(name for _, name in skills[:24]) + ". Symbol-only, bold readable silhouette, no characters and no text.", False, 256)
atlas("atlas_skills_b", "skills", "3072x1536", 8, 3, skills[24:], "skills",
      "Twenty-four square combat skill icons in exact order: " + "; ".join(name for _, name in skills[24:]) + ". Symbol-only, bold readable silhouette, no characters and no text.", False, 256)

branding = [
    ("app_icon", "应用图标"), ("menu_emblem", "主菜单徽记"),
    ("loading_art", "加载页主视觉"), ("achievement_master", "全成就徽章"),
]
atlas("atlas_branding", "essential", "2048x2048", 2, 2, branding, "ui",
      "Four square branding assets: a premium app icon showing a cherry blossom crossed with a katana and spirit core; "
      "a simplified menu emblem; a dramatic three-hero loading illustration; and a gold-pink master achievement badge. "
      "No title lettering, no text, no border touching the cell edge.", False, 512)

jobs.append({
    "id": "atlas_stage_backgrounds", "phase": "essential", "kind": "atlas", "size": "2160x3840", "quality": "high",
    "transparent": False, "source": "assets/image2/source/atlas_stage_backgrounds.png",
    "processed": "assets/image2/processed/atlas_stage_backgrounds.png",
    "grid": {"columns": 2, "rows": 2, "cells": [
        {"index": i, "id": sid, "name": name, "output": f"game/art/stages/{sid}/battle_bg.webp", "size": [1080, 1920]}
        for i, (sid, name, _) in enumerate(stages)
    ]},
    "prompt": f"{STYLE} {GRID.format(cols=2, rows=2)} Four portrait orthographic top-down mobile action-game battle backgrounds, no characters or UI: " + "; ".join(f"{name}: {desc}" for _, name, desc in stages) + ". Opaque full-bleed portrait scenes, centered safe combat area, dark enough for bright projectiles, no text.",
})

manifest = {
    "version": 1,
    "model": "gpt-image-2",
    "reference_images": ["assets/image2/reference/style_character.jpg", "assets/image2/reference/style_game_ui.png"],
    "output_root": "android-app/app/src/main/assets",
    "note": "Complete raster asset plan: default and 8 alternate character outfits, enemies, bosses, pets, drops, hazards, 4 stages, 14 classes, 28 careers, 18 fusions, 3 ascensions, 48 skills and 4 branding assets. CSS text, UI frames, particles, bullets and damage numbers remain deterministic code-native assets.",
    "jobs": jobs,
}
(BASE / "asset_manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

for job in jobs:
    (BASE / "prompts" / f"{job['id']}.txt").write_text(job["prompt"], encoding="utf-8")

# Generate-batch dry-run input (style is fully described; direct runner uses edit with both references).
with (BASE / "prompts" / "jobs.jsonl").open("w", encoding="utf-8", newline="\n") as f:
    for job in jobs:
        f.write(json.dumps({
            "prompt": job["prompt"], "model": "gpt-image-2", "quality": job["quality"], "size": job["size"],
            "output_format": "png", "out": f"{job['id']}.png",
        }, ensure_ascii=False) + "\n")

print(f"created {len(jobs)} Image2 jobs at {BASE}")
print("jobs:", ", ".join(job["id"] for job in jobs))
