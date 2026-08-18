package com.mallo.backend.domain.record.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mallo.backend.domain.record.dto.PhotoRecordResponse;
import com.mallo.backend.domain.record.dto.RecoveryRecordCreateRequest;
import com.mallo.backend.domain.record.dto.RecoveryRecordResponse;
import com.mallo.backend.domain.record.dto.RecoveryRecordUpdateRequest;
import com.mallo.backend.domain.record.entity.PhotoRecord;
import com.mallo.backend.domain.record.entity.RecoveryRecord;
import com.mallo.backend.domain.record.exception.RecordErrorCode;
import com.mallo.backend.domain.record.repository.RecoveryRecordRepository;
import com.mallo.backend.global.exception.CustomException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecoveryRecordService {

	private final RecoveryRecordRepository recoveryRecordRepository;
	private final PhotoRecordService photoRecordService;

	@Transactional
	public RecoveryRecordResponse create(String sessionId, RecoveryRecordCreateRequest request) {
		PhotoRecord photoRecord = null;
		if (request.photoRecordId() != null) {
			photoRecord = photoRecordService.getById(request.photoRecordId());
			if (!photoRecord.getSessionId().equals(sessionId)) {
				throw new CustomException(RecordErrorCode.PHOTO_SESSION_MISMATCH);
			}
		}

		RecoveryRecord record = RecoveryRecord.builder()
				.sessionId(sessionId)
				.elapsedDay(request.elapsedDay())
				.action(request.action())
				.performedStatus(request.performedStatus())
				.memo(request.memo())
				.photoRecord(photoRecord)
				.build();

		recoveryRecordRepository.save(record);

		return toResponse(record);
	}

	public List<RecoveryRecordResponse> getJournal(String sessionId) {
		return recoveryRecordRepository.findBySessionIdOrderByElapsedDayAsc(sessionId).stream()
				.map(this::toResponse)
				.toList();
	}

	@Transactional
	public RecoveryRecordResponse update(String sessionId, Long recordId, RecoveryRecordUpdateRequest request) {
		RecoveryRecord record = recoveryRecordRepository.findById(recordId)
				.orElseThrow(() -> new CustomException(RecordErrorCode.RECORD_NOT_FOUND));
		if (!record.getSessionId().equals(sessionId)) {
			throw new CustomException(RecordErrorCode.RECORD_SESSION_MISMATCH);
		}

		if (request.memo() != null) {
			record.updateMemo(request.memo());
		}
		if (request.photoRecordId() != null) {
			PhotoRecord photoRecord = photoRecordService.getById(request.photoRecordId());
			if (!photoRecord.getSessionId().equals(sessionId)) {
				throw new CustomException(RecordErrorCode.PHOTO_SESSION_MISMATCH);
			}
			record.attachPhoto(photoRecord);
		}

		return toResponse(record);
	}

	private RecoveryRecordResponse toResponse(RecoveryRecord record) {
		PhotoRecordResponse photoResponse = null;
		PhotoRecord photoRecord = record.getPhotoRecord();
		if (photoRecord != null) {
			photoResponse = photoRecordService.toResponse(photoRecord);
		}
		return RecoveryRecordResponse.of(record, photoResponse);
	}
}
