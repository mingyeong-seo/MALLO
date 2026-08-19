from collections.abc import AsyncIterator

import httpx2
import pytest
from pydantic import SecretStr

from mallo_ai.app import create_app
from mallo_ai.settings import Settings
from tests.support import TEST_SECRET, FakeProvider


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
