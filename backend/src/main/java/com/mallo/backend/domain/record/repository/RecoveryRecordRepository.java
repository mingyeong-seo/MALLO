package com.mallo.backend.domain.record.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.mallo.backend.domain.record.entity.RecoveryRecord;

public interface RecoveryRecordRepository extends JpaRepository<RecoveryRecord, Long> {

	// Journal 화면에서 기록마다 photoRecord를 같이 내려주는데, photoRecord가 LAZY라
	// EntityGraph 없이 그냥 조회하면 기록 건수만큼 photo_record를 추가로 SELECT하는 N+1이 발생한다.
	// LEFT JOIN FETCH를 강제해서 한 방 쿼리로 가져온다 (RecoveryRecordService.getJournal 참고)
	@EntityGraph(attributePaths = "photoRecord")
	List<RecoveryRecord> findBySessionIdOrderByElapsedDayAsc(String sessionId);
}
