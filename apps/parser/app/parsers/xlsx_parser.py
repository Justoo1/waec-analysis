"""
WASSCE Results XLSX Parser.

Supports two layouts:
  1. Analytics export — one column per subject, cell value is the grade (A1–F9).
  2. Copied-from-PDF — metadata columns plus a single RESULTS column containing
     comma-separated "SUBJECT - GRADE" pairs (e.g. "ENGLISH LANG - B3, MATHS - C5").
"""

from __future__ import annotations

import logging
import re
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd

from app.parsers.pdf_parser import _parse_results

_log = logging.getLogger(__name__)

GRADE_VALUES = {"A1", "B2", "B3", "C4", "C5", "C6", "D7", "E8", "F9"}

_INDEX_RE = re.compile(r"^\d{8,10}$")

_RESULTS_COL_NAMES = ["RESULTS", "RESULT", "SUBJECTS", "GRADES"]

_INDEX_COL_NAMES = [
    "INDEX NUMBER", "INDEX NO", "INDEX NO.", "INDEX", "CANDIDATE INDEX",
    "INDEXNUMBER", "EXAM NUMBER",
]
_NAME_COL_NAMES = [
    "NAME", "FULL NAME", "FULLNAME", "CANDIDATE NAME", "CANDIDATE",
    "STUDENT NAME", "PUPIL NAME",
]
_GENDER_COL_NAMES = ["GENDER", "SEX", "M/F"]
_DOB_COL_NAMES = [
    "DATE OF BIRTH", "DOB", "DATE_OF_BIRTH", "BIRTH DATE", "BIRTHDATE",
]


def parse_xlsx(file_path: str | Path) -> list[dict[str, Any]]:
    """
    Parse a WASSCE Results XLSX file.

    Returns:
        list of candidate dicts in the same format as pdf_parser.parse_pdf.
    """
    df = pd.read_excel(str(file_path), engine="openpyxl", dtype=str)
    df.columns = [str(c).strip().upper() for c in df.columns]

    _log.info("XLSX columns detected: %s", list(df.columns))

    candidates: list[dict[str, Any]] = []

    index_col = _find_column(df, _INDEX_COL_NAMES)
    name_col = _find_column(df, _NAME_COL_NAMES)
    gender_col = _find_column(df, _GENDER_COL_NAMES)
    dob_col = _find_column(df, _DOB_COL_NAMES)
    results_col = _find_column(df, _RESULTS_COL_NAMES)

    _log.info(
        "XLSX column mapping — index:%s  name:%s  gender:%s  dob:%s  results:%s",
        index_col, name_col, gender_col, dob_col, results_col,
    )

    if not index_col or not name_col:
        _log.warning(
            "XLSX parse aborted: could not find index or name column in %s",
            list(df.columns),
        )
        return []

    meta_cols = {c for c in [index_col, name_col, gender_col, dob_col, results_col] if c}
    subject_cols = [c for c in df.columns if c not in meta_cols]

    for _, row in df.iterrows():
        raw_index = str(row.get(index_col, "") or "").strip()
        # Strip any leading zeros that Excel may have dropped, then re-validate
        index_number = raw_index.lstrip("0") or raw_index
        # Accept 8–10 digit index numbers (matches PDF parser behaviour)
        if not _INDEX_RE.match(raw_index):
            continue
        index_number = raw_index  # preserve original including leading zeros

        if results_col:
            # Layout 2: single RESULTS cell with all subjects as a string
            results = _parse_results(str(row.get(results_col, "") or ""))
        else:
            # Layout 1: each column is a subject, cell value is the grade
            results = []
            for subject in subject_cols:
                grade = str(row.get(subject, "") or "").strip().upper()
                if grade in GRADE_VALUES:
                    results.append({"subject": subject.strip().upper(), "grade": grade})

        if not results:
            continue

        candidates.append(
            {
                "index_number": index_number,
                "full_name": str(row.get(name_col, "") or "").strip().upper(),
                "gender": str(row.get(gender_col, "") or "").strip().upper()[:1] or None,
                "date_of_birth": _parse_dob_cell(row.get(dob_col) if dob_col else None),
                "results": results,
            }
        )

    _log.info("XLSX parsed %d candidates", len(candidates))
    return candidates


def _find_column(df: pd.DataFrame, names: list[str]) -> str | None:
    """Return the first column name (case-insensitive) that matches any candidate."""
    col_upper = {c: c for c in df.columns}
    for name in names:
        if name in col_upper:
            return col_upper[name]
    # Partial-match fallback: column contains the keyword
    for name in names:
        for col in df.columns:
            if name in col:
                return col
    return None


def _parse_dob_cell(value: Any) -> str | None:
    """Normalise an Excel DOB cell to YYYY-MM-DD, handling multiple formats."""
    if value is None:
        return None
    raw = str(value).strip()
    if not raw or raw.lower() in {"nan", "none", "nat"}:
        return None
    # Already ISO format or pandas datetime string (e.g. "2005-03-15 00:00:00")
    for fmt in (
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%d-%m-%Y",
        "%m/%d/%Y",
    ):
        try:
            return datetime.strptime(raw, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None
