#!/usr/bin/env python3
"""Verify tactical production art; ignored generation sources are not required."""
from hashlib import sha256
import json
from pathlib import Path, PurePosixPath, PureWindowsPath
import re
import sys

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PRODUCTION = 'android-app/app/src/main/assets/game/art/ui/tactical/'
MANIFESTS = (
    ('tactical_portraits_manifest.json', ('portrait-sayo-v3', 'portrait-aya-v3', 'portrait-rion-v3'),
     ('id', 'path', 'dimensions', 'bytes', 'sha256')),
    ('tactical_scenes_manifest.json', ('gacha-remnant-v3', 'gacha-fashion-v3', 'gacha-weapon-v3',
     'activity-story-v3', 'activity-testimony-v3', 'activity-maingod-v3', 'lobby-outpost-v3'),
     ('asset_id', 'production', 'production_size', 'production_bytes', 'production_sha256')),
)
CREDENTIAL_KEY = re.compile(r'(?:api[_-]?key|access[_-]?key|secret|password|credential|authorization|token)', re.I)
CREDENTIAL_VALUE = re.compile(r'(?:\bsk-[A-Za-z0-9_-]{12,}|\bBearer\s+\S+|\bAKIA[A-Z0-9]{16}\b|-----BEGIN [A-Z ]*PRIVATE KEY-----)', re.I)
WORKSPACE_PATH = re.compile(r'(?:/workspace(?:/|$)|/mnt/data(?:/|$)|[A-Za-z]:[\\/](?:workspace|Users)[\\/])', re.I)
PATH_FIELDS = {'path', 'source', 'source_path', 'production', 'style_reference', 'prompt_log', 'reference_images'}


def repository_path(root, value):
    """Allow normalized repo-relative paths, including absent ignored sources."""
    if not isinstance(value, str) or not value or '\\' in value:
        return None
    path = PurePosixPath(value)
    if path.is_absolute() or PureWindowsPath(value).drive or '..' in path.parts or path.as_posix() != value:
        return None
    resolved = (root / path).resolve()
    return resolved if resolved.is_relative_to(root.resolve()) else None


def scan_metadata(root, value, label, errors, path_field=False):
    if isinstance(value, dict):
        for key, child in value.items():
            if CREDENTIAL_KEY.search(key):
                errors.append(f'{label}: forbidden credential field')
            scan_metadata(root, child, label, errors, key in PATH_FIELDS)
    elif isinstance(value, list):
        for child in value:
            scan_metadata(root, child, label, errors, path_field)
    elif isinstance(value, str):
        # Report only a category; never echo a possible credential or private path.
        if CREDENTIAL_VALUE.search(value):
            errors.append(f'{label}: forbidden credential value')
        if WORKSPACE_PATH.search(value):
            errors.append(f'{label}: forbidden absolute workspace path')
        if path_field and repository_path(root, value) is None:
            errors.append(f'{label}: metadata paths must be repository-relative')


def check_assets(root=ROOT):
    errors, verified, total_bytes = [], 0, 0
    for filename, expected, fields in MANIFESTS:
        manifest_file = root / 'assets/image2' / filename
        try:
            manifest = json.loads(manifest_file.read_text(encoding='utf-8'))
        except (OSError, ValueError) as error:
            errors.append(f'{filename}: manifest unreadable ({type(error).__name__})')
            continue
        scan_metadata(root, manifest, filename, errors)
        if not isinstance(manifest, dict) or not isinstance(manifest.get('assets'), list):
            errors.append(f'{filename}: assets must be an array')
            continue
        id_field, path_field, size_field, bytes_field, hash_field = fields
        seen = set()
        for index, row in enumerate(manifest['assets']):
            label = f'{filename}: asset {index + 1}'
            if not isinstance(row, dict):
                errors.append(f'{label}: asset must be an object')
                continue
            asset_id = row.get(id_field)
            if not isinstance(asset_id, str) or asset_id not in expected:
                errors.append(f'{label}: unexpected asset ID')
                continue
            label = asset_id
            before = len(errors)
            if asset_id in seen:
                errors.append(f'{label}: duplicate manifest entry')
            seen.add(asset_id)
            if row.get('status') != 'visually_approved':
                errors.append(f'{label}: status must be visually_approved')
            relative = row.get(path_field)
            path = repository_path(root, relative)
            if relative != PRODUCTION + asset_id + '.webp' or path is None:
                errors.append(f'{label}: invalid production path')
                continue
            if not path.is_file():
                errors.append(f'{label}: missing production WebP')
                continue
            try:
                payload = path.read_bytes()
            except OSError as error:
                errors.append(f'{label}: production unreadable ({type(error).__name__})')
                continue
            expected_bytes = row.get(bytes_field)
            if type(expected_bytes) is not int or expected_bytes <= 0 or len(payload) != expected_bytes:
                errors.append(f'{label}: production byte count mismatch')
            expected_hash = row.get(hash_field)
            if not isinstance(expected_hash, str) or not re.fullmatch(r'[a-f0-9]{64}', expected_hash) or sha256(payload).hexdigest() != expected_hash:
                errors.append(f'{label}: production SHA256 mismatch')
            expected_size = row.get(size_field)
            valid_size = isinstance(expected_size, list) and len(expected_size) == 2 and all(type(size) is int and size > 0 for size in expected_size)
            try:
                with Image.open(path) as image:
                    if image.format != 'WEBP':
                        errors.append(f'{label}: production format must be WebP')
                    if not valid_size or image.size != tuple(expected_size):
                        errors.append(f'{label}: production dimensions mismatch')
                    for frame in range(getattr(image, 'n_frames', 1)):
                        image.seek(frame)
                        image.load()
            except (OSError, ValueError, EOFError, SyntaxError, Image.DecompressionBombError) as error:
                errors.append(f'{label}: production decode failed ({type(error).__name__})')
            if len(errors) == before:
                verified += 1
                total_bytes += len(payload)
        for missing in sorted(set(expected) - seen):
            errors.append(f'{missing}: missing manifest entry')
    return errors, verified, total_bytes


def main():
    errors, verified, total_bytes = check_assets()
    if errors:
        for error in errors:
            print(f'TACTICAL ART FAIL: {error}', file=sys.stderr)
        print(f'TACTICAL ART FAIL: {verified}/10 assets verified, {len(errors)} issues', file=sys.stderr)
        return 1
    print(f'TACTICAL ART PASS: {verified} approved local WebP files, {total_bytes:,} bytes; dimensions and SHA256 match')
    return 0


if __name__ == '__main__':
    sys.exit(main())
