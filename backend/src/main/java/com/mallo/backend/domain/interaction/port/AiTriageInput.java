package com.mallo.backend.domain.interaction.port;

public record AiTriageInput(
		String question,
		String procedure,
		int elapsedDay
) {
}
