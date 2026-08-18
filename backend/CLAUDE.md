# Backend 작업 현황

담당자별로 작업한 내용만 최신화한다. 새 작업 끝날 때마다 자기 도메인 섹션 맨 위에 날짜와 함께 추가할 것 (이유/설계 근거는 안 씀 — 그런 건 `docs/` 설계 문서에).

---

## Record / Photo (담당: 이평강)

- 2026-08-18: RecoveryRecord/PhotoRecord 엔티티, 리포지토리, 서비스, 컨트롤러 구현
- 2026-08-18: API 4개 — `POST /v1/sessions/{sessionId}/records`, `GET /v1/sessions/{sessionId}/records`, `PATCH /v1/sessions/{sessionId}/records/{recordId}`, `POST /v1/sessions/{sessionId}/photos`
- 2026-08-18: 사진 업로드 로컬 디스크 저장 + 정적 리소스 서빙 (`PhotoStorageAdapter`/`LocalPhotoStorageAdapter`, `PhotoStorageConfig`)
- 2026-08-18: 저널 조회(`findBySessionIdOrderByElapsedDayAsc`) N+1 수정 — `@EntityGraph(attributePaths = "photoRecord")`
- 2026-08-18: Swagger 필드 설명(`@Schema`) 및 에러 응답 코드(`@ApiResponses`) 문서화
- 2026-08-18: 테스트 31개 (서비스/컨트롤러/리포지토리, N+1 회귀 테스트 포함)

## Notification (담당: 이평강)

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

## Recovery Session / Protocol / ActionCheck (담당: )

- (아직 없음)

## Interaction / ASK MALLO (담당: )

- (아직 없음)

## Handoff / Chat (담당: )

- (아직 없음)
