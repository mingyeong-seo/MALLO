package com.mallo.backend.domain.record.dto;

import java.util.List;

import com.mallo.backend.domain.record.entity.PerformedStatus;
import com.mallo.backend.domain.record.entity.RecoveryRecord;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/**
 * S09 Recovery Record 저장 요청. 화면(image 75/76)이 카테고리 5개/세부 행동 최대 12개를
 * 저장 버튼 한 번에 저장하는 구조라, 행동은 여러 건을 리스트로 한 번에 받는다.
 * photoRecordIds는 선택 — 미리 /photos로 업로드해서 받은 id들을 여기 실어서 같이 저장한다 (최대 5장).
 */
public record RecoveryRecordCreateRequest(

		@Schema(description = "시술 당일=0 기준 경과일. 프론트가 이 숫자를 'DAY N' 문자열로 변환한다", example = "1")
		@NotNull
		@PositiveOrZero
		Integer elapsedDay,

		@Schema(description = "오늘 확인한 행동 목록 (최소 1개, 순서대로 저장됨)")
		@NotEmpty
		@Valid
		List<ActionEntry> actions,

		@Schema(description = "선택 메모", example = "가볍게 산책함")
		@Size(max = 1000)
		String memo,

		@Schema(description = "미리 POST /photos로 업로드해서 받은 사진 id 목록 (선택, 최대 " + RecoveryRecord.MAX_PHOTOS
				+ "장, 같은 세션 것만 연결 가능)")
		@Size(max = RecoveryRecord.MAX_PHOTOS, message = "사진은 최대 " + RecoveryRecord.MAX_PHOTOS + "장까지 첨부할 수 있습니다.")
		List<Long> photoRecordIds
) {

	@Schema(description = "행동 코드 + 실제 수행 여부 1건")
	public record ActionEntry(

			@Schema(description = "수행한 행동 코드 (action enum 미확정이라 지금은 자유 문자열)", example = "EXERCISE")
			@NotBlank
			String action,

			@Schema(description = "실제로 했는지 여부")
			@NotNull
			PerformedStatus performedStatus
	) {
	}
}
