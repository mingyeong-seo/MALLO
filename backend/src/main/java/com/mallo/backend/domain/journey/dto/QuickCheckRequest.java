package com.mallo.backend.domain.journey.dto;

import java.util.Map;

import com.mallo.backend.domain.journey.entity.ActionType;

import jakarta.validation.constraints.NotNull;

/**
 * POST /v1/checks 요청 바디.
 * context는 S07에서 선택한 조건들(예: {"intensity":"HIGH"}). 없으면 빈 맵으로 취급.
 */
public record QuickCheckRequest(
		@NotNull(message = "action은 필수입니다.")
		ActionType action,

		Map<String, Object> context
) {
	public Map<String, Object> contextOrEmpty() {
		return context == null ? Map.of() : context;
	}
}
