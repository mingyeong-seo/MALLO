package com.mallo.backend.domain.sessionInfo.controller;

import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.jayway.jsonpath.JsonPath;
import com.mallo.backend.domain.sessionInfo.security.SessionAuthenticationFilter;

/**
 * X-Session-Id 헤더 인가(Security)까지 포함한 엔드투엔드 테스트.
 * H2(MODE=MySQL) 인메모리 DB로 동작하며 실제 필터 체인을 그대로 통과한다.
 */
@SpringBootTest
@AutoConfigureMockMvc
class SessionInfoControllerTest {

	private static final String SESSION_HEADER = SessionAuthenticationFilter.SESSION_HEADER;

	@Autowired
	private MockMvc mockMvc;

	@Test
	void 세션_생성하면_201과_ACTIVE_세션정보를_반환한다() throws Exception {
		mockMvc.perform(post("/v1/sessions")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"procedure":"REJURAN","procedure_at":"2026-08-17","clinic_id":"DERNA"}
								"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.data.session_id", notNullValue()))
				.andExpect(jsonPath("$.data.status").value("ACTIVE"));
	}

	@Test
	void 필수값_없이_세션_생성하면_400이다() throws Exception {
		mockMvc.perform(post("/v1/sessions")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.success").value(false));
	}

	@Test
	void X_Session_Id_헤더_없이_today_호출하면_401이다() throws Exception {
		mockMvc.perform(get("/v1/sessions/today"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.success").value(false));
	}

	@Test
	void 존재하지_않는_세션ID로_today_호출하면_401이다() throws Exception {
		mockMvc.perform(get("/v1/sessions/today")
						.header(SESSION_HEADER, "00000000-0000-0000-0000-000000000000"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void UUID_형식이_아닌_세션ID로_today_호출하면_401이다() throws Exception {
		mockMvc.perform(get("/v1/sessions/today")
						.header(SESSION_HEADER, "not-a-uuid"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void 발급받은_세션ID_헤더로_today_호출하면_200과_세션정보를_반환한다() throws Exception {
		String createResponse = mockMvc.perform(post("/v1/sessions")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"procedure":"REJURAN","procedure_at":"2026-08-17","clinic_id":"DERNA"}
								"""))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();

		String sessionId = JsonPath.read(createResponse, "$.data.session_id");

		mockMvc.perform(get("/v1/sessions/today")
						.header(SESSION_HEADER, sessionId))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.session_id").value(sessionId))
				.andExpect(jsonPath("$.data.elapsed_day").isNumber());
	}

	@Test
	void 세션_목록_조회는_헤더_없이도_동작하고_생성한_세션을_포함한다() throws Exception {
		String createResponse = mockMvc.perform(post("/v1/sessions")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"procedure":"REJURAN","procedure_at":"2026-08-17","clinic_id":"DERNA"}
								"""))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();
		String sessionId = JsonPath.read(createResponse, "$.data.session_id");

		mockMvc.perform(get("/v1/sessions"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data[?(@.session_id == '" + sessionId + "')]").exists());
	}

	@Test
	void 헤더_없이_세션_삭제하면_401이다() throws Exception {
		mockMvc.perform(delete("/v1/sessions"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void 발급받은_세션ID_헤더로_삭제하면_204이고_이후_조회하면_401이다() throws Exception {
		String createResponse = mockMvc.perform(post("/v1/sessions")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"procedure":"REJURAN","procedure_at":"2026-08-17","clinic_id":"DERNA"}
								"""))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();
		String sessionId = JsonPath.read(createResponse, "$.data.session_id");

		mockMvc.perform(delete("/v1/sessions").header(SESSION_HEADER, sessionId))
				.andExpect(status().isNoContent());

		mockMvc.perform(get("/v1/sessions/today").header(SESSION_HEADER, sessionId))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void 헤더_없이_세션_종료하면_401이다() throws Exception {
		mockMvc.perform(patch("/v1/sessions/complete"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void 발급받은_세션ID_헤더로_종료하면_COMPLETED_상태를_반환한다() throws Exception {
		String createResponse = mockMvc.perform(post("/v1/sessions")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"procedure":"REJURAN","procedure_at":"2026-08-17","clinic_id":"DERNA"}
								"""))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();
		String sessionId = JsonPath.read(createResponse, "$.data.session_id");

		mockMvc.perform(patch("/v1/sessions/complete").header(SESSION_HEADER, sessionId))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.session_id").value(sessionId))
				.andExpect(jsonPath("$.data.status").value("COMPLETED"));

		// 종료 후에도 today 조회 자체는 계속 가능해야 한다 (조회는 status로만 분기, 세션 자체를 막는 게 아님)
		mockMvc.perform(get("/v1/sessions/today").header(SESSION_HEADER, sessionId))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.status").value("COMPLETED"));
	}
}
