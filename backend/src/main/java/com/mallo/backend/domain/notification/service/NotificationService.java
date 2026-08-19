package com.mallo.backend.domain.notification.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mallo.backend.domain.notification.dto.NotificationPreferenceResponse;
import com.mallo.backend.domain.notification.dto.NotificationPreferenceUpdateRequest;
import com.mallo.backend.domain.notification.dto.NotificationResponse;
import com.mallo.backend.domain.notification.entity.Notification;
import com.mallo.backend.domain.notification.entity.NotificationPreference;
import com.mallo.backend.domain.notification.entity.NotificationType;
import com.mallo.backend.domain.notification.exception.NotificationErrorCode;
import com.mallo.backend.domain.notification.repository.NotificationPreferenceRepository;
import com.mallo.backend.domain.notification.repository.NotificationRepository;
import com.mallo.backend.global.exception.CustomException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

	private final NotificationRepository notificationRepository;
	private final NotificationPreferenceRepository notificationPreferenceRepository;
	private final NotificationSender notificationSender;

	public List<NotificationResponse> getInbox(String sessionId) {
		return notificationRepository.findBySessionIdOrderByScheduledAtDesc(sessionId).stream()
				.map(NotificationResponse::of)
				.toList();
	}

	@Transactional
	public NotificationResponse markRead(String sessionId, Long notificationId) {
		Notification notification = notificationRepository.findById(notificationId)
				.orElseThrow(() -> new CustomException(NotificationErrorCode.NOTIFICATION_NOT_FOUND));
		if (!notification.getSessionId().equals(sessionId)) {
			throw new CustomException(NotificationErrorCode.NOTIFICATION_SESSION_MISMATCH);
		}

		notification.markRead();
		return NotificationResponse.of(notification);
	}

	/**
	 * PHOTO_ANALYSIS_READY 트리거 (docs/RECORD_NOTIFICATION_DOMAIN_DESIGN.md 2-1, S09_S10_PHOTO_QA_REPLY.md 참고).
	 * Record 도메인의 RecoveryRecordService가 사진들을 기록에 실제로 연결하는 시점에 호출한다 —
	 * "사진 여러 장을 동시에 분석하고 최종 결과가 나왔을 때 알림 1번"으로 확정돼서, 사진 업로드 개별 건이 아니라
	 * 기록(record) 단위로 한 번만 호출되는 구조다. 그래서 referenceId도 사진 id가 아니라 recordId를 가리킨다.
	 */
	@Transactional
	public void createPhotoAnalysisReady(String sessionId, Long recordId) {
		Notification notification = Notification.builder()
				.sessionId(sessionId)
				.type(NotificationType.PHOTO_ANALYSIS_READY)
				.title("사진 분석이 끝났어요")
				.body("업로드한 사진의 관찰 결과를 확인해보세요.")
				.referenceId(String.valueOf(recordId))
				.scheduledAt(LocalDateTime.now())
				.build();
		notificationRepository.save(notification);

		dispatch(notification);
	}

	/**
	 * DAILY_ACTION_REMINDER 트리거. 매일 아침 elapsed_day가 넘어간 ACTIVE 세션들한테
	 * "오늘도 체크리스트 확인하라"고 알려준다 ({@link com.mallo.backend.domain.notification.scheduler.DailyActionReminderScheduler}
	 * 가 세션 목록을 뽑아서 세션마다 이걸 호출한다). 딥링크할 특정 대상이 없어서 referenceId는 안 채운다.
	 */
	@Transactional
	public void createDailyActionReminder(String sessionId) {
		Notification notification = Notification.builder()
				.sessionId(sessionId)
				.type(NotificationType.DAILY_ACTION_REMINDER)
				.title("오늘의 회복 체크리스트를 확인해보세요")
				.body("오늘 하루도 회복 관리 잘 챙겨봐요.")
				.scheduledAt(LocalDateTime.now())
				.build();
		notificationRepository.save(notification);

		dispatch(notification);
	}

	/**
	 * HANDOFF_REPLY 트리거. 의료진(STAFF)이 상담 채팅에 답장을 보내는 시점에 호출한다
	 * (chatmessage 도메인의 ChatMessageService가 STAFF 메시지를 저장할 때 호출하는 훅).
	 * referenceId는 handoffId — 알림 탭하면 그 상담방으로 딥링크.
	 */
	@Transactional
	public void createHandoffReply(String sessionId, Long handoffId) {
		Notification notification = Notification.builder()
				.sessionId(sessionId)
				.type(NotificationType.HANDOFF_REPLY)
				.title("의료진이 답장했어요")
				.body("상담 채팅에서 답변을 확인해보세요.")
				.referenceId(String.valueOf(handoffId))
				.scheduledAt(LocalDateTime.now())
				.build();
		notificationRepository.save(notification);

		dispatch(notification);
	}

	/**
	 * 알림 인박스 row는 알림 설정과 무관하게 항상 남긴다(앱 안 인박스는 계속 보여야 하니까).
	 * 실제 FCM 푸시는 "알림 수신 동의 + 디바이스 토큰 등록"이 둘 다 있을 때만 시도하고,
	 * 그 결과(성공/실패/스킵)를 status에 그대로 반영한다 — SENT는 "진짜로 FCM에 전달 성공"만 의미한다.
	 */
	private void dispatch(Notification notification) {
		Optional<NotificationPreference> preference =
				notificationPreferenceRepository.findById(notification.getSessionId());

		boolean pushable = preference.isPresent()
				&& preference.get().isEnabled()
				&& preference.get().getFcmToken() != null;

		boolean sent = pushable && notificationSender.send(
				preference.get().getFcmToken(),
				notification.getTitle(),
				notification.getBody(),
				dataPayload(notification));

		if (sent) {
			notification.markSent();
		} else {
			notification.markFailed();
		}
	}

	// referenceId가 없는 타입(DAILY_ACTION_REMINDER)도 있어서 Map.of는 못 쓴다 — null 값이 들어오면
	// Map.of가 NullPointerException을 던지기 때문에, referenceId가 있을 때만 채워 넣는다.
	private Map<String, String> dataPayload(Notification notification) {
		Map<String, String> data = new HashMap<>();
		data.put("type", notification.getType().name());
		if (notification.getReferenceId() != null) {
			data.put("referenceId", notification.getReferenceId());
		}
		return data;
	}

	@Transactional
	public NotificationPreferenceResponse getPreference(String sessionId) {
		return NotificationPreferenceResponse.of(getOrCreatePreference(sessionId));
	}

	@Transactional
	public NotificationPreferenceResponse updatePreference(String sessionId, NotificationPreferenceUpdateRequest request) {
		NotificationPreference preference = getOrCreatePreference(sessionId);
		if (request.enabled() != null) {
			preference.updateEnabled(request.enabled());
		}
		if (request.fcmToken() != null) {
			preference.updateFcmToken(request.fcmToken());
		}
		return NotificationPreferenceResponse.of(preference);
	}

	private NotificationPreference getOrCreatePreference(String sessionId) {
		return notificationPreferenceRepository.findById(sessionId)
				.orElseGet(() -> notificationPreferenceRepository.save(
						NotificationPreference.builder()
								.sessionId(sessionId)
								.enabled(false)
								.fcmToken(null)
								.build()));
	}
}
