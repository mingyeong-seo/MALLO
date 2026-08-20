package com.mallo.backend.domain.interaction.service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.mallo.backend.domain.interaction.dto.AskRequest;
import com.mallo.backend.domain.interaction.dto.AskResponse;
import com.mallo.backend.domain.interaction.entity.Interaction;
import com.mallo.backend.domain.interaction.entity.InteractionStatus;
import com.mallo.backend.domain.interaction.exception.InteractionErrorCode;
import com.mallo.backend.domain.interaction.port.AiTriageInput;
import com.mallo.backend.domain.interaction.port.AiTriagePort;
import com.mallo.backend.domain.interaction.port.AiTriageResult;
import com.mallo.backend.domain.interaction.repository.InteractionRepository;
import com.mallo.backend.domain.journey.entity.ActionType;
import com.mallo.backend.domain.journey.entity.Protocol;
import com.mallo.backend.domain.journey.port.SessionSnapshot;
import com.mallo.backend.domain.journey.repository.ProtocolRepository;
import com.mallo.backend.global.exception.CustomException;

import lombok.RequiredArgsConstructor;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

/**
 * ASK MALLO 질문을 6가지 상태(MATCHED/CLARIFY/CONNECT/NO_PROTOCOL/GENERAL/UNSUPPORTED)로 분류한
 * 뒤 Protocol 매칭은 journey 도메인 것을 재사용한다.
 */
@Service
@RequiredArgsConstructor
public class AskService {

	private static final Set<String> SYMPTOM_KEYWORDS =
			Set.of("부작용", "정상인가", "비정상", "아파", "아픈", "통증", "감염", "위험한가");

	private static final Set<String> MEDICATION_TREATMENT_KEYWORDS =
			Set.of("약 먹", "약먹", "약을", "약 추천", "약추천", "복용", "연고", "항생제", "진통제",
					"스테로이드", "처방", "용량", "투약", "치료", "진료");

	private static final Set<String> DIAGNOSIS_KEYWORDS =
			Set.of("질환", "병인가", "감염인가", "의사처럼", "전문가처럼", "병원에 가", "병원 가", "응급실",
					"의료진 확인", "의사에게");

	private final InteractionRepository interactionRepository;
	private final ProtocolRepository protocolRepository;
	private final AiTriagePort aiTriagePort;
	private final ObjectMapper objectMapper;

	public AskResponse ask(UUID sessionId, SessionSnapshot session, AskRequest request) {
		String question = request.question();

		if (isHighRisk(question)) {
			return save(sessionId, question, InteractionStatus.CONNECT, null, null, null,
					request.photoRecordIds(), null, null, "이 질문은 의료진 확인이 필요해요.", null);
		}

		if (AskScopePolicy.isClearlyUnsupported(question)) {
			return saveUnsupported(sessionId, request);
		}

		AiTriageResult triageResult = aiTriagePort.triage(
				new AiTriageInput(question, session.procedure(), session.elapsedDay()));
		return switch (routeOf(triageResult)) {
			case "ACTION" -> handleAction(sessionId, session, request, triageResult);
			case "CONNECT" -> save(sessionId, question, InteractionStatus.CONNECT, null, null, null,
					request.photoRecordIds(), null, null, "이 질문은 의료진 확인이 필요해요.", null);
			case "GENERAL" -> save(sessionId, question, InteractionStatus.GENERAL, null, null, null,
					request.photoRecordIds(), null, null, "일반적인 회복 정보 질문으로 확인했어요. (MVP 안내 문구)", null);
			case "UNSUPPORTED" -> saveUnsupported(sessionId, request);
			default -> throw new CustomException(InteractionErrorCode.AI_INVALID_RESPONSE);
		};
	}

	private AskResponse handleAction(UUID sessionId, SessionSnapshot session, AskRequest request,
			AiTriageResult triageResult) {
		ActionType action = actionOf(triageResult);

		return switch (actionStateOf(triageResult)) {
			case "COMPLETE" -> handleCompleteAction(sessionId, session, request, action, completeContextOf(triageResult));
			case "MISSING_CONTEXT" -> save(sessionId, request.question(), InteractionStatus.CLARIFY, action, null, null,
					request.photoRecordIds(), null, null, clarifyMessage(clarificationCodeOf(triageResult)), null);
			default -> throw new CustomException(InteractionErrorCode.AI_INVALID_RESPONSE);
		};
	}

	private AskResponse handleCompleteAction(UUID sessionId, SessionSnapshot session, AskRequest request,
			ActionType action, Map<String, String> context) {
		List<Protocol> candidates = protocolRepository.findCandidates(session.procedure(), action, session.elapsedDay());
		Protocol matched = findBestMatch(candidates, context);

		String contextJson = writeJson(context);
		if (matched == null) {
			return save(sessionId, request.question(), InteractionStatus.NO_PROTOCOL, action, contextJson, null,
					request.photoRecordIds(), null, null, "아직 확인하기 어려운 질문이에요.", null);
		}

		// status가 MATCHED일 때는 message가 아니라 guidance로 내려서 Quick Check(S08) 응답과 같은 구조를 재사용한다.
		return save(sessionId, request.question(), InteractionStatus.MATCHED, action, contextJson,
				matched.getId().toString(), request.photoRecordIds(),
				matched.getDecision().name(), matched.getGuidance(), null, matched.getNextAction());
	}

	private AskResponse save(UUID sessionId, String question, InteractionStatus status, ActionType action,
			String context, String protocolRef, List<Long> photoRecordIds,
			String decisionName, String guidance, String message, String nextAction) {
		Interaction interaction = new Interaction(sessionId, question, status, action, context, protocolRef, photoRecordIds);
		Interaction saved = interactionRepository.save(interaction);
		var decision = decisionName != null ? com.mallo.backend.domain.journey.entity.DecisionType.valueOf(decisionName) : null;
		return AskResponse.of(saved, decision, guidance, message, nextAction);
	}

	private boolean containsAny(String question, Set<String> keywords) {
		return keywords.stream().anyMatch(question::contains);
	}

	private boolean isHighRisk(String question) {
		return containsAny(question, SYMPTOM_KEYWORDS)
				|| containsAny(question, MEDICATION_TREATMENT_KEYWORDS)
				|| containsAny(question, DIAGNOSIS_KEYWORDS);
	}

	private AskResponse saveUnsupported(UUID sessionId, AskRequest request) {
		return save(sessionId, request.question(), InteractionStatus.UNSUPPORTED, null, null, null,
				request.photoRecordIds(), null, null, "이 질문은 회복 관리 범위 밖이라 답변드리기 어려워요.", null);
	}

	private String routeOf(AiTriageResult triageResult) {
		if (triageResult == null || triageResult.route() == null) {
			throw new CustomException(InteractionErrorCode.AI_INVALID_RESPONSE);
		}
		return switch (triageResult.route()) {
			case "ACTION", "CONNECT", "GENERAL", "UNSUPPORTED" -> triageResult.route();
			default -> throw new CustomException(InteractionErrorCode.AI_INVALID_RESPONSE);
		};
	}

	private String actionStateOf(AiTriageResult triageResult) {
		if (triageResult.actionState() == null) {
			throw new CustomException(InteractionErrorCode.AI_INVALID_RESPONSE);
		}
		return switch (triageResult.actionState()) {
			case "COMPLETE", "MISSING_CONTEXT" -> triageResult.actionState();
			default -> throw new CustomException(InteractionErrorCode.AI_INVALID_RESPONSE);
		};
	}

	private ActionType actionOf(AiTriageResult triageResult) {
		if (triageResult.action() == null) {
			throw new CustomException(InteractionErrorCode.AI_INVALID_RESPONSE);
		}
		try {
			return ActionType.valueOf(triageResult.action());
		} catch (IllegalArgumentException exception) {
			throw new CustomException(InteractionErrorCode.AI_INVALID_RESPONSE);
		}
	}

	private Map<String, String> completeContextOf(AiTriageResult triageResult) {
		if (triageResult.context() == null) {
			throw new CustomException(InteractionErrorCode.AI_INVALID_RESPONSE);
		}
		return triageResult.context();
	}

	private String clarificationCodeOf(AiTriageResult triageResult) {
		if (triageResult.context() == null || !triageResult.context().isEmpty()
				|| triageResult.clarificationCode() == null) {
			throw new CustomException(InteractionErrorCode.AI_INVALID_RESPONSE);
		}
		return triageResult.clarificationCode();
	}

	private String clarifyMessage(String clarificationCode) {
		return switch (clarificationCode) {
			case "ASK_EXERCISE_INTENSITY" -> "운동 강도가 어느 정도인가요? (가벼운 활동 / 땀나는 활동 / 고강도 활동)";
			case "ASK_CLEANSING_METHOD" -> "세안은 어떻게 하시나요? (가볍게 / 문지르며 / 각질 제거)";
			case "ASK_SKINCARE_PRODUCT_TYPE" -> "어떤 제품을 쓰시나요? (보습 / 선크림 / 레티놀 / 필링·스크럽)";
			case "ASK_HEAT_TYPE" -> "사우나/찜질방인가요, 반신욕/목욕인가요?";
			default -> throw new CustomException(InteractionErrorCode.AI_INVALID_RESPONSE);
		};
	}

	private Protocol findBestMatch(List<Protocol> candidates, Map<String, String> context) {
		return candidates.stream()
				.filter(protocol -> matches(protocol, context))
				.max(Comparator.comparingInt(protocol -> readConditions(protocol).size()))
				.orElse(null);
	}

	private boolean matches(Protocol protocol, Map<String, String> context) {
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

	private String writeJson(Map<String, String> value) {
		return objectMapper.writeValueAsString(value == null ? Map.of() : value);
	}
}
