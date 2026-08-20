package com.mallo.backend.domain.sessionInfo.security;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.mallo.backend.domain.sessionInfo.entity.SessionInfo;
import com.mallo.backend.domain.sessionInfo.repository.SessionInfoRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

/**
 * X-Session-Id 헤더를 검증해서 SecurityContext에 인증 정보를 채워 넣는다.
 * 회원가입/로그인이 없는 MVP라 "인증"이 아니라 "이 session_id가 실제로 발급된 것인지" 확인하는
 * 인가(authorization) 목적의 필터다.
 *
 * 헤더가 없거나, 형식이 잘못됐거나, DB에 없는 session_id면 그냥 인증 없이 다음 필터로 넘긴다.
 * (여기서 예외를 던지지 않는 이유: 이 필터는 DispatcherServlet보다 앞에서 실행돼서
 * @RestControllerAdvice가 못 잡는다. 최종 401 응답은 SecurityConfig의 AuthenticationEntryPoint가 만든다.)
 */
@Component
@RequiredArgsConstructor
public class SessionAuthenticationFilter extends OncePerRequestFilter {

	public static final String SESSION_HEADER = "X-Session-Id";

	private final SessionInfoRepository sessionInfoRepository;

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {
		String header = request.getHeader(SESSION_HEADER);

		if (header != null) {
			try {
				UUID sessionId = UUID.fromString(header);
				sessionInfoRepository.findById(sessionId).ifPresent(this::authenticate);
			} catch (IllegalArgumentException ignored) {
				// UUID 형식이 아니면 인증 없이 통과 -> 보호된 경로면 이후 401로 막힘
			}
		}

		filterChain.doFilter(request, response);
	}

	private void authenticate(SessionInfo sessionInfo) {
		var authentication = new UsernamePasswordAuthenticationToken(sessionInfo.getId(), null, List.of());
		SecurityContextHolder.getContext().setAuthentication(authentication);
	}
}
