package com.mallo.backend.domain.notification.exception;

import org.springframework.http.HttpStatus;

import com.mallo.backend.global.exception.ErrorCode;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum NotificationErrorCode implements ErrorCode {

	NOTIFICATION_NOT_FOUND(HttpStatus.NOT_FOUND, "알림을 찾을 수 없습니다."),
	NOTIFICATION_SESSION_MISMATCH(HttpStatus.BAD_REQUEST, "다른 세션의 알림에는 접근할 수 없습니다.");

	private final HttpStatus status;
	private final String message;
}
