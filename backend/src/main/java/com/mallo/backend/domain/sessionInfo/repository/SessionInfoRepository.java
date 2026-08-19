package com.mallo.backend.domain.sessionInfo.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mallo.backend.domain.sessionInfo.entity.SessionInfo;
import com.mallo.backend.domain.sessionInfo.entity.SessionStatus;

public interface SessionInfoRepository extends JpaRepository<SessionInfo, UUID> {

	List<SessionInfo> findAllByOrderByCreatedAtDesc();

	// DailyActionReminderScheduler가 매일 리마인더 보낼 대상(진행 중인 세션)을 뽑을 때 쓴다.
	List<SessionInfo> findByStatus(SessionStatus status);
}
