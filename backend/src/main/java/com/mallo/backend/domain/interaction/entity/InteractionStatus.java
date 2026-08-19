package com.mallo.backend.domain.interaction.entity;

public enum InteractionStatus {
	// Quick Check(QuickCheckStatus.MATCHED)와 같은 이름 — 행동 질문이 Protocol에 매칭되면
	// FE가 S08과 동일한 결과 구조(decision/guidance/nextAction/protocolRef)를 재사용한다.
	MATCHED,      // 바로 답 줄 수 있음 (예: 고강도 운동 되나요? → 안 돼요)
	CLARIFY,      // 정보가 부족해서 되물어야 함 (예: 운동해도 돼요? → 강도가 어느 정도인가요?)
	CONNECT,      // 의사만 답할 수 있는 질문 (예: 이 붓기 정상인가요?)
	NO_PROTOCOL,  // 행동 질문인데 아직 정해진 규칙이 없음
	GENERAL,      // 특정 행동 얘기 아닌 일반 회복 질문 (예: 물 많이 마셔도 되나요?)
	UNSUPPORTED   // 회복이랑 전혀 상관없는 질문 (예: 오늘 날씨 어때?)
}
