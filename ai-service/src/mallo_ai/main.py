"""Production ASGI entrypoint for MALLO AI."""

from mallo_ai.app import create_app
from mallo_ai.openrouter_provider import create_openrouter_provider
from mallo_ai.settings import Settings

settings = Settings()  # pyright: ignore[reportCallIssue]
app = create_app(settings, create_openrouter_provider(settings))
