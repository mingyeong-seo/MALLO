package com.mallo.backend.domain.record.dto;

import java.time.LocalDateTime;
import java.util.Map;

import com.mallo.backend.domain.record.entity.PhotoRecord;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * storage_key(내부 저장 위치, 로컬 파일 경로 등)는 그대로 응답에 안 싣고,
 * 대신 클라이언트가 바로 접근 가능한 photoUrl로 변환해서 내려준다 (PhotoStorageAdapter.resolveUrl 참고).
 * observation은 비의료적 관찰 결과만 담긴다 (redness/dryness 등) — 진단/위험도 필드는 절대 없음.
 */
public record PhotoRecordResponse(
		@Schema(description = "사진 id") Long photoId,
		@Schema(description = "세션 id") String sessionId,
		@Schema(description = "비의료적 관찰 결과 (redness/dryness 등). 진단/위험도 필드는 절대 포함되지 않음",
				example = "{\"redness\": \"LOW\", \"dryness\": \"MEDIUM\"}")
		Map<String, Object> observation,
		@Schema(description = "사진을 바로 불러올 수 있는 URL", example = "/uploads/photos/{sessionId}/{uuid}.jpg")
		String photoUrl,
		@Schema(description = "업로드 시각") LocalDateTime createdAt
) {

	public static PhotoRecordResponse of(PhotoRecord photoRecord, Map<String, Object> observation, String photoUrl) {
		return new PhotoRecordResponse(
				photoRecord.getId(),
				photoRecord.getSessionId(),
				observation,
				photoUrl,
				photoRecord.getCreatedAt()
		);
	}
}
