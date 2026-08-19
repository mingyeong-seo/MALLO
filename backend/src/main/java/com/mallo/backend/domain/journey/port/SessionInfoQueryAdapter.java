package com.mallo.backend.domain.journey.port;

import java.util.UUID;

import org.springframework.stereotype.Component;

import com.mallo.backend.domain.sessionInfo.entity.SessionInfo;
import com.mallo.backend.domain.sessionInfo.service.SessionInfoService;

import lombok.RequiredArgsConstructor;

/**
 * SessionQueryPort의 실제 구현체. sessionInfo 도메인과 머지된 뒤
 * TemporarySessionQueryPortStub을 대체한다.
 *
 * journey는 SessionInfo 엔티티/레포지토리를 직접 참조하지 않고 SessionInfoService만 호출한다 —
 * 도메인 간 JPA 연관관계를 안 만드는 기존 컨벤션(Journey.sessionId 주석 참고)과 동일한 이유다.
 * session_id가 존재하지 않으면 SessionInfoService.getSession()이 던지는
 * CustomException(SESSION_NOT_FOUND)이 그대로 전파된다.
 */
@Component
@RequiredArgsConstructor
public class SessionInfoQueryAdapter implements SessionQueryPort {

	private final SessionInfoService sessionInfoService;

	@Override
	public SessionSnapshot getSession(UUID sessionId) {
		SessionInfo sessionInfo = sessionInfoService.getSession(sessionId);
		return new SessionSnapshot(sessionInfo.getProcedure(), sessionInfo.getElapsedDay());
	}
}
