package com.mallo.backend.domain.medicalstaff.controller;

import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mallo.backend.domain.medicalstaff.dto.MedicalStaffResponse;
import com.mallo.backend.domain.medicalstaff.service.MedicalStaffService;
import com.mallo.backend.global.response.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/v1/sessions/{sessionId}/clinic")
@RequiredArgsConstructor
public class MedicalStaffController {

	private final MedicalStaffService medicalStaffService;

	@GetMapping
	public ApiResponse<MedicalStaffResponse> getMedicalStaff(@PathVariable UUID sessionId) {
		return ApiResponse.success(medicalStaffService.getMedicalStaffBySession(sessionId));
	}
}
