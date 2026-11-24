"""Сверяет шаблон, собранный в браузере, с эталонной сборкой Python (main.build_template).

Запуск: python tools/compare-template.py [port]
Браузер отправляет POST /compare с JSON {"state": {...}, "templateB64": "..."}.
Ответ — JSON с результатом сравнения (ряды, ячейки, правки).
"""
import base64
import csv
import io
import json
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "python"))
import main  # noqa: E402

SOURCE = ROOT / "python" / "Jebus Cross.h3t"
STATE_OUT = ROOT / "tools" / "_js_state.json"
TEMPLATE_OUT = ROOT / "tools" / "_js_template.bin"


def parse_tsv(text):
    return list(csv.reader(io.StringIO(text), delimiter="\t"))


def normalize_rows(rows):
    """Заменяет изменяемые поля (имя/описание) на маркер, чтобы сравнивать суть."""
    name_row, name_col = main.h3t_cell(rows, "Pack", "Options", "Name")
    desc_row, desc_col = main.h3t_cell(rows, "Pack", "Options", "Description")
    rows[name_row][name_col] = "<STAMP>"
    rows[desc_row][desc_col] = ""
    return rows


def python_rows(state):
    rows = main.load_h3t(SOURCE)
    zone_ids = main.card_zone_ids(state.get("cards") or [], state.get("zones") or {})
    instructions = []
    for idx, card in enumerate(state.get("cards") or []):
        for instr in main.normalize_template(card.get("template")):
            instr = dict(instr)
            if instr.get("target") == main.SELF_ZONE:
                target = zone_ids.get(idx)
                if not target:
                    continue
                instr["target"] = target
            elif instr.get("target") == main.OPP_ZONE:
                target = zone_ids.get(idx)
                if not target:
                    continue
                instr["target"] = str(5 - int(target))
            instructions.append(instr)
    applied = main.apply_template_instructions(rows, instructions)
    main.change_record(rows, "Pack", "Options", "Name", main.template_stamp(None))
    main.change_record(rows, "Pack", "Options", "Description", "")
    return rows, applied


def compare(state, template_b64):
    data = base64.b64decode(template_b64)
    TEMPLATE_OUT.write_bytes(data)
    STATE_OUT.write_text(json.dumps(state, ensure_ascii=False, indent=1), encoding="utf-8")
    js_text = data.decode("cp1251")
    js_rows = parse_tsv(js_text)
    py_rows, py_applied = python_rows(state)

    js_norm = normalize_rows([list(r) for r in js_rows])
    py_norm = normalize_rows([list(r) for r in py_rows])

    diffs = []
    max_rows = max(len(js_norm), len(py_norm))
    for r in range(max_rows):
        a = js_norm[r] if r < len(js_norm) else None
        b = py_norm[r] if r < len(py_norm) else None
        if a is None or b is None:
            diffs.append({"row": r, "js": a, "py": b})
            continue
        if len(a) != len(b):
            diffs.append({"row": r, "jsCols": len(a), "pyCols": len(b)})
        for c in range(min(len(a), len(b))):
            if a[c] != b[c]:
                diffs.append({"row": r + 1, "col": c + 1,
                              "js": a[c], "py": b[c]})
    return {
        "jsBytes": len(data),
        "jsTextChars": len(js_text),
        "jsRows": len(js_rows),
        "pyRows": len(py_rows),
        "jsCols": len(js_rows[0]) if js_rows else 0,
        "pyCols": len(py_rows[0]) if py_rows else 0,
        "cellDiffs": diffs[:50],
        "cellDiffCount": len(diffs),
        "pyApplied": len(py_applied),
        "applied": py_applied,
        "timestamp": js_text.split("\t")[3] if len(js_text.split("\t")) > 3 else None,
        "ok": not diffs,
    }


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._send(200, {"ok": True})

    def do_POST(self):
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length)
        try:
            payload = json.loads(raw.decode("utf-8"))
            result = compare(payload["state"], payload["templateB64"])
            self._send(200, result)
        except Exception as err:  # noqa: BLE001
            self._send(500, {"error": f"{type(err).__name__}: {err}"})

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8124
    print(f"compare server on 127.0.0.1:{port}", flush=True)
    HTTPServer(("127.0.0.1", port), Handler).serve_forever()
