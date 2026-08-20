# MALLO Backend Integration Reference

> FE API 연동용 참고 문서
> 기준일: 2026-08-20
> 대상 브랜치: `dev/backend`

## 0. 문서 목적

이 문서는 MALLO 프론트엔드가 백엔드 API를 연동할 때, 단순 Swagger 예시만 보지 않고 **현재 FINAL 계약 + 실제 배포 서버 응답 + dev/backend 구현 의도**를 함께 이해하도록 만든 참고 문서다.

Codex 등 AI 코딩 도구는 API 연동 작업 전에 이 문서를 먼저 읽고, 아래 Source of Truth 우선순위와 금지 규칙을 지켜야 한다.

---

## 1. Source of Truth 우선순위

API 연동 시 아래 순서로 판단한다.

1. **FE·BE 공통 연동 기준 FINAL**
2. **실제 배포 서버의 Request/Response** (`https://mallo-api.site`)
3. **현재 `dev/backend` 구현 코드**
4. **Swagger UI의 Example/Schema**

주의:
- Swagger는 실제 서버 동작을 문서화하는 수단이지, 실제 서버보다 우선하지 않는다.
- `dev/backend` 코드는 내부 구현 의도와 정책을 이해하는 핵심 참고 자료지만, **배포 DB 데이터와 현재 dev Seeder가 다를 수 있다.**
- 문서/코드/실제 서버가 충돌하면 FE에서 임의로 맞추지 말고 차이를 먼저 보고한다.
- FINAL 이후 enum, 필드명, endpoint, status code를 FE 단독으로 임의 변경하지 않는다.

참고 문서:
- `MALLO_FE_BE_공통_연동_기준_FINAL_2026-08-19`
- `MALLO_프론트엔드_개발_기준_FINAL_2026-08-19`
- `MALLO_백엔드_개발_기준_FINAL_2026-08-19`
- `MALLO_Swagger_서버_대조_체크리스트_2026-08-19`

---

## 2. 백엔드 전체 구조

현재 백엔드는 Java 21 / Spring Boot / Spring Data JPA / MySQL 기반이며, `global`과 `domain`으로 나뉜다.

주요 도메인:

```text
SessionInfo
    ↓
Recovery Session 생성 / 조회 / 완료
    ↓
Journey
    ↓
Protocol 기반 Quick Check
    ↓
check_id 생성
    ↓
Recovery Record
    ├─ check_id + performed_status
    └─ PhotoRecord
         ↓
      사진 저장

별도 도메인:
Handoff
    ↓
ChatMessage
    ↓
Notification
```

주요 구현 경로:

```text
backend/src/main/java/com/mallo/backend/domain/
├─ sessionInfo
├─ journey
├─ record
├─ handoff
├─ chatmessage
├─ notification
└─ medicalstaff
```

공통 응답은 `ApiResponse`로 감싸고, 도메인 예외는 `CustomException` + 공통 예외 처리기로 반환한다.

---

## 3. 공통 API 규칙

### Base URL

```text
https://mallo-api.site
```

### Swagger

```text
https://mallo-api.site/swagger-ui/index.html
```

### Naming

서버 JSON은 `snake_case`를 사용한다.

프론트 내부 모델이 `camelCase`라면 DTO와 내부 모델을 분리하고 명시적으로 변환한다.

예:

```text
session_id  → sessionId
check_id    → checkId
elapsed_day → elapsedDay
created_at  → createdAt
```

### Session Header

Session 단위 API는 확정 계약에 따라 다음 Header를 사용한다.

```http
X-Session-Id: <session_id>
```

---

# 4. Session

## 4-1. 목적

로그인이 없는 MVP이므로 서버가 기기를 임의 식별하지 않는다.
FE가 `session_id`를 로컬에 보관하고 해당 값을 사실상 세션 식별/인가 키로 사용한다.

## 4-2. Session 생성

```http
POST /v1/sessions
```

Request:

```json
{
  "procedure": "REJURAN",
  "procedure_at": "YYYY-MM-DD",
  "clinic_id": "clinic_001"
}
```

성공 status:

```text
201 Created
```

실제 검증 응답 예:

```json
{
  "success": true,
  "data": {
    "session_id": "835dff72-c5f1-4fe4-954e-bb96bc014228",
    "procedure": "REJURAN",
    "procedure_at": "2026-08-12",
    "clinic_id": "clinic_001",
    "status": "ACTIVE",
    "elapsed_day": 7,
    "created_at": "2026-08-19T21:18:34.545663"
  },
  "message": null
}
```

백엔드 구현:
- `SessionInfoService.createSession()`은 호출될 때마다 새 UUID Session을 발급한다.
- `procedure_at`은 `LocalDate`로 저장한다.

## 4-3. Session 복원

```http
GET /v1/sessions/today
X-Session-Id: <session_id>
```

성공 status:

```text
200 OK
```

FE 앱 재실행 Flow:

```text
로컬 session_id 없음
→ 신규 Journey S01

로컬 session_id 있음
→ GET /v1/sessions/today
    ├─ ACTIVE     → 기존 Recovery Journey 복원
    ├─ COMPLETED  → 신규 Journey Flow
    └─ 401        → 저장값 제거 후 신규 Journey Flow
```

네트워크/5xx 등 서버 장애를 세션 없음으로 오판해 `session_id`를 임의 삭제하지 않는다.

## 4-4. DAY 규칙

```text
UI DAY 1 = elapsed_day 0
UI DAY 2 = elapsed_day 1
...
```

FE에서 날짜를 자체 계산하지 않는다.
서버의 `elapsed_day`를 사용해 UI DAY만 `elapsed_day + 1`로 표시한다.

## 4-5. ACTIVE / COMPLETED

Session은 DAY가 지났다고 자동 COMPLETED 되지 않는다.

```http
PATCH /v1/sessions/complete
```

을 명시적으로 호출할 때만 `ACTIVE → COMPLETED` 된다.

백엔드 코드 주석 기준:
- 몇 DAY에 회복 완료인지 근거가 없어서 자동 종료 규칙을 만들지 않음.
- 완료 시점 트리거는 FE/기획 정책에 따라 별도 결정.

## 4-6. 현재 FE 연동 상태

확인 완료:
- S03 `POST /v1/sessions`
- `session_id` 영속 저장
- Provider 실제 Session 갱신
- 앱 Reload 후 `GET /v1/sessions/today`
- `ACTIVE` Session S04 복원
- 서버 `elapsed_day=7` → UI `DAY 8` 표시 확인

---

# 5. Quick Check / Journey

## 5-1. Endpoint

```http
POST /v1/checks
GET  /v1/checks/today
GET  /v1/checks/{check_id}
```

모두 Session 기준 요청이다.

## 5-2. Quick Check 판단 구조

Quick Check의 의료/Recovery 판단은 FE가 하지 않는다.

백엔드 내부 Flow:

```text
X-Session-Id
↓
Session에서 procedure + elapsed_day 조회
↓
action + context 입력
↓
procedure + action + elapsed_day 기준 Protocol 후보 조회
↓
context 조건 매칭
↓
가장 구체적인 조건을 가진 Protocol 우선
↓
Journey 저장 + check_id 발급
```

`JourneyService.findBestMatch()`는 조건 key 수가 많은 규칙을 더 구체적인 규칙으로 보고 우선 선택한다.
조건이 없는 Protocol은 해당 DAY/action의 기본 규칙처럼 동작한다.

## 5-3. Action / Context 확정값

```text
EXERCISE.intensity
- LIGHT_ACTIVITY
- SWEAT_ACTIVITY
- INTENSE_ACTIVITY

MAKEUP.friction
- GENTLE
- FRICTION
- UNKNOWN

CLEANSING.method
- GENTLE
- FRICTION
- EXFOLIATING

SKINCARE.product_type
- MOISTURIZING
- SUNSCREEN
- RETINOID
- AHA_BHA
- SCRUB
- OTHER_ACTIVE

HEAT.heat_type
- SAUNA_STEAM
- HOT_BATH_SHOWER
```

Record 전용 고정 12개 action enum은 사용하지 않는다.

## 5-4. POST /v1/checks

예:

```json
{
  "action": "EXERCISE",
  "context": {
    "intensity": "LIGHT_ACTIVITY"
  }
}
```

성공:

```text
201 Created
```

실제 서버 검증 응답 예:

```json
{
  "success": true,
  "data": {
    "check_id": "c5bb6e6f-5a41-4e8e-8773-c78da7161a58",
    "session_id": "835dff72-c5f1-4fe4-954e-bb96bc014228",
    "elapsed_day": 7,
    "action": "EXERCISE",
    "context": {
      "intensity": "LIGHT_ACTIVITY"
    },
    "status": "MATCHED",
    "decision": "POSSIBLE",
    "guidance": "가벼운 강도의 운동은 가능합니다. 땀이 많이 나면 시술 부위를 바로 씻어주세요.",
    "next_action": null,
    "protocol_ref": "7e8cce30-9a03-4e1f-a35e-13bd647d09aa",
    "created_at": "2026-08-19T21:28:49.392854"
  },
  "message": null
}
```

주의:
- Swagger Example에서 `context: "string"`으로 보이는 경우가 있으나 **실제 서버 응답은 객체**였다.
- 실제 서버 응답을 우선한다.

## 5-5. status / decision

```text
status:
MATCHED | NO_PROTOCOL
```

MATCHED decision:

```text
POSSIBLE | ADJUST | POSTPONE | CONNECT
```

`CONNECT`는 별도 status가 아니라 **MATCHED Protocol의 decision**이다.

`UNSUPPORTED`는 Quick Check status가 아니다. ASK MALLO의 Recovery 범위 밖 질문 개념이다.

## 5-6. NO_PROTOCOL

Protocol을 찾지 못하면 `JourneyService`는 아래 값을 null로 저장한다.

```text
decision
protocol_ref
guidance
next_action
```

Response에서는 이를 `NO_PROTOCOL` 정상 도메인 상태로 표현한다.

즉:

```text
Protocol 있음  → MATCHED
Protocol 없음  → NO_PROTOCOL
```

NO_PROTOCOL은 HTTP Error로 처리하지 않는다.

## 5-7. ProtocolSeeder

현재 `dev/backend`의 `ProtocolSeeder`는 REJURAN용 해커톤 fixture다.
코드 주석상 실제 병원 검수 데이터가 아니라 데모용 seed임을 명시한다.

대표 EXERCISE 규칙:

```text
DAY 범위 1~7 (elapsed_day 1~7)
LIGHT_ACTIVITY   → POSSIBLE
SWEAT_ACTIVITY   → ADJUST
INTENSE_ACTIVITY → POSTPONE
```

대표 HEAT 규칙:

```text
elapsed_day 1~7
→ POSTPONE
```

현재 dev Seeder 주석상 EXERCISE/HEAT의 DAY8 이후는 Rule 없음 → NO_PROTOCOL 의도다.

### 중요: Seeder와 배포 DB 불일치 가능성

`ProtocolSeeder.run()`은 DB에 Protocol이 이미 있으면 seed를 건너뛴다.

```text
protocolRepository.count() > 0
→ 최신 Seeder 재삽입 안 함
```

따라서:
- `dev`의 최신 Seeder 코드
- 실제 배포 DB에 남아 있는 Protocol 데이터

가 다를 수 있다.

실제로 현재 QA에서는 `elapsed_day=7 (UI DAY 8)`에서 `EXERCISE + LIGHT_ACTIVITY`가 `MATCHED/POSSIBLE`로 반환됐다.
반면 현재 dev Seeder 주석/범위는 DAY8 이후 EXERCISE를 NO_PROTOCOL 의도로 두고 있다.

이 차이는 **FE가 임의 수정할 항목이 아니다.**
배포 DB가 어느 Seeder 상태인지 BE 확인이 필요하다.

## 5-8. GET /v1/checks/today

현재 Session의 **현재 elapsed_day** 기록 전체를 최신순 반환한다.

FE 책임:

```ts
quickChecks.slice(0, 3)
```

S05 기본 영역은 최신 3개만 표시한다.
서버가 N개로 잘라주지 않는다.

실제 서버 검증 완료:
- 200
- data 배열
- context 객체
- 최신 생성 check 포함

## 5-9. GET /v1/checks/{check_id}

저장된 Quick Check 결과 단건 조회.

다른 Session의 check_id를 조회하면 존재 여부를 노출하지 않고 동일하게 404 처리한다.

S08 새로고침/직접 진입처럼 Context에 결과가 없을 때 서버 단건 재조회에 사용할 수 있다.

## 5-10. 현재 FE 연동 상태

확인 완료:
- S07 `POST /v1/checks`
- S08 MATCHED 결과 실제 렌더링
- 실제 server guidance 표시
- 실제 protocol_ref 표시
- `next_action=null` 정상 처리
- S05 `GET /v1/checks/today`
- 서버 4개 이상 존재 시 FE 최신 3개 표시 확인
- `GET /v1/checks/{check_id}` service 구현

남은 QA:
- NO_PROTOCOL 실제 배포 DB 기준 대표 케이스
- S08 웹 새로고침 단건 복원
- 401 오류 UI

---

# 6. Recovery Record / Journal

## 6-1. Endpoint

```http
POST  /v1/sessions/{sessionId}/records
GET   /v1/sessions/{sessionId}/records
GET   /v1/sessions/{sessionId}/records/today
PATCH /v1/sessions/{sessionId}/records/{recordId}
```

실제 배포 서버 검증 기준 Record POST 성공 status:

```text
200 OK
```

주의:
현재 Record Controller는 URL path의 `sessionId`를 사용한다.
실제 Swagger/배포 서버에서 `X-Session-Id` 요구 여부는 연동 전 반드시 다시 확인한다.

## 6-2. actions[] 계약

Record는 action 문자열을 새로 저장하거나 Protocol을 다시 판단하지 않는다.

확정 구조:

```json
{
  "actions": [
    {
      "check_id": "<uuid>",
      "performed_status": "DONE"
    }
  ]
}
```

Flow:

```text
Quick Check
→ check_id 생성

Recovery Record
→ check_id + 실제 수행 여부 저장
```

백엔드는 각 check_id가:
- 실제 존재하는지
- 현재 Session 소속인지

검증한다.

검증 실패 시 다른 Session의 Check를 Record에 연결할 수 없다.

## 6-3. 오늘 Record

```http
GET /v1/sessions/{sessionId}/records/today
```

정책:

```text
오늘 Record 없음
→ success=true, data=null

오늘 Record 있음
→ 해당 RecoveryRecord 반환
```

FE는 전체 Journal에서 오늘 Record를 직접 찾지 말고 이 endpoint를 사용한다.

S09 예상 Flow:

```text
GET records/today
├─ data=null → POST 신규 저장
└─ data 있음 → PATCH 수정
```

## 6-4. 수정 정책

과거 DAY Record 수정 금지.

실제 백엔드 구현은 `elapsed_day`가 아니라 **record.created_at의 날짜가 오늘인지**로 검사한다.

```text
오늘 생성 Record → 수정 가능
과거 생성 Record → 403 RECORD_NOT_EDITABLE
```

## 6-5. Journal

```http
GET /v1/sessions/{sessionId}/records
```

Session의 DAY별 Record 전체를 `elapsedDay` 오름차순으로 반환한다.

S10은 서버 Record 목록을 기반으로 렌더링한다.

---

# 7. Photo

## 7-1. Endpoint

```http
POST /v1/sessions/{sessionId}/photos
Content-Type: multipart/form-data
```

파일 field:

```text
photo
```

한 장씩 업로드한다.

여러 장인 경우:

```text
photo 1 업로드 → photoRecordId
photo 2 업로드 → photoRecordId
...
↓
Record create/update 시 photoRecordIds 전달
```

## 7-2. 최대 개수

Recovery Record 기준 최대 5장.

FE 책임:
- 선택
- 삭제
- 미리보기
- 최대 5장 UI 제한

BE 책임:
- 파일 저장
- PhotoRecord 생성
- Record 1:N 연결

## 7-3. 실제 저장 방식

현재 backend에는:

```text
LocalPhotoStorageAdapter
PhotoStorageAdapter
PhotoObservationAdapter
MockPhotoObservationAdapter
```

가 존재한다.

현재 해커톤 구현 성격:

```text
사진 원본 저장 → 로컬 디스크
사진 관찰 결과 → Mock adapter
```

따라서 FE에서 사진을 실제 AI 의료 분석 결과처럼 표현하지 않는다.

---

# 8. ASK MALLO

FINAL 계약 기준:

```text
question 필수
photo 선택
```

질문 분기:

```text
생활 행동 질문
→ 필요한 context 확인
→ Quick Check / S08 결과 구조 재사용

일반 Recovery 정보
→ check_id 없는 General Result 가능

의료 판단 필요
→ CONNECT

Protocol 근거 없음
→ Protocol Unsupported

Recovery 범위 밖
→ Unsupported Question
```

## 8-1. ASK 사진

새 사진 API를 만들지 않는다.
기존 Record Photo API를 재사용한다.

```text
사진 업로드
→ photo_record_id
→ ASK 저장/분석 요청에서 참조
```

원본 사진을 ASK 도메인에 중복 저장하지 않는다.

MVP 정책:
- ASK 첨부 최대 개수 별도 제한 없음
- 동기 처리

## 8-2. 구현 주의

현재 확인한 `dev/backend` 주요 도메인에는 Handoff/Chat/Record/Photo 구현은 존재하지만, **FINAL에서 정의한 ASK 자연어 질문 전체 흐름과 정확히 일치하는 전용 API 구현은 아직 이 문서 작성 시점에 별도 확정하지 않았다.**

따라서 FE ASK 실제 연동 전에는 반드시:
- Swagger
- `dev/backend` 관련 controller/service/dto
- 실제 배포 서버

를 다시 대조한다.

FE의 기존 Mock ASK 로직을 무작정 제거하지 않는다.

---

# 9. CONNECT / Handoff / Chat

## 9-1. FINAL 기준 S12

S12는 MALLO가 정상/비정상을 판단하는 화면이 아니라 의료진 확인 단계로 연결하는 Bridge다.

진입:

```text
S11 CONNECT → S12 (question 유지 가능)
S04 직접 문의 → S12 (question 없어도 정상)
```

FINAL 기준 백엔드에는 의료진 상담 가능 시간/상태 API를 요구하지 않는다.
FE는 `available`, 운영시간 등 존재하지 않는 상태를 임의 생성하지 않는다.

## 9-2. 현재 backend의 Handoff/Chat 구현

backend에는 실제로 다음 도메인이 존재한다.

```text
handoff
chatmessage
notification
medicalstaff
```

Handoff 생성은 다음 값을 저장하는 구조다.

```text
sessionId
interactionId
channel
summary
```

ChatMessage에서는 `STAFF`가 첫 답장을 보내면:
- handoff를 answered 상태로 변경
- HANDOFF_REPLY notification 생성

까지 구현되어 있다.

하지만:

```text
백엔드에 코드가 존재함
≠
현재 FINAL FE에서 반드시 사용해야 함
```

현재 MVP S12 범위를 벗어나는 Handoff/실시간 상담 기능을 FE에서 임의 연결하지 않는다.

---

# 10. 현재 백엔드 구현 성격

현재 dev/backend에는 시기별 요구가 일부 함께 남아 있다.

```text
초기 범위
→ Handoff / Chat / Notification / 의료진 구조

중간 범위
→ Recovery Record / Photo

최종 계약
→ Session + Protocol Quick Check + check_id 기반 Record
```

따라서 **코드가 있다는 이유만으로 모든 기능을 FE에 연결하지 않는다.**

현재 구현 작업은 FINAL 기준 기능만 우선한다.

---

# 11. Swagger / 실제 서버 주의사항

확인된 불일치 예:

### Quick Check context

Swagger Example:

```json
"context": "string"
```

실제 서버:

```json
"context": {
  "intensity": "LIGHT_ACTIVITY"
}
```

→ 실제 서버 응답을 기준으로 FE DTO를 구현한다.

Swagger 불일치는 API 계약을 임의 변경하는 근거가 아니라 Swagger 정합성 수정 항목이다.

연동 전 확인:
- HTTP method/path
- snake_case field
- required/optional
- Header
- status code
- nullability
- 실제 response type

---

# 12. FE에서 절대 임의 판단하지 말 것

- `elapsed_day`를 FE에서 계산하지 않는다.
- Quick Check `decision`을 FE에서 계산하지 않는다.
- Protocol matching을 FE에서 구현하지 않는다.
- `MATCHED / NO_PROTOCOL` 외 Quick Check status를 임의 추가하지 않는다.
- `CONNECT`를 Quick Check status로 만들지 않는다.
- `NO_PROTOCOL`을 HTTP Error처럼 처리하지 않는다.
- `next_action=null`을 오류로 처리하지 않는다.
- Record에서 action 문자열을 새로 만들어 저장하지 않는다.
- Record는 실제 `check_id + performed_status`를 사용한다.
- 서버 snake_case DTO를 화면 컴포넌트 곳곳에서 직접 변환하지 않는다.
- 사진은 반환된 `photo_record_id`를 사용한다.
- Record 사진은 최대 5장이다.
- ASK 사진에 임의 최대 개수 제한을 만들지 않는다.
- 사진 Mock 관찰 결과를 실제 AI 의료 분석이라고 표현하지 않는다.
- 백엔드에 있는 Handoff/Chat을 FINAL 범위를 무시하고 임의 연결하지 않는다.
- 문서/Swagger/서버가 충돌하면 FE 단독으로 맞추지 않는다.
- 기존 확정 Navigation/디자인을 API 연동 때문에 불필요하게 재설계하지 않는다.

---

# 13. 현재 FE API 연동 진행 상태

```text
Session
✅ POST /v1/sessions
✅ session_id 저장
✅ GET /v1/sessions/today
✅ ACTIVE 복원
✅ 실제 elapsed_day → UI DAY 반영

Quick Check
✅ POST /v1/checks
✅ GET /v1/checks/today
✅ GET /v1/checks/{check_id} service 구현
✅ MATCHED UI
✅ POSSIBLE UI
✅ guidance
✅ protocol_ref
✅ next_action=null
✅ S05 slice(0,3)
⚠ NO_PROTOCOL 실제 배포 DB 대표 QA
⚠ S08 Web 새로고침 재조회 QA
⚠ 401 QA

Recovery Record
⬜ 실제 API 연동

Photo
⬜ 실제 multipart upload 연동

ASK
⬜ 실제 backend 구조 재조사 후 필요한 범위만 연동

CONNECT
⬜ FINAL 범위에 맞춘 통합 QA
```

---

# 14. 앞으로의 연동 순서

1. Quick Check 남은 QA 정리
2. Record Swagger + 실제 서버 대표 Request/Response 확인
3. Record FE 실제 API 연동
4. Record S09/S10 QA
5. Photo Swagger + 실제 multipart 업로드 확인
6. Photo FE 연동
7. ASK backend 실제 구현 구조/Swagger 재조사
8. FINAL에 필요한 ASK 범위만 실제 연동
9. CONNECT 회귀 QA
10. 전체 Session → Quick Check → Record → ASK 통합 QA
11. TypeScript / ESLint / diff check
12. 빌드
13. `feat/api-integration → frontend` PR
14. FE 최종 QA 후 `frontend → dev` 통합

---

# 15. Codex 작업 기본 지시문

앞으로 API 연동 작업 시 아래 내용을 프롬프트 시작부에 붙여도 된다.

```text
작업 전에 반드시 docs/BACKEND_INTEGRATION_REFERENCE.md를 먼저 읽어.

이 문서는 MALLO FE·BE FINAL 계약, 실제 배포 서버 응답,
현재 dev/backend 구현 코드를 대조해서 정리한 FE API 연동 참고 문서다.

문서의 Source of Truth 우선순위와
'FE에서 절대 임의 판단하지 말 것' 규칙을 반드시 지켜.

현재 요청한 작업 범위를 벗어난 API/화면/Navigation/디자인은 수정하지 마.

문서와 현재 코드/Swagger/실제 서버가 충돌하면
임의로 고치지 말고 충돌 내용을 먼저 보고해.
```

---

## 주요 backend 참고 경로

```text
backend/README.md

backend/src/main/java/com/mallo/backend/domain/sessionInfo/
├─ controller/SessionInfoController.java
└─ service/SessionInfoService.java

backend/src/main/java/com/mallo/backend/domain/journey/
├─ controller/JourneyController.java
├─ service/JourneyService.java
└─ config/ProtocolSeeder.java

backend/src/main/java/com/mallo/backend/domain/record/
├─ controller/RecoveryRecordController.java
├─ controller/PhotoRecordController.java
└─ service/RecoveryRecordService.java

backend/src/main/java/com/mallo/backend/domain/handoff/
└─ service/HandoffService.java

backend/src/main/java/com/mallo/backend/domain/chatmessage/
└─ service/ChatMessageService.java
```

---

## 문서 유지 규칙

이 파일은 API 구현 중 발견된 실제 차이를 계속 업데이트한다.

업데이트 대상 예:
- 실제 배포 server response가 Swagger와 다름
- dev/backend Seeder와 배포 DB가 다름
- 새로운 endpoint가 FINAL 계약에 추가됨
- Record/Photo/ASK 실제 연동에서 null/status/header 정책이 새로 확인됨

단, 발견된 차이를 FE 임의 정책으로 확정하지 않는다.
FE·BE 합의 또는 실제 서버/FINAL 계약 확인 후 문서에 반영한다.
