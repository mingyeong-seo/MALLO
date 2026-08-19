"""Bearer authentication for the internal MALLO AI API."""

import hmac
from collections.abc import Awaitable, Callable
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from mallo_ai.settings import Settings

__all__ = ("UnauthorizedError", "service_bearer_auth")

_bearer_scheme = HTTPBearer(auto_error=False)


class UnauthorizedError(Exception):
    """Raised when the caller does not present the shared service credential."""


def service_bearer_auth(settings: Settings) -> Callable[..., Awaitable[None]]:
    """Return a FastAPI dependency bound to the configured shared secret."""

    async def authenticate(
        credentials: Annotated[
            HTTPAuthorizationCredentials | None,
            Depends(_bearer_scheme),
        ],
    ) -> None:
        expected_secret = settings.ai_shared_secret.get_secret_value()
        supplied_secret = "" if credentials is None else credentials.credentials
        if credentials is None or not hmac.compare_digest(
            supplied_secret, expected_secret
        ):
            raise UnauthorizedError

    return authenticate
