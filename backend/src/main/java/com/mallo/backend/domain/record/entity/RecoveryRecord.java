package com.mallo.backend.domain.record.entity;

import com.mallo.backend.global.entity.BaseTimeEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * S09 Recovery Record: S08에서 확인한 행동을 실제로 수행했는지 DAY 단위로 남기는 선택적 기록.
 */
@Entity
@Table(name = "recovery_record", indexes = {
		// Journal 화면(세션의 DAY별 기록 조회)이 커버링에 가깝게 타도록 session_id + elapsed_day 복합 인덱스
		@Index(name = "idx_recovery_record_session_day", columnList = "session_id, elapsed_day")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RecoveryRecord extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	// RecoverySession은 다른 도메인 소유라 FK 대신 값으로만 보관.
	// length=36은 UUID 문자열 길이 (세션 ID 포맷 확정, docs 참고)
	@Column(name = "session_id", nullable = false, length = 36)
	private String sessionId;

	@Column(name = "elapsed_day", nullable = false)
	private Integer elapsedDay;

	// Quick Check/Action Result에서 선택된 행동 코드. action enum이 아직 확정 전이라 문자열로 보관
	@Column(nullable = false)
	private String action;

	@Enumerated(EnumType.STRING)
	@Column(name = "performed_status", nullable = false)
	private PerformedStatus performedStatus;

	@Column(length = 1000)
	private String memo;

	@OneToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "photo_record_id")
	private PhotoRecord photoRecord;

	@Builder
	private RecoveryRecord(String sessionId, Integer elapsedDay, String action,
			PerformedStatus performedStatus, String memo, PhotoRecord photoRecord) {
		this.sessionId = sessionId;
		this.elapsedDay = elapsedDay;
		this.action = action;
		this.performedStatus = performedStatus;
		this.memo = memo;
		this.photoRecord = photoRecord;
	}

	public void attachPhoto(PhotoRecord photoRecord) {
		this.photoRecord = photoRecord;
	}

	public void updateMemo(String memo) {
		this.memo = memo;
	}
}
