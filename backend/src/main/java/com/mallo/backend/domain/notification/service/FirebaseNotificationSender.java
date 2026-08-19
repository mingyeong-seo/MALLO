package com.mallo.backend.domain.notification.service;

import java.util.Map;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * FCM 실제 발송 구현체.
 * {@link com.mallo.backend.global.config.FirebaseConfig}가 FCM_CREDENTIALS_PATH 미설정 시
 * FirebaseMessaging 빈을 아예 등록하지 않으므로, ObjectProvider로 안전하게 "있으면 쓰고 없으면 스킵"한다.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class FirebaseNotificationSender implements NotificationSender {

	private final ObjectProvider<FirebaseMessaging> firebaseMessagingProvider;

	@Override
	public boolean send(String fcmToken, String title, String body, Map<String, String> data) {
		if (fcmToken == null) {
			return false;
		}

		FirebaseMessaging firebaseMessaging = firebaseMessagingProvider.getIfAvailable();
		if (firebaseMessaging == null) {
			log.warn("FCM이 설정되지 않아 발송을 건너뜁니다 (fcm.credentials-path 확인)");
			return false;
		}

		Message message = Message.builder()
				.setToken(fcmToken)
				.setNotification(com.google.firebase.messaging.Notification.builder()
						.setTitle(title)
						.setBody(body)
						.build())
				.putAllData(data)
				.build();

		try {
			firebaseMessaging.send(message);
			return true;
		} catch (FirebaseMessagingException e) {
			log.warn("FCM 발송 실패: {}", e.getMessage());
			return false;
		}
	}
}
