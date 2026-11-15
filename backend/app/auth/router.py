from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user, get_db
from app.auth.google import GoogleAuthError, verify_google_credential
from app.auth.session import create_session_token
from app.config import settings
from app.db import User

router = APIRouter(prefix="/api/auth", tags=["auth"])


class GoogleAuthBody(BaseModel):
    credential: str | None = None
    id_token: str | None = None
    access_token: str | None = None


class SandboxAuthBody(BaseModel):
    email: str = "operator@marketscout.ai"


def _user_payload(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "picture": user.picture,
        "authProvider": "google",
        "authenticatedAt": user.created_at.isoformat() if user.created_at else None,
    }


@router.post("/google")
def google_login(body: GoogleAuthBody, response: Response, db: Session = Depends(get_db)):
    token = body.credential or body.id_token or body.access_token
    try:
        profile = verify_google_credential(token or "", settings.google_client_id)
    except GoogleAuthError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    if not profile.get("id") or not profile.get("email"):
        raise HTTPException(status_code=401, detail="Google token did not include a verified identity")

    user = db.get(User, profile["id"])
    if not user:
        user = User(
            id=profile["id"],
            email=profile["email"],
            name=profile.get("name") or profile["email"],
            picture=profile.get("picture") or "",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    session_token = create_session_token(_user_payload(user))
    response.set_cookie(
        key=settings.session_cookie_name,
        value=session_token,
        httponly=True,
        samesite="lax",
        secure=settings.environment == "production",
        max_age=settings.session_ttl_hours * 3600,
        path="/",
    )
    return {"user": _user_payload(user)}


@router.post("/sandbox")
def sandbox_login(body: SandboxAuthBody = SandboxAuthBody(), response: Response = None, db: Session = Depends(get_db)):
    if settings.environment == "production":
        raise HTTPException(status_code=403, detail="Sandbox login is disabled in production")
    user_id = "sandbox-operator-1"
    user = db.get(User, user_id)
    if not user:
        user = User(
            id=user_id,
            email=body.email or "operator@marketscout.ai",
            name="Evaluation Operator",
            picture="",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    session_token = create_session_token(_user_payload(user))
    if response:
        response.set_cookie(
            key=settings.session_cookie_name,
            value=session_token,
            httponly=True,
            samesite="lax",
            secure=False,
            max_age=settings.session_ttl_hours * 3600,
            path="/",
        )
    return {"user": _user_payload(user), "token": session_token}


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return _user_payload(user)


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(settings.session_cookie_name, path="/")
    return {"ok": True}
