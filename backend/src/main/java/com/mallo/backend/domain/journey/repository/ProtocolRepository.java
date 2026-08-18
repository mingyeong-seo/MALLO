package com.mallo.backend.domain.journey.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mallo.backend.domain.journey.entity.ActionType;
import com.mallo.backend.domain.journey.entity.Protocol;

public interface ProtocolRepository extends JpaRepository<Protocol, UUID> {

	/**
	 * procedure + action + dayStart~dayEnd 범위로 후보를 좁힌다.
	 * conditions(JSON) 매칭은 여기서 안 하고, 이 소수 후보를 받아서 서비스 레이어에서 비교한다.
	 */
	@Query("SELECT p FROM Protocol p "
			+ "WHERE p.procedure = :procedure "
			+ "AND p.action = :action "
			+ "AND p.dayStart <= :elapsedDay "
			+ "AND (p.dayEnd IS NULL OR p.dayEnd >= :elapsedDay)")
	List<Protocol> findCandidates(
			@Param("procedure") String procedure,
			@Param("action") ActionType action,
			@Param("elapsedDay") int elapsedDay);
}
