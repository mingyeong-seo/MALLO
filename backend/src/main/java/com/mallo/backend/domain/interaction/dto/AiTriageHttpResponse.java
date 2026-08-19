package com.mallo.backend.domain.interaction.dto;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

import com.mallo.backend.domain.interaction.port.AiTriageResult;

public record AiTriageHttpResponse(
		UUID requestId,
		String route,
		String actionState,
		String action,
		Map<String, String> context,
		List<String> missingFields,
		String clarificationCode,
		List<String> safetyReasonCodes
) {

	private static final Set<String> ROUTES = Set.of("ACTION", "CONNECT", "GENERAL", "UNSUPPORTED");
	private static final Set<String> ACTION_STATES = Set.of("COMPLETE", "MISSING_CONTEXT");
	private static final Set<String> ACTIONS = Set.of("EXERCISE", "MAKEUP", "CLEANSING", "SKINCARE", "HEAT");
	private static final Set<String> SAFETY_REASONS = Set.of("SYMPTOM_JUDGMENT", "MEDICATION_TREATMENT");
	private static final Map<String, ContextSpec> COMPLETE_CONTEXTS = Map.of(
			"EXERCISE", new ContextSpec("intensity",
					Set.of("LIGHT_ACTIVITY", "SWEAT_ACTIVITY", "INTENSE_ACTIVITY")),
			"MAKEUP", new ContextSpec("friction",
					Set.of("GENTLE", "FRICTION", "UNKNOWN")),
			"CLEANSING", new ContextSpec("method",
					Set.of("GENTLE", "FRICTION", "EXFOLIATING")),
			"SKINCARE", new ContextSpec("product_type",
					Set.of("MOISTURIZING", "SUNSCREEN", "RETINOID", "AHA_BHA", "SCRUB", "OTHER_ACTIVE")),
			"HEAT", new ContextSpec("heat_type",
					Set.of("SAUNA_STEAM", "HOT_BATH_SHOWER")));
	private static final Map<String, MissingSpec> MISSING_CONTEXTS = Map.of(
			"EXERCISE", new MissingSpec("intensity", "ASK_EXERCISE_INTENSITY"),
			"CLEANSING", new MissingSpec("method", "ASK_CLEANSING_METHOD"),
			"SKINCARE", new MissingSpec("product_type", "ASK_SKINCARE_PRODUCT_TYPE"),
			"HEAT", new MissingSpec("heat_type", "ASK_HEAT_TYPE"));

	public AiTriageResult toResult(UUID expectedRequestId) {
		if (!Objects.equals(requestId, expectedRequestId) || !isValid()) {
			throw new IllegalArgumentException("Invalid AI triage response");
		}
		return new AiTriageResult(
				requestId,
				route,
				actionState,
				action,
				context == null ? null : Map.copyOf(context),
				List.copyOf(missingFields),
				clarificationCode,
				List.copyOf(safetyReasonCodes));
	}

	private boolean isValid() {
		if (requestId == null
				|| !ROUTES.contains(route)
				|| missingFields == null
				|| safetyReasonCodes == null) {
			return false;
		}
		return switch (route) {
			case "ACTION" -> isValidAction();
			case "CONNECT" -> actionState == null
					&& action == null
					&& context == null
					&& missingFields.isEmpty()
					&& clarificationCode == null
					&& !safetyReasonCodes.isEmpty()
					&& SAFETY_REASONS.containsAll(safetyReasonCodes);
			case "GENERAL", "UNSUPPORTED" -> actionState == null
					&& action == null
					&& context == null
					&& missingFields.isEmpty()
					&& clarificationCode == null
					&& safetyReasonCodes.isEmpty();
			default -> false;
		};
	}

	private boolean isValidAction() {
		if (!ACTION_STATES.contains(actionState) || !ACTIONS.contains(action) || !safetyReasonCodes.isEmpty()) {
			return false;
		}
		if ("COMPLETE".equals(actionState)) {
			return isValidCompleteAction();
		}
		return isValidMissingAction();
	}

	private boolean isValidCompleteAction() {
		ContextSpec spec = COMPLETE_CONTEXTS.get(action);
		return spec != null
				&& context != null
				&& context.keySet().equals(Set.of(spec.key()))
				&& spec.allowedValues().contains(context.get(spec.key()))
				&& missingFields.isEmpty()
				&& clarificationCode == null;
	}

	private boolean isValidMissingAction() {
		MissingSpec spec = MISSING_CONTEXTS.get(action);
		return spec != null
				&& context != null
				&& context.isEmpty()
				&& missingFields.equals(List.of(spec.field()))
				&& Objects.equals(clarificationCode, spec.clarificationCode());
	}

	private record ContextSpec(String key, Set<String> allowedValues) {
	}

	private record MissingSpec(String field, String clarificationCode) {
	}
}
