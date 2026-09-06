#!/usr/bin/env python3
"""
Generates thumbnails in images/thumbs/ for every image in images/full/.
Run manually before pushing:

    python3 scripts/generate-thumbs.py

Requires Pillow:  pip3 install -r scripts/requirements.txt
"""

import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is not installed. Run: pip3 install -r scripts/requirements.txt")

ROOT = Path(__file__).resolve().parent.parent
FULL_DIR = ROOT / "images" / "full"
THUMBS_DIR = ROOT / "images" / "thumbs"
MAX_WIDTH = 480
JPEG_QUALITY = 80
EXTENSIONS = {".jpg", ".jpeg", ".png"}


def generate_thumb(src_path: Path, dest_path: Path) -> None:
    with Image.open(src_path) as img:
        img = img.convert("RGB")
        if img.width > MAX_WIDTH:
            ratio = MAX_WIDTH / img.width
            new_size = (MAX_WIDTH, round(img.height * ratio))
            img = img.resize(new_size, Image.LANCZOS)
        dest_path.parent.mkdir(parents=True, exist_ok=True)
        img.save(dest_path, "JPEG", quality=JPEG_QUALITY, optimize=True)


def main() -> None:
    if not FULL_DIR.exists():
        sys.exit(f"Chybí složka: {FULL_DIR}")

    sources = sorted(p for p in FULL_DIR.iterdir() if p.suffix.lower() in EXTENSIONS)
    if not sources:
        print(f"Ve složce {FULL_DIR} nejsou žádné obrázky.")
        return

    created, skipped = 0, 0
    for src in sources:
        dest = THUMBS_DIR / (src.stem + ".jpg")
        if dest.exists() and dest.stat().st_mtime >= src.stat().st_mtime:
            skipped += 1
            continue
        generate_thumb(src, dest)
        created += 1
        print(f"  {src.name} -> {dest.relative_to(ROOT)}")

    print(f"Hotovo: {created} vygenerováno, {skipped} přeskočeno (už aktuální).")


if __name__ == "__main__":
    main()
