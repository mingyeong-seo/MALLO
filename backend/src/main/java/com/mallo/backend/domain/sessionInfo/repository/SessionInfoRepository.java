package com.mallo.backend.domain.sessionInfo.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mallo.backend.domain.sessionInfo.entity.SessionInfo;

public interface SessionInfoRepository extends JpaRepository<SessionInfo, UUID> {

	List<SessionInfo> findAllByOrderByCreatedAtDesc();
}
