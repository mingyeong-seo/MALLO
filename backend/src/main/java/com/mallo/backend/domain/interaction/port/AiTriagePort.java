package com.mallo.backend.domain.interaction.port;

public interface AiTriagePort {

	AiTriageResult triage(AiTriageInput input);
}
