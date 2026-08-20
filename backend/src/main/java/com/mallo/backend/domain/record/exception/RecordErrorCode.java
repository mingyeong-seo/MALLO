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
	RECORD_NOT_EDITABLE(HttpStatus.FORBIDDEN, "오늘 작성한 기록만 수정할 수 있습니다."),
	RECORD_ELAPSED_DAY_MISMATCH(HttpStatus.BAD_REQUEST, "elapsedDay가 현재 세션의 진행일과 일치하지 않습니다."),
	RECORD_ALREADY_EXISTS_FOR_DAY(HttpStatus.CONFLICT, "해당 DAY에는 이미 기록이 존재합니다. 수정은 PATCH를 사용하세요."),
	PHOTO_NOT_FOUND(HttpStatus.NOT_FOUND, "사진을 찾을 수 없습니다."),
	PHOTO_SESSION_MISMATCH(HttpStatus.BAD_REQUEST, "다른 세션의 사진은 연결할 수 없습니다."),
	PHOTO_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "사진 저장에 실패했습니다."),
	CHECK_SESSION_MISMATCH(HttpStatus.BAD_REQUEST, "존재하지 않거나 다른 세션의 check_id입니다.");

	private final HttpStatus status;
	private final String message;
}
