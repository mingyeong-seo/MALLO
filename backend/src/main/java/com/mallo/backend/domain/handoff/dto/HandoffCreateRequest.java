package com.mallo.backend.domain.handoff.dto;

import com.mallo.backend.domain.handoff.entity.HandoffChannel;

import jakarta.validation.constraints.NotNull;

public record HandoffCreateRequest(
		Long interactionId, //S04에서 바로 들어오면 질문 자체가 없어서 null일 수 있음
		@NotNull HandoffChannel channel,
		String summary
) {
}
