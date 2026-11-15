from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.auth.session import decode_session_token
from app.config import settings
from app.db import SessionLocal, User, get_engine


def get_db():
    get_engine()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get(settings.session_cookie_name)
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.lower().startswith("bearer "):
            token = auth.split(" ", 1)[1]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = decode_session_token(token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid session") from exc
    user = db.get(User, payload.get("sub"))
    if not user:
        raise HTTPException(status_code=401, detail="Unknown user")
    return user
