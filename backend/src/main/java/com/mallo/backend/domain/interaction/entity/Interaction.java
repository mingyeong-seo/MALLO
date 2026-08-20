package com.mallo.backend.domain.interaction.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import com.mallo.backend.domain.journey.entity.ActionType;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
public class Interaction {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private UUID sessionId;

	@Column(length = 1000)
	private String question;

	@Enumerated(EnumType.STRING)
	private InteractionStatus status;

	@Enumerated(EnumType.STRING)
	private ActionType action; //생활 행동 질문일 때만 값 있음

	@Column(columnDefinition = "TEXT")
	private String context; //JSON 문자열 (Protocol 매칭에 쓴 조건)

	private String protocolRef; //매칭된 Protocol의 id (없으면 null)

	@ElementCollection
	@CollectionTable(name = "interaction_photo", joinColumns = @JoinColumn(name = "interaction_id"))
	@Column(name = "photo_record_id")
	private List<Long> photoRecordIds = new ArrayList<>();

	@CreationTimestamp
	private LocalDateTime createdAt;

	public Interaction(UUID sessionId, String question, InteractionStatus status, ActionType action,
			String context, String protocolRef, List<Long> photoRecordIds) {
		this.sessionId = sessionId;
		this.question = question;
		this.status = status;
		this.action = action;
		this.context = context;
		this.protocolRef = protocolRef;
		this.photoRecordIds = photoRecordIds != null ? new ArrayList<>(photoRecordIds) : new ArrayList<>();
	}
}
