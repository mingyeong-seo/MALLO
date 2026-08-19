package com.mallo.backend.domain.interaction.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import com.mallo.backend.domain.interaction.exception.InteractionErrorCode;
import com.mallo.backend.domain.interaction.port.AiTriageInput;
import com.mallo.backend.domain.interaction.port.AiTriageResult;
import com.mallo.backend.global.exception.CustomException;

class AiTriageHttpClientTest {

	private static final AiTriageInput INPUT = new AiTriageInput("오늘 헬스해도 돼?", "포텐자", 3);
	private static final String RESPONSE_ID = "00000000-0000-0000-0000-000000000001";

	private MockRestServiceServer server;
	private AiTriageHttpClient client;

	@BeforeEach
	void setUp() {
		RestClient.Builder builder = RestClient.builder();
		server = MockRestServiceServer.bindTo(builder).build();
		client = new AiTriageHttpClient(
				builder,
				new AiTriageHttpConfig("http://ai.test", "test-secret", Duration.ofMillis(1000), Duration.ofMillis(8000)),
				() -> UUID.fromString(RESPONSE_ID));
	}

	@Test
	void sendsExactInternalTriageRequestAndParsesActionResult() {
		server.expect(once(), requestTo("http://ai.test/internal/v1/triage"))
				.andExpect(method(HttpMethod.POST))
				.andExpect(header("Authorization", "Bearer test-secret"))
				.andExpect(header("X-Request-Id", RESPONSE_ID))
				.andExpect(content().contentType(MediaType.APPLICATION_JSON))
				.andExpect(jsonPath("$.contract_version").value("1.0"))
				.andExpect(jsonPath("$.question").value(INPUT.question()))
				.andExpect(jsonPath("$.procedure").value(INPUT.procedure()))
				.andExpect(jsonPath("$.elapsed_day").value(INPUT.elapsedDay()))
				.andRespond(withSuccess("""
						{"request_id":"00000000-0000-0000-0000-000000000001",
						 "route":"ACTION","action_state":"COMPLETE","action":"EXERCISE",
						 "context":{"intensity":"INTENSE_ACTIVITY"},
						 "missing_fields":[],"clarification_code":null,"safety_reason_codes":[]}
						""", MediaType.APPLICATION_JSON));

		AiTriageResult result = client.triage(INPUT);

		assertThat(result.requestId()).isEqualTo(UUID.fromString(RESPONSE_ID));
		assertThat(result.route()).isEqualTo("ACTION");
		assertThat(result.actionState()).isEqualTo("COMPLETE");
		assertThat(result.action()).isEqualTo("EXERCISE");
		assertThat(result.context()).containsExactlyEntriesOf(Map.of("intensity", "INTENSE_ACTIVITY"));
		assertThat(result.missingFields()).isEmpty();
		assertThat(result.clarificationCode()).isNull();
		assertThat(result.safetyReasonCodes()).isEmpty();
		server.verify();
	}

	@Test
	void parsesConnectResult() {
		server.expect(requestTo("http://ai.test/internal/v1/triage"))
				.andRespond(withSuccess("""
						{"request_id":"00000000-0000-0000-0000-000000000001",
						 "route":"CONNECT","action":null,"context":null,
						 "missing_fields":[],"clarification_code":null,
						 "safety_reason_codes":["SYMPTOM_JUDGMENT"]}
						""", MediaType.APPLICATION_JSON));

		AiTriageResult result = client.triage(INPUT);

		assertThat(result.route()).isEqualTo("CONNECT");
		assertThat(result.action()).isNull();
		assertThat(result.context()).isNull();
		assertThat(result.safetyReasonCodes()).containsExactly("SYMPTOM_JUDGMENT");
	}

	@Test
	void rejectsUnknownResponseField() {
		server.expect(requestTo("http://ai.test/internal/v1/triage"))
				.andRespond(withSuccess("""
						{"request_id":"00000000-0000-0000-0000-000000000001",
						 "route":"GENERAL","action":null,"context":null,
						 "missing_fields":[],"clarification_code":null,
						 "safety_reason_codes":[],"unexpected":true}
						""", MediaType.APPLICATION_JSON));

		assertErrorCode(() -> client.triage(INPUT), InteractionErrorCode.AI_INVALID_RESPONSE);
	}

	@Test
	void rejectsTrailingResponseTokens() {
		server.expect(requestTo("http://ai.test/internal/v1/triage"))
				.andRespond(withSuccess("""
						{"request_id":"00000000-0000-0000-0000-000000000001",
						 "route":"GENERAL","action":null,"context":null,
						 "missing_fields":[],"clarification_code":null,"safety_reason_codes":[]} {}
						""", MediaType.APPLICATION_JSON));

		assertErrorCode(() -> client.triage(INPUT), InteractionErrorCode.AI_INVALID_RESPONSE);
	}

	@Test
	void rejectsMismatchedRequestId() {
		server.expect(requestTo("http://ai.test/internal/v1/triage"))
				.andRespond(withSuccess("""
						{"request_id":"00000000-0000-0000-0000-000000000999",
						 "route":"GENERAL","action":null,"context":null,
						 "missing_fields":[],"clarification_code":null,"safety_reason_codes":[]}
						""", MediaType.APPLICATION_JSON));

		assertErrorCode(() -> client.triage(INPUT), InteractionErrorCode.AI_INVALID_RESPONSE);
	}

	@Test
	void rejectsCrossFieldInvalidUnion() {
		server.expect(requestTo("http://ai.test/internal/v1/triage"))
				.andRespond(withSuccess("""
						{"request_id":"00000000-0000-0000-0000-000000000001",
						 "route":"CONNECT","action":"EXERCISE","context":{"intensity":"INTENSE_ACTIVITY"},
						 "missing_fields":[],"clarification_code":null,
						 "safety_reason_codes":["SYMPTOM_JUDGMENT"]}
						""", MediaType.APPLICATION_JSON));

		assertErrorCode(() -> client.triage(INPUT), InteractionErrorCode.AI_INVALID_RESPONSE);
	}

	@ParameterizedTest
	@MethodSource("statusMappings")
	void mapsAiErrorStatuses(HttpStatus status, InteractionErrorCode expected) {
		server.expect(requestTo("http://ai.test/internal/v1/triage"))
				.andRespond(withStatus(status).body("{}").contentType(MediaType.APPLICATION_JSON));

		assertErrorCode(() -> client.triage(INPUT), expected);
	}

	@Test
	void rejectsBlankSharedSecretAtBindingTime() {
		new ApplicationContextRunner()
				.withConfiguration(AutoConfigurations.of(TestConfig.class))
				.withPropertyValues(
						"ai.base-url=http://ai.test",
						"ai.shared-secret= ",
						"ai.connect-timeout-ms=1000",
						"ai.read-timeout-ms=8000")
				.run(context -> assertThat(context).hasFailed());
	}

	private static Stream<Arguments> statusMappings() {
		return Stream.of(
				Arguments.of(HttpStatus.PAYMENT_REQUIRED, InteractionErrorCode.AI_BUDGET_EXHAUSTED),
				Arguments.of(HttpStatus.UNPROCESSABLE_ENTITY, InteractionErrorCode.AI_REQUEST_REJECTED),
				Arguments.of(HttpStatus.CONFLICT, InteractionErrorCode.AI_CONTRACT_MISMATCH),
				Arguments.of(HttpStatus.UNAUTHORIZED, InteractionErrorCode.AI_UNAVAILABLE),
				Arguments.of(HttpStatus.REQUEST_TIMEOUT, InteractionErrorCode.AI_UNAVAILABLE),
				Arguments.of(HttpStatus.TOO_MANY_REQUESTS, InteractionErrorCode.AI_UNAVAILABLE),
				Arguments.of(HttpStatus.BAD_GATEWAY, InteractionErrorCode.AI_UNAVAILABLE),
				Arguments.of(HttpStatus.SERVICE_UNAVAILABLE, InteractionErrorCode.AI_UNAVAILABLE));
	}

	private void assertErrorCode(Runnable runnable, InteractionErrorCode expected) {
		assertThatThrownBy(runnable::run)
				.isInstanceOfSatisfying(CustomException.class,
						exception -> assertThat(exception.getErrorCode()).isEqualTo(expected));
	}

	@Configuration
	@EnableConfigurationProperties(AiTriageHttpConfig.class)
	static class TestConfig {
	}
}
