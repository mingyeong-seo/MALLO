"""Triage orchestration that keeps medical safety deterministic."""

from functools import singledispatch
from typing import Protocol

from mallo_ai.api_contracts import (
    CompleteCleansingResponse,
    CompleteExerciseResponse,
    CompleteHeatResponse,
    CompleteMakeupResponse,
    CompleteSkincareResponse,
    ConnectResponse,
    GeneralResponse,
    MissingCleansingResponse,
    MissingExerciseResponse,
    MissingHeatResponse,
    MissingSkincareResponse,
    TriageResponse,
    UnsupportedResponse,
)
from mallo_ai.errors import ModelResponseInvalidError
from mallo_ai.provider_contracts import (
    CompleteCleansingDecision,
    CompleteExerciseDecision,
    CompleteHeatDecision,
    CompleteMakeupDecision,
    CompleteSkincareDecision,
    ConnectDecision,
    GeneralDecision,
    MissingCleansingDecision,
    MissingExerciseDecision,
    MissingHeatDecision,
    MissingSkincareDecision,
    ProviderDecision,
    RequestId,
    StrictModel,
    TriageInput,
    UnsupportedDecision,
)
from mallo_ai.safety import route_high_risk

__all__ = ("TriageProvider", "TriageService")


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


@singledispatch
def _response_with_request_id(
    _decision: StrictModel, _request_id: RequestId
) -> TriageResponse:
    raise ModelResponseInvalidError


def _complete_exercise_response(
    decision: CompleteExerciseDecision, request_id: RequestId
) -> CompleteExerciseResponse:
    return CompleteExerciseResponse(context=decision.context, request_id=request_id)


def _complete_makeup_response(
    decision: CompleteMakeupDecision, request_id: RequestId
) -> CompleteMakeupResponse:
    return CompleteMakeupResponse(context=decision.context, request_id=request_id)


def _complete_cleansing_response(
    decision: CompleteCleansingDecision, request_id: RequestId
) -> CompleteCleansingResponse:
    return CompleteCleansingResponse(context=decision.context, request_id=request_id)


def _complete_skincare_response(
    decision: CompleteSkincareDecision, request_id: RequestId
) -> CompleteSkincareResponse:
    return CompleteSkincareResponse(context=decision.context, request_id=request_id)


def _complete_heat_response(
    decision: CompleteHeatDecision, request_id: RequestId
) -> CompleteHeatResponse:
    return CompleteHeatResponse(context=decision.context, request_id=request_id)


def _missing_exercise_response(
    decision: MissingExerciseDecision, request_id: RequestId
) -> MissingExerciseResponse:
    return MissingExerciseResponse(context=decision.context, request_id=request_id)


def _missing_cleansing_response(
    decision: MissingCleansingDecision, request_id: RequestId
) -> MissingCleansingResponse:
    return MissingCleansingResponse(context=decision.context, request_id=request_id)


def _missing_skincare_response(
    decision: MissingSkincareDecision, request_id: RequestId
) -> MissingSkincareResponse:
    return MissingSkincareResponse(context=decision.context, request_id=request_id)


def _missing_heat_response(
    decision: MissingHeatDecision, request_id: RequestId
) -> MissingHeatResponse:
    return MissingHeatResponse(context=decision.context, request_id=request_id)


def _connect_response(
    decision: ConnectDecision, request_id: RequestId
) -> ConnectResponse:
    return ConnectResponse(
        safety_reason_codes=decision.safety_reason_codes, request_id=request_id
    )


def _general_response(
    _decision: GeneralDecision, request_id: RequestId
) -> GeneralResponse:
    return GeneralResponse(request_id=request_id)


def _unsupported_response(
    _decision: UnsupportedDecision, request_id: RequestId
) -> UnsupportedResponse:
    return UnsupportedResponse(request_id=request_id)


_ = _response_with_request_id.register(CompleteExerciseDecision)(
    _complete_exercise_response
)
_ = _response_with_request_id.register(CompleteMakeupDecision)(
    _complete_makeup_response
)
_ = _response_with_request_id.register(CompleteCleansingDecision)(
    _complete_cleansing_response
)
_ = _response_with_request_id.register(CompleteSkincareDecision)(
    _complete_skincare_response
)
_ = _response_with_request_id.register(CompleteHeatDecision)(_complete_heat_response)
_ = _response_with_request_id.register(MissingExerciseDecision)(
    _missing_exercise_response
)
_ = _response_with_request_id.register(MissingCleansingDecision)(
    _missing_cleansing_response
)
_ = _response_with_request_id.register(MissingSkincareDecision)(
    _missing_skincare_response
)
_ = _response_with_request_id.register(MissingHeatDecision)(_missing_heat_response)
_ = _response_with_request_id.register(ConnectDecision)(_connect_response)
_ = _response_with_request_id.register(GeneralDecision)(_general_response)
_ = _response_with_request_id.register(UnsupportedDecision)(_unsupported_response)
