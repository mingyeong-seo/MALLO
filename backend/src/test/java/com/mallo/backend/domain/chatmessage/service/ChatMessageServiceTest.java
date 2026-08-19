package com.mallo.backend.domain.chatmessage.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mallo.backend.domain.chatmessage.dto.ChatMessageCreateRequest;
import com.mallo.backend.domain.chatmessage.dto.ChatMessageResponse;
import com.mallo.backend.domain.chatmessage.entity.ChatMessage;
import com.mallo.backend.domain.chatmessage.entity.SenderType;
import com.mallo.backend.domain.chatmessage.repository.ChatMessageRepository;
import com.mallo.backend.domain.handoff.entity.Handoff;
import com.mallo.backend.domain.handoff.entity.HandoffChannel;
import com.mallo.backend.domain.handoff.repository.HandoffRepository;
import com.mallo.backend.domain.notification.service.NotificationService;
import com.mallo.backend.global.exception.CommonErrorCode;
import com.mallo.backend.global.exception.CustomException;

@ExtendWith(MockitoExtension.class)
class ChatMessageServiceTest {

	private static final UUID PATIENT_SESSION_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
	private static final Long HANDOFF_ID = 1L;

	@Mock
	private ChatMessageRepository chatMessageRepository;

	@Mock
	private HandoffRepository handoffRepository;

	@Mock
	private NotificationService notificationService;

	@InjectMocks
	private ChatMessageService chatMessageService;

	private Handoff handoff() {
		return new Handoff(PATIENT_SESSION_ID, null, HandoffChannel.CHAT, "문의 요약");
	}

	@Test
	void 환자가_메시지를_보내면_알림이_안_간다() {
		given(handoffRepository.findById(HANDOFF_ID)).willReturn(Optional.of(handoff()));
		given(chatMessageRepository.save(any())).willAnswer(invocation -> invocation.getArgument(0));

		chatMessageService.sendMessage(PATIENT_SESSION_ID, HANDOFF_ID,
				new ChatMessageCreateRequest(SenderType.PATIENT, "시술 부위가 붉어지는데 정상인가요?"));

		verify(notificationService, never()).createHandoffReply(any(), any());
	}

	@Test
	void 의료진이_답장하면_handoff가_ANSWERED로_바뀌고_환자_세션으로_알림이_간다() {
		Handoff handoff = handoff();
		given(handoffRepository.findById(HANDOFF_ID)).willReturn(Optional.of(handoff));
		given(chatMessageRepository.save(any())).willAnswer(invocation -> invocation.getArgument(0));

		// 의료진 쪽 인증 세션(임의)으로 호출해도, 알림은 handoff 주인인 환자 세션으로 가야 한다
		UUID staffAuthenticatedSessionId = UUID.fromString("99999999-9999-9999-9999-999999999999");
		chatMessageService.sendMessage(staffAuthenticatedSessionId, HANDOFF_ID,
				new ChatMessageCreateRequest(SenderType.STAFF, "정상 반응입니다."));

		verify(notificationService).createHandoffReply(PATIENT_SESSION_ID.toString(), HANDOFF_ID);
	}

	@Test
	void 존재하지_않는_handoff면_예외가_발생한다() {
		given(handoffRepository.findById(999L)).willReturn(Optional.empty());

		assertThatThrownBy(() -> chatMessageService.sendMessage(
				PATIENT_SESSION_ID, 999L, new ChatMessageCreateRequest(SenderType.PATIENT, "질문")))
				.isInstanceOf(CustomException.class)
				.extracting(e -> ((CustomException) e).getErrorCode())
				.isEqualTo(CommonErrorCode.NOT_FOUND);
	}

	@Test
	void 메시지_목록을_생성순으로_조회한다() {
		ChatMessage message = new ChatMessage(HANDOFF_ID, PATIENT_SESSION_ID, SenderType.PATIENT, "질문");
		given(chatMessageRepository.findByHandoffIdOrderByCreatedAtAsc(HANDOFF_ID)).willReturn(List.of(message));

		List<ChatMessageResponse> messages = chatMessageService.getMessages(HANDOFF_ID);

		assertThat(messages).hasSize(1);
		assertThat(messages.get(0).content()).isEqualTo("질문");
	}
}
