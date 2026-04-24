from __future__ import annotations

import os
import tempfile
from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from app.workers.tasks import parse_file_task

router = APIRouter()


class ParseJobResponse(BaseModel):
    task_id: str
    status: str
    message: str


@router.post("/upload", response_model=ParseJobResponse)
async def upload_results(
    file: UploadFile = File(...),
    school_number: str = Form(...),
    sitting_year: int = Form(...),
):
    """
    Accept a WAEC Results PDF or XLSX upload and queue a background parse job.
    Returns a task ID that the client can poll for progress.
    """
    filename = file.filename or ""
    ext = filename.rsplit(".", 1)[-1].lower()

    if ext not in {"pdf", "xlsx"}:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and XLSX files are accepted.",
        )

    # Write to a temp file so Celery can access it (worker reads from disk / MinIO)
    with tempfile.NamedTemporaryFile(
        suffix=f".{ext}", delete=False, dir="/tmp"
    ) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    task = parse_file_task.delay(
        file_path=tmp_path,
        school_number=school_number,
        sitting_year=sitting_year,
        file_type=ext,
    )

    return ParseJobResponse(
        task_id=task.id,
        status="queued",
        message=f"File queued for parsing. Poll /api/parse/status/{task.id} for progress.",
    )


@router.get("/status/{task_id}")
async def task_status(task_id: str) -> dict[str, Any]:
    """Poll the status of a parse job by Celery task ID."""
    from app.workers.tasks import celery_app

    result = celery_app.AsyncResult(task_id)
    return {
        "task_id": task_id,
        "status": result.status,
        "result": result.result if result.ready() else None,
    }
