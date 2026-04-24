from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from app.engine.qualification import compute_qualification

router = APIRouter()


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
