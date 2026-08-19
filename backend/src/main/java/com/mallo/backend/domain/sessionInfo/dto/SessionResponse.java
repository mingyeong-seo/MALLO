package com.mallo.backend.domain.sessionInfo.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import com.mallo.backend.domain.sessionInfo.entity.SessionInfo;
import com.mallo.backend.domain.sessionInfo.entity.SessionStatus;

/**
 * POST /v1/sessions, GET /v1/sessions/today 공용 응답.
 * elapsed_day는 저장값이 아니라 SessionInfo에서 매번 계산해서 내려준다.
 */
public record SessionResponse(
		UUID sessionId,
		String procedure,
		LocalDate procedureAt,
		String clinicId,
		SessionStatus status,
		int elapsedDay,
		LocalDateTime createdAt
) {
	public static SessionResponse from(SessionInfo sessionInfo) {
		return new SessionResponse(
				sessionInfo.getId(),
				sessionInfo.getProcedure(),
				sessionInfo.getProcedureAt(),
				sessionInfo.getClinicId(),
				sessionInfo.getStatus(),
				sessionInfo.getElapsedDay(),
				sessionInfo.getCreatedAt()
		);
	}
}
