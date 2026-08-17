"""Crop the user UI collage into one PNG per screen."""
from pathlib import Path
from shutil import copyfile

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = Path(
    r"C:\Users\tzzcomputer\.cursor\projects\c-Users-tzzcomputer-Documents-Codex-2026-07-10-new-chat-6-work-v423-delivery-source\assets\c__Users_tzzcomputer_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-67c8941d-9c21-4c6a-a53a-09d2c9848390.png"
)
HIRES_LOBBY = Path(
    r"C:\Users\tzzcomputer\.cursor\projects\c-Users-tzzcomputer-Documents-Codex-2026-07-10-new-chat-6-work-v423-delivery-source\assets\c__Users_tzzcomputer_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-628d85b7-5aeb-48c0-8dd1-29a82a6926cc.png"
)
OUT = ROOT / "docs" / "art-refs"

# 1024x682 sheet: one wide lobby on top, then 2x3 screens.
CROPS = [
    ("01-lobby", (0, 0, 1024, 350)),
    ("02-gacha", (8, 362, 340, 520)),
    ("03-roster", (346, 362, 682, 520)),
    ("04-shop", (688, 362, 1018, 520)),
    ("05-combat", (8, 530, 340, 680)),
    ("06-story", (346, 530, 682, 680)),
    ("07-profile", (688, 530, 1018, 680)),
]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    sheet = Image.open(SRC).convert("RGB")
    for name, box in CROPS:
        dest = OUT / f"{name}.png"
        sheet.crop(box).save(dest, "PNG")
        print(dest.name, dest.stat().st_size, box)
    if HIRES_LOBBY.exists():
        copyfile(HIRES_LOBBY, OUT / "01-lobby-hires.png")
        print("01-lobby-hires.png copied")


if __name__ == "__main__":
    main()
