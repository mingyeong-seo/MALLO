package com.mallo.backend.domain.chatmessage.dto;

import com.mallo.backend.domain.chatmessage.entity.SenderType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ChatMessageCreateRequest(
		@NotNull SenderType senderType,
		@NotBlank String content
) {
}
