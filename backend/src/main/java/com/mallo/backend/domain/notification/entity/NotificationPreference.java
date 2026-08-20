package com.mallo.backend.domain.notification.entity;

import com.mallo.backend.global.entity.BaseTimeEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * S02 온보딩의 "선택: 알림 수신 동의"와 MY 페이지 "알림 설정" 토글이 갱신하는 값.
 * 계정 개념이 아직 없어서 세션당 1행으로 관리한다.
 *
 * 세션당 정확히 1행(1:1)이라 surrogate id 대신 session_id를 그대로 PK로 쓴다.
 * 조회가 항상 session_id 기준이라, 이렇게 하면 세컨더리 인덱스를 하나 안 만들어도 되고
 * (유니크 인덱스로 조회 → PK로 재조회 하던 한 단계가 사라지고) 클러스터드 인덱스로 바로 조회된다.
 */
@Entity
@Table(name = "notification_preference")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NotificationPreference extends BaseTimeEntity {

	@Id
	@Column(name = "session_id", length = 36)
	private String sessionId;

	@Column(nullable = false)
	private boolean enabled;

	// FCM 등록 토큰. 알림 동의는 했지만 아직 디바이스 토큰을 못 받은 상태(권한 요청 전 등)가 있을 수 있어 nullable.
	// 인덱스/조회 조건으로 안 쓰여서 길이는 넉넉하게(FCM 토큰 길이가 고정 규격이 아님)
	@Column(name = "fcm_token", length = 512)
	private String fcmToken;

	@Builder
	private NotificationPreference(String sessionId, boolean enabled, String fcmToken) {
		this.sessionId = sessionId;
		this.enabled = enabled;
		this.fcmToken = fcmToken;
	}

	public void updateEnabled(boolean enabled) {
		this.enabled = enabled;
	}

	public void updateFcmToken(String fcmToken) {
		this.fcmToken = fcmToken;
	}
}
