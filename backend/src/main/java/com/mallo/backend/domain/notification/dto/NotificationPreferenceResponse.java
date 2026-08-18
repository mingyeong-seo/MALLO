package com.mallo.backend.domain.notification.dto;

import com.mallo.backend.domain.notification.entity.NotificationPreference;

import io.swagger.v3.oas.annotations.media.Schema;

public record NotificationPreferenceResponse(
		@Schema(description = "세션 id") String sessionId,
		@Schema(description = "알림 수신 동의 여부") boolean enabled,
		@Schema(description = "FCM 디바이스 토큰 등록 여부 (토큰 원문은 응답에 안 실음)") boolean hasFcmToken
) {

	public static NotificationPreferenceResponse of(NotificationPreference preference) {
		return new NotificationPreferenceResponse(
				preference.getSessionId(),
				preference.isEnabled(),
				preference.getFcmToken() != null
		);
	}
}
