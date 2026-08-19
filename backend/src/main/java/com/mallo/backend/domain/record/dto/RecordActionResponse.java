package com.mallo.backend.domain.record.dto;

import com.mallo.backend.domain.record.entity.PerformedStatus;
import com.mallo.backend.domain.record.entity.RecordAction;

import io.swagger.v3.oas.annotations.media.Schema;

public record RecordActionResponse(
		@Schema(description = "수행한 행동 코드") String action,
		@Schema(description = "실제로 했는지 여부") PerformedStatus performedStatus
) {

	public static RecordActionResponse of(RecordAction recordAction) {
		return new RecordActionResponse(recordAction.getAction(), recordAction.getPerformedStatus());
	}
}
