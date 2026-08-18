package com.mallo.backend.domain.journey.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mallo.backend.domain.journey.entity.Journey;

public interface JourneyRepository extends JpaRepository<Journey, UUID> {

	/**
	 * GET /v1/checks/today 용 — 세션의 현재 elapsed_day에 저장된 Quick Check 기록을 최신순으로 전부 반환.
	 * 상위 N개만 보여주는 건 프론트 책임(slice).
	 */
	List<Journey> findBySessionIdAndElapsedDayOrderByCreatedAtDesc(UUID sessionId, int elapsedDay);
}
