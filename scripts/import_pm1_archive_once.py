#!/usr/bin/env python3
"""One-time verified import of historical IPA SA PM1 originals.

Run ONLY from the temporary pm1-import-once workflow. Discover the actual
PDF hyperlink from each official IPA annual listing, verify the binary and
page count, then make and push one content-addressed Git commit per year.
Regular builds never download afternoon-I questions.
"""
import hashlib
import json
import os
import re
import subprocess
import time
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

import fitz

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "src/data/pm1-sources.json"
PDF_DIR = ROOT / "public/practice/pm1/pdfs"
MANIFEST = PDF_DIR / "manifest.json"
BRANCH = "feat/pm1-archive-2016-2022"
MAX_BYTES = 16_000_000

# Same exam calendar and year identifiers as src/data/am2.ts.
# Process newest-to-oldest, preserving one independently auditable commit per year.
YEARS = (
    ("2022r04h", "2022r04", "2022年度（令和4年・春期）", 4),
    ("2021r03h", "2021r03", "2021年度（令和3年・春期）", 4),
    ("2019r01a", "2019h31", "2019年度（令和元年・秋期）", 4),
    ("2018h30a", "2018h30", "2018年度（平成30年・秋期）", 4),
    ("2017h29a", "2017h29", "2017年度（平成29年・秋期）", 4),
    ("2016h28a", "2016h28", "2016年度（平成28年・秋期）", 4),
)


class LinkCollector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            link = dict(attrs).get("href")
            if link:
                self.links.append(link)


def ipa_get(url: str, max_bytes: int) -> bytes:
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.hostname != "www.ipa.go.jp":
        raise ValueError("Only official HTTPS IPA origin is allowed: " + url)
    for attempt in range(3):
        try:
            request = Request(url, headers={"User-Agent": "SA-Architecture-Library/1.0"})
            with urlopen(request, timeout=60) as response:
                redirected = urlparse(response.geturl())
                if redirected.scheme != "https" or redirected.hostname != "www.ipa.go.jp":
                    raise ValueError("Redirected away from official IPA origin")
                result = response.read(max_bytes + 1)
            if not result or len(result) > max_bytes:
                raise ValueError("Empty or oversized IPA response")
            return result
        except Exception as exc:
            if attempt == 2:
                raise
            print("RETRY:", url, str(exc), flush=True)
            time.sleep(2 + attempt * 2)
    raise AssertionError("unreachable")


def discover(year_id: str, listing: str) -> tuple[str, str]:
    source_page = "https://www.ipa.go.jp/shiken/mondai-kaiotu/" + listing + ".html"
    listing_html = ipa_get(source_page, 6_000_000).decode("utf-8", "replace")
    collector = LinkCollector()
    collector.feed(listing_html)
    expected = year_id + "_sa_pm1_qs.pdf"
    links = {
        urljoin(source_page, href)
        for href in collector.links
        if urlparse(urljoin(source_page, href)).path.rsplit("/", 1)[-1] == expected
    }
    if len(links) != 1:
        raise ValueError(f"{source_page}: expected exactly one official {expected}, found {len(links)}")
    pdf_url = next(iter(links))
    parsed = urlparse(pdf_url)
    if parsed.scheme != "https" or parsed.hostname != "www.ipa.go.jp":
        raise ValueError("Unexpected official PDF origin: " + pdf_url)
    return source_page, pdf_url


def verify_pdf(year_id: str, data: bytes) -> int:
    if not (100_000 <= len(data) <= MAX_BYTES and data.startswith(b"%PDF-")
            and b"%%EOF" in data[-2048:]):
        raise ValueError(f"{year_id}: invalid or truncated PDF ({len(data)} bytes)")
    document = fitz.open(stream=data, filetype="pdf")
    try:
        pages = len(document)
        if document.is_encrypted or pages < 12 or pages > 55:
            raise ValueError(f"{year_id}: unexpected encryption or page count {pages}")
        # A rendered page must contain actual printed content, not only PDF scaffolding.
        page = document.load_page(min(2, pages - 1))
        image = page.get_pixmap(matrix=fitz.Matrix(0.4, 0.4),
                                colorspace=fitz.csGRAY, alpha=False)
        dark_pixels = sum(pixel < 220 for pixel in image.samples)
        if dark_pixels < 700:
            raise ValueError(f"{year_id}: suspiciously blank rendered question page")
        print(f"VERIFIED {year_id}: {pages} pages; {dark_pixels} ink pixels on sample page",
              flush=True)
        return pages
    finally:
        document.close()


def write_json(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def git(*args: str) -> None:
    subprocess.run(["git", *args], cwd=ROOT, check=True)


def main() -> None:
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    if [record["id"] for record in catalog[:3]] != [
        "2025r07h", "2024r06h", "2023r05h"
    ]:
        raise ValueError("Original three canonical PM1 records differ")
    if set(manifest) != {record["id"] for record in catalog}:
        raise ValueError("Manifest and source catalog differ before import")

    git("config", "user.name", "github-actions[bot]")
    git("config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com")

    for year_id, listing, label, questions in YEARS:
        target = PDF_DIR / (year_id + ".pdf")
        existing = next((record for record in catalog if record["id"] == year_id), None)
        if existing is not None:
            if year_id not in manifest or not target.is_file():
                raise ValueError("Partially recorded import: " + year_id)
            data = target.read_bytes()
            page_count = verify_pdf(year_id, data)
            record = manifest[year_id]
            if (hashlib.sha256(data).hexdigest() != record["sha256"]
                    or len(data) != record["bytes"] or page_count != record["pages"]
                    or record["source"] != existing["pdfUrl"]):
                raise ValueError("Previously imported original changed: " + year_id)
            print("SKIP verified existing", year_id, flush=True)
            continue

        page_url, pdf_url = discover(year_id, listing)
        print("OFFICIAL", year_id, pdf_url, flush=True)
        pdf_bytes = ipa_get(pdf_url, MAX_BYTES)
        pages = verify_pdf(year_id, pdf_bytes)
        digest = hashlib.sha256(pdf_bytes).hexdigest()
        if target.exists():
            raise ValueError("Unindexed PDF already exists: " + str(target))

        PDF_DIR.mkdir(parents=True, exist_ok=True)
        temporary = target.with_suffix(".pdf.tmp")
        temporary.write_bytes(pdf_bytes)
        os.replace(temporary, target)
        catalog.append({
            "id": year_id, "label": label, "questionCount": questions,
            "pages": pages, "sourcePage": page_url, "pdfUrl": pdf_url
        })
        manifest[year_id] = {
            "source": pdf_url, "sourcePage": page_url,
            "sha256": digest, "bytes": len(pdf_bytes), "pages": pages,
            "questionCount": questions
        }
        write_json(CATALOG, catalog)
        write_json(MANIFEST, manifest)
        # The site and the browser test consume exactly these committed files.
        git("add", str(CATALOG.relative_to(ROOT)), str(MANIFEST.relative_to(ROOT)),
            str(target.relative_to(ROOT)))
        git("commit", "-m", f"assets: vendor IPA SA afternoon I {year_id} official PDF")
        git("push", "origin", "HEAD:" + BRANCH)
        print("COMMITTED", year_id, len(pdf_bytes), "bytes", "SHA-256", digest,
              flush=True)

    ids = [record["id"] for record in catalog]
    expected = ["2025r07h", "2024r06h", "2023r05h"] + [row[0] for row in YEARS]
    if ids != expected or list(manifest) != expected:
        raise ValueError("Final PM1 order/coverage mismatch")
    print("PASS: 9 official source PDFs / 9 manifest entries, 6 new year commits")


if __name__ == "__main__":
    main()
