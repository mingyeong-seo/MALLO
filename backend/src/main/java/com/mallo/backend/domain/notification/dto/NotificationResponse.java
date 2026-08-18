package com.mallo.backend.domain.notification.dto;

import java.time.LocalDateTime;

import com.mallo.backend.domain.notification.entity.Notification;
import com.mallo.backend.domain.notification.entity.NotificationStatus;
import com.mallo.backend.domain.notification.entity.NotificationType;

import io.swagger.v3.oas.annotations.media.Schema;

public record NotificationResponse(
		@Schema(description = "알림 id") Long id,
		@Schema(description = "세션 id") String sessionId,
		@Schema(description = "알림 종류") NotificationType type,
		@Schema(description = "제목") String title,
		@Schema(description = "본문") String body,
		@Schema(description = "탭했을 때 이동할 대상 id. type에 따라 의미가 다름 (예: PHOTO_ANALYSIS_READY면 recordId — 사진이 아니라 그 사진이 붙은 기록)")
		String referenceId,
		@Schema(description = "발송 상태. SENT=실제로 FCM 발송 성공, FAILED=알림 설정 꺼짐/토큰 없음/FCM 에러 등으로 미발송 "
				+ "(인박스에는 SENT/FAILED 둘 다 그대로 보임 — 앱 내 알림함은 푸시 발송 여부와 무관하게 항상 표시)")
		NotificationStatus status,
		@Schema(description = "읽음 여부") boolean read,
		@Schema(description = "예약/생성 시각") LocalDateTime scheduledAt,
		@Schema(description = "실제 FCM 발송 성공 시각, 미발송이면 null") LocalDateTime sentAt,
		@Schema(description = "읽은 시각, 안 읽었으면 null") LocalDateTime readAt
) {

	public static NotificationResponse of(Notification notification) {
		return new NotificationResponse(
				notification.getId(),
				notification.getSessionId(),
				notification.getType(),
				notification.getTitle(),
				notification.getBody(),
				notification.getReferenceId(),
				notification.getStatus(),
				notification.isRead(),
				notification.getScheduledAt(),
				notification.getSentAt(),
				notification.getReadAt()
		);
	}
}
