from __future__ import annotations

from unittest.mock import patch

from fastapi.testclient import TestClient

from app.auth.session import create_session_token
from app.db import SessionLocal, User
from app.main import app


def test_google_oauth_invalid_token(client: TestClient):
    res = client.post("/api/auth/google", json={"credential": "not-a-real-token"})
    assert res.status_code == 401


def test_google_oauth_valid_token(client: TestClient):
    fake = {
        "id": "google-sub-1",
        "email": "csm@example.com",
        "name": "CSM",
        "picture": "",
        "email_verified": True,
    }
    with patch("app.auth.router.verify_google_credential", return_value=fake):
        res = client.post("/api/auth/google", json={"credential": "header.payload.sig"})
    assert res.status_code == 200
    assert res.json()["user"]["email"] == "csm@example.com"
    assert client.cookies.get("msa_session")


def test_protected_endpoints_reject_anonymous(client: TestClient):
    assert client.get("/api/research").status_code == 401
    assert client.post("/api/research", json={"role": "x", "location": "y"}).status_code == 401
    assert client.get("/api/auth/me").status_code == 401


def test_me_and_logout(client: TestClient):
    fake = {"id": "u1", "email": "a@b.com", "name": "A", "picture": "", "email_verified": True}
    with patch("app.auth.router.verify_google_credential", return_value=fake):
        client.post("/api/auth/google", json={"credential": "header.payload.sig"})
    me = client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["email"] == "a@b.com"
    client.post("/api/auth/logout")
    assert client.get("/api/auth/me").status_code == 401
