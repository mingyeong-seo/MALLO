"""HTTP wire models for the internal MALLO AI triage endpoint."""

from typing import Annotated, Literal

from pydantic import Field, StringConstraints

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
    RequestId,
    StrictModel,
    UnsupportedDecision,
)

__all__ = (
    "CompleteCleansingDecision",
    "CompleteCleansingResponse",
    "CompleteExerciseDecision",
    "CompleteExerciseResponse",
    "CompleteHeatDecision",
    "CompleteHeatResponse",
    "CompleteMakeupDecision",
    "CompleteMakeupResponse",
    "CompleteSkincareDecision",
    "CompleteSkincareResponse",
    "ConnectDecision",
    "ConnectResponse",
    "GeneralDecision",
    "GeneralResponse",
    "MissingCleansingDecision",
    "MissingCleansingResponse",
    "MissingExerciseDecision",
    "MissingExerciseResponse",
    "MissingHeatDecision",
    "MissingHeatResponse",
    "MissingSkincareDecision",
    "MissingSkincareResponse",
    "RequestId",
    "StrictModel",
    "TriageRequest",
    "TriageRequestEnvelope",
    "TriageResponse",
    "UnsupportedDecision",
    "UnsupportedResponse",
)

type Question = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=500),
]
type Procedure = Annotated[str, StringConstraints(min_length=1, max_length=100)]
type ElapsedDay = Annotated[int, Field(ge=0, le=3650)]


class TriageRequest(StrictModel):
    """Validated request body accepted from the Spring backend."""

    contract_version: Literal["1.0"]
    question: Question
    procedure: Procedure
    elapsed_day: ElapsedDay


class TriageRequestEnvelope(StrictModel):
    """HTTP boundary shape used before exact contract-version routing."""

    contract_version: str
    question: Question
    procedure: Procedure
    elapsed_day: ElapsedDay


class CompleteExerciseResponse(CompleteExerciseDecision):
    """Exercise response with a trusted request identifier."""

    request_id: RequestId


class CompleteMakeupResponse(CompleteMakeupDecision):
    """Makeup response with a trusted request identifier."""

    request_id: RequestId


class CompleteCleansingResponse(CompleteCleansingDecision):
    """Cleansing response with a trusted request identifier."""

    request_id: RequestId


class CompleteSkincareResponse(CompleteSkincareDecision):
    """Skincare response with a trusted request identifier."""

    request_id: RequestId


class CompleteHeatResponse(CompleteHeatDecision):
    """Heat response with a trusted request identifier."""

    request_id: RequestId


class MissingExerciseResponse(MissingExerciseDecision):
    """Incomplete exercise response with a trusted request identifier."""

    request_id: RequestId


class MissingCleansingResponse(MissingCleansingDecision):
    """Incomplete cleansing response with a trusted request identifier."""

    request_id: RequestId


class MissingSkincareResponse(MissingSkincareDecision):
    """Incomplete skincare response with a trusted request identifier."""

    request_id: RequestId


class MissingHeatResponse(MissingHeatDecision):
    """Incomplete heat response with a trusted request identifier."""

    request_id: RequestId


class ConnectResponse(ConnectDecision):
    """Medical-safety response with a trusted request identifier."""

    request_id: RequestId


class GeneralResponse(GeneralDecision):
    """General response with a trusted request identifier."""

    request_id: RequestId


class UnsupportedResponse(UnsupportedDecision):
    """Unsupported response with a trusted request identifier."""

    request_id: RequestId


type CompleteActionResponse = Annotated[
    CompleteExerciseResponse
    | CompleteMakeupResponse
    | CompleteCleansingResponse
    | CompleteSkincareResponse
    | CompleteHeatResponse,
    Field(discriminator="action"),
]

type MissingActionResponse = Annotated[
    MissingExerciseResponse
    | MissingCleansingResponse
    | MissingSkincareResponse
    | MissingHeatResponse,
    Field(discriminator="action"),
]

type ActionResponse = Annotated[
    CompleteActionResponse | MissingActionResponse,
    Field(discriminator="action_state"),
]

type TriageResponse = Annotated[
    ActionResponse | ConnectResponse | GeneralResponse | UnsupportedResponse,
    Field(discriminator="route"),
]
