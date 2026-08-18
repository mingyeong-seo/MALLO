package com.mallo.backend.global.response;

import com.mallo.backend.global.exception.ErrorCode;

/**
 * 모든 API 응답을 감싸는 공통 포맷.
 * 성공: {"success": true, "data": ..., "message": null}
 * 실패: {"success": false, "data": null, "message": "..."}
 */
public record ApiResponse<T>(
		boolean success,
		T data,
		String message
) {

	public static <T> ApiResponse<T> success(T data) {
		return new ApiResponse<>(true, data, null);
	}

	public static ApiResponse<Void> noContent() {
		return new ApiResponse<>(true, null, null);
	}

	public static ApiResponse<Void> error(ErrorCode errorCode) {
		return new ApiResponse<>(false, null, errorCode.getMessage());
	}

	public static ApiResponse<Void> error(String message) {
		return new ApiResponse<>(false, null, message);
	}
}
