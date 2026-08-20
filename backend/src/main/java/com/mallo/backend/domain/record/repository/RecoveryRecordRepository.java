package com.mallo.backend.domain.record.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.mallo.backend.domain.record.entity.RecoveryRecord;

public interface RecoveryRecordRepository extends JpaRepository<RecoveryRecord, Long> {

	// Journal 화면에서 기록마다 photoRecords를 같이 내려주는데, photoRecords가 LAZY라
	// EntityGraph 없이 그냥 조회하면 기록 건수만큼 photo_record를 추가로 SELECT하는 N+1이 발생한다.
	// LEFT JOIN FETCH를 강제해서 한 방 쿼리로 가져온다 (RecoveryRecordService.getJournal 참고)
	@EntityGraph(attributePaths = {"photoRecords", "actions"})
	List<RecoveryRecord> findBySessionIdOrderByElapsedDayAsc(String sessionId);

	// 세션+DAY당 기록 1개로 확정 (docs/RECORD_NOTIFICATION_DOMAIN_DESIGN.md 6번 open question 종결,
	// 2026-08-20). "오늘 기록이 있는지 / record_id가 뭔지"를 프론트가 전체 목록에서 직접 찾지 않도록,
	// 세션의 실제 elapsed_day를 기준으로 하나만 돌려준다 (RecoveryRecordService.getToday 참고).
	// createdAt 날짜 기준으로 찾던 이전 방식은, 세션의 elapsed_day와 어긋난 레코드가 하필 오늘
	// 생성됐을 때 그걸 "오늘 기록"으로 오인하는 버그가 있어서 폐기함(FE QA 보고, 2026-08-20).
	@EntityGraph(attributePaths = {"photoRecords", "actions"})
	Optional<RecoveryRecord> findBySessionIdAndElapsedDay(String sessionId, Integer elapsedDay);

	// POST /records에서 같은 세션+DAY에 이미 기록이 있으면 생성을 막기 위한 사전 체크
	// (RecoveryRecordService.create 참고). 수정은 PATCH로만 가능.
	boolean existsBySessionIdAndElapsedDay(String sessionId, Integer elapsedDay);
}
