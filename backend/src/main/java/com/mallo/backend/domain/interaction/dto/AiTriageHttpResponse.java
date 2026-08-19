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
					&& !safetyReasonCodes.isEmpty();
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
			return context != null && !context.isEmpty() && missingFields.isEmpty() && clarificationCode == null;
		}
		return context != null && context.isEmpty() && !missingFields.isEmpty() && clarificationCode != null;
	}
}
