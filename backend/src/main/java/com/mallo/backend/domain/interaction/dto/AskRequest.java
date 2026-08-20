package com.mallo.backend.domain.interaction.dto;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

/**
 * POST /v1/ask 요청 바디. 사진은 새 업로드 API 없이 기존 Record Photo API
 * (POST /v1/sessions/{sessionId}/photos)로 미리 업로드해서 받은 id만 참조한다.
 * MVP에서는 첨부 개수를 제한하지 않는다.
 */
public record AskRequest(
		@Schema(description = "자연어 질문", example = "고강도 운동 해도 되나요?")
		@NotBlank String question,

		@Schema(description = "미리 업로드해서 받은 사진 record id 목록 (선택, 개수 제한 없음)")
		List<Long> photoRecordIds
) {
}
