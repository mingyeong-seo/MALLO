package com.mallo.backend.domain.notification.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;

@ExtendWith(MockitoExtension.class)
class FirebaseNotificationSenderTest {

	@Mock
	private ObjectProvider<FirebaseMessaging> firebaseMessagingProvider;

	@Mock
	private FirebaseMessaging firebaseMessaging;

	@Test
	void FCM이_설정_안_되어_있으면_false를_반환한다() {
		given(firebaseMessagingProvider.getIfAvailable()).willReturn(null);
		FirebaseNotificationSender sender = new FirebaseNotificationSender(firebaseMessagingProvider);

		boolean result = sender.send("token", "제목", "본문", Map.of());

		assertThat(result).isFalse();
	}

	@Test
	void fcmToken이_없으면_false를_반환한다() {
		FirebaseNotificationSender sender = new FirebaseNotificationSender(firebaseMessagingProvider);

		boolean result = sender.send(null, "제목", "본문", Map.of());

		assertThat(result).isFalse();
	}

	@Test
	void 발송에_성공하면_true를_반환한다() throws FirebaseMessagingException {
		given(firebaseMessagingProvider.getIfAvailable()).willReturn(firebaseMessaging);
		given(firebaseMessaging.send(org.mockito.ArgumentMatchers.any(Message.class))).willReturn("message-id");
		FirebaseNotificationSender sender = new FirebaseNotificationSender(firebaseMessagingProvider);

		boolean result = sender.send("token", "제목", "본문", Map.of("type", "PHOTO_ANALYSIS_READY"));

		assertThat(result).isTrue();
	}

	@Test
	void FCM_호출이_예외를_던지면_false를_반환한다() throws FirebaseMessagingException {
		given(firebaseMessagingProvider.getIfAvailable()).willReturn(firebaseMessaging);
		given(firebaseMessaging.send(org.mockito.ArgumentMatchers.any(Message.class)))
				.willThrow(org.mockito.Mockito.mock(FirebaseMessagingException.class));
		FirebaseNotificationSender sender = new FirebaseNotificationSender(firebaseMessagingProvider);

		boolean result = sender.send("token", "제목", "본문", Map.of());

		assertThat(result).isFalse();
	}
}
