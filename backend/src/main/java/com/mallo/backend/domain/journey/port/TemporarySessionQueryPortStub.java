package com.mallo.backend.domain.journey.port;

import java.util.UUID;

import org.springframework.stereotype.Component;

/**
 * ⚠️ 임시 구현. backend-sessionInfo 브랜치가 아직 이 브랜치에 없어서 컴파일/테스트를 위해 넣어둔 스텁이다.
 * sessionInfo 도메인과 합쳐지면 SessionInfoService.getSession(sessionId)를 호출하는 진짜 구현체로
 * 교체하고 이 클래스는 삭제한다. 절대 이 상태로 배포하면 안 된다.
 */
@Component
public class TemporarySessionQueryPortStub implements SessionQueryPort {

	@Override
	public SessionSnapshot getSession(UUID sessionId) {
		throw new UnsupportedOperationException(
				"SessionQueryPort가 아직 실제 구현으로 연결되지 않았습니다. "
						+ "sessionInfo 도메인과 머지한 뒤 SessionInfoService를 호출하는 어댑터로 교체하세요.");
	}
}
