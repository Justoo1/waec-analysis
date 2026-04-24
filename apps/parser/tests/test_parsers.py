"""Tests for the WAEC file parsers."""

from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from app.parsers.pdf_parser import _parse_dob, _parse_results, _parse_table_row
from app.parsers.xlsx_parser import _find_column, parse_xlsx


# ── PDF parser unit tests ──────────────────────────────────────────────────────

class TestParseDob:
    def test_slash_format(self):
        assert _parse_dob("15/03/2005") == "2005-03-15"

    def test_dash_format(self):
        assert _parse_dob("15-03-2005") == "2005-03-15"

    def test_iso_format(self):
        assert _parse_dob("2005-03-15") == "2005-03-15"

    def test_invalid_returns_none(self):
        assert _parse_dob("not-a-date") is None

    def test_empty_returns_none(self):
        assert _parse_dob("") is None


class TestParseResults:
    def test_single_subject(self):
        raw = "ENGLISH LANGUAGE - B3"
        results = _parse_results(raw)
        assert len(results) == 1
        assert results[0] == {"subject": "ENGLISH LANGUAGE", "grade": "B3"}

    def test_multiple_subjects(self):
        raw = "ENGLISH LANGUAGE - B3, MATHEMATICS(CORE) - C4, PHYSICS - A1"
        results = _parse_results(raw)
        assert len(results) == 3

    def test_grades_upper_cased(self):
        raw = "ENGLISH LANGUAGE - b3"
        results = _parse_results(raw)
        assert results[0]["grade"] == "B3"

    def test_subjects_upper_cased(self):
        raw = "english language - B3"
        results = _parse_results(raw)
        assert results[0]["subject"] == "ENGLISH LANGUAGE"

    def test_no_match_returns_empty(self):
        assert _parse_results("nothing here") == []

    def test_complex_subject_name(self):
        raw = "MATHEMATICS(CORE) - A1"
        results = _parse_results(raw)
        assert results[0]["subject"] == "MATHEMATICS(CORE)"


class TestParseTableRow:
    def test_valid_row_parsed(self):
        row = [
            "0040103001",
            "ACHEAMPONG KWAME",
            "M",
            "15/03/2005",
            "ENGLISH LANGUAGE - B3, MATHEMATICS(CORE) - C4",
        ]
        candidate = _parse_table_row(row)
        assert candidate is not None
        assert candidate["index_number"] == "0040103001"
        assert candidate["full_name"] == "ACHEAMPONG KWAME"
        assert candidate["gender"] == "M"
        assert candidate["date_of_birth"] == "2005-03-15"
        assert len(candidate["results"]) == 2

    def test_row_too_short_returns_none(self):
        assert _parse_table_row(["short"]) is None

    def test_no_index_returns_none(self):
        row = ["NOT_AN_INDEX", "NAME", "M", "01/01/2005", "ENGLISH - B3"]
        assert _parse_table_row(row) is None

    def test_no_results_returns_none(self):
        row = ["0040103001", "NAME", "M", "01/01/2005", "no grades here"]
        assert _parse_table_row(row) is None

    def test_invalid_gender_becomes_none(self):
        row = ["0040103001", "NAME", "X", "01/01/2005", "ENGLISH LANGUAGE - B3"]
        candidate = _parse_table_row(row)
        assert candidate is not None
        assert candidate["gender"] is None

    def test_multiline_name_normalized(self):
        row = ["0040103001", "KWAME\nOSEI", "M", "01/01/2005", "ENGLISH LANGUAGE - B3"]
        candidate = _parse_table_row(row)
        assert candidate is not None
        assert "\n" not in candidate["full_name"]


# ── XLSX parser unit tests ─────────────────────────────────────────────────────

class TestFindColumn:
    def test_exact_match(self):
        import pandas as pd
        df = pd.DataFrame(columns=["INDEX NUMBER", "NAME", "GENDER"])
        assert _find_column(df, ["INDEX NUMBER", "INDEX NO"]) == "INDEX NUMBER"

    def test_fallback_match(self):
        import pandas as pd
        df = pd.DataFrame(columns=["INDEX NO", "NAME"])
        assert _find_column(df, ["INDEX NUMBER", "INDEX NO"]) == "INDEX NO"

    def test_no_match_returns_none(self):
        import pandas as pd
        df = pd.DataFrame(columns=["A", "B"])
        assert _find_column(df, ["INDEX NUMBER"]) is None


class TestParseXlsx:
    def test_valid_xlsx(self, tmp_path: Path):
        import pandas as pd

        data = {
            "INDEX NUMBER": ["0040103001", "0040103002"],
            "FULL NAME": ["KWAME ASANTE", "ABENA OFORI"],
            "GENDER": ["M", "F"],
            "DATE OF BIRTH": ["2005-03-15", "2006-07-22"],
            "ENGLISH LANGUAGE": ["B3", "C4"],
            "MATHEMATICS(CORE)": ["C4", "B3"],
        }
        df = pd.DataFrame(data)
        xlsx_path = tmp_path / "results.xlsx"
        df.to_excel(xlsx_path, index=False, engine="openpyxl")

        candidates = parse_xlsx(str(xlsx_path))
        assert len(candidates) == 2
        assert candidates[0]["index_number"] == "0040103001"
        assert candidates[0]["full_name"] == "KWAME ASANTE"
        assert any(r["subject"] == "ENGLISH LANGUAGE" for r in candidates[0]["results"])

    def test_invalid_index_skipped(self, tmp_path: Path):
        import pandas as pd

        data = {
            "INDEX NUMBER": ["not-valid", "0040103001"],
            "FULL NAME": ["BAD", "GOOD"],
            "ENGLISH LANGUAGE": ["B3", "C4"],
        }
        df = pd.DataFrame(data)
        xlsx_path = tmp_path / "results.xlsx"
        df.to_excel(xlsx_path, index=False, engine="openpyxl")

        candidates = parse_xlsx(str(xlsx_path))
        assert len(candidates) == 1
        assert candidates[0]["index_number"] == "0040103001"

    def test_no_index_column_returns_empty(self, tmp_path: Path):
        import pandas as pd

        data = {"SUBJECT": ["ENGLISH LANGUAGE"], "GRADE": ["B3"]}
        df = pd.DataFrame(data)
        xlsx_path = tmp_path / "results.xlsx"
        df.to_excel(xlsx_path, index=False, engine="openpyxl")

        assert parse_xlsx(str(xlsx_path)) == []
