package com.mallo.backend.domain.record.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import com.mallo.backend.domain.record.dto.PhotoRecordResponse;
import com.mallo.backend.domain.record.service.PhotoRecordService;
import com.mallo.backend.domain.sessionInfo.entity.SessionInfo;
import com.mallo.backend.domain.sessionInfo.repository.SessionInfoRepository;
import com.mallo.backend.domain.sessionInfo.security.SessionAuthenticationFilter;

@WebMvcTest(PhotoRecordController.class)
class PhotoRecordControllerTest {

	private static final String SESSION_ID = "11111111-1111-1111-1111-111111111111";

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private PhotoRecordService photoRecordService;

	// RecoveryRecordControllerTest 참고 — SecurityConfig가 전역으로 걸려있어서 필요
	@MockitoBean
	private SessionInfoRepository sessionInfoRepository;

	@BeforeEach
	void 유효한_세션으로_인증되게_설정() {
		SessionInfo session = SessionInfo.builder().build();
		ReflectionTestUtils.setField(session, "id", UUID.fromString(SESSION_ID));
		given(sessionInfoRepository.findById(UUID.fromString(SESSION_ID))).willReturn(Optional.of(session));
	}

	@Test
	void 사진을_업로드하면_관찰_결과를_반환한다() throws Exception {
		MockMultipartFile photo = new MockMultipartFile("photo", "wound.jpg", "image/jpeg", new byte[] {1, 2, 3});
		PhotoRecordResponse response = new PhotoRecordResponse(
				1L, SESSION_ID, Map.of("redness", "LOW"), "/uploads/photos/" + SESSION_ID + "/wound.jpg",
				LocalDateTime.now());
		given(photoRecordService.upload(eq(SESSION_ID), any())).willReturn(response);

		mockMvc.perform(multipart("/v1/sessions/{sessionId}/photos", SESSION_ID).file(photo)
						.header(SessionAuthenticationFilter.SESSION_HEADER, SESSION_ID))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.data.observation.redness").value("LOW"))
				.andExpect(jsonPath("$.data.photo_url").value("/uploads/photos/" + SESSION_ID + "/wound.jpg"));
	}
}
