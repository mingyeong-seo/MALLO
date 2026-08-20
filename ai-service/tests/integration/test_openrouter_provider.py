import pydantic_ai.models
import pytest
from pydantic import SecretStr

from mallo_ai.openrouter_provider import (
    OpenRouterTriageProvider,
    ProviderDecisionOutput,
    build_openrouter_model_settings,
    create_openrouter_provider,
)
from mallo_ai.provider_contracts import TriageInput
from mallo_ai.settings import Settings
from mallo_ai.vocabulary import Route


@pytest.fixture(autouse=True)
def disable_model_requests(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(pydantic_ai.models, "ALLOW_MODEL_REQUESTS", False)


def test_settings_default_to_gpt_5_6_luna() -> None:
    settings = Settings(
        openrouter_api_key=SecretStr("test-key"),
        ai_shared_secret=SecretStr("x" * 32),
    )

    assert settings.mallo_ai_model == "openai/gpt-5.6-luna"


def test_settings_reject_short_shared_secret() -> None:
    with pytest.raises(ValueError, match="AI_SHARED_SECRET"):
        _ = Settings(
            openrouter_api_key=SecretStr("test-key"),
            ai_shared_secret=SecretStr("short"),
        )


def test_openrouter_settings_enforce_privacy_and_schema_support() -> None:
    model_settings = build_openrouter_model_settings()

    assert "openrouter_reasoning" in model_settings
    assert "openrouter_provider" in model_settings
    assert model_settings["openrouter_reasoning"] == {
        "effort": "none",
        "exclude": True,
    }
    assert model_settings["openrouter_provider"] == {
        "require_parameters": True,
        "data_collection": "deny",
        "allow_fallbacks": True,
    }


def test_provider_output_wraps_decision_in_result_envelope() -> None:
    output = ProviderDecisionOutput.model_validate_json(
        '{"result":{"route":"GENERAL","safety_reason_codes":[]}}'
    )

    assert output.result.route is Route.GENERAL


@pytest.mark.anyio
async def test_provider_blocks_live_requests_when_disabled() -> None:
    settings = Settings(
        openrouter_api_key=SecretStr("test-key"),
        ai_shared_secret=SecretStr("x" * 32),
    )
    provider = create_openrouter_provider(settings)
    triage_input = TriageInput(
        question="오늘 가벼운 운동해도 될까요?",
        procedure="REJURAN",
        elapsed_day=3,
    )

    try:
        assert isinstance(provider, OpenRouterTriageProvider)
        with pytest.raises(RuntimeError, match="ALLOW_MODEL_REQUESTS is False"):
            _ = await provider.decide(triage_input)
    finally:
        await provider.aclose()
