package com.mallo.backend.domain.record.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mallo.backend.domain.record.entity.PhotoRecord;

public interface PhotoRecordRepository extends JpaRepository<PhotoRecord, Long> {
}
