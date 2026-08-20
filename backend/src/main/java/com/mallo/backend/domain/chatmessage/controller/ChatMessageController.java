package com.mallo.backend.domain.chatmessage.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mallo.backend.domain.chatmessage.dto.ChatMessageCreateRequest;
import com.mallo.backend.domain.chatmessage.dto.ChatMessageResponse;
import com.mallo.backend.domain.chatmessage.service.ChatMessageService;
import com.mallo.backend.global.response.ApiResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/v1/handoffs/{handoffId}/messages")
@RequiredArgsConstructor
public class ChatMessageController {

	private final ChatMessageService chatMessageService;

	@PostMapping
	public ApiResponse<ChatMessageResponse> sendMessage(
			@AuthenticationPrincipal UUID sessionId,
			@PathVariable Long handoffId,
			@Valid @RequestBody ChatMessageCreateRequest request) {
		return ApiResponse.success(chatMessageService.sendMessage(sessionId, handoffId, request));
	}

	@GetMapping
	public ApiResponse<List<ChatMessageResponse>> getMessages(@PathVariable Long handoffId) {
		return ApiResponse.success(chatMessageService.getMessages(handoffId));
	}
}
