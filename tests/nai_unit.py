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
    DEFAULT_NEGATIVE,
    NaiError,
    build_payload,
    compose_prompt,
    is_v4_model,
    job_to_payload,
    load_jobs,
    load_token,
    redact,
    resolve_size,
    safe_job_id,
)


class SizeTests(unittest.TestCase):
    def test_presets(self):
        self.assertEqual(resolve_size("portrait"), (832, 1216))
        self.assertEqual(resolve_size("landscape_wide"), (1536, 1024))

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
            build_payload("   ")


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
        self.assertEqual(payload["parameters"]["width"], 1024)
        self.assertTrue(jobs[3]["out"].endswith("lobby_wide.png"))

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


if __name__ == "__main__":
    unittest.main(verbosity=2)
