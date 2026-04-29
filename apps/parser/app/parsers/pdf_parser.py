"""
WASSCE Results Listing PDF Parser.

The WASSCE PDF format (from resultslisting.wasscegh.org):
- A3 page (841×1191 pts), ~5 candidates per page
- Columns: INDEX NUMBER | NAME | GENDER | DOB | RESULTS
- RESULTS: comma-separated "SUBJECT - GRADE" pairs
- Names may span 2-3 lines within the cell

Extraction strategy (applied per page, first hit wins):
  1. lines   — uses drawn table rules (official WASSCE PDFs)
  2. text    — uses whitespace column separation (Excel-exported PDFs)
  3. raw     — plain text anchored on 10-digit index numbers (last resort)
  4. OCR     — Tesseract on rendered page images (image-based / rasterized PDFs)

Fallback only fires when NO tables are detected on a page, not merely when
a page's tables contain only header/empty rows.
"""

from __future__ import annotations

import re
from datetime import datetime
from pathlib import Path
from typing import Any, Callable

import gc
import logging

import pdfplumber

# pdfminer runs at DEBUG by default and logs every PDF token — suppress it
logging.getLogger("pdfminer").setLevel(logging.WARNING)
logging.getLogger("pdfplumber").setLevel(logging.WARNING)

_log = logging.getLogger(__name__)

# Matches WASSCE subject-grade pairs.
# Grade character class also accepts common OCR misreads so they can be
# normalized downstream (e.g. E8→ES, C5→CS, C6→CG).
# _clean_ocr_text normalizes Unicode dashes to '-' before this runs.
SUBJECT_GRADE_RE = re.compile(
    r"([A-Z][A-Z\s\(\)&/\.]+?)\s*-\s*(A[1lI]|B[23]|C[456SsGgb+]|D7|E[8BSs]|F[9gGq])",
    re.IGNORECASE,
)

# Maps OCR-garbled 2-char grade codes to their correct WASSCE equivalents
_GRADE_NORM: dict[str, str] = {
    "AL": "A1", "AI": "A1",
    "C+": "C4",
    "CS": "C5",
    "CG": "C6", "CB": "C6",
    "EB": "E8", "ES": "E8",
    "FG": "F9", "FQ": "F9",
}
_VALID_GRADES = frozenset({"A1", "B2", "B3", "C4", "C5", "C6", "D7", "E8", "F9"})

INDEX_RE = re.compile(r"\b(\d{8,10})\b")
_GENDER_RE = re.compile(r"\b(male|female)\b", re.IGNORECASE)
_DATE_RE = re.compile(r"\b(\d{1,2}[/\-]\d{1,2}[/\-]\d{4}|\d{4}[/\-]\d{2}[/\-]\d{2})\b")

# OCR: fix common digit/letter confusions inside 10-character numeric runs
_OCR_DIGIT_RUN = re.compile(r"\b[0-9OolISB]{8,10}\b")


def parse_pdf(
    file_path: str | Path,
    progress_cb: Callable[[int, int, str], None] | None = None,
) -> list[dict[str, Any]]:
    """
    Parse a WASSCE Results Listing PDF.

    Returns:
        list of candidate dicts::

            {
                "index_number": "0040103001",
                "full_name": "ACHEAMPONG KWAME",
                "gender": "M",
                "date_of_birth": "2005-03-15",
                "results": [
                    {"subject": "ENGLISH LANGUAGE", "grade": "B3"},
                    ...
                ]
            }
    """
    candidates: list[dict[str, Any]] = []

    with pdfplumber.open(str(file_path)) as pdf:
        total = len(pdf.pages)
        _log.info("PDF opened: %d pages", total)

        is_image_pdf = False
        if total > 0:
            p0 = pdf.pages[0]
            _log.info(
                "Page 1 — chars:%d  rects:%d  lines:%d  images:%d  text_snippet:%r",
                len(p0.chars), len(p0.rects), len(p0.lines), len(p0.images),
                (p0.extract_text() or "")[:120],
            )
            is_image_pdf = len(p0.chars) == 0 and len(p0.images) > 0
            _log.info("is_image_pdf=%s", is_image_pdf)
            p0.flush_cache()

        if is_image_pdf:
            return _parse_pdf_ocr(file_path, total, progress_cb=progress_cb)

        for i, page in enumerate(pdf.pages):
            # Try lines strategy first (fast — official WASSCE PDFs have drawn rules).
            tables_found, page_candidates = _extract_from_tables(page, "lines")

            if not tables_found:
                # No drawn rules detected — try whitespace-column detection.
                tables_found, page_candidates = _extract_from_tables(page, "text")

            if not tables_found:
                # No table structure at all — fall back to raw text parsing.
                page_candidates = _parse_raw_text(page)

            candidates.extend(page_candidates)

            if progress_cb:
                progress_cb(i + 1, total, "text")

            # Release this page's decompressed content from memory.
            # Without this, pdfplumber holds every page's data for the lifetime
            # of the open() context — a 90 MB PDF can expand to 500 MB+ in RAM.
            page.flush_cache()
            if i % 20 == 0:
                gc.collect()

    return candidates


def _parse_pdf_ocr(
    file_path: str | Path,
    total_pages: int,
    progress_cb: Callable[[int, int, str], None] | None = None,
) -> list[dict[str, Any]]:
    """
    OCR fallback for fully rasterized PDFs (no text layer).

    Renders pages in batches of 5 at 300 DPI then routes each page through
    _ocr_table_page, which uses OpenCV to remove the WAEC watermark and
    extract per-candidate row strips before calling Tesseract.
    """
    from pdf2image import convert_from_path
    from PIL import Image  # noqa: F401 — used inside _ocr_table_page
    import pytesseract    # noqa: F401 — used inside _ocr_table_page
    import numpy as np    # noqa: F401 — used inside _ocr_table_page

    BATCH = 5
    candidates: list[dict[str, Any]] = []

    for start in range(1, total_pages + 1, BATCH):
        end = min(start + BATCH - 1, total_pages)
        images = convert_from_path(
            str(file_path),
            dpi=300,
            first_page=start,
            last_page=end,
            grayscale=True,
        )
        for pil_img in images:
            arr = np.array(pil_img)
            candidates.extend(_ocr_table_page(arr))
            del arr
        del images
        gc.collect()
        _log.info("OCR progress: page %d/%d", end, total_pages)
        if progress_cb:
            progress_cb(end, total_pages, "ocr")

    return candidates


def _ocr_table_page(arr: Any) -> list[dict[str, Any]]:
    """
    Extract candidates from one rasterised WASSCE results page using OpenCV.

    Pipeline:
      1. Adaptive threshold — each 21×21 block gets its own cutoff, so the
         medium-grey WAEC watermark is treated as local background and becomes 0
         while dark text strokes become 255 (THRESH_BINARY_INV).
      2. Horizontal line detection — morphological OPEN with a wide kernel finds
         the table row separators and projects them to y-coordinates.
      3. Connected-component filtering — removes large watermark blobs while
         preserving character-sized components. At 300 DPI a capital letter is
         ~1 200 px²; watermark crest segments are typically 10 000+ px².
      4. Per-row OCR — each candidate strip is OCR'd in isolation (PSM 6),
         then parsed by the existing _parse_raw_block regex pipeline.
    """
    import cv2
    from PIL import Image
    import pytesseract
    import numpy as np

    h, w = arr.shape

    # 1. Adaptive threshold
    binary = cv2.adaptiveThreshold(
        arr, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        blockSize=21, C=10,
    )

    # 2. Detect horizontal table rules
    horiz_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (w // 5, 1))
    horiz = cv2.morphologyEx(binary, cv2.MORPH_OPEN, horiz_kernel)
    projection = np.sum(horiz, axis=1) // 255
    line_ys = np.where(projection >= w * 0.25)[0]
    line_centers = _cluster_ys(line_ys)

    # 3. Connected-component watermark removal
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(binary, 8)
    clean = np.zeros_like(binary)
    for i in range(1, num_labels):
        if stats[i, cv2.CC_STAT_AREA] < 8000:
            clean[labels == i] = 255
    ocr_ready = 255 - clean  # invert: text=black(0), background=white(255)

    # 4a. Fallback: no table structure detected
    if len(line_centers) < 2:
        text = pytesseract.image_to_string(
            Image.fromarray(ocr_ready), config="--oem 3 --psm 6"
        )
        text = _clean_ocr_text(text)
        text = _sanitize_ocr_digits(text)
        return _parse_text_blocks(text)

    # 4b. OCR each candidate row strip
    candidates: list[dict[str, Any]] = []
    for i in range(1, len(line_centers)):
        y1 = max(0, line_centers[i - 1] + 2)
        y2 = min(h, line_centers[i] - 2)
        if y2 - y1 < 30:
            continue
        row_strip = Image.fromarray(ocr_ready[y1:y2, :])
        text = pytesseract.image_to_string(row_strip, config="--oem 3 --psm 6")
        text = _clean_ocr_text(text)
        text = _sanitize_ocr_digits(text)
        c = _parse_raw_block(text)
        if c:
            candidates.append(c)

    return candidates


def _cluster_ys(ys: Any, gap: int = 6) -> list[int]:
    """Collapse consecutive y-coordinates into single line centres."""
    import numpy as np
    if len(ys) == 0:
        return []
    groups: list[list[int]] = [[int(ys[0])]]
    for y in ys[1:]:
        if int(y) - groups[-1][-1] <= gap:
            groups[-1].append(int(y))
        else:
            groups.append([int(y)])
    return [int(np.mean(g)) for g in groups]


def _clean_ocr_text(text: str) -> str:
    """Remove common OCR artefacts before parsing."""
    # Pipe chars are table cell borders rendered by Tesseract
    text = text.replace("|", " ")
    # Normalize Unicode en-dash / em-dash to ASCII hyphen so SUBJECT_GRADE_RE
    # matches regardless of which dash character Tesseract chose
    text = text.replace("–", "-").replace("—", "-")
    # Remove spurious spaces that Tesseract inserts inside digit sequences
    # e.g. "004123 5001" → "0041235001"
    text = re.sub(r"(?<=\d) +(?=\d)", "", text)
    # Collapse multiple spaces
    text = re.sub(r" {2,}", " ", text)
    return text


def _sanitize_ocr_digits(text: str) -> str:
    """Fix common OCR digit/letter confusions within 10-character numeric runs."""
    def fix(m: re.Match) -> str:
        s = m.group(0)
        return (s.replace("O", "0").replace("o", "0")
                  .replace("l", "1").replace("I", "1")
                  .replace("S", "5").replace("B", "8"))
    return _OCR_DIGIT_RUN.sub(fix, text)


def _extract_from_tables(
    page: Any, strategy: str
) -> tuple[bool, list[dict[str, Any]]]:
    """
    Run pdfplumber table extraction with the given strategy.

    Returns (tables_were_found, candidates).
    Fallback is only warranted when tables_were_found is False — not when
    tables exist but contain only header/blank rows.
    """
    tables = page.extract_tables(
        table_settings={
            "vertical_strategy": strategy,
            "horizontal_strategy": strategy,
        }
    )
    if not tables:
        return False, []

    candidates: list[dict[str, Any]] = []
    for table in tables:
        for row in table:
            candidate = _parse_table_row(row)
            if candidate:
                candidates.append(candidate)
    return True, candidates


def _parse_raw_text(page: Any) -> list[dict[str, Any]]:
    """
    Last-resort fallback: extract candidates from raw page text.

    Groups lines into per-candidate blocks by anchoring on 10-digit index
    numbers, then extracts name/gender/DOB/results with regex.
    """
    text = page.extract_text(x_tolerance=3, y_tolerance=3)
    return _parse_text_blocks(text or "")


def _parse_text_blocks(text: str) -> list[dict[str, Any]]:
    """Group raw text by 10-digit index anchors and parse each block."""
    if not text:
        return []

    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]

    blocks: list[str] = []
    current: list[str] = []
    for line in lines:
        if INDEX_RE.search(line):
            if current:
                blocks.append(" ".join(current))
            current = [line]
        elif current:
            current.append(line)
    if current:
        blocks.append(" ".join(current))

    return [c for c in (_parse_raw_block(b) for b in blocks) if c]


def _parse_raw_block(block: str) -> dict[str, Any] | None:
    """Parse one candidate's worth of raw text into a candidate dict."""
    index_match = INDEX_RE.search(block)
    if not index_match:
        return None

    index_number = index_match.group(1)
    results = _parse_results(block)
    if not results:
        return None

    gender: str | None = None
    gender_match = _GENDER_RE.search(block)
    if gender_match:
        gender = gender_match.group(1)[0].upper()  # "M" or "F"

    date_of_birth: str | None = None
    for m in _DATE_RE.finditer(block):
        parsed = _parse_dob(m.group(1))
        if parsed:
            date_of_birth = parsed
            break

    # Name: text between the end of the index number and the first
    # gender/date/subject match (whichever comes first).
    name_start = index_match.end()
    name_end = len(block)
    for pattern in (_GENDER_RE, _DATE_RE, SUBJECT_GRADE_RE):
        m = pattern.search(block, name_start)
        if m and m.start() < name_end:
            name_end = m.start()
    full_name = block[name_start:name_end].strip().upper()[:100]

    return {
        "index_number": index_number,
        "full_name": full_name,
        "gender": gender,
        "date_of_birth": date_of_birth,
        "results": results,
    }


def _parse_table_row(row: list[str | None]) -> dict[str, Any] | None:
    if not row or len(row) < 5:
        return None

    raw_index = (row[0] or "").strip()
    index_match = INDEX_RE.search(raw_index)
    if not index_match:
        return None

    index_number = index_match.group(1)
    full_name = (row[1] or "").replace("\n", " ").strip().upper()
    gender = (row[2] or "").strip().upper()[:1] or None
    raw_dob = (row[3] or "").strip()
    raw_results = " ".join(str(c or "") for c in row[4:])

    date_of_birth = _parse_dob(raw_dob)
    results = _parse_results(raw_results)

    if not results:
        return None

    return {
        "index_number": index_number,
        "full_name": full_name,
        "gender": gender if gender in {"M", "F"} else None,
        "date_of_birth": date_of_birth,
        "results": results,
    }


def _parse_results(raw: str) -> list[dict[str, str]]:
    matches = SUBJECT_GRADE_RE.findall(raw)
    results = []
    for subject, raw_grade in matches:
        grade = _GRADE_NORM.get(raw_grade.upper(), raw_grade.upper())
        if grade in _VALID_GRADES:
            results.append({"subject": subject.strip().upper(), "grade": grade})
    return results


def _parse_dob(raw: str) -> str | None:
    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(raw.strip(), fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None
