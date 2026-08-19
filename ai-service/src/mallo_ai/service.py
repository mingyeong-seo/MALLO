"""Triage orchestration that keeps medical safety deterministic."""

from typing import Final, Protocol

from pydantic import TypeAdapter

from mallo_ai.api_contracts import TriageResponse
from mallo_ai.provider_contracts import (
    ProviderDecision,
    RequestId,
    TriageInput,
)
from mallo_ai.safety import route_high_risk

__all__ = ("TriageProvider", "TriageService")

TRIAGE_RESPONSE_ADAPTER: Final[TypeAdapter[TriageResponse]] = TypeAdapter(
    TriageResponse
)


class TriageProvider(Protocol):
    """Provider capability for classifying safe-to-delegate questions."""

    async def decide(self, triage_input: TriageInput, /) -> ProviderDecision:
        """Classify a trusted triage input into a structured decision."""
        ...


class TriageService:
    """Apply deterministic safety checks before provider classification."""

    def __init__(self, provider: TriageProvider) -> None:
        """Create the service with its safe-delegation provider."""
        self._provider: TriageProvider = provider

    async def triage(
        self, triage_input: TriageInput, request_id: RequestId
    ) -> TriageResponse:
        """Return a safety decision or provider decision with the trusted request ID."""
        safety_decision = route_high_risk(triage_input.question)
        if safety_decision is not None:
            return _response_with_request_id(safety_decision, request_id)
        provider_decision = await self._provider.decide(triage_input)
        return _response_with_request_id(provider_decision, request_id)


def _response_with_request_id(
    decision: ProviderDecision, request_id: RequestId
) -> TriageResponse:
    payload = decision.model_dump()
    payload["request_id"] = request_id
    return TRIAGE_RESPONSE_ADAPTER.validate_python(payload)
