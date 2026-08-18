package com.mallo.backend.domain.record.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

/**
 * S09 Recovery Record 수정 요청. 부분 수정만 지원 — 값을 안 보낸 필드는 그대로 둔다.
 * memo만 고치거나, photoRecordId만 새로 붙이거나(또는 둘 다) 가능.
 */
public record RecoveryRecordUpdateRequest(

		@Schema(description = "수정할 메모. 안 보내면(null) 기존 메모 유지", example = "수정된 메모")
		@Size(max = 1000)
		String memo,

		@Schema(description = "새로 연결할 사진 id. 안 보내면(null) 기존 사진 유지, 같은 세션 것만 연결 가능")
		Long photoRecordId
) {
}
