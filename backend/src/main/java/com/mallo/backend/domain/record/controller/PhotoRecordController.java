package com.mallo.backend.domain.record.controller;

import org.springframework.http.MediaType;
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
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@Tag(name = "Photo", description = "회복 기록 사진 업로드/관찰 결과")
@RestController
@RequiredArgsConstructor
public class PhotoRecordController {

	private final PhotoRecordService photoRecordService;

	// requestBody를 수동으로 지정하지 않는다 — @RequestParam("photo") MultipartFile을 springdoc이
	// 자동으로 파일 업로드 필드로 인식해서 만들어주는데, 수동 지정하면 그 자동 스키마를 덮어써서
	// Swagger UI에 파일 선택 필드 없는 빈 객체({})로 나온다 (실제 겪은 버그, 재발 방지용 주석)
	@Operation(
			summary = "사진 업로드 (한 장씩) 및 비의료적 관찰 결과 조회 (관찰은 Mock, 저장은 로컬 디스크)",
			description = "여러 장 붙이려면 이 API를 여러 번 호출해서 photoRecordId를 모은 뒤, "
					+ "기록 저장/수정 시 photoRecordIds로 같이 보내면 된다 (최대 " + RecoveryRecord.MAX_PHOTOS + "장)."
	)
	@ApiResponses({
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "업로드 성공"),
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "사진 저장 실패")
	})
	// consumes를 명시해야 springdoc이 requestBody 미디어 타입을 multipart/form-data로 정확히 문서화한다
	// (없으면 Spring MVC는 여전히 MultipartFile을 정상 처리하지만, Swagger 문서만 application/json으로 잘못 표기됨)
	@PostMapping(value = "/v1/sessions/{sessionId}/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ApiResponse<PhotoRecordResponse> upload(
			@Parameter(description = "세션 id") @PathVariable String sessionId,
			@Parameter(description = "업로드할 사진 파일") @RequestParam("photo") MultipartFile photo
	) {
		return ApiResponse.success(photoRecordService.upload(sessionId, photo));
	}
}
