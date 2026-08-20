# QUICK_CHECK_CONDITION_SPEC

> Status: **MALLO Quick Check MVP Final Spec Draft**
>
> 목적: S06 Quick Check → S07 Condition Check → S08 Quick Check Result 구현에 필요한 화면 분기, action/context 계약, Decision 처리 원칙을 프론트엔드와 백엔드가 동일하게 사용하도록 정의한다.
>
> 기준 문서:
> - `QUICK_CHECK_CONDITION_RESEARCH_FINAL_DERNA.md`
> - `DERNA_PROTOCOL_EXTERNAL_RESEARCH_FINAL.md`
> - `RECOVERY_PROTOCOL_DECISION_MATRIX_DERNA_FINAL.md`
>
> Source Policy:
> - DERNA 공식 시술 후 관리 지침 → MALLO 기본 사용자 Recovery Guide 기준
> - 제조사 공식 자료/IFU → 제품 안전성·주의사항·금기 검증
> - DERNA/MALLO 내부 의료 검수 Recovery Protocol → 실제 `DAY + action + context → decision` Rule 확정
> - 외부 의료기관/논문/조사 자료 → 근거 공백 조사 및 검수 후보 발굴
>
> DERNA와 제조사 공식 자료가 실질적으로 충돌하면 임의 선택하지 않고 내부 의료 검수 전까지 `TBD`로 관리한다.
>
> 기존 Mock/와이어프레임에 임의로 들어간 의료성 Decision은 근거로 사용하지 않는다.

---

# 1. Quick Check 전체 Flow

```text
S04 Recovery Journey Home
        ↓
[Quick Check]
        ↓
S06 Quick Check
행동 선택
        ↓
추가 Condition 필요?
   ├─ YES → S07 Condition Check
   │             ↓
   │        context 확정
   │
   └─ NO ───────┘
        ↓
Recovery Protocol 확인
        ↓
확정 Rule 존재?
   ├─ YES → S08 Quick Check Result
   └─ NO  → 미지원/NO_PROTOCOL 처리
        ↓
결과 저장
        ↓
S05 Today Action Plan 반영
```

## 진입 경로

MVP의 기본 진입 경로:

```text
S04 Journey Home
→ 빠른 메뉴 Quick Check
→ S06
```

하단 Check 탭을 유지하는 화면에서는 동일한 S06으로 진입할 수 있다.

---

# 2. S06 Quick Check

## 기능

- 현재 Recovery Journey의 시술 종류 표시
- 현재 DAY 표시
- 확인할 행동 5개 표시
- 하나의 행동 선택
- 선택 후 다음 단계로 이동
- 행동별 S07 또는 Protocol 확인 Flow로 연결

## 필요한 데이터

```text
session_id
procedure
elapsed_day
action
```

## Action Contract

```ts
type QuickCheckAction =
  | 'EXERCISE'
  | 'MAKEUP'
  | 'CLEANSING'
  | 'SKINCARE'
  | 'HEAT';
```

| UI | action |
|---|---|
| 운동 | `EXERCISE` |
| 화장 | `MAKEUP` |
| 세안 | `CLEANSING` |
| 스킨케어 | `SKINCARE` |
| 열 자극 | `HEAT` |

한국어 UI 문자열을 API 값으로 직접 전달하지 않는다.

---

# 3. S07 Condition Check

S07은 선택한 행동에 따라 서로 다른 질문/선택지를 표시한다.

사용자 노출 문구는 UI 작업 중 수정할 수 있다.  
단, 아래 `context key/value` 의미는 변경하지 않는다.

---

## 3.1 EXERCISE

### 목적

운동의 강도 및 땀/열 발생 정도를 구분한다.

```ts
type ExerciseContext = {
  intensity:
    | 'LIGHT_ACTIVITY'
    | 'SWEAT_ACTIVITY'
    | 'INTENSE_ACTIVITY';
};
```

| 의미 | value |
|---|---|
| 가벼운 산책·일상 활동 | `LIGHT_ACTIVITY` |
| 땀이 날 정도의 운동 | `SWEAT_ACTIVITY` |
| 격렬한 운동 | `INTENSE_ACTIVITY` |

### 근거 상태

- `INTENSE_ACTIVITY`: DERNA 공식 안내에서 최소 1주일 회피
- `LIGHT_ACTIVITY`: DAY별 기준 TBD
- `SWEAT_ACTIVITY`: DAY별 기준 TBD

---

## 3.2 MAKEUP

### 목적

화장 및 제거 과정에서 피부에 가해지는 마찰/자극 정도를 확인한다.

```ts
type MakeupContext = {
  friction:
    | 'GENTLE'
    | 'FRICTION'
    | 'UNKNOWN';
};
```

| 의미 | value |
|---|---|
| 자극·마찰이 적은 방식 | `GENTLE` |
| 피부 마찰이 큰 방식 | `FRICTION` |
| 사용자가 판단하기 어려움 | `UNKNOWN` |

### 근거 상태

- 가벼운 화장: DERNA 공식 안내에서 다음 날부터 가능
- 강한 마찰의 정확한 제한 종료 시점: TBD
- `UNKNOWN`: Protocol Matching을 위한 추가 처리 필요

---

## 3.3 CLEANSING

### 목적

세안 과정의 마찰 및 각질 제거 여부를 확인한다.

```ts
type CleansingContext = {
  method:
    | 'GENTLE'
    | 'FRICTION'
    | 'EXFOLIATING';
};
```

| 의미 | value |
|---|---|
| 부드러운 세안 | `GENTLE` |
| 강한 마찰을 동반한 세안 | `FRICTION` |
| 스크럽/각질 제거를 동반 | `EXFOLIATING` |

### 근거 상태

- 가벼운 세안: 다음 날부터 가능
- 시술 부위를 강하게 문지르지 않기
- 스크럽: 최소 1주일 피하기
- `FRICTION`의 정확한 종료 DAY: TBD

---

## 3.4 SKINCARE

### 목적

사용하려는 스킨케어 제품/성분 종류를 구분한다.

```ts
type SkincareContext = {
  product_type:
    | 'MOISTURIZING'
    | 'SUNSCREEN'
    | 'RETINOID'
    | 'AHA_BHA'
    | 'SCRUB'
    | 'OTHER_ACTIVE';
};
```

| 의미 | value |
|---|---|
| 보습·재생 제품 | `MOISTURIZING` |
| 자외선 차단제 | `SUNSCREEN` |
| 레티놀/레티노이드 | `RETINOID` |
| AHA/BHA | `AHA_BHA` |
| 스크럽/물리적 각질 제거 | `SCRUB` |
| 그 외 활성 성분 | `OTHER_ACTIVE` |

### 근거 상태

- 보습·재생: DERNA 공식 권장
- 자외선 차단: 외출 시 SPF 30 이상 권장
- 스크럽: 최소 1주일 피하기
- `RETINOID`: TBD
- `AHA_BHA`: TBD
- `OTHER_ACTIVE`: TBD

---

## 3.5 HEAT

### 목적

사용자가 확인하려는 열 자극의 종류를 구분한다.

```ts
type HeatContext = {
  heat_type:
    | 'SAUNA_STEAM'
    | 'HOT_BATH_SHOWER';
};
```

| 의미 | value |
|---|---|
| 사우나·찜질방 | `SAUNA_STEAM` |
| 뜨거운 목욕·샤워 | `HOT_BATH_SHOWER` |

### 범위

- `SAUNA_STEAM`: DERNA 공식 안내에서 최소 1주일 피하기
- `HOT_BATH_SHOWER`: 정확한 기준 TBD
- `OTHER_HEAT`: MVP 제외

열 자극을 선택했다는 이유만으로 `CONNECT`를 반환하지 않는다.

---

# 4. Request Contract

Quick Check의 `session_id`는 Request Body가 아니라 Header로 전달한다.

```http
X-Session-Id: {session_id}
```

Request Body:

```ts
type QuickCheckRequest = {
  action: QuickCheckAction;
  context:
    | ExerciseContext
    | MakeupContext
    | CleansingContext
    | SkincareContext
    | HeatContext;
};
```

백엔드는 `X-Session-Id`를 기준으로 현재 Journey를 조회하여 `procedure`, `elapsed_day`를 확인한다.

`session_id`, `procedure`, `elapsed_day`를 Request Body에 중복 전달하지 않는다.

## 저장 정책

`POST /v1/checks`는 다음을 한 번에 처리한다.

```text
Protocol Matching
+ Quick Check INSERT
+ 저장된 결과 응답
```

- S08에서는 별도의 저장 요청을 보내지 않는다.
- 동일 DAY/동일 action을 여러 번 확인해도 기존 결과를 overwrite하지 않는다.
- Quick Check 실행마다 새로운 UUID `check_id`를 생성한다.

# 5. Decision

```ts
type Decision =
  | 'POSSIBLE'
  | 'ADJUST'
  | 'POSTPONE'
  | 'CONNECT';
```

| Backend | 사용자 상태 |
|---|---|
| `POSSIBLE` | 진행 가능 |
| `ADJUST` | 조절 필요 |
| `POSTPONE` | 오늘 미루기 |
| `CONNECT` | 의료진 확인 |

실제 DAY별 Rule은:

`RECOVERY_PROTOCOL_DECISION_MATRIX_DERNA_FINAL.md`

를 단일 기준으로 사용한다.

---

# 6. TBD / NO_PROTOCOL

`TBD`는 API Decision 값이 아니다.

```text
TBD
= 아직 근거 또는 검수가 충분하지 않아
  Recovery Protocol Rule을 확정하지 않은 상태
```

금지:

```text
TBD → POSSIBLE
TBD → ADJUST
TBD → POSTPONE
TBD → CONNECT
```

백엔드에서 Rule이 없는 조합을 처리할 별도 상태가 필요하다.

예시:

```ts
type QuickCheckStatus =
  | 'ANSWERABLE'
  | 'NO_PROTOCOL';
```

정확한 API enum/Response 이름은 백엔드와 최종 합의한다. UI에서는 `Protocol Unsupported` 상태로 표시한다.

---

# 7. S08 Quick Check Result

## 기능

- 선택한 행동 표시
- 사용자가 S07에서 선택한 조건 표시
- Protocol 기반 Decision 표시
- Decision에 대한 핵심 안내 표시
- 판단 이유 표시
- 사용된 Recovery Protocol 근거 표시
- 필요한 다음 행동 CTA 표시
- `POST /v1/checks`에서 이미 저장 완료된 Quick Check 결과 표시
- S08에서는 별도의 저장 요청을 수행하지 않음
- 저장된 `check_id` 기준으로 결과 표시
- 이후 S05 Today Action Plan에서 조회 가능

## 필요한 데이터

```text
check_id
session_id
procedure
elapsed_day
action
context
decision
headline
reason
protocol_refs
protocol_version
next_action
created_at
```

### Response 초안

```ts
type QuickCheckResult = {
  status: 'ANSWERABLE';
  check_id: string;
  action: QuickCheckAction;
  context: Record<string, string>;
  decision: Decision;
  headline: string;
  reason: string;
  protocol_refs: string[];
  protocol_version: string;
  next_action?: {
    type: string;
    label: string;
  };
  created_at: string;
};
```

---

# 8. S05 Today Action Plan 반영

오늘 저장된 Quick Check 목록은 다음 API를 사용한다.

```http
GET /v1/checks/today
X-Session-Id: {session_id}
```

백엔드는 오늘자 Quick Check 전체 목록을 **최신순**으로 반환한다.

프론트에서는:

```ts
const recentQuickChecks = todayQuickChecks.slice(0, 3);
const hasMore = todayQuickChecks.length > 3;
```

- S05에는 최신 결과 최대 3개만 표시한다.
- 전체 결과가 3개를 초과하면 `오늘 확인한 전체 기록 보기`를 프론트에서 노출한다.
- 최신 3개 전용 API는 별도로 만들지 않는다.

표시에 필요한 최소 데이터:

```text
check_id
action
context
decision
created_at
```

행동 선택 시 해당 `check_id` 기준 저장된 Quick Check 결과 상세 화면으로 이동한다.

> `check_id` 단건 상세조회 API endpoint는 현재 백엔드와 최종 합의가 필요하다.

# 9. CONNECT / Safety Routing

`CONNECT`는 Protocol이 없을 때 사용하는 fallback이 아니다.

다음과 같이 구분한다.

```text
생활 행동 질문
→ Recovery Protocol Decision

근거 없는 생활 행동 조합
→ NO_PROTOCOL

개인 피부 상태의 정상/비정상 판단
심한 이상 반응
치료·약물·진료 필요성 판단
→ Safety Routing
→ CONNECT
```

DERNA 공식 안내에 붉은기, 붓기, 멍, 오돌토돌한 엠보싱 등이 일시적 반응으로 안내되어 있더라도, MALLO가 사용자 개인 상태를 정상이라고 자동 판정해서는 안 된다.

---

### 제조사 Safety 참고

검증된 ㈜파마리서치 `REJURAN HB plus IFU(내수)`에는 다음이 명시되어 있다.

- 주입 부위 염증 반응이 1주일 정도 지속될 수 있음
- 1주일 이상 염증이 지속되거나 알려진 종류 이외의 부작용이 발생하면 신속한 의사 진찰 권고

이 내용은 `CONNECT` 자동 Rule이 아니라 Safety Routing 검수 근거로 사용한다.

# 10. Loading / Error State

로딩 화면은 별도 비즈니스 기능 페이지로 정의할 필요는 없지만 **UI State로 명세**한다.

최소 상태:

```ts
type QuickCheckUIState =
  | 'IDLE'
  | 'LOADING'
  | 'SUCCESS'
  | 'ERROR';
```

### LOADING

- 중복 요청 방지
- 이전 선택값 유지
- 결과 계산/Protocol 확인 중임을 표시

### ERROR

- 네트워크/API 오류 안내
- 재시도 제공
- 오류를 의료적 Decision으로 표시하지 않음

### NO_PROTOCOL

- 기술 오류와 구분
- 현재 검수된 기준으로 답변할 수 없는 조합임을 표시
- 임의 Decision을 생성하지 않음

---

# 11. 구현 시 수정해야 할 기존 항목

기존 프로젝트 분석에서 확인된 항목을 최종 명세에 맞춰 수정한다.

- S04 Quick Check → S06 직접 연결
- S06 Action은 한국어 문자열이 아닌 enum 사용
- S07은 Action별 서로 다른 context UI 제공
- `스킨케어` / `스킨케어 제품 사용` 명칭 통일
- S08에서 운동/세안 Mock 설명 재사용 제거
- S08 `next_action` 데이터와 CTA 동작 일치
- Decision 누락 시 `CONNECT` 기본값 사용 금지
- 열 자극을 자동 `CONNECT` 처리하지 않음
- TBD Rule은 `NO_PROTOCOL` 계열 상태로 분리

---

# 12. 최종 개발 기준

```text
S06
action 선택
↓
S07
action별 context 수집
↓
POST /v1/checks
Header: X-Session-Id
Body: action + context
↓
Backend
Session Context 확인
(procedure / elapsed_day)
↓
Recovery Protocol Decision Matrix
↓
ANSWERABLE
→ Quick Check INSERT
→ 새 UUID check_id 생성
→ 저장된 결과 응답
→ S08 결과 표시
↓
GET /v1/checks/today
→ 오늘 전체 결과 최신순 조회
→ Front slice(0, 3)
→ S05 최대 3개 표시

Rule 없음
→ NO_PROTOCOL 계열 상태
→ Protocol Unsupported

개인 상태에 의료적 판단 필요
→ Safety Routing
→ CONNECT

API / Network 실패
→ Error State
```

## 아직 백엔드와 최종 계약이 필요한 항목

- `check_id` 단건 상세조회 endpoint
- `NO_PROTOCOL`의 실제 API enum/Response 이름
- `headline`, `reason`, `protocol_refs`, `protocol_version`, `next_action` 등 최종 Response 필드

## 의료 검수 메모

- REJURAN HB plus IFU의 `화장 12시간`과 DERNA의 `다음날부터 가벼운 화장 가능`은 표현 기준이 달라 자동 확정하지 않는다.
- IFU의 `2주 열 장기 노출 회피`와 DERNA의 `사우나·찜질방 최소 1주일`은 범위가 달라 자동 치환하지 않는다.
- 기존 TBD 항목은 추가 의료 검수 전까지 그대로 유지한다.

# 13. 관련 문서 역할

| 문서 | 역할 |
|---|---|
| `QUICK_CHECK_CONDITION_RESEARCH_FINAL_DERNA.md` | Condition을 왜 이렇게 나눴는지에 대한 조사/근거 |
| `DERNA_PROTOCOL_EXTERNAL_RESEARCH_FINAL.md` | DERNA 공식 기준과 외부 조사 관계 및 근거 공백 |
| `RECOVERY_PROTOCOL_DECISION_MATRIX_DERNA_FINAL.md` | DAY/action/context별 실제 Decision Rule |
| `QUICK_CHECK_CONDITION_SPEC.md` | **프론트·백엔드가 실제 구현할 최종 기능/데이터 계약** |

이 문서를 Quick Check 구현 시 진입점으로 사용하고, 의료성 Rule의 상세 값은 Decision Matrix를 참조한다.
