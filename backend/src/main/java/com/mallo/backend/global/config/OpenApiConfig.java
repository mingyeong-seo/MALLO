package com.mallo.backend.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;

import io.swagger.v3.core.jackson.ModelResolver;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;

@Configuration
public class OpenApiConfig {

	@Bean
	public OpenAPI openAPI() {
		Info info = new Info()
				.title("MALLO API")
				.description("MALLO 백엔드 API 문서")
				.version("v0.0.1");

		return new OpenAPI().info(info);
	}

	/**
	 * springdoc-openapi 3.x는 응답 직렬화엔 앱 전역 ObjectMapper(Jackson3, SNAKE_CASE)를 쓰지만,
	 * OpenAPI 스키마 자체는 여전히 swagger-core(Jackson2 기반) ModelResolver가 만든다 — 서로 다른
	 * ObjectMapper라 이걸 안 맞춰주면 Swagger 스키마 필드명이 카멜케이스(sessionId, nextAction)로
	 * 나와서 실제 응답(snake_case: session_id, next_action)과 어긋난다.
	 * 문서 생성 전용 Jackson2 ObjectMapper를 SNAKE_CASE로 맞춰서 스키마에만 쓴다 —
	 * 앱의 실제 직렬화 동작(Jackson3)엔 영향 없음.
	 */
	@Bean
	public ModelResolver modelResolver() {
		ObjectMapper schemaObjectMapper = new ObjectMapper();
		schemaObjectMapper.setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);
		return new ModelResolver(schemaObjectMapper);
	}
}
