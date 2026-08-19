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

- 2026-08-19: `PHOTO_ANALYSIS_READY` 트리거 완전히 제거 — Record 저장 로직에 사진 분석 알림을 끼워 넣는 게 억지스러웠고(저장은 사진과 무관한 범용 액션), 지금은 사진 분석이 동기·Mock이라 유저가 이미 화면에서 결과를 본 상태라 알림 자체가 무의미했음. `RecoveryRecordService`에서 `NotificationService` 의존성 제거. `NotificationService.createPhotoAnalysisReady()` 메서드/테스트는 나중에 실제 비동기 AI 분석 붙을 때 다시 연결할 수 있게 코드는 남겨둠(지금은 아무도 호출 안 함). 지금 당장은 알림 트리거 전부 보류 — `DAILY_ACTION_REMINDER`(DAY 전환)는 세션 도메인 조회 연동 필요, `HANDOFF_REPLY`는 AI 챗 도메인 붙을 때 진행 예정
- 2026-08-18: 서비스/컨트롤러 구현 — 인박스 조회, 읽음 처리, 알림 설정 조회/수정
- 2026-08-18: API 4개 — `GET /v1/sessions/{sessionId}/notifications`, `PATCH /v1/sessions/{sessionId}/notifications/{notificationId}/read`, `GET /v1/sessions/{sessionId}/notification-preference`, `PATCH /v1/sessions/{sessionId}/notification-preference`
- 2026-08-18: `PHOTO_ANALYSIS_READY` 트리거 연결 — `PhotoRecordService.upload()`가 사진 저장 직후 `NotificationService.createPhotoAnalysisReady()` 호출, 생성과 동시에 발송 처리. 실제 MySQL로 사진 업로드 → 알림 자동 생성까지 확인함
- 2026-08-18: `DAILY_ACTION_REMINDER`/`HANDOFF_REPLY`는 세션/Handoff 도메인 완성 전까지 보류 (엔티티만 존재, 트리거 로직 없음)
- 2026-08-18: 테스트 14개 (서비스/컨트롤러/리포지토리)
- 2026-08-18: 실제 FCM 발송 연동 (`firebase-admin` SDK) — `NotificationSender`/`FirebaseNotificationSender`/`FirebaseConfig` 추가. `FCM_CREDENTIALS_PATH`/`FCM_CREDENTIALS_JSON`(.env, 둘 중 하나) 둘 다 비어있으면 FCM 없이 기동만 되고 발송은 항상 실패 처리(status=FAILED)됨. 테스트 4개 추가(총 52개)
- 2026-08-18: 서비스 계정 키를 파일 경로(`FCM_CREDENTIALS_PATH`) 또는 JSON 원문 통째로(`FCM_CREDENTIALS_JSON`, 파일 없이 환경변수 한 줄) 둘 중 하나로 넣을 수 있게 지원
- 2026-08-18: 가짜 토큰으로 실제 발송 시도해서 Google 인증 통과 확인 ("등록 토큰이 유효하지 않다" 응답 = 인증 성공, 발송만 실패한 정상 케이스). 1차 발급 키는 노출돼서 폐기 후 재발급, `.env` 교체 완료
- 2026-08-18: 프론트 fcmToken 형식 확정 — Expo `getDevicePushTokenAsync()`(네이티브 FCM 토큰, EAS Build/dev client 필요)만 받음. `getExpoPushTokenAsync()`의 `ExponentPushToken[...]`는 호환 안 됨 — Swagger에 명시해둠. 백엔드 추가 작업 불필요
- 2026-08-18: Swagger 필드 설명 최신화 — `NotificationResponse.status`가 실제 발송 성공/실패를 뜻한다는 것, `fcmToken`이 네이티브 토큰이어야 한다는 것 반영. `PATCH /notification-preference` 에러 응답(400) 추가
- 2026-08-19: `backend-record` 머지 완료. 머지하면서 `PHOTO_ANALYSIS_READY` 트리거 위치를 `PhotoRecordService.upload()`(사진 1장 업로드마다)에서 `RecoveryRecordService.create()`/`update()`(사진들이 기록에 실제로 붙는 시점)로 이동 — "n장 동시 분석 후 최종 결과 1번" 확정 사항 반영. `referenceId`도 photoRecordId가 아니라 recordId를 가리키도록 바뀜

## Recovery Session / Protocol / ActionCheck (담당: )

- (아직 없음)

## Interaction / ASK MALLO (담당: jiung)

- 2026-08-19: `POST /v1/ask` 테스트 작성 — 서비스 9개(6가지 status 분기, MAKEUP의 UNKNOWN friction 처리, Protocol 매칭/우선순위, photoRecordIds 통과), 컨트롤러 5개(401/400, CONNECT/ANSWERABLE 응답, photoRecordIds 응답 포함). 전체 133개 테스트 통과 확인

## Handoff / Chat (담당: )

- (아직 없음)
