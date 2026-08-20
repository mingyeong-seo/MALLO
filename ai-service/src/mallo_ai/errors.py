"""Typed failures raised by the model-provider adapter."""

from dataclasses import dataclass
from typing import override

__all__ = (
    "ModelBudgetExhaustedError",
    "ModelResponseInvalidError",
    "ModelUnavailableError",
)


@dataclass(frozen=True, slots=True)
class ModelUnavailableError(Exception):
    """Raised when the configured model provider cannot serve a request."""

    @override
    def __str__(self) -> str:
        """Return the stable unavailable-provider message."""
        return "model provider is unavailable"


@dataclass(frozen=True, slots=True)
class ModelBudgetExhaustedError(Exception):
    """Raised when the configured model provider has no remaining budget."""

    @override
    def __str__(self) -> str:
        """Return the stable exhausted-budget message."""
        return "model provider budget is exhausted"


@dataclass(frozen=True, slots=True)
class ModelResponseInvalidError(Exception):
    """Raised when the provider response fails the structured contract."""

    @override
    def __str__(self) -> str:
        """Return the stable invalid-response message."""
        return "model provider returned an invalid response"
