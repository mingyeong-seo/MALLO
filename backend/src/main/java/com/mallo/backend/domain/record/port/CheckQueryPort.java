package com.mallo.backend.domain.record.port;

import java.util.UUID;

/**
 * record 도메인이 journey 도메인에게 필요로 하는 조회 기능.
 * record는 journey의 엔티티/레포지토리를 직접 참조하지 않고 이 인터페이스에만 의존한다
 * (journey.port.SessionQueryPort와 대칭되는 패턴 — 거기선 journey가 sessionInfo를 이렇게 의존한다).
 *
 * actions[]를 check_id 참조 구조로 저장하기 전에, 그 check_id가 실제로 존재하고
 * 같은 세션 것이 맞는지 확인하는 용도. 실제 구현체는 JourneyCheckQueryAdapter.
 */
public interface CheckQueryPort {

	boolean existsForSession(UUID checkId, UUID sessionId);
}
