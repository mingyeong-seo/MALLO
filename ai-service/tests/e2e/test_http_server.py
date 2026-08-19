import socket
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import anyio
import httpx2
import pytest
import uvicorn
from pydantic import SecretStr, TypeAdapter
from tests.support import (
    TEST_REQUEST_ID,
    TEST_SECRET,
    VALID_REQUEST,
)

from mallo_ai.app import create_app
from mallo_ai.provider_contracts import GeneralDecision, ProviderDecision, TriageInput
from mallo_ai.settings import Settings

_SOCKET_ADDRESS_ADAPTER: TypeAdapter[tuple[object, ...]] = TypeAdapter(
    tuple[object, ...]
)


class HttpFakeProvider:
    def __init__(self) -> None:
        self.closed: bool = False

    async def decide(self, _triage_input: TriageInput, /) -> ProviderDecision:
        return GeneralDecision()

    async def aclose(self) -> None:
        self.closed = True


def _free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        address = _SOCKET_ADDRESS_ADAPTER.validate_python(sock.getsockname())
        return _port_from_socket_address(address)


def _port_from_socket_address(address: tuple[object, ...]) -> int:
    if len(address) < 2:
        message = "unexpected socket address shape"
        raise AssertionError(message)
    port = address[1]
    if not isinstance(port, int):
        message = "unexpected socket port type"
        raise TypeError(message)
    return port


@asynccontextmanager
async def _running_server(
    provider: HttpFakeProvider,
) -> AsyncGenerator[tuple[str, uvicorn.Server]]:
    settings = Settings(
        openrouter_api_key=SecretStr("test-openrouter-key"),
        ai_shared_secret=SecretStr(TEST_SECRET),
    )
    port = _free_port()
    server = uvicorn.Server(
        uvicorn.Config(
            create_app(settings, provider),
            host="127.0.0.1",
            port=port,
            log_level="warning",
        )
    )
    async with anyio.create_task_group() as task_group:
        _ = task_group.start_soon(server.serve)
        async with httpx2.AsyncClient(base_url=f"http://127.0.0.1:{port}") as client:
            for _ in range(100):
                try:
                    response = await client.get("/healthz")
                except httpx2.HTTPError:
                    await anyio.sleep(0.05)
                    continue
                if response.status_code == 200:
                    break
            else:
                message = "server did not start"
                raise AssertionError(message)
        try:
            yield f"http://127.0.0.1:{port}", server
        finally:
            server.should_exit = True
            with anyio.move_on_after(5, shield=True):
                await server.shutdown()
            task_group.cancel_scope.cancel()


@pytest.mark.anyio
async def test_real_http_server_accepts_fake_provider_without_live_model_call() -> None:
    provider = HttpFakeProvider()

    async with (
        _running_server(provider) as (base_url, _server),
        httpx2.AsyncClient(base_url=base_url) as client,
    ):
        response = await client.post(
            "/internal/v1/triage",
            headers={
                "Authorization": f"Bearer {TEST_SECRET}",
                "X-Request-Id": str(TEST_REQUEST_ID),
            },
            json=VALID_REQUEST,
        )

    assert response.status_code == 200
    assert response.json() == {
        "route": "GENERAL",
        "action": None,
        "context": None,
        "missing_fields": [],
        "clarification_code": None,
        "safety_reason_codes": [],
        "request_id": str(TEST_REQUEST_ID),
    }
    assert provider.closed
