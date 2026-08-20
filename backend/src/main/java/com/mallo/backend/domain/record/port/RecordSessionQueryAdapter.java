package com.mallo.backend.domain.record.port;

import java.util.UUID;

import org.springframework.stereotype.Component;

import com.mallo.backend.domain.sessionInfo.service.SessionInfoService;

import lombok.RequiredArgsConstructor;

/**
 * SessionQueryPort의 실제 구현체. journey.port.SessionInfoQueryAdapter와 같은 패턴 —
 * record는 sessionInfo의 엔티티/레포지토리를 직접 참조하지 않고 SessionInfoService만 호출한다.
 * 클래스명을 journey 쪽과 다르게(RecordSessionQueryAdapter) 지은 이유: 둘 다 기본 빈 이름이
 * 클래스명에서 나오는데, 똑같이 SessionInfoQueryAdapter로 두면 두 도메인 것이 빈 이름 충돌
 * (ConflictingBeanDefinitionException)을 일으킨다 — 실제로 겪고 고침(2026-08-20).
 * session_id가 존재하지 않으면 SessionInfoService.getSession()이 던지는
 * CustomException(SESSION_NOT_FOUND)이 그대로 전파된다.
 */
@Component
@RequiredArgsConstructor
public class RecordSessionQueryAdapter implements SessionQueryPort {

	private final SessionInfoService sessionInfoService;

	@Override
	public int getElapsedDay(UUID sessionId) {
		return sessionInfoService.getSession(sessionId).getElapsedDay();
	}
}
