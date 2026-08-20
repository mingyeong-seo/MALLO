package com.mallo.backend.domain.journey.exception;

import org.springframework.http.HttpStatus;

import com.mallo.backend.global.exception.ErrorCode;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum JourneyErrorCode implements ErrorCode {

	// 존재하지 않거나 다른 세션의 check_id인 경우 둘 다 이걸로 응답한다 (존재 여부를 흘리지 않기 위함).
	CHECK_NOT_FOUND(HttpStatus.NOT_FOUND, "요청한 Quick Check 기록을 찾을 수 없습니다.");

	private final HttpStatus status;
	private final String message;
}
