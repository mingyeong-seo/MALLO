package com.mallo.backend.domain.record.port;

import java.util.UUID;

/**
 * record 도메인이 sessionInfo 도메인에게 필요로 하는 조회 기능.
 * record는 sessionInfo의 엔티티/레포지토리를 직접 참조하지 않고 이 인터페이스에만 의존한다
 * (journey.port.SessionQueryPort와 대칭되는 패턴 — record/journey가 각자 자기 포트로 sessionInfo를 바라본다).
 *
 * POST /records의 elapsedDay가 세션의 실제 진행일과 일치하는지 검증하는 용도.
 * 실제 구현체는 SessionInfoQueryAdapter.
 */
public interface SessionQueryPort {

	int getElapsedDay(UUID sessionId);
}
