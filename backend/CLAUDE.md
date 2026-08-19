# Backend 작업 현황

담당자별로 작업한 내용만 최신화한다. 새 작업 끝날 때마다 자기 도메인 섹션 맨 위에 날짜와 함께 추가할 것 (이유/설계 근거는 안 씀 — 그런 건 `docs/` 설계 문서에).

---

## Record / Photo (담당: 이평강)

- 2026-08-19: `POST`/`PATCH /records`의 행동 필드를 리스트로 변경 — `action`(String 1개)+`performedStatus` 단일 구조를 `actions: List<{action, performedStatus}>`(최소 1개)로 바꿔서 저장 버튼 한 번에 여러 행동(image 75/76 기준 카테고리 5개/세부 행동 최대 12개)을 저장 가능하게 함. 엔티티는 `RecordAction`(`@Embeddable`) 신설 + `RecoveryRecord`가 `@ElementCollection`으로 순서대로 보관(`record_action` 테이블). `PATCH`는 `actions`를 안 보내면 기존 유지, 보내면(최소 1개) 전체 교체 — `photoRecordIds`와 동일 정책. 저널 조회 `@EntityGraph`에 `actions`도 추가해서 N+1 재발 방지. `action` 필드 자체는 여전히 자유 문자열(enum 미확정) — Journey `ActionType`(PR #14)과의 값 매핑은 별도 확인 필요(CLAUDE.md TODO 참고). 테스트 38개
- 2026-08-19: `GET /v1/sessions/{sessionId}/records/today` 추가 — 오늘 기록이 있으면 그 record_id 포함해서 반환, 없으면 data:null. 프론트가 전체 목록 필터링 안 해도 되게. 실제 MySQL로 확인. 테스트 42개
- 2026-08-19: 당일 작성한 기록만 수정 가능 정책 구현 — `PATCH /records/{id}`에서 `createdAt` 날짜가 오늘이 아니면 403(`RECORD_NOT_EDITABLE`). 조회는 과거 DAY도 그대로 가능. 실제 MySQL로 (오늘 수정 성공 / DB에서 생성일 어제로 바꿔서 수정 거부 / 조회는 정상) 확인. 테스트 36개
- 2026-08-19: 사진 다중 첨부 지원(최대 5장) — `RecoveryRecord`↔`PhotoRecord` 관계를 1:0..1에서 1:N으로 변경 (FK를 `PhotoRecord.recoveryRecord`가 소유). 업로드는 기존대로 **한 장씩**(`POST /photos`, `photo` 필드 단일) — 프론트가 여러 번 호출해서 id를 모으는 방식으로 확정. `photoRecordId`(단일) → `photoRecordIds`(리스트, 최대 5개)로 기록 생성/수정 요청·응답 필드만 변경. 실제 MySQL로 3장 업로드/id 리스트로 기록 연결/조회까지 확인. 테스트 33개
- 2026-08-18: RecoveryRecord/PhotoRecord 엔티티, 리포지토리, 서비스, 컨트롤러 구현
- 2026-08-18: API 4개 — `POST /v1/sessions/{sessionId}/records`, `GET /v1/sessions/{sessionId}/records`, `PATCH /v1/sessions/{sessionId}/records/{recordId}`, `POST /v1/sessions/{sessionId}/photos`
- 2026-08-18: 사진 업로드 로컬 디스크 저장 + 정적 리소스 서빙 (`PhotoStorageAdapter`/`LocalPhotoStorageAdapter`, `PhotoStorageConfig`)
- 2026-08-18: 저널 조회(`findBySessionIdOrderByElapsedDayAsc`) N+1 수정 — `@EntityGraph(attributePaths = "photoRecord")`
- 2026-08-18: Swagger 필드 설명(`@Schema`) 및 에러 응답 코드(`@ApiResponses`) 문서화
- 2026-08-18: 테스트 31개 (서비스/컨트롤러/리포지토리, N+1 회귀 테스트 포함)

## Notification (담당: 이평강)

- 브랜치가 다름 — `backend-noti` 브랜치에 커밋돼있음 (엔티티/리포지토리/서비스/컨트롤러/FCM 연동, `10882f3`). 이 브랜치(`backend-record`)엔 없는 게 정상
- 2026-08-19 확정: 사진 분석 알림은 사진마다 각각이 아니라 **n장 동시 분석 후 최종 결과 1번**만 발송. `backend-record`와 머지 시 `PhotoRecordService`↔`NotificationService` 연동 지점을 이 기준으로 다시 맞춰야 함 (충돌 예상 지점: `PhotoRecordService.java`)

## Recovery Session / Protocol / ActionCheck (담당: )

- (아직 없음)

## Interaction / ASK MALLO (담당: )

- (아직 없음)

## Handoff / Chat (담당: )

- (아직 없음)
