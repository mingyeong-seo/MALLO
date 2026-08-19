package com.mallo.backend.domain.medicalstaff.dto;

import com.mallo.backend.domain.medicalstaff.entity.MedicalStaff;

public record MedicalStaffResponse(
		String clinicName,
		String doctorName,
		String specialty
) {
	public static MedicalStaffResponse from(MedicalStaff medicalStaff) {
		return new MedicalStaffResponse(
				medicalStaff.getClinicName(),
				medicalStaff.getName(),
				medicalStaff.getSpecialty()
		);
	}
}
