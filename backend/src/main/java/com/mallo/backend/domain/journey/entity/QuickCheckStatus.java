package com.mallo.backend.domain.journey.entity;

/**
 * POST /v1/checks, GET /v1/checks/today, GET /v1/checks/{checkId} 응답의 최상위 상태.
 * 저장된 값이 아니라 decision/protocolRef가 null인지로 매번 계산해서 내려준다 (Journey.hasMatch() 참고).
 *
 * ASK MALLO 쪽의 UNSUPPORTED(Recovery 범위 밖 질문)는 Journey Quick Check와는 다른 개념이라
 * 여기 포함하지 않는다 (FE 협의 완료, 2026-08-19).
 */
public enum QuickCheckStatus {
	MATCHED,
	NO_PROTOCOL
}
