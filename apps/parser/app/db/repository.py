"""
All tenant-schema data-access functions.
Each function accepts an asyncpg Connection that already has search_path set
to the correct tenant schema (via session.tenant_connection).
"""

from __future__ import annotations

import datetime
from typing import Any

import asyncpg

from app.engine.qualification import CORE_SUBJECTS, GRADE_SCORES

# ── Programme detection ────────────────────────────────────────────────────────

_SCIENCE_MARKERS = frozenset({"PHYSICS", "CHEMISTRY", "BIOLOGY", "ELECTIVE MATHEMATICS"})
_BUSINESS_MARKERS = frozenset({"ECONOMICS", "ACCOUNTING", "COSTING", "BUSINESS MANAGEMENT"})
_HOME_EC_MARKERS = frozenset({"FOOD AND NUTRITION", "FOOD & NUTRITION", "MANAGEMENT IN LIVING", "GKA"})
_VISUAL_ARTS_MARKERS = frozenset({"SCULPTURE", "TEXTILES", "GRAPHIC DESIGN"})


def _detect_programme(results: list[dict]) -> str:
    subjects = {r["subject"].upper() for r in results}
    if subjects & _SCIENCE_MARKERS:
        return "Science"
    if subjects & _BUSINESS_MARKERS:
        return "Business"
    if subjects & _HOME_EC_MARKERS:
        return "Home Economics"
    if subjects & _VISUAL_ARTS_MARKERS:
        return "Visual Arts"
    return "General Arts"


def _parse_dob(raw: str | None) -> datetime.date | None:
    if not raw:
        return None
    try:
        return datetime.date.fromisoformat(raw)
    except (ValueError, TypeError):
        return None


# ── Sitting ────────────────────────────────────────────────────────────────────

async def upsert_sitting(
    conn: asyncpg.Connection,
    year: int,
    file_type: str,
    source_file: str,
    total_candidates: int,
) -> int:
    """
    Upsert an exam_sittings row for (year, exam_type).
    After upserting, delete all existing candidates for that sitting (cascades
    to results and qualification_flags) so we get a clean re-import.
    Returns the sitting_id.
    """
    row = await conn.fetchrow(
        """
        INSERT INTO exam_sittings (year, exam_type, source_file, total_candidates, parsed_at)
        VALUES ($1, 'WASSCE', $2, $3, NOW())
        ON CONFLICT (year, exam_type)
        DO UPDATE SET
            source_file      = EXCLUDED.source_file,
            total_candidates = EXCLUDED.total_candidates,
            parsed_at        = NOW()
        RETURNING id
        """,
        year,
        source_file,
        total_candidates,
    )
    sitting_id: int = row["id"]

    # Wipe old candidates — cascade removes results + qualification_flags
    await conn.execute("DELETE FROM candidates WHERE sitting_id = $1", sitting_id)

    return sitting_id


# ── Candidates ─────────────────────────────────────────────────────────────────

async def batch_insert_candidates(
    conn: asyncpg.Connection,
    sitting_id: int,
    candidates: list[dict[str, Any]],
) -> dict[str, int]:
    """
    Batch-insert candidates and return {index_number: candidate_id} map.
    """
    rows = [
        (
            sitting_id,
            c["index_number"],
            c.get("full_name"),
            c.get("gender"),
            _parse_dob(c.get("date_of_birth")),
            _detect_programme(c.get("results", [])),
        )
        for c in candidates
    ]

    await conn.executemany(
        """
        INSERT INTO candidates (sitting_id, index_number, full_name, gender, date_of_birth, programme)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (sitting_id, index_number) DO NOTHING
        """,
        rows,
    )

    id_records = await conn.fetch(
        "SELECT id, index_number FROM candidates WHERE sitting_id = $1",
        sitting_id,
    )
    return {r["index_number"]: r["id"] for r in id_records}


# ── Results ────────────────────────────────────────────────────────────────────

async def batch_insert_results(
    conn: asyncpg.Connection,
    candidate_id_map: dict[str, int],
    candidates: list[dict[str, Any]],
) -> None:
    """
    Batch-insert all result rows for all candidates in a single executemany call.
    """
    rows: list[tuple] = []
    for c in candidates:
        cand_id = candidate_id_map.get(c["index_number"])
        if cand_id is None:
            continue
        for r in c.get("results", []):
            subject = r["subject"].strip().upper()
            grade = r["grade"].strip().upper()
            grade_score = GRADE_SCORES.get(grade, 10)
            is_core = subject in CORE_SUBJECTS
            rows.append((cand_id, subject, grade, grade_score, is_core, not is_core))

    if not rows:
        return

    await conn.executemany(
        """
        INSERT INTO results (candidate_id, subject, grade, grade_score, is_core, is_elective)
        VALUES ($1, $2, $3, $4, $5, $6)
        """,
        rows,
    )


# ── Qualification ──────────────────────────────────────────────────────────────

async def fetch_candidates_with_results(
    conn: asyncpg.Connection,
    sitting_id: int,
) -> list[dict[str, Any]]:
    """
    Return a list of {candidate_id, index_number, results: [{subject, grade, is_core, is_elective}]}
    for all candidates in a sitting.
    """
    records = await conn.fetch(
        """
        SELECT
            c.id   AS candidate_id,
            c.index_number,
            r.subject,
            r.grade,
            r.is_core,
            r.is_elective
        FROM candidates c
        JOIN results r ON r.candidate_id = c.id
        WHERE c.sitting_id = $1
        ORDER BY c.id, r.id
        """,
        sitting_id,
    )

    grouped: dict[int, dict[str, Any]] = {}
    for rec in records:
        cid = rec["candidate_id"]
        if cid not in grouped:
            grouped[cid] = {
                "candidate_id": cid,
                "index_number": rec["index_number"],
                "results": [],
            }
        grouped[cid]["results"].append(
            {
                "subject": rec["subject"],
                "grade": rec["grade"],
                "is_core": rec["is_core"],
                "is_elective": rec["is_elective"],
            }
        )

    return list(grouped.values())


async def batch_upsert_qualification_flags(
    conn: asyncpg.Connection,
    flags: list[dict[str, Any]],
) -> None:
    """
    Upsert qualification_flags rows via ON CONFLICT DO UPDATE.
    """
    rows = [
        (
            f["candidate_id"],
            f["qualifies_university"],
            f["qualifies_science"],
            f["qualifies_business"],
            f["qualifies_arts"],
            f["qualifies_general"],
            f["core_passes"],
            f["elective_passes"],
            f["total_passes"],
            f.get("best_six_aggregate"),  # may be None → NULL
        )
        for f in flags
    ]

    await conn.executemany(
        """
        INSERT INTO qualification_flags (
            candidate_id, qualifies_university, qualifies_science,
            qualifies_business, qualifies_arts, qualifies_general,
            core_passes, elective_passes, total_passes,
            best_six_aggregate, computed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        ON CONFLICT (candidate_id)
        DO UPDATE SET
            qualifies_university = EXCLUDED.qualifies_university,
            qualifies_science    = EXCLUDED.qualifies_science,
            qualifies_business   = EXCLUDED.qualifies_business,
            qualifies_arts       = EXCLUDED.qualifies_arts,
            qualifies_general    = EXCLUDED.qualifies_general,
            core_passes          = EXCLUDED.core_passes,
            elective_passes      = EXCLUDED.elective_passes,
            total_passes         = EXCLUDED.total_passes,
            best_six_aggregate   = EXCLUDED.best_six_aggregate,
            computed_at          = NOW()
        """,
        rows,
    )


# ── Summary queries ────────────────────────────────────────────────────────────

async def fetch_sitting_summary(
    conn: asyncpg.Connection,
    sitting_id: int,
) -> dict[str, Any] | None:
    row = await conn.fetchrow(
        """
        SELECT
            s.id,
            s.year,
            s.exam_type,
            s.total_candidates,
            s.parsed_at,
            s.source_file,
            COUNT(DISTINCT c.id)                                         AS candidate_count,
            COUNT(DISTINCT qf.candidate_id)                              AS computed_count,
            COALESCE(SUM(qf.qualifies_university::int), 0)               AS qualifies_university,
            COALESCE(SUM(qf.qualifies_science::int), 0)                  AS qualifies_science,
            COALESCE(SUM(qf.qualifies_business::int), 0)                 AS qualifies_business,
            COALESCE(SUM(qf.qualifies_arts::int), 0)                     AS qualifies_arts,
            ROUND(AVG(qf.best_six_aggregate), 2)                         AS avg_best_six,
            PERCENTILE_CONT(0.5)
                WITHIN GROUP (ORDER BY qf.best_six_aggregate)            AS median_best_six
        FROM exam_sittings s
        LEFT JOIN candidates c  ON c.sitting_id = s.id
        LEFT JOIN qualification_flags qf ON qf.candidate_id = c.id
        WHERE s.id = $1
        GROUP BY s.id
        """,
        sitting_id,
    )
    if row is None:
        return None
    return dict(row)


async def fetch_candidate_qualification(
    conn: asyncpg.Connection,
    candidate_id: int,
) -> dict[str, Any] | None:
    row = await conn.fetchrow(
        """
        SELECT
            c.id, c.index_number, c.full_name, c.gender, c.date_of_birth, c.programme,
            qf.qualifies_university, qf.qualifies_science, qf.qualifies_business,
            qf.qualifies_arts, qf.qualifies_general,
            qf.core_passes, qf.elective_passes, qf.total_passes,
            qf.best_six_aggregate, qf.computed_at
        FROM candidates c
        LEFT JOIN qualification_flags qf ON qf.candidate_id = c.id
        WHERE c.id = $1
        """,
        candidate_id,
    )
    if row is None:
        return None
    return dict(row)
