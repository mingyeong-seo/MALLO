package com.mallo.backend.domain.sessionInfo.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mallo.backend.domain.sessionInfo.dto.SessionCreateRequest;
import com.mallo.backend.domain.sessionInfo.dto.SessionResponse;
import com.mallo.backend.domain.sessionInfo.entity.SessionInfo;
import com.mallo.backend.domain.sessionInfo.security.SessionAuthenticationFilter;
import com.mallo.backend.domain.sessionInfo.service.SessionInfoService;
import com.mallo.backend.global.response.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * X-Session-Id 헤더 검증은 SessionAuthenticationFilter(Security)가 먼저 처리한다.
 * 컨트롤러에서 @RequestHeader로 다시 읽는 건, 필터가 SecurityContext에 세션을 채워주긴 하지만
 * 커스텀 principal → 컨트롤러 인자 변환기를 아직 안 만들어서 나온 임시 방편. 나중에 정리 예정.
 */
@Tag(name = "Session", description = "Recovery Session(Journey) 발급/조회")
@RestController
@RequestMapping("/v1/sessions")
@RequiredArgsConstructor
public class SessionInfoController {

	private final SessionInfoService sessionInfoService;

	@Operation(summary = "Recovery Session 생성", description = "새 Recovery Journey를 시작하며 새 session_id(UUID)를 발급한다.")
	@ApiResponses({
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "생성 성공")
	})
	@PostMapping
	public ResponseEntity<ApiResponse<SessionResponse>> createSession(@Valid @RequestBody SessionCreateRequest request) {
		SessionInfo sessionInfo = sessionInfoService.createSession(
				request.procedure(), request.procedureAt(), request.clinicId());
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(ApiResponse.success(SessionResponse.from(sessionInfo)));
	}

	@Operation(summary = "오늘 세션 상태 조회", description = "X-Session-Id 헤더의 세션이 유효한지 확인하고 현재 DAY(elapsed_day)를 반환한다. "
			+ "앱 재실행 시 활성 세션 진입 여부 판단에 사용한다.")
	@GetMapping("/today")
	public ApiResponse<SessionResponse> getToday(
			@RequestHeader(SessionAuthenticationFilter.SESSION_HEADER) UUID sessionId) {
		SessionInfo sessionInfo = sessionInfoService.getSession(sessionId);
		return ApiResponse.success(SessionResponse.from(sessionInfo));
	}

	@Operation(summary = "전체 세션 목록 조회", description = "발급된 모든 Recovery Session을 최신순으로 반환한다. "
			+ "지금은 접근 제한 없이 전부 공개(해커톤 MVP 한정) — session_id 자체가 인가 토큰이라 실서비스 전엔 반드시 잠가야 한다.")
	@GetMapping
	public ApiResponse<List<SessionResponse>> getAllSessions() {
		List<SessionResponse> responses = sessionInfoService.getAllSessions().stream()
				.map(SessionResponse::from)
				.toList();
		return ApiResponse.success(responses);
	}

	@Operation(summary = "세션 삭제", description = "X-Session-Id 헤더의 세션을 삭제한다.")
	@ApiResponses({
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "204", description = "삭제 성공")
	})
	@DeleteMapping
	public ResponseEntity<Void> deleteSession(
			@RequestHeader(SessionAuthenticationFilter.SESSION_HEADER) UUID sessionId) {
		sessionInfoService.deleteSession(sessionId);
		return ResponseEntity.noContent().build();
	}

	@Operation(summary = "세션 종료(ACTIVE → COMPLETED)", description = "X-Session-Id 헤더의 세션을 완료 처리한다. "
			+ "DAY 기준 자동 전환은 없고 FE가 명시적으로 호출할 때만 상태가 바뀐다(수동 트리거).")
	@PatchMapping("/complete")
	public ApiResponse<SessionResponse> completeSession(
			@RequestHeader(SessionAuthenticationFilter.SESSION_HEADER) UUID sessionId) {
		SessionInfo sessionInfo = sessionInfoService.completeSession(sessionId);
		return ApiResponse.success(SessionResponse.from(sessionInfo));
	}
}
