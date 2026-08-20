package com.mallo.backend.domain.interaction.exception;

import org.springframework.http.HttpStatus;

import com.mallo.backend.global.exception.ErrorCode;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum InteractionErrorCode implements ErrorCode {

	AI_INVALID_RESPONSE(HttpStatus.BAD_GATEWAY, "AI 응답 형식이 올바르지 않습니다."),
	AI_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "AI 서비스를 사용할 수 없습니다."),
	AI_BUDGET_EXHAUSTED(HttpStatus.SERVICE_UNAVAILABLE, "AI 사용 한도가 소진되었습니다."),
	AI_REQUEST_REJECTED(HttpStatus.BAD_REQUEST, "AI 요청이 처리 가능한 범위를 벗어났습니다."),
	AI_CONTRACT_MISMATCH(HttpStatus.SERVICE_UNAVAILABLE, "AI 계약 버전이 일치하지 않습니다.");

	private final HttpStatus status;
	private final String message;
}
