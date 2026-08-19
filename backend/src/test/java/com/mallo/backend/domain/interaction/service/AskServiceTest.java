package com.mallo.backend.domain.interaction.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

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
import com.mallo.backend.domain.journey.entity.DecisionType;
import com.mallo.backend.domain.journey.entity.Protocol;
import com.mallo.backend.domain.journey.port.SessionSnapshot;
import com.mallo.backend.domain.journey.repository.ProtocolRepository;
import com.mallo.backend.global.exception.CustomException;

import tools.jackson.databind.ObjectMapper;

@ExtendWith(MockitoExtension.class)
class AskServiceTest {

	@Mock
	private InteractionRepository interactionRepository;

	@Mock
	private ProtocolRepository protocolRepository;

	private FakeAiTriagePort aiTriagePort;
	private AskService askService;

	private final UUID sessionId = UUID.randomUUID();
	private final SessionSnapshot session = new SessionSnapshot("REJURAN", 2);

	@BeforeEach
	void setUp() {
		// JSON 파싱/직렬화는 실제로 동작해야 의미가 있어서 mock 대신 진짜 ObjectMapper를 쓴다.
		aiTriagePort = new FakeAiTriagePort();
		askService = new AskService(interactionRepository, protocolRepository, aiTriagePort, new ObjectMapper());
		lenient().when(interactionRepository.save(any(Interaction.class)))
				.thenAnswer(invocation -> invocation.getArgument(0));
	}

	// Protocol은 @GeneratedValue라 build() 직후엔 id가 null이라, 실제 저장된 것처럼 테스트용 id를 채워준다.
	private Protocol withRandomId(Protocol protocol) {
		ReflectionTestUtils.setField(protocol, "id", UUID.randomUUID());
		return protocol;
	}

	@Test
	void 의료_키워드가_있으면_CONNECT로_저장하고_AI와_Protocol_조회는_하지_않는다() {
		AskRequest request = new AskRequest("이 통증 정상인가요?", null);

		AskResponse response = askService.ask(sessionId, session, request);

		assertThat(response.status()).isEqualTo(InteractionStatus.CONNECT);
		assertThat(response.action()).isNull();
		assertThat(response.decision()).isNull();
		assertThat(response.protocolRef()).isNull();
		assertThat(response.message()).isEqualTo("이 질문은 의료진 확인이 필요해요.");
		assertThat(aiTriagePort.callCount()).isZero();
		verify(protocolRepository, never()).findCandidates(any(), any(), anyInt());
	}

	@Test
	void AI가_GENERAL로_분류하면_고정_백엔드_문구로_저장한다() {
		aiTriagePort.willReturn(general());
		AskRequest request = new AskRequest("붓기는 언제쯤 빠지나요?", null);

		AskResponse response = askService.ask(sessionId, session, request);

		assertThat(response.status()).isEqualTo(InteractionStatus.GENERAL);
		assertThat(response.action()).isNull();
		assertThat(response.message()).isEqualTo("일반적인 회복 정보 질문으로 확인했어요. (MVP 안내 문구)");
		assertThat(aiTriagePort.lastInput())
				.isEqualTo(new AiTriageInput("붓기는 언제쯤 빠지나요?", "REJURAN", 2));
	}

	@Test
	void AI가_UNSUPPORTED로_분류하면_고정_백엔드_문구로_저장한다() {
		aiTriagePort.willReturn(unsupported());
		AskRequest request = new AskRequest("오늘 날씨 어때요?", null);

		AskResponse response = askService.ask(sessionId, session, request);

		assertThat(response.status()).isEqualTo(InteractionStatus.UNSUPPORTED);
		assertThat(response.action()).isNull();
		assertThat(response.message()).isEqualTo("이 질문은 회복 관리 범위 밖이라 답변드리기 어려워요.");
	}

	@Test
	void ACTION_MISSING_CONTEXT는_clarification_code를_고정_한국어_질문으로_매핑한다() {
		aiTriagePort.willReturn(missing(ActionType.EXERCISE, "ASK_EXERCISE_INTENSITY"));
		AskRequest request = new AskRequest("운동해도 되나요?", null);

		AskResponse response = askService.ask(sessionId, session, request);

		assertThat(response.status()).isEqualTo(InteractionStatus.CLARIFY);
		assertThat(response.action()).isEqualTo(ActionType.EXERCISE);
		assertThat(response.context()).isNull();
		assertThat(response.message()).isEqualTo("운동 강도가 어느 정도인가요? (가벼운 활동 / 땀나는 활동 / 고강도 활동)");
	}

	@ParameterizedTest
	@MethodSource("clarificationCases")
	void 모든_MISSING_CONTEXT_clarification_code는_고정_한국어_질문으로_매핑한다(
			ActionType action, String clarificationCode, String expectedMessage) {
		aiTriagePort.willReturn(missing(action, clarificationCode));
		AskRequest request = new AskRequest("세부 조건을 확인해주세요", null);

		AskResponse response = askService.ask(sessionId, session, request);

		assertThat(response.status()).isEqualTo(InteractionStatus.CLARIFY);
		assertThat(response.action()).isEqualTo(action);
		assertThat(response.message()).isEqualTo(expectedMessage);
	}

	@Test
	void AI가_CONNECT로_분류하면_고정_백엔드_문구로_저장한다() {
		aiTriagePort.willReturn(connect());
		AskRequest request = new AskRequest("이 상태를 봐주세요", null);

		AskResponse response = askService.ask(sessionId, session, request);

		assertThat(response.status()).isEqualTo(InteractionStatus.CONNECT);
		assertThat(response.action()).isNull();
		assertThat(response.message()).isEqualTo("이 질문은 의료진 확인이 필요해요.");
	}

	@Test
	void MAKEUP_COMPLETE는_AI_context_UNKNOWN을_Protocol_매칭에_쓴다() {
		aiTriagePort.willReturn(complete(ActionType.MAKEUP, Map.of("friction", "UNKNOWN")));
		when(protocolRepository.findCandidates("REJURAN", ActionType.MAKEUP, 2)).thenReturn(List.of());
		AskRequest request = new AskRequest("화장해도 되나요?", null);

		AskResponse response = askService.ask(sessionId, session, request);

		assertThat(response.status()).isEqualTo(InteractionStatus.NO_PROTOCOL);
		assertThat(response.action()).isEqualTo(ActionType.MAKEUP);
		assertThat(response.context()).contains("UNKNOWN");
	}

	@Test
	void 매칭되는_Protocol이_없으면_NO_PROTOCOL로_저장한다() {
		aiTriagePort.willReturn(complete(ActionType.EXERCISE, Map.of("intensity", "INTENSE_ACTIVITY")));
		when(protocolRepository.findCandidates("REJURAN", ActionType.EXERCISE, 2)).thenReturn(List.of());
		AskRequest request = new AskRequest("고강도 운동 해도 되나요?", null);

		AskResponse response = askService.ask(sessionId, session, request);

		assertThat(response.status()).isEqualTo(InteractionStatus.NO_PROTOCOL);
		assertThat(response.action()).isEqualTo(ActionType.EXERCISE);
		assertThat(response.decision()).isNull();
		assertThat(response.protocolRef()).isNull();
	}

	@Test
	void AI가_행동을_추출해도_최종_판정은_Protocol에서만_가져온다() {
		aiTriagePort.willReturn(complete(ActionType.EXERCISE, Map.of("intensity", "INTENSE_ACTIVITY")));
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

		assertThat(response.status()).isEqualTo(InteractionStatus.MATCHED);
		assertThat(response.decision()).isEqualTo(DecisionType.POSTPONE);
		assertThat(response.guidance()).isEqualTo("고강도 운동은 피해주세요");
		assertThat(response.message()).isNull();
		assertThat(response.protocolRef()).isEqualTo(protocol.getId().toString());
		assertThat(response.nextAction()).isEqualTo("{\"type\":\"VIEW_ALTERNATIVE\",\"label\":\"저강도 대안 보기\"}");
	}

	@Test
	void 조건이_구체적인_Protocol이_조건_없는_규칙보다_우선한다() {
		aiTriagePort.willReturn(complete(ActionType.EXERCISE, Map.of("intensity", "INTENSE_ACTIVITY")));
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
		aiTriagePort.willReturn(general());
		AskRequest request = new AskRequest("이 통증 정상인가요?", List.of(1L, 2L));

		AskResponse response = askService.ask(sessionId, session, request);

		assertThat(response.photoRecordIds()).containsExactly(1L, 2L);
	}

	@Test
	void AI_오류는_그대로_전파하고_Interaction을_저장하지_않는다() {
		aiTriagePort.willThrow(new CustomException(InteractionErrorCode.AI_UNAVAILABLE));
		AskRequest request = new AskRequest("격한 운동해도 될까요?", null);

		assertThatThrownBy(() -> askService.ask(sessionId, session, request))
				.isInstanceOfSatisfying(CustomException.class,
						exception -> assertThat(exception.getErrorCode())
								.isEqualTo(InteractionErrorCode.AI_UNAVAILABLE));

		verify(interactionRepository, never()).save(any(Interaction.class));
	}

	@Test
	void 질문에_행동_키워드가_있어도_AI가_GENERAL이면_로컬_action_파서를_쓰지_않는다() {
		aiTriagePort.willReturn(general());
		AskRequest request = new AskRequest("운동 관련해서 회복 정보가 궁금해요", null);

		AskResponse response = askService.ask(sessionId, session, request);

		assertThat(response.status()).isEqualTo(InteractionStatus.GENERAL);
		assertThat(response.action()).isNull();
		verify(protocolRepository, never()).findCandidates(any(), any(), anyInt());
	}

	@Test
	void 약산성처럼_일반_표현의_약은_의료_precheck로_오탐하지_않는다() {
		aiTriagePort.willReturn(general());
		AskRequest request = new AskRequest("약산성 세안제로 세안해도 되나요?", null);

		AskResponse response = askService.ask(sessionId, session, request);

		assertThat(response.status()).isEqualTo(InteractionStatus.GENERAL);
		assertThat(aiTriagePort.callCount()).isOne();
	}

	@Test
	void 질문에_행동_키워드가_없어도_AI가_ACTION이면_Protocol을_조회한다() {
		aiTriagePort.willReturn(complete(ActionType.HEAT, Map.of("heat_type", "SAUNA_STEAM")));
		when(protocolRepository.findCandidates("REJURAN", ActionType.HEAT, 2)).thenReturn(List.of());
		AskRequest request = new AskRequest("오늘 가능한지 확인해줘", null);

		AskResponse response = askService.ask(sessionId, session, request);

		assertThat(response.status()).isEqualTo(InteractionStatus.NO_PROTOCOL);
		assertThat(response.action()).isEqualTo(ActionType.HEAT);
	}

	private AiTriageResult complete(ActionType action, Map<String, String> context) {
		return new AiTriageResult(UUID.randomUUID(), "ACTION", "COMPLETE", action.name(), context,
				List.of(), null, List.of());
	}

	private static Stream<Arguments> clarificationCases() {
		return Stream.of(
				Arguments.of(ActionType.EXERCISE, "ASK_EXERCISE_INTENSITY",
						"운동 강도가 어느 정도인가요? (가벼운 활동 / 땀나는 활동 / 고강도 활동)"),
				Arguments.of(ActionType.CLEANSING, "ASK_CLEANSING_METHOD",
						"세안은 어떻게 하시나요? (가볍게 / 문지르며 / 각질 제거)"),
				Arguments.of(ActionType.SKINCARE, "ASK_SKINCARE_PRODUCT_TYPE",
						"어떤 제품을 쓰시나요? (보습 / 선크림 / 레티놀 / 필링·스크럽)"),
				Arguments.of(ActionType.HEAT, "ASK_HEAT_TYPE",
						"사우나/찜질방인가요, 반신욕/목욕인가요?")
		);
	}

	private AiTriageResult missing(ActionType action, String clarificationCode) {
		return new AiTriageResult(UUID.randomUUID(), "ACTION", "MISSING_CONTEXT", action.name(), Map.of(),
				List.of("missing"), clarificationCode, List.of());
	}

	private AiTriageResult connect() {
		return new AiTriageResult(UUID.randomUUID(), "CONNECT", null, null, null,
				List.of(), null, List.of("SYMPTOM_JUDGMENT"));
	}

	private AiTriageResult general() {
		return new AiTriageResult(UUID.randomUUID(), "GENERAL", null, null, null,
				List.of(), null, List.of());
	}

	private AiTriageResult unsupported() {
		return new AiTriageResult(UUID.randomUUID(), "UNSUPPORTED", null, null, null,
				List.of(), null, List.of());
	}

	private static final class FakeAiTriagePort implements AiTriagePort {

		private AiTriageResult result;
		private RuntimeException failure;
		private int callCount;
		private AiTriageInput lastInput;

		void willReturn(AiTriageResult result) {
			this.result = result;
			this.failure = null;
		}

		void willThrow(RuntimeException failure) {
			this.failure = failure;
			this.result = null;
		}

		int callCount() {
			return callCount;
		}

		AiTriageInput lastInput() {
			return lastInput;
		}

		@Override
		public AiTriageResult triage(AiTriageInput input) {
			callCount++;
			lastInput = input;
			if (failure != null) {
				throw failure;
			}
			return result;
		}
	}
}
