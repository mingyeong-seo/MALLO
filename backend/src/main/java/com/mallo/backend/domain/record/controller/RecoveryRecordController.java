package com.mallo.backend.domain.record.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.mallo.backend.domain.record.dto.RecoveryRecordCreateRequest;
import com.mallo.backend.domain.record.dto.RecoveryRecordResponse;
import com.mallo.backend.domain.record.dto.RecoveryRecordUpdateRequest;
import com.mallo.backend.domain.record.service.RecoveryRecordService;
import com.mallo.backend.global.response.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Tag(name = "RecoveryRecord", description = "DAY별 회복 기록 (S09 Recovery Record / S10 Recovery Journal)")
@RestController
@RequiredArgsConstructor
public class RecoveryRecordController {

	private final RecoveryRecordService recoveryRecordService;

	@Operation(summary = "회복 기록 저장 (S09)")
	@ApiResponses({
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "저장 성공"),
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400",
					description = "요청 검증 실패, 다른 세션의 photoRecordId를 연결하려 함, "
							+ "또는 존재하지 않거나 다른 세션의 check_id를 연결하려 함")
	})
	@PostMapping("/v1/sessions/{sessionId}/records")
	public ApiResponse<RecoveryRecordResponse> create(
			@Parameter(description = "세션 id") @PathVariable String sessionId,
			@Valid @RequestBody RecoveryRecordCreateRequest request
	) {
		return ApiResponse.success(recoveryRecordService.create(sessionId, request));
	}

	@Operation(summary = "세션의 DAY별 기록 전체 조회 (S10 Recovery Journal)")
	@GetMapping("/v1/sessions/{sessionId}/records")
	public ApiResponse<List<RecoveryRecordResponse>> getJournal(
			@Parameter(description = "세션 id") @PathVariable String sessionId
	) {
		return ApiResponse.success(recoveryRecordService.getJournal(sessionId));
	}

	@Operation(summary = "오늘 기록 조회 (S09) — 있으면 그 record_id로 수정, 없으면 신규 작성 CTA에 사용",
			description = "오늘 만든 기록이 없으면 data가 null로 옵니다 (success는 true).")
	@GetMapping("/v1/sessions/{sessionId}/records/today")
	public ApiResponse<RecoveryRecordResponse> getToday(
			@Parameter(description = "세션 id") @PathVariable String sessionId
	) {
		return ApiResponse.success(recoveryRecordService.getToday(sessionId));
	}

	@Operation(summary = "회복 기록 메모/사진 수정 (S09) — 당일 작성한 기록만 수정 가능, 과거 DAY는 조회만 가능")
	@ApiResponses({
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "수정 성공"),
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400",
					description = "요청 검증 실패, 다른 세션의 기록/사진/check_id를 건드리려 함"),
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403",
					description = "오늘 작성한 기록이 아니라서 수정 불가"),
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "기록을 찾을 수 없음")
	})
	@PatchMapping("/v1/sessions/{sessionId}/records/{recordId}")
	public ApiResponse<RecoveryRecordResponse> update(
			@Parameter(description = "세션 id") @PathVariable String sessionId,
			@Parameter(description = "수정할 기록 id") @PathVariable Long recordId,
			@Valid @RequestBody RecoveryRecordUpdateRequest request
	) {
		return ApiResponse.success(recoveryRecordService.update(sessionId, recordId, request));
	}
}
