package com.mallo.backend.domain.record.exception;

import org.springframework.http.HttpStatus;

import com.mallo.backend.global.exception.ErrorCode;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RecordErrorCode implements ErrorCode {

	RECORD_NOT_FOUND(HttpStatus.NOT_FOUND, "기록을 찾을 수 없습니다."),
	RECORD_SESSION_MISMATCH(HttpStatus.BAD_REQUEST, "다른 세션의 기록은 수정할 수 없습니다."),
	PHOTO_NOT_FOUND(HttpStatus.NOT_FOUND, "사진을 찾을 수 없습니다."),
	PHOTO_SESSION_MISMATCH(HttpStatus.BAD_REQUEST, "다른 세션의 사진은 연결할 수 없습니다."),
	PHOTO_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "사진 저장에 실패했습니다.");

	private final HttpStatus status;
	private final String message;
}
