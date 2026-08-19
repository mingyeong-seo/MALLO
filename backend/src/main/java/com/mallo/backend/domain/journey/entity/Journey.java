package com.mallo.backend.domain.journey.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "journey")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Journey {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
}
