package com.mallo.backend.domain.interaction.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;

public record AskRequest(
		@NotBlank String question,
		List<Long> photoRecordIds
) {
}
