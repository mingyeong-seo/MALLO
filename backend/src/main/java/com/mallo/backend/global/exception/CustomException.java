package com.mallo.backend.global.exception;

import lombok.Getter;

/**
 * 도메인 로직에서 던질 공통 예외.
 * 예: throw new CustomException(UserErrorCode.NOT_FOUND);
 */
@Getter
public class CustomException extends RuntimeException {

	private final ErrorCode errorCode;

	public CustomException(ErrorCode errorCode) {
		super(errorCode.getMessage());
		this.errorCode = errorCode;
	}
}
