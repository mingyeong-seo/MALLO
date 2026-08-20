package com.mallo.backend.domain.journey.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Quick Check 한 번의 요청/결과 기록 (DB 스키마 초안의 action_check에 해당).
 * "여정 자체"는 sessionInfo가 담당하고, 여기서는 그 여정 안에서 일어난 한 번의 행동 확인을 나타낸다.
 *
 * session_id는 sessionInfo 도메인 엔티티로 FK를 걸지 않고 값만 저장한다.
 * (PR #12 Record/Photo 도메인과 동일한 컨벤션 — 도메인 간 직접 JPA 연관관계를 안 만든다)
 */
@Entity
@Table(name = "journey")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Journey {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false)
	private UUID sessionId;

	// 달력 날짜가 아니라 세션의 elapsed_day 기준 "오늘". 저장 시점에 스냅샷으로 고정.
	@Column(nullable = false)
	private int elapsedDay;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private ActionType action;

	// S07에서 선택한 조건들 (예: {"intensity":"HIGH"}). 우선 JSON 텍스트 그대로 저장.
	@Column(columnDefinition = "TEXT")
	private String context;

	// 매칭된 Protocol이 없으면(NO_PROTOCOL) null
	@Enumerated(EnumType.STRING)
	private DecisionType decision;

	// 판단 근거로 쓰인 Protocol 참조. NO_PROTOCOL이면 null
	private String protocolRef;

	// 매칭된 Protocol.guidance를 저장 시점에 스냅샷으로 고정한 값 (elapsedDay와 동일한 이유 —
	// 나중에 Protocol 내용이 바뀌어도 그때 사용자에게 실제로 보여준 안내는 그대로 남아야 한다).
	@Column(columnDefinition = "TEXT")
	private String guidance;

	// 매칭된 Protocol.nextAction 스냅샷. 없을 수 있음.
	@Column(columnDefinition = "TEXT")
	private String nextAction;

	@CreationTimestamp
	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Builder
	private Journey(UUID sessionId, int elapsedDay, ActionType action, String context,
			DecisionType decision, String protocolRef, String guidance, String nextAction) {
		this.sessionId = sessionId;
		this.elapsedDay = elapsedDay;
		this.action = action;
		this.context = context;
		this.decision = decision;
		this.protocolRef = protocolRef;
		this.guidance = guidance;
		this.nextAction = nextAction;
	}

	/** decision/protocolRef가 둘 다 null이면 매칭된 Protocol이 없었다는 뜻 (NO_PROTOCOL). */
	public QuickCheckStatus getStatus() {
		return protocolRef == null ? QuickCheckStatus.NO_PROTOCOL : QuickCheckStatus.MATCHED;
	}
}
