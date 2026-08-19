package com.mallo.backend.domain.record.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mallo.backend.domain.record.dto.PhotoRecordResponse;
import com.mallo.backend.domain.record.dto.RecoveryRecordCreateRequest;
import com.mallo.backend.domain.record.dto.RecoveryRecordResponse;
import com.mallo.backend.domain.record.dto.RecoveryRecordUpdateRequest;
import com.mallo.backend.domain.record.entity.PhotoRecord;
import com.mallo.backend.domain.record.entity.RecordAction;
import com.mallo.backend.domain.record.entity.RecoveryRecord;
import com.mallo.backend.domain.record.exception.RecordErrorCode;
import com.mallo.backend.domain.record.port.CheckQueryPort;
import com.mallo.backend.domain.record.repository.RecoveryRecordRepository;
import com.mallo.backend.global.exception.CustomException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecoveryRecordService {

	private final RecoveryRecordRepository recoveryRecordRepository;
	private final PhotoRecordService photoRecordService;
	private final CheckQueryPort checkQueryPort;

	@Transactional
	public RecoveryRecordResponse create(String sessionId, RecoveryRecordCreateRequest request) {
		List<PhotoRecord> photoRecords = resolvePhotos(sessionId, request.photoRecordIds());
		validateChecks(sessionId, request.actions());

		RecoveryRecord record = RecoveryRecord.builder()
				.sessionId(sessionId)
				.elapsedDay(request.elapsedDay())
				.actions(toRecordActions(request.actions()))
				.memo(request.memo())
				.build();
		record.attachPhotos(photoRecords);

		recoveryRecordRepository.save(record);

		return toResponse(record);
	}

	public List<RecoveryRecordResponse> getJournal(String sessionId) {
		return recoveryRecordRepository.findBySessionIdOrderByElapsedDayAsc(sessionId).stream()
				.map(this::toResponse)
				.toList();
	}

	/**
	 * "오늘 기록이 있는지 / record_id가 뭔지"를 프론트가 전체 목록에서 찾지 않아도 되도록
	 * 백엔드가 오늘 날짜 기준으로 직접 판단해서 돌려준다 (docs/S09_S10_PHOTO_QA_REPLY.md 참고).
	 * 없으면 null — 프론트는 null이면 신규 작성, 있으면 그 record_id로 수정하면 된다.
	 */
	public RecoveryRecordResponse getToday(String sessionId) {
		LocalDate today = LocalDate.now();
		Optional<RecoveryRecord> record = recoveryRecordRepository
				.findFirstBySessionIdAndCreatedAtBetweenOrderByCreatedAtDesc(
						sessionId, today.atStartOfDay(), today.plusDays(1).atStartOfDay());
		return record.map(this::toResponse).orElse(null);
	}

	@Transactional
	public RecoveryRecordResponse update(String sessionId, Long recordId, RecoveryRecordUpdateRequest request) {
		RecoveryRecord record = recoveryRecordRepository.findById(recordId)
				.orElseThrow(() -> new CustomException(RecordErrorCode.RECORD_NOT_FOUND));
		if (!record.getSessionId().equals(sessionId)) {
			throw new CustomException(RecordErrorCode.RECORD_SESSION_MISMATCH);
		}
		// 당일 작성한 기록만 수정 가능, 과거 DAY는 조회만 (docs/S09_S10_PHOTO_QA_REPLY.md 섹션 6 확정)
		// 세션 도메인의 elapsed_day 없이도 판단 가능하도록 "생성일 == 오늘"로 검사한다.
		if (!record.getCreatedAt().toLocalDate().isEqual(LocalDate.now())) {
			throw new CustomException(RecordErrorCode.RECORD_NOT_EDITABLE);
		}

		if (request.memo() != null) {
			record.updateMemo(request.memo());
		}
		if (request.actions() != null) {
			validateChecks(sessionId, request.actions());
			record.replaceActions(toRecordActions(request.actions()));
		}
		if (request.photoRecordIds() != null) {
			record.attachPhotos(resolvePhotos(sessionId, request.photoRecordIds()));
		}

		return toResponse(record);
	}

	private List<RecordAction> toRecordActions(List<RecoveryRecordCreateRequest.ActionEntry> entries) {
		return entries.stream()
				.map(entry -> RecordAction.builder()
						.checkId(entry.checkId())
						.performedStatus(entry.performedStatus())
						.build())
				.toList();
	}

	/** actions[]의 checkId 각각이 실제로 존재하고 같은 세션 것인지 검증한다 (resolvePhotos와 동일 패턴). */
	private void validateChecks(String sessionId, List<RecoveryRecordCreateRequest.ActionEntry> entries) {
		UUID sessionUuid = UUID.fromString(sessionId);
		for (RecoveryRecordCreateRequest.ActionEntry entry : entries) {
			if (!checkQueryPort.existsForSession(entry.checkId(), sessionUuid)) {
				throw new CustomException(RecordErrorCode.CHECK_SESSION_MISMATCH);
			}
		}
	}

	/** photoRecordId 각각이 존재하고 같은 세션 것인지 검증한 뒤 엔티티 목록으로 바꾼다. */
	private List<PhotoRecord> resolvePhotos(String sessionId, List<Long> photoRecordIds) {
		if (photoRecordIds == null) {
			return List.of();
		}
		return photoRecordIds.stream()
				.map(photoRecordId -> {
					PhotoRecord photoRecord = photoRecordService.getById(photoRecordId);
					if (!photoRecord.getSessionId().equals(sessionId)) {
						throw new CustomException(RecordErrorCode.PHOTO_SESSION_MISMATCH);
					}
					return photoRecord;
				})
				.toList();
	}

	private RecoveryRecordResponse toResponse(RecoveryRecord record) {
		List<PhotoRecordResponse> photos = record.getPhotoRecords().stream()
				.map(photoRecordService::toResponse)
				.toList();
		return RecoveryRecordResponse.of(record, photos);
	}
}
