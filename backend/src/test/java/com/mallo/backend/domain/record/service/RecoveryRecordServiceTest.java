package com.mallo.backend.domain.record.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.mallo.backend.domain.record.dto.PhotoRecordResponse;
import com.mallo.backend.domain.record.dto.RecoveryRecordCreateRequest;
import com.mallo.backend.domain.record.dto.RecoveryRecordCreateRequest.ActionEntry;
import com.mallo.backend.domain.record.dto.RecoveryRecordResponse;
import com.mallo.backend.domain.record.dto.RecoveryRecordUpdateRequest;
import com.mallo.backend.domain.record.entity.PerformedStatus;
import com.mallo.backend.domain.record.entity.PhotoRecord;
import com.mallo.backend.domain.record.entity.RecordAction;
import com.mallo.backend.domain.record.entity.RecoveryRecord;
import com.mallo.backend.domain.record.exception.RecordErrorCode;
import com.mallo.backend.domain.record.port.CheckQueryPort;
import com.mallo.backend.domain.record.repository.RecoveryRecordRepository;
import com.mallo.backend.global.exception.CustomException;

@ExtendWith(MockitoExtension.class)
class RecoveryRecordServiceTest {

	private static final String SESSION_ID = "11111111-1111-1111-1111-111111111111";
	private static final String OTHER_SESSION_ID = "22222222-2222-2222-2222-222222222222";
	private static final UUID CHECK_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");
	private static final UUID OTHER_CHECK_ID = UUID.fromString("44444444-4444-4444-4444-444444444444");

	@Mock
	private RecoveryRecordRepository recoveryRecordRepository;

	@Mock
	private PhotoRecordService photoRecordService;

	@Mock
	private CheckQueryPort checkQueryPort;

	@InjectMocks
	private RecoveryRecordService recoveryRecordService;

	/** 대부분의 테스트는 check_id 검증 자체가 관심사가 아니라서, 기본적으로는 통과시켜 둔다. */
	@BeforeEach
	void stubCheckQueryPort() {
		lenient().when(checkQueryPort.existsForSession(any(), any())).thenReturn(true);
	}

	private PhotoRecord photoRecord(String sessionId) {
		return PhotoRecord.builder()
				.sessionId(sessionId)
				.observationJson("{}")
				.build();
	}

	private PhotoRecordResponse photoResponse(PhotoRecord photo) {
		return PhotoRecordResponse.of(photo, java.util.Map.of("redness", "LOW"), "/uploads/photos/mock.jpg");
	}

	private List<ActionEntry> actionEntries(UUID checkId, PerformedStatus performedStatus) {
		return List.of(new ActionEntry(checkId, performedStatus));
	}

	private List<RecordAction> recordActions(UUID checkId, PerformedStatus performedStatus) {
		return List.of(RecordAction.builder().checkId(checkId).performedStatus(performedStatus).build());
	}

	/** BaseTimeEntity.createdAt은 JPA Auditing으로만 채워져서, 순수 단위 테스트에선 리플렉션으로 직접 세팅한다. */
	private void setCreatedAt(RecoveryRecord record, LocalDateTime createdAt) {
		ReflectionTestUtils.setField(record, "createdAt", createdAt);
	}

	@Nested
	class Create {

		@Test
		void 사진_없이_기록을_생성한다() {
			RecoveryRecordCreateRequest request = new RecoveryRecordCreateRequest(
					1, actionEntries(CHECK_ID, PerformedStatus.DONE), "가볍게 산책함", null);

			RecoveryRecordResponse response = recoveryRecordService.create(SESSION_ID, request);

			assertThat(response.sessionId()).isEqualTo(SESSION_ID);
			assertThat(response.elapsedDay()).isEqualTo(1);
			assertThat(response.actions()).hasSize(1);
			assertThat(response.actions().get(0).checkId()).isEqualTo(CHECK_ID);
			assertThat(response.actions().get(0).performedStatus()).isEqualTo(PerformedStatus.DONE);
			assertThat(response.memo()).isEqualTo("가볍게 산책함");
			assertThat(response.photos()).isEmpty();
			verify(recoveryRecordRepository).save(any(RecoveryRecord.class));
			verify(photoRecordService, never()).getById(any());
		}

		@Test
		void 같은_세션의_사진들을_연결해서_기록을_생성한다() {
			PhotoRecord photo1 = photoRecord(SESSION_ID);
			PhotoRecord photo2 = photoRecord(SESSION_ID);
			given(photoRecordService.getById(10L)).willReturn(photo1);
			given(photoRecordService.getById(11L)).willReturn(photo2);
			given(photoRecordService.toResponse(photo1)).willReturn(photoResponse(photo1));
			given(photoRecordService.toResponse(photo2)).willReturn(photoResponse(photo2));

			RecoveryRecordCreateRequest request = new RecoveryRecordCreateRequest(
					2, actionEntries(CHECK_ID, PerformedStatus.ADJUSTED_DONE), null, List.of(10L, 11L));

			RecoveryRecordResponse response = recoveryRecordService.create(SESSION_ID, request);

			assertThat(response.photos()).hasSize(2);
			assertThat(response.photos()).allSatisfy(p -> assertThat(p.sessionId()).isEqualTo(SESSION_ID));
		}

		@Test
		void 다른_세션의_사진을_연결하려면_예외가_발생한다() {
			PhotoRecord photo = photoRecord(OTHER_SESSION_ID);
			given(photoRecordService.getById(10L)).willReturn(photo);

			RecoveryRecordCreateRequest request = new RecoveryRecordCreateRequest(
					2, actionEntries(CHECK_ID, PerformedStatus.DONE), null, List.of(10L));

			assertThatThrownBy(() -> recoveryRecordService.create(SESSION_ID, request))
					.isInstanceOf(CustomException.class)
					.extracting(e -> ((CustomException) e).getErrorCode())
					.isEqualTo(RecordErrorCode.PHOTO_SESSION_MISMATCH);

			verify(recoveryRecordRepository, never()).save(any());
		}

		@Test
		void 존재하지_않거나_다른_세션의_check_id면_예외가_발생한다() {
			given(checkQueryPort.existsForSession(OTHER_CHECK_ID, UUID.fromString(SESSION_ID))).willReturn(false);

			RecoveryRecordCreateRequest request = new RecoveryRecordCreateRequest(
					1, actionEntries(OTHER_CHECK_ID, PerformedStatus.DONE), null, null);

			assertThatThrownBy(() -> recoveryRecordService.create(SESSION_ID, request))
					.isInstanceOf(CustomException.class)
					.extracting(e -> ((CustomException) e).getErrorCode())
					.isEqualTo(RecordErrorCode.CHECK_SESSION_MISMATCH);

			verify(recoveryRecordRepository, never()).save(any());
		}
	}

	@Test
	void 세션의_기록을_DAY_오름차순으로_조회한다() {
		RecoveryRecord record = RecoveryRecord.builder()
				.sessionId(SESSION_ID)
				.elapsedDay(3)
				.actions(recordActions(CHECK_ID, PerformedStatus.DONE))
				.build();
		given(recoveryRecordRepository.findBySessionIdOrderByElapsedDayAsc(SESSION_ID))
				.willReturn(List.of(record));

		List<RecoveryRecordResponse> journal = recoveryRecordService.getJournal(SESSION_ID);

		assertThat(journal).hasSize(1);
		assertThat(journal.get(0).elapsedDay()).isEqualTo(3);
	}

	@Nested
	class GetToday {

		@Test
		void 오늘_기록이_있으면_반환한다() {
			RecoveryRecord record = RecoveryRecord.builder()
					.sessionId(SESSION_ID)
					.elapsedDay(3)
					.actions(recordActions(CHECK_ID, PerformedStatus.DONE))
					.build();
			given(recoveryRecordRepository.findFirstBySessionIdAndCreatedAtBetweenOrderByCreatedAtDesc(
					eq(SESSION_ID), any(), any())).willReturn(Optional.of(record));

			RecoveryRecordResponse response = recoveryRecordService.getToday(SESSION_ID);

			assertThat(response).isNotNull();
			assertThat(response.elapsedDay()).isEqualTo(3);
		}

		@Test
		void 오늘_기록이_없으면_null을_반환한다() {
			given(recoveryRecordRepository.findFirstBySessionIdAndCreatedAtBetweenOrderByCreatedAtDesc(
					eq(SESSION_ID), any(), any())).willReturn(Optional.empty());

			RecoveryRecordResponse response = recoveryRecordService.getToday(SESSION_ID);

			assertThat(response).isNull();
		}
	}

	@Nested
	class Update {

		@Test
		void 메모를_수정한다() {
			RecoveryRecord record = RecoveryRecord.builder()
					.sessionId(SESSION_ID)
					.elapsedDay(1)
					.actions(recordActions(CHECK_ID, PerformedStatus.DONE))
					.memo("이전 메모")
					.build();
			setCreatedAt(record, LocalDateTime.now());
			given(recoveryRecordRepository.findById(1L)).willReturn(Optional.of(record));

			RecoveryRecordResponse response = recoveryRecordService.update(
					SESSION_ID, 1L, new RecoveryRecordUpdateRequest("수정된 메모", null, null));

			assertThat(response.memo()).isEqualTo("수정된 메모");
			verify(photoRecordService, never()).getById(any());
		}

		@Test
		void 행동_목록을_통째로_교체한다() {
			RecoveryRecord record = RecoveryRecord.builder()
					.sessionId(SESSION_ID)
					.elapsedDay(1)
					.actions(recordActions(CHECK_ID, PerformedStatus.DONE))
					.build();
			setCreatedAt(record, LocalDateTime.now());
			given(recoveryRecordRepository.findById(1L)).willReturn(Optional.of(record));
			UUID newCheckId1 = UUID.fromString("55555555-5555-5555-5555-555555555555");
			UUID newCheckId2 = UUID.fromString("66666666-6666-6666-6666-666666666666");

			RecoveryRecordResponse response = recoveryRecordService.update(
					SESSION_ID, 1L, new RecoveryRecordUpdateRequest(null,
							List.of(new ActionEntry(newCheckId1, PerformedStatus.NOT_DONE),
									new ActionEntry(newCheckId2, PerformedStatus.DONE)),
							null));

			assertThat(response.actions()).hasSize(2);
			assertThat(response.actions().get(0).checkId()).isEqualTo(newCheckId1);
			assertThat(response.actions().get(1).checkId()).isEqualTo(newCheckId2);
		}

		@Test
		void 사진을_새로_연결한다() {
			RecoveryRecord record = RecoveryRecord.builder()
					.sessionId(SESSION_ID)
					.elapsedDay(1)
					.actions(recordActions(CHECK_ID, PerformedStatus.DONE))
					.build();
			setCreatedAt(record, LocalDateTime.now());
			PhotoRecord photo = photoRecord(SESSION_ID);
			given(recoveryRecordRepository.findById(1L)).willReturn(Optional.of(record));
			given(photoRecordService.getById(10L)).willReturn(photo);
			given(photoRecordService.toResponse(photo)).willReturn(photoResponse(photo));

			RecoveryRecordResponse response = recoveryRecordService.update(
					SESSION_ID, 1L, new RecoveryRecordUpdateRequest(null, null, List.of(10L)));

			assertThat(response.photos()).hasSize(1);
		}

		@Test
		void 빈_배열을_보내면_기존_사진이_전부_제거된다() {
			RecoveryRecord record = RecoveryRecord.builder()
					.sessionId(SESSION_ID)
					.elapsedDay(1)
					.actions(recordActions(CHECK_ID, PerformedStatus.DONE))
					.build();
			setCreatedAt(record, LocalDateTime.now());
			record.attachPhotos(List.of(photoRecord(SESSION_ID)));
			given(recoveryRecordRepository.findById(1L)).willReturn(Optional.of(record));

			RecoveryRecordResponse response = recoveryRecordService.update(
					SESSION_ID, 1L, new RecoveryRecordUpdateRequest(null, null, List.of()));

			assertThat(response.photos()).isEmpty();
		}

		@Test
		void 존재하지_않는_기록이면_예외가_발생한다() {
			given(recoveryRecordRepository.findById(999L)).willReturn(Optional.empty());

			assertThatThrownBy(() -> recoveryRecordService.update(
					SESSION_ID, 999L, new RecoveryRecordUpdateRequest("메모", null, null)))
					.isInstanceOf(CustomException.class)
					.extracting(e -> ((CustomException) e).getErrorCode())
					.isEqualTo(RecordErrorCode.RECORD_NOT_FOUND);
		}

		@Test
		void 다른_세션의_기록을_수정하려면_예외가_발생한다() {
			RecoveryRecord record = RecoveryRecord.builder()
					.sessionId(OTHER_SESSION_ID)
					.elapsedDay(1)
					.actions(recordActions(CHECK_ID, PerformedStatus.DONE))
					.build();
			given(recoveryRecordRepository.findById(1L)).willReturn(Optional.of(record));

			assertThatThrownBy(() -> recoveryRecordService.update(
					SESSION_ID, 1L, new RecoveryRecordUpdateRequest("메모", null, null)))
					.isInstanceOf(CustomException.class)
					.extracting(e -> ((CustomException) e).getErrorCode())
					.isEqualTo(RecordErrorCode.RECORD_SESSION_MISMATCH);
		}

		@Test
		void 다른_세션의_사진으로_교체하려면_예외가_발생한다() {
			RecoveryRecord record = RecoveryRecord.builder()
					.sessionId(SESSION_ID)
					.elapsedDay(1)
					.actions(recordActions(CHECK_ID, PerformedStatus.DONE))
					.build();
			setCreatedAt(record, LocalDateTime.now());
			PhotoRecord photo = photoRecord(OTHER_SESSION_ID);
			given(recoveryRecordRepository.findById(1L)).willReturn(Optional.of(record));
			given(photoRecordService.getById(10L)).willReturn(photo);

			assertThatThrownBy(() -> recoveryRecordService.update(
					SESSION_ID, 1L, new RecoveryRecordUpdateRequest(null, null, List.of(10L))))
					.isInstanceOf(CustomException.class)
					.extracting(e -> ((CustomException) e).getErrorCode())
					.isEqualTo(RecordErrorCode.PHOTO_SESSION_MISMATCH);
		}

		@Test
		void 존재하지_않거나_다른_세션의_check_id로_교체하려면_예외가_발생한다() {
			RecoveryRecord record = RecoveryRecord.builder()
					.sessionId(SESSION_ID)
					.elapsedDay(1)
					.actions(recordActions(CHECK_ID, PerformedStatus.DONE))
					.build();
			setCreatedAt(record, LocalDateTime.now());
			given(recoveryRecordRepository.findById(1L)).willReturn(Optional.of(record));
			given(checkQueryPort.existsForSession(OTHER_CHECK_ID, UUID.fromString(SESSION_ID))).willReturn(false);

			assertThatThrownBy(() -> recoveryRecordService.update(
					SESSION_ID, 1L, new RecoveryRecordUpdateRequest(null,
							actionEntries(OTHER_CHECK_ID, PerformedStatus.DONE), null)))
					.isInstanceOf(CustomException.class)
					.extracting(e -> ((CustomException) e).getErrorCode())
					.isEqualTo(RecordErrorCode.CHECK_SESSION_MISMATCH);
		}

		@Test
		void 오늘_작성한_기록이_아니면_수정을_거부한다() {
			RecoveryRecord record = RecoveryRecord.builder()
					.sessionId(SESSION_ID)
					.elapsedDay(1)
					.actions(recordActions(CHECK_ID, PerformedStatus.DONE))
					.build();
			setCreatedAt(record, LocalDateTime.now().minusDays(1));
			given(recoveryRecordRepository.findById(1L)).willReturn(Optional.of(record));

			assertThatThrownBy(() -> recoveryRecordService.update(
					SESSION_ID, 1L, new RecoveryRecordUpdateRequest("메모", null, null)))
					.isInstanceOf(CustomException.class)
					.extracting(e -> ((CustomException) e).getErrorCode())
					.isEqualTo(RecordErrorCode.RECORD_NOT_EDITABLE);
		}

		@Test
		void 자정_직전에_작성한_기록도_같은_날짜면_수정_가능하다() {
			RecoveryRecord record = RecoveryRecord.builder()
					.sessionId(SESSION_ID)
					.elapsedDay(1)
					.actions(recordActions(CHECK_ID, PerformedStatus.DONE))
					.build();
			setCreatedAt(record, java.time.LocalDate.now().atStartOfDay());
			given(recoveryRecordRepository.findById(1L)).willReturn(Optional.of(record));

			RecoveryRecordResponse response = recoveryRecordService.update(
					SESSION_ID, 1L, new RecoveryRecordUpdateRequest("메모", null, null));

			assertThat(response.memo()).isEqualTo("메모");
		}
	}
}
