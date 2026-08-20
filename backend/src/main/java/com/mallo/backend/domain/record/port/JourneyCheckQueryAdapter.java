package com.mallo.backend.domain.record.port;

import java.util.UUID;

import org.springframework.stereotype.Component;

import com.mallo.backend.domain.journey.service.JourneyService;

import lombok.RequiredArgsConstructor;

/**
 * CheckQueryPort의 실제 구현체. journey.port.SessionInfoQueryAdapter와 같은 패턴 —
 * record는 journey의 엔티티/레포지토리를 직접 참조하지 않고 JourneyService만 호출한다.
 */
@Component
@RequiredArgsConstructor
public class JourneyCheckQueryAdapter implements CheckQueryPort {

	private final JourneyService journeyService;

	@Override
	public boolean existsForSession(UUID checkId, UUID sessionId) {
		return journeyService.existsForSession(checkId, sessionId);
	}
}
