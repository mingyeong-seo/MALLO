# Backend 작업 현황

담당자별로 작업한 내용만 최신화한다. 새 작업 끝날 때마다 자기 도메인 섹션 맨 위에 날짜와 함께 추가할 것 (이유/설계 근거는 안 씀 — 그런 건 `docs/` 설계 문서에).

---

## Record / Photo (담당: 이평강)

- 2026-08-20: FE QA 보고("DAY 9 입력이 기존 DAY 8 기록에 반영됨") 대응 3건 — 원인은 `/records/today`가 세션의 `elapsed_day`가 아니라 `createdAt`(달력 날짜) 기준으로 "오늘 기록"을 찾던 것: 수동 테스트로 만든 다른 DAY 레코드가 하필 오늘 생성돼서 그게 오늘 기록으로 오인됨. (1) `POST /records`에 `elapsedDay` 검증 추가 — 요청의 `elapsedDay`가 세션의 실제 진행일과 다르면 400(`RECORD_ELAPSED_DAY_MISMATCH`). `record/port/SessionQueryPort`+`RecordSessionQueryAdapter` 신설(journey의 `SessionQueryPort`/`SessionInfoQueryAdapter`와 대칭 패턴 — `SessionInfoService.getSession()`만 호출, sessionInfo 엔티티/레포지토리 직접 참조 안 함). 클래스명은 journey 쪽과 겹치면 Spring 빈 이름 충돌(`ConflictingBeanDefinitionException`)이 나서 `RecordSessionQueryAdapter`로 다르게 지음(실제로 겪고 고침). (2) 같은 session_id+elapsed_day 중복 생성 방지 — `(session_id, elapsed_day)` DB 유니크 제약 추가 + 생성 전 `existsBySessionIdAndElapsedDay` 사전 체크로 409(`RECORD_ALREADY_EXISTS_FOR_DAY`). `docs/RECORD_NOTIFICATION_DOMAIN_DESIGN.md` 6번에 있던 관련 open question(유니크 제약 보류 결정, actions[] 리팩터링 이전 근거) 종결 — 문서도 같이 갱신. (3) `/records/today`를 `createdAt` 범위 조회 → 세션 `elapsed_day` 기준 단건 조회(`findBySessionIdAndElapsedDay`)로 교체, 이제 유니크 제약 덕에 `Optional` 단건 반환이 안전함. 세 가지 다 실제 DB 확인 전(로컬 유닛/DataJpaTest만) — 실 MySQL 반영은 다음에 별도 확인 필요, `ddl-auto=update`가 기존 중복 데이터 있으면 유니크 제약을 못 걸므로 FE가 보고한 테스트용 중복 레코드부터 정리 필요. 테스트 141개(전체)
- 2026-08-19: `actions[]`의 `action`(자유 문자열) → `checkId`(UUID)로 전환 — Journey Quick Check(`POST /v1/checks` 응답의 `check_id`)를 참조하도록 바꿔서 action 값 체계를 Journey 쪽 하나로 통일(record는 참조만, enum 안 들고 있음). `RecoveryRecordService`에 `CheckQueryPort`(Journey PR #27에서 제공) 주입해서 checkId가 실제로 존재하고 같은 세션 것인지 검증, 아니면 400(`CHECK_SESSION_MISMATCH`) — `photoRecordIds` 검증과 동일 패턴. 같은 PR에 Swagger 스키마 snake_case 재확인도 포함(코드 변경은 없었음, 이미 OpenApiConfig.java에 적용돼 있던 걸 확인만 함). PR #28. 테스트 121개(전체)
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

- 2026-08-20: FE QA 보고("DAY 1 세션인데 운동 질문이 NO_PROTOCOL") 대응 — 원인은 EXERCISE·HEAT만 Protocol seed에 시술 당일(elapsedDay=0)용 규칙이 없었던 것. MAKEUP/CLEANSING/SKINCARE는 이미 day 0 규칙(조건 없이 매칭되는 기본 행)이 있어서 정상이었고, EXERCISE/HEAT만 `dayStart(1)`부터라 day 0에는 intensity/조건값과 무관하게 항상 NO_PROTOCOL이 났음(선크림=MATCHED, 운동=NO_PROTOCOL 대조 테스트로 확정). `ProtocolSeeder`에 HEAT는 기존 day1~7 POSTPONE 규칙을 dayStart 0으로 확장, EXERCISE는 MAKEUP/CLEANSING과 동일 패턴으로 day 0 전용 무조건 POSTPONE 행 1개 추가(강도 조건 없음, "시술 당일은 강도와 관계없이 운동 피하고 안정"). 병원 검수 없이 백엔드 판단으로 넣은 값이라 실제 검수 단계에서 재확인 필요. `VERSION` `rejuran-v3`→`rejuran-v4`. **주의: `ProtocolSeeder`는 `protocol` 테이블이 비어있을 때만 실행되는 1회성 시더라, 이미 v3로 시딩된 로컬/배포 DB에는 코드만 바꿔서는 반영 안 됨 — `protocol` 테이블 truncate 후 재기동하거나 새 행 2개를 직접 insert해야 실제로 적용됨.** 테스트는 `ProtocolSeeder`가 `@Profile("!test")`라 전부 별개 fixture 사용, 전체 205개 그대로 통과.

## Interaction / ASK MALLO (담당: jiung)

- 2026-08-19: FE/BE 공통 연동 기준 FINAL 대조 후 `POST /v1/ask` 응답을 Quick Check(S08)와 맞춤 — `InteractionStatus.ANSWERABLE` → `MATCHED`로 개명(Quick Check의 `QuickCheckStatus.MATCHED`와 동일 이름), `AskResponse`에 `guidance` 필드 신설(매칭된 Protocol 안내 문구는 `guidance`로, 그 외 상태의 안내 문구는 기존 `message`로 분리). `AskController`/`AskRequest`/`AskResponse`에 Swagger 문서화(`@Tag`/`@Operation`/`@ApiResponses`/`@Schema`) 추가 — 기존엔 전혀 없었음. Record 도메인 `RecordAction`이 아직 `action`(자유 문자열)이고 `check_id` 참조 구조(FINAL 5번)로 안 바뀐 것 확인함 — 우리 도메인 밖이라 안 건드림, 담당자 공유 필요
- 2026-08-19: `POST /v1/ask` 테스트 작성 — 서비스 9개(6가지 status 분기, MAKEUP의 UNKNOWN friction 처리, Protocol 매칭/우선순위, photoRecordIds 통과), 컨트롤러 5개(401/400, CONNECT/MATCHED 응답, photoRecordIds 응답 포함). 전체 133개 테스트 통과 확인

## Handoff / Chat (담당: )

- (아직 없음)
