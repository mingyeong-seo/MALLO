package com.mallo.backend.domain.interaction.client;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

@Component
@Validated
@ConfigurationProperties(prefix = "ai")
public class AiTriageHttpConfig {

	@NotBlank
	private String baseUrl;

	@NotBlank
	private String sharedSecret;

	@Positive
	private long connectTimeoutMs = 1000;

	@Positive
	private long readTimeoutMs = 8000;

	public AiTriageHttpConfig() {
	}

	AiTriageHttpConfig(String baseUrl, String sharedSecret, Duration connectTimeout, Duration readTimeout) {
		this.baseUrl = baseUrl;
		this.sharedSecret = sharedSecret;
		this.connectTimeoutMs = connectTimeout.toMillis();
		this.readTimeoutMs = readTimeout.toMillis();
	}

	public String baseUrl() {
		return baseUrl;
	}

	public void setBaseUrl(String baseUrl) {
		this.baseUrl = baseUrl;
	}

	public String sharedSecret() {
		return sharedSecret;
	}

	public void setSharedSecret(String sharedSecret) {
		this.sharedSecret = sharedSecret;
	}

	public Duration connectTimeout() {
		return Duration.ofMillis(connectTimeoutMs);
	}

	public long getConnectTimeoutMs() {
		return connectTimeoutMs;
	}

	public void setConnectTimeoutMs(long connectTimeoutMs) {
		this.connectTimeoutMs = connectTimeoutMs;
	}

	public Duration readTimeout() {
		return Duration.ofMillis(readTimeoutMs);
	}

	public long getReadTimeoutMs() {
		return readTimeoutMs;
	}

	public void setReadTimeoutMs(long readTimeoutMs) {
		this.readTimeoutMs = readTimeoutMs;
	}
}
