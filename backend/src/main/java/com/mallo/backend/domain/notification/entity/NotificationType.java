package com.mallo.backend.domain.notification.entity;

/**
 * FCM으로 실제 발송되는 알림 종류.
 * HANDOFF_REPLY / PHOTO_ANALYSIS_READY는 Notification.referenceId에 대상 id를 같이 저장해서
 * 탭했을 때 해당 화면으로 딥링크할 수 있게 한다.
 *
 * 발생 시점(트리거) 확정 내용은 docs/RECORD_NOTIFICATION_DOMAIN_DESIGN.md 참고.
 */
public enum NotificationType {

	// 세션 "생성" 시점이 아니라 세션의 elapsed_day가 바뀌는 시점에 트리거.
	// 세션 도메인의 "오늘 DAY가 바뀐 세션 목록" 조회가 필요해서 연동 지점 확인 필요.
	DAILY_ACTION_REMINDER,

	// 의료진 상담(Handoff) 채팅에 실제 답변이 도착하는 시점에 트리거. referenceId = handoffId.
	// 실채팅 연동 예정 — Handoff 도메인이 답변 저장 시 우리 쪽을 호출하는 훅 필요.
	HANDOFF_REPLY,

	// 업로드한 사진의 비의료적 관찰 분석 결과가 PhotoRecord에 반영되는 시점에 트리거. referenceId = photoRecordId.
	// 우리 도메인 안에서 완결되는 트리거라 별도 연동 불필요.
	PHOTO_ANALYSIS_READY,

	// 특정 트리거 없음. 도메인/enum만 만들어두고 실제 발송 로직은 아직 구현 안 함.
	GENERAL
}
