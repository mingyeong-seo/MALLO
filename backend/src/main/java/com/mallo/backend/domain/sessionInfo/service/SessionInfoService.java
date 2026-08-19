package com.mallo.backend.domain.sessionInfo.service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mallo.backend.domain.sessionInfo.entity.SessionInfo;
import com.mallo.backend.domain.sessionInfo.exception.SessionErrorCode;
import com.mallo.backend.domain.sessionInfo.repository.SessionInfoRepository;
import com.mallo.backend.global.exception.CustomException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SessionInfoService {

	private final SessionInfoRepository sessionInfoRepository;

	/**
	 * 새 Recovery Journey를 시작한다. 호출될 때마다 새 session_id(UUID)가 발급된다.
	 */
	@Transactional
	public SessionInfo createSession(String procedure, LocalDate procedureAt, String clinicId) {
		SessionInfo sessionInfo = SessionInfo.builder()
				.procedure(procedure)
				.procedureAt(procedureAt)
				.clinicId(clinicId)
				.build();
		return sessionInfoRepository.save(sessionInfo);
	}

	/**
	 * X-Session-Id 헤더로 넘어온 session_id로 세션을 조회한다.
	 * 존재하지 않으면 SESSION_NOT_FOUND (Security 인가 검증, GET /v1/sessions/today 등에서 재사용).
	 */
	public SessionInfo getSession(UUID sessionId) {
		return sessionInfoRepository.findById(sessionId)
				.orElseThrow(() -> new CustomException(SessionErrorCode.SESSION_NOT_FOUND));
	}

	/**
	 * 발급된 세션 전체 목록. 지금은 인증/페이지네이션 없이 전부 공개(해커톤 MVP 한정).
	 * session_id 자체가 인가 토큰 역할이라, 실제 배포 전에는 접근 제한이 반드시 필요하다.
	 */
	public List<SessionInfo> getAllSessions() {
		return sessionInfoRepository.findAllByOrderByCreatedAtDesc();
	}

	/**
	 * X-Session-Id 헤더의 세션과 그에 딸린 데이터를 삭제한다.
	 * 다른 도메인(journey/image 등) 데이터까지 함께 지우는 연쇄 삭제는 해당 도메인이 생기면 이어서 붙인다.
	 */
	@Transactional
	public void deleteSession(UUID sessionId) {
		SessionInfo sessionInfo = getSession(sessionId);
		sessionInfoRepository.delete(sessionInfo);
	}
}
