package com.mallo.backend.domain.journey.controller;

import static org.hamcrest.Matchers.notNullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
class JourneyControllerTest {

	private static final String SESSION_HEADER = "X-Session-Id";

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ProtocolRepository protocolRepository;

	@Autowired
	private SessionInfoRepository sessionInfoRepository;

	@MockitoBean
	private SessionQueryPort sessionQueryPort;

	// Security 인가를 통과시키기 위해 실제로 존재하는 session_id가 필요해서 매번 하나 저장해준다.
	private UUID persistSession() {
		SessionInfo sessionInfo = sessionInfoRepository.save(SessionInfo.builder()
				.procedure("REJURAN")
				.procedureAt(LocalDate.now())
				.clinicId("DERNA")
				.build());
		return sessionInfo.getId();
	}

	@Test
	void 헤더_없이_Quick_Check_요청하면_401을_반환한다() throws Exception {
		mockMvc.perform(post("/v1/checks")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"action":"EXERCISE","context":{}}
								"""))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void 매칭되는_Protocol이_없으면_decision_null인_201을_반환한다() throws Exception {
		UUID sessionId = persistSession();
		when(sessionQueryPort.getSession(sessionId)).thenReturn(new SessionSnapshot("REJURAN", 2));

		mockMvc.perform(post("/v1/checks")
						.header(SESSION_HEADER, sessionId)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"action":"EXERCISE","context":{"intensity":"LOW"}}
								"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.data.check_id", notNullValue()))
				.andExpect(jsonPath("$.data.session_id").value(sessionId.toString()))
				.andExpect(jsonPath("$.data.status").value("NO_PROTOCOL"))
				.andExpect(jsonPath("$.data.decision").doesNotExist())
				.andExpect(jsonPath("$.data.guidance").doesNotExist());
	}

	@Test
	void 매칭되는_Protocol이_있으면_그_decision과_protocol_ref를_반환한다() throws Exception {
		UUID sessionId = persistSession();
		when(sessionQueryPort.getSession(sessionId)).thenReturn(new SessionSnapshot("REJURAN", 2));
		Protocol protocol = protocolRepository.save(Protocol.builder()
				.procedure("REJURAN")
				.dayStart(1)
				.dayEnd(7)
				.action(ActionType.EXERCISE)
				.conditions("{\"intensity\":\"HIGH\"}")
				.decision(DecisionType.POSTPONE)
				.guidance("격한 운동은 미루세요")
				.version("rejuran-v1")
				.build());

		mockMvc.perform(post("/v1/checks")
						.header(SESSION_HEADER, sessionId)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"action":"EXERCISE","context":{"intensity":"HIGH"}}
								"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.data.status").value("MATCHED"))
				.andExpect(jsonPath("$.data.decision").value("POSTPONE"))
				.andExpect(jsonPath("$.data.guidance").value("격한 운동은 미루세요"))
				.andExpect(jsonPath("$.data.protocol_ref").value(protocol.getId().toString()))
				.andExpect(jsonPath("$.data.context.intensity").value("HIGH"));
	}

	@Test
	void today_조회는_같은_날_기록_전체를_최신순으로_반환한다() throws Exception {
		UUID sessionId = persistSession();
		when(sessionQueryPort.getSession(any())).thenReturn(new SessionSnapshot("REJURAN", 3));

		mockMvc.perform(post("/v1/checks")
				.header(SESSION_HEADER, sessionId)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"action":"CLEANSING","context":{}}
						"""));
		mockMvc.perform(post("/v1/checks")
				.header(SESSION_HEADER, sessionId)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"action":"MAKEUP","context":{}}
						"""));

		mockMvc.perform(get("/v1/checks/today").header(SESSION_HEADER, sessionId))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.length()").value(2))
				.andExpect(jsonPath("$.data[0].action").value("MAKEUP"))
				.andExpect(jsonPath("$.data[1].action").value("CLEANSING"));
	}

	@Test
	void check_id_단건_조회는_저장된_결과를_그대로_반환한다() throws Exception {
		// 이 테스트 클래스는 @SpringBootTest라 메서드 간 DB(H2)를 공유한다.
		// 다른 테스트가 이미 쓰는 action+conditions 조합과 겹치면 findCandidates가 후보를
		// 여러 건 반환해서 어느 protocol_ref가 매칭될지 불확실해지므로, 여기서만 쓰는 조합(HEAT)을 쓴다.
		UUID sessionId = persistSession();
		when(sessionQueryPort.getSession(sessionId)).thenReturn(new SessionSnapshot("REJURAN", 2));
		protocolRepository.save(Protocol.builder()
				.procedure("REJURAN")
				.dayStart(1)
				.dayEnd(7)
				.action(ActionType.HEAT)
				.decision(DecisionType.POSTPONE)
				.guidance("사우나, 찜질방 등 열을 발생시키는 활동은 최소 1주일 피해주세요.")
				.nextAction("{\"type\":\"VIEW_ALTERNATIVE\",\"label\":\"저강도 대안 보기\"}")
				.version("rejuran-v1")
				.build());

		String body = mockMvc.perform(post("/v1/checks")
						.header(SESSION_HEADER, sessionId)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"action":"HEAT","context":{}}
								"""))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();
		String checkId = com.jayway.jsonpath.JsonPath.read(body, "$.data.check_id");

		mockMvc.perform(get("/v1/checks/" + checkId).header(SESSION_HEADER, sessionId))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.check_id").value(checkId))
				.andExpect(jsonPath("$.data.status").value("MATCHED"))
				.andExpect(jsonPath("$.data.decision").value("POSTPONE"))
				.andExpect(jsonPath("$.data.guidance").value("사우나, 찜질방 등 열을 발생시키는 활동은 최소 1주일 피해주세요."))
				.andExpect(jsonPath("$.data.next_action.type").value("VIEW_ALTERNATIVE"));
	}

	@Test
	void check_id_단건_조회는_존재하지_않으면_404를_반환한다() throws Exception {
		UUID sessionId = persistSession();

		mockMvc.perform(get("/v1/checks/" + UUID.randomUUID()).header(SESSION_HEADER, sessionId))
				.andExpect(status().isNotFound());
	}

	@Test
	void check_id_단건_조회는_다른_세션_소유면_404를_반환한다() throws Exception {
		UUID ownerSessionId = persistSession();
		when(sessionQueryPort.getSession(ownerSessionId)).thenReturn(new SessionSnapshot("REJURAN", 2));

		String body = mockMvc.perform(post("/v1/checks")
						.header(SESSION_HEADER, ownerSessionId)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"action":"CLEANSING","context":{}}
								"""))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();
		String checkId = com.jayway.jsonpath.JsonPath.read(body, "$.data.check_id");

		UUID otherSessionId = persistSession();
		mockMvc.perform(get("/v1/checks/" + checkId).header(SESSION_HEADER, otherSessionId))
				.andExpect(status().isNotFound());
	}
}
