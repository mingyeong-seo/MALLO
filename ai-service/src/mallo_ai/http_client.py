"""HTTP client factory for OpenRouter traffic."""

import socket
import time
from typing import Final

import httpx2

_CONNECT_TIMEOUT_SECONDS: Final = 5.0
_READ_TIMEOUT_SECONDS: Final = 7.0
_WRITE_TIMEOUT_SECONDS: Final = 10.0
_POOL_TIMEOUT_SECONDS: Final = 10.0
_KEEPALIVE_EXPIRY_SECONDS: Final = 30.0
_MAX_CONNECTIONS: Final = 200
_MAX_KEEPALIVE_CONNECTIONS: Final = 40
_CONNECT_RETRIES: Final = 2


async def _mark_request_started(request: httpx2.Request) -> None:
    request.extensions["mallo_ai_started_at"] = time.monotonic()


async def _mark_response_metadata(response: httpx2.Response) -> None:
    response.extensions["mallo_ai_status_code"] = response.status_code
    response.extensions["mallo_ai_http_version"] = response.http_version


def create_openrouter_http_client() -> httpx2.AsyncClient:
    """Create the tuned async HTTP client owned by the OpenRouter provider."""
    limits = httpx2.Limits(
        max_connections=_MAX_CONNECTIONS,
        max_keepalive_connections=_MAX_KEEPALIVE_CONNECTIONS,
        keepalive_expiry=_KEEPALIVE_EXPIRY_SECONDS,
    )
    timeout = httpx2.Timeout(
        connect=_CONNECT_TIMEOUT_SECONDS,
        read=_READ_TIMEOUT_SECONDS,
        write=_WRITE_TIMEOUT_SECONDS,
        pool=_POOL_TIMEOUT_SECONDS,
    )
    transport = httpx2.AsyncHTTPTransport(
        http2=True,
        limits=limits,
        retries=_CONNECT_RETRIES,
        socket_options=((socket.IPPROTO_TCP, socket.TCP_NODELAY, 1),),
    )
    return httpx2.AsyncClient(
        http2=True,
        follow_redirects=True,
        limits=limits,
        timeout=timeout,
        transport=transport,
        event_hooks={
            "request": [_mark_request_started],
            "response": [_mark_response_metadata],
        },
    )
