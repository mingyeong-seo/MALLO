package com.mallo.backend.domain.record.controller;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.mallo.backend.domain.record.dto.PhotoRecordResponse;
import com.mallo.backend.domain.record.entity.RecoveryRecord;
import com.mallo.backend.domain.record.service.PhotoRecordService;
import com.mallo.backend.global.response.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@Tag(name = "Photo", description = "회복 기록 사진 업로드/관찰 결과")
@RestController
@RequiredArgsConstructor
public class PhotoRecordController {

	private final PhotoRecordService photoRecordService;

	@Operation(
			summary = "사진 업로드 (한 장씩) 및 비의료적 관찰 결과 조회 (관찰은 Mock, 저장은 로컬 디스크)",
			description = "여러 장 붙이려면 이 API를 여러 번 호출해서 photoRecordId를 모은 뒤, "
					+ "기록 저장/수정 시 photoRecordIds로 같이 보내면 된다 (최대 " + RecoveryRecord.MAX_PHOTOS + "장).",
			requestBody = @RequestBody(content = @Content(mediaType = "multipart/form-data",
					schema = @Schema(type = "object")))
	)
	@ApiResponses({
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "업로드 성공"),
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "사진 저장 실패")
	})
	@PostMapping(value = "/v1/sessions/{sessionId}/photos")
	public ApiResponse<PhotoRecordResponse> upload(
			@Parameter(description = "세션 id") @PathVariable String sessionId,
			@Parameter(description = "업로드할 사진 파일") @RequestParam("photo") MultipartFile photo
	) {
		return ApiResponse.success(photoRecordService.upload(sessionId, photo));
	}
}
