package com.mallo.backend.global.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

@SpringBootTest(properties = "cors.allowed-origin-patterns=http://localhost:*")
@AutoConfigureMockMvc
class CorsConfigTest {

	private static final String PRODUCTION_ORIGIN = "https://mallo-recovery.vercel.app";
	private static final String PREVIOUS_PRODUCTION_ORIGIN = "https://mallo-azure.vercel.app";

	@Autowired
	private MockMvc mockMvc;

	@Test
	void production_Vercel_origin의_session_preflight를_허용한다() throws Exception {
		assertSessionPreflightAllowed(PRODUCTION_ORIGIN);
	}

	@Test
	void 기존_production_Vercel_origin도_계속_허용한다() throws Exception {
		assertSessionPreflightAllowed(PREVIOUS_PRODUCTION_ORIGIN);
	}

	@Test
	void 환경변수에_설정된_localhost_origin도_계속_허용한다() throws Exception {
		assertSessionPreflightAllowed("http://localhost:8082");
	}

	@Test
	void 등록되지_않은_origin은_허용하지_않는다() throws Exception {
		mockMvc.perform(sessionPreflight("https://malicious.example"))
				.andExpect(status().isForbidden())
				.andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
	}

	private void assertSessionPreflightAllowed(String origin) throws Exception {
		mockMvc.perform(sessionPreflight(origin))
				.andExpect(status().isOk())
				.andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, origin))
				.andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true"));
	}

	private static MockHttpServletRequestBuilder sessionPreflight(String origin) {
		return options("/v1/sessions")
				.header(HttpHeaders.ORIGIN, origin)
				.header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
				.header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "content-type");
	}
}
