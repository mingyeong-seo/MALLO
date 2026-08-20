package com.mallo.backend.global.exception;

import org.springframework.http.HttpStatus;

/**
 * 도메인별 에러코드는 이 인터페이스를 구현해서 각자 enum으로 추가하면 됩니다.
 * 예: UserErrorCode implements ErrorCode { NOT_FOUND(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다") ... }
 */
public interface ErrorCode {

	HttpStatus getStatus();

	String getMessage();
}
