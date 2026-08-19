package com.mallo.backend.domain.medicalstaff.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mallo.backend.domain.medicalstaff.entity.MedicalStaff;

public interface MedicalStaffRepository extends JpaRepository<MedicalStaff, Long> {

	Optional<MedicalStaff> findByClinicId(String clinicId);
}
