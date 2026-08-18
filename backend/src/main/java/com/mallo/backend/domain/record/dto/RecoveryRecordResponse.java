package com.mallo.backend.domain.record.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.mallo.backend.domain.record.entity.PerformedStatus;
import com.mallo.backend.domain.record.entity.RecoveryRecord;

import io.swagger.v3.oas.annotations.media.Schema;

public record RecoveryRecordResponse(
		@Schema(description = "기록 id") Long id,
		@Schema(description = "세션 id") String sessionId,
		@Schema(description = "시술 당일=0 기준 경과일") Integer elapsedDay,
		@Schema(description = "수행한 행동 코드") String action,
		@Schema(description = "실제로 했는지 여부") PerformedStatus performedStatus,
		@Schema(description = "메모, 없으면 null") String memo,
		@Schema(description = "연결된 사진 목록 (id 오름차순), 없으면 빈 배열. 최대 " + RecoveryRecord.MAX_PHOTOS + "장")
		List<PhotoRecordResponse> photos,
		@Schema(description = "생성 시각") LocalDateTime createdAt
) {

	public static RecoveryRecordResponse of(RecoveryRecord record, List<PhotoRecordResponse> photos) {
		return new RecoveryRecordResponse(
				record.getId(),
				record.getSessionId(),
				record.getElapsedDay(),
				record.getAction(),
				record.getPerformedStatus(),
				record.getMemo(),
				photos,
				record.getCreatedAt()
		);
	}
}
