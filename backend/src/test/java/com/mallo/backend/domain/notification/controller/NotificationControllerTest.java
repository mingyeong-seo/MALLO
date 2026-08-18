package com.mallo.backend.domain.notification.controller;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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

import com.mallo.backend.domain.notification.dto.NotificationPreferenceResponse;
import com.mallo.backend.domain.notification.dto.NotificationResponse;
import com.mallo.backend.domain.notification.entity.NotificationStatus;
import com.mallo.backend.domain.notification.entity.NotificationType;
import com.mallo.backend.domain.notification.exception.NotificationErrorCode;
import com.mallo.backend.domain.notification.service.NotificationService;
import com.mallo.backend.global.exception.CustomException;

@WebMvcTest(NotificationController.class)
class NotificationControllerTest {

	private static final String SESSION_ID = "11111111-1111-1111-1111-111111111111";

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private NotificationService notificationService;

	private NotificationResponse notificationResponse() {
		return new NotificationResponse(1L, SESSION_ID, NotificationType.PHOTO_ANALYSIS_READY,
				"사진 분석이 끝났어요", "관찰 결과를 확인해보세요.", "1", NotificationStatus.SENT, false,
				LocalDateTime.now(), LocalDateTime.now(), null);
	}

	@Test
	void 알림_목록을_조회한다() throws Exception {
		given(notificationService.getInbox(SESSION_ID)).willReturn(List.of(notificationResponse()));

		mockMvc.perform(get("/v1/sessions/{sessionId}/notifications", SESSION_ID))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data[0].type").value("PHOTO_ANALYSIS_READY"));
	}

	@Test
	void 알림을_읽음_처리한다() throws Exception {
		given(notificationService.markRead(SESSION_ID, 1L)).willReturn(notificationResponse());

		mockMvc.perform(patch("/v1/sessions/{sessionId}/notifications/{id}/read", SESSION_ID, 1L))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true));
	}

	@Test
	void 존재하지_않는_알림을_읽음_처리하면_404를_반환한다() throws Exception {
		given(notificationService.markRead(eq(SESSION_ID), eq(999L)))
				.willThrow(new CustomException(NotificationErrorCode.NOTIFICATION_NOT_FOUND));

		mockMvc.perform(patch("/v1/sessions/{sessionId}/notifications/{id}/read", SESSION_ID, 999L))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.success").value(false));
	}

	@Test
	void 알림_설정을_조회한다() throws Exception {
		given(notificationService.getPreference(SESSION_ID))
				.willReturn(new NotificationPreferenceResponse(SESSION_ID, false, false));

		mockMvc.perform(get("/v1/sessions/{sessionId}/notification-preference", SESSION_ID))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.enabled").value(false));
	}

	@Test
	void 알림_설정을_수정한다() throws Exception {
		given(notificationService.updatePreference(eq(SESSION_ID), org.mockito.ArgumentMatchers.any()))
				.willReturn(new NotificationPreferenceResponse(SESSION_ID, true, true));

		mockMvc.perform(patch("/v1/sessions/{sessionId}/notification-preference", SESSION_ID)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"enabled":true,"fcmToken":"fcm-token-abc"}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.enabled").value(true))
				.andExpect(jsonPath("$.data.hasFcmToken").value(true));
	}
}
