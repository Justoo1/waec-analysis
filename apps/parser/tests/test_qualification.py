"""Tests for the WASSCE qualification engine."""

from app.engine.qualification import compute_qualification, grade_score, GRADE_SCORES, PASS_GRADES


# ── Fixtures ───────────────────────────────────────────────────────────────────

def _result(subject: str, grade: str, is_core: bool = False) -> dict:
    return {"subject": subject, "grade": grade, "is_core": is_core, "is_elective": not is_core}


FULL_PASS_SCIENCE = [
    _result("ENGLISH LANGUAGE",      "B3", is_core=True),
    _result("MATHEMATICS(CORE)",      "B2", is_core=True),
    _result("SOCIAL STUDIES",         "C4", is_core=True),
    _result("INTEGRATED SCIENCE",     "B3", is_core=True),
    _result("PHYSICS",                "A1"),
    _result("CHEMISTRY",              "B2"),
    _result("BIOLOGY",                "B3"),
    _result("ELECTIVE MATHEMATICS",   "C4"),
]

FULL_PASS_BUSINESS = [
    _result("ENGLISH LANGUAGE",   "C5", is_core=True),
    _result("MATHEMATICS(CORE)",  "C4", is_core=True),
    _result("SOCIAL STUDIES",     "B3", is_core=True),
    _result("INTEGRATED SCIENCE", "C6", is_core=True),
    _result("ECONOMICS",          "B3"),
    _result("ACCOUNTING",         "C4"),
    _result("COSTING",            "C5"),
    _result("HISTORY",            "D7"),
]

NO_QUALIFY_MISSING_MATHS = [
    _result("ENGLISH LANGUAGE",   "B3", is_core=True),
    _result("MATHEMATICS(CORE)",  "F9", is_core=True),  # fail
    _result("SOCIAL STUDIES",     "B2", is_core=True),
    _result("INTEGRATED SCIENCE", "C4", is_core=True),
    _result("ECONOMICS",          "B3"),
    _result("ACCOUNTING",         "C4"),
    _result("HISTORY",            "C5"),
    _result("FRENCH",             "D7"),
]

NO_QUALIFY_FEW_PASSES = [
    _result("ENGLISH LANGUAGE",   "B3", is_core=True),
    _result("MATHEMATICS(CORE)",  "C4", is_core=True),
    _result("SOCIAL STUDIES",     "D7", is_core=True),
    _result("INTEGRATED SCIENCE", "F9", is_core=True),
    _result("ECONOMICS",          "F9"),
    _result("ACCOUNTING",         "F9"),
    _result("HISTORY",            "F9"),
    _result("FRENCH",             "F9"),
]


# ── Tests ──────────────────────────────────────────────────────────────────────

class TestGradeScore:
    def test_a1_is_best(self):
        assert grade_score("A1") == 1

    def test_f9_is_worst(self):
        assert grade_score("F9") == 9

    def test_unknown_grade_returns_ten(self):
        assert grade_score("X0") == 10

    def test_all_defined_grades(self):
        for g, score in GRADE_SCORES.items():
            assert grade_score(g) == score


class TestComputeQualification:
    def test_full_pass_qualifies_university(self):
        result = compute_qualification(FULL_PASS_SCIENCE)
        assert result["qualifies_university"] is True

    def test_full_pass_has_english_and_maths(self):
        result = compute_qualification(FULL_PASS_SCIENCE)
        assert result["has_english"] is True
        assert result["has_maths"] is True

    def test_science_pathway(self):
        result = compute_qualification(FULL_PASS_SCIENCE)
        assert result["qualifies_science"] is True

    def test_business_pathway(self):
        result = compute_qualification(FULL_PASS_BUSINESS)
        assert result["qualifies_business"] is True
        assert result["qualifies_science"] is False

    def test_missing_maths_disqualifies(self):
        result = compute_qualification(NO_QUALIFY_MISSING_MATHS)
        assert result["qualifies_university"] is False
        assert result["has_maths"] is False

    def test_too_few_passes_disqualifies(self):
        result = compute_qualification(NO_QUALIFY_FEW_PASSES)
        assert result["qualifies_university"] is False
        assert result["total_passes"] == 2  # English + Maths only

    def test_best_six_aggregate_computed(self):
        result = compute_qualification(FULL_PASS_SCIENCE)
        # Grades: B3=3, B2=2, C4=4, B3=3, A1=1, B2=2, B3=3, C4=4
        # Best 6 (sorted lowest first): 1+2+2+3+3+3 = 14
        assert result["best_six_aggregate"] == 14

    def test_best_six_none_when_fewer_than_six_passes(self):
        result = compute_qualification(NO_QUALIFY_FEW_PASSES)
        assert result["best_six_aggregate"] is None

    def test_core_and_elective_pass_counts(self):
        result = compute_qualification(FULL_PASS_SCIENCE)
        assert result["core_passes"] == 4
        assert result["elective_passes"] == 4

    def test_pass_grades_set(self):
        for g in ("A1", "B2", "B3", "C4", "C5", "C6"):
            assert g in PASS_GRADES

    def test_fail_grades_not_in_pass_set(self):
        for g in ("D7", "E8", "F9"):
            assert g not in PASS_GRADES
