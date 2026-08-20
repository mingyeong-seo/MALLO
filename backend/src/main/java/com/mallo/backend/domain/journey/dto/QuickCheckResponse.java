package com.mallo.backend.domain.journey.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonRawValue;
import com.mallo.backend.domain.journey.entity.ActionType;
import com.mallo.backend.domain.journey.entity.DecisionType;
import com.mallo.backend.domain.journey.entity.Journey;
import com.mallo.backend.domain.journey.entity.QuickCheckStatus;

/**
 * POST /v1/checks, GET /v1/checks/today, GET /v1/checks/{checkId} 공용 응답.
 * status가 NO_PROTOCOL이면 decision/protocolRef/guidance/nextAction은 전부 null.
 * (FE 협의 완료 2026-08-19: status는 MATCHED/NO_PROTOCOL 두 가지만 사용, ASK MALLO의
 * UNSUPPORTED는 별도 개념이라 여기 포함하지 않음)
 */
public record QuickCheckResponse(
		UUID checkId,
		UUID sessionId,
		int elapsedDay,
		ActionType action,

		// Journey.context는 이미 JSON 문자열이라, 다시 파싱하지 않고 그대로 JSON으로 내려보낸다.
		@JsonRawValue String context,

		QuickCheckStatus status,
		DecisionType decision,
		String guidance,

		// Protocol.nextAction과 동일한 CTA 구조 JSON (예: {"type":"VIEW_ALTERNATIVE","label":"..."}). 없으면 null.
		@JsonRawValue String nextAction,

		String protocolRef,
		LocalDateTime createdAt
) {
	public static QuickCheckResponse from(Journey journey) {
		return new QuickCheckResponse(
				journey.getId(),
				journey.getSessionId(),
				journey.getElapsedDay(),
				journey.getAction(),
				journey.getContext(),
				journey.getStatus(),
				journey.getDecision(),
				journey.getGuidance(),
				journey.getNextAction(),
				journey.getProtocolRef(),
				journey.getCreatedAt()
		);
	}
}
