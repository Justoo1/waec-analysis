from __future__ import annotations

import os
import re
import tempfile
from typing import Any, Optional

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile
from pydantic import BaseModel

from app.workers.tasks import parse_file_task

router = APIRouter()

_SCHOOL_NUMBER_RE = re.compile(r"^\d{7}$")


class ParseJobResponse(BaseModel):
    task_id: str
    status: str
    message: str


@router.post("/upload", response_model=ParseJobResponse)
async def upload_results(
    file: UploadFile = File(...),
    school_number: Optional[str] = Form(None),
    sitting_year: Optional[int] = Form(None),
    school_number_q: Optional[str] = Query(None, alias="school_number"),
    sitting_year_q: Optional[int] = Query(None, alias="sitting_year"),
):
    """
    Accept a WASSCE Results PDF or XLSX upload and queue a background parse job.

    school_number and sitting_year may be supplied as form fields (legacy) or as
    URL query parameters (used when the Next.js layer streams the body directly).
    Returns a task ID that the client can poll for progress.
    """
    sn = school_number or school_number_q
    sy = sitting_year if sitting_year is not None else sitting_year_q

    if not sn or sy is None:
        raise HTTPException(
            status_code=400,
            detail="school_number and sitting_year are required.",
        )

    if not _SCHOOL_NUMBER_RE.match(sn):
        raise HTTPException(
            status_code=400,
            detail="school_number must be exactly 7 digits.",
        )

    filename = file.filename or ""
    ext = filename.rsplit(".", 1)[-1].lower()

    if ext not in {"pdf", "xlsx"}:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and XLSX files are accepted.",
        )

    # Write to a temp file so the Celery worker can read it from disk.
    # /shared is a named volume mounted in both the parser and worker containers.
    upload_dir = os.environ.get("UPLOAD_TMP_DIR", "/tmp")
    os.makedirs(upload_dir, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        suffix=f".{ext}", delete=False, dir=upload_dir
    ) as tmp:
        while chunk := await file.read(1024 * 1024):  # 1 MB chunks
            tmp.write(chunk)
        tmp_path = tmp.name

    task = parse_file_task.delay(
        file_path=tmp_path,
        school_number=sn,
        sitting_year=sy,
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

    # PROGRESS state stores meta in result.info; SUCCESS/FAILURE in result.result
    if result.state == "PROGRESS":
        payload = result.info
    elif result.state == "FAILURE":
        # result.result is the exception object — not JSON-serializable
        payload = {"error": str(result.result)}
    elif result.ready():
        payload = result.result
    else:
        payload = None

    return {
        "task_id": task_id,
        "status": result.state,
        "result": payload,
    }
