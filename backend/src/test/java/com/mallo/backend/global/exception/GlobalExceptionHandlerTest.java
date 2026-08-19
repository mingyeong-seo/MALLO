package com.mallo.backend.global.exception;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.jayway.jsonpath.JsonPath;
import com.mallo.backend.domain.sessionInfo.security.SessionAuthenticationFilter;

/**
 * Exception.class catch-all이 흔한 요청 오류(타입 불일치/잘못된 body/미지원 메서드)까지
 * 500으로 뭉개던 문제 회귀 테스트. 실제 컨트롤러(journey/sessionInfo)를 통해 검증한다 —
 * GlobalExceptionHandler는 @RestControllerAdvice라 컨트롤러 없이 단독 테스트가 의미 없다.
 */
@SpringBootTest
@AutoConfigureMockMvc
class GlobalExceptionHandlerTest {

	private static final String SESSION_HEADER = SessionAuthenticationFilter.SESSION_HEADER;

	@Autowired
	private MockMvc mockMvc;

	@Test
	void 경로변수_타입이_안_맞으면_500이_아니라_400이다() throws Exception {
		String createResponse = mockMvc.perform(post("/v1/sessions")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"procedure":"REJURAN","procedure_at":"2026-08-17","clinic_id":"DERNA"}
								"""))
				.andReturn().getResponse().getContentAsString();
		String sessionId = JsonPath.read(createResponse, "$.data.session_id");

		mockMvc.perform(get("/v1/checks/not-a-uuid").header(SESSION_HEADER, sessionId))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.success").value(false));
	}

	@Test
	void 요청_body가_JSON_문법을_어기면_500이_아니라_400이다() throws Exception {
		mockMvc.perform(post("/v1/sessions")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{ this is not json"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.success").value(false));
	}

	@Test
	void 지원하지_않는_HTTP_메서드면_500이_아니라_405다() throws Exception {
		// /v1/sessions/complete는 PATCH만 지원한다. Security가 먼저 막지 않도록 유효한 헤더로 인증부터 통과시킨다.
		String createResponse = mockMvc.perform(post("/v1/sessions")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"procedure":"REJURAN","procedure_at":"2026-08-17","clinic_id":"DERNA"}
								"""))
				.andReturn().getResponse().getContentAsString();
		String sessionId = JsonPath.read(createResponse, "$.data.session_id");

		mockMvc.perform(put("/v1/sessions/complete").header(SESSION_HEADER, sessionId))
				.andExpect(status().isMethodNotAllowed())
				.andExpect(jsonPath("$.success").value(false));
	}
}
