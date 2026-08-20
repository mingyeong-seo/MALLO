"""Structured logging helpers for the MALLO AI API boundary."""

import logging
from uuid import UUID

__all__ = ("log_handled_5xx",)

_logger = logging.getLogger("mallo_ai.api")


def log_handled_5xx(
    *,
    request_id: UUID,
    code: str,
    model: str,
    elapsed_ms: int,
) -> None:
    """Log a handled provider failure without request or model payload content."""
    _logger.warning(
        "handled_ai_provider_error",
        extra={
            "request_id": str(request_id),
            "code": code,
            "model": model,
            "elapsed_ms": elapsed_ms,
        },
    )
