package com.mallo.backend.domain.sessionInfo.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * POST /v1/sessions 요청 바디.
 * clinic_id는 선택값 (없어도 세션 생성 가능).
 */
public record SessionCreateRequest(
		@NotBlank(message = "procedure는 필수입니다.")
		String procedure,

		@NotNull(message = "procedure_at은 필수입니다.")
		LocalDate procedureAt,

		String clinicId
) {
}
