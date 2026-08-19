package com.mallo.backend.domain.journey.port;

import java.util.UUID;

/**
 * journey 도메인이 sessionInfo 도메인에게 필요로 하는 조회 기능.
 * journey는 sessionInfo의 엔티티/레포지토리를 직접 참조하지 않고 이 인터페이스에만 의존한다.
 *
 * 실제 구현체는 SessionInfoQueryAdapter (SessionInfoService.getSession()을 호출).
 */
public interface SessionQueryPort {

	SessionSnapshot getSession(UUID sessionId);
}
