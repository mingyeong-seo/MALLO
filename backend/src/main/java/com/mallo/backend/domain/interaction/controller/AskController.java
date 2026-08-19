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

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/v1/ask")
@RequiredArgsConstructor
public class AskController {

	private static final String SESSION_HEADER = SessionAuthenticationFilter.SESSION_HEADER;

	private final AskService askService;
	private final SessionQueryPort sessionQueryPort;

	@PostMapping
	public ApiResponse<AskResponse> ask(
			@RequestHeader(SESSION_HEADER) UUID sessionId,
			@Valid @RequestBody AskRequest request) {
		SessionSnapshot session = sessionQueryPort.getSession(sessionId);
		return ApiResponse.success(askService.ask(sessionId, session, request));
	}
}
