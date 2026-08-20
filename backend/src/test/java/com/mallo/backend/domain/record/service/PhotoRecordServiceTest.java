package com.mallo.backend.domain.record.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import com.mallo.backend.domain.record.dto.PhotoRecordResponse;
import com.mallo.backend.domain.record.entity.PhotoRecord;
import com.mallo.backend.domain.record.exception.RecordErrorCode;
import com.mallo.backend.domain.record.repository.PhotoRecordRepository;
import com.mallo.backend.global.exception.CustomException;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

@ExtendWith(MockitoExtension.class)
class PhotoRecordServiceTest {

	private static final String SESSION_ID = "11111111-1111-1111-1111-111111111111";

	@Mock
	private PhotoRecordRepository photoRecordRepository;

	@Mock
	private PhotoObservationAdapter photoObservationAdapter;

	@Mock
	private PhotoStorageAdapter photoStorageAdapter;

	@Mock
	private JsonMapper jsonMapper;

	@InjectMocks
	private PhotoRecordService photoRecordService;

	@Test
	void 사진을_업로드하면_비의료적_관찰_결과와_사진_URL을_반환한다() {
		MockMultipartFile photo = new MockMultipartFile("photo", "wound.jpg", "image/jpeg", new byte[] {1, 2, 3});
		Map<String, Object> observation = Map.of("redness", "LOW", "dryness", "MEDIUM");
		given(photoStorageAdapter.upload(SESSION_ID, photo)).willReturn(SESSION_ID + "/generated.jpg");
		given(photoStorageAdapter.resolveUrl(SESSION_ID + "/generated.jpg"))
				.willReturn("/uploads/photos/" + SESSION_ID + "/generated.jpg");
		given(photoObservationAdapter.observe(photo)).willReturn(observation);
		given(jsonMapper.writeValueAsString(observation)).willReturn("{\"redness\":\"LOW\",\"dryness\":\"MEDIUM\"}");

		PhotoRecordResponse response = photoRecordService.upload(SESSION_ID, photo);

		assertThat(response.sessionId()).isEqualTo(SESSION_ID);
		assertThat(response.observation()).isEqualTo(observation);
		assertThat(response.observation()).doesNotContainKeys("risk_score", "diagnosis", "side_effect");
		assertThat(response.photoUrl()).isEqualTo("/uploads/photos/" + SESSION_ID + "/generated.jpg");
	}

	@Test
	void 존재하지_않는_사진을_조회하면_예외가_발생한다() {
		given(photoRecordRepository.findById(1L)).willReturn(java.util.Optional.empty());

		assertThatThrownBy(() -> photoRecordService.getById(1L))
				.isInstanceOf(CustomException.class)
				.extracting(e -> ((CustomException) e).getErrorCode())
				.isEqualTo(RecordErrorCode.PHOTO_NOT_FOUND);
	}

	@Test
	void observationJson이_없으면_빈_맵을_반환한다() {
		PhotoRecord photoRecord = PhotoRecord.builder()
				.sessionId(SESSION_ID)
				.observationJson(null)
				.build();

		Map<String, Object> observation = photoRecordService.readObservation(photoRecord);

		assertThat(observation).isEmpty();
	}

	@Test
	void observationJson이_깨져있으면_빈_맵을_반환한다() {
		PhotoRecord photoRecord = PhotoRecord.builder()
				.sessionId(SESSION_ID)
				.observationJson("{broken")
				.build();
		given(jsonMapper.readValue(anyString(), any(tools.jackson.core.type.TypeReference.class)))
				.willThrow(mock(JacksonException.class));

		Map<String, Object> observation = photoRecordService.readObservation(photoRecord);

		assertThat(observation).isEmpty();
	}
}
