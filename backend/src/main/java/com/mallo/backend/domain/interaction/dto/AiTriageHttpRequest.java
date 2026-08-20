package com.mallo.backend.domain.interaction.dto;

import com.mallo.backend.domain.interaction.port.AiTriageInput;

public record AiTriageHttpRequest(
		String contractVersion,
		String question,
		String procedure,
		int elapsedDay
) {

	private static final String CONTRACT_VERSION = "1.0";

	public static AiTriageHttpRequest from(AiTriageInput input) {
		return new AiTriageHttpRequest(CONTRACT_VERSION, input.question(), input.procedure(), input.elapsedDay());
	}
}
