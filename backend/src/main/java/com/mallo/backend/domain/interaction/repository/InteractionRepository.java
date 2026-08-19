package com.mallo.backend.domain.interaction.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mallo.backend.domain.interaction.entity.Interaction;

public interface InteractionRepository extends JpaRepository<Interaction, Long> {
}
