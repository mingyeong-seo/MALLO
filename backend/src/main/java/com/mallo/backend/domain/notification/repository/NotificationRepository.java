package com.mallo.backend.domain.notification.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mallo.backend.domain.notification.entity.Notification;
import com.mallo.backend.domain.notification.entity.NotificationStatus;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

	// 인박스 목록 조회용
	List<Notification> findBySessionIdOrderByScheduledAtDesc(String sessionId);

	// 알림 발송 워커가 처리 대상을 찾을 때 사용
	List<Notification> findByStatusAndScheduledAtLessThanEqual(NotificationStatus status, LocalDateTime time);
}
