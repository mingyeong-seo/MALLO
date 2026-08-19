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
    "Return only the requested structured output. Use ACTION for routine lifestyle "
    "actions, GENERAL for in-scope non-action recovery questions, UNSUPPORTED for "
    "unrelated questions, and CONNECT when the user needs clinic review. Do not "
    "diagnose, prescribe, or generate treatment advice."
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
