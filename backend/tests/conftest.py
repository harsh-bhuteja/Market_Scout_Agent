from __future__ import annotations

import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"
AI = ROOT / "ai-service"
os.environ.setdefault("SESSION_SECRET", "test-secret-key-for-unit-tests")
os.environ.setdefault("GOOGLE_CLIENT_ID", "test-google-client-id.apps.googleusercontent.com")
os.environ.setdefault("SQLITE_PATH", str(BACKEND / "data" / "test-app.db"))
os.environ.setdefault("CHECKPOINT_PATH", str(BACKEND / "data" / "test-checkpoints.db"))

for p in (BACKEND, AI):
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("SQLITE_PATH", str(tmp_path / "app.db"))
    monkeypatch.setenv("CHECKPOINT_PATH", str(tmp_path / "ck.db"))
    from app.config import settings
    from app.db import init_db, reset_engine

    settings.sqlite_path = str(tmp_path / "app.db")
    settings.checkpoint_path = str(tmp_path / "ck.db")
    settings.google_client_id = "test-google-client-id.apps.googleusercontent.com"
    settings.session_secret = "test-secret-key-for-unit-tests"
    reset_engine()
    init_db()
    from app.main import app
    with TestClient(app) as c:
        yield c
