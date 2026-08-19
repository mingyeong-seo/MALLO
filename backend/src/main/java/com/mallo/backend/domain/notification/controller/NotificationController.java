package com.mallo.backend.domain.notification.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.mallo.backend.domain.notification.dto.NotificationPreferenceResponse;
import com.mallo.backend.domain.notification.dto.NotificationPreferenceUpdateRequest;
import com.mallo.backend.domain.notification.dto.NotificationResponse;
import com.mallo.backend.domain.notification.service.NotificationService;
import com.mallo.backend.global.response.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Tag(name = "Notification", description = "알림 인박스 / 알림 설정")
@RestController
@RequiredArgsConstructor
public class NotificationController {

	private final NotificationService notificationService;

	@Operation(summary = "세션의 알림 목록 조회 (예약 시각 내림차순)")
	@GetMapping("/v1/sessions/{sessionId}/notifications")
	public ApiResponse<List<NotificationResponse>> getInbox(
			@Parameter(description = "세션 id") @PathVariable String sessionId
	) {
		return ApiResponse.success(notificationService.getInbox(sessionId));
	}

	@Operation(summary = "알림 읽음 처리")
	@ApiResponses({
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "처리 성공"),
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "다른 세션의 알림"),
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "알림을 찾을 수 없음")
	})
	@PatchMapping("/v1/sessions/{sessionId}/notifications/{notificationId}/read")
	public ApiResponse<NotificationResponse> markRead(
			@Parameter(description = "세션 id") @PathVariable String sessionId,
			@Parameter(description = "알림 id") @PathVariable Long notificationId
	) {
		return ApiResponse.success(notificationService.markRead(sessionId, notificationId));
	}

	@Operation(summary = "알림 설정 조회 (없으면 기본값으로 생성)")
	@GetMapping("/v1/sessions/{sessionId}/notification-preference")
	public ApiResponse<NotificationPreferenceResponse> getPreference(
			@Parameter(description = "세션 id") @PathVariable String sessionId
	) {
		return ApiResponse.success(notificationService.getPreference(sessionId));
	}

	@Operation(summary = "알림 설정 변경 (동의 여부 / FCM 토큰, 부분 수정)")
	@ApiResponses({
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "수정 성공"),
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "요청 검증 실패")
	})
	@PatchMapping("/v1/sessions/{sessionId}/notification-preference")
	public ApiResponse<NotificationPreferenceResponse> updatePreference(
			@Parameter(description = "세션 id") @PathVariable String sessionId,
			@Valid @RequestBody NotificationPreferenceUpdateRequest request
	) {
		return ApiResponse.success(notificationService.updatePreference(sessionId, request));
	}
}
