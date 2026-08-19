from collections.abc import AsyncIterator
from typing import Literal
from uuid import UUID

import httpx2
import pytest
from pydantic import SecretStr

from mallo_ai.app import create_app
from mallo_ai.errors import ModelBudgetExhaustedError, ModelUnavailableError
from mallo_ai.provider_contracts import (
    CompleteExerciseDecision,
    ExerciseContext,
    GeneralDecision,
    ProviderDecision,
    TriageInput,
)
from mallo_ai.settings import Settings
from mallo_ai.vocabulary import ExerciseIntensity

TEST_REQUEST_ID = UUID("00000000-0000-0000-0000-000000000101")
TEST_SECRET = "s" * 32

VALID_REQUEST = {
    "contract_version": "1.0",
    "question": "오늘 가벼운 운동해도 될까요?",
    "procedure": "REJURAN",
    "elapsed_day": 3,
}


class FakeProvider:
    def __init__(
        self,
        mode: Literal["exercise", "general", "timeout", "budget"] = "exercise",
    ) -> None:
        self.mode: Literal["exercise", "general", "timeout", "budget"] = mode
        self.calls: list[TriageInput] = []

    async def decide(self, triage_input: TriageInput, /) -> ProviderDecision:
        self.calls.append(triage_input)
        if self.mode == "timeout":
            raise ModelUnavailableError
        if self.mode == "budget":
            raise ModelBudgetExhaustedError
        if self.mode == "general":
            return GeneralDecision()
        return CompleteExerciseDecision(
            context=ExerciseContext(intensity=ExerciseIntensity.LIGHT_ACTIVITY)
        )


class ClosableFakeProvider(FakeProvider):
    def __init__(
        self,
        mode: Literal["exercise", "general", "timeout", "budget"] = "exercise",
    ) -> None:
        super().__init__(mode)
        self.closed: bool = False

    async def aclose(self) -> None:
        self.closed = True


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


@pytest.fixture
def settings() -> Settings:
    return Settings(
        openrouter_api_key=SecretStr("test-openrouter-key"),
        ai_shared_secret=SecretStr(TEST_SECRET),
        mallo_ai_model="test/model",
    )


@pytest.fixture
def fake_provider() -> FakeProvider:
    return FakeProvider()


@pytest.fixture
async def app_client(
    settings: Settings, fake_provider: FakeProvider
) -> AsyncIterator[httpx2.AsyncClient]:
    transport = httpx2.ASGITransport(app=create_app(settings, fake_provider))
    async with httpx2.AsyncClient(
        transport=transport, base_url="http://testserver"
    ) as client:
        yield client
