"""Собирает данные для веб-версии из папки python/.

Скрипт копирует картинки в ./img (сохраняя имена файлов) и создаёт
js/data.js с набором карт, шаблоном .h3t (base64) и списком картинок.

Запуск из корня проекта:
    python tools/build-data.py

Пересобирать нужно только после правок python/cards.json или шаблона.
"""

from __future__ import annotations

import base64
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "python"
OUT_JS = ROOT / "js"
OUT_IMG = ROOT / "img"

CARD_DECK_FILE = SRC / "cards.json"
TEMPLATE_FILE = SRC / "Jebus Cross.h3t"


def main() -> None:
    OUT_JS.mkdir(parents=True, exist_ok=True)
    if OUT_IMG.exists():
        shutil.rmtree(OUT_IMG)
    shutil.copytree(SRC / "img", OUT_IMG)

    manifest = sorted(
        path.name for path in OUT_IMG.iterdir() if path.is_file()
    )
    deck = json.loads(CARD_DECK_FILE.read_text(encoding="utf-8"))
    if isinstance(deck, dict):
        deck = deck.get("cards", [])
    template_b64 = base64.b64encode(TEMPLATE_FILE.read_bytes()).decode("ascii")

    js = (
        "/* Файл создан tools/build-data.py — не редактируйте вручную. */\n"
        "window.CARD_DECK_RAW = "
        + json.dumps(deck, ensure_ascii=False, indent=2)
        + ";\n"
        'window.TEMPLATE_B64 = "'
        + template_b64
        + '";\n'
        "window.IMG_MANIFEST = "
        + json.dumps(manifest, ensure_ascii=False, indent=2)
        + ";\n"
    )
    (OUT_JS / "data.js").write_text(js, encoding="utf-8")

    print(f"Картинок: {len(manifest)}")
    print(f"Карт: {len(deck)}")
    print(f"Шаблон: {TEMPLATE_FILE.name} ({TEMPLATE_FILE.stat().st_size} байт)")
    print(f"Готово: {OUT_JS / 'data.js'}")


if __name__ == "__main__":
    main()
