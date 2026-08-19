package com.mallo.backend.domain.handoff.service;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mallo.backend.domain.handoff.dto.HandoffCreateRequest;
import com.mallo.backend.domain.handoff.dto.HandoffResponse;
import com.mallo.backend.domain.handoff.entity.Handoff;
import com.mallo.backend.domain.handoff.repository.HandoffRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class HandoffService {

	private final HandoffRepository handoffRepository;

	@Transactional
	public HandoffResponse createHandoff(UUID sessionId, HandoffCreateRequest request) {
		Handoff handoff = new Handoff(sessionId, request.interactionId(), request.channel(), request.summary());
		Handoff saved = handoffRepository.save(handoff);
		return HandoffResponse.from(saved);
	}
}
