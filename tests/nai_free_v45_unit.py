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
        self.assertIsNone(payload["parameters"]["skip_cfg_above_sigma"])
        self.assertNotIn("image", payload["parameters"])

    def test_presets_are_adult_and_clothed(self):
        for name, prompt in CHAR_PRESETS.items():
            self.assertIn("20 years old", prompt, name)
            self.assertIn("fully clothed", prompt, name)
            self.assertIn("safe for work", prompt, name)

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


if __name__ == "__main__":
    unittest.main()
