package com.mallo.backend.domain.journey.entity;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 병원이 검수한 Recovery Protocol 규칙 하나. 매칭은 procedure+action+dayStart~dayEnd로
 * 먼저 DB에서 후보를 좁히고, conditions(JSON)는 애플리케이션에서 소수 후보만 비교한다.
 * seed 데이터로 관리되며 사용자 요청으로 생성되지 않는다.
 */
@Entity
@Table(name = "protocol", indexes = {
		@Index(name = "idx_protocol_matching", columnList = "procedure_name, action, day_start")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Protocol {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	// "procedure"는 MySQL 예약어라서 컬럼명은 procedure_name으로 회피 (SessionInfo와 동일 컨벤션)
	@Column(name = "procedure_name", nullable = false)
	private String procedure;

	@Column(nullable = false)
	private int dayStart;

	// null이면 dayStart 이후 계속 적용
	private Integer dayEnd;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private ActionType action;

	// 매칭에 필요한 추가 조건 (예: {"intensity":"HIGH","sweating":true}). 없으면 이 DAY/action엔 조건 없이 항상 매칭.
	@Column(columnDefinition = "TEXT")
	private String conditions;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private DecisionType decision;

	@Column(columnDefinition = "TEXT", nullable = false)
	private String guidance;

	// CTA 구조 (예: {"type":"VIEW_ALTERNATIVE","label":"저강도 대안 보기"}). 없을 수 있음.
	@Column(columnDefinition = "TEXT")
	private String nextAction;

	// 예: "rejuran-v1"
	@Column(nullable = false)
	private String version;

	@Builder
	private Protocol(String procedure, int dayStart, Integer dayEnd, ActionType action, String conditions,
			DecisionType decision, String guidance, String nextAction, String version) {
		this.procedure = procedure;
		this.dayStart = dayStart;
		this.dayEnd = dayEnd;
		this.action = action;
		this.conditions = conditions;
		this.decision = decision;
		this.guidance = guidance;
		this.nextAction = nextAction;
		this.version = version;
	}

	public boolean covers(int elapsedDay) {
		return dayStart <= elapsedDay && (dayEnd == null || elapsedDay <= dayEnd);
	}
}
