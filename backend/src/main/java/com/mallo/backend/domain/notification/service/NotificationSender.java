package com.mallo.backend.domain.notification.service;

import java.util.Map;

/**
 * 실제 푸시 발송 어댑터. 지금은 Firebase(FCM) 구현체({@link FirebaseNotificationSender})뿐이고,
 * FCM 서비스 계정 키가 없으면 그 구현체 안에서 발송을 건너뛰고 false만 반환한다
 * (PhotoObservationAdapter/PhotoStorageAdapter와 동일한 "설정 없으면 조용히 비활성화" 패턴).
 */
public interface NotificationSender {

	/**
	 * @return 실제로 FCM에 전달 성공했으면 true, 그 외(토큰 없음/설정 없음/FCM 에러)는 false
	 */
	boolean send(String fcmToken, String title, String body, Map<String, String> data);
}
