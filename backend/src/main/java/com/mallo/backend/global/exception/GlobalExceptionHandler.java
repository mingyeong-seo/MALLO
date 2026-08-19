package com.mallo.backend.global.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import com.mallo.backend.global.response.ApiResponse;

import lombok.extern.slf4j.Slf4j;

/**
 * Exception.class catch-all 하나로는 Spring이 던지는 흔한 요청 오류(헤더/파라미터 누락, 타입 불일치,
 * 잘못된 JSON body, 지원 안 하는 HTTP 메서드)까지 전부 500으로 뭉개버려서 클라이언트가 400대 요청
 * 실수와 서버 진짜 장애를 구분할 수 없었다. 자주 발생하는 프레임워크 예외는 여기서 먼저 잡아
 * 올바른 상태 코드로 내려주고, catch-all은 정말 예상 못 한 예외만 500으로 처리한다.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(CustomException.class)
	public ResponseEntity<ApiResponse<Void>> handleCustomException(CustomException e) {
		ErrorCode errorCode = e.getErrorCode();
		log.warn("CustomException: {}", errorCode.getMessage());
		return ResponseEntity.status(errorCode.getStatus())
				.body(ApiResponse.error(errorCode));
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiResponse<Void>> handleValidationException(MethodArgumentNotValidException e) {
		String message = e.getBindingResult().getFieldErrors().stream()
				.findFirst()
				.map(error -> error.getField() + ": " + error.getDefaultMessage())
				.orElse(CommonErrorCode.INVALID_INPUT.getMessage());
		log.warn("ValidationException: {}", message);
		return ResponseEntity.badRequest().body(ApiResponse.error(message));
	}

	// @RequestHeader(required=true)인데 헤더가 없을 때 (예: X-Session-Id 누락).
	// 대부분은 Security의 anyRequest().authenticated()가 먼저 401로 막지만, permitAll인 경로에서
	// 헤더 있는 다른 @RequestMapping과 매핑이 겹치는 경우 등 필터를 통과한 뒤에도 발생할 수 있다.
	@ExceptionHandler(MissingRequestHeaderException.class)
	public ResponseEntity<ApiResponse<Void>> handleMissingHeader(MissingRequestHeaderException e) {
		String message = "필수 헤더가 없습니다: " + e.getHeaderName();
		log.warn("MissingRequestHeaderException: {}", message);
		return ResponseEntity.badRequest().body(ApiResponse.error(message));
	}

	// @RequestParam(required=true)인데 쿼리 파라미터가 없을 때.
	@ExceptionHandler(MissingServletRequestParameterException.class)
	public ResponseEntity<ApiResponse<Void>> handleMissingParameter(MissingServletRequestParameterException e) {
		String message = "필수 파라미터가 없습니다: " + e.getParameterName();
		log.warn("MissingServletRequestParameterException: {}", message);
		return ResponseEntity.badRequest().body(ApiResponse.error(message));
	}

	// 예: GET /v1/checks/{checkId}에 UUID가 아닌 값이 들어온 경우.
	@ExceptionHandler(MethodArgumentTypeMismatchException.class)
	public ResponseEntity<ApiResponse<Void>> handleTypeMismatch(MethodArgumentTypeMismatchException e) {
		String message = e.getName() + " 값의 형식이 올바르지 않습니다.";
		log.warn("MethodArgumentTypeMismatchException: {}", message);
		return ResponseEntity.badRequest().body(ApiResponse.error(message));
	}

	// 요청 body가 JSON 문법 자체를 어겼거나, 필드 타입이 안 맞아서 역직렬화에 실패한 경우.
	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<ApiResponse<Void>> handleNotReadable(HttpMessageNotReadableException e) {
		log.warn("HttpMessageNotReadableException: {}", e.getMessage());
		return ResponseEntity.badRequest().body(ApiResponse.error("요청 body를 읽을 수 없습니다."));
	}

	// 엔드포인트는 존재하지만 지원하지 않는 HTTP 메서드로 호출한 경우 (예: PATCH 대신 PUT).
	@ExceptionHandler(HttpRequestMethodNotSupportedException.class)
	public ResponseEntity<ApiResponse<Void>> handleMethodNotSupported(HttpRequestMethodNotSupportedException e) {
		log.warn("HttpRequestMethodNotSupportedException: {}", e.getMessage());
		return ResponseEntity.status(CommonErrorCode.METHOD_NOT_ALLOWED.getStatus())
				.body(ApiResponse.error(CommonErrorCode.METHOD_NOT_ALLOWED));
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
		log.error("Unhandled exception", e);
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(ApiResponse.error(CommonErrorCode.INTERNAL_SERVER_ERROR));
	}
}
