package com.mallo.backend.domain.record.entity;

import com.mallo.backend.global.entity.BaseTimeEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 선택적으로 첨부하는 사진과 그 비의료적 관찰 결과(redness/dryness 등)만 담는다.
 * normal/side_effect/risk_score 같은 의료 판단 필드는 절대 추가하지 않는다 (MVP 문서 10번 규칙).
 */
@Entity
@Table(name = "photo_record")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PhotoRecord extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	// RecoverySession은 다른 도메인 소유라 FK 대신 값으로만 보관. length=36은 UUID 문자열 길이
	@Column(name = "session_id", nullable = false, length = 36)
	private String sessionId;

	// 원본 이미지 저장소 key(S3 등). 보관 정책 미확정이라 nullable로 시작
	@Column(name = "storage_key")
	private String storageKey;

	// { "redness": "LOW", "dryness": "MEDIUM" } 형태의 비의료적 관찰 결과 JSON 문자열
	@Column(name = "observation_json", columnDefinition = "TEXT")
	private String observationJson;

	// 기록 하나에 사진 여러 장(RecoveryRecord.MAX_PHOTOS)이 붙을 수 있어 FK는 이쪽(N)이 갖는다.
	// 사진은 기록보다 먼저(POST /photos) 만들어지므로 업로드 시점엔 null이고, 기록 생성/수정 때 연결된다.
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "recovery_record_id")
	private RecoveryRecord recoveryRecord;

	@Builder
	private PhotoRecord(String sessionId, String storageKey, String observationJson) {
		this.sessionId = sessionId;
		this.storageKey = storageKey;
		this.observationJson = observationJson;
	}

	void attachToRecord(RecoveryRecord recoveryRecord) {
		this.recoveryRecord = recoveryRecord;
	}
}
