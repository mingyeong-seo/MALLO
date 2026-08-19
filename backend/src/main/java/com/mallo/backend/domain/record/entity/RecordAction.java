package com.mallo.backend.domain.record.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * RecoveryRecord 하나에 담기는 행동 확인 1건 (행동 코드 + 실제로 했는지 여부).
 * 독립된 식별자/생명주기가 없는 값 객체라 별도 엔티티/리포지토리 없이
 * RecoveryRecord에 종속된 컬렉션(@ElementCollection)으로만 존재한다.
 */
@Embeddable
@Getter
@EqualsAndHashCode
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RecordAction {

	// Quick Check/Action Result에서 선택된 행동 코드. action enum이 아직 확정 전이라 문자열로 보관
	@Column(nullable = false)
	private String action;

	@Enumerated(EnumType.STRING)
	@Column(name = "performed_status", nullable = false)
	private PerformedStatus performedStatus;

	@Builder
	private RecordAction(String action, PerformedStatus performedStatus) {
		this.action = action;
		this.performedStatus = performedStatus;
	}
}
