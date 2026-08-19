# MALLO · REJURAN RECOVERY PROTOCOL DECISION MATRIX — FINAL DRAFT

> 목적: `procedure + elapsed_day + action + context → decision` 규칙 정의
>
> DERNA 의원 공식 REJURAN 시술 후 주의사항을 1차 근거로 사용한다. 공식 안내에서 확인되지 않거나 세부 경계가 없는 조합은 `TBD`로 유지한다.

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

# 1. 공통 Contract

```ts
type Decision = 'POSSIBLE' | 'ADJUST' | 'POSTPONE' | 'CONNECT';
```

| Decision | 사용자 의미 |
|---|---|
| `POSSIBLE` | 진행 가능 |
| `ADJUST` | 조절 필요 |
| `POSTPONE` | 오늘 미루기 |
| `CONNECT` | 의료진 확인 |

`TBD`는 Decision enum이 아니며 **근거/검수 미확정 상태**다.

### DAY

| elapsed_day | UI |
|---:|---|
| 0 | DAY 1 · 시술 당일 |
| 1 | DAY 2 |
| 2 | DAY 3 |
| 3 | DAY 4 |
| 4 | DAY 5 |
| 5 | DAY 6 |
| 6 | DAY 7 |
| 7+ | DAY 8+ |

---

# 2. EXERCISE

| Context | DAY 1 | DAY 2 | DAY 3 | DAY 4 | DAY 5 | DAY 6 | DAY 7 | DAY 8+ | 근거 |
|---|---|---|---|---|---|---|---|---|---|
| `LIGHT_ACTIVITY` | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | DERNA 공식 안내에 세부 기준 없음 |
| `SWEAT_ACTIVITY` | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | '격렬한 운동'보다 넓은 중간 범주의 공식 경계 없음 |
| `INTENSE_ACTIVITY` | POSTPONE | POSTPONE | POSTPONE | POSTPONE | POSTPONE | POSTPONE | POSTPONE | TBD | DERNA: 격렬한 운동 최소 1주일 피하기 |

> `최소 1주일`만으로 DAY 8+를 자동 `POSSIBLE`로 단정하지 않는다.

---

# 3. MAKEUP

| Context | DAY 1 | DAY 2 | DAY 3 | DAY 4 | DAY 5 | DAY 6 | DAY 7 | DAY 8+ | 근거 |
|---|---|---|---|---|---|---|---|---|---|
| `GENTLE` | POSTPONE | POSSIBLE | POSSIBLE | POSSIBLE | POSSIBLE | POSSIBLE | POSSIBLE | POSSIBLE | DERNA: 가벼운 화장 다음 날부터 가능 |
| `FRICTION` | POSTPONE | TBD | TBD | TBD | TBD | TBD | TBD | TBD | 자극 회피 방향은 있으나 정확한 허용 시점 없음 |
| `UNKNOWN` | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | context 부족 |

---

# 4. CLEANSING

| Context | DAY 1 | DAY 2 | DAY 3 | DAY 4 | DAY 5 | DAY 6 | DAY 7 | DAY 8+ | 근거 |
|---|---|---|---|---|---|---|---|---|---|
| `GENTLE` | POSTPONE | POSSIBLE | POSSIBLE | POSSIBLE | POSSIBLE | POSSIBLE | POSSIBLE | POSSIBLE | DERNA: 가벼운 세안 다음 날부터 가능 |
| `FRICTION` | POSTPONE | POSTPONE | POSTPONE | POSTPONE | POSTPONE | POSTPONE | POSTPONE | TBD | DERNA: 시술 부위를 강하게 문지르지 않기. 종료 시점은 미명시 |
| `EXFOLIATING` | POSTPONE | POSTPONE | POSTPONE | POSTPONE | POSTPONE | POSTPONE | POSTPONE | TBD | DERNA: 스크럽 최소 1주일 피하기 |

> `FRICTION`의 DAY 1~7 `POSTPONE`은 공식 문구의 '강하게 문지르지 않기'를 회복 기간의 보수적 행동 제한으로 반영한 **MALLO 규칙 초안**이다. 정확한 종료 시점은 검수 필요.

---

# 5. SKINCARE

| Context | DAY 1 | DAY 2 | DAY 3 | DAY 4 | DAY 5 | DAY 6 | DAY 7 | DAY 8+ | 근거 |
|---|---|---|---|---|---|---|---|---|---|
| `MOISTURIZING` | POSSIBLE | POSSIBLE | POSSIBLE | POSSIBLE | POSSIBLE | POSSIBLE | POSSIBLE | POSSIBLE | DERNA: 수분/재생 크림 충분히 사용 |
| `SUNSCREEN` | POSSIBLE | POSSIBLE | POSSIBLE | POSSIBLE | POSSIBLE | POSSIBLE | POSSIBLE | POSSIBLE | DERNA: 외출 시 SPF 30+ 권장 |
| `RETINOID` | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | 공식 세부 기준 없음 |
| `AHA_BHA` | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | 공식 세부 기준 없음 |
| `SCRUB` | POSTPONE | POSTPONE | POSTPONE | POSTPONE | POSTPONE | POSTPONE | POSTPONE | TBD | DERNA: 최소 1주일 피하기 |
| `OTHER_ACTIVE` | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | 범위/기준 미확정 |

---

# 6. HEAT

| Context | DAY 1 | DAY 2 | DAY 3 | DAY 4 | DAY 5 | DAY 6 | DAY 7 | DAY 8+ | 근거 |
|---|---|---|---|---|---|---|---|---|---|
| `SAUNA_STEAM` | POSTPONE | POSTPONE | POSTPONE | POSTPONE | POSTPONE | POSTPONE | POSTPONE | TBD | DERNA: 사우나·찜질방 최소 1주일 피하기 |
| `HOT_BATH_SHOWER` | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | 공식 캡처에 별도 세부 기준 없음 |

`OTHER_HEAT`는 MVP 범위에서 제외한다.

---

# 7. 공식 기준으로 해결된 항목

- 가벼운 세안: DAY 1 `POSTPONE`, DAY 2+ `POSSIBLE`
- 가벼운 화장: DAY 1 `POSTPONE`, DAY 2+ `POSSIBLE`
- 보습/재생: `POSSIBLE`
- SPF 30+ 자외선 차단: `POSSIBLE`
- 격렬한 운동: DAY 1~7 `POSTPONE`
- 스크럽: DAY 1~7 `POSTPONE`
- 사우나·찜질방: DAY 1~7 `POSTPONE`

---

# 8. 남은 TBD

- `EXERCISE.LIGHT_ACTIVITY`
- `EXERCISE.SWEAT_ACTIVITY`
- `MAKEUP.FRICTION` 정확한 허용 시점
- `MAKEUP.UNKNOWN`
- `CLEANSING.FRICTION` 종료 시점
- `SKINCARE.RETINOID`
- `SKINCARE.AHA_BHA`
- `SKINCARE.OTHER_ACTIVE`
- `HEAT.HOT_BATH_SHOWER`
- 최소 1주일 규칙의 DAY 8+ 전환값

---

# 9. 백엔드 처리

```text
procedure + elapsed_day + action + context
                 ↓
확정 Rule 존재?
├─ YES → POSSIBLE / ADJUST / POSTPONE
└─ NO  → API: NO_PROTOCOL 계열 상태 (정확한 enum은 백엔드 합의 필요)
          → UI: Protocol Unsupported
```

금지:

```text
TBD → CONNECT
TBD → POSTPONE
TBD → POSSIBLE
```

`CONNECT`는 생활 행동의 근거 부족 fallback이 아니라 **개인 상태에 의료적 판단이 필요한 Safety Routing**에서 사용한다.

---

# 10. 추가 공식 안내 데이터

DERNA 공식 캡처에서 Quick Check 외에도 다음 데이터를 Recovery Guide/Safety 설계에 활용할 수 있다.

```text
temporary_reactions:
- redness
- swelling
- bruising
- embossing

avoid_or_recommend:
- alcohol: 최소 1주일 중단 권장
- smoking: 최소 1주일 중단 권장
```

이 데이터는 현재 S06의 5개 Action enum에 자동 추가하지 않는다. 별도 Recovery Guide 또는 Safety/Content 범위에서 사용 여부를 결정한다.


---

# 11. 제조사 IFU 검증 메모

검증된 ㈜파마리서치 `REJURAN HB plus IFU(내수)`에서 다음이 확인되었다.

- 화장: 주사 후 12시간 피함
- 열: 2주 동안 태양·UV·추위·열(사우나·증기룸 등)에 장기 노출 피함
- 1주 이상 염증 지속 또는 비정형 부작용 발생 시 의사 진찰 권고

단, 본 Matrix는 현재 DERNA의 일반 REJURAN Recovery Guide와 병행 사용하므로 다음 원칙을 적용한다.

- HB plus IFU의 12시간 화장 제한을 REJURAN 전체에 자동 확장하지 않는다.
- DERNA의 `다음날`과 제조사 IFU의 `12시간`은 시간 표현 기준이 달라 자동 충돌 해결하지 않는다.
- DERNA의 `사우나·찜질방 최소 1주일`과 IFU의 `열 장기 노출 2주`는 범위가 완전히 같지 않으므로 자동 치환하지 않는다.
- `HOT_BATH_SHOWER`는 IFU에 직접 명시되지 않았으므로 계속 `TBD`.
- 기존 TBD 항목은 의료 검수 전까지 유지한다.
- 외부 자료만으로 `TBD`를 Decision으로 확정하지 않는다.
- `NO_PROTOCOL`과 `CONNECT`는 동일한 상태가 아니다.

## Safety 참고

```text
1주 이상 염증 지속
또는 알려진 종류 이외의 부작용 발생
→ Safety Routing 검토
→ 의료진 진찰 권고
```

이 Safety 참고는 Quick Check 생활 행동 Decision Matrix를 자동 변경하는 Rule이 아니다.
