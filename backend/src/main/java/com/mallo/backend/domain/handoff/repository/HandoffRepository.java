package com.mallo.backend.domain.handoff.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mallo.backend.domain.handoff.entity.Handoff;

public interface HandoffRepository extends JpaRepository<Handoff, Long> {
}
