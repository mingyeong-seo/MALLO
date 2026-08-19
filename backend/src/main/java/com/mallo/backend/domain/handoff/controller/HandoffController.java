package com.mallo.backend.domain.handoff.controller;

import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mallo.backend.domain.handoff.dto.HandoffCreateRequest;
import com.mallo.backend.domain.handoff.dto.HandoffResponse;
import com.mallo.backend.domain.handoff.service.HandoffService;
import com.mallo.backend.global.response.ApiResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/v1/handoffs")
@RequiredArgsConstructor
public class HandoffController {

	private final HandoffService handoffService;

	@PostMapping
	public ApiResponse<HandoffResponse> createHandoff(
			@AuthenticationPrincipal UUID sessionId,
			@Valid @RequestBody HandoffCreateRequest request) {
		return ApiResponse.success(handoffService.createHandoff(sessionId, request));
	}
}
