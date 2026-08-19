package com.mallo.backend.domain.record.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.mallo.backend.domain.record.dto.RecordActionResponse;
import com.mallo.backend.domain.record.dto.RecoveryRecordResponse;
import com.mallo.backend.domain.record.entity.PerformedStatus;
import com.mallo.backend.domain.record.exception.RecordErrorCode;
import com.mallo.backend.domain.record.service.RecoveryRecordService;
import com.mallo.backend.domain.sessionInfo.entity.SessionInfo;
import com.mallo.backend.domain.sessionInfo.repository.SessionInfoRepository;
import com.mallo.backend.domain.sessionInfo.security.SessionAuthenticationFilter;
import com.mallo.backend.global.exception.CustomException;

@WebMvcTest(RecoveryRecordController.class)
class RecoveryRecordControllerTest {

	private static final String SESSION_ID = "11111111-1111-1111-1111-111111111111";

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private RecoveryRecordService recoveryRecordService;

	// SecurityConfig가 전역으로 걸려있어서, /v1/sessions/** 는 전부 X-Session-Id 헤더 인증이 필요하다
	// (SessionAuthenticationFilter가 헤더의 UUID로 이 레포지토리를 조회함). 여기선 컨트롤러 동작만 보면 되니
	// SESSION_ID가 항상 유효한 세션인 것처럼 mock 해두고, 모든 요청에 헤더를 실어 보낸다.
	@MockitoBean
	private SessionInfoRepository sessionInfoRepository;

	@BeforeEach
	void 유효한_세션으로_인증되게_설정() {
		SessionInfo session = SessionInfo.builder().build();
		ReflectionTestUtils.setField(session, "id", UUID.fromString(SESSION_ID));
		given(sessionInfoRepository.findById(UUID.fromString(SESSION_ID))).willReturn(Optional.of(session));
	}

	private MockHttpServletRequestBuilder withAuth(MockHttpServletRequestBuilder builder) {
		return builder.header(SessionAuthenticationFilter.SESSION_HEADER, SESSION_ID);
	}

	private RecoveryRecordResponse response() {
		return new RecoveryRecordResponse(1L, SESSION_ID, 1,
				List.of(new RecordActionResponse("EXERCISE", PerformedStatus.DONE)),
				"메모", List.of(), LocalDateTime.now());
	}

	@Test
	void 기록_생성_요청이_유효하면_200을_반환한다() throws Exception {
		given(recoveryRecordService.create(eq(SESSION_ID), any())).willReturn(response());

		mockMvc.perform(withAuth(post("/v1/sessions/{sessionId}/records", SESSION_ID)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"elapsed_day":1,"actions":[{"action":"EXERCISE","performed_status":"DONE"}],"memo":"메모"}
								""")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.data.actions[0].action").value("EXERCISE"));
	}

	@Test
	void elapsedDay가_없으면_400을_반환한다() throws Exception {
		mockMvc.perform(withAuth(post("/v1/sessions/{sessionId}/records", SESSION_ID)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"actions":[{"action":"EXERCISE","performed_status":"DONE"}]}
								""")))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.success").value(false));
	}

	@Test
	void actions가_비어있으면_400을_반환한다() throws Exception {
		mockMvc.perform(withAuth(post("/v1/sessions/{sessionId}/records", SESSION_ID)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"elapsed_day":1,"actions":[]}
								""")))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.success").value(false));
	}

	@Test
	void 세션의_저널을_조회한다() throws Exception {
		given(recoveryRecordService.getJournal(SESSION_ID)).willReturn(List.of(response()));

		mockMvc.perform(withAuth(get("/v1/sessions/{sessionId}/records", SESSION_ID)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data[0].session_id").value(SESSION_ID));
	}

	@Test
	void 존재하지_않는_기록을_수정하면_404를_반환한다() throws Exception {
		given(recoveryRecordService.update(eq(SESSION_ID), eq(999L), any()))
				.willThrow(new CustomException(RecordErrorCode.RECORD_NOT_FOUND));

		mockMvc.perform(withAuth(patch("/v1/sessions/{sessionId}/records/{recordId}", SESSION_ID, 999L)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"memo":"수정"}
								""")))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.success").value(false));
	}

	@Test
	void 기록을_수정하면_200을_반환한다() throws Exception {
		given(recoveryRecordService.update(eq(SESSION_ID), eq(1L), any())).willReturn(response());

		mockMvc.perform(withAuth(patch("/v1/sessions/{sessionId}/records/{recordId}", SESSION_ID, 1L)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"memo":"수정된 메모"}
								""")))
				.andExpect(status().isOk());
	}

	@Test
	void 오늘_기록이_있으면_반환한다() throws Exception {
		given(recoveryRecordService.getToday(SESSION_ID)).willReturn(response());

		mockMvc.perform(withAuth(get("/v1/sessions/{sessionId}/records/today", SESSION_ID)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.data.record_id").value(1));
	}

	@Test
	void 오늘_기록이_없으면_data가_null이다() throws Exception {
		given(recoveryRecordService.getToday(SESSION_ID)).willReturn(null);

		mockMvc.perform(withAuth(get("/v1/sessions/{sessionId}/records/today", SESSION_ID)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.data").doesNotExist());
	}

	@Test
	void 오늘_작성한_기록이_아니면_403을_반환한다() throws Exception {
		given(recoveryRecordService.update(eq(SESSION_ID), eq(1L), any()))
				.willThrow(new CustomException(RecordErrorCode.RECORD_NOT_EDITABLE));

		mockMvc.perform(withAuth(patch("/v1/sessions/{sessionId}/records/{recordId}", SESSION_ID, 1L)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"memo":"수정"}
								""")))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.success").value(false));
	}
}
