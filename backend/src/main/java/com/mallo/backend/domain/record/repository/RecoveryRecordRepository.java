package com.mallo.backend.domain.record.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.mallo.backend.domain.record.entity.RecoveryRecord;

public interface RecoveryRecordRepository extends JpaRepository<RecoveryRecord, Long> {

	// Journal 화면에서 기록마다 photoRecords를 같이 내려주는데, photoRecords가 LAZY라
	// EntityGraph 없이 그냥 조회하면 기록 건수만큼 photo_record를 추가로 SELECT하는 N+1이 발생한다.
	// LEFT JOIN FETCH를 강제해서 한 방 쿼리로 가져온다 (RecoveryRecordService.getJournal 참고)
	@EntityGraph(attributePaths = "photoRecords")
	List<RecoveryRecord> findBySessionIdOrderByElapsedDayAsc(String sessionId);

	// "오늘 기록이 있는지 / record_id가 뭔지"를 프론트가 전체 목록에서 직접 찾지 않도록
	// 백엔드가 오늘 날짜 범위로 직접 판단해서 하나만 돌려준다 (RecoveryRecordService.getToday 참고).
	// 같은 날 여러 건이 있을 수 있다는 설계상, 그중 제일 최근 걸 "오늘 기록"으로 본다.
	@EntityGraph(attributePaths = "photoRecords")
	Optional<RecoveryRecord> findFirstBySessionIdAndCreatedAtBetweenOrderByCreatedAtDesc(
			String sessionId, LocalDateTime start, LocalDateTime end);
}
