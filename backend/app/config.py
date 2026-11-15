from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[1]
ROOT_DIR = BACKEND_DIR.parent
DATA_DIR = BACKEND_DIR / "data"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(str(BACKEND_DIR / ".env"), str(ROOT_DIR / ".env")),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Market Scout Agent API"
    environment: str = "development"
    frontend_origin: str = "http://localhost:3000"
    session_secret: str = "change-me-in-local-dev-only"
    session_cookie_name: str = "msa_session"
    session_ttl_hours: int = 12

    google_client_id: str = ""
    google_client_secret: str = ""

    adzuna_app_id: str = ""
    adzuna_app_key: str = ""
    adzuna_timeout_seconds: float = 20.0
    adzuna_max_retries: int = 3

    llm_model: str = "openai/gpt-oss-120b"
    llm_api_key: str = ""
    llm_base_url: str = "https://api.groq.com/openai/v1"
    llm_fallback_model: str = "openai/gpt-oss-20b"

    sqlite_path: str = str(DATA_DIR / "app.db")
    checkpoint_path: str = str(DATA_DIR / "checkpoints.db")

    usd_eur: float = 0.92
    usd_gbp: float = 0.79
    usd_inr: float = 83.0

    min_postings: int = 20
    max_fetch_attempts: int = 2
    batch_size: int = 40


settings = Settings()
DATA_DIR.mkdir(parents=True, exist_ok=True)
