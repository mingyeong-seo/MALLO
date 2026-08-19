package com.mallo.backend.domain.interaction.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.mallo.backend.domain.interaction.dto.AskRequest;
import com.mallo.backend.domain.interaction.dto.AskResponse;
import com.mallo.backend.domain.interaction.entity.Interaction;
import com.mallo.backend.domain.interaction.entity.InteractionStatus;
import com.mallo.backend.domain.interaction.repository.InteractionRepository;
import com.mallo.backend.domain.journey.entity.ActionType;
import com.mallo.backend.domain.journey.entity.DecisionType;
import com.mallo.backend.domain.journey.entity.Protocol;
import com.mallo.backend.domain.journey.port.SessionSnapshot;
import com.mallo.backend.domain.journey.repository.ProtocolRepository;

import tools.jackson.databind.ObjectMapper;

@ExtendWith(MockitoExtension.class)
class AskServiceTest {

	@Mock
	private InteractionRepository interactionRepository;

	@Mock
	private ProtocolRepository protocolRepository;

	private AskService askService;

	private final UUID sessionId = UUID.randomUUID();
	private final SessionSnapshot session = new SessionSnapshot("REJURAN", 2);

	@BeforeEach
	void setUp() {
		// JSON 파싱/직렬화는 실제로 동작해야 의미가 있어서 mock 대신 진짜 ObjectMapper를 쓴다.
		askService = new AskService(interactionRepository, protocolRepository, new ObjectMapper());
		when(interactionRepository.save(any(Interaction.class)))
				.thenAnswer(invocation -> invocation.getArgument(0));
	}

	// Protocol은 @GeneratedValue라 build() 직후엔 id가 null이라, 실제 저장된 것처럼 테스트용 id를 채워준다.
	private Protocol withRandomId(Protocol protocol) {
		ReflectionTestUtils.setField(protocol, "id", UUID.randomUUID());
		return protocol;
	}

	@Test
	void 의료_키워드가_있으면_CONNECT로_저장하고_Protocol_조회는_하지_않는다() {
		AskRequest request = new AskRequest("이 통증 정상인가요?", null);

		AskResponse response = askService.ask(sessionId, session, request);

		assertThat(response.status()).isEqualTo(InteractionStatus.CONNECT);
		assertThat(response.action()).isNull();
		assertThat(response.decision()).isNull();
		assertThat(response.protocolRef()).isNull();
		assertThat(response.message()).isEqualTo("이 질문은 의료진 확인이 필요해요.");
	}

	@Test
	void 행동_키워드는_없고_회복_키워드만_있으면_GENERAL로_저장한다() {
		AskRequest request = new AskRequest("붓기는 언제쯤 빠지나요?", null);

		AskResponse response = askService.ask(sessionId, session, request);

		assertThat(response.status()).isEqualTo(InteractionStatus.GENERAL);
		assertThat(response.action()).isNull();
	}

	@Test
	void 회복과_무관한_질문이면_UNSUPPORTED로_저장한다() {
		AskRequest request = new AskRequest("오늘 날씨 어때요?", null);

		AskResponse response = askService.ask(sessionId, session, request);

		assertThat(response.status()).isEqualTo(InteractionStatus.UNSUPPORTED);
		assertThat(response.action()).isNull();
	}

	@Test
	void 행동_키워드는_있지만_세부_정보가_없으면_CLARIFY로_저장한다() {
		AskRequest request = new AskRequest("운동해도 되나요?", null);

		AskResponse response = askService.ask(sessionId, session, request);

		assertThat(response.status()).isEqualTo(InteractionStatus.CLARIFY);
		assertThat(response.action()).isEqualTo(ActionType.EXERCISE);
		assertThat(response.message()).isEqualTo("운동 강도가 어느 정도인가요? (가벼운 활동 / 땀나는 활동 / 고강도 활동)");
	}

	@Test
	void MAKEUP은_friction_정보가_없어도_UNKNOWN으로_채워서_CLARIFY로_가지_않는다() {
		when(protocolRepository.findCandidates("REJURAN", ActionType.MAKEUP, 2)).thenReturn(List.of());
		AskRequest request = new AskRequest("화장해도 되나요?", null);

		AskResponse response = askService.ask(sessionId, session, request);

		assertThat(response.status()).isEqualTo(InteractionStatus.NO_PROTOCOL);
		assertThat(response.action()).isEqualTo(ActionType.MAKEUP);
		assertThat(response.context()).contains("UNKNOWN");
	}

	@Test
	void 매칭되는_Protocol이_없으면_NO_PROTOCOL로_저장한다() {
		when(protocolRepository.findCandidates("REJURAN", ActionType.EXERCISE, 2)).thenReturn(List.of());
		AskRequest request = new AskRequest("고강도 운동 해도 되나요?", null);

		AskResponse response = askService.ask(sessionId, session, request);

		assertThat(response.status()).isEqualTo(InteractionStatus.NO_PROTOCOL);
		assertThat(response.action()).isEqualTo(ActionType.EXERCISE);
		assertThat(response.decision()).isNull();
		assertThat(response.protocolRef()).isNull();
	}

	@Test
	void 매칭되는_Protocol이_있으면_ANSWERABLE로_저장하고_decision과_안내를_채운다() {
		Protocol protocol = withRandomId(Protocol.builder()
				.procedure("REJURAN")
				.dayStart(1)
				.dayEnd(7)
				.action(ActionType.EXERCISE)
				.conditions("{\"intensity\":\"INTENSE_ACTIVITY\"}")
				.decision(DecisionType.POSTPONE)
				.guidance("고강도 운동은 피해주세요")
				.nextAction("{\"type\":\"VIEW_ALTERNATIVE\",\"label\":\"저강도 대안 보기\"}")
				.version("rejuran-v1")
				.build());
		when(protocolRepository.findCandidates("REJURAN", ActionType.EXERCISE, 2))
				.thenReturn(List.of(protocol));
		AskRequest request = new AskRequest("고강도 운동 해도 되나요?", null);

		AskResponse response = askService.ask(sessionId, session, request);

		assertThat(response.status()).isEqualTo(InteractionStatus.ANSWERABLE);
		assertThat(response.decision()).isEqualTo(DecisionType.POSTPONE);
		assertThat(response.message()).isEqualTo("고강도 운동은 피해주세요");
		assertThat(response.protocolRef()).isEqualTo(protocol.getId().toString());
		assertThat(response.nextAction()).isEqualTo("{\"type\":\"VIEW_ALTERNATIVE\",\"label\":\"저강도 대안 보기\"}");
	}

	@Test
	void 조건이_구체적인_Protocol이_조건_없는_규칙보다_우선한다() {
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
				.conditions("{\"intensity\":\"INTENSE_ACTIVITY\"}")
				.decision(DecisionType.POSTPONE)
				.guidance("고강도 운동은 피해주세요")
				.version("rejuran-v1")
				.build());
		when(protocolRepository.findCandidates("REJURAN", ActionType.EXERCISE, 2))
				.thenReturn(List.of(generic, specific));
		AskRequest request = new AskRequest("고강도 운동 해도 되나요?", null);

		AskResponse response = askService.ask(sessionId, session, request);

		assertThat(response.decision()).isEqualTo(DecisionType.POSTPONE);
		assertThat(response.protocolRef()).isEqualTo(specific.getId().toString());
	}

	@Test
	void photoRecordIds는_상태와_무관하게_그대로_저장되고_응답에_포함된다() {
		AskRequest request = new AskRequest("이 통증 정상인가요?", List.of(1L, 2L));

		AskResponse response = askService.ask(sessionId, session, request);

		assertThat(response.photoRecordIds()).containsExactly(1L, 2L);
	}
}
