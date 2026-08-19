package com.mallo.backend.domain.notification.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

/**
 * S02 온보딩 "알림 수신 동의" / MY 페이지 "알림 설정" 토글이 호출하는 부분 수정 요청.
 * 값을 안 보낸 필드(null)는 기존 값 유지.
 */
public record NotificationPreferenceUpdateRequest(

		@Schema(description = "알림 수신 동의 여부. 안 보내면(null) 기존 값 유지")
		Boolean enabled,

		@Schema(description = "네이티브 FCM 등록 토큰. Expo의 getDevicePushTokenAsync() 결과여야 함 — "
				+ "getExpoPushTokenAsync()가 주는 ExponentPushToken[...] 형식은 FCM에 직접 못 보내서 여기 넣으면 안 됨. "
				+ "안 보내면(null) 기존 값 유지")
		@Size(max = 512)
		String fcmToken
) {
}
