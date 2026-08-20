package com.mallo.backend.global.config;

import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
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

	// PhotoStorageConfig가 이 prefix로 정적 리소스를 서빙한다. 같은 값을 여기서도 써서
	// "정적 파일 서빙 경로"와 "인증 예외 경로"가 항상 같이 움직이게 한다(따로 하드코딩하면 드리프트 위험).
	@Value("${photo.storage.url-prefix}")
	private String photoUrlPrefix;

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
						// 업로드된 사진 정적 파일: API가 아니라 그냥 이미지 서빙이라 원래 인증 대상이 아니었는데
						// anyRequest().authenticated()에 같이 걸려있던 버그. FE가 <Image source={{uri}}>로
						// 커스텀 헤더 없이 그냥 열람하는 구조라 여기만 공개로 뺀다. 파일명 자체가 업로드 시점
						// 랜덤 UUID라 URL을 아는 사람만 접근 가능 (session_id 목록 공개와 같은 수준의 MVP 트레이드오프).
						.requestMatchers(HttpMethod.GET, photoUrlPrefix + "/**").permitAll()
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
