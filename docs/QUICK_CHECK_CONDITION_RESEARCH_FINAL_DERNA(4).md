# QUICK CHECK CONDITION RESEARCH — FINAL

> 목적: REJURAN Quick Check의 S06 행동과 S07에서 수집할 Condition/context 구조를 정의한다.
>
> 이 문서는 **질문·선택지와 데이터 구조 명세**다. DAY별 Decision은 `RECOVERY_PROTOCOL_DECISION_MATRIX_DERNA_FINAL.md`에서 관리한다.

## Source Policy

MALLO의 REJURAN Recovery Protocol은 자료를 단순한 일렬 우선순위로 덮어쓰지 않고 **자료의 역할을 구분하여 사용한다.**

1. **DERNA 의원 공식 REJURAN 시술 후 관리 지침**
   - MALLO 기본 사용자 Recovery Guide 및 병원 연계 안내 기준
2. **제조사 공식 자료 / IFU**
   - 제품 안전성·주의사항·금기 및 공식 사용정보 검증
3. **DERNA/MALLO 내부 의료 검수 Recovery Protocol**
   - DERNA 안내와 제조사 공식 자료 등을 종합하여 실제 `DAY + action + context → decision` Rule 확정
4. **외부 의료기관 / 논문 / 조사 자료**
   - DERNA·제조사 공식 자료에 명확한 기준이 없는 영역의 조사 및 의료 검수 후보 발굴

### 충돌 및 근거 공백 처리 원칙

- DERNA 안내와 제조사 공식 자료가 실질적으로 충돌하면 제품 기획자가 임의 선택하지 않고 내부 의료 검수 전까지 `TBD`로 관리한다.
- DERNA 기준이 없고 제조사 공식 기준이 있으면 내부 Recovery Protocol 확정 후보로 두되, 검수 없이 자동 Decision으로 사용하지 않는다.
- DERNA/제조사 모두 명확한 기준이 없으면 외부 의료기관·논문 등을 조사하되 내부 검수 전까지 `TBD`로 유지한다.
- 근거 부족은 `CONNECT`로 대체하지 않는다. API에서는 `NO_PROTOCOL` 계열 상태, UI에서는 `Protocol Unsupported`로 처리한다.
- 개인 상태에 의료적 판단이 필요한 경우에만 Safety Routing을 거쳐 `CONNECT`한다.


### DERNA 공식 안내에서 직접 확인된 기준

- 가벼운 세안과 화장: **다음 날부터 가능**
- 세안: 부드럽게 하고 시술 부위를 강하게 문지르지 않기
- 자외선 차단: 외출 시 **SPF 30 이상**
- 보습·재생: 수분 크림 또는 재생 크림을 충분히 사용
- 사우나·찜질방·격렬한 운동 등 열을 발생시키는 활동: **최소 1주일 피하기**
- 스크럽 제품 사용: **최소 1주일 피하기**
- 음주·흡연: **최소 1주일 중단 권장**
- 붉은기·붓기·멍·오돌토돌한 엠보싱 등은 일시적으로 나타날 수 있으며 대부분 수일 내 자연스럽게 가라앉는다고 안내

> 위 내용은 사용자가 2026-08-18 직접 확인한 DERNA 의원 REJURAN '시술 후 주의사항' 캡처를 기준으로 정리했다.


---

# 1. 확정 Action

```ts
type QuickCheckAction =
  | 'EXERCISE'
  | 'MAKEUP'
  | 'CLEANSING'
  | 'SKINCARE'
  | 'HEAT';
```

| 사용자 행동 | action |
|---|---|
| 운동 | `EXERCISE` |
| 화장 | `MAKEUP` |
| 세안 | `CLEANSING` |
| 스킨케어 | `SKINCARE` |
| 열 자극 | `HEAT` |

---

# 2. EXERCISE

DERNA 공식 안내에서 **격렬한 운동은 최소 1주일 피하기**가 확인된다. 그러나 가벼운 활동과 땀이 나는 정도의 운동에 대한 세부 경계는 명시되어 있지 않다.

```ts
type ExerciseContext = {
  intensity:
    | 'LIGHT_ACTIVITY'
    | 'SWEAT_ACTIVITY'
    | 'INTENSE_ACTIVITY';
};
```

| 의미 | Front Value |
|---|---|
| 가벼운 산책·일상 활동 | `LIGHT_ACTIVITY` |
| 땀이 날 정도의 운동 | `SWEAT_ACTIVITY` |
| 격렬한 운동 | `INTENSE_ACTIVITY` |

- 3개 구조: **확정**
- `INTENSE_ACTIVITY` 최소 1주일 제한: **DERNA 공식 근거 있음**
- `LIGHT_ACTIVITY`, `SWEAT_ACTIVITY`의 DAY별 기준: **TBD**

---

# 3. MAKEUP

DERNA 공식 안내에서 **가벼운 화장은 다음 날부터 가능**하며 자극이 가지 않도록 관리해야 한다.

```ts
type MakeupContext = {
  friction:
    | 'GENTLE'
    | 'FRICTION'
    | 'UNKNOWN';
};
```

| 의미 | Front Value |
|---|---|
| 자극·마찰이 적은 화장/제거 | `GENTLE` |
| 피부를 반복적으로 문지르는 등 마찰이 큰 방식 | `FRICTION` |
| 사용자가 자극 정도를 판단하기 어려움 | `UNKNOWN` |

- context 구조: **확정**
- `GENTLE` 다음 날부터 가능: **DERNA 공식 근거 있음**
- `FRICTION`의 정확한 DAY별 기준: **TBD**
- `UNKNOWN`의 처리 방식: **TBD / 추가 조건 확인 가능**

---

# 4. CLEANSING

DERNA 공식 안내에서 **가벼운 세안은 다음 날부터 가능**하며, 시술 부위를 강하게 문지르지 않도록 안내한다. 스크럽 제품은 최소 1주일 피한다.

```ts
type CleansingContext = {
  method:
    | 'GENTLE'
    | 'FRICTION'
    | 'EXFOLIATING';
};
```

| 의미 | Front Value |
|---|---|
| 부드러운 세안 | `GENTLE` |
| 강한 마찰을 동반한 세안 | `FRICTION` |
| 스크럽/각질 제거를 동반 | `EXFOLIATING` |

- context 구조: **확정**
- `GENTLE` 다음 날부터 가능: **DERNA 공식 근거 있음**
- 강한 마찰 회피: **DERNA 공식 근거 있음**
- 스크럽 최소 1주일 회피: **DERNA 공식 근거 있음**
- `FRICTION`의 정확한 종료 DAY: **TBD**

---

# 5. SKINCARE

보습·재생 관리, SPF 30 이상 자외선 차단, 스크럽 최소 1주일 회피는 DERNA 공식 안내에서 확인된다.
레티노이드, AHA/BHA 및 기타 활성 성분의 정확한 재개 시점은 해당 안내에서 확인되지 않는다.

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

| 의미 | Front Value |
|---|---|
| 보습·재생 제품 | `MOISTURIZING` |
| 자외선 차단제 | `SUNSCREEN` |
| 레티놀/레티노이드 | `RETINOID` |
| AHA/BHA | `AHA_BHA` |
| 스크럽/물리적 각질 제거 | `SCRUB` |
| 그 외 활성 성분 | `OTHER_ACTIVE` |

- 6개 context 세분화: **확정**
- `MOISTURIZING`: DERNA 공식 권장
- `SUNSCREEN`: DERNA 공식 SPF 30+ 권장
- `SCRUB`: 최소 1주일 회피
- `RETINOID / AHA_BHA / OTHER_ACTIVE`: **TBD**

---

# 6. HEAT

DERNA 공식 안내에서 **사우나·찜질방 및 열을 발생시키는 활동을 최소 1주일 피하기**가 확인된다.
뜨거운 목욕·샤워의 세부 기준은 공식 캡처에서 별도로 확인되지 않는다.

```ts
type HeatContext = {
  heat_type:
    | 'SAUNA_STEAM'
    | 'HOT_BATH_SHOWER';
};
```

- `SAUNA_STEAM`: 최소 1주일 회피 — **DERNA 공식 근거**
- `HOT_BATH_SHOWER`: **TBD**
- `OTHER_HEAT`: MVP 제외 — **제품 범위 확정**
- `HEAT = CONNECT` 규칙은 사용하지 않음

---

# 7. 사용자 문구

S07의 실제 질문/선택지 문구는 현재 고정하지 않는다.

- 개발용 `action/context enum`: **확정**
- 사용자 노출 문구: UI 구현 단계에서 수정 가능
- 문구 변경으로 enum 의미가 달라지지 않도록 유지

---

# 8. 최종 Context Contract

```ts
type ExerciseContext = {
  intensity: 'LIGHT_ACTIVITY' | 'SWEAT_ACTIVITY' | 'INTENSE_ACTIVITY';
};

type MakeupContext = {
  friction: 'GENTLE' | 'FRICTION' | 'UNKNOWN';
};

type CleansingContext = {
  method: 'GENTLE' | 'FRICTION' | 'EXFOLIATING';
};

type SkincareContext = {
  product_type:
    | 'MOISTURIZING'
    | 'SUNSCREEN'
    | 'RETINOID'
    | 'AHA_BHA'
    | 'SCRUB'
    | 'OTHER_ACTIVE';
};

type HeatContext = {
  heat_type: 'SAUNA_STEAM' | 'HOT_BATH_SHOWER';
};
```

---

# 9. 남은 TBD

다음은 제품 기획자가 임의로 고르지 않는다.

- 가벼운 운동 허용 시점
- 땀이 나는 운동의 제한 기간
- 마찰이 큰 화장/제거 방식의 정확한 제한 기간
- 강한 마찰 세안의 정확한 제한 기간
- 레티노이드 재개 시점
- AHA/BHA 재개 시점
- `OTHER_ACTIVE` 분류 및 재개 기준
- 뜨거운 목욕·샤워의 제한 기준
- 최소 1주일 제한 항목의 DAY 8+ 자동 전환 여부

추가 DERNA Protocol 확인 또는 의료 검수 전까지 `TBD`로 유지한다.


---

# 10. 제조사 공식 IFU 검증 결과 반영

검증된 제조사 공식 자료:

- 자료명: `[DB0233(02)] 리쥬란 HB plus IFU(내수)`
- 발행기관: ㈜파마리서치
- 작성연월: 2024년 12월
- 제품: REJURAN HB plus
- 공식성: VERIFIED OFFICIAL

확인된 핵심 원문 기준:

- 주사 후 **12시간 동안 화장을 피함**
- **2주 동안** 태양, UV광선, 추위 또는 열(사우나, 증기룸 등)에 **장기 노출을 피함**
- 주입 부위의 염증 반응이 **1주일 정도 지속될 수 있음**
- **1주일 이상 염증이 지속되거나 알려진 종류 이외의 부작용이 발생하면 신속한 의사 진찰 권고**

## 적용 주의

- 위 IFU는 **REJURAN HB plus 제품 문서**이므로 REJURAN 전체 라인업에 자동 확장하지 않는다.
- `12시간 화장 제한`과 DERNA의 `다음날부터 가벼운 화장 가능`은 표현 기준이 달라 단순 우열로 확정하지 않고 의료 검수 메모로 관리한다.
- `2주 열 장기 노출 회피`와 DERNA의 `사우나·찜질방 최소 1주일 회피`는 범위가 완전히 동일하지 않으므로 자동 치환하지 않는다.
- HOT_BATH_SHOWER는 IFU에 직접 명시되지 않았으므로 제조사 직접 근거로 확정하지 않는다.
- `즉시 생활 가능`만으로 LIGHT_ACTIVITY를 당일 `POSSIBLE`로 확정하지 않는다.
- `격렬한 운동` 제한을 SWEAT_ACTIVITY 전체로 자동 확장하지 않는다.
- `최소 1주일`만으로 DAY 8+를 자동 `POSSIBLE`로 전환하지 않는다.
