"""Deterministic, fail-closed routing for medically high-risk questions."""

from typing import Final

from mallo_ai.provider_contracts import ConnectDecision
from mallo_ai.vocabulary import SafetyReason

__all__ = ("first_safety_reason", "route_high_risk")

SYMPTOM_JUDGMENT_PHRASES: Final[tuple[str, ...]] = (
    "통증",
    "아파",
    "아픈",
    "붓기",
    "부었",
    "열감",
    "고름",
    "출혈",
    "피가",
    "감염",
    "알레르기",
    "두드러기",
    "호흡",
    "숨이",
    "어지러",
    "실신",
    "부작용",
    "정상인가",
    "정상인지",
    "비정상",
    "응급",
)
MEDICATION_OR_TREATMENT_PHRASES: Final[tuple[str, ...]] = (
    "약먹",
    "약을",
    "약추천",
    "복용",
    "연고",
    "항생제",
    "진통제",
    "스테로이드",
    "처방",
    "용량",
    "투약",
    "치료",
)
DIAGNOSIS_REQUEST_PHRASES: Final[tuple[str, ...]] = (
    "진단",
    "질환",
    "병인가",
    "감염인가",
    "의사처럼",
    "전문가처럼",
)
PROMPT_INJECTION_PHRASES: Final[tuple[str, ...]] = (
    "이전지시무시",
    "시스템프롬프트무시",
    "규칙무시",
    "안전규칙무시",
)


def route_high_risk(question: str) -> ConnectDecision | None:
    """Return CONNECT for a deterministic high-risk question, otherwise None."""
    normalized = "".join(question.casefold().split())
    reason = first_safety_reason(normalized)
    if reason is None:
        return None
    return ConnectDecision(safety_reason_codes=(reason,))


def first_safety_reason(normalized_question: str) -> SafetyReason | None:
    """Return the highest-precedence safety reason matching normalized text."""
    if _contains_phrase(normalized_question, PROMPT_INJECTION_PHRASES):
        return SafetyReason.SYMPTOM_JUDGMENT
    if _contains_phrase(normalized_question, DIAGNOSIS_REQUEST_PHRASES):
        return SafetyReason.SYMPTOM_JUDGMENT
    if _contains_phrase(normalized_question, MEDICATION_OR_TREATMENT_PHRASES):
        return SafetyReason.MEDICATION_TREATMENT
    if _contains_phrase(normalized_question, SYMPTOM_JUDGMENT_PHRASES):
        return SafetyReason.SYMPTOM_JUDGMENT
    return None


def _contains_phrase(question: str, phrases: tuple[str, ...]) -> bool:
    return any(phrase in question for phrase in phrases)
