package com.mallo.backend.domain.record.entity;

import java.util.UUID;

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
 * RecoveryRecord 하나에 담기는 행동 확인 1건 (근거가 된 Quick Check + 실제로 했는지 여부).
 * 독립된 식별자/생명주기가 없는 값 객체라 별도 엔티티/리포지토리 없이
 * RecoveryRecord에 종속된 컬렉션(@ElementCollection)으로만 존재한다.
 *
 * action 값 자체(운동/화장/세안/스킨케어/열자극 등)는 Journey 도메인의 Quick Check가 갖고 있고,
 * 여기선 어떤 Quick Check를 근거로 이 행동을 기록했는지만 checkId(UUID)로 참조한다
 * (record는 journey의 action enum을 직접 알 필요가 없음 — CheckQueryPort로 존재/소유만 검증).
 */
@Embeddable
@Getter
@EqualsAndHashCode
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RecordAction {

	@Column(name = "check_id", nullable = false)
	private UUID checkId;

	@Enumerated(EnumType.STRING)
	@Column(name = "performed_status", nullable = false)
	private PerformedStatus performedStatus;

	@Builder
	private RecordAction(UUID checkId, PerformedStatus performedStatus) {
		this.checkId = checkId;
		this.performedStatus = performedStatus;
	}
}
