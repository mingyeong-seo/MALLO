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

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.mallo.backend.domain.record.dto.RecoveryRecordResponse;
import com.mallo.backend.domain.record.entity.PerformedStatus;
import com.mallo.backend.domain.record.exception.RecordErrorCode;
import com.mallo.backend.domain.record.service.RecoveryRecordService;
import com.mallo.backend.global.exception.CustomException;

@WebMvcTest(RecoveryRecordController.class)
class RecoveryRecordControllerTest {

	private static final String SESSION_ID = "11111111-1111-1111-1111-111111111111";

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private RecoveryRecordService recoveryRecordService;

	private RecoveryRecordResponse response() {
		return new RecoveryRecordResponse(1L, SESSION_ID, 1, "EXERCISE",
				PerformedStatus.DONE, "메모", null, LocalDateTime.now());
	}

	@Test
	void 기록_생성_요청이_유효하면_200을_반환한다() throws Exception {
		given(recoveryRecordService.create(eq(SESSION_ID), any())).willReturn(response());

		mockMvc.perform(post("/v1/sessions/{sessionId}/records", SESSION_ID)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"elapsedDay":1,"action":"EXERCISE","performedStatus":"DONE","memo":"메모"}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.data.action").value("EXERCISE"));
	}

	@Test
	void elapsedDay가_없으면_400을_반환한다() throws Exception {
		mockMvc.perform(post("/v1/sessions/{sessionId}/records", SESSION_ID)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"action":"EXERCISE","performedStatus":"DONE"}
								"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.success").value(false));
	}

	@Test
	void 세션의_저널을_조회한다() throws Exception {
		given(recoveryRecordService.getJournal(SESSION_ID)).willReturn(List.of(response()));

		mockMvc.perform(get("/v1/sessions/{sessionId}/records", SESSION_ID))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data[0].sessionId").value(SESSION_ID));
	}

	@Test
	void 존재하지_않는_기록을_수정하면_404를_반환한다() throws Exception {
		given(recoveryRecordService.update(eq(SESSION_ID), eq(999L), any()))
				.willThrow(new CustomException(RecordErrorCode.RECORD_NOT_FOUND));

		mockMvc.perform(patch("/v1/sessions/{sessionId}/records/{recordId}", SESSION_ID, 999L)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"memo":"수정"}
								"""))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.success").value(false));
	}

	@Test
	void 기록을_수정하면_200을_반환한다() throws Exception {
		given(recoveryRecordService.update(eq(SESSION_ID), eq(1L), any())).willReturn(response());

		mockMvc.perform(patch("/v1/sessions/{sessionId}/records/{recordId}", SESSION_ID, 1L)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"memo":"수정된 메모"}
								"""))
				.andExpect(status().isOk());
	}
}
