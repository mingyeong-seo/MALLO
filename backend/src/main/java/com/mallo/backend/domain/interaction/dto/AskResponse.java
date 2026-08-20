package com.mallo.backend.domain.interaction.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonRawValue;
import com.mallo.backend.domain.interaction.entity.Interaction;
import com.mallo.backend.domain.interaction.entity.InteractionStatus;
import com.mallo.backend.domain.journey.entity.ActionType;
import com.mallo.backend.domain.journey.entity.DecisionType;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * status가 MATCHED면 decision/guidance/nextAction/protocolRef가 Quick Check(S08) 응답과
 * 동일한 구조로 채워진다 — FE가 S08 결과 화면을 그대로 재사용할 수 있게 필드명을 맞춤.
 * 그 외 status(CLARIFY/CONNECT/NO_PROTOCOL/GENERAL/UNSUPPORTED)는 Protocol 근거가 없어서
 * guidance 대신 message로 상황별 안내 문구를 내려준다.
 */
public record AskResponse(
		@Schema(description = "생성된 Interaction id")
		Long interactionId,

		@Schema(description = "세션 id")
		UUID sessionId,

		@Schema(description = "질문 분류 결과. MATCHED면 Quick Check와 동일한 구조로 답을 준다.")
		InteractionStatus status,

		@Schema(description = "생활 행동 질문일 때만 값 있음", nullable = true)
		ActionType action,

		@Schema(description = "Protocol 매칭에 쓴 조건 (JSON), 행동 질문이 아니면 null", nullable = true)
		@JsonRawValue String context,

		@Schema(description = "MATCHED일 때만 값 있음", nullable = true)
		DecisionType decision,

		@Schema(description = "MATCHED일 때만 값 있음 — 매칭된 Protocol의 안내 문구", nullable = true)
		String guidance,

		@Schema(description = "MATCHED가 아닐 때 상황별 안내 문구 (되묻기 질문/의료 확인 안내 등), MATCHED면 null",
				nullable = true)
		String message,

		@Schema(description = "매칭된 Protocol의 CTA (JSON), 없으면 null", nullable = true)
		@JsonRawValue String nextAction,

		@Schema(description = "매칭된 Protocol id, MATCHED가 아니면 null", nullable = true)
		String protocolRef,

		@Schema(description = "질문에 첨부한 사진 record id 목록")
		List<Long> photoRecordIds,

		@Schema(description = "생성 시각")
		LocalDateTime createdAt
) {
	public static AskResponse of(Interaction interaction, DecisionType decision, String guidance, String message,
			String nextAction) {
		return new AskResponse(
				interaction.getId(),
				interaction.getSessionId(),
				interaction.getStatus(),
				interaction.getAction(),
				interaction.getContext(),
				decision,
				guidance,
				message,
				nextAction,
				interaction.getProtocolRef(),
				interaction.getPhotoRecordIds(),
				interaction.getCreatedAt()
		);
	}
}
