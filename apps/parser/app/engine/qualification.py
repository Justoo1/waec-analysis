"""
WAEC University Entry Qualification Engine.

WASSCE requirements (KNUST, UG, UCC, etc.):
- Pass at least 6 subjects (A1–C6)
- Must include English Language (core)
- Must include Core Mathematics (core)

Competitive entry (e.g. KNUST Science): best-six aggregate ≤ 24
Aggregate = sum of grade_scores of the best 6 passed subjects (lower = better).
"""

from __future__ import annotations

CORE_SUBJECTS: frozenset[str] = frozenset(
    {
        "ENGLISH LANGUAGE",
        "ENGLISH LANG",
        "MATHEMATICS(CORE)",
        "CORE MATHEMATICS",
        "SOCIAL STUDIES",
        "INTEGRATED SCIENCE",
        "INT. SCIENCE",
    }
)

PASS_GRADES: frozenset[str] = frozenset({"A1", "B2", "B3", "C4", "C5", "C6"})
FAIL_GRADES: frozenset[str] = frozenset({"D7", "E8", "F9"})

GRADE_SCORES: dict[str, int] = {
    "A1": 1,
    "B2": 2,
    "B3": 3,
    "C4": 4,
    "C5": 5,
    "C6": 6,
    "D7": 7,
    "E8": 8,
    "F9": 9,
}

_SCIENCE_SUBJECTS = frozenset({"PHYSICS", "CHEMISTRY", "BIOLOGY", "ELECTIVE MATHEMATICS"})
_BUSINESS_SUBJECTS = frozenset({"ECONOMICS", "ACCOUNTING", "COSTING", "BUSINESS MANAGEMENT"})


def compute_qualification(candidate_results: list[dict]) -> dict:
    """
    Compute all university qualification flags for a single candidate.

    Args:
        candidate_results: list of dicts with keys ``subject``, ``grade``,
            ``is_core`` (bool), ``is_elective`` (bool).

    Returns:
        dict with ``qualifies_university``, ``qualifies_science``,
        ``qualifies_business``, ``qualifies_arts``, ``qualifies_general``,
        ``core_passes``, ``elective_passes``, ``total_passes``,
        ``best_six_aggregate``, ``has_english``, ``has_maths``.
    """
    passes = [r for r in candidate_results if r["grade"] in PASS_GRADES]

    has_english = any(
        r["subject"].upper() in {"ENGLISH LANGUAGE", "ENGLISH LANG"}
        and r["grade"] in PASS_GRADES
        for r in candidate_results
    )
    has_maths = any(
        r["subject"].upper() in {"MATHEMATICS(CORE)", "CORE MATHEMATICS"}
        and r["grade"] in PASS_GRADES
        for r in candidate_results
    )

    core_passes = [r for r in passes if r["subject"].upper() in CORE_SUBJECTS]
    elective_passes = [r for r in passes if r["subject"].upper() not in CORE_SUBJECTS]

    # Best-six aggregate: lowest 6 grade scores from all passed subjects
    sorted_scores = sorted(GRADE_SCORES[r["grade"]] for r in passes)
    best_six: int | None = sum(sorted_scores[:6]) if len(sorted_scores) >= 6 else None

    qualifies_university = len(passes) >= 6 and has_english and has_maths

    # Science: needs physics + chemistry + (biology or elective maths) among electives
    science_count = sum(
        1
        for r in elective_passes
        if any(s in r["subject"].upper() for s in _SCIENCE_SUBJECTS)
    )
    qualifies_science = qualifies_university and science_count >= 3

    # Business: needs economics + at least one accounting/costing subject
    business_count = sum(
        1
        for r in elective_passes
        if any(s in r["subject"].upper() for s in _BUSINESS_SUBJECTS)
    )
    qualifies_business = qualifies_university and business_count >= 2

    qualifies_arts = qualifies_university and not qualifies_science and not qualifies_business
    qualifies_general = qualifies_university

    return {
        "qualifies_university": qualifies_university,
        "qualifies_science": qualifies_science,
        "qualifies_business": qualifies_business,
        "qualifies_arts": qualifies_arts,
        "qualifies_general": qualifies_general,
        "core_passes": len(core_passes),
        "elective_passes": len(elective_passes),
        "total_passes": len(passes),
        "best_six_aggregate": best_six,
        "has_english": has_english,
        "has_maths": has_maths,
    }


def grade_score(grade: str) -> int:
    """Numeric score for a grade. Lower is better. Unknown grades return 10."""
    return GRADE_SCORES.get(grade, 10)
