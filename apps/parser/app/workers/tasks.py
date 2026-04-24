"""
Celery task definitions for background WAEC file processing.
"""

from __future__ import annotations

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

    Args:
        file_path: Local path of the uploaded file (temp path or MinIO key).
        school_number: School identifier (e.g. "0040103").
        sitting_year: Exam year (e.g. 2025).
        file_type: "pdf" or "xlsx".
    """
    try:
        if file_type == "pdf":
            from app.parsers.pdf_parser import parse_pdf
            candidates = parse_pdf(file_path)
        elif file_type == "xlsx":
            from app.parsers.xlsx_parser import parse_xlsx
            candidates = parse_xlsx(file_path)
        else:
            raise ValueError(f"Unknown file type: {file_type}")

        # TODO: persist candidates via tenant_connection(school_number)
        # import asyncio
        # asyncio.get_event_loop().run_until_complete(
        #     persist_candidates(candidates, school_number, sitting_year)
        # )

        return {"status": "success", "total_candidates": len(candidates)}

    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(name="app.workers.tasks.compute_qualifications_task")
def compute_qualifications_task(school_number: str, sitting_id: int) -> dict:
    """
    Compute and store qualification flags for all candidates in a sitting.
    Runs after parse_file_task completes.
    """
    from app.engine.qualification import compute_qualification  # noqa: F401

    # TODO: fetch candidates from tenant DB, run compute_qualification,
    # write results back to qualification_flags table.
    return {"status": "stub", "school_number": school_number, "sitting_id": sitting_id}
