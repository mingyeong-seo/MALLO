package com.mallo.backend.domain.interaction.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.mallo.backend.domain.interaction.exception.InteractionErrorCode;
import com.mallo.backend.domain.journey.entity.ActionType;
import com.mallo.backend.domain.journey.entity.DecisionType;
import com.mallo.backend.domain.journey.entity.Protocol;
import com.mallo.backend.domain.interaction.port.AiTriageInput;
import com.mallo.backend.domain.interaction.port.AiTriagePort;
import com.mallo.backend.domain.interaction.port.AiTriageResult;
import com.mallo.backend.domain.journey.port.SessionQueryPort;
import com.mallo.backend.domain.journey.port.SessionSnapshot;
import com.mallo.backend.domain.journey.repository.ProtocolRepository;
import com.mallo.backend.domain.sessionInfo.entity.SessionInfo;
import com.mallo.backend.domain.sessionInfo.repository.SessionInfoRepository;
import com.mallo.backend.global.exception.CustomException;

/**
 * X-Session-Id 헤더 인가는 sessionInfo.SessionAuthenticationFilter가 DB에 실제로 있는
 * session_id인지로 판단하므로, 여기서 쓰는 sessionId는 SessionInfoRepository에 실제로 저장해야
 * 인증을 통과한다 (persistSession() 참고). elapsedDay/procedure 같은 비즈니스 값은 그대로
 * SessionQueryPort를 @MockitoBean으로 고정해서 결정론적으로 테스트한다.
 */
@SpringBootTest
@AutoConfigureMockMvc
class AskControllerTest {

	private static final String SESSION_HEADER = "X-Session-Id";

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ProtocolRepository protocolRepository;

	@Autowired
	private SessionInfoRepository sessionInfoRepository;

	@MockitoBean
	private SessionQueryPort sessionQueryPort;

	@MockitoBean
	private AiTriagePort aiTriagePort;

	private UUID persistSession() {
		SessionInfo sessionInfo = sessionInfoRepository.save(SessionInfo.builder()
				.procedure("REJURAN")
				.procedureAt(LocalDate.now())
				.clinicId("DERNA")
				.build());
		return sessionInfo.getId();
	}

	@Test
	void 헤더_없이_질문하면_401을_반환한다() throws Exception {
		mockMvc.perform(post("/v1/ask")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"question":"운동해도 되나요?"}
								"""))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void 질문이_빈_문자열이면_400을_반환한다() throws Exception {
		UUID sessionId = persistSession();
		when(sessionQueryPort.getSession(sessionId)).thenReturn(new SessionSnapshot("REJURAN", 2));

		mockMvc.perform(post("/v1/ask")
						.header(SESSION_HEADER, sessionId)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"question":""}
								"""))
				.andExpect(status().isBadRequest());
	}

	@Test
	void 의료_키워드_질문은_CONNECT_상태와_안내_문구를_반환한다() throws Exception {
		UUID sessionId = persistSession();
		when(sessionQueryPort.getSession(sessionId)).thenReturn(new SessionSnapshot("REJURAN", 2));

		mockMvc.perform(post("/v1/ask")
						.header(SESSION_HEADER, sessionId)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"question":"이 통증 정상인가요?"}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.interaction_id").isNotEmpty())
				.andExpect(jsonPath("$.data.session_id").value(sessionId.toString()))
				.andExpect(jsonPath("$.data.status").value("CONNECT"))
				.andExpect(jsonPath("$.data.decision").doesNotExist())
				.andExpect(jsonPath("$.data.message").value("이 질문은 의료진 확인이 필요해요."));
	}

	@Test
	void 매칭되는_Protocol이_있으면_MATCHED_상태와_decision_next_action을_반환한다() throws Exception {
		UUID sessionId = persistSession();
		when(sessionQueryPort.getSession(sessionId)).thenReturn(new SessionSnapshot("REJURAN", 2));
		when(aiTriagePort.triage(new AiTriageInput("사우나 가도 되나요?", "REJURAN", 2)))
				.thenReturn(complete(ActionType.HEAT, Map.of("heat_type", "SAUNA_STEAM")));
		Protocol protocol = protocolRepository.save(Protocol.builder()
				.procedure("REJURAN")
				.dayStart(1)
				.dayEnd(7)
				.action(ActionType.HEAT)
				.conditions("{\"heat_type\":\"SAUNA_STEAM\"}")
				.decision(DecisionType.POSTPONE)
				.guidance("사우나, 찜질방 등 열을 발생시키는 활동은 최소 1주일 피해주세요.")
				.nextAction("{\"type\":\"VIEW_ALTERNATIVE\",\"label\":\"저강도 대안 보기\"}")
				.version("rejuran-v1")
				.build());

		mockMvc.perform(post("/v1/ask")
						.header(SESSION_HEADER, sessionId)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"question":"사우나 가도 되나요?"}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.status").value("MATCHED"))
				.andExpect(jsonPath("$.data.decision").value("POSTPONE"))
				.andExpect(jsonPath("$.data.protocol_ref").value(protocol.getId().toString()))
				.andExpect(jsonPath("$.data.next_action.type").value("VIEW_ALTERNATIVE"))
				.andExpect(jsonPath("$.data.guidance").value("사우나, 찜질방 등 열을 발생시키는 활동은 최소 1주일 피해주세요."))
				.andExpect(jsonPath("$.data.message").doesNotExist());
	}

	@Test
	void AI가_CLARIFY로_분류하면_고정_되묻기_문구를_반환한다() throws Exception {
		UUID sessionId = persistSession();
		when(sessionQueryPort.getSession(sessionId)).thenReturn(new SessionSnapshot("REJURAN", 2));
		when(aiTriagePort.triage(new AiTriageInput("운동해도 되나요?", "REJURAN", 2)))
				.thenReturn(missing(ActionType.EXERCISE, "ASK_EXERCISE_INTENSITY"));

		mockMvc.perform(post("/v1/ask")
						.header(SESSION_HEADER, sessionId)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"question":"운동해도 되나요?"}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.status").value("CLARIFY"))
				.andExpect(jsonPath("$.data.action").value("EXERCISE"))
				.andExpect(jsonPath("$.data.message")
						.value("운동 강도가 어느 정도인가요? (가벼운 활동 / 땀나는 활동 / 고강도 활동)"));
	}

	@Test
	void AI_결과가_잘못되면_502를_반환한다() throws Exception {
		UUID sessionId = persistSession();
		when(sessionQueryPort.getSession(sessionId)).thenReturn(new SessionSnapshot("REJURAN", 2));
		when(aiTriagePort.triage(new AiTriageInput("오늘 가능한가요?", "REJURAN", 2)))
				.thenReturn(new AiTriageResult(UUID.randomUUID(), null, null, null, null, List.of(), null, List.of()));

		mockMvc.perform(post("/v1/ask")
						.header(SESSION_HEADER, sessionId)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"question":"오늘 가능한가요?"}
								"""))
				.andExpect(status().isBadGateway());
	}

	@Test
	void AI_CustomException은_502를_반환한다() throws Exception {
		UUID sessionId = persistSession();
		when(sessionQueryPort.getSession(sessionId)).thenReturn(new SessionSnapshot("REJURAN", 2));
		when(aiTriagePort.triage(new AiTriageInput("오늘 가능한가요?", "REJURAN", 2)))
				.thenThrow(new CustomException(InteractionErrorCode.AI_INVALID_RESPONSE));

		mockMvc.perform(post("/v1/ask")
						.header(SESSION_HEADER, sessionId)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"question":"오늘 가능한가요?"}
								"""))
				.andExpect(status().isBadGateway());
	}

	@Test
	void AI_호출은_AskService_트랜잭션_밖에서_실행된다() throws Exception {
		UUID sessionId = persistSession();
		when(sessionQueryPort.getSession(sessionId)).thenReturn(new SessionSnapshot("REJURAN", 2));
		when(aiTriagePort.triage(new AiTriageInput("붓기는 언제쯤 빠지나요?", "REJURAN", 2)))
				.then(invocation -> {
					assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
					return new AiTriageResult(UUID.randomUUID(), "GENERAL", null, null, null,
							List.of(), null, List.of());
				});

		mockMvc.perform(post("/v1/ask")
						.header(SESSION_HEADER, sessionId)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"question":"붓기는 언제쯤 빠지나요?"}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.status").value("GENERAL"));
	}

	@Test
	void photoRecordIds를_보내면_응답에_그대로_포함된다() throws Exception {
		UUID sessionId = persistSession();
		when(sessionQueryPort.getSession(sessionId)).thenReturn(new SessionSnapshot("REJURAN", 2));

		mockMvc.perform(post("/v1/ask")
						.header(SESSION_HEADER, sessionId)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"question":"이 붓기 정상인가요?","photo_record_ids":[1,2]}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.photo_record_ids[0]").value(1))
				.andExpect(jsonPath("$.data.photo_record_ids[1]").value(2));
	}

	private AiTriageResult complete(ActionType action, Map<String, String> context) {
		return new AiTriageResult(UUID.randomUUID(), "ACTION", "COMPLETE", action.name(), context,
				List.of(), null, List.of());
	}

	private AiTriageResult missing(ActionType action, String clarificationCode) {
		return new AiTriageResult(UUID.randomUUID(), "ACTION", "MISSING_CONTEXT", action.name(), Map.of(),
				List.of("missing"), clarificationCode, List.of());
	}
}
