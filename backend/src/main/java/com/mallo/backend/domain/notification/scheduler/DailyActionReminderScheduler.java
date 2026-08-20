package com.mallo.backend.domain.notification.scheduler;

import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.mallo.backend.domain.notification.service.NotificationService;
import com.mallo.backend.domain.sessionInfo.entity.SessionInfo;
import com.mallo.backend.domain.sessionInfo.entity.SessionStatus;
import com.mallo.backend.domain.sessionInfo.repository.SessionInfoRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * DAILY_ACTION_REMINDER 발송 스케줄러.
 *
 * elapsed_day는 DB에 저장하는 값이 아니라 SessionInfo.getElapsedDay()가 procedure_at과 오늘 날짜로
 * 매번 계산하는 값이라(SessionInfo 참고), "어떤 세션의 elapsed_day가 바뀌었는지" 따로 감지할 방법이 없다.
 * 대신 이 스케줄러를 하루에 한 번만 돌리면, 그 사이 모든 ACTIVE 세션의 elapsed_day가 정확히 1씩 늘어난
 * 상태가 보장되므로 "바뀐 세션 찾기" 없이 그냥 ACTIVE 세션 전부한테 매일 한 번씩 보내면 된다.
 *
 * 다른 도메인(sessionInfo)의 레포지토리를 직접 참조한다 — Journey처럼 포트로 추상화하지 않은 이유는
 * medicalstaff 도메인도 이미 SessionInfoRepository를 직접 쓰고 있어서 그 컨벤션을 따름.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DailyActionReminderScheduler {

	private final SessionInfoRepository sessionInfoRepository;
	private final NotificationService notificationService;

	// 매일 아침 9시. cron: 초 분 시 일 월 요일
	@Scheduled(cron = "0 0 9 * * *")
	public void remindActiveSessions() {
		List<SessionInfo> activeSessions = sessionInfoRepository.findByStatus(SessionStatus.ACTIVE);
		log.info("DAILY_ACTION_REMINDER 발송 대상 {}건", activeSessions.size());

		for (SessionInfo session : activeSessions) {
			notificationService.createDailyActionReminder(session.getId().toString());
		}
	}
}
