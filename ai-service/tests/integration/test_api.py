import logging
from uuid import UUID

import httpx2
import pytest
from pydantic import SecretStr
from tests.support import (
    TEST_REQUEST_ID,
    TEST_SECRET,
    VALID_REQUEST,
    ClosableFakeProvider,
    FakeProvider,
)

from mallo_ai.app import create_app
from mallo_ai.settings import Settings


def _auth_headers(request_id: UUID = TEST_REQUEST_ID) -> dict[str, str]:
    return {"Authorization": f"Bearer {TEST_SECRET}", "X-Request-Id": str(request_id)}


def _assert_error(res: httpx2.Response, status: int, code: str, msg: str) -> None:
    assert res.status_code == status
    assert res.json() == {"code": code, "message": msg}


def test_settings_reject_missing_openrouter_api_key() -> None:
    with pytest.raises(ValueError, match="OPENROUTER_API_KEY"):
        _ = Settings(
            openrouter_api_key=SecretStr(""),
            ai_shared_secret=SecretStr(TEST_SECRET),
        )


def test_settings_reject_missing_shared_secret() -> None:
    with pytest.raises(ValueError, match="AI_SHARED_SECRET"):
        _ = Settings(
            openrouter_api_key=SecretStr("test-openrouter-key"),
            ai_shared_secret=SecretStr(""),
        )


@pytest.mark.parametrize(
    "headers",
    [
        {"X-Request-Id": str(TEST_REQUEST_ID)},
        {"Authorization": "Bearer wrong", "X-Request-Id": str(TEST_REQUEST_ID)},
    ],
)
@pytest.mark.anyio
async def test_invalid_bearer_token_is_rejected(
    app_client: httpx2.AsyncClient, headers: dict[str, str]
) -> None:
    response = await app_client.post(
        "/internal/v1/triage",
        headers=headers,
        json=VALID_REQUEST,
    )

    _assert_error(response, 401, "UNAUTHORIZED", "invalid service credential")


@pytest.mark.anyio
async def test_valid_action_result_round_trips_request_id(
    app_client: httpx2.AsyncClient,
) -> None:
    response = await app_client.post(
        "/internal/v1/triage",
        headers=_auth_headers(),
        json=VALID_REQUEST,
    )

    assert response.status_code == 200
    assert response.json() == {
        "route": "ACTION",
        "action_state": "COMPLETE",
        "action": "EXERCISE",
        "context": {"intensity": "LIGHT_ACTIVITY"},
        "missing_fields": [],
        "clarification_code": None,
        "safety_reason_codes": [],
        "request_id": str(TEST_REQUEST_ID),
    }


@pytest.mark.parametrize(
    "headers",
    [
        {"Authorization": f"Bearer {TEST_SECRET}"},
        {"Authorization": f"Bearer {TEST_SECRET}", "X-Request-Id": "not-uuid"},
    ],
)
@pytest.mark.anyio
async def test_invalid_request_id_is_rejected(
    app_client: httpx2.AsyncClient, headers: dict[str, str]
) -> None:
    response = await app_client.post(
        "/internal/v1/triage",
        headers=headers,
        json=VALID_REQUEST,
    )

    _assert_error(response, 400, "INVALID_REQUEST_ID", "valid X-Request-Id required")


@pytest.mark.anyio
async def test_unknown_request_field_is_rejected(
    app_client: httpx2.AsyncClient,
) -> None:
    response = await app_client.post(
        "/internal/v1/triage",
        headers=_auth_headers(),
        json={**VALID_REQUEST, "unexpected": True},
    )

    _assert_error(response, 422, "INVALID_REQUEST", "invalid request")


@pytest.mark.parametrize(
    ("request_body", "status_code", "code", "message"),
    [
        (
            {**VALID_REQUEST, "contract_version": "2.0"},
            409,
            "CONTRACT_VERSION_UNSUPPORTED",
            "unsupported contract version",
        ),
        (
            {
                "question": VALID_REQUEST["question"],
                "procedure": VALID_REQUEST["procedure"],
                "elapsed_day": VALID_REQUEST["elapsed_day"],
            },
            422,
            "INVALID_REQUEST",
            "invalid request",
        ),
    ],
    ids=["unsupported", "missing"],
)
@pytest.mark.anyio
async def test_contract_version_validation_returns_stable_error(
    app_client: httpx2.AsyncClient,
    request_body: dict[str, str | int],
    status_code: int,
    code: str,
    message: str,
) -> None:
    response = await app_client.post(
        "/internal/v1/triage",
        headers=_auth_headers(),
        json=request_body,
    )

    _assert_error(response, status_code, code, message)


@pytest.mark.anyio
async def test_safety_connect_does_not_call_provider(
    app_client: httpx2.AsyncClient, fake_provider: FakeProvider
) -> None:
    response = await app_client.post(
        "/internal/v1/triage",
        headers=_auth_headers(),
        json={**VALID_REQUEST, "question": "붓기와 열감이 정상인가요?"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "route": "CONNECT",
        "action": None,
        "context": None,
        "missing_fields": [],
        "clarification_code": None,
        "safety_reason_codes": ["SYMPTOM_JUDGMENT"],
        "request_id": str(TEST_REQUEST_ID),
    }
    assert fake_provider.calls == []


@pytest.mark.anyio
async def test_provider_timeout_maps_to_stable_503(
    settings: Settings, caplog: pytest.LogCaptureFixture
) -> None:
    provider = FakeProvider(mode="timeout")
    transport = httpx2.ASGITransport(app=create_app(settings, provider))
    caplog.set_level(logging.WARNING, logger="mallo_ai.api")
    async with httpx2.AsyncClient(
        transport=transport, base_url="http://testserver"
    ) as client:
        response = await client.post(
            "/internal/v1/triage",
            headers=_auth_headers(),
            json=VALID_REQUEST,
        )

    _assert_error(response, 503, "MODEL_UNAVAILABLE", "model provider unavailable")
    records = [
        record
        for record in caplog.records
        if record.message == "handled_ai_provider_error"
    ]
    assert len(records) == 1
    record_attrs = vars(records[0])
    assert record_attrs["request_id"] == str(TEST_REQUEST_ID)
    assert record_attrs["code"] == "MODEL_UNAVAILABLE"
    assert record_attrs["model"] == "test/model"
    assert isinstance(record_attrs["elapsed_ms"], int)
    assert "오늘 가벼운 운동해도 될까요?" not in caplog.text
    assert TEST_SECRET not in caplog.text


@pytest.mark.anyio
async def test_provider_budget_maps_to_stable_503(settings: Settings) -> None:
    provider = FakeProvider(mode="budget")
    transport = httpx2.ASGITransport(app=create_app(settings, provider))
    async with httpx2.AsyncClient(
        transport=transport, base_url="http://testserver"
    ) as client:
        response = await client.post(
            "/internal/v1/triage",
            headers=_auth_headers(),
            json=VALID_REQUEST,
        )

    _assert_error(response, 503, "MODEL_BUDGET_EXHAUSTED", "model budget exhausted")


@pytest.mark.anyio
async def test_invalid_provider_response_maps_to_stable_502(
    settings: Settings, caplog: pytest.LogCaptureFixture
) -> None:
    provider = FakeProvider(mode="invalid")
    transport = httpx2.ASGITransport(app=create_app(settings, provider))
    caplog.set_level(logging.WARNING, logger="mallo_ai.api")
    async with httpx2.AsyncClient(
        transport=transport, base_url="http://testserver"
    ) as client:
        response = await client.post(
            "/internal/v1/triage",
            headers=_auth_headers(),
            json=VALID_REQUEST,
        )

    _assert_error(
        response,
        502,
        "MODEL_RESPONSE_INVALID",
        "model provider returned invalid response",
    )
    records = [
        record
        for record in caplog.records
        if record.message == "handled_ai_provider_error"
    ]
    assert len(records) == 1
    record_attrs = vars(records[0])
    assert record_attrs["request_id"] == str(TEST_REQUEST_ID)
    assert record_attrs["code"] == "MODEL_RESPONSE_INVALID"
    assert record_attrs["model"] == "test/model"
    assert isinstance(record_attrs["elapsed_ms"], int)
    assert "오늘 가벼운 운동해도 될까요?" not in caplog.text
    assert TEST_SECRET not in caplog.text


@pytest.mark.anyio
async def test_health_routes_expose_no_config(app_client: httpx2.AsyncClient) -> None:
    health = await app_client.get("/healthz")
    ready = await app_client.get("/readyz")

    assert health.status_code == 200
    assert ready.status_code == 200
    assert health.json() == {"status": "ok"}
    assert ready.json() == {"status": "ready"}
    assert "test/model" not in health.text
    assert TEST_SECRET not in ready.text


@pytest.mark.anyio
async def test_lifespan_closes_only_async_closeable_provider(
    settings: Settings,
) -> None:
    plain_provider = FakeProvider()
    closable_provider = ClosableFakeProvider()
    plain_app = create_app(settings, plain_provider)
    closable_app = create_app(settings, closable_provider)

    async with plain_app.router.lifespan_context(plain_app):
        assert not hasattr(plain_provider, "closed")

    async with closable_app.router.lifespan_context(closable_app):
        assert closable_provider.closed is False

    assert closable_provider.closed is True
