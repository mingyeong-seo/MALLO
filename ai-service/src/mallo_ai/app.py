"""FastAPI application factory for the internal MALLO AI service."""

import inspect
import time
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Annotated, Protocol, runtime_checkable
from uuid import UUID

from fastapi import Depends, FastAPI, Header, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from mallo_ai.api_contracts import TriageRequest
from mallo_ai.auth import UnauthorizedError, service_bearer_auth
from mallo_ai.errors import ModelBudgetExhaustedError, ModelUnavailableError
from mallo_ai.logging import log_handled_5xx
from mallo_ai.provider_contracts import RequestId, StrictModel, TriageInput
from mallo_ai.service import TriageProvider, TriageService
from mallo_ai.settings import Settings

__all__ = ("ErrorBody", "create_app")


@runtime_checkable
class _AsyncCloseable(Protocol):
    async def aclose(self) -> None: ...


class ErrorBody(StrictModel):
    """Stable error body returned by handled API failures."""

    code: str
    message: str


@asynccontextmanager
async def _provider_lifespan(provider: TriageProvider) -> AsyncGenerator[None]:
    try:
        yield
    finally:
        if isinstance(provider, _AsyncCloseable):
            close_result = provider.aclose()
            if inspect.isawaitable(close_result):
                await close_result


def create_app(settings: Settings, provider: TriageProvider) -> FastAPI:
    """Create the injectable ASGI app without loading production credentials."""
    service = TriageService(provider)
    auth_dependency = service_bearer_auth(settings)

    @asynccontextmanager
    async def lifespan(_app: FastAPI) -> AsyncGenerator[None]:
        async with _provider_lifespan(provider):
            yield

    app = FastAPI(
        title="MALLO AI",
        version="1.0.0",
        lifespan=lifespan,
    )

    @app.get("/healthz")
    async def _healthz() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/readyz")
    async def _readyz() -> dict[str, str]:
        return {"status": "ready"}

    @app.post("/internal/v1/triage")
    async def _triage(
        triage_request: TriageRequest,
        _authenticated: Annotated[None, Depends(auth_dependency)],
        x_request_id: Annotated[str | None, Header(alias="X-Request-Id")] = None,
    ) -> JSONResponse:
        request_id = _parse_request_id(x_request_id)
        if request_id is None:
            return _error_response(
                status_code=400,
                code="INVALID_REQUEST_ID",
                message="valid X-Request-Id required",
            )
        started_at = time.monotonic()
        triage_input = TriageInput(
            question=triage_request.question,
            procedure=triage_request.procedure,
            elapsed_day=triage_request.elapsed_day,
        )
        try:
            response = await service.triage(triage_input, RequestId(request_id))
        except ModelUnavailableError:
            elapsed_ms = _elapsed_ms(started_at)
            log_handled_5xx(
                request_id=request_id,
                code="MODEL_UNAVAILABLE",
                model=settings.mallo_ai_model,
                elapsed_ms=elapsed_ms,
            )
            return _error_response(
                status_code=503,
                code="MODEL_UNAVAILABLE",
                message="model provider unavailable",
            )
        except ModelBudgetExhaustedError:
            elapsed_ms = _elapsed_ms(started_at)
            log_handled_5xx(
                request_id=request_id,
                code="MODEL_BUDGET_EXHAUSTED",
                model=settings.mallo_ai_model,
                elapsed_ms=elapsed_ms,
            )
            return _error_response(
                status_code=503,
                code="MODEL_BUDGET_EXHAUSTED",
                message="model budget exhausted",
            )
        return JSONResponse(content=response.model_dump(mode="json"))

    @app.exception_handler(UnauthorizedError)
    async def _unauthorized_handler(
        _request: Request, _exc: UnauthorizedError
    ) -> JSONResponse:
        return _error_response(
            status_code=401,
            code="UNAUTHORIZED",
            message="invalid service credential",
        )

    @app.exception_handler(RequestValidationError)
    async def _request_validation_handler(
        _request: Request, _exc: RequestValidationError
    ) -> JSONResponse:
        return _error_response(
            status_code=422,
            code="INVALID_REQUEST",
            message="invalid request",
        )

    _registered_callables = (
        _healthz,
        _readyz,
        _triage,
        _unauthorized_handler,
        _request_validation_handler,
    )
    _ = _registered_callables

    return app


def _elapsed_ms(started_at: float) -> int:
    return max(0, round((time.monotonic() - started_at) * 1000))


def _parse_request_id(value: str | None) -> UUID | None:
    if value is None:
        return None
    try:
        return UUID(value)
    except ValueError:
        return None


def _error_response(*, status_code: int, code: str, message: str) -> JSONResponse:
    error_body = ErrorBody(code=code, message=message)
    return JSONResponse(
        status_code=status_code,
        content=error_body.model_dump(mode="json"),
    )
