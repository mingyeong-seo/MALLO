from uuid import UUID

import pytest

from mallo_ai.openrouter_provider import create_openrouter_provider
from mallo_ai.provider_contracts import ProviderDecision, RequestId, TriageInput
from mallo_ai.service import TriageProvider, TriageService
from mallo_ai.settings import Settings
from mallo_ai.vocabulary import (
    ActionState,
    ActionType,
    ClarificationCode,
    ExerciseIntensity,
    Route,
    SafetyReason,
)

pytestmark = pytest.mark.live


class CountingProvider:
    __slots__: tuple[str, str] = ("calls", "provider")

    provider: TriageProvider
    calls: int

    def __init__(self, provider: TriageProvider) -> None:
        self.provider = provider
        self.calls = 0

    async def decide(self, triage_input: TriageInput, /) -> ProviderDecision:
        self.calls += 1
        return await self.provider.decide(triage_input)


@pytest.mark.anyio
async def test_luna_live_triage_routes_action_and_safety_without_leaking_text() -> None:
    settings = Settings.load()
    provider = create_openrouter_provider(settings)
    counting_provider = CountingProvider(provider)
    service = TriageService(counting_provider)

    try:
        complete_response = await service.triage(
            TriageInput(
                question="고강도 운동해도 될까요?",
                procedure="REJURAN",
                elapsed_day=3,
            ),
            RequestId(UUID("00000000-0000-0000-0000-000000000801")),
        )

        assert complete_response.route is Route.ACTION
        assert complete_response.action_state is ActionState.COMPLETE
        assert complete_response.action is ActionType.EXERCISE
        assert complete_response.context.intensity is ExerciseIntensity.INTENSE_ACTIVITY

        missing_response = await service.triage(
            TriageInput(
                question="운동해도 될까요?",
                procedure="REJURAN",
                elapsed_day=3,
            ),
            RequestId(UUID("00000000-0000-0000-0000-000000000802")),
        )

        assert missing_response.route is Route.ACTION
        assert missing_response.action_state is ActionState.MISSING_CONTEXT
        assert missing_response.action is ActionType.EXERCISE
        assert missing_response.missing_fields == ("intensity",)
        assert (
            missing_response.clarification_code
            is ClarificationCode.ASK_EXERCISE_INTENSITY
        )

        calls_before_safety = counting_provider.calls
        connect_response = await service.triage(
            TriageInput(
                question="이 붓기와 열감이 정상인가요?",
                procedure="REJURAN",
                elapsed_day=3,
            ),
            RequestId(UUID("00000000-0000-0000-0000-000000000803")),
        )

        assert connect_response.route is Route.CONNECT
        assert connect_response.safety_reason_codes == (SafetyReason.SYMPTOM_JUDGMENT,)
        assert counting_provider.calls == calls_before_safety
        assert counting_provider.calls == 2
    finally:
        await provider.aclose()
