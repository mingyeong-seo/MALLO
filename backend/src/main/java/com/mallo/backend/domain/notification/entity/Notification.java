package com.mallo.backend.domain.notification.entity;

import java.time.LocalDateTime;

import com.mallo.backend.global.entity.BaseTimeEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 알림 스케줄 + 발송 이력 + 앱 내 인박스 표시 상태를 한 테이블에서 관리한다.
 * (스케줄링 시점과 실제 발송 시점, 읽음 여부가 한 행의 상태 전이로 표현되므로 굳이 테이블을 쪼개지 않음)
 */
@Entity
@Table(name = "notification", indexes = {
		// 인박스 목록 조회(session_id로 필터 후 scheduled_at 내림차순)
		@Index(name = "idx_notification_session_scheduled", columnList = "session_id, scheduled_at"),
		// 발송 워커가 status=SCHEDULED AND scheduled_at <= now 로 폴링하는 쿼리 전용
		@Index(name = "idx_notification_status_scheduled", columnList = "status, scheduled_at")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Notification extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	// RecoverySession은 다른 도메인 소유라 FK 대신 값으로만 보관. length=36은 UUID 문자열 길이
	@Column(name = "session_id", nullable = false, length = 36)
	private String sessionId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private NotificationType type;

	@Column(nullable = false)
	private String title;

	@Column(nullable = false, length = 1000)
	private String body;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private NotificationStatus status;

	// type이 HANDOFF_REPLY/PHOTO_ANALYSIS_READY일 때 탭하면 이동할 대상 id (handoffId, photoRecordId 등).
	// 다른 도메인 것도 있어서 FK는 안 걸고 값만 보관 (session_id와 같은 패턴)
	@Column(name = "reference_id", length = 36)
	private String referenceId;

	@Column(name = "scheduled_at", nullable = false)
	private LocalDateTime scheduledAt;

	@Column(name = "sent_at")
	private LocalDateTime sentAt;

	@Column(name = "is_read", nullable = false)
	private boolean read;

	@Column(name = "read_at")
	private LocalDateTime readAt;

	@Builder
	private Notification(String sessionId, NotificationType type, String title, String body,
			String referenceId, LocalDateTime scheduledAt) {
		this.sessionId = sessionId;
		this.type = type;
		this.title = title;
		this.body = body;
		this.referenceId = referenceId;
		this.scheduledAt = scheduledAt;
		this.status = NotificationStatus.SCHEDULED;
		this.read = false;
	}

	public void markSent() {
		this.status = NotificationStatus.SENT;
		this.sentAt = LocalDateTime.now();
	}

	public void markFailed() {
		this.status = NotificationStatus.FAILED;
	}

	public void cancel() {
		this.status = NotificationStatus.CANCELLED;
	}

	public void markRead() {
		this.read = true;
		this.readAt = LocalDateTime.now();
	}
}
