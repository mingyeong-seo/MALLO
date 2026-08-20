# MALLO 프론트 AI 연동 안내

프론트는 OpenRouter나 Gabia AI 서버를 직접 호출하지 않습니다. 앱은 기존 Spring API인 `https://mallo-api.site`만 호출하고, Spring이 내부에서 AI 서버와 Recovery Protocol을 연결합니다.

```text
Expo 앱 → mallo-api.site → Spring → Gabia AI → OpenRouter
                         ↘ Recovery Protocol
```

따라서 프론트 번들에는 OpenRouter 키, AI 서버 주소, 내부 공유 비밀값이 전혀 들어가지 않습니다.

## 팀원이 해야 할 일

### 프론트 담당

아래만 하면 됩니다.

```bash
git fetch origin
git switch feat/frontend-ai-wiring
cd frontend && npm ci
npm start
```

추가 API 키 등록, Gabia AI 서버 설정, OpenRouter 설정은 없습니다. `EXPO_PUBLIC_API_BASE_URL`을 비워두거나 `.env.local`을 만들지 않아도 기본값으로 운영 Spring API `https://mallo-api.site`를 사용합니다.

로컬 Spring에 붙여 테스트할 때만 `frontend/.env.example`을 복사해 `.env.local`을 만들고 `http://localhost:<port>`로 바꿉니다. 프로덕션 빌드는 이 값을 무시하고 항상 `https://mallo-api.site`만 사용합니다.

웹 개발 서버도 `http://localhost:<port>`로 열어야 합니다. 배포된 Spring의 기본 CORS 패턴은 `http://localhost:*`이며 `127.0.0.1` 브라우저 origin은 포함하지 않습니다.

### 백엔드 담당 — 완료

아래 두 GitHub Secrets는 이미 배포 저장소에 등록되어 있습니다.

- `AI_BASE_URL`
- `AI_SHARED_SECRET`

AI 연동 PR [#35 (`feat/ai-triage-service`)](https://github.com/mingyeong-seo/MALLO/pull/35)는 2026-08-20 `dev`에 병합됐고, 해당 커밋의 Backend Deploy Action도 성공했습니다. PR #35에 AI 환경변수 주입까지 포함되어 있으므로 환경변수를 새로 만들거나 프론트 계약을 수정할 필요가 없습니다.

중복 변경이었던 PR #36도 닫힌 상태입니다. 현재 백엔드 담당자에게 남은 필수 설정 작업은 없습니다. 이후 백엔드 코드가 바뀔 때만 기존 Deploy Action 성공 여부를 확인합니다.

선택값인 `AI_CONNECT_TIMEOUT_MS`, `AI_READ_TIMEOUT_MS`는 Spring 기본값이 있으므로 해커톤 제출용 연동에서는 등록하지 않아도 됩니다. 프론트 요청·응답 계약은 변경할 필요가 없습니다.

### 절대 등록하지 않는 것

- 프론트 `.env.local`에 OpenRouter API key 등록하지 않기
- 프론트 `.env.local`에 `AI_SHARED_SECRET` 등록하지 않기
- public GitHub 문서나 코드에 OpenRouter key, shared secret 적지 않기

## 앱이 사용하는 API

모든 요청·응답 JSON 키는 `snake_case`입니다.

### Recovery Session 시작

`POST /v1/sessions`

```json
{
  "procedure": "REJURAN",
  "procedure_at": "2026-08-18",
  "clinic_id": "clinic_001"
}
```

`procedure_at`은 화면을 연 기기의 로컬 달력 날짜를 기준으로 이틀 전을 계산합니다. 화면에 표시하는 날짜와 API로 보내는 날짜가 항상 같습니다.

앱은 반환된 `session_id` 하나만 저장합니다. 네이티브 앱은 Expo SecureStore, 웹은 localStorage를 사용합니다. 앱 재실행 시 저장된 ID로 `GET /v1/sessions/today`를 호출해 실제 DAY를 복구합니다.

### ASK MALLO 질문

`POST /v1/ask`

헤더:

```text
X-Session-Id: <복구 또는 생성한 session_id>
```

본문:

```json
{
  "question": "오늘 고강도 운동해도 될까요?",
  "photo_record_ids": []
}
```

사진 업로드 API는 아직 화면과 연결하지 않았습니다. 첨부 버튼을 누르면 미연동 안내가 나오며, 존재하지 않는 사진 ID를 보내지 않습니다.

### 조건 보충

ASK 응답이 `CLARIFY`이면 백엔드가 반환한 `action`에 맞는 기존 조건 선택 UI를 보여줍니다. 사용자가 조건을 고르면 `POST /v1/checks`를 호출합니다.

```json
{
  "action": "EXERCISE",
  "context": {
    "intensity": "INTENSE_ACTIVITY"
  }
}
```

조건 선택 때 AI를 다시 호출하지 않으므로 응답이 빠르고 Protocol 결과가 일관됩니다.

## 응답 상태와 화면

| API 상태 | 앱 처리 |
| --- | --- |
| `MATCHED` | 기존 Quick Check 결과 모델로 정규화한 뒤 결과 화면 표시 |
| `CLARIFY` | `action`에 해당하는 기존 조건 선택 화면 표시 |
| `CONNECT` | 백엔드 메시지와 의료진 연결 버튼 표시 |
| `GENERAL` | 백엔드의 일반 회복 안내 메시지 표시 |
| `NO_PROTOCOL` | Protocol 없음 안내 표시 |
| `UNSUPPORTED` | 지원 범위 안내 표시 |
| 네트워크·스키마 오류 | 기존 재시도 화면 표시 |

`MATCHED` 응답에는 Protocol version이 없으므로 값을 만들어내지 않습니다. 결과 화면에서도 version이 없으면 해당 행을 숨깁니다.

## 주요 파일

- `frontend/api/contracts.ts`: Spring 응답을 검증하는 Zod 스키마
- `frontend/api/client.ts`: 세션, ASK, Quick Check API 함수
- `frontend/api/session-storage.ts`: 플랫폼별 session ID 저장
- `frontend/features/recovery/RecoveryFlowProvider.tsx`: 세션 복구 및 앱 상태
- `frontend/features/ask/useAskFlow.ts`: ASK 상태별 실제 API 흐름
- `frontend/features/ask/result-mapper.ts`: API 결과를 기존 결과 화면 모델로 변환
- `frontend/app/procedure-confirm.tsx`: 실제 세션 생성

## 로컬 확인

```bash
cd frontend
npm test
EXPO_NO_TELEMETRY=1 npm run lint
npx tsc --noEmit
npx expo export --platform web
```

운영 `mallo-api.site`의 `/v1/ask`는 새 AI 분류기를 사용합니다. 배포 후 `오늘 땀 많이 나는 인터벌 트레이닝 수업 들어도 될까요?`라는 자연어 질문으로 실제 `프론트 → Spring → Gabia AI/OpenRouter → Recovery Protocol` 흐름을 확인했고, `EXERCISE / INTENSE_ACTIVITY / POSTPONE` 결과가 반환됐습니다.

## 상속된 의존성 위험

`npm audit`의 19건(중간 10, 높음 9)은 `origin/frontend`에도 동일하게 존재하는 Expo 빌드 체인 경고입니다. `npm audit fix --force`는 Expo 54를 57로 올리는 호환성 변경을 포함하므로 이번 AI 연동에서 의존성을 강제 변경하지 않습니다. 제출 기능과 분리된 기존 빌드 체인 위험으로 추적합니다.
