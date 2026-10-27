#!/usr/bin/env python3
"""Explicit one-time IPA SA afternoon-I PDF vendor, NEVER run during site builds.

Sources: src/data/pm1-sources.json. Sources and downloaded SHA-256 are
recorded in the committed manifest. Fails closed on missing or altered PDFs.
"""
import hashlib
import json
import os
import re
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / "src/data/pm1-sources.json"
OUTPUT = ROOT / "public/practice/pm1/pdfs"
MAX_BYTES = 16_000_000

def valid_pdf(data: bytes) -> bool:
    return 100_000 <= len(data) < MAX_BYTES and data.startswith(b"%PDF-") and b"%%EOF" in data[-2048:]

def download(url: str) -> bytes:
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.hostname != "www.ipa.go.jp" or not parsed.path.endswith("_sa_pm1_qs.pdf"):
        raise ValueError("Untrusted IPA source: " + url)
    for attempt in range(3):
        try:
            with urlopen(Request(url, headers={"User-Agent":"SA-Architecture-Library/1.0"}), timeout=55) as response:
                final = urlparse(response.geturl())
                if final.scheme != "https" or final.hostname != "www.ipa.go.jp":
                    raise ValueError("PDF redirected away from IPA")
                data = response.read(MAX_BYTES + 1)
            if not valid_pdf(data):
                raise ValueError("Invalid or truncated official PDF: " + url)
            return data
        except Exception:
            if attempt == 2:
                raise
            import time
            time.sleep(attempt + 2)

def main():
    import fitz  # PyMuPDF only for an explicit import, not the regular build.
    records = json.loads(SOURCES.read_text(encoding="utf-8"))
    OUTPUT.mkdir(parents=True, exist_ok=True)
    manifest = {}
    for record in records:
        year_id = record["id"]
        if not re.fullmatch(r"20\d{2}[rh]\d{2}[ah]", year_id):
            raise ValueError("Invalid year identifier")
        target = OUTPUT / (year_id + ".pdf")
        data = target.read_bytes() if target.exists() else download(record["pdfUrl"])
        if not valid_pdf(data):
            raise ValueError("Invalid PDF: " + str(target))
        doc = fitz.open(stream=data, filetype="pdf")
        if len(doc) != record["pages"] or doc.is_encrypted:
            raise ValueError(f"{year_id}: expected {record['pages']} unencrypted pages, got {len(doc)}")
        doc.close()
        digest = hashlib.sha256(data).hexdigest()
        if not target.exists():
            temp = target.with_suffix(".pdf.tmp")
            temp.write_bytes(data)
            os.replace(temp, target)
        manifest[year_id] = {
            "source": record["pdfUrl"], "sourcePage": record["sourcePage"],
            "sha256": digest, "bytes": len(data), "pages": record["pages"],
            "questionCount": record["questionCount"]
        }
        print(year_id, len(data), "bytes; sha256", digest, flush=True)
    (OUTPUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("PASS: official PM1 PDFs vendored; no network access required at build time")

if __name__ == "__main__":
    main()
