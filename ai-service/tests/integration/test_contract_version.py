from uuid import UUID

import httpx2
import pytest
from tests.support import TEST_REQUEST_ID, TEST_SECRET, VALID_REQUEST


def _auth_headers(request_id: UUID = TEST_REQUEST_ID) -> dict[str, str]:
    return {"Authorization": f"Bearer {TEST_SECRET}", "X-Request-Id": str(request_id)}


def _assert_error(res: httpx2.Response, status: int, code: str, msg: str) -> None:
    assert res.status_code == status
    assert res.json() == {"code": code, "message": msg}


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
        (
            {**VALID_REQUEST, "contract_version": "2.0", "elapsed_day": -1},
            422,
            "INVALID_REQUEST",
            "invalid request",
        ),
    ],
    ids=["unsupported", "missing", "unsupported_with_invalid_field"],
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
