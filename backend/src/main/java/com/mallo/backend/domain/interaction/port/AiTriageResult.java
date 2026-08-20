package com.mallo.backend.domain.interaction.port;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public record AiTriageResult(
		UUID requestId,
		String route,
		String actionState,
		String action,
		Map<String, String> context,
		List<String> missingFields,
		String clarificationCode,
		List<String> safetyReasonCodes
) {
}
