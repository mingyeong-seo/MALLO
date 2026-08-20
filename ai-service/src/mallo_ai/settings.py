"""Runtime settings for the MALLO AI service."""

from pathlib import Path
from typing import ClassVar

from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parents[2] / ".env.local"
_SHARED_SECRET_LENGTH = 32


class Settings(BaseSettings):
    """Strict environment-backed settings."""

    model_config: ClassVar[SettingsConfigDict] = SettingsConfigDict(
        env_file=_ENV_FILE,
        env_file_encoding="utf-8",
        env_ignore_empty=True,
        extra="forbid",
    )

    openrouter_api_key: SecretStr = SecretStr("")
    ai_shared_secret: SecretStr = SecretStr("")
    mallo_ai_model: str = "openai/gpt-5.6-luna"
    openrouter_app_url: str = "https://github.com/mingyeong-seo/MALLO"
    openrouter_app_title: str = "MALLO AI"

    @classmethod
    def load(cls) -> "Settings":
        """Load validated settings from the configured environment."""
        return cls()

    @field_validator("openrouter_api_key")
    @classmethod
    def _require_openrouter_api_key(cls, value: SecretStr) -> SecretStr:
        if value.get_secret_value() == "":
            msg = "OPENROUTER_API_KEY is required"
            raise ValueError(msg)
        return value

    @field_validator("ai_shared_secret")
    @classmethod
    def _require_shared_secret_length(cls, value: SecretStr) -> SecretStr:
        if len(value.get_secret_value()) != _SHARED_SECRET_LENGTH:
            msg = "AI_SHARED_SECRET must be exactly 32 characters"
            raise ValueError(msg)
        return value
