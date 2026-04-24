from __future__ import annotations

from datetime import date, datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.engine.qualification import compute_qualification

router = APIRouter()


# ── Existing endpoints ────────────────────────────────────────────────────────

class ResultItem(BaseModel):
    subject: str
    grade: str
    is_core: bool = False
    is_elective: bool = False


class QualifyRequest(BaseModel):
    candidate_results: list[ResultItem]


@router.post("/compute")
async def compute(request: QualifyRequest) -> dict:
    """
    Compute university qualification flags for a single candidate.
    Accepts a list of subject-grade pairs and returns qualification flags.
    """
    results = [r.model_dump() for r in request.candidate_results]
    return compute_qualification(results)


@router.post("/batch")
async def compute_batch(school_number: str, sitting_id: int) -> dict:
    """
    Trigger background computation of qualification flags for all candidates
    in a given exam sitting. Queues a Celery task.
    """
    from app.workers.tasks import compute_qualifications_task

    task = compute_qualifications_task.delay(
        school_number=school_number,
        sitting_id=sitting_id,
    )
    return {"task_id": task.id, "status": "queued"}


# ── Pydantic response models ──────────────────────────────────────────────────

class SittingSummaryResponse(BaseModel):
    id: int
    year: int
    exam_type: str
    total_candidates: int | None
    parsed_at: datetime
    source_file: str | None
    candidate_count: int
    computed_count: int
    qualifies_university: int
    qualifies_science: int
    qualifies_business: int
    qualifies_arts: int
    avg_best_six: float | None
    median_best_six: float | None


class CandidateQualificationResponse(BaseModel):
    id: int
    index_number: str
    full_name: str | None
    gender: str | None
    date_of_birth: date | None
    programme: str | None
    qualifies_university: bool | None
    qualifies_science: bool | None
    qualifies_business: bool | None
    qualifies_arts: bool | None
    qualifies_general: bool | None
    core_passes: int | None
    elective_passes: int | None
    total_passes: int | None
    best_six_aggregate: int | None
    computed_at: datetime | None


# ── New GET routes ─────────────────────────────────────────────────────────────

@router.get("/{school_number}/sitting/{sitting_id}", response_model=SittingSummaryResponse)
async def sitting_summary(school_number: str, sitting_id: int) -> dict:
    """Return aggregated qualification summary for an exam sitting."""
    from app.db.repository import fetch_sitting_summary
    from app.db.session import tenant_connection

    async with tenant_connection(school_number) as conn:
        summary = await fetch_sitting_summary(conn, sitting_id)

    if summary is None:
        raise HTTPException(status_code=404, detail="Sitting not found")
    return summary


@router.get(
    "/{school_number}/candidate/{candidate_id}",
    response_model=CandidateQualificationResponse,
)
async def candidate_qualification(school_number: str, candidate_id: int) -> dict:
    """Return a single candidate's details and qualification flags."""
    from app.db.repository import fetch_candidate_qualification
    from app.db.session import tenant_connection

    async with tenant_connection(school_number) as conn:
        result = await fetch_candidate_qualification(conn, candidate_id)

    if result is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return result
