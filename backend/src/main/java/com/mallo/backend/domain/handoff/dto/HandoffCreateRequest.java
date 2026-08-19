package com.mallo.backend.domain.handoff.dto;

import com.mallo.backend.domain.handoff.entity.HandoffChannel;

import jakarta.validation.constraints.NotNull;

public record HandoffCreateRequest(
		@NotNull Long interactionId,
		@NotNull HandoffChannel channel,
		String summary
) {
}
