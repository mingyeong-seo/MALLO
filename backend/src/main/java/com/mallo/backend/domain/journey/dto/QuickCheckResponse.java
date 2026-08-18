package com.mallo.backend.domain.journey.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonRawValue;
import com.mallo.backend.domain.journey.entity.ActionType;
import com.mallo.backend.domain.journey.entity.DecisionType;
import com.mallo.backend.domain.journey.entity.Journey;

/**
 * POST /v1/checks, GET /v1/checks/today 공용 응답.
 * decision/protocolRef는 매칭되는 Protocol이 없으면(NO_PROTOCOL) null.
 */
public record QuickCheckResponse(
		UUID checkId,
		UUID sessionId,
		int elapsedDay,
		ActionType action,

		// Journey.context는 이미 JSON 문자열이라, 다시 파싱하지 않고 그대로 JSON으로 내려보낸다.
		@JsonRawValue String context,

		DecisionType decision,
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
				journey.getDecision(),
				journey.getProtocolRef(),
				journey.getCreatedAt()
		);
	}
}
