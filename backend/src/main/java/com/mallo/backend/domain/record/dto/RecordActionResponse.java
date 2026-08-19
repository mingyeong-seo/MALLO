package com.mallo.backend.domain.record.dto;

import java.util.UUID;

import com.mallo.backend.domain.record.entity.PerformedStatus;
import com.mallo.backend.domain.record.entity.RecordAction;

import io.swagger.v3.oas.annotations.media.Schema;

public record RecordActionResponse(
		@Schema(description = "근거가 된 Quick Check id (POST /v1/checks 응답의 check_id)") UUID checkId,
		@Schema(description = "실제로 했는지 여부") PerformedStatus performedStatus
) {

	public static RecordActionResponse of(RecordAction recordAction) {
		return new RecordActionResponse(recordAction.getCheckId(), recordAction.getPerformedStatus());
	}
}
