package com.mallo.backend.domain.notification.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mallo.backend.domain.notification.dto.NotificationPreferenceResponse;
import com.mallo.backend.domain.notification.dto.NotificationPreferenceUpdateRequest;
import com.mallo.backend.domain.notification.dto.NotificationResponse;
import com.mallo.backend.domain.notification.entity.Notification;
import com.mallo.backend.domain.notification.entity.NotificationPreference;
import com.mallo.backend.domain.notification.entity.NotificationStatus;
import com.mallo.backend.domain.notification.entity.NotificationType;
import com.mallo.backend.domain.notification.exception.NotificationErrorCode;
import com.mallo.backend.domain.notification.repository.NotificationPreferenceRepository;
import com.mallo.backend.domain.notification.repository.NotificationRepository;
import com.mallo.backend.global.exception.CustomException;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

	private static final String SESSION_ID = "11111111-1111-1111-1111-111111111111";
	private static final String OTHER_SESSION_ID = "22222222-2222-2222-2222-222222222222";

	@Mock
	private NotificationRepository notificationRepository;

	@Mock
	private NotificationPreferenceRepository notificationPreferenceRepository;

	@Mock
	private NotificationSender notificationSender;

	@InjectMocks
	private NotificationService notificationService;

	private Notification notification(String sessionId) {
		return Notification.builder()
				.sessionId(sessionId)
				.type(NotificationType.PHOTO_ANALYSIS_READY)
				.title("사진 분석이 끝났어요")
				.body("업로드한 사진의 관찰 결과를 확인해보세요.")
				.referenceId("1")
				.scheduledAt(LocalDateTime.now())
				.build();
	}

	@Test
	void 세션의_알림_목록을_예약시각_내림차순으로_조회한다() {
		given(notificationRepository.findBySessionIdOrderByScheduledAtDesc(SESSION_ID))
				.willReturn(List.of(notification(SESSION_ID)));

		List<NotificationResponse> inbox = notificationService.getInbox(SESSION_ID);

		assertThat(inbox).hasSize(1);
		assertThat(inbox.get(0).sessionId()).isEqualTo(SESSION_ID);
		assertThat(inbox.get(0).type()).isEqualTo(NotificationType.PHOTO_ANALYSIS_READY);
	}

	@Test
	void 알림을_읽음_처리한다() {
		Notification notification = notification(SESSION_ID);
		given(notificationRepository.findById(1L)).willReturn(Optional.of(notification));

		NotificationResponse response = notificationService.markRead(SESSION_ID, 1L);

		assertThat(response.read()).isTrue();
	}

	@Test
	void 존재하지_않는_알림이면_예외가_발생한다() {
		given(notificationRepository.findById(999L)).willReturn(Optional.empty());

		assertThatThrownBy(() -> notificationService.markRead(SESSION_ID, 999L))
				.isInstanceOf(CustomException.class)
				.extracting(e -> ((CustomException) e).getErrorCode())
				.isEqualTo(NotificationErrorCode.NOTIFICATION_NOT_FOUND);
	}

	@Test
	void 다른_세션의_알림을_읽음_처리하려면_예외가_발생한다() {
		given(notificationRepository.findById(1L)).willReturn(Optional.of(notification(OTHER_SESSION_ID)));

		assertThatThrownBy(() -> notificationService.markRead(SESSION_ID, 1L))
				.isInstanceOf(CustomException.class)
				.extracting(e -> ((CustomException) e).getErrorCode())
				.isEqualTo(NotificationErrorCode.NOTIFICATION_SESSION_MISMATCH);
	}

	@Test
	void 알림_설정이_켜져있고_토큰이_있으면_실제_발송을_시도하고_성공하면_SENT로_남는다() {
		NotificationPreference preference = NotificationPreference.builder()
				.sessionId(SESSION_ID).enabled(true).fcmToken("fcm-token-abc").build();
		given(notificationPreferenceRepository.findById(SESSION_ID)).willReturn(Optional.of(preference));
		given(notificationSender.send(eq("fcm-token-abc"), any(), any(), any())).willReturn(true);

		notificationService.createPhotoAnalysisReady(SESSION_ID, 42L);

		verify(notificationSender).send(eq("fcm-token-abc"), any(), any(), any());
		verify(notificationRepository).save(argThat(n ->
				n.getReferenceId().equals("42") && n.getStatus() == NotificationStatus.SENT));
	}

	@Test
	void 알림_설정이_꺼져있으면_발송을_시도하지_않고_FAILED로_남는다() {
		NotificationPreference preference = NotificationPreference.builder()
				.sessionId(SESSION_ID).enabled(false).fcmToken("fcm-token-abc").build();
		given(notificationPreferenceRepository.findById(SESSION_ID)).willReturn(Optional.of(preference));

		notificationService.createPhotoAnalysisReady(SESSION_ID, 42L);

		verify(notificationSender, never()).send(any(), any(), any(), any());
		verify(notificationRepository).save(argThat(n -> n.getStatus() == NotificationStatus.FAILED));
	}

	@Test
	void 알림_설정_자체가_없으면_발송을_시도하지_않고_FAILED로_남는다() {
		given(notificationPreferenceRepository.findById(SESSION_ID)).willReturn(Optional.empty());

		notificationService.createPhotoAnalysisReady(SESSION_ID, 42L);

		verify(notificationSender, never()).send(any(), any(), any(), any());
		verify(notificationRepository).save(argThat(n -> n.getStatus() == NotificationStatus.FAILED));
	}

	@Test
	void FCM_발송이_실패하면_FAILED로_남는다() {
		NotificationPreference preference = NotificationPreference.builder()
				.sessionId(SESSION_ID).enabled(true).fcmToken("fcm-token-abc").build();
		given(notificationPreferenceRepository.findById(SESSION_ID)).willReturn(Optional.of(preference));
		given(notificationSender.send(any(), any(), any(), any())).willReturn(false);

		notificationService.createPhotoAnalysisReady(SESSION_ID, 42L);

		verify(notificationRepository).save(argThat(n -> n.getStatus() == NotificationStatus.FAILED));
	}

	@Test
	void DAILY_ACTION_REMINDER는_referenceId_없이_발송된다() {
		NotificationPreference preference = NotificationPreference.builder()
				.sessionId(SESSION_ID).enabled(true).fcmToken("fcm-token-abc").build();
		given(notificationPreferenceRepository.findById(SESSION_ID)).willReturn(Optional.of(preference));
		given(notificationSender.send(eq("fcm-token-abc"), any(), any(), any())).willReturn(true);

		// referenceId가 null인 알림도 Map.of()의 NPE 없이 정상 발송돼야 한다 (dataPayload 방어 로직 검증)
		notificationService.createDailyActionReminder(SESSION_ID);

		verify(notificationSender).send(eq("fcm-token-abc"), any(), any(),
				argThat(data -> data.get("type").equals("DAILY_ACTION_REMINDER") && !data.containsKey("referenceId")));
		verify(notificationRepository).save(argThat(n ->
				n.getType() == NotificationType.DAILY_ACTION_REMINDER
						&& n.getReferenceId() == null
						&& n.getStatus() == NotificationStatus.SENT));
	}

	@Test
	void HANDOFF_REPLY는_handoffId를_referenceId로_저장한다() {
		given(notificationPreferenceRepository.findById(SESSION_ID)).willReturn(Optional.empty());

		notificationService.createHandoffReply(SESSION_ID, 7L);

		verify(notificationRepository).save(argThat(n ->
				n.getType() == NotificationType.HANDOFF_REPLY
						&& n.getReferenceId().equals("7")
						&& n.getSessionId().equals(SESSION_ID)));
	}

	@Test
	void 알림_설정이_없으면_기본값으로_생성해서_반환한다() {
		given(notificationPreferenceRepository.findById(SESSION_ID)).willReturn(Optional.empty());
		given(notificationPreferenceRepository.save(any())).willAnswer(invocation -> invocation.getArgument(0));

		NotificationPreferenceResponse response = notificationService.getPreference(SESSION_ID);

		assertThat(response.sessionId()).isEqualTo(SESSION_ID);
		assertThat(response.enabled()).isFalse();
		assertThat(response.hasFcmToken()).isFalse();
	}

	@Test
	void 알림_설정을_수정한다() {
		NotificationPreference preference = NotificationPreference.builder()
				.sessionId(SESSION_ID)
				.enabled(false)
				.fcmToken(null)
				.build();
		given(notificationPreferenceRepository.findById(SESSION_ID)).willReturn(Optional.of(preference));

		NotificationPreferenceResponse response = notificationService.updatePreference(
				SESSION_ID, new NotificationPreferenceUpdateRequest(true, "fcm-token-abc"));

		assertThat(response.enabled()).isTrue();
		assertThat(response.hasFcmToken()).isTrue();
		verify(notificationPreferenceRepository, never()).save(any());
	}
}
