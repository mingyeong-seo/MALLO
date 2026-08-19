package com.mallo.backend.domain.chatmessage.entity;

import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor
public class ChatMessage {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private Long handoffId; //몇 번 채팅방인지

	private UUID sessionId; //조인 없이 바로 조회하려고 중복 저장

	@Enumerated(EnumType.STRING)
	private SenderType senderType; //PATIENT/STAFF 누가 보냈는지

	private String content;

	@CreationTimestamp
	private LocalDateTime createdAt;

	public ChatMessage(Long handoffId, UUID sessionId, SenderType senderType, String content) {
		this.handoffId = handoffId;
		this.sessionId = sessionId;
		this.senderType = senderType;
		this.content = content;
	}
}
