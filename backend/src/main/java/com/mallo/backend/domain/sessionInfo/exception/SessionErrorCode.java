package com.mallo.backend.domain.sessionInfo.exception;

import org.springframework.http.HttpStatus;

import com.mallo.backend.global.exception.ErrorCode;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SessionErrorCode implements ErrorCode {

	SESSION_NOT_FOUND(HttpStatus.NOT_FOUND, "세션을 찾을 수 없습니다.");

	private final HttpStatus status;
	private final String message;
}
