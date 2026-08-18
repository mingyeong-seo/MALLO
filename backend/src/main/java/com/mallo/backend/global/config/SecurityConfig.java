package com.mallo.backend.global.config;

import java.nio.charset.StandardCharsets;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.mallo.backend.domain.sessionInfo.security.SessionAuthenticationFilter;
import com.mallo.backend.global.response.ApiResponse;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import tools.jackson.databind.ObjectMapper;

/**
 * 회원가입/로그인이 없는 MVP라 Security는 "인증"이 아니라 X-Session-Id 헤더 기반 "인가" 용도로만 쓴다.
 * 세션 검증 자체는 SessionAuthenticationFilter가 하고, 여기선 어떤 경로가 헤더 없이 열려있는지만 정의한다.
 */
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

	private final SessionAuthenticationFilter sessionAuthenticationFilter;
	private final ObjectMapper objectMapper;

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
				.csrf(AbstractHttpConfigurer::disable)
				.formLogin(AbstractHttpConfigurer::disable)
				.httpBasic(AbstractHttpConfigurer::disable)
				.cors(Customizer.withDefaults())
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(auth -> auth
						.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
						// session_id 발급 자체는 아직 세션이 없는 상태에서 호출하는 거라 예외적으로 허용
						.requestMatchers(HttpMethod.POST, "/v1/sessions").permitAll()
						// 전체 세션 목록: 해커톤 MVP 한정 임시 공개. session_id가 인가 토큰이라 실서비스 전엔 잠가야 함
						.requestMatchers(HttpMethod.GET, "/v1/sessions").permitAll()
						// Swagger / OpenAPI 문서는 개발 편의상 허용
						.requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
						.anyRequest().authenticated())
				.exceptionHandling(ex -> ex.authenticationEntryPoint(sessionAuthenticationEntryPoint()))
				.addFilterBefore(sessionAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

		return http.build();
	}

	private AuthenticationEntryPoint sessionAuthenticationEntryPoint() {
		return (request, response, authException) -> {
			response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
			response.setContentType(MediaType.APPLICATION_JSON_VALUE);
			response.setCharacterEncoding(StandardCharsets.UTF_8.name());
			response.getWriter().write(
					objectMapper.writeValueAsString(ApiResponse.error("유효한 X-Session-Id 헤더가 필요합니다.")));
		};
	}
}
