# Backend 작업 현황

담당자별로 작업한 내용만 최신화한다. 새 작업 끝날 때마다 자기 도메인 섹션 맨 위에 날짜와 함께 추가할 것 (이유/설계 근거는 안 씀 — 그런 건 `docs/` 설계 문서에).

---

## Record / Photo (담당: 이평강)

- 2026-08-18: RecoveryRecord/PhotoRecord 엔티티, 리포지토리, 서비스, 컨트롤러 구현
- 2026-08-18: API 4개 — `POST /v1/sessions/{sessionId}/records`, `GET /v1/sessions/{sessionId}/records`, `PATCH /v1/sessions/{sessionId}/records/{recordId}`, `POST /v1/sessions/{sessionId}/photos`
- 2026-08-18: 사진 업로드 로컬 디스크 저장 + 정적 리소스 서빙 (`PhotoStorageAdapter`/`LocalPhotoStorageAdapter`, `PhotoStorageConfig`)
- 2026-08-18: 저널 조회(`findBySessionIdOrderByElapsedDayAsc`) N+1 수정 — `@EntityGraph(attributePaths = "photoRecord")`
- 2026-08-18: Swagger 필드 설명(`@Schema`) 및 에러 응답 코드(`@ApiResponses`) 문서화
- 2026-08-18: 테스트 36개 (서비스/컨트롤러/리포지토리, N+1 회귀 테스트 포함)

## Notification (담당: 이평강)

- 2026-08-18: 엔티티(`Notification`, `NotificationPreference`) + 리포지토리만 구현. 서비스/컨트롤러 미구현

## Recovery Session / Protocol / ActionCheck (담당: )

- (아직 없음)

## Interaction / ASK MALLO (담당: )

- (아직 없음)

## Handoff / Chat (담당: )

- (아직 없음)
