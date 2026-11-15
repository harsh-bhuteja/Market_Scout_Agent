from __future__ import annotations

from typing import Any

import httpx
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token


class GoogleAuthError(ValueError):
    pass


def verify_google_credential(credential: str, client_id: str) -> dict[str, Any]:
    if not client_id or "your-google-client-id" in client_id:
        raise GoogleAuthError("GOOGLE_CLIENT_ID is not configured on the server")
    if not credential:
        raise GoogleAuthError("Missing Google credential")

    if credential.count(".") == 2:
        try:
            info = id_token.verify_oauth2_token(credential, google_requests.Request(), client_id)
        except Exception as exc:
            raise GoogleAuthError(f"Invalid Google ID token: {exc}") from exc
        if info.get("aud") != client_id:
            raise GoogleAuthError("Google token audience mismatch")
        return {
            "id": info.get("sub"),
            "email": info.get("email"),
            "name": info.get("name") or info.get("email"),
            "picture": info.get("picture"),
            "email_verified": bool(info.get("email_verified")),
        }

    return _verify_access_token(credential, client_id)


def _verify_access_token(access_token: str, client_id: str) -> dict[str, Any]:
    try:
        tokeninfo = httpx.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"access_token": access_token},
            timeout=15.0,
        )
    except httpx.HTTPError as exc:
        raise GoogleAuthError("Unable to verify Google access token") from exc
    if tokeninfo.status_code != 200:
        raise GoogleAuthError("Invalid Google access token")
    info = tokeninfo.json()
    aud = info.get("aud") or info.get("audience")
    if aud != client_id:
        raise GoogleAuthError("Google token audience mismatch")
    try:
        userinfo = httpx.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=15.0,
        )
    except httpx.HTTPError as exc:
        raise GoogleAuthError("Unable to load Google user profile") from exc
    if userinfo.status_code != 200:
        raise GoogleAuthError("Google userinfo request failed")
    profile = userinfo.json()
    return {
        "id": profile.get("sub") or info.get("sub"),
        "email": profile.get("email"),
        "name": profile.get("name") or profile.get("email"),
        "picture": profile.get("picture"),
        "email_verified": bool(profile.get("email_verified", True)),
    }
