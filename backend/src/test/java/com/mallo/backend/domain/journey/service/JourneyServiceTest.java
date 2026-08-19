package com.mallo.backend.domain.journey.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.mallo.backend.domain.journey.entity.ActionType;
import com.mallo.backend.domain.journey.entity.DecisionType;
import com.mallo.backend.domain.journey.entity.Journey;
import com.mallo.backend.domain.journey.entity.Protocol;
import com.mallo.backend.domain.journey.entity.QuickCheckStatus;
import com.mallo.backend.domain.journey.exception.JourneyErrorCode;
import com.mallo.backend.domain.journey.repository.JourneyRepository;
import com.mallo.backend.domain.journey.repository.ProtocolRepository;
import com.mallo.backend.global.exception.CustomException;

import tools.jackson.databind.ObjectMapper;

@ExtendWith(MockitoExtension.class)
class JourneyServiceTest {

	@Mock
	private JourneyRepository journeyRepository;

	@Mock
	private ProtocolRepository protocolRepository;

	private JourneyService journeyService;

	@BeforeEach
	void setUp() {
		// JSON 파싱/직렬화는 실제로 동작해야 의미가 있어서 mock 대신 진짜 ObjectMapper를 쓴다.
		journeyService = new JourneyService(journeyRepository, protocolRepository, new ObjectMapper());
	}

	// @GeneratedValue라 build() 직후엔 id가 null이라, 실제 저장된 것처럼 테스트용 id를 채워준다.
	private Protocol withRandomId(Protocol protocol) {
		ReflectionTestUtils.setField(protocol, "id", UUID.randomUUID());
		return protocol;
	}

	@Test
	void 매칭되는_Protocol이_없으면_decision과_protocolRef가_null인_채로_저장한다() {
		UUID sessionId = UUID.randomUUID();
		when(protocolRepository.findCandidates("REJURAN", ActionType.EXERCISE, 2))
				.thenReturn(List.of());
		when(journeyRepository.save(any(Journey.class))).thenAnswer(invocation -> invocation.getArgument(0));

		Journey result = journeyService.createCheck(
				sessionId, "REJURAN", 2, ActionType.EXERCISE, Map.of("intensity", "HIGH"));

		assertThat(result.getSessionId()).isEqualTo(sessionId);
		assertThat(result.getElapsedDay()).isEqualTo(2);
		assertThat(result.getAction()).isEqualTo(ActionType.EXERCISE);
		assertThat(result.getDecision()).isNull();
		assertThat(result.getProtocolRef()).isNull();
		assertThat(result.getContext()).contains("HIGH");
		assertThat(result.getGuidance()).isNull();
		assertThat(result.getNextAction()).isNull();
		assertThat(result.getStatus()).isEqualTo(QuickCheckStatus.NO_PROTOCOL);
	}

	@Test
	void 조건_없는_규칙은_context와_무관하게_매칭된다() {
		UUID sessionId = UUID.randomUUID();
		Protocol generic = withRandomId(Protocol.builder()
				.procedure("REJURAN")
				.dayStart(1)
				.dayEnd(7)
				.action(ActionType.EXERCISE)
				.conditions(null)
				.decision(DecisionType.POSSIBLE)
				.guidance("가볍게 진행하세요")
				.version("rejuran-v1")
				.build());
		when(protocolRepository.findCandidates("REJURAN", ActionType.EXERCISE, 2))
				.thenReturn(List.of(generic));
		when(journeyRepository.save(any(Journey.class))).thenAnswer(invocation -> invocation.getArgument(0));

		Journey result = journeyService.createCheck(
				sessionId, "REJURAN", 2, ActionType.EXERCISE, Map.of("intensity", "LOW"));

		assertThat(result.getDecision()).isEqualTo(DecisionType.POSSIBLE);
		assertThat(result.getProtocolRef()).isEqualTo(generic.getId().toString());
		assertThat(result.getGuidance()).isEqualTo("가볍게 진행하세요");
		assertThat(result.getStatus()).isEqualTo(QuickCheckStatus.MATCHED);
	}

	@Test
	void 조건이_안_맞는_후보는_매칭하지_않는다() {
		UUID sessionId = UUID.randomUUID();
		Protocol needsHighIntensity = Protocol.builder()
				.procedure("REJURAN")
				.dayStart(1)
				.dayEnd(7)
				.action(ActionType.EXERCISE)
				.conditions("{\"intensity\":\"HIGH\"}")
				.decision(DecisionType.POSTPONE)
				.guidance("격한 운동은 미루세요")
				.version("rejuran-v1")
				.build();
		when(protocolRepository.findCandidates("REJURAN", ActionType.EXERCISE, 2))
				.thenReturn(List.of(needsHighIntensity));
		when(journeyRepository.save(any(Journey.class))).thenAnswer(invocation -> invocation.getArgument(0));

		Journey result = journeyService.createCheck(
				sessionId, "REJURAN", 2, ActionType.EXERCISE, Map.of("intensity", "LOW"));

		assertThat(result.getDecision()).isNull();
		assertThat(result.getProtocolRef()).isNull();
	}

	@Test
	void 조건이_구체적인_규칙을_일반_규칙보다_우선한다() {
		UUID sessionId = UUID.randomUUID();
		Protocol generic = withRandomId(Protocol.builder()
				.procedure("REJURAN")
				.dayStart(1)
				.dayEnd(7)
				.action(ActionType.EXERCISE)
				.conditions(null)
				.decision(DecisionType.POSSIBLE)
				.guidance("가볍게 진행하세요")
				.version("rejuran-v1")
				.build());
		Protocol specific = withRandomId(Protocol.builder()
				.procedure("REJURAN")
				.dayStart(1)
				.dayEnd(7)
				.action(ActionType.EXERCISE)
				.conditions("{\"intensity\":\"HIGH\"}")
				.decision(DecisionType.POSTPONE)
				.guidance("격한 운동은 미루세요")
				.version("rejuran-v1")
				.build());
		when(protocolRepository.findCandidates("REJURAN", ActionType.EXERCISE, 2))
				.thenReturn(List.of(generic, specific));
		when(journeyRepository.save(any(Journey.class))).thenAnswer(invocation -> invocation.getArgument(0));

		Journey result = journeyService.createCheck(
				sessionId, "REJURAN", 2, ActionType.EXERCISE, Map.of("intensity", "HIGH"));

		assertThat(result.getDecision()).isEqualTo(DecisionType.POSTPONE);
		assertThat(result.getProtocolRef()).isEqualTo(specific.getId().toString());
	}

	@Test
	void getTodayChecks은_저장소_조회를_그대로_위임한다() {
		UUID sessionId = UUID.randomUUID();
		Journey journey = Journey.builder()
				.sessionId(sessionId)
				.elapsedDay(2)
				.action(ActionType.EXERCISE)
				.context("{}")
				.build();
		when(journeyRepository.findBySessionIdAndElapsedDayOrderByCreatedAtDesc(sessionId, 2))
				.thenReturn(List.of(journey));

		List<Journey> result = journeyService.getTodayChecks(sessionId, 2);

		assertThat(result).containsExactly(journey);
		verify(journeyRepository).findBySessionIdAndElapsedDayOrderByCreatedAtDesc(sessionId, 2);
	}

	@Test
	void getCheck은_같은_세션의_check_id면_그대로_반환한다() {
		UUID sessionId = UUID.randomUUID();
		UUID checkId = UUID.randomUUID();
		Journey journey = withRandomId(Journey.builder()
				.sessionId(sessionId)
				.elapsedDay(2)
				.action(ActionType.EXERCISE)
				.context("{}")
				.build());
		when(journeyRepository.findById(checkId)).thenReturn(Optional.of(journey));

		Journey result = journeyService.getCheck(sessionId, checkId);

		assertThat(result).isEqualTo(journey);
	}

	@Test
	void getCheck은_존재하지_않는_check_id면_CHECK_NOT_FOUND를_던진다() {
		UUID sessionId = UUID.randomUUID();
		UUID checkId = UUID.randomUUID();
		when(journeyRepository.findById(checkId)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> journeyService.getCheck(sessionId, checkId))
				.isInstanceOf(CustomException.class)
				.extracting(e -> ((CustomException) e).getErrorCode())
				.isEqualTo(JourneyErrorCode.CHECK_NOT_FOUND);
	}

	@Test
	void getCheck은_다른_세션의_check_id면_CHECK_NOT_FOUND를_던진다() {
		UUID ownerSessionId = UUID.randomUUID();
		UUID checkId = UUID.randomUUID();
		Journey journey = withRandomId(Journey.builder()
				.sessionId(ownerSessionId)
				.elapsedDay(2)
				.action(ActionType.EXERCISE)
				.context("{}")
				.build());
		when(journeyRepository.findById(checkId)).thenReturn(Optional.of(journey));

		UUID otherSessionId = UUID.randomUUID();
		assertThatThrownBy(() -> journeyService.getCheck(otherSessionId, checkId))
				.isInstanceOf(CustomException.class)
				.extracting(e -> ((CustomException) e).getErrorCode())
				.isEqualTo(JourneyErrorCode.CHECK_NOT_FOUND);
	}

	// Journey는 @GeneratedValue(id)라 build() 직후엔 id가 null이라, 실제 저장된 것처럼 테스트용 id를 채워준다.
	private Journey withRandomId(Journey journey) {
		ReflectionTestUtils.setField(journey, "id", UUID.randomUUID());
		return journey;
	}
}
