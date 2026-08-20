package com.mallo.backend.domain.record.entity;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import com.mallo.backend.global.entity.BaseTimeEntity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * S09 Recovery Record: S08에서 확인한 행동을 실제로 수행했는지 DAY 단위로 남기는 선택적 기록.
 */
@Entity
@Table(name = "recovery_record", indexes = {
		// Journal 화면(세션의 DAY별 기록 조회)이 커버링에 가깝게 타도록 session_id + elapsed_day 복합 인덱스
		@Index(name = "idx_recovery_record_session_day", columnList = "session_id, elapsed_day")
}, uniqueConstraints = {
		// 세션+DAY당 기록 1개로 확정 (docs/RECORD_NOTIFICATION_DOMAIN_DESIGN.md 6번 open question 종결,
		// 2026-08-20). 서비스 레벨 existsBySessionIdAndElapsedDay 체크와 동일한 규칙을 DB 레벨에서도
		// 강제해서 동시 요청 race condition까지 막는다.
		// 주의: ddl-auto=update는 기존 테이블에 이미 같은 session_id+elapsed_day 중복 행이 있으면
		// 이 제약을 추가하지 못하고 경고만 남긴다 — 적용 전에 중복 데이터부터 정리해야 한다.
		@UniqueConstraint(name = "uk_recovery_record_session_day", columnNames = {"session_id", "elapsed_day"})
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RecoveryRecord extends BaseTimeEntity {

	// 기록 하나에 붙일 수 있는 사진 최대 장수 (와이어프레임 기준 확정, docs/S09_S10_PHOTO_QA_REPLY.md 참고)
	public static final int MAX_PHOTOS = 5;

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	// RecoverySession은 다른 도메인 소유라 FK 대신 값으로만 보관.
	// length=36은 UUID 문자열 길이 (세션 ID 포맷 확정, docs 참고)
	@Column(name = "session_id", nullable = false, length = 36)
	private String sessionId;

	@Column(name = "elapsed_day", nullable = false)
	private Integer elapsedDay;

	// 저장 버튼 한 번에 확인한 행동 여러 건(카테고리 5개/세부 행동 최대 12개, image 75/76 기준)을 순서대로 담는다.
	// 독립 생명주기가 없는 값 객체 목록이라 별도 엔티티 대신 ElementCollection으로 관리 (RecordAction 참고)
	@ElementCollection
	@CollectionTable(name = "record_action", joinColumns = @JoinColumn(name = "recovery_record_id"))
	@OrderColumn(name = "action_order")
	private List<RecordAction> actions = new ArrayList<>();

	@Column(length = 1000)
	private String memo;

	// FK(recovery_record_id)는 PhotoRecord 쪽이 갖는다 — 여긴 조회 전용(inverse side)
	// List가 아니라 Set인 이유: findBySessionIdOrderByElapsedDayAsc가 photoRecords와 actions를
	// @EntityGraph로 한 쿼리에 같이 fetch join하는데, 두 컬렉션을 동시에 join하면 SQL 결과가
	// (photo 수 x action 수)로 카테시안곱이 난다. actions는 @OrderColumn 인덱스 리스트라 같은 위치에
	// 덮어써져서 괜찮지만, photoRecords가 List(bag)이면 곱해진 행 수만큼 그대로 append돼서
	// GET /records 응답 photos[]에 같은 사진이 action 개수만큼 중복되는 버그가 났다
	// (FE QA 보고, 2026-08-20). Set으로 바꾸면 Hibernate가 동일 엔티티(같은 id)를 중복 추가하지
	// 않아서 한 쿼리를 유지하면서도 중복이 사라진다. @OrderBy는 Set에도 그대로 적용되어 순서 유지됨.
	@OneToMany(mappedBy = "recoveryRecord", fetch = FetchType.LAZY)
	@OrderBy("id asc")
	private Set<PhotoRecord> photoRecords = new LinkedHashSet<>();

	@Builder
	private RecoveryRecord(String sessionId, Integer elapsedDay, List<RecordAction> actions, String memo) {
		this.sessionId = sessionId;
		this.elapsedDay = elapsedDay;
		this.actions = actions != null ? new ArrayList<>(actions) : new ArrayList<>();
		this.memo = memo;
	}

	/** 기존 행동 목록을 통째로 지우고 새로 넘어온 목록으로 교체한다 (attachPhotos와 동일 패턴). */
	public void replaceActions(List<RecordAction> actions) {
		this.actions.clear();
		this.actions.addAll(actions);
	}

	/** 기존에 붙어있던 사진은 전부 떼고(recoveryRecord=null), 새로 넘어온 목록으로 통째로 교체한다. */
	public void attachPhotos(List<PhotoRecord> photos) {
		for (PhotoRecord existing : new ArrayList<>(photoRecords)) {
			existing.attachToRecord(null);
		}
		photoRecords.clear();

		for (PhotoRecord photo : photos) {
			photo.attachToRecord(this);
		}
		photoRecords.addAll(photos);
	}

	public void updateMemo(String memo) {
		this.memo = memo;
	}
}
