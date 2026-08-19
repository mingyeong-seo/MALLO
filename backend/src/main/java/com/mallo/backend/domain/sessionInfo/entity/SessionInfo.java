package com.mallo.backend.domain.sessionInfo.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Recovery Session(= Recovery Journey) 하나를 나타낸다.
 * 회원 개념이 없어서 session_id(=id)가 사실상 최상위 식별자 역할을 한다.
 */
@Entity
@Table(name = "session_info")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SessionInfo {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	// "procedure"는 MySQL 예약어(CREATE PROCEDURE)라서 컬럼명은 procedure_name으로 회피
	@Column(name = "procedure_name", nullable = false)
	private String procedure;

	@Column(nullable = false)
	private LocalDate procedureAt;

	private String clinicId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private SessionStatus status;

	@CreationTimestamp
	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Builder
	private SessionInfo(String procedure, LocalDate procedureAt, String clinicId) {
		this.procedure = procedure;
		this.procedureAt = procedureAt;
		this.clinicId = clinicId;
		this.status = SessionStatus.ACTIVE;
	}

	/**
	 * 시술 당일 = 0, 그 다음날 = 1 ... 프론트는 이 값에 +1 해서 "DAY n"으로 표시한다.
	 * DB에 저장하지 않고 조회 시점마다 계산한다.
	 */
	public int getElapsedDay() {
		return (int) ChronoUnit.DAYS.between(procedureAt, LocalDate.now());
	}

	public boolean isActive() {
		return status == SessionStatus.ACTIVE;
	}

	public void complete() {
		this.status = SessionStatus.COMPLETED;
	}
}
