package com.mallo.backend.domain.chatmessage.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mallo.backend.domain.chatmessage.dto.ChatMessageCreateRequest;
import com.mallo.backend.domain.chatmessage.dto.ChatMessageResponse;
import com.mallo.backend.domain.chatmessage.entity.ChatMessage;
import com.mallo.backend.domain.chatmessage.entity.SenderType;
import com.mallo.backend.domain.chatmessage.repository.ChatMessageRepository;
import com.mallo.backend.domain.handoff.entity.Handoff;
import com.mallo.backend.domain.handoff.repository.HandoffRepository;
import com.mallo.backend.domain.notification.service.NotificationService;
import com.mallo.backend.global.exception.CommonErrorCode;
import com.mallo.backend.global.exception.CustomException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChatMessageService {

	private final ChatMessageRepository chatMessageRepository;
	private final HandoffRepository handoffRepository;
	private final NotificationService notificationService;

	@Transactional
	public ChatMessageResponse sendMessage(UUID sessionId, Long handoffId, ChatMessageCreateRequest request) {
		Handoff handoff = handoffRepository.findById(handoffId)
				.orElseThrow(() -> new CustomException(CommonErrorCode.NOT_FOUND));

		if (request.senderType() == SenderType.STAFF) {
			handoff.markAnswered(); //의료진이 첫 답장을 보내면 handoff 상태도 같이 바꿔준다
			// HANDOFF_REPLY 알림 — 상담방 주인(환자)한테 보내야 하므로 sendMessage 호출자의 sessionId가
			// 아니라 handoff.getSessionId()(=상담을 요청한 환자 세션)를 대상으로 한다.
			notificationService.createHandoffReply(handoff.getSessionId().toString(), handoffId);
		}

		ChatMessage chatMessage = new ChatMessage(handoffId, sessionId, request.senderType(), request.content());
		ChatMessage saved = chatMessageRepository.save(chatMessage);
		return ChatMessageResponse.from(saved);
	}

	public List<ChatMessageResponse> getMessages(Long handoffId) {
		return chatMessageRepository.findByHandoffIdOrderByCreatedAtAsc(handoffId).stream()
				.map(ChatMessageResponse::from)
				.toList();
	}
}
