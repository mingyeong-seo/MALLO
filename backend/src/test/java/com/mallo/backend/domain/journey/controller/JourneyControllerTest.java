package com.mallo.backend.domain.journey.controller;

import static org.hamcrest.Matchers.notNullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.mallo.backend.domain.journey.entity.ActionType;
import com.mallo.backend.domain.journey.entity.DecisionType;
import com.mallo.backend.domain.journey.entity.Protocol;
import com.mallo.backend.domain.journey.port.SessionQueryPort;
import com.mallo.backend.domain.journey.port.SessionSnapshot;
import com.mallo.backend.domain.journey.repository.ProtocolRepository;

/**
 * sessionInfo 도메인이 이 브랜치엔 없어서 SessionQueryPort는 @MockitoBean으로 대체한다.
 * 헤더 인가(Security)는 sessionInfo 쪽 몫이라 이 테스트 시점엔 적용되어 있지 않다 —
 * 그래서 "헤더 없음"이 지금은 401이 아니라 500으로 응답된다 (머지 후 Security가 붙으면 401로 바뀔 것).
 */
@SpringBootTest
@AutoConfigureMockMvc
class JourneyControllerTest {

	private static final String SESSION_HEADER = "X-Session-Id";

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ProtocolRepository protocolRepository;

	@MockitoBean
	private SessionQueryPort sessionQueryPort;

	@Test
	void 헤더_없이_Quick_Check_요청하면_실패한다() throws Exception {
		mockMvc.perform(post("/v1/checks")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"action":"EXERCISE","context":{}}
								"""))
				.andExpect(status().is5xxServerError());
	}

	@Test
	void 매칭되는_Protocol이_없으면_decision_null인_201을_반환한다() throws Exception {
		UUID sessionId = UUID.randomUUID();
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
				.andExpect(jsonPath("$.data.decision").doesNotExist());
	}

	@Test
	void 매칭되는_Protocol이_있으면_그_decision과_protocol_ref를_반환한다() throws Exception {
		UUID sessionId = UUID.randomUUID();
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
				.andExpect(jsonPath("$.data.decision").value("POSTPONE"))
				.andExpect(jsonPath("$.data.protocol_ref").value(protocol.getId().toString()))
				.andExpect(jsonPath("$.data.context.intensity").value("HIGH"));
	}

	@Test
	void today_조회는_같은_날_기록_전체를_최신순으로_반환한다() throws Exception {
		UUID sessionId = UUID.randomUUID();
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
}
