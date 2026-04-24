"""Integration tests for the FastAPI endpoints (no real DB or Celery)."""

from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


class TestHealthCheck:
    def test_health_returns_ok(self):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"


class TestQualifyCompute:
    def test_compute_qualifies_with_good_results(self):
        payload = {
            "candidate_results": [
                {"subject": "ENGLISH LANGUAGE",   "grade": "B3", "is_core": True,  "is_elective": False},
                {"subject": "MATHEMATICS(CORE)",  "grade": "B2", "is_core": True,  "is_elective": False},
                {"subject": "SOCIAL STUDIES",     "grade": "C4", "is_core": True,  "is_elective": False},
                {"subject": "INTEGRATED SCIENCE", "grade": "B3", "is_core": True,  "is_elective": False},
                {"subject": "PHYSICS",            "grade": "A1", "is_core": False, "is_elective": True},
                {"subject": "CHEMISTRY",          "grade": "B2", "is_core": False, "is_elective": True},
                {"subject": "BIOLOGY",            "grade": "B3", "is_core": False, "is_elective": True},
                {"subject": "ELECTIVE MATHEMATICS","grade": "C4","is_core": False, "is_elective": True},
            ]
        }
        resp = client.post("/api/qualify/compute", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["qualifies_university"] is True
        assert data["qualifies_science"] is True

    def test_compute_no_qualify_with_failed_grades(self):
        payload = {
            "candidate_results": [
                {"subject": "ENGLISH LANGUAGE",  "grade": "F9", "is_core": True, "is_elective": False},
                {"subject": "MATHEMATICS(CORE)", "grade": "F9", "is_core": True, "is_elective": False},
            ]
        }
        resp = client.post("/api/qualify/compute", json=payload)
        assert resp.status_code == 200
        assert resp.json()["qualifies_university"] is False

    def test_compute_returns_best_six_aggregate(self):
        payload = {
            "candidate_results": [
                {"subject": "ENGLISH LANGUAGE",   "grade": "A1", "is_core": True, "is_elective": False},
                {"subject": "MATHEMATICS(CORE)",  "grade": "A1", "is_core": True, "is_elective": False},
                {"subject": "SOCIAL STUDIES",     "grade": "A1", "is_core": True, "is_elective": False},
                {"subject": "INTEGRATED SCIENCE", "grade": "A1", "is_core": True, "is_elective": False},
                {"subject": "PHYSICS",            "grade": "A1", "is_core": False, "is_elective": True},
                {"subject": "CHEMISTRY",          "grade": "A1", "is_core": False, "is_elective": True},
            ]
        }
        resp = client.post("/api/qualify/compute", json=payload)
        assert resp.status_code == 200
        assert resp.json()["best_six_aggregate"] == 6  # 6 × A1(1)


class TestParseUpload:
    def test_invalid_extension_rejected(self):
        resp = client.post(
            "/api/parse/upload",
            data={"school_number": "0040103", "sitting_year": "2025"},
            files={"file": ("results.docx", b"content", "application/octet-stream")},
        )
        assert resp.status_code == 400

    def test_invalid_school_number_rejected(self):
        resp = client.post(
            "/api/parse/upload",
            data={"school_number": "INVALID", "sitting_year": "2025"},
            files={"file": ("results.pdf", b"%PDF content", "application/pdf")},
        )
        assert resp.status_code == 400

    @patch("app.api.parse.parse_file_task")
    def test_valid_pdf_upload_queued(self, mock_task):
        mock_result = MagicMock()
        mock_result.id = "test-task-id-123"
        mock_task.delay.return_value = mock_result

        resp = client.post(
            "/api/parse/upload",
            data={"school_number": "0040103", "sitting_year": "2025"},
            files={"file": ("results.pdf", b"%PDF content", "application/pdf")},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "queued"
        assert data["task_id"] == "test-task-id-123"

    @patch("app.api.parse.parse_file_task")
    def test_valid_xlsx_upload_queued(self, mock_task):
        mock_result = MagicMock()
        mock_result.id = "task-xlsx-456"
        mock_task.delay.return_value = mock_result

        resp = client.post(
            "/api/parse/upload",
            data={"school_number": "0040103", "sitting_year": "2024"},
            files={"file": ("results.xlsx", b"xlsx-content", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
        )
        assert resp.status_code == 200
        assert resp.json()["task_id"] == "task-xlsx-456"


class TestParseStatus:
    @patch("app.workers.tasks.celery_app")
    def test_status_pending(self, mock_celery):
        mock_result = MagicMock()
        mock_result.state = "PENDING"
        mock_result.ready.return_value = False
        mock_result.info = None
        mock_celery.AsyncResult.return_value = mock_result

        resp = client.get("/api/parse/status/some-task-id")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "PENDING"
        assert data["result"] is None

    @patch("app.workers.tasks.celery_app")
    def test_status_progress_returns_meta(self, mock_celery):
        mock_result = MagicMock()
        mock_result.state = "PROGRESS"
        mock_result.ready.return_value = False
        mock_result.info = {"stage": "parsing", "progress": 30, "total_candidates": 0}
        mock_celery.AsyncResult.return_value = mock_result

        resp = client.get("/api/parse/status/some-task-id")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "PROGRESS"
        assert data["result"]["progress"] == 30
        assert data["result"]["stage"] == "parsing"

    @patch("app.workers.tasks.celery_app")
    def test_status_success_returns_result(self, mock_celery):
        mock_result = MagicMock()
        mock_result.state = "SUCCESS"
        mock_result.ready.return_value = True
        mock_result.result = {"status": "success", "total_candidates": 909, "sitting_id": 1}
        mock_celery.AsyncResult.return_value = mock_result

        resp = client.get("/api/parse/status/some-task-id")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "SUCCESS"
        assert data["result"]["total_candidates"] == 909
