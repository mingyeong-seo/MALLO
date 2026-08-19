package com.mallo.backend.domain.medicalstaff;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.mallo.backend.domain.medicalstaff.entity.MedicalStaff;
import com.mallo.backend.domain.medicalstaff.repository.MedicalStaffRepository;

import lombok.RequiredArgsConstructor;

/**
 * 테스트용 임시 데이터 삽입.
 * 관리자용 의료진 등록 기능이 아직 없어서, clinic_001에 대한 의료진 정보를 미리 하나 넣어둔다.
 * 나중에 실제 등록 기능이 생기면 이 파일은 지운다.
 */
@Component
@RequiredArgsConstructor
public class MedicalStaffDataInitializer implements CommandLineRunner {

	private final MedicalStaffRepository medicalStaffRepository;

	@Override
	public void run(String... args) {
		if (medicalStaffRepository.findByClinicId("clinic_001").isEmpty()) {
			medicalStaffRepository.save(new MedicalStaff("clinic_001", "김OO", "OO의원", "피부과 전문의"));
		}
	}
}
