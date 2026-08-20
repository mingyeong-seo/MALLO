package com.mallo.backend.domain.sessionInfo.entity;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

import org.junit.jupiter.api.Test;

class SessionInfoTest {

	@Test
	void 시술_당일이면_elapsedDay는_0이다() {
		SessionInfo sessionInfo = SessionInfo.builder()
				.procedure("REJURAN")
				.procedureAt(LocalDate.now())
				.clinicId("DERNA")
				.build();

		assertThat(sessionInfo.getElapsedDay()).isZero();
	}

	@Test
	void procedureAt으로부터_지난_일수를_elapsedDay로_계산한다() {
		SessionInfo sessionInfo = SessionInfo.builder()
				.procedure("REJURAN")
				.procedureAt(LocalDate.now().minusDays(3))
				.clinicId("DERNA")
				.build();

		assertThat(sessionInfo.getElapsedDay()).isEqualTo(3);
	}

	@Test
	void UTC로는_전날이어도_한국_시술_당일이면_elapsedDay는_0이다() {
		SessionInfo sessionInfo = SessionInfo.builder()
				.procedure("REJURAN")
				.procedureAt(LocalDate.of(2026, 8, 21))
				.build();
		Clock koreanMidnight = Clock.fixed(
				Instant.parse("2026-08-20T15:44:47Z"),
				ZoneId.of("Asia/Seoul"));

		assertThat(sessionInfo.getElapsedDay(koreanMidnight)).isZero();
	}

	@Test
	void 생성_직후_상태는_ACTIVE이다() {
		SessionInfo sessionInfo = SessionInfo.builder()
				.procedure("REJURAN")
				.procedureAt(LocalDate.now())
				.build();

		assertThat(sessionInfo.getStatus()).isEqualTo(SessionStatus.ACTIVE);
		assertThat(sessionInfo.isActive()).isTrue();
	}

	@Test
	void complete를_호출하면_COMPLETED로_바뀐다() {
		SessionInfo sessionInfo = SessionInfo.builder()
				.procedure("REJURAN")
				.procedureAt(LocalDate.now())
				.build();

		sessionInfo.complete();

		assertThat(sessionInfo.getStatus()).isEqualTo(SessionStatus.COMPLETED);
		assertThat(sessionInfo.isActive()).isFalse();
	}
}
