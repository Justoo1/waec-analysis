"""Tests for the repository helper functions (pure logic, no DB required)."""

import datetime

import pytest

from app.db.repository import _detect_programme, _parse_dob


# ── _parse_dob ─────────────────────────────────────────────────────────────────

class TestParseDob:
    def test_valid_iso_date(self):
        assert _parse_dob("2005-03-15") == datetime.date(2005, 3, 15)

    def test_none_input(self):
        assert _parse_dob(None) is None

    def test_empty_string(self):
        assert _parse_dob("") is None

    def test_invalid_format_returns_none(self):
        assert _parse_dob("15/03/2005") is None  # non-ISO fallback returns None

    def test_whitespace_returns_none(self):
        assert _parse_dob("   ") is None


# ── _detect_programme ──────────────────────────────────────────────────────────

def _r(subject: str) -> dict:
    return {"subject": subject, "grade": "B3"}


class TestDetectProgramme:
    def test_science_detected(self):
        results = [_r("PHYSICS"), _r("CHEMISTRY"), _r("BIOLOGY")]
        assert _detect_programme(results) == "Science"

    def test_business_detected(self):
        results = [_r("ECONOMICS"), _r("ACCOUNTING"), _r("COSTING")]
        assert _detect_programme(results) == "Business"

    def test_home_economics_detected(self):
        results = [_r("FOOD & NUTRITION"), _r("GKA"), _r("MANAGEMENT IN LIVING")]
        assert _detect_programme(results) == "Home Economics"

    def test_visual_arts_detected(self):
        results = [_r("SCULPTURE"), _r("TEXTILES"), _r("GRAPHIC DESIGN")]
        assert _detect_programme(results) == "Visual Arts"

    def test_default_is_general_arts(self):
        results = [_r("HISTORY"), _r("GEOGRAPHY"), _r("FRENCH")]
        assert _detect_programme(results) == "General Arts"

    def test_science_takes_precedence_over_business(self):
        # When science markers present alongside business, science wins
        results = [_r("PHYSICS"), _r("ECONOMICS"), _r("ACCOUNTING")]
        assert _detect_programme(results) == "Science"

    def test_empty_results_is_general_arts(self):
        assert _detect_programme([]) == "General Arts"
