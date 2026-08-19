package com.mallo.backend.domain.interaction.service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mallo.backend.domain.interaction.dto.AskRequest;
import com.mallo.backend.domain.interaction.dto.AskResponse;
import com.mallo.backend.domain.interaction.entity.Interaction;
import com.mallo.backend.domain.interaction.entity.InteractionStatus;
import com.mallo.backend.domain.interaction.repository.InteractionRepository;
import com.mallo.backend.domain.journey.entity.ActionType;
import com.mallo.backend.domain.journey.entity.Protocol;
import com.mallo.backend.domain.journey.port.SessionSnapshot;
import com.mallo.backend.domain.journey.repository.ProtocolRepository;

import lombok.RequiredArgsConstructor;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

/**
 * ASK MALLO 질문을 6가지 상태(ANSWERABLE/CLARIFY/CONNECT/NO_PROTOCOL/GENERAL/UNSUPPORTED)로 분류한
 * 실제 AI 분류/생성 대신 키워드 기반 규칙으로 판단하는 MVP 버전. Protocol 매칭은 journey 도메인 것을 재사용
 */
@Service
@RequiredArgsConstructor
public class AskService {

	private static final Set<String> MEDICAL_KEYWORDS =
			Set.of("부작용", "질환", "병", "약", "치료", "진료", "정상인가", "비정상", "아파", "아픈", "통증", "감염", "위험한가");

	private static final Set<String> RECOVERY_KEYWORDS =
			Set.of("회복", "시술", "관리", "붓기", "흉터", "재생", "케어", "피부");

	private static final Map<ActionType, Set<String>> ACTION_KEYWORDS = Map.of(
			ActionType.EXERCISE, Set.of("운동", "헬스", "조깅", "달리기", "워크아웃"),
			ActionType.MAKEUP, Set.of("화장", "메이크업"),
			ActionType.CLEANSING, Set.of("세안", "세수", "클렌징"),
			ActionType.SKINCARE, Set.of("스킨케어", "크림", "선크림", "자외선차단제", "레티놀"),
			ActionType.HEAT, Set.of("사우나", "찜질방", "반신욕", "목욕", "온천")
	);

	private final InteractionRepository interactionRepository;
	private final ProtocolRepository protocolRepository;
	private final ObjectMapper objectMapper;

	@Transactional
	public AskResponse ask(UUID sessionId, SessionSnapshot session, AskRequest request) {
		String question = request.question();

		if (containsAny(question, MEDICAL_KEYWORDS)) {
			return save(sessionId, question, InteractionStatus.CONNECT, null, null, null,
					request.photoRecordIds(), null, "이 질문은 의료진 확인이 필요해요.", null);
		}

		ActionType action = extractAction(question);
		if (action == null) {
			InteractionStatus status = containsAny(question, RECOVERY_KEYWORDS)
					? InteractionStatus.GENERAL
					: InteractionStatus.UNSUPPORTED;
			String message = status == InteractionStatus.GENERAL
					? "일반적인 회복 정보 질문으로 확인했어요. (MVP 안내 문구)"
					: "이 질문은 회복 관리 범위 밖이라 답변드리기 어려워요.";
			return save(sessionId, question, status, null, null, null,
					request.photoRecordIds(), null, message, null);
		}

		Map<String, Object> context = extractContext(action, question);
		if (context == null) {
			return save(sessionId, question, InteractionStatus.CLARIFY, action, null, null,
					request.photoRecordIds(), null, clarifyMessage(action), null);
		}

		List<Protocol> candidates = protocolRepository.findCandidates(session.procedure(), action, session.elapsedDay());
		Protocol matched = findBestMatch(candidates, context);

		String contextJson = writeJson(context);
		if (matched == null) {
			return save(sessionId, question, InteractionStatus.NO_PROTOCOL, action, contextJson, null,
					request.photoRecordIds(), null, "아직 확인하기 어려운 질문이에요.", null);
		}

		return save(sessionId, question, InteractionStatus.ANSWERABLE, action, contextJson,
				matched.getId().toString(), request.photoRecordIds(),
				matched.getDecision().name(), matched.getGuidance(), matched.getNextAction());
	}

	private AskResponse save(UUID sessionId, String question, InteractionStatus status, ActionType action,
			String context, String protocolRef, List<Long> photoRecordIds,
			String decisionName, String message, String nextAction) {
		Interaction interaction = new Interaction(sessionId, question, status, action, context, protocolRef, photoRecordIds);
		Interaction saved = interactionRepository.save(interaction);
		var decision = decisionName != null ? com.mallo.backend.domain.journey.entity.DecisionType.valueOf(decisionName) : null;
		return AskResponse.of(saved, decision, message, nextAction);
	}

	private boolean containsAny(String question, Set<String> keywords) {
		return keywords.stream().anyMatch(question::contains);
	}

	private ActionType extractAction(String question) {
		return ACTION_KEYWORDS.entrySet().stream()
				.filter(entry -> containsAny(question, entry.getValue()))
				.map(Map.Entry::getKey)
				.findFirst()
				.orElse(null);
	}

	/** action별로 필요한 context를 질문 텍스트에서 뽑는다. 못 뽑으면 null(=CLARIFY 필요). */
	private Map<String, Object> extractContext(ActionType action, String question) {
		return switch (action) {
			case EXERCISE -> extractOne(question, "intensity", Map.of(
					"고강도", "INTENSE_ACTIVITY", "격하게", "INTENSE_ACTIVITY", "헬스", "INTENSE_ACTIVITY",
					"땀", "SWEAT_ACTIVITY", "유산소", "SWEAT_ACTIVITY",
					"가벼운", "LIGHT_ACTIVITY", "산책", "LIGHT_ACTIVITY"));
			case CLEANSING -> extractOne(question, "method", Map.of(
					"가볍게", "GENTLE", "순하게", "GENTLE",
					"비비", "FRICTION", "문지르", "FRICTION",
					"각질", "EXFOLIATING", "스크럽", "EXFOLIATING"));
			case SKINCARE -> extractOne(question, "product_type", Map.of(
					"보습", "MOISTURIZING", "수분크림", "MOISTURIZING",
					"선크림", "SUNSCREEN", "자외선차단제", "SUNSCREEN",
					"레티놀", "RETINOID",
					"필링", "AHA_BHA", "스크럽", "SCRUB"));
			case HEAT -> extractOne(question, "heat_type", Map.of(
					"사우나", "SAUNA_STEAM", "찜질방", "SAUNA_STEAM", "스팀", "SAUNA_STEAM",
					"반신욕", "HOT_BATH_SHOWER", "목욕", "HOT_BATH_SHOWER", "온천", "HOT_BATH_SHOWER"));
			case MAKEUP -> {
				String friction = containsAny(question, Set.of("비비", "문지르")) ? "FRICTION"
						: containsAny(question, Set.of("가볍게", "살짝")) ? "GENTLE"
						: "UNKNOWN"; //MAKEUP은 모르면 UNKNOWN 자체가 유효 값이라 CLARIFY 안 함
				yield Map.of("friction", friction);
			}
		};
	}

	private Map<String, Object> extractOne(String question, String key, Map<String, String> keywordToValue) {
		return keywordToValue.entrySet().stream()
				.filter(entry -> question.contains(entry.getKey()))
				.map(entry -> Map.<String, Object>of(key, entry.getValue()))
				.findFirst()
				.orElse(null);
	}

	private String clarifyMessage(ActionType action) {
		return switch (action) {
			case EXERCISE -> "운동 강도가 어느 정도인가요? (가벼운 활동 / 땀나는 활동 / 고강도 활동)";
			case CLEANSING -> "세안은 어떻게 하시나요? (가볍게 / 문지르며 / 각질 제거)";
			case SKINCARE -> "어떤 제품을 쓰시나요? (보습 / 선크림 / 레티놀 / 필링·스크럽)";
			case HEAT -> "사우나/찜질방인가요, 반신욕/목욕인가요?";
			case MAKEUP -> "화장을 어떻게 하시나요? (가볍게 / 비비며)";
		};
	}

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
