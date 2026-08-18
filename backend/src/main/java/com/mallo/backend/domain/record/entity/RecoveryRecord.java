package com.mallo.backend.domain.record.entity;

import java.util.ArrayList;
import java.util.List;

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
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
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

	// 기록 하나에 붙일 수 있는 사진 최대 장수 (와이어프레임 기준 확정, docs/S09_S10_PHOTO_QA_REPLY.md 참고)
	public static final int MAX_PHOTOS = 5;

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

	// FK(recovery_record_id)는 PhotoRecord 쪽이 갖는다 — 여긴 조회 전용(inverse side)
	@OneToMany(mappedBy = "recoveryRecord", fetch = FetchType.LAZY)
	@OrderBy("id asc")
	private List<PhotoRecord> photoRecords = new ArrayList<>();

	@Builder
	private RecoveryRecord(String sessionId, Integer elapsedDay, String action,
			PerformedStatus performedStatus, String memo) {
		this.sessionId = sessionId;
		this.elapsedDay = elapsedDay;
		this.action = action;
		this.performedStatus = performedStatus;
		this.memo = memo;
	}

	/** 기존에 붙어있던 사진은 전부 떼고(recoveryRecord=null), 새로 넘어온 목록으로 통째로 교체한다. */
	public void attachPhotos(List<PhotoRecord> photos) {
		for (PhotoRecord existing : new ArrayList<>(photoRecords)) {
			existing.attachToRecord(null);
		}
		photoRecords.clear();

		for (PhotoRecord photo : photos) {
			photo.attachToRecord(this);
		}
		photoRecords.addAll(photos);
	}

	public void updateMemo(String memo) {
		this.memo = memo;
	}
}
