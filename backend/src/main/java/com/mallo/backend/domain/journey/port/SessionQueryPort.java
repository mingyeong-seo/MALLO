package com.mallo.backend.domain.journey.port;

import java.util.UUID;

/**
 * journey 도메인이 sessionInfo 도메인에게 필요로 하는 조회 기능.
 * journey는 sessionInfo의 엔티티/레포지토리를 직접 참조하지 않고 이 인터페이스에만 의존한다.
 *
 * backend-sessionInfo 브랜치와 합쳐지면, SessionInfoService를 호출하는 실제 구현체로 교체하고
 * TemporarySessionQueryPortStub은 삭제한다.
 */
public interface SessionQueryPort {

	SessionSnapshot getSession(UUID sessionId);
}
