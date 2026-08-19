package com.mallo.backend.domain.medicalstaff.service;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.mallo.backend.domain.medicalstaff.dto.MedicalStaffResponse;
import com.mallo.backend.domain.medicalstaff.repository.MedicalStaffRepository;
import com.mallo.backend.domain.sessionInfo.entity.SessionInfo;
import com.mallo.backend.domain.sessionInfo.repository.SessionInfoRepository;
import com.mallo.backend.global.exception.CommonErrorCode;
import com.mallo.backend.global.exception.CustomException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MedicalStaffService {

	private final MedicalStaffRepository medicalStaffRepository;
	private final SessionInfoRepository sessionInfoRepository;

	public MedicalStaffResponse getMedicalStaffBySession(UUID sessionId) {
		SessionInfo sessionInfo = sessionInfoRepository.findById(sessionId)
				.orElseThrow(() -> new CustomException(CommonErrorCode.NOT_FOUND));

		String clinicId = sessionInfo.getClinicId();
		if (clinicId == null) {
			throw new CustomException(CommonErrorCode.NOT_FOUND);
		}

		return medicalStaffRepository.findByClinicId(clinicId)
				.map(MedicalStaffResponse::from)
				.orElseThrow(() -> new CustomException(CommonErrorCode.NOT_FOUND));
	}
}
