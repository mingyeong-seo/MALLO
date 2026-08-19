"""Strict structured output accepted from the AI classification provider."""

from dataclasses import dataclass
from typing import Annotated, Literal, NewType
from typing import ClassVar as Cv
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from mallo_ai.vocabulary import (
    ActionState,
    ActionType,
    ClarificationCode,
    CleansingMethod,
    ExerciseIntensity,
    HeatType,
    MakeupFriction,
    Route,
    SafetyReason,
    SkincareProductType,
)

RequestId = NewType("RequestId", UUID)


@dataclass(frozen=True, slots=True)
class TriageInput:
    """Trusted, validated input passed from the HTTP boundary to triage logic."""

    question: str
    procedure: str
    elapsed_day: int


class StrictModel(BaseModel):
    """Immutable Pydantic boundary model that rejects unknown or coercible data."""

    model_config: Cv[ConfigDict] = ConfigDict(extra="forbid", frozen=True, strict=True)


class ExerciseContext(StrictModel):
    """Complete exercise context."""

    intensity: ExerciseIntensity


class MakeupContext(StrictModel):
    """Complete makeup context."""

    friction: MakeupFriction


class CleansingContext(StrictModel):
    """Complete cleansing context."""

    method: CleansingMethod


class SkincareContext(StrictModel):
    """Complete skincare context."""

    product_type: SkincareProductType


class HeatContext(StrictModel):
    """Complete heat-exposure context."""

    heat_type: HeatType


class EmptyContext(StrictModel):
    """Context for an action missing its only required field."""


class CompleteExerciseDecision(StrictModel):
    """Complete exercise classification."""

    route: Literal[Route.ACTION] = Route.ACTION
    action_state: Literal[ActionState.COMPLETE] = ActionState.COMPLETE
    action: Literal[ActionType.EXERCISE] = ActionType.EXERCISE
    context: ExerciseContext
    missing_fields: tuple[()] = ()
    clarification_code: None = None
    safety_reason_codes: tuple[()] = ()


class CompleteMakeupDecision(StrictModel):
    """Complete makeup classification."""

    route: Literal[Route.ACTION] = Route.ACTION
    action_state: Literal[ActionState.COMPLETE] = ActionState.COMPLETE
    action: Literal[ActionType.MAKEUP] = ActionType.MAKEUP
    context: MakeupContext
    missing_fields: tuple[()] = ()
    clarification_code: None = None
    safety_reason_codes: tuple[()] = ()


class CompleteCleansingDecision(StrictModel):
    """Complete cleansing classification."""

    route: Literal[Route.ACTION] = Route.ACTION
    action_state: Literal[ActionState.COMPLETE] = ActionState.COMPLETE
    action: Literal[ActionType.CLEANSING] = ActionType.CLEANSING
    context: CleansingContext
    missing_fields: tuple[()] = ()
    clarification_code: None = None
    safety_reason_codes: tuple[()] = ()


class CompleteSkincareDecision(StrictModel):
    """Complete skincare classification."""

    route: Literal[Route.ACTION] = Route.ACTION
    action_state: Literal[ActionState.COMPLETE] = ActionState.COMPLETE
    action: Literal[ActionType.SKINCARE] = ActionType.SKINCARE
    context: SkincareContext
    missing_fields: tuple[()] = ()
    clarification_code: None = None
    safety_reason_codes: tuple[()] = ()


class CompleteHeatDecision(StrictModel):
    """Complete heat-exposure classification."""

    route: Literal[Route.ACTION] = Route.ACTION
    action_state: Literal[ActionState.COMPLETE] = ActionState.COMPLETE
    action: Literal[ActionType.HEAT] = ActionType.HEAT
    context: HeatContext
    missing_fields: tuple[()] = ()
    clarification_code: None = None
    safety_reason_codes: tuple[()] = ()


class MissingExerciseDecision(StrictModel):
    """Exercise classification requiring an intensity follow-up."""

    route: Literal[Route.ACTION] = Route.ACTION
    action_state: Literal[ActionState.MISSING_CONTEXT] = ActionState.MISSING_CONTEXT
    action: Literal[ActionType.EXERCISE] = ActionType.EXERCISE
    context: EmptyContext
    missing_fields: tuple[Literal["intensity"]] = ("intensity",)
    clarification_code: Literal[ClarificationCode.ASK_EXERCISE_INTENSITY] = (
        ClarificationCode.ASK_EXERCISE_INTENSITY
    )
    safety_reason_codes: tuple[()] = ()


class MissingCleansingDecision(StrictModel):
    """Cleansing classification requiring a method follow-up."""

    route: Literal[Route.ACTION] = Route.ACTION
    action_state: Literal[ActionState.MISSING_CONTEXT] = ActionState.MISSING_CONTEXT
    action: Literal[ActionType.CLEANSING] = ActionType.CLEANSING
    context: EmptyContext
    missing_fields: tuple[Literal["method"]] = ("method",)
    clarification_code: Literal[ClarificationCode.ASK_CLEANSING_METHOD] = (
        ClarificationCode.ASK_CLEANSING_METHOD
    )
    safety_reason_codes: tuple[()] = ()


class MissingSkincareDecision(StrictModel):
    """Skincare classification requiring a product-type follow-up."""

    route: Literal[Route.ACTION] = Route.ACTION
    action_state: Literal[ActionState.MISSING_CONTEXT] = ActionState.MISSING_CONTEXT
    action: Literal[ActionType.SKINCARE] = ActionType.SKINCARE
    context: EmptyContext
    missing_fields: tuple[Literal["product_type"]] = ("product_type",)
    clarification_code: Literal[ClarificationCode.ASK_SKINCARE_PRODUCT_TYPE] = (
        ClarificationCode.ASK_SKINCARE_PRODUCT_TYPE
    )
    safety_reason_codes: tuple[()] = ()


class MissingHeatDecision(StrictModel):
    """Heat classification requiring a heat-type follow-up."""

    route: Literal[Route.ACTION] = Route.ACTION
    action_state: Literal[ActionState.MISSING_CONTEXT] = ActionState.MISSING_CONTEXT
    action: Literal[ActionType.HEAT] = ActionType.HEAT
    context: EmptyContext
    missing_fields: tuple[Literal["heat_type"]] = ("heat_type",)
    clarification_code: Literal[ClarificationCode.ASK_HEAT_TYPE] = (
        ClarificationCode.ASK_HEAT_TYPE
    )
    safety_reason_codes: tuple[()] = ()


type CompleteActionDecision = Annotated[
    CompleteExerciseDecision
    | CompleteMakeupDecision
    | CompleteCleansingDecision
    | CompleteSkincareDecision
    | CompleteHeatDecision,
    Field(discriminator="action"),
]

type MissingActionDecision = Annotated[
    MissingExerciseDecision
    | MissingCleansingDecision
    | MissingSkincareDecision
    | MissingHeatDecision,
    Field(discriminator="action"),
]

type ActionDecision = Annotated[
    CompleteActionDecision | MissingActionDecision,
    Field(discriminator="action_state"),
]


class ConnectDecision(StrictModel):
    """Medical-safety escalation without a protocol action."""

    route: Literal[Route.CONNECT] = Route.CONNECT
    action: None = None
    context: None = None
    missing_fields: tuple[()] = ()
    clarification_code: None = None
    safety_reason_codes: Annotated[tuple[SafetyReason, ...], Field(min_length=1)]


class GeneralDecision(StrictModel):
    """In-scope non-action question without generated guidance."""

    route: Literal[Route.GENERAL] = Route.GENERAL
    action: None = None
    context: None = None
    missing_fields: tuple[()] = ()
    clarification_code: None = None
    safety_reason_codes: tuple[()] = ()


class UnsupportedDecision(StrictModel):
    """Out-of-scope question without generated guidance."""

    route: Literal[Route.UNSUPPORTED] = Route.UNSUPPORTED
    action: None = None
    context: None = None
    missing_fields: tuple[()] = ()
    clarification_code: None = None
    safety_reason_codes: tuple[()] = ()


type ProviderDecision = Annotated[
    ActionDecision | ConnectDecision | GeneralDecision | UnsupportedDecision,
    Field(discriminator="route"),
]
