"""
Idempotent DDL to provision a tenant schema and its four tables.
Call ensure_tenant_schema(school_number) before the first insert for a school.
"""

from __future__ import annotations

import re

import asyncpg

from app.db.session import _DATABASE_URL

_SCHOOL_NUMBER_RE = re.compile(r"^\d{7}$")


def _validate(school_number: str) -> None:
    if not _SCHOOL_NUMBER_RE.match(school_number):
        raise ValueError(f"Invalid school_number: {school_number!r}")


async def ensure_tenant_schema(school_number: str) -> None:
    """
    Create schema tenant_{school_number} and all four tables if they don't
    already exist. Safe to call on every task invocation (all statements are
    fully idempotent).
    """
    _validate(school_number)
    s = f"tenant_{school_number}"

    conn: asyncpg.Connection = await asyncpg.connect(_DATABASE_URL)
    try:
        await conn.execute(f'CREATE SCHEMA IF NOT EXISTS "{s}"')

        await conn.execute(f"""
            CREATE TABLE IF NOT EXISTS "{s}".exam_sittings (
                id               SERIAL PRIMARY KEY,
                year             INTEGER      NOT NULL,
                exam_type        VARCHAR(50)  NOT NULL DEFAULT 'WASSCE',
                total_candidates INTEGER,
                source_file      VARCHAR(500),
                parsed_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                UNIQUE (year, exam_type)
            )
        """)

        await conn.execute(f"""
            CREATE TABLE IF NOT EXISTS "{s}".candidates (
                id            SERIAL PRIMARY KEY,
                sitting_id    INTEGER      NOT NULL
                                  REFERENCES "{s}".exam_sittings(id) ON DELETE CASCADE,
                index_number  VARCHAR(20)  NOT NULL,
                full_name     VARCHAR(255),
                gender        CHAR(1),
                date_of_birth DATE,
                programme     VARCHAR(100),
                UNIQUE (sitting_id, index_number)
            )
        """)

        await conn.execute(f"""
            CREATE TABLE IF NOT EXISTS "{s}".results (
                id           SERIAL PRIMARY KEY,
                candidate_id INTEGER      NOT NULL
                                 REFERENCES "{s}".candidates(id) ON DELETE CASCADE,
                subject      VARCHAR(200) NOT NULL,
                grade        VARCHAR(5)   NOT NULL,
                grade_score  INTEGER      NOT NULL,
                is_core      BOOLEAN      NOT NULL DEFAULT FALSE,
                is_elective  BOOLEAN      NOT NULL DEFAULT FALSE
            )
        """)

        await conn.execute(f"""
            CREATE TABLE IF NOT EXISTS "{s}".qualification_flags (
                candidate_id         INTEGER  PRIMARY KEY
                                         REFERENCES "{s}".candidates(id) ON DELETE CASCADE,
                qualifies_university BOOLEAN  NOT NULL DEFAULT FALSE,
                qualifies_science    BOOLEAN  NOT NULL DEFAULT FALSE,
                qualifies_business   BOOLEAN  NOT NULL DEFAULT FALSE,
                qualifies_arts       BOOLEAN  NOT NULL DEFAULT FALSE,
                qualifies_general    BOOLEAN  NOT NULL DEFAULT FALSE,
                core_passes          INTEGER  NOT NULL DEFAULT 0,
                elective_passes      INTEGER  NOT NULL DEFAULT 0,
                total_passes         INTEGER  NOT NULL DEFAULT 0,
                best_six_aggregate   INTEGER,
                computed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        """)
    finally:
        await conn.close()
