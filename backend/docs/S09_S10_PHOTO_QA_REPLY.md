# S09/S10 사진 관련 질문 답변

프론트에서 주신 S09(Recovery Record)/S10(Recovery Journal) 스펙과 와이어프레임(`docs/image 75.png`, `docs/image 76.png`) 확인한 결과입니다. 사진 질문 3개 답변 + 확인 과정에서 발견한 구조 불일치 사항입니다.

## 질문 답변

### 1. 다중 업로드 가능 여부 / 최대 개수 — ✅ 구현 완료

**최대 5장.** `RecoveryRecord`↔`PhotoRecord`를 1:N으로 바꿨습니다. 업로드는 **한 장씩** — 프론트가 사진마다 `POST /photos`를 호출해서 `photoRecordId`를 모으는 방식으로 확정했습니다 (배치 업로드 아님). 5장 초과는 기록 저장 시점에 400으로 막습니다.

### 2. 사진 업로드 API / 반환값 — 기존과 동일(한 장씩)

`POST /v1/sessions/{sessionId}/photos`에 `photo` 필드로 한 장을 `multipart/form-data`로 올리면:

```json
{
  "id": 1,
  "sessionId": "...",
  "observation": { "redness": "LOW", "dryness": "MEDIUM" },
  "photoUrl": "/uploads/photos/{sessionId}/{uuid}.jpg",
  "createdAt": "..."
}
```

**`photoUrl`이 프론트가 바로 `<img>`로 렌더링하면 되는 값**입니다. 지금은 로컬 디스크 서빙(개발용)이라 나중에 배포 서버로 옮기면 저장 방식은 바뀌어도 `photoUrl` 형태(상대경로 문자열) 자체는 유지될 예정입니다.

### 3. 한 요청 vs 별도 요청

**별도 2단계**입니다.

1. 사진 한 장씩 업로드 → `id` 여러 개를 프론트에서 모음
2. 그 id 목록을 `POST /v1/sessions/{sessionId}/records` 요청에 **`photoRecordIds`(배열)**로 실어서 기록 생성

## 구현 완료 — API 필드 변경 사항

| 위치 | 이전 | 이후 |
|---|---|---|
| `POST /photos` 요청/응답 | 그대로 (한 장/객체 1개) | 변경 없음 |
| `POST/PATCH /records`의 `photoRecordId` | `Long`(단일) | `photoRecordIds`(`List<Long>`, 최대 5개) |
| 기록 응답의 `photo` | 객체 1개 또는 null | `photos`(배열, 없으면 `[]`) |

수정(`PATCH /records/{id}`)에서 `photoRecordIds`를 **빈 배열 `[]`로 보내면 사진 전체 삭제**, **아예 안 보내면(생략) 기존 사진 유지**입니다.

실제 MySQL로 3장을 한 장씩 업로드 → id 3개를 리스트로 기록 생성 → 조회까지 확인했습니다.

> 참고: 한 번에 여러 장을 받는 배치 업로드(`photos` 필드에 파일 여러 개)로 먼저 구현했다가, 프론트가 "한 장씩 업로드하는 기존 API 유지" 쪽으로 최종 확정해서 되돌렸습니다.

## 사진 분석 알림 — n장 동시 분석 후 최종 결과 1번만

`backend-noti` 브랜치와 머지할 때 반영해야 할 내용: 사진마다 알림이 따로 오는 게 아니라, **여러 장을 동시에 분석하고 최종 결과가 나왔을 때 알림 1번**만 발송하는 것으로 확정. (`PhotoRecordService`가 `NotificationService`를 호출하는 지점/횟수를 이 기준으로 다시 맞춰야 함)

---

## Recovery Record 수정 정책 (당일만 수정 가능) — ✅ 구현 완료

"당일 기록만 수정 가능, 과거 DAY는 조회만 가능"으로 확정된 정책, 구현까지 끝냈습니다.

> **기록이 만들어진 날짜가 오늘이면 수정 가능, 오늘이 아니면 수정 불가**

`PATCH /records/{recordId}`에서 기록의 생성 시각(`createdAt`)과 오늘 날짜를 비교해서, 오늘 게 아니면 **403 Forbidden** (`"오늘 작성한 기록만 수정할 수 있습니다."`)으로 막습니다. 조회(`GET /records`)는 과거 DAY도 그대로 됩니다.

실제 MySQL로 확인: 방금 만든 기록 수정 → 200 성공 / DB에서 생성일을 어제로 바꾸고 같은 기록 수정 시도 → 403 거부 / 조회는 여전히 200. 테스트 8개 추가(서비스 2 + 컨트롤러 1, 나머지는 기존 테스트에 오늘 날짜 세팅 반영), 총 36개.

## 오늘 기록 조회 API — ✅ 추가 완료

"오늘 기록의 record_id를 프론트가 어떻게 아는지"도 백엔드가 판단해서 주는 걸로 결정, 전용 엔드포인트 만들었습니다.

```
GET /v1/sessions/{sessionId}/records/today
```

- 오늘 만든 기록이 있으면 그 기록을 그대로 반환 (`data.id`가 곧 수정할 때 쓸 `record_id`)
- 없으면 `data: null` (success는 true) — 이걸로 "신규 작성 CTA" 보여줄지 판단하면 됨

프론트는 이제 `GET /records`(전체 목록)를 필터링할 필요 없이, 이 API 하나로 "오늘 + 기록 있음/없음" 상태를 바로 판단할 수 있습니다.

실제 MySQL로 (기록 없을 때 null / 기록 생성 후 조회하면 그 id가 바로 옴 / 그 id로 PATCH 수정 성공)까지 확인했습니다. 테스트 6개 추가, 총 42개.
