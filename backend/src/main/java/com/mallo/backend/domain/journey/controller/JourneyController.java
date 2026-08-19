package com.mallo.backend.domain.journey.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mallo.backend.domain.journey.dto.QuickCheckRequest;
import com.mallo.backend.domain.journey.dto.QuickCheckResponse;
import com.mallo.backend.domain.journey.entity.Journey;
import com.mallo.backend.domain.journey.port.SessionQueryPort;
import com.mallo.backend.domain.journey.port.SessionSnapshot;
import com.mallo.backend.domain.journey.service.JourneyService;
import com.mallo.backend.domain.sessionInfo.security.SessionAuthenticationFilter;
import com.mallo.backend.global.response.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Tag(name = "Journey", description = "Quick Check 판단/저장/조회")
@RestController
@RequestMapping("/v1/checks")
@RequiredArgsConstructor
public class JourneyController {

	private static final String SESSION_HEADER = SessionAuthenticationFilter.SESSION_HEADER;

	private final JourneyService journeyService;
	private final SessionQueryPort sessionQueryPort;

	@Operation(summary = "Quick Check 판단 + 저장", description = "행동/조건을 Protocol과 매칭해 결과를 저장하고 그대로 반환한다. "
			+ "같은 행동을 여러 번 확인해도 덮어쓰지 않고 매번 새 check_id로 저장한다.")
	@PostMapping
	public ResponseEntity<ApiResponse<QuickCheckResponse>> createCheck(
			@RequestHeader(SESSION_HEADER) UUID sessionId,
			@Valid @RequestBody QuickCheckRequest request) {
		SessionSnapshot session = sessionQueryPort.getSession(sessionId);
		Journey journey = journeyService.createCheck(
				sessionId, session.procedure(), session.elapsedDay(),
				request.action(), request.contextOrEmpty());
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(ApiResponse.success(QuickCheckResponse.from(journey)));
	}

	@Operation(summary = "오늘의 Quick Check 기록 전체 조회", description = "세션의 현재 elapsed_day에 저장된 기록을 최신순으로 전부 반환한다. "
			+ "상위 N개만 보여주는 건 프론트 책임(slice).")
	@GetMapping("/today")
	public ApiResponse<List<QuickCheckResponse>> getTodayChecks(@RequestHeader(SESSION_HEADER) UUID sessionId) {
		SessionSnapshot session = sessionQueryPort.getSession(sessionId);
		List<QuickCheckResponse> responses = journeyService.getTodayChecks(sessionId, session.elapsedDay()).stream()
				.map(QuickCheckResponse::from)
				.toList();
		return ApiResponse.success(responses);
	}

	@Operation(summary = "저장된 Quick Check 결과 단건 조회", description = "check_id로 저장된 Quick Check 결과 한 건을 재조회한다. "
			+ "S05 등에서 저장된 결과의 S08 화면을 다시 보여줄 때 사용. 다른 세션의 check_id면 404.")
	@GetMapping("/{checkId}")
	public ApiResponse<QuickCheckResponse> getCheck(
			@RequestHeader(SESSION_HEADER) UUID sessionId,
			@PathVariable UUID checkId) {
		Journey journey = journeyService.getCheck(sessionId, checkId);
		return ApiResponse.success(QuickCheckResponse.from(journey));
	}
}
