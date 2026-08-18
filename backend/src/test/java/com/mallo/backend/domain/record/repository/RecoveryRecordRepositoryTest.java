package com.mallo.backend.domain.record.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.context.annotation.Import;

import com.mallo.backend.domain.record.entity.PerformedStatus;
import com.mallo.backend.domain.record.entity.PhotoRecord;
import com.mallo.backend.domain.record.entity.RecoveryRecord;
import com.mallo.backend.global.config.JpaAuditingConfig;

import jakarta.persistence.EntityManagerFactory;

/**
 * docs/RECORD_NOTIFICATION_DOMAIN_DESIGN.md 2번 "왜 이렇게 나눴나"에서 결정한
 * "하루에 같은 행동을 여러 번 기록할 수 있어서 (session_id, elapsed_day) 유니크는 걸지 않는다"가
 * 실제 스키마에도 반영돼 있는지, DAY 오름차순 조회 인덱스가 의도대로 동작하는지 검증한다.
 */
@DataJpaTest
@Import(JpaAuditingConfig.class)
class RecoveryRecordRepositoryTest {

	private static final String SESSION_ID = "11111111-1111-1111-1111-111111111111";

	@Autowired
	private RecoveryRecordRepository recoveryRecordRepository;

	@Autowired
	private PhotoRecordRepository photoRecordRepository;

	@Autowired
	private TestEntityManager testEntityManager;

	@Autowired
	private EntityManagerFactory entityManagerFactory;

	@Test
	void 세션의_기록을_DAY_오름차순으로_조회한다() {
		recoveryRecordRepository.save(record(3, "WOUND_CARE"));
		recoveryRecordRepository.save(record(1, "EXERCISE"));
		recoveryRecordRepository.save(record(2, "MEDICATION"));

		List<RecoveryRecord> journal = recoveryRecordRepository.findBySessionIdOrderByElapsedDayAsc(SESSION_ID);

		assertThat(journal).extracting(RecoveryRecord::getElapsedDay).containsExactly(1, 2, 3);
	}

	@Test
	void 같은_DAY에_행동별로_여러_기록을_저장할_수_있다() {
		recoveryRecordRepository.save(record(1, "EXERCISE"));
		recoveryRecordRepository.save(record(1, "MEDICATION"));

		List<RecoveryRecord> journal = recoveryRecordRepository.findBySessionIdOrderByElapsedDayAsc(SESSION_ID);

		assertThat(journal).hasSize(2);
		assertThat(journal).extracting(RecoveryRecord::getAction).containsExactlyInAnyOrder("EXERCISE", "MEDICATION");
	}

	@Test
	void 다른_세션의_기록은_조회되지_않는다() {
		recoveryRecordRepository.save(record(1, "EXERCISE"));
		RecoveryRecord otherSession = RecoveryRecord.builder()
				.sessionId("22222222-2222-2222-2222-222222222222")
				.elapsedDay(1)
				.action("EXERCISE")
				.performedStatus(PerformedStatus.DONE)
				.build();
		recoveryRecordRepository.save(otherSession);

		List<RecoveryRecord> journal = recoveryRecordRepository.findBySessionIdOrderByElapsedDayAsc(SESSION_ID);

		assertThat(journal).hasSize(1);
	}

	@Test
	void 저장하면_생성시각이_자동으로_채워진다() {
		RecoveryRecord saved = recoveryRecordRepository.save(record(1, "EXERCISE"));

		assertThat(saved.getId()).isNotNull();
		assertThat(saved.getCreatedAt()).isNotNull();
	}

	@Test
	void 사진을_연결한_기록을_저장하고_조회하면_사진이_같이_따라온다() {
		PhotoRecord photo = photoRecordRepository.save(PhotoRecord.builder()
				.sessionId(SESSION_ID)
				.observationJson("{\"redness\":\"LOW\"}")
				.build());

		RecoveryRecord record = RecoveryRecord.builder()
				.sessionId(SESSION_ID)
				.elapsedDay(1)
				.action("WOUND_CARE")
				.performedStatus(PerformedStatus.DONE)
				.photoRecord(photo)
				.build();
		Long savedId = recoveryRecordRepository.save(record).getId();

		RecoveryRecord found = recoveryRecordRepository.findById(savedId).orElseThrow();
		assertThat(found.getPhotoRecord()).isNotNull();
		assertThat(found.getPhotoRecord().getId()).isEqualTo(photo.getId());
	}

	@Test
	void 저널_조회는_사진이_여러_건이어도_쿼리_한_번으로_끝난다() {
		// N+1 회귀 방지: @EntityGraph(attributePaths = "photoRecord") 없이 되돌아가면
		// 이 테스트가 실패해야 한다 (기록마다 photo_record를 추가로 SELECT하게 되므로)
		for (int day = 1; day <= 3; day++) {
			PhotoRecord photo = photoRecordRepository.save(PhotoRecord.builder()
					.sessionId(SESSION_ID)
					.observationJson("{}")
					.build());
			recoveryRecordRepository.save(RecoveryRecord.builder()
					.sessionId(SESSION_ID)
					.elapsedDay(day)
					.action("WOUND_CARE")
					.performedStatus(PerformedStatus.DONE)
					.photoRecord(photo)
					.build());
		}
		// 저장 시점에 1차 캐시에 올라온 인스턴스를 재사용하면 N+1이 가려지므로,
		// 영속성 컨텍스트를 비워서 아래 조회가 진짜로 DB를 다시 타게 만든다.
		testEntityManager.flush();
		testEntityManager.clear();

		Statistics statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
		statistics.setStatisticsEnabled(true);
		statistics.clear();

		List<RecoveryRecord> journal = recoveryRecordRepository.findBySessionIdOrderByElapsedDayAsc(SESSION_ID);
		// 서비스 코드(RecoveryRecordService.toResponse)처럼 실제로 photoRecord 필드까지 읽어야
		// lazy 프록시 초기화 여부가 드러난다
		journal.forEach(record -> record.getPhotoRecord().getObservationJson());

		assertThat(statistics.getPrepareStatementCount()).isEqualTo(1);
	}

	private RecoveryRecord record(int elapsedDay, String action) {
		return RecoveryRecord.builder()
				.sessionId(SESSION_ID)
				.elapsedDay(elapsedDay)
				.action(action)
				.performedStatus(PerformedStatus.DONE)
				.build();
	}
}
