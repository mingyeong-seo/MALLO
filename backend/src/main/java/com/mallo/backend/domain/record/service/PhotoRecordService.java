package com.mallo.backend.domain.record.service;

import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.mallo.backend.domain.record.dto.PhotoRecordResponse;
import com.mallo.backend.domain.record.entity.PhotoRecord;
import com.mallo.backend.domain.record.exception.RecordErrorCode;
import com.mallo.backend.domain.record.repository.PhotoRecordRepository;
import com.mallo.backend.global.exception.CustomException;

import lombok.RequiredArgsConstructor;
import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PhotoRecordService {

	private final PhotoRecordRepository photoRecordRepository;
	private final PhotoObservationAdapter photoObservationAdapter;
	private final PhotoStorageAdapter photoStorageAdapter;
	private final JsonMapper jsonMapper;

	@Transactional
	public PhotoRecordResponse upload(String sessionId, MultipartFile photo) {
		String storageKey = photoStorageAdapter.upload(sessionId, photo);
		Map<String, Object> observation = photoObservationAdapter.observe(photo);

		PhotoRecord photoRecord = PhotoRecord.builder()
				.sessionId(sessionId)
				.storageKey(storageKey)
				.observationJson(jsonMapper.writeValueAsString(observation))
				.build();

		photoRecordRepository.save(photoRecord);

		return toResponse(photoRecord, observation);
	}

	PhotoRecord getById(Long photoRecordId) {
		return photoRecordRepository.findById(photoRecordId)
				.orElseThrow(() -> new CustomException(RecordErrorCode.PHOTO_NOT_FOUND));
	}

	/** RecoveryRecordService가 같이 붙어있는 사진을 응답에 실을 때도 이걸 그대로 쓴다. */
	PhotoRecordResponse toResponse(PhotoRecord photoRecord) {
		return toResponse(photoRecord, readObservation(photoRecord));
	}

	private PhotoRecordResponse toResponse(PhotoRecord photoRecord, Map<String, Object> observation) {
		String photoUrl = photoStorageAdapter.resolveUrl(photoRecord.getStorageKey());
		return PhotoRecordResponse.of(photoRecord, observation, photoUrl);
	}

	Map<String, Object> readObservation(PhotoRecord photoRecord) {
		if (photoRecord.getObservationJson() == null) {
			return Map.of();
		}
		try {
			return jsonMapper.readValue(photoRecord.getObservationJson(), new TypeReference<Map<String, Object>>() {
			});
		} catch (JacksonException e) {
			return Map.of();
		}
	}
}
