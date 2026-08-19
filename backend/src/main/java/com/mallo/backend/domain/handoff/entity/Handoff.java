package com.mallo.backend.domain.handoff.entity;

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
public class Handoff {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private UUID sessionId; //어느 세션의 상담 요청인지 (조인 없이 바로 조회하려고 직접 저장)

	private Long interactionId; //어떤 질문에서 넘어 왔는지 번호

	@Enumerated(EnumType.STRING)
	private HandoffChannel channel; //상담 방법 채팅

	@Enumerated(EnumType.STRING)
	private HandoffStatus status;

	private String summary; //의료진에게 보여줄 문의 요약

	@CreationTimestamp
	private LocalDateTime createdAt;

	public Handoff(UUID sessionId, Long interactionId, HandoffChannel channel, String summary) {
		this.sessionId = sessionId;
		this.interactionId = interactionId;
		this.channel = channel;
		this.summary = summary;
		this.status = HandoffStatus.REQUESTED;
	}

	public void markAnswered() {
		this.status = HandoffStatus.ANSWERED;
	}
}
