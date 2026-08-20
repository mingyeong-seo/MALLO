"""Closed values shared by MALLO's AI and Spring triage contracts."""

from enum import StrEnum, unique


@unique
class Route(StrEnum):
    """Allowed top-level triage routes."""

    ACTION = "ACTION"
    CONNECT = "CONNECT"
    GENERAL = "GENERAL"
    UNSUPPORTED = "UNSUPPORTED"


@unique
class ActionState(StrEnum):
    """Allowed action-completeness states."""

    COMPLETE = "COMPLETE"
    MISSING_CONTEXT = "MISSING_CONTEXT"


@unique
class ActionType(StrEnum):
    """Spring-owned action categories eligible for protocol lookup."""

    EXERCISE = "EXERCISE"
    MAKEUP = "MAKEUP"
    CLEANSING = "CLEANSING"
    SKINCARE = "SKINCARE"
    HEAT = "HEAT"


@unique
class ExerciseIntensity(StrEnum):
    """Canonical exercise intensity values."""

    LIGHT_ACTIVITY = "LIGHT_ACTIVITY"
    SWEAT_ACTIVITY = "SWEAT_ACTIVITY"
    INTENSE_ACTIVITY = "INTENSE_ACTIVITY"


@unique
class MakeupFriction(StrEnum):
    """Canonical makeup friction values."""

    GENTLE = "GENTLE"
    FRICTION = "FRICTION"
    UNKNOWN = "UNKNOWN"


@unique
class CleansingMethod(StrEnum):
    """Canonical cleansing method values."""

    GENTLE = "GENTLE"
    FRICTION = "FRICTION"
    EXFOLIATING = "EXFOLIATING"


@unique
class SkincareProductType(StrEnum):
    """Canonical skincare product-type values."""

    MOISTURIZING = "MOISTURIZING"
    SUNSCREEN = "SUNSCREEN"
    RETINOID = "RETINOID"
    AHA_BHA = "AHA_BHA"
    SCRUB = "SCRUB"
    OTHER_ACTIVE = "OTHER_ACTIVE"


@unique
class HeatType(StrEnum):
    """Canonical heat-exposure values."""

    SAUNA_STEAM = "SAUNA_STEAM"
    HOT_BATH_SHOWER = "HOT_BATH_SHOWER"


@unique
class ClarificationCode(StrEnum):
    """Fixed follow-up prompts owned by the Spring backend."""

    ASK_EXERCISE_INTENSITY = "ASK_EXERCISE_INTENSITY"
    ASK_CLEANSING_METHOD = "ASK_CLEANSING_METHOD"
    ASK_SKINCARE_PRODUCT_TYPE = "ASK_SKINCARE_PRODUCT_TYPE"
    ASK_HEAT_TYPE = "ASK_HEAT_TYPE"


@unique
class SafetyReason(StrEnum):
    """Closed codes for deterministic medical-safety escalation."""

    SYMPTOM_JUDGMENT = "SYMPTOM_JUDGMENT"
    MEDICATION_TREATMENT = "MEDICATION_TREATMENT"
