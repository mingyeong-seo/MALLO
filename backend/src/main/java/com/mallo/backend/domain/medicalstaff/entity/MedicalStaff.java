package com.mallo.backend.domain.medicalstaff.entity;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor
public class MedicalStaff {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String clinicId; //SessionInfo.clinicId 와 매칭되는 값

	private String name; //의료진 이름

	private String clinicName; //병원 이름

	private String specialty; //전문 분야

	@CreationTimestamp
	private LocalDateTime createdAt;

	public MedicalStaff(String clinicId, String name, String clinicName, String specialty) {
		this.clinicId = clinicId;
		this.name = name;
		this.clinicName = clinicName;
		this.specialty = specialty;
	}
}
