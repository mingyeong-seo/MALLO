from typing import Literal
from uuid import UUID

from mallo_ai.errors import (
    ModelBudgetExhaustedError,
    ModelResponseInvalidError,
    ModelUnavailableError,
)
from mallo_ai.provider_contracts import (
    CompleteExerciseDecision,
    ExerciseContext,
    GeneralDecision,
    ProviderDecision,
    TriageInput,
)
from mallo_ai.vocabulary import ExerciseIntensity

TEST_REQUEST_ID = UUID("00000000-0000-0000-0000-000000000101")
TEST_SECRET = "s" * 32

ProviderMode = Literal["exercise", "general", "timeout", "budget", "invalid"]

VALID_REQUEST = {
    "contract_version": "1.0",
    "question": "오늘 가벼운 운동해도 될까요?",
    "procedure": "REJURAN",
    "elapsed_day": 3,
}


class FakeProvider:
    def __init__(self, mode: ProviderMode = "exercise") -> None:
        self.mode: ProviderMode = mode
        self.calls: list[TriageInput] = []

    async def decide(self, triage_input: TriageInput, /) -> ProviderDecision:
        self.calls.append(triage_input)
        if self.mode == "timeout":
            raise ModelUnavailableError
        if self.mode == "budget":
            raise ModelBudgetExhaustedError
        if self.mode == "invalid":
            raise ModelResponseInvalidError
        if self.mode == "general":
            return GeneralDecision()
        return CompleteExerciseDecision(
            context=ExerciseContext(intensity=ExerciseIntensity.LIGHT_ACTIVITY)
        )


class ClosableFakeProvider(FakeProvider):
    def __init__(self, mode: ProviderMode = "exercise") -> None:
        super().__init__(mode)
        self.closed: bool = False

    async def aclose(self) -> None:
        self.closed = True
