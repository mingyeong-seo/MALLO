# MALLO 프론트 AI 연동 안내

프론트는 OpenRouter나 Gabia AI 서버를 직접 호출하지 않습니다. 앱은 기존 Spring API인 `https://mallo-api.site`만 호출하고, Spring이 내부에서 AI 서버와 Recovery Protocol을 연결합니다.

```text
Expo 앱 → mallo-api.site → Spring → Gabia AI → OpenRouter
                         ↘ Recovery Protocol
```

따라서 프론트 번들에는 OpenRouter 키, AI 서버 주소, 내부 공유 비밀값이 전혀 들어가지 않습니다.

## 팀원이 해야 할 일

### 프론트 담당

아래 세 단계만 하면 됩니다.

```bash
git fetch origin
git switch feat/frontend-ai-wiring
cd frontend && npm install
```

필요하면 `frontend/.env.example`을 복사해 `.env.local`을 만듭니다. 기본값이 운영 Spring 주소이므로 별도 파일 없이도 실행할 수 있습니다.

```bash
npm start
```

추가 API 키 등록이나 AI 서버 설정은 없습니다.

### 백엔드 담당

AI 연동 브랜치를 Spring 배포 브랜치에 병합하고 AWS 배포 환경에 다음 이름의 변수만 등록하면 됩니다.

- `AI_BASE_URL`
- `AI_SHARED_SECRET`
- `AI_CONNECT_TIMEOUT_MS`
- `AI_READ_TIMEOUT_MS`

값은 공개 문서나 프론트 코드에 적지 말고 배포 담당자에게 별도로 전달합니다. 프론트 요청·응답 계약은 변경할 필요가 없습니다.

## 앱이 사용하는 API

모든 요청·응답 JSON 키는 `snake_case`입니다.

### Recovery Session 시작

`POST /v1/sessions`

```json
{
  "procedure": "REJURAN",
  "procedure_at": "2026-08-12",
  "clinic_id": "clinic_001"
}
```

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

현재 운영 `mallo-api.site`의 `/v1/ask`는 AI Spring 브랜치가 운영에 병합·배포된 뒤 새 AI 분류를 사용합니다. 그 전까지 프론트 코드는 새 계약을 사용하더라도 운영 응답은 기존 키워드 분류 동작일 수 있습니다.
