"""
WAEC Results Listing PDF Parser.

The WAEC PDF format (from resultslisting.waecgh.org):
- A3 page (841×1191 pts), ~5 candidates per page
- Columns: INDEX NUMBER | NAME | GENDER | DOB | RESULTS
- RESULTS: comma-separated "SUBJECT - GRADE" pairs
- Names may span 2-3 lines within the cell
"""

from __future__ import annotations

import re
from datetime import datetime
from pathlib import Path
from typing import Any

import pdfplumber

# Matches: "ENGLISH LANGUAGE - B3" or "MATHEMATICS(CORE) - C6"
SUBJECT_GRADE_RE = re.compile(
    r"([A-Z][A-Z\s\(\)&/\.]+?)\s*-\s*(A1|B2|B3|C4|C5|C6|D7|E8|F9)",
    re.IGNORECASE,
)

INDEX_RE = re.compile(r"\b(\d{10})\b")


def parse_pdf(file_path: str | Path) -> list[dict[str, Any]]:
    """
    Parse a WAEC Results Listing PDF.

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
        for page in pdf.pages:
            tables = page.extract_tables(
                table_settings={
                    "vertical_strategy": "lines",
                    "horizontal_strategy": "lines",
                }
            )
            for table in tables:
                for row in table:
                    candidate = _parse_table_row(row)
                    if candidate:
                        candidates.append(candidate)

    return candidates


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
    return [
        {"subject": subject.strip().upper(), "grade": grade.upper()}
        for subject, grade in matches
    ]


def _parse_dob(raw: str) -> str | None:
    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(raw.strip(), fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None
