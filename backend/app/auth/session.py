from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from app.config import settings


def create_session_token(user: dict) -> str:
    exp = datetime.now(timezone.utc) + timedelta(hours=settings.session_ttl_hours)
    payload = {
        "sub": user["id"],
        "email": user["email"],
        "name": user.get("name") or "",
        "picture": user.get("picture") or "",
        "exp": exp,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.session_secret, algorithm="HS256")


def decode_session_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.session_secret, algorithms=["HS256"])
    except JWTError as exc:
        raise ValueError("Invalid session") from exc
