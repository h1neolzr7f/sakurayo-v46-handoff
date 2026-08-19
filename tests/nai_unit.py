#!/usr/bin/env python3
"""Offline NovelAI pipeline tests. No network, no real token."""
from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools" / "nai"))

import generate as nai_gen  # noqa: E402
from nai_client import (  # noqa: E402
    DEFAULT_ARTIST_STRING,
    DEFAULT_NEGATIVE,
    NaiError,
    assert_free_quota,
    build_payload,
    classify_http_error,
    compile_job,
    compose_prompt,
    encode_character_ref,
    fit_opus_free_size,
    is_free_quota,
    is_v4_model,
    job_to_payload,
    load_jobs,
    load_token,
    payload_has_reference,
    redact,
    resolve_size,
    safe_job_id,
)


class SizeTests(unittest.TestCase):
    def test_presets(self):
        self.assertEqual(resolve_size("portrait"), (832, 1216))
        self.assertEqual(resolve_size("small"), (512, 768))
        self.assertEqual(resolve_size("landscape"), (1216, 832))
        self.assertTrue(is_free_quota(832, 1216, 28, 1))
        self.assertFalse(is_free_quota(1024, 1536, 28, 1))
        fitted_w, fitted_h, resized = fit_opus_free_size(1024, 1536)
        self.assertTrue(resized)
        self.assertTrue(is_free_quota(fitted_w, fitted_h, 28, 1))
        self.assertFalse(is_free_quota(832, 1216, 28, 1, has_reference=True))
        cheap = build_payload("1girl", size="portrait")
        assert_free_quota(cheap)
        costly = build_payload("1girl", size="portrait_large")
        with self.assertRaises(NaiError):
            assert_free_quota(costly)
        assert_free_quota(costly, spend_anlas=True)

    def test_custom_and_invalid(self):
        self.assertEqual(resolve_size(width=768, height=1280), (768, 1280))
        with self.assertRaises(NaiError):
            resolve_size("not-a-size")
        with self.assertRaises(NaiError):
            resolve_size(width=100, height=100)


class PayloadTests(unittest.TestCase):
    def test_v45_has_v4_prompt(self):
        payload = build_payload("1girl, solo", greenscreen=True)
        self.assertEqual(payload["model"], "nai-diffusion-4-5-full")
        self.assertTrue(is_v4_model(payload["model"]))
        self.assertIn("chroma key", payload["input"])
        self.assertTrue(payload["input"].startswith("artist:ciloranko"))
        self.assertEqual(payload["input"], payload["parameters"]["v4_prompt"]["caption"]["base_caption"])
        self.assertEqual(payload["parameters"]["negative_prompt"], DEFAULT_NEGATIVE)
        self.assertNotIn("Authorization", json.dumps(payload))

    def test_v3_skips_v4_blocks(self):
        payload = build_payload("1girl", model="nai-diffusion-3", size="square")
        self.assertNotIn("v4_prompt", payload["parameters"])
        self.assertEqual(payload["parameters"]["width"], 1024)
        self.assertEqual(payload["parameters"]["height"], 1024)

    def test_empty_prompt(self):
        with self.assertRaises(NaiError):
            build_payload("   ", artist=False)


class TokenTests(unittest.TestCase):
    def test_missing_token(self):
        env = {key: os.environ.pop(key) for key in ("NOVELAI_TOKEN", "NAI_TOKEN", "NOVELAI_ACCESS_KEY") if key in os.environ}
        try:
            with self.assertRaises(NaiError):
                load_token(search_files=())
        finally:
            os.environ.update(env)

    def test_env_token(self):
        os.environ["NOVELAI_TOKEN"] = "test-token-value"
        try:
            self.assertEqual(load_token(), "test-token-value")
        finally:
            del os.environ["NOVELAI_TOKEN"]

    def test_file_token_skips_comments(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "novelai.token"
            path.write_text("# comment\n\nabc.def.ghi\n", encoding="utf-8")
            from nai_client import _read_token_file
            self.assertEqual(_read_token_file(path), "abc.def.ghi")

    def test_redact(self):
        self.assertEqual(redact("Bearer secret-token leaked", "secret-token"), "Bearer [redacted-nai-token] leaked")


class JobTests(unittest.TestCase):
    def test_repo_jobs(self):
        jobs = load_jobs(ROOT / "assets" / "nai" / "jobs.jsonl")
        ids = [job["id"] for job in jobs]
        self.assertEqual(ids, [
            "sayo_stand_greenscreen",
            "aya_stand_greenscreen",
            "rion_stand_greenscreen",
            "lobby_wide",
        ])
        payload = job_to_payload(jobs[0])
        self.assertIn("#00ff00", payload["input"])
        self.assertIn(DEFAULT_ARTIST_STRING.split(",")[0], payload["input"])
        self.assertEqual(payload["parameters"]["width"], 832)
        self.assertTrue(payload_has_reference(payload))
        self.assertEqual(len(payload["parameters"]["director_reference_images"]), 2)
        self.assertEqual(payload["parameters"]["director_reference_descriptions"][0]["caption"]["base_caption"], "character")
        with self.assertRaises(NaiError):
            assert_free_quota(payload)
        lobby = job_to_payload(jobs[3])
        self.assertFalse(payload_has_reference(lobby))
        assert_free_quota(lobby)
        self.assertTrue(jobs[3]["out"].endswith("lobby_wide.png"))
        compiled = compile_job(jobs[0])
        self.assertTrue(compiled.snapshot["frozen"])
        self.assertTrue(compiled.snapshot["wouldSpendAnlas"])
        self.assertIn("character_reference", compiled.snapshot["spendReasons"])
        dumped = json.dumps(compiled.snapshot)
        self.assertNotIn("iVBORw0KGgo", dumped)

    def test_safe_id(self):
        self.assertEqual(safe_job_id("sayo stand!!"), "sayo_stand")
        with self.assertRaises(NaiError):
            safe_job_id("///")


class CliTests(unittest.TestCase):
    def test_dry_run_job(self):
        code = nai_gen.main(["dry-run", "--job-id", "lobby_wide"])
        self.assertEqual(code, 0)

    def test_gen_without_token(self):
        import nai_client
        env = {key: os.environ.pop(key) for key in ("NOVELAI_TOKEN", "NAI_TOKEN", "NOVELAI_ACCESS_KEY") if key in os.environ}
        old_files = nai_client.TOKEN_FILES
        nai_client.TOKEN_FILES = ()
        try:
            code = nai_gen.main(["gen", "--prompt", "1girl", "--out", "assets/image2/source/nai/_unit.png"])
            self.assertEqual(code, 2)
        finally:
            nai_client.TOKEN_FILES = old_files
            os.environ.update(env)

    def test_compose_prompt_idempotent(self):
        once = compose_prompt("1girl, chroma key", greenscreen=True)
        self.assertEqual(once.count("chroma key"), 1)
        self.assertTrue(once.startswith("artist:"))

    def test_character_ref_canvas(self):
        raw = encode_character_ref(ROOT / "android-app/app/src/main/assets/game/art/characters/sayo/default/portrait.webp")
        self.assertGreater(len(raw), 100)
        self.assertNotIn("\n", raw)

    def test_http_error_policy(self):
        server = classify_http_error(500, "boom")
        self.assertTrue(server.billing_uncertain)
        self.assertFalse(server.retry_safe)
        blocked = classify_http_error(403, "Your account has been restricted. Free generations are unavailable.")
        self.assertTrue(blocked.free_blocked)
        self.assertTrue(blocked.retry_safe)
        limited = classify_http_error(429, "slow down")
        self.assertTrue(limited.retry_safe)
        self.assertFalse(limited.billing_uncertain)


if __name__ == "__main__":
    unittest.main(verbosity=2)
