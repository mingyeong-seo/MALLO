package com.mallo.backend.domain.notification.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;

import com.mallo.backend.domain.notification.entity.Notification;
import com.mallo.backend.domain.notification.entity.NotificationStatus;
import com.mallo.backend.domain.notification.entity.NotificationType;
import com.mallo.backend.global.config.JpaAuditingConfig;

@DataJpaTest
@Import(JpaAuditingConfig.class)
class NotificationRepositoryTest {

	private static final String SESSION_ID = "11111111-1111-1111-1111-111111111111";

	@Autowired
	private NotificationRepository notificationRepository;

	private Notification notification(String sessionId, LocalDateTime scheduledAt) {
		return Notification.builder()
				.sessionId(sessionId)
				.type(NotificationType.PHOTO_ANALYSIS_READY)
				.title("제목")
				.body("본문")
				.referenceId("1")
				.scheduledAt(scheduledAt)
				.build();
	}

	@Test
	void 세션의_알림을_예약시각_내림차순으로_조회한다() {
		LocalDateTime now = LocalDateTime.now();
		notificationRepository.save(notification(SESSION_ID, now.minusDays(2)));
		notificationRepository.save(notification(SESSION_ID, now));
		notificationRepository.save(notification(SESSION_ID, now.minusDays(1)));
		notificationRepository.save(notification("22222222-2222-2222-2222-222222222222", now));

		List<Notification> inbox = notificationRepository.findBySessionIdOrderByScheduledAtDesc(SESSION_ID);

		assertThat(inbox).hasSize(3);
		assertThat(inbox).extracting(Notification::getScheduledAt)
				.isSortedAccordingTo((a, b) -> b.compareTo(a));
	}

	@Test
	void 발송_대상을_상태와_예약시각으로_조회한다() {
		LocalDateTime now = LocalDateTime.now();
		Notification due = notification(SESSION_ID, now.minusMinutes(1));
		Notification notYetDue = notification(SESSION_ID, now.plusDays(1));
		Notification alreadySent = notification(SESSION_ID, now.minusMinutes(1));
		alreadySent.markSent();
		notificationRepository.save(due);
		notificationRepository.save(notYetDue);
		notificationRepository.save(alreadySent);

		List<Notification> targets = notificationRepository
				.findByStatusAndScheduledAtLessThanEqual(NotificationStatus.SCHEDULED, now);

		assertThat(targets).hasSize(1);
		assertThat(targets.get(0).getId()).isEqualTo(due.getId());
	}
}
