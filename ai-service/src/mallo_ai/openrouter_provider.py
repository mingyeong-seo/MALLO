"""OpenRouter-backed implementation of the MALLO triage provider."""

from __future__ import annotations

from typing import TYPE_CHECKING, Final

import anyio
from pydantic_ai import Agent, NativeOutput
from pydantic_ai.exceptions import (
    ModelAPIError,
    ModelHTTPError,
    UnexpectedModelBehavior,
)
from pydantic_ai.models.openrouter import OpenRouterModel, OpenRouterModelSettings
from pydantic_ai.providers.openrouter import OpenRouterProvider

from mallo_ai.errors import (
    ModelBudgetExhaustedError,
    ModelResponseInvalidError,
    ModelUnavailableError,
)
from mallo_ai.http_client import create_openrouter_http_client
from mallo_ai.provider_contracts import ProviderDecision, StrictModel, TriageInput

if TYPE_CHECKING:
    import httpx2

    from mallo_ai.settings import Settings

_MODEL_TIMEOUT_SECONDS: Final = 7.0
_RUN_TIMEOUT_SECONDS: Final = 8.0
_MAX_TOKENS: Final = 256

_TRIAGE_INSTRUCTIONS: Final = (
    "You classify Korean cosmetic-procedure recovery questions for MALLO. "
    "Return only the requested structured output. First apply a strict scope gate "
    "using the user's question itself. The procedure and elapsed day are context "
    "only; an active procedure session never makes an unrelated question in scope. "
    "Return UNSUPPORTED when the question has no explicit relationship to cosmetic-"
    "procedure recovery, including ambiguous short fragments with no recovery intent. "
    "Do not invent recovery context for an ambiguous or unrelated question. Use "
    "GENERAL only for explicitly in-scope non-action recovery questions, ACTION for "
    "routine recovery actions, and CONNECT when the user needs clinic review. "
    "Examples: '오늘 저녁 메뉴 알려줘', '오늘 날씨 어때?', and '밤' are "
    "UNSUPPORTED; '회복 중에는 어떤 음식을 먹는 게 좋아?' is GENERAL; "
    "'오늘 저녁에 세안해도 돼?' is ACTION. Do not "
    "diagnose, prescribe, or generate treatment advice. For exercise ACTION, map "
    "Korean intensity words explicitly: 고강도, 격한, 무리한, 러닝, 웨이트, 헬스, "
    "인터벌, 땀이 많이 나는 운동 to INTENSE_ACTIVITY; 땀나는, 유산소, 조깅, "
    "필라테스, 요가 to SWEAT_ACTIVITY; 가벼운, 산책, 스트레칭 to LIGHT_ACTIVITY. "
    "If exercise is mentioned without an intensity clue, return MISSING_CONTEXT "
    "with ASK_EXERCISE_INTENSITY."
)


class ProviderDecisionOutput(StrictModel):
    """Native-output envelope required by Pydantic AI for provider decisions."""

    result: ProviderDecision


def build_openrouter_model_settings() -> OpenRouterModelSettings:
    """Return OpenRouter settings that enforce structured output and privacy."""
    return OpenRouterModelSettings(
        timeout=_MODEL_TIMEOUT_SECONDS,
        max_tokens=_MAX_TOKENS,
        openrouter_reasoning={"effort": "none", "exclude": True},
        openrouter_provider={
            "require_parameters": True,
            "data_collection": "deny",
            "allow_fallbacks": True,
        },
        openrouter_usage={"include": True},
    )


class OpenRouterTriageProvider:
    """Triage provider backed by OpenRouter native structured output."""

    def __init__(self, settings: Settings) -> None:
        """Create an OpenRouter provider and own its HTTP client lifecycle."""
        self._http_client: httpx2.AsyncClient = create_openrouter_http_client()
        model = OpenRouterModel(
            settings.mallo_ai_model,
            provider=OpenRouterProvider(
                api_key=settings.openrouter_api_key.get_secret_value(),
                app_url=settings.openrouter_app_url,
                app_title=settings.openrouter_app_title,
                http_client=self._http_client,
            ),
        )
        self._agent: Agent[None, ProviderDecisionOutput] = Agent(
            model,
            output_type=NativeOutput(ProviderDecisionOutput),
            instructions=_TRIAGE_INSTRUCTIONS,
            model_settings=build_openrouter_model_settings(),
            retries=0,
        )

    async def decide(self, triage_input: TriageInput, /) -> ProviderDecision:
        """Classify trusted triage input with the configured OpenRouter model."""
        try:
            with anyio.fail_after(_RUN_TIMEOUT_SECONDS):
                run_result = await self._agent.run(_prompt_for(triage_input))
        except TimeoutError as exc:
            raise ModelUnavailableError from exc
        except ModelHTTPError as exc:
            raise _translate_http_error(exc) from exc
        except UnexpectedModelBehavior as exc:
            raise ModelResponseInvalidError from exc
        except ModelAPIError as exc:
            raise ModelUnavailableError from exc
        return run_result.output.result

    async def aclose(self) -> None:
        """Close the provider-owned HTTP client."""
        await self._http_client.aclose()


def create_openrouter_provider(settings: Settings) -> OpenRouterTriageProvider:
    """Create the production OpenRouter triage provider."""
    return OpenRouterTriageProvider(settings)


def _prompt_for(triage_input: TriageInput) -> str:
    return (
        "Classify this trusted MALLO triage request.\n"
        f"procedure: {triage_input.procedure}\n"
        f"elapsed_day: {triage_input.elapsed_day}\n"
        f"question: {triage_input.question}"
    )


def _translate_http_error(exc: ModelHTTPError) -> Exception:
    if exc.status_code in {402, 429}:
        return ModelBudgetExhaustedError()
    if exc.status_code in {400, 422}:
        return ModelResponseInvalidError()
    return ModelUnavailableError()
