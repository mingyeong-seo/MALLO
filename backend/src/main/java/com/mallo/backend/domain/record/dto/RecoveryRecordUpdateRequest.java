package com.mallo.backend.domain.record.dto;

import java.util.List;

import com.mallo.backend.domain.record.entity.RecoveryRecord;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

/**
 * S09 Recovery Record 수정 요청. 부분 수정만 지원 — 값을 안 보낸 필드는 그대로 둔다.
 * memo/actions/photoRecordIds 중 필요한 것만 보내면 됨(조합 가능).
 * actions/photoRecordIds를 보내면 기존 것 전체를 그걸로 교체한다.
 */
public record RecoveryRecordUpdateRequest(

		@Schema(description = "수정할 메모. 안 보내면(null) 기존 메모 유지", example = "수정된 메모")
		@Size(max = 1000)
		String memo,

		@Schema(description = "새로 저장할 행동 목록. 안 보내면(null) 기존 목록 유지, 보내면(최소 1개) 전체 교체")
		@Size(min = 1)
		@Valid
		List<RecoveryRecordCreateRequest.ActionEntry> actions,

		@Schema(description = "새로 연결할 사진 id 목록 (최대 " + RecoveryRecord.MAX_PHOTOS + "장). "
				+ "안 보내면(null) 기존 사진 유지, 빈 배열([])을 보내면 사진 전체 삭제, 같은 세션 것만 연결 가능")
		@Size(max = RecoveryRecord.MAX_PHOTOS, message = "사진은 최대 " + RecoveryRecord.MAX_PHOTOS + "장까지 첨부할 수 있습니다.")
		List<Long> photoRecordIds
) {
}
