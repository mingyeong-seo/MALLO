package com.mallo.backend.domain.chatmessage.dto;

import java.time.LocalDateTime;

import com.mallo.backend.domain.chatmessage.entity.ChatMessage;
import com.mallo.backend.domain.chatmessage.entity.SenderType;

public record ChatMessageResponse(
		Long messageId,
		SenderType senderType,
		String content,
		LocalDateTime createdAt
) {
	public static ChatMessageResponse from(ChatMessage chatMessage) {
		return new ChatMessageResponse(
				chatMessage.getId(),
				chatMessage.getSenderType(),
				chatMessage.getContent(),
				chatMessage.getCreatedAt()
		);
	}
}
