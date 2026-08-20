package com.mallo.backend.domain.sessionInfo.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mallo.backend.domain.sessionInfo.entity.SessionInfo;
import com.mallo.backend.domain.sessionInfo.entity.SessionStatus;
import com.mallo.backend.domain.sessionInfo.exception.SessionErrorCode;
import com.mallo.backend.domain.sessionInfo.repository.SessionInfoRepository;
import com.mallo.backend.global.exception.CustomException;

@ExtendWith(MockitoExtension.class)
class SessionInfoServiceTest {

	@Mock
	private SessionInfoRepository sessionInfoRepository;

	@InjectMocks
	private SessionInfoService sessionInfoService;

	@Test
	void createSession은_ACTIVE_상태의_세션을_저장하고_반환한다() {
		LocalDate procedureAt = LocalDate.now();
		when(sessionInfoRepository.save(any(SessionInfo.class)))
				.thenAnswer(invocation -> invocation.getArgument(0));

		SessionInfo result = sessionInfoService.createSession("REJURAN", procedureAt, "DERNA");

		assertThat(result.getProcedure()).isEqualTo("REJURAN");
		assertThat(result.getProcedureAt()).isEqualTo(procedureAt);
		assertThat(result.getClinicId()).isEqualTo("DERNA");
		assertThat(result.getStatus()).isEqualTo(SessionStatus.ACTIVE);
		verify(sessionInfoRepository).save(any(SessionInfo.class));
	}

	@Test
	void getSession은_존재하는_세션을_반환한다() {
		UUID sessionId = UUID.randomUUID();
		SessionInfo sessionInfo = SessionInfo.builder()
				.procedure("REJURAN")
				.procedureAt(LocalDate.now())
				.build();
		when(sessionInfoRepository.findById(sessionId)).thenReturn(Optional.of(sessionInfo));

		SessionInfo result = sessionInfoService.getSession(sessionId);

		assertThat(result).isEqualTo(sessionInfo);
	}

	@Test
	void getSession은_존재하지_않으면_SESSION_NOT_FOUND_예외를_던진다() {
		UUID sessionId = UUID.randomUUID();
		when(sessionInfoRepository.findById(sessionId)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> sessionInfoService.getSession(sessionId))
				.isInstanceOf(CustomException.class)
				.extracting(e -> ((CustomException) e).getErrorCode())
				.isEqualTo(SessionErrorCode.SESSION_NOT_FOUND);
	}

	@Test
	void getAllSessions은_저장소가_최신순으로_준_목록을_그대로_반환한다() {
		SessionInfo sessionInfo = SessionInfo.builder()
				.procedure("REJURAN")
				.procedureAt(LocalDate.now())
				.build();
		when(sessionInfoRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(sessionInfo));

		List<SessionInfo> result = sessionInfoService.getAllSessions();

		assertThat(result).containsExactly(sessionInfo);
	}

	@Test
	void deleteSession은_존재하는_세션을_삭제한다() {
		UUID sessionId = UUID.randomUUID();
		SessionInfo sessionInfo = SessionInfo.builder()
				.procedure("REJURAN")
				.procedureAt(LocalDate.now())
				.build();
		when(sessionInfoRepository.findById(sessionId)).thenReturn(Optional.of(sessionInfo));

		sessionInfoService.deleteSession(sessionId);

		verify(sessionInfoRepository).delete(sessionInfo);
	}

	@Test
	void deleteSession은_존재하지_않으면_삭제하지_않고_SESSION_NOT_FOUND_예외를_던진다() {
		UUID sessionId = UUID.randomUUID();
		when(sessionInfoRepository.findById(sessionId)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> sessionInfoService.deleteSession(sessionId))
				.isInstanceOf(CustomException.class);
		verify(sessionInfoRepository, never()).delete(any(SessionInfo.class));
	}

	@Test
	void completeSession은_ACTIVE_세션을_COMPLETED로_전환한다() {
		UUID sessionId = UUID.randomUUID();
		SessionInfo sessionInfo = SessionInfo.builder()
				.procedure("REJURAN")
				.procedureAt(LocalDate.now())
				.build();
		when(sessionInfoRepository.findById(sessionId)).thenReturn(Optional.of(sessionInfo));

		SessionInfo result = sessionInfoService.completeSession(sessionId);

		assertThat(result.getStatus()).isEqualTo(SessionStatus.COMPLETED);
	}

	@Test
	void completeSession은_이미_COMPLETED인_세션에_다시_호출해도_COMPLETED를_유지한다() {
		UUID sessionId = UUID.randomUUID();
		SessionInfo sessionInfo = SessionInfo.builder()
				.procedure("REJURAN")
				.procedureAt(LocalDate.now())
				.build();
		sessionInfo.complete();
		when(sessionInfoRepository.findById(sessionId)).thenReturn(Optional.of(sessionInfo));

		SessionInfo result = sessionInfoService.completeSession(sessionId);

		assertThat(result.getStatus()).isEqualTo(SessionStatus.COMPLETED);
	}

	@Test
	void completeSession은_존재하지_않으면_SESSION_NOT_FOUND_예외를_던진다() {
		UUID sessionId = UUID.randomUUID();
		when(sessionInfoRepository.findById(sessionId)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> sessionInfoService.completeSession(sessionId))
				.isInstanceOf(CustomException.class)
				.extracting(e -> ((CustomException) e).getErrorCode())
				.isEqualTo(SessionErrorCode.SESSION_NOT_FOUND);
	}
}
