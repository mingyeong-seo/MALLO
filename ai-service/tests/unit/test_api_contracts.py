import pytest
from pydantic import ValidationError

from mallo_ai import api_contracts


def test_request_rejects_unknown_fields() -> None:
    with pytest.raises(ValidationError):
        _ = api_contracts.TriageRequest.model_validate(
            {
                "contract_version": "1.0",
                "question": "운동해도 될까요?",
                "procedure": "REJURAN",
                "elapsed_day": 2,
                "unexpected": True,
            }
        )


def test_complete_exercise_requires_exercise_context() -> None:
    with pytest.raises(ValidationError):
        _ = api_contracts.CompleteExerciseDecision.model_validate(
            {
                "route": "ACTION",
                "action_state": "COMPLETE",
                "action": "EXERCISE",
                "context": {"method": "GENTLE"},
                "missing_fields": [],
                "clarification_code": None,
                "safety_reason_codes": [],
            }
        )


def test_missing_exercise_requires_clarification_code() -> None:
    with pytest.raises(ValidationError):
        _ = api_contracts.MissingExerciseDecision.model_validate(
            {
                "route": "ACTION",
                "action_state": "MISSING_CONTEXT",
                "action": "EXERCISE",
                "context": {},
                "missing_fields": ["intensity"],
                "clarification_code": None,
                "safety_reason_codes": [],
            }
        )
