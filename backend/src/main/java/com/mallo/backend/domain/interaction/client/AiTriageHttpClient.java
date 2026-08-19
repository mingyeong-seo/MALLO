package com.mallo.backend.domain.interaction.client;

import java.time.Duration;
import java.util.UUID;
import java.util.function.Supplier;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import com.mallo.backend.domain.interaction.dto.AiTriageHttpRequest;
import com.mallo.backend.domain.interaction.dto.AiTriageHttpResponse;
import com.mallo.backend.domain.interaction.exception.InteractionErrorCode;
import com.mallo.backend.domain.interaction.port.AiTriageInput;
import com.mallo.backend.domain.interaction.port.AiTriagePort;
import com.mallo.backend.domain.interaction.port.AiTriageResult;
import com.mallo.backend.global.exception.CustomException;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.json.JsonMapper;

@Component
public class AiTriageHttpClient implements AiTriagePort {

	private static final String TRIAGE_PATH = "/internal/v1/triage";

	private final RestClient restClient;
	private final AiTriageHttpConfig config;
	private final Supplier<UUID> requestIdSupplier;
	private final JsonMapper jsonMapper;

	@Autowired
	public AiTriageHttpClient(AiTriageHttpConfig config) {
		this(RestClient.builder()
				.baseUrl(config.baseUrl())
				.requestFactory(requestFactory(config.connectTimeout(), config.readTimeout()))
				.build(), config, UUID::randomUUID);
	}

	AiTriageHttpClient(RestClient.Builder builder, AiTriageHttpConfig config, Supplier<UUID> requestIdSupplier) {
		this(builder.baseUrl(config.baseUrl()).build(), config, requestIdSupplier);
	}

	private AiTriageHttpClient(RestClient restClient, AiTriageHttpConfig config, Supplier<UUID> requestIdSupplier) {
		this.config = config;
		this.requestIdSupplier = requestIdSupplier;
		this.jsonMapper = JsonMapper.builder()
				.propertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE)
				.enable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
				.enable(DeserializationFeature.FAIL_ON_TRAILING_TOKENS)
				.build();
		this.restClient = restClient;
	}

	@Override
	public AiTriageResult triage(AiTriageInput input) {
		UUID requestId = requestIdSupplier.get();
		String body = serialize(AiTriageHttpRequest.from(input));

		try {
			return restClient.post()
					.uri(TRIAGE_PATH)
					.contentType(MediaType.APPLICATION_JSON)
					.accept(MediaType.APPLICATION_JSON)
					.header("Authorization", "Bearer " + config.sharedSecret())
					.header("X-Request-Id", requestId.toString())
					.body(body)
					.exchange((request, response) -> parseResponse(response.getStatusCode(), response.bodyTo(String.class), requestId), false);
		} catch (CustomException exception) {
			throw exception;
		} catch (ResourceAccessException exception) {
			throw new CustomException(InteractionErrorCode.AI_UNAVAILABLE);
		}
	}

	private AiTriageResult parseResponse(HttpStatusCode status, String body, UUID requestId) {
		if (status.is2xxSuccessful()) {
			try {
				return jsonMapper.readValue(body, AiTriageHttpResponse.class).toResult(requestId);
			} catch (JacksonException | IllegalArgumentException exception) {
				throw new CustomException(InteractionErrorCode.AI_INVALID_RESPONSE);
			}
		}

		throw new CustomException(errorCodeFor(status.value()));
	}

	private InteractionErrorCode errorCodeFor(int statusCode) {
		return switch (statusCode) {
			case 402 -> InteractionErrorCode.AI_BUDGET_EXHAUSTED;
			case 422 -> InteractionErrorCode.AI_REQUEST_REJECTED;
			case 409 -> InteractionErrorCode.AI_CONTRACT_MISMATCH;
			case 401, 408, 429, 502, 503 -> InteractionErrorCode.AI_UNAVAILABLE;
			default -> InteractionErrorCode.AI_UNAVAILABLE;
		};
	}

	private String serialize(AiTriageHttpRequest request) {
		try {
			return jsonMapper.writeValueAsString(request);
		} catch (JacksonException exception) {
			throw new CustomException(InteractionErrorCode.AI_INVALID_RESPONSE);
		}
	}

	private static SimpleClientHttpRequestFactory requestFactory(Duration connectTimeout, Duration readTimeout) {
		SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
		factory.setConnectTimeout(connectTimeout);
		factory.setReadTimeout(readTimeout);
		return factory;
	}
}
