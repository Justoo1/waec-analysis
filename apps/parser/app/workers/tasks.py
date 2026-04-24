"""
Celery task definitions for background WAEC file processing.
"""

from __future__ import annotations

import asyncio
import os

from celery import Celery

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "waec_parser",
    broker=REDIS_URL,
    backend=REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Africa/Accra",
    enable_utc=True,
    task_routes={
        "app.workers.tasks.parse_file_task": {"queue": "parsing"},
        "app.workers.tasks.compute_qualifications_task": {"queue": "qualification"},
    },
)


@celery_app.task(bind=True, max_retries=3, name="app.workers.tasks.parse_file_task")
def parse_file_task(
    self,
    file_path: str,
    school_number: str,
    sitting_year: int,
    file_type: str,
) -> dict:
    """
    Parse a WAEC results file and persist candidates to the tenant schema.
    Chains into compute_qualifications_task on success.
    """
    try:
        # ── Stage 1: Parse ─────────────────────────────────────────────────────
        self.update_state(
            state="PROGRESS",
            meta={"stage": "parsing", "progress": 10, "total_candidates": 0},
        )

        if file_type == "pdf":
            from app.parsers.pdf_parser import parse_pdf
            candidates = parse_pdf(file_path)
        elif file_type == "xlsx":
            from app.parsers.xlsx_parser import parse_xlsx
            candidates = parse_xlsx(file_path)
        else:
            raise ValueError(f"Unknown file type: {file_type}")

        total = len(candidates)
        self.update_state(
            state="PROGRESS",
            meta={"stage": "parsed", "progress": 30, "total_candidates": total},
        )

        # ── Stage 2: Ensure tenant schema ──────────────────────────────────────
        from app.db.tenant_setup import ensure_tenant_schema
        asyncio.run(ensure_tenant_schema(school_number))

        self.update_state(
            state="PROGRESS",
            meta={"stage": "schema_ready", "progress": 40, "total_candidates": total},
        )

        # ── Stage 3: Persist to DB ─────────────────────────────────────────────
        from app.db.repository import (
            batch_insert_candidates,
            batch_insert_results,
            upsert_sitting,
        )
        from app.db.session import tenant_connection

        async def _persist() -> int:
            async with tenant_connection(school_number) as conn:
                sitting_id = await upsert_sitting(
                    conn,
                    year=sitting_year,
                    file_type=file_type,
                    source_file=os.path.basename(file_path),
                    total_candidates=total,
                )
                id_map = await batch_insert_candidates(conn, sitting_id, candidates)
                await batch_insert_results(conn, id_map, candidates)
                return sitting_id

        sitting_id = asyncio.run(_persist())

        self.update_state(
            state="PROGRESS",
            meta={"stage": "persisted", "progress": 80, "total_candidates": total},
        )

        # ── Stage 4: Chain qualification computation ───────────────────────────
        compute_qualifications_task.delay(
            school_number=school_number,
            sitting_id=sitting_id,
        )

        return {
            "status": "success",
            "total_candidates": total,
            "sitting_id": sitting_id,
        }

    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)
    finally:
        try:
            os.unlink(file_path)
        except OSError:
            pass


@celery_app.task(
    bind=True,
    max_retries=3,
    name="app.workers.tasks.compute_qualifications_task",
)
def compute_qualifications_task(self, school_number: str, sitting_id: int) -> dict:
    """
    Compute and store qualification flags for all candidates in a sitting.
    Runs after parse_file_task completes.
    """
    try:
        from app.db.repository import (
            batch_upsert_qualification_flags,
            fetch_candidates_with_results,
        )
        from app.db.session import tenant_connection
        from app.engine.qualification import compute_qualification

        async def _compute() -> int:
            async with tenant_connection(school_number) as conn:
                grouped = await fetch_candidates_with_results(conn, sitting_id)

                flags = []
                for cand in grouped:
                    result = compute_qualification(cand["results"])
                    flags.append({"candidate_id": cand["candidate_id"], **result})

                await batch_upsert_qualification_flags(conn, flags)
                return len(flags)

        count = asyncio.run(_compute())
        return {"status": "success", "sitting_id": sitting_id, "computed": count}

    except Exception as exc:
        raise self.retry(exc=exc, countdown=30)
