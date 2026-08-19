package com.mallo.backend.domain.interaction.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonRawValue;
import com.mallo.backend.domain.interaction.entity.Interaction;
import com.mallo.backend.domain.interaction.entity.InteractionStatus;
import com.mallo.backend.domain.journey.entity.ActionType;
import com.mallo.backend.domain.journey.entity.DecisionType;

public record AskResponse(
		Long interactionId,
		UUID sessionId,
		InteractionStatus status,
		ActionType action,

		@JsonRawValue String context,

		DecisionType decision, //ANSWERABLE일 때만 값 있음

		String message, //상황별 안내 문구 (되묻기 질문/답변/CONNECT 안내 등)

		@JsonRawValue String nextAction, //Protocol의 CTA, 없으면 null

		String protocolRef,
		List<Long> photoRecordIds,
		LocalDateTime createdAt
) {
	public static AskResponse of(Interaction interaction, DecisionType decision, String message, String nextAction) {
		return new AskResponse(
				interaction.getId(),
				interaction.getSessionId(),
				interaction.getStatus(),
				interaction.getAction(),
				interaction.getContext(),
				decision,
				message,
				nextAction,
				interaction.getProtocolRef(),
				interaction.getPhotoRecordIds(),
				interaction.getCreatedAt()
		);
	}
}
