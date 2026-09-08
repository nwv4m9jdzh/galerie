#!/usr/bin/env python3
"""
Imports source photos of paintings into images/full/ and data/artworks.json.

Usage:
    python3 scripts/import-artworks.py [zdrojova_slozka]

Zdrojová složka defaultně: ~/Desktop/2026 09 06 malby uprava
(lze přepsat prvním argumentem, např. při přesunu složky).

Co skript dělá pro každou fotku ve zdrojové složce:
  - opraví EXIF rotaci z fotoaparátu a zmenší delší stranu na max.
    2048 px
  - odstraní EXIF metadata (fotky obsahují GPS polohu pořízení)
  - přejmenuje na stabilní alfanumerický název odvozený hashem ze
    zdrojového jména souboru — stejný zdrojový soubor tedy při
    opakovaném spuštění (např. po úpravě barev v Kritě) přepíše
    stejný výstupní soubor, místo aby vznikaly duplicity

Znovu spusť po každé úpravě barevnosti/obsahu fotek ve zdrojové
složce.

Pozor: přepíše data/artworks.json - ruční úpravy title/description
udělané přímo v JSONu se tímto spuštěním ztratí. Pokud už máš
u některých děl vyplněné skutečné názvy/popisy, zálohuj si je před
spuštěním a dopiš je zpátky.
"""

import hashlib
import json
import sys
from pathlib import Path

from PIL import Image, ImageOps

DEFAULT_SRC_DIR = Path.home() / "Desktop" / "2026 09 06 malby uprava"
PROJECT_ROOT = Path(__file__).resolve().parent.parent
FULL_DIR = PROJECT_ROOT / "images" / "full"
ARTWORKS_JSON = PROJECT_ROOT / "data" / "artworks.json"
MAX_LONG_EDGE = 2048
JPEG_QUALITY = 88
EXTENSIONS = {".jpg", ".jpeg"}

# EXIF DateTimeOriginal chybí -> ruční odhad data.
FALLBACK_DATES = {
    "IMG_6560.JPG": "2021-06-01",
}


def stable_id(name: str) -> str:
    return hashlib.sha1(name.encode("utf-8")).hexdigest()[:8]


def get_date(im: Image.Image, name: str) -> str:
    exif = im.getexif()
    raw = exif.get(36867) or exif.get(306)
    if raw:
        return raw.split(" ")[0].replace(":", "-")
    if name in FALLBACK_DATES:
        return FALLBACK_DATES[name]
    sys.exit(f"Chybí datum (EXIF i FALLBACK_DATES) pro: {name}")


def main():
    src_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SRC_DIR
    if not src_dir.exists():
        sys.exit(f"Zdrojová složka neexistuje: {src_dir}")

    sources = sorted(p for p in src_dir.iterdir() if p.suffix.lower() in EXTENSIONS)
    if not sources:
        sys.exit(f"Ve složce {src_dir} nejsou žádné .jpg soubory.")

    FULL_DIR.mkdir(parents=True, exist_ok=True)
    keep_filenames = set()
    entries = []

    for src in sources:
        im = Image.open(src)
        im = ImageOps.exif_transpose(im).convert("RGB")
        date = get_date(im, src.name)

        long_edge = max(im.size)
        if long_edge > MAX_LONG_EDGE:
            ratio = MAX_LONG_EDGE / long_edge
            im = im.resize((round(im.width * ratio), round(im.height * ratio)), Image.LANCZOS)

        file_id = stable_id(src.name)
        filename = f"{file_id}.jpg"
        keep_filenames.add(filename)
        im.save(FULL_DIR / filename, "JPEG", quality=JPEG_QUALITY, optimize=True)

        entries.append({
            "id": f"{date[:7]}-{file_id}",
            "date": date,
            "filename": filename,
            "title": {"cs": "Bez názvu", "en": "Untitled"},
            "description": {"cs": "", "en": ""},
            "width": im.width,
            "height": im.height,
        })
        print(f"  {src.name:35s} -> {filename}  date={date}  size={im.size}")

    # Uklidit obrázky, jejichž zdroj už ve složce není.
    for existing in FULL_DIR.glob("*.jpg"):
        if existing.name not in keep_filenames:
            existing.unlink()
            print(f"  smazáno (zdroj chybí): images/full/{existing.name}")

    entries.sort(key=lambda e: e["date"], reverse=True)
    ARTWORKS_JSON.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + "\n")
    print(f"\nHotovo: {len(entries)} děl zapsáno do {ARTWORKS_JSON.relative_to(PROJECT_ROOT)}")


if __name__ == "__main__":
    main()
