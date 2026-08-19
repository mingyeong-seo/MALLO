package com.mallo.backend.domain.journey.service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mallo.backend.domain.journey.entity.ActionType;
import com.mallo.backend.domain.journey.entity.Journey;
import com.mallo.backend.domain.journey.entity.Protocol;
import com.mallo.backend.domain.journey.exception.JourneyErrorCode;
import com.mallo.backend.domain.journey.repository.JourneyRepository;
import com.mallo.backend.domain.journey.repository.ProtocolRepository;
import com.mallo.backend.global.exception.CustomException;

import lombok.RequiredArgsConstructor;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

/**
 * Quick Check 판단 + 저장.
 * procedure/elapsedDay는 sessionInfo 도메인이 가진 값이라 여기서 직접 조회하지 않고 파라미터로 받는다
 * (도메인 간 엔티티 연관관계 없이, 필요한 값만 호출부에서 넘겨주는 방식).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class JourneyService {

	private final JourneyRepository journeyRepository;
	private final ProtocolRepository protocolRepository;
	private final ObjectMapper objectMapper;

	@Transactional
	public Journey createCheck(UUID sessionId, String procedure, int elapsedDay,
			ActionType action, Map<String, Object> context) {
		List<Protocol> candidates = protocolRepository.findCandidates(procedure, action, elapsedDay);
		Protocol matched = findBestMatch(candidates, context);

		Journey journey = Journey.builder()
				.sessionId(sessionId)
				.elapsedDay(elapsedDay)
				.action(action)
				.context(writeJson(context))
				.decision(matched != null ? matched.getDecision() : null)
				.protocolRef(matched != null ? matched.getId().toString() : null)
				.guidance(matched != null ? matched.getGuidance() : null)
				.nextAction(matched != null ? matched.getNextAction() : null)
				.build();

		return journeyRepository.save(journey);
	}

	/**
	 * GET /v1/checks/{checkId} — 저장된 Quick Check 결과 단건 조회.
	 * 다른 세션의 check_id를 조회하려는 시도는 존재 여부를 흘리지 않도록 NOT_FOUND로 동일하게 처리한다.
	 */
	public Journey getCheck(UUID sessionId, UUID checkId) {
		Journey journey = journeyRepository.findById(checkId)
				.orElseThrow(() -> new CustomException(JourneyErrorCode.CHECK_NOT_FOUND));
		if (!journey.getSessionId().equals(sessionId)) {
			throw new CustomException(JourneyErrorCode.CHECK_NOT_FOUND);
		}
		return journey;
	}

	/**
	 * GET /v1/checks/today — 세션의 오늘(elapsed_day) Quick Check 기록 최신순 전체.
	 * 상위 N개만 보여주는 건 프론트 책임.
	 */
	public List<Journey> getTodayChecks(UUID sessionId, int elapsedDay) {
		return journeyRepository.findBySessionIdAndElapsedDayOrderByCreatedAtDesc(sessionId, elapsedDay);
	}

	/**
	 * conditions를 만족하는 후보 중, 조건 키가 가장 많은(=가장 구체적인) 규칙을 우선한다.
	 * conditions가 비어있는 규칙은 해당 DAY/action에 항상 매칭되는 "기본 규칙" 취급.
	 */
	private Protocol findBestMatch(List<Protocol> candidates, Map<String, Object> context) {
		return candidates.stream()
				.filter(protocol -> matches(protocol, context))
				.max(Comparator.comparingInt(protocol -> readConditions(protocol).size()))
				.orElse(null);
	}

	private boolean matches(Protocol protocol, Map<String, Object> context) {
		Map<String, Object> required = readConditions(protocol);
		return required.entrySet().stream()
				.allMatch(entry -> Objects.equals(entry.getValue(), context.get(entry.getKey())));
	}

	private Map<String, Object> readConditions(Protocol protocol) {
		String conditions = protocol.getConditions();
		if (conditions == null || conditions.isBlank()) {
			return Map.of();
		}
		return objectMapper.readValue(conditions, new TypeReference<Map<String, Object>>() {
		});
	}

	private String writeJson(Map<String, Object> value) {
		return objectMapper.writeValueAsString(value == null ? Map.of() : value);
	}
}
