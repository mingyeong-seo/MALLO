package com.mallo.backend.domain.interaction.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.mallo.backend.domain.journey.entity.ActionType;
import com.mallo.backend.domain.journey.entity.DecisionType;
import com.mallo.backend.domain.journey.entity.Protocol;
import com.mallo.backend.domain.journey.port.SessionQueryPort;
import com.mallo.backend.domain.journey.port.SessionSnapshot;
import com.mallo.backend.domain.journey.repository.ProtocolRepository;
import com.mallo.backend.domain.sessionInfo.entity.SessionInfo;
import com.mallo.backend.domain.sessionInfo.repository.SessionInfoRepository;

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
	void 매칭되는_Protocol이_있으면_ANSWERABLE_상태와_decision_next_action을_반환한다() throws Exception {
		UUID sessionId = persistSession();
		when(sessionQueryPort.getSession(sessionId)).thenReturn(new SessionSnapshot("REJURAN", 2));
		Protocol protocol = protocolRepository.save(Protocol.builder()
				.procedure("REJURAN")
				.dayStart(1)
				.dayEnd(7)
				.action(ActionType.HEAT)
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
				.andExpect(jsonPath("$.data.status").value("ANSWERABLE"))
				.andExpect(jsonPath("$.data.decision").value("POSTPONE"))
				.andExpect(jsonPath("$.data.protocol_ref").value(protocol.getId().toString()))
				.andExpect(jsonPath("$.data.next_action.type").value("VIEW_ALTERNATIVE"))
				.andExpect(jsonPath("$.data.message").value("사우나, 찜질방 등 열을 발생시키는 활동은 최소 1주일 피해주세요."));
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
}
