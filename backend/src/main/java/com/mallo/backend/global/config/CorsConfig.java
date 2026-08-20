package com.mallo.backend.global.config;

import java.util.Arrays;
import java.util.stream.Stream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

	private static final String[] PRODUCTION_WEB_ORIGINS = {
			"https://mallo-recovery.vercel.app",
			"https://mallo-azure.vercel.app"
	};

	// allowedOrigins()는 정확히 일치하는 문자열만 허용해서, Expo Web 개발 서버 포트가 바뀔 때마다
	// (8081, 8082, ...) .env를 계속 고쳐야 했다 (실제 겪은 문제 — 8082가 403으로 막힘).
	// allowedOriginPatterns()는 와일드카드를 지원하면서도 allowCredentials(true)와 같이 쓸 수 있어서
	// (allowedOrigins("*")는 credentials와 같이 못 씀) 로컬호스트 포트 전체를 패턴 하나로 허용한다.
	@Value("${cors.allowed-origin-patterns:http://localhost:*}")
	private String[] configuredAllowedOriginPatterns;

	@Override
	public void addCorsMappings(CorsRegistry registry) {
		registry.addMapping("/**")
				.allowedOriginPatterns(allowedOriginPatterns())
				.allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
				.allowedHeaders("*")
				.allowCredentials(true);
	}

	private String[] allowedOriginPatterns() {
		// 운영 서버의 기존 환경변수 Origin을 유지하면서 현재 Production Origin을 항상 허용한다.
		return Stream.concat(Arrays.stream(configuredAllowedOriginPatterns), Arrays.stream(PRODUCTION_WEB_ORIGINS))
				.filter(StringUtils::hasText)
				.map(String::trim)
				.distinct()
				.toArray(String[]::new);
	}
}
