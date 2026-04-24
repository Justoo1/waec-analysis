"""
WAEC Results XLSX Parser.

Parses WAEC results exported as Excel spreadsheets.
Expected columns: Index Number, Name, Gender, DOB, Subject columns...
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pandas as pd

GRADE_VALUES = {"A1", "B2", "B3", "C4", "C5", "C6", "D7", "E8", "F9"}


def parse_xlsx(file_path: str | Path) -> list[dict[str, Any]]:
    """
    Parse a WAEC Results XLSX file.

    Returns:
        list of candidate dicts in the same format as pdf_parser.parse_pdf.
    """
    df = pd.read_excel(str(file_path), engine="openpyxl", dtype=str)
    df.columns = [str(c).strip().upper() for c in df.columns]

    candidates: list[dict[str, Any]] = []

    # Detect index number column
    index_col = _find_column(df, ["INDEX NUMBER", "INDEX NO", "INDEX"])
    name_col = _find_column(df, ["NAME", "FULL NAME", "CANDIDATE NAME"])
    gender_col = _find_column(df, ["GENDER", "SEX"])
    dob_col = _find_column(df, ["DATE OF BIRTH", "DOB", "DATE_OF_BIRTH"])

    if not index_col or not name_col:
        return []

    # Subject columns are everything after the known metadata columns
    meta_cols = {c for c in [index_col, name_col, gender_col, dob_col] if c}
    subject_cols = [c for c in df.columns if c not in meta_cols]

    for _, row in df.iterrows():
        index_number = str(row.get(index_col, "") or "").strip()
        if not index_number or len(index_number) != 10 or not index_number.isdigit():
            continue

        results: list[dict[str, str]] = []
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
                "date_of_birth": str(row.get(dob_col, "") or "").strip() or None,
                "results": results,
            }
        )

    return candidates


def _find_column(df: pd.DataFrame, candidates: list[str]) -> str | None:
    for c in candidates:
        if c in df.columns:
            return c
    return None
