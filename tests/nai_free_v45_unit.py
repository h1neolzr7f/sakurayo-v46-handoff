#!/usr/bin/env python3
"""Offline safety tests for the NovelAI v4.5 Opus-free helper. No network."""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools" / "nai"))

from free_v45 import (  # noqa: E402
    ALLOWED_MODELS,
    CHAR_PRESETS,
    FREE_SIZE_SET,
    SafetyError,
    anlas_from_subscription,
    assert_safe_to_generate,
    build_payload,
    resolve_model,
    summarize_account,
    validate_free_request,
)
from align_assets import cover_fit  # noqa: E402
from prompts import (  # noqa: E402
    ARTIST_STRING,
    PEOPLE,
    PROPS,
    QUALITY_TAGS,
    SCENES,
    compose_person_prompt,
    compose_prompt,
    compose_prop_prompt,
    compose_scene_prompt,
)


class FreeV45SafetyTests(unittest.TestCase):
    def test_allowlist_is_only_v45(self):
        self.assertEqual(
            set(ALLOWED_MODELS),
            {"nai-diffusion-4-5-full", "nai-diffusion-4-5-curated"},
        )
        self.assertEqual(resolve_model("full"), "nai-diffusion-4-5-full")
        self.assertEqual(resolve_model("curated"), "nai-diffusion-4-5-curated")

    def test_free_sizes_are_normal_not_small(self):
        self.assertIn((832, 1216), FREE_SIZE_SET)
        self.assertIn((1216, 832), FREE_SIZE_SET)
        self.assertIn((1024, 1024), FREE_SIZE_SET)
        self.assertNotIn((512, 768), FREE_SIZE_SET)
        self.assertNotIn((1024, 1536), FREE_SIZE_SET)

    def test_reject_v5_and_paid_shapes(self):
        self.assertTrue(
            validate_free_request(
                model="nai-diffusion-5-full",
                width=832,
                height=1216,
                steps=28,
            )
        )
        self.assertTrue(
            validate_free_request(
                model="nai-diffusion-4-5-full",
                width=512,
                height=768,
                steps=28,
            )
        )
        self.assertTrue(
            validate_free_request(
                model="nai-diffusion-4-5-full",
                width=1024,
                height=1536,
                steps=28,
            )
        )
        self.assertTrue(
            validate_free_request(
                model="nai-diffusion-4-5-full",
                width=832,
                height=1216,
                steps=29,
            )
        )
        self.assertTrue(
            validate_free_request(
                model="nai-diffusion-4-5-full",
                width=832,
                height=1216,
                steps=28,
                n_samples=2,
            )
        )
        self.assertTrue(
            validate_free_request(
                model="nai-diffusion-4-5-full",
                width=832,
                height=1216,
                steps=28,
                action="img2img",
            )
        )
        self.assertTrue(
            validate_free_request(
                model="nai-diffusion-4-5-full",
                width=832,
                height=1216,
                steps=28,
                extra_keys={"image", "director_reference_images"},
            )
        )

    def test_accept_opus_free_shape(self):
        self.assertEqual(
            validate_free_request(
                model="nai-diffusion-4-5-full",
                width=832,
                height=1216,
                steps=28,
            ),
            [],
        )
        payload = build_payload(
            prompt="1girl, solo",
            negative="lowres",
            model="nai-diffusion-4-5-curated",
            width=1024,
            height=1024,
            steps=23,
            seed=1,
        )
        self.assertEqual(payload["action"], "generate")
        self.assertEqual(payload["parameters"]["n_samples"], 1)
        self.assertFalse(payload["parameters"]["sm"])
        self.assertFalse(payload["parameters"]["sm_dyn"])
        self.assertFalse(payload["parameters"]["qualityToggle"])
        self.assertIsNone(payload["parameters"]["skip_cfg_above_sigma"])
        self.assertNotIn("image", payload["parameters"])

    def test_presets_are_adult_and_clothed(self):
        for name, prompt in CHAR_PRESETS.items():
            self.assertIn("20 years old", prompt, name)
            self.assertIn("fully clothed", prompt, name)
            self.assertIn("safe for work", prompt, name)
            self.assertIn("artist:ciloranko", prompt, name)
            self.assertIn("masterpiece", prompt, name)
            self.assertIn("best quality", prompt, name)
            self.assertIn("year 2024", prompt, name)

    def test_live_prompt_has_artist_quality_and_no_location_tag(self):
        self.assertIn("artist:hiten", ARTIST_STRING)
        self.assertIn("very aesthetic", QUALITY_TAGS)
        prompt, negative = compose_prompt("sayo", "live")
        self.assertTrue(prompt.startswith("{artist:ciloranko}"))
        self.assertIn("green background", prompt)
        self.assertNotRegex(prompt, r"(^|, )location(,|$)")
        self.assertIn("location", negative)
        self.assertIn("white rifle", prompt)
        aya, _ = compose_prompt("aya", "live")
        self.assertIn("short hair", aya)
        self.assertIn("blue scabbard", aya)

    def test_account_helpers(self):
        sub = {
            "tier": 3,
            "active": True,
            "expiresAt": 1788009937,
            "trainingStepsLeft": {
                "fixedTrainingStepsLeft": 0,
                "purchasedTrainingSteps": 0,
            },
            "usage": {"percent": 154, "isNegative": False},
            "isGracePeriod": False,
        }
        self.assertEqual(anlas_from_subscription(sub), 0)
        account = summarize_account(sub, {"banStatus": "not_banned"})
        self.assertTrue(account["is_opus"])
        self.assertEqual(account["anlas"], 0)
        self.assertEqual(account["v5_usage_percent"], 154)
        assert_safe_to_generate(account)

        tablet = summarize_account({**sub, "tier": 1}, {"banStatus": "not_banned"})
        with self.assertRaises(SafetyError):
            assert_safe_to_generate(tablet)

        banned = summarize_account(sub, {"banStatus": "banned"})
        with self.assertRaises(SafetyError):
            assert_safe_to_generate(banned)

    def test_scene_prompts_are_empty_and_widescreen(self):
        self.assertIn("lobby_wide", SCENES)
        self.assertNotIn("sayo", SCENES)
        self.assertNotIn("aya", SCENES)
        self.assertNotIn("rion", SCENES)
        for sid, spec in SCENES.items():
            prompt, negative = compose_scene_prompt(sid)
            self.assertTrue(prompt.startswith("{artist:ciloranko}"), sid)
            self.assertIn("no humans", prompt, sid)
            self.assertIn("location", prompt, sid)
            self.assertNotIn("1girl", prompt, sid)
            self.assertIn("people", negative, sid)
            self.assertIn("letterbox", negative, sid)
            self.assertEqual(spec["size"], "landscape", sid)
            self.assertGreater(spec["canvas"][0], spec["canvas"][1], sid)
        cg_ids = ("stage_1_cg", "stage_2_cg", "stage_3_cg", "stage_4_cg")
        for sid in cg_ids:
            self.assertIn(sid, SCENES)
            self.assertEqual(SCENES[sid]["canvas"], (1600, 900), sid)
        self.assertEqual(SCENES["banner_bg"]["canvas"], (1280, 720))

    def test_prop_prompts_are_still_life(self):
        extra = (
            "weapon_sayo_spare",
            "weapon_sayo_petal",
            "weapon_aya_side",
            "weapon_aya_twin",
            "weapon_rion_wood",
            "weapon_rion_under",
            "weapon_sayo_final",
            "weapon_aya_mirror",
            "weapon_rion_burial",
        )
        for pid in (
            "night_radio",
            "shrine_seal",
            "void_ticket",
            "cherry_crown",
            "card_back",
            "weapon_mirror_round",
            "weapon_shard_blade",
            "weapon_radio_bat",
            *extra,
        ):
            prompt, negative = compose_prop_prompt(pid)
            self.assertIn("still life", prompt, pid)
            self.assertIn("no humans", prompt, pid)
            self.assertNotIn("1girl", prompt, pid)
            self.assertIn("people", negative, pid)
            self.assertEqual(PROPS[pid]["size"], "portrait", pid)
            self.assertEqual(PROPS[pid]["canvas"], (768, 1024), pid)

    def test_last_witness_is_adult_man_not_heroine(self):
        self.assertIn("last_witness", PEOPLE)
        self.assertNotIn("last_witness", PROPS)
        self.assertNotIn("sayo", PEOPLE)
        self.assertNotIn("aya", PEOPLE)
        self.assertNotIn("rion", PEOPLE)
        prompt, negative = compose_person_prompt("last_witness")
        self.assertTrue(prompt.startswith("{artist:ciloranko}"))
        self.assertIn("1boy", prompt)
        self.assertIn("adult man", prompt)
        self.assertIn("25 years old", prompt)
        self.assertIn("fully clothed", prompt)
        self.assertIn("safe for work", prompt)
        self.assertNotIn("1girl", prompt)
        self.assertNotIn("long purple hair", prompt)
        self.assertNotIn("silver hair", prompt)
        self.assertNotIn("red inner hair", prompt)
        self.assertIn("1girl", negative)
        self.assertIn("child", negative)
        self.assertEqual(PEOPLE["last_witness"]["dest"], "gacha/last_witness.webp")
        self.assertEqual(PEOPLE["last_witness"]["canvas"], (768, 1024))

    def test_cover_fit_fills_canvas(self):
        from PIL import Image

        src = Image.new("RGB", (1216, 832), (40, 20, 60))
        out = cover_fit(src, (1600, 900))
        self.assertEqual(out.size, (1600, 900))
        self.assertEqual(out.getpixel((0, 0)), (40, 20, 60))
        self.assertEqual(out.getpixel((1599, 899)), (40, 20, 60))


if __name__ == "__main__":
    unittest.main()
