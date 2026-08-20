package com.mallo.backend.domain.notification.scheduler;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.mallo.backend.domain.notification.service.NotificationService;
import com.mallo.backend.domain.sessionInfo.entity.SessionInfo;
import com.mallo.backend.domain.sessionInfo.entity.SessionStatus;
import com.mallo.backend.domain.sessionInfo.repository.SessionInfoRepository;

@ExtendWith(MockitoExtension.class)
class DailyActionReminderSchedulerTest {

	@Mock
	private SessionInfoRepository sessionInfoRepository;

	@Mock
	private NotificationService notificationService;

	@InjectMocks
	private DailyActionReminderScheduler scheduler;

	private SessionInfo sessionWithId(String id) {
		SessionInfo session = SessionInfo.builder()
				.procedure("REJURAN")
				.procedureAt(LocalDate.now().minusDays(1))
				.build();
		ReflectionTestUtils.setField(session, "id", java.util.UUID.fromString(id));
		return session;
	}

	@Test
	void ACTIVE_세션마다_리마인더를_한_번씩_보낸다() {
		SessionInfo session1 = sessionWithId("11111111-1111-1111-1111-111111111111");
		SessionInfo session2 = sessionWithId("22222222-2222-2222-2222-222222222222");
		given(sessionInfoRepository.findByStatus(SessionStatus.ACTIVE)).willReturn(List.of(session1, session2));

		scheduler.remindActiveSessions();

		verify(notificationService).createDailyActionReminder("11111111-1111-1111-1111-111111111111");
		verify(notificationService).createDailyActionReminder("22222222-2222-2222-2222-222222222222");
		verify(notificationService, times(2)).createDailyActionReminder(any());
	}

	@Test
	void ACTIVE_세션이_없으면_아무것도_안_보낸다() {
		given(sessionInfoRepository.findByStatus(SessionStatus.ACTIVE)).willReturn(List.of());

		scheduler.remindActiveSessions();

		verify(notificationService, never()).createDailyActionReminder(any());
	}

	@Test
	void COMPLETED_세션은_조회_대상이_아니다() {
		given(sessionInfoRepository.findByStatus(SessionStatus.ACTIVE)).willReturn(List.of());

		scheduler.remindActiveSessions();

		verify(sessionInfoRepository).findByStatus(eq(SessionStatus.ACTIVE));
		verify(sessionInfoRepository, never()).findByStatus(eq(SessionStatus.COMPLETED));
	}
}
