package com.mallo.backend.domain.record.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.context.annotation.Import;

import com.mallo.backend.domain.record.entity.PerformedStatus;
import com.mallo.backend.domain.record.entity.PhotoRecord;
import com.mallo.backend.domain.record.entity.RecordAction;
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
		assertThat(journal).extracting(record -> record.getActions().get(0).getAction())
				.containsExactlyInAnyOrder("EXERCISE", "MEDICATION");
	}

	@Test
	void 다른_세션의_기록은_조회되지_않는다() {
		recoveryRecordRepository.save(record(1, "EXERCISE"));
		RecoveryRecord otherSession = RecoveryRecord.builder()
				.sessionId("22222222-2222-2222-2222-222222222222")
				.elapsedDay(1)
				.actions(recordActions("EXERCISE"))
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
	void 사진_여러_장을_연결한_기록을_저장하고_조회하면_사진이_id순으로_같이_따라온다() {
		PhotoRecord photo1 = photoRecordRepository.save(PhotoRecord.builder()
				.sessionId(SESSION_ID)
				.observationJson("{\"redness\":\"LOW\"}")
				.build());
		PhotoRecord photo2 = photoRecordRepository.save(PhotoRecord.builder()
				.sessionId(SESSION_ID)
				.observationJson("{\"redness\":\"HIGH\"}")
				.build());

		RecoveryRecord record = recoveryRecordRepository.save(RecoveryRecord.builder()
				.sessionId(SESSION_ID)
				.elapsedDay(1)
				.actions(recordActions("WOUND_CARE"))
				.build());
		record.attachPhotos(List.of(photo1, photo2));
		testEntityManager.flush();
		testEntityManager.clear();

		RecoveryRecord found = recoveryRecordRepository.findById(record.getId()).orElseThrow();
		assertThat(found.getPhotoRecords()).extracting(PhotoRecord::getId)
				.containsExactly(photo1.getId(), photo2.getId());
	}

	@Test
	void 사진_교체시_기존_사진의_연결이_끊어진다() {
		PhotoRecord photo1 = photoRecordRepository.save(PhotoRecord.builder()
				.sessionId(SESSION_ID).observationJson("{}").build());
		PhotoRecord photo2 = photoRecordRepository.save(PhotoRecord.builder()
				.sessionId(SESSION_ID).observationJson("{}").build());

		RecoveryRecord record = recoveryRecordRepository.save(record(1, "WOUND_CARE"));
		record.attachPhotos(List.of(photo1));
		testEntityManager.flush();

		record.attachPhotos(List.of(photo2));
		testEntityManager.flush();
		testEntityManager.clear();

		RecoveryRecord found = recoveryRecordRepository.findById(record.getId()).orElseThrow();
		assertThat(found.getPhotoRecords()).extracting(PhotoRecord::getId).containsExactly(photo2.getId());
		assertThat(photoRecordRepository.findById(photo1.getId()).orElseThrow().getRecoveryRecord()).isNull();
	}

	@Test
	void 저널_조회는_사진이_여러_건이어도_쿼리_한_번으로_끝난다() {
		// N+1 회귀 방지: @EntityGraph(attributePaths = "photoRecords") 없이 되돌아가면
		// 이 테스트가 실패해야 한다 (기록마다 photo_record를 추가로 SELECT하게 되므로)
		for (int day = 1; day <= 3; day++) {
			PhotoRecord photo = photoRecordRepository.save(PhotoRecord.builder()
					.sessionId(SESSION_ID)
					.observationJson("{}")
					.build());
			RecoveryRecord record = recoveryRecordRepository.save(RecoveryRecord.builder()
					.sessionId(SESSION_ID)
					.elapsedDay(day)
					.actions(recordActions("WOUND_CARE"))
					.build());
			record.attachPhotos(List.of(photo));
		}
		// 저장 시점에 1차 캐시에 올라온 인스턴스를 재사용하면 N+1이 가려지므로,
		// 영속성 컨텍스트를 비워서 아래 조회가 진짜로 DB를 다시 타게 만든다.
		testEntityManager.flush();
		testEntityManager.clear();

		Statistics statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
		statistics.setStatisticsEnabled(true);
		statistics.clear();

		List<RecoveryRecord> journal = recoveryRecordRepository.findBySessionIdOrderByElapsedDayAsc(SESSION_ID);
		// 서비스 코드(RecoveryRecordService.toResponse)처럼 실제로 photoRecords/actions까지 읽어야
		// lazy 컬렉션 초기화 여부가 드러난다
		journal.forEach(record -> {
			record.getPhotoRecords().forEach(PhotoRecord::getObservationJson);
			record.getActions().forEach(RecordAction::getAction);
		});

		assertThat(statistics.getPrepareStatementCount()).isEqualTo(1);
	}

	@Test
	void 생성일_범위_안의_기록을_찾는다() {
		RecoveryRecord record = recoveryRecordRepository.save(record(1, "EXERCISE"));

		LocalDate today = LocalDate.now();
		Optional<RecoveryRecord> found = recoveryRecordRepository
				.findFirstBySessionIdAndCreatedAtBetweenOrderByCreatedAtDesc(
						SESSION_ID, today.atStartOfDay(), today.plusDays(1).atStartOfDay());

		assertThat(found).isPresent();
		assertThat(found.get().getId()).isEqualTo(record.getId());
	}

	@Test
	void 생성일_범위_밖이면_찾지_못한다() {
		recoveryRecordRepository.save(record(1, "EXERCISE"));

		LocalDate yesterday = LocalDate.now().minusDays(1);
		Optional<RecoveryRecord> found = recoveryRecordRepository
				.findFirstBySessionIdAndCreatedAtBetweenOrderByCreatedAtDesc(
						SESSION_ID, yesterday.atStartOfDay(), yesterday.plusDays(1).atStartOfDay());

		assertThat(found).isEmpty();
	}

	private RecoveryRecord record(int elapsedDay, String action) {
		return RecoveryRecord.builder()
				.sessionId(SESSION_ID)
				.elapsedDay(elapsedDay)
				.actions(recordActions(action))
				.build();
	}

	private List<RecordAction> recordActions(String action) {
		return List.of(RecordAction.builder().action(action).performedStatus(PerformedStatus.DONE).build());
	}
}
