package com.mallo.backend.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

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
}
