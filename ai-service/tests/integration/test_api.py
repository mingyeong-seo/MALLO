import logging
from uuid import UUID

import httpx2
import pytest

from conftest import (  # pyright: ignore[reportImplicitRelativeImport]
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


@pytest.mark.anyio
async def test_missing_bearer_token_is_rejected(app_client: httpx2.AsyncClient) -> None:
    response = await app_client.post(
        "/internal/v1/triage",
        headers={"X-Request-Id": str(TEST_REQUEST_ID)},
        json=VALID_REQUEST,
    )

    assert response.status_code == 401
    assert response.json() == {
        "code": "UNAUTHORIZED",
        "message": "invalid service credential",
    }


@pytest.mark.anyio
async def test_invalid_bearer_token_is_rejected(app_client: httpx2.AsyncClient) -> None:
    response = await app_client.post(
        "/internal/v1/triage",
        headers={"Authorization": "Bearer wrong", "X-Request-Id": str(TEST_REQUEST_ID)},
        json=VALID_REQUEST,
    )

    assert response.status_code == 401
    assert response.json() == {
        "code": "UNAUTHORIZED",
        "message": "invalid service credential",
    }


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


@pytest.mark.anyio
async def test_missing_request_id_is_rejected(app_client: httpx2.AsyncClient) -> None:
    response = await app_client.post(
        "/internal/v1/triage",
        headers={"Authorization": f"Bearer {TEST_SECRET}"},
        json=VALID_REQUEST,
    )

    assert response.status_code == 400
    assert response.json() == {
        "code": "INVALID_REQUEST_ID",
        "message": "valid X-Request-Id required",
    }


@pytest.mark.anyio
async def test_malformed_request_id_is_rejected(app_client: httpx2.AsyncClient) -> None:
    response = await app_client.post(
        "/internal/v1/triage",
        headers={"Authorization": f"Bearer {TEST_SECRET}", "X-Request-Id": "not-uuid"},
        json=VALID_REQUEST,
    )

    assert response.status_code == 400
    assert response.json() == {
        "code": "INVALID_REQUEST_ID",
        "message": "valid X-Request-Id required",
    }


@pytest.mark.anyio
async def test_unknown_request_field_is_rejected(
    app_client: httpx2.AsyncClient,
) -> None:
    response = await app_client.post(
        "/internal/v1/triage",
        headers=_auth_headers(),
        json={**VALID_REQUEST, "unexpected": True},
    )

    assert response.status_code == 422
    assert response.json() == {
        "code": "INVALID_REQUEST",
        "message": "invalid request",
    }


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

    assert response.status_code == 503
    assert response.json() == {
        "code": "MODEL_UNAVAILABLE",
        "message": "model provider unavailable",
    }
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

    assert response.status_code == 503
    assert response.json() == {
        "code": "MODEL_BUDGET_EXHAUSTED",
        "message": "model budget exhausted",
    }


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
