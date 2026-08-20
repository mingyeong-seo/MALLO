package com.mallo.backend.domain.interaction.controller;

import java.util.UUID;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mallo.backend.domain.interaction.dto.AskRequest;
import com.mallo.backend.domain.interaction.dto.AskResponse;
import com.mallo.backend.domain.interaction.service.AskService;
import com.mallo.backend.domain.journey.port.SessionQueryPort;
import com.mallo.backend.domain.journey.port.SessionSnapshot;
import com.mallo.backend.domain.sessionInfo.security.SessionAuthenticationFilter;
import com.mallo.backend.global.response.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Tag(name = "Ask", description = "ASK MALLO 자연어 질문")
@RestController
@RequestMapping("/v1/ask")
@RequiredArgsConstructor
public class AskController {

	private static final String SESSION_HEADER = SessionAuthenticationFilter.SESSION_HEADER;

	private final AskService askService;
	private final SessionQueryPort sessionQueryPort;

	@Operation(summary = "자연어 질문", description = "질문을 의료 확인(CONNECT)/생활 행동(MATCHED|CLARIFY|NO_PROTOCOL)"
			+ "/일반 회복 정보(GENERAL)/범위 밖(UNSUPPORTED)으로 분류해 저장하고 그대로 반환한다. "
			+ "status가 MATCHED면 decision/guidance/nextAction/protocolRef가 Quick Check(S08) 응답과 같은 구조로 채워진다.")
	@ApiResponses({
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "분류/저장 성공"),
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "question이 비어있음"),
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "X-Session-Id 누락/유효하지 않음")
	})
	@PostMapping
	public ApiResponse<AskResponse> ask(
			@RequestHeader(SESSION_HEADER) UUID sessionId,
			@Valid @RequestBody AskRequest request) {
		SessionSnapshot session = sessionQueryPort.getSession(sessionId);
		return ApiResponse.success(askService.ask(sessionId, session, request));
	}
}
