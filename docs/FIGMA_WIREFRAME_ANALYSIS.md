# MALLO Figma 와이어프레임 분석

## 1. 문서 목적과 분석 기준

이 문서는 Figma Make에서 생성된 MALLO 전체 와이어프레임 코드와 제공된 흐름 이미지를 바탕으로 화면 구조, 사용자 흐름, 상태, 공통 UI 패턴 및 React Native + Expo 전환 시 고려사항을 정리한다.

Figma Make 코드는 실제 앱처럼 한 화면씩 전환되는 구현이 아니라, 큰 웹 캔버스 위에 여러 모바일 화면과 화면 간 연결을 나란히 보여주는 **문서형 플로우 와이어프레임**이다. `Phone`, `FlowSection`, `HFlow`, `Arrow`, `BranchArrow`는 문서 레이아웃을 만들고, S01–S12 컴포넌트가 각 Phone 내부 UI를 표현한다. 대부분의 버튼은 실제 라우팅이 연결된 버튼이 아니라 CTA 모양의 정적 `<div>`이므로, 이동 관계는 첨부 이미지, 화면의 `from`/`to` 설명 및 CTA 문구를 종합해 분석했다.

### 자료 우선순위

1. **FLOW 01의 화면 이동과 상태 분기는 첨부된 FLOW 01 이미지를 최종 기준으로 한다.**
2. 화면 내부 문구와 세부 UI는 첨부 이미지와 Figma Make 코드를 함께 참고한다.
3. 서로 충돌하는 경우 FLOW 01의 화면 이동은 첨부 이미지를 우선한다.
4. 코드와 자료에서 확인되지 않는 동작은 `확인 필요` 또는 `현재 자료에서 확인 불가`로 표시한다.

### 확정된 제품 규칙

- 사용자 UI에는 `DAY 0` 또는 `D0`를 사용하지 않는다.
- 사용자에게 보이는 회복 일차는 **시술 당일 → DAY 1 → DAY 2 → … → DAY 7** 순서로 표시한다.
- Figma Make 코드와 일부 보조 이미지에 있는 `DAY 0–7`, `D0` 표기는 사용자 UI에 그대로 사용하지 않는다.
- 내부 날짜 계산 모델에서 시술 당일을 숫자 `0`으로 저장할지는 현재 자료에서 확인 불가하며 별도 확정이 필요하다. 단, 내부 값과 관계없이 사용자 표시 문구는 `시술 당일`이어야 한다.
- S03은 MALLO에서 시술 정보를 새로 등록하는 화면이 아니다. **DERNA에서 전달된 최근 시술 정보를 확인하는 화면**이다.
- S11 STATE B는 생활 행동 질문이면서 Protocol Matching에 필요한 조건이 부족한 경우에만 진입한다.
- 생활 행동 질문에 필요한 조건이 이미 충분하면 S11 STATE A에서 Protocol Matching을 거쳐 S08로 바로 이동한다.
- FLOW 01은 첨부 FLOW 01 이미지의 흐름을 최종 기준으로 사용한다.

---

## 2. 화면 목록과 각 화면의 역할

| 화면 | 화면명 | 우선순위 | 역할 |
|---|---|---:|---|
| DERNA Home | DERNA Home | 외부 진입점 | DERNA 앱에서 MALLO 카드의 `내 관리 기준 확인하기`를 통해 MALLO S01로 진입시키는 화면 |
| S01 | MALLO App Home | P0 | MALLO 진입 홈. 활성 Recovery Session 유무에 따라 STATE A 또는 STATE B를 표시 |
| S02 | 서비스 이용 동의 | P0 | 신규 Recovery Session 생성 전에 필수·선택 동의를 수집하는 온보딩 화면 |
| S03 | 시술 정보 확인 | P0 | DERNA에서 전달된 최근 시술 정보를 확인하고 해당 정보로 Recovery Session을 생성하는 화면 |
| S04 | Recovery Journey Home | P0 | 활성 Recovery Journey의 중심 허브. 시술 정보, 현재 회복 일차, 오늘의 행동 확인 진입점을 제공 |
| S05 | Today Action Plan | P0 | 오늘의 권장·조정 필요·확인 필요 행동을 개괄하는 화면. 최종 행동 판정 화면은 아님 |
| S06 | Quick Check | P0 | 사용자가 확인하려는 생활 행동 하나를 선택하는 화면 |
| S07 | Condition Check | P0 | Protocol Matching에 부족한 조건을 한 번에 하나씩 추가 확인하는 화면 |
| S08 | Action Result | P0 | Recovery Protocol 기반 행동 결과를 네 가지 상태 중 하나로 제공하는 화면 |
| S09 | Recovery Record | P1 선택 | 행동 확인 후 실제 수행 여부, 메모, 선택 사진을 기록하는 화면 |
| S10 | Recovery Journal | P1 선택 | 회복 기간 중 저장한 선택 기록을 일차별로 조회하는 화면 |
| S11 | ASK MALLO | P0 | 자연어 질문을 생활 행동 질문과 의료 판단 질문으로 분류하고 안전한 결과 흐름으로 연결 |
| S12 | 의료진 상담 Mock | P0 | 의료적 판단이 필요한 질문이나 CONNECT 결과를 의료진 문의 흐름으로 넘기는 Mock 화면 |

### 화면 ID가 확인되지 않는 영역

- IA 이미지에는 `MY / 설정` 영역과 동의 관리, 알림 설정, 데이터 관리, Recovery Session 삭제가 표현되어 있다.
- Figma Make의 확정 화면 인덱스 S01–S12에는 MY/설정의 독립 화면 ID가 없다.
- 실제 MY/설정 화면 수와 상세 이동 관계는 **현재 자료에서 확인 불가**다.

---

## 3. 전체 사용자 흐름

### FLOW 01 — 최초 진입 / 온보딩

FLOW 01은 첨부 이미지를 최종 기준으로 하며 구조를 변경하거나 다른 흐름을 추가하지 않는다.

```text
DERNA Home
└─ MALLO 카드의 “내 관리 기준 확인하기”
   └─ S01 MALLO App Home
      ├─ 기존 Recovery Session 있음
      │  └─ S01 STATE A
      │     └─ “Recovery Journey 이어가기”
      │        └─ S04 Recovery Journey Home
      │
      └─ 기존 Recovery Session 없음
         └─ S01 STATE B
            └─ “새 Recovery Journey 시작”
               └─ S02 서비스 이용 동의
                  └─ “동의하고 계속”
                     └─ S03 시술 정보 확인
                        └─ DERNA에서 전달된 최근 시술 정보 확인
                           └─ “이 시술로 시작하기”
                              └─ Recovery Session 생성
                                 └─ S04 Recovery Journey Home
```

#### FLOW 01 해석 규칙

- S01 STATE A와 STATE B는 서로 다른 화면 ID가 아니라 동일한 S01의 상태 차이다.
- S02와 S03은 기존 Recovery Session이 없는 경우에만 거친다.
- 기존 세션 사용자는 S02와 S03을 거치지 않고 S01 STATE A에서 S04로 이동한다.
- S03에서 확인하는 시술 정보는 MALLO에서 새로 입력하는 정보가 아니라 DERNA에서 전달된 최근 시술 정보다.
- Recovery Session 생성 직후 S04의 사용자 표시 일차는 시술일에 따라 `시술 당일` 또는 `DAY N`으로 결정된다.
- 활성 Recovery Session의 존재 여부를 어느 API나 저장소에서 판단하는지는 **확인 필요**다.

### FLOW 02 — Main Action Flow

```text
S04 Recovery Journey Home
├─ “오늘 행동 확인하기” → S05 Today Action Plan
│  └─ “행동 확인하기” → S06 Quick Check
└─ Quick Check 바로가기 → S06 Quick Check

S06에서 행동 하나 선택
└─ Protocol Matching에 필요한 조건이 충분한지 시스템이 판단
   ├─ 조건 충분
   │  └─ Protocol Matching → S08 Action Result
   └─ 조건 부족
      └─ S07 Condition Check
         └─ 필요한 조건 하나 확인
            └─ Protocol Matching → S08 Action Result

S08 결과
├─ POSSIBLE
├─ ADJUST
├─ POSTPONE
└─ CONNECT → S12 의료진 상담 Mock
```

- S05는 오늘 행동의 개요이며 POSSIBLE/ADJUST/POSTPONE/CONNECT 최종 결과를 표시하지 않는다.
- S06에서 선택 가능한 행동은 운동, 화장, 세안, 스킨케어, 열 자극의 다섯 가지다.
- 사용자는 한 번에 하나의 행동만 선택한다.
- 조건 충분/부족 판단은 시스템 로직이며 사용자에게 기술적인 분기 질문으로 노출하지 않는다.
- S07은 긴 설문이 아니라 현재 결과에 필요한 조건 하나만 질문한다.
- Protocol Matching의 실제 규칙, 데이터 구조 및 서버 연동 방식은 **현재 자료에서 확인 불가**다.

### FLOW 03 — P1 Recovery Record

```text
S08 Action Result
└─ 선택적 “Recovery Record 남기기”
   └─ S09 Recovery Record
      ├─ 사진 추가 안 함
      │  └─ 행동 결과/메모 저장 → S10 Recovery Journal
      └─ 사용자가 “사진 추가”를 명시적으로 선택
         └─ 사진 수집·이용 동의
            ├─ 거부
            │  └─ 사진 없이 기록 계속 → S10 Recovery Journal
            └─ 동의
               └─ 카메라/앨범 OS 권한 요청
                  └─ 사진 추가 및 저장 → S10 Recovery Journal
```

- S09와 S10은 P1 선택 기능이며 P0 핵심 흐름 완료에 필수가 아니다.
- 앱 최초 진입, S01, S02, S03에서는 사진 동의나 카메라/앨범 OS 권한을 요청하지 않는다.
- 사진 동의를 거부해도 기록 저장을 막지 않는다.
- 사진 분석, 피부 중증도 비교, 진단, 회복 예측은 포함하지 않는다.

### FLOW 04 — ASK MALLO

```text
S04 Recovery Journey Home
└─ S11 STATE A 질문 입력
   └─ 질문 의도 분류
      ├─ 생활 행동 질문
      │  ├─ 조건 충분
      │  │  └─ Protocol Matching → S08 Action Result
      │  └─ 조건 부족
      │     └─ S11 STATE B
      │        └─ 필요한 조건만 명확화
      │           └─ Protocol Matching → S08 Action Result
      └─ 의료 판단 질문
         └─ S11 STATE C
            └─ AI 의료 판단 답변 생성 중단
               └─ CONNECT → S12 의료진 상담 Mock
```

- **S11 STATE B는 생활 행동 질문에서 조건이 부족한 경우에만 진입한다.**
- 조건이 충분한 생활 행동 질문은 STATE B를 거치지 않고 S08로 이동한다.
- ASK MALLO는 독립적인 결과 체계를 만들지 않고 S08의 네 가지 결과 의미로 합류한다.
- 의료적 판단이 필요한 질문에는 MALLO가 독립적인 진단이나 의료 판단을 생성하지 않는다.

---

## 4. 화면별 주요 UI 요소와 상태 / variant

### DERNA Home

**주요 UI**

- DERNA 헤더 및 검색/알림 계열 아이콘
- 예약 CTA
- 이벤트 배너/캐러셀
- MALLO 시술 후 회복관리 카드
- `내 관리 기준 확인하기` CTA
- DERNA 하단 내비게이션

**상태 / variant**

- 이벤트 캐러셀 상태는 이미지에서 보이지만 실제 동작은 **현재 자료에서 확인 불가**다.
- DERNA와 MALLO가 동일 앱 내부 화면인지, 별도 앱 또는 딥링크 관계인지는 **확인 필요**다.

### S01 — MALLO App Home

**공통 UI**

- `CONNECTED TO DERNA`
- MALLO 타이틀/브랜드 영역
- 프로필 또는 MY 진입 아이콘
- Journey, Check, ASK, MY 하단 탭

**STATE A — 기존 Recovery Session 있음**

- 진행 중 Recovery Journey 라벨
- 시술명(REJURAN 예시)
- 현재 사용자 표시 일차: `시술 당일` 또는 `DAY 1`~`DAY 7`
- 시술일, 회복 진행 상태
- 회복 기간 진행 표시
- `Recovery Journey 이어가기` 주 CTA
- 오늘 결과 Preview
- ASK MALLO, MY/설정 빠른 접근

**STATE B — 기존 Recovery Session 없음**

- 신규/빈 Recovery Journey 상태
- Empty State Illustration 자리
- 회복 관리 설명
- `새 Recovery Journey 시작` 주 CTA
- 권한, 로그인, 의료 정보 입력 없음

### S02 — 서비스 이용 동의

**주요 UI**

- 뒤로가기와 화면 제목
- Recovery Journey 이용 안내
- 필수: 서비스 이용 동의
- 필수: 행동 데이터 처리 동의
- 선택: 알림 수신 동의
- 하단 고정 `동의하고 계속` CTA

**상태 / variant**

- 필수 동의 미완료: CTA 비활성
- 필수 동의 완료: CTA 활성
- 알림 수신 동의 선택/미선택
- 코드 화면은 필수 동의가 체크된 예시만 정적으로 표시하므로 실제 체크 로직은 **확인 필요**다.

### S03 — 시술 정보 확인

**주요 UI**

- 뒤로가기와 `시술 정보 확인` 제목
- `DERNA에서 확인한 최근 시술입니다` 안내
- DERNA에서 전달된 최근 시술명
- 시술일
- 병원 정보가 전달된 경우 병원명
- `이 시술로 시작하기` 주 CTA
- 정보가 다를 경우 DERNA에서 확인하는 보조 CTA 또는 링크

**상태 / variant**

- 최근 시술 정보 정상 수신
- 병원 정보 있음/없음
- DERNA 시술 정보가 없거나 불완전한 상태의 처리 방식은 **현재 자료에서 확인 불가**다.
- 정보가 다른 경우 이동할 정확한 DERNA 화면은 **확인 필요**다.

**자료 충돌 처리**

- Figma Make 코드는 `시술 정보 등록`, 달력 선택, 병원 직접 입력 UI를 포함한다.
- 확정사항에 따라 이 구조를 최종 제품 흐름으로 채택하지 않는다.
- S03은 DERNA에서 전달된 최근 시술 정보를 확인하는 화면으로 정의한다.

### S04 — Recovery Journey Home

**주요 UI**

- 시술명
- 현재 회복 일차
- 시술일/회복 상태
- `시술 당일 → DAY 1 → … → DAY 7` 진행 표시
- 오늘의 Recovery Journey 요약
- `오늘 행동 확인하기` 주 CTA
- Today Action Plan, Quick Check, ASK MALLO 빠른 접근
- 낮은 우선순위의 Recovery Record
- 기록이 있을 때만 Recovery Journal 진입점
- 하단 탭

**상태 / variant**

- 시술 당일
- DAY 1~DAY 7
- 기록 있음/없음
- 세션 종료 후 상태는 **현재 자료에서 확인 불가**다.

### S05 — Today Action Plan

**주요 UI**

- 뒤로가기
- 시술명, 현재 일차, 날짜 컨텍스트
- 오늘 권장 행동
- 조정이 필요한 행동
- 확인이 필요한 행동
- 항목별 확인 진입점
- 완료/저장 상태
- `행동 확인하기` 주 CTA
- Journey Home 보조 CTA

**상태 / variant**

- 항목별 완료/미완료
- 행동별 그룹 분류
- 사용자 표시 일차에 따른 콘텐츠 차이
- 실제 행동 목록 데이터는 예시 외에는 **현재 자료에서 확인 불가**다.

### S06 — Quick Check

**주요 UI**

- 뒤로가기
- 질문: `어떤 행동을 확인할까요?`
- Recovery Protocol 컨텍스트
- 운동, 화장, 세안, 스킨케어, 열 자극 타일
- 선택 상태
- 하단 확인 CTA

**상태 / variant**

- 행동 미선택: CTA 비활성 또는 안내 상태
- 행동 하나 선택: CTA 활성
- 선택 후 조건 충분: S08
- 선택 후 조건 부족: S07

### S07 — Condition Check

**주요 UI**

- Quick Check로 돌아가기
- 선택 행동 Chip
- 시술명/현재 일차 Chip
- 부족한 조건 하나에 대한 질문
- Radio 또는 Chip 선택지
- `결과 확인` CTA
- `행동 다시 선택` 보조 CTA

**상태 / variant**

- 선택 행동과 부족한 조건에 따라 질문과 선택지가 변경됨
- 한 번에 필수 조건 하나만 노출
- 조건이 여러 개 부족할 때 여러 S07 단계를 반복하는지는 **확인 필요**다.

### S08 — Action Result

**공통 UI**

- 시술명, 현재 일차, 선택 행동
- 결과 상태 배지
- 짧은 결과 설명
- `왜 이런 결과인가요?`
- 조정 방법 또는 재확인 시점
- Recovery Protocol 근거
- 다음 행동 CTA
- 선택적 Recovery Record 진입

**variant**

| variant | 의미 | 대표 CTA | 후속 흐름 |
|---|---|---|---|
| POSSIBLE | 가능 · 그대로 진행 | 다음 행동 확인 | S06으로 해석되나 실제 핸들러 확인 필요 |
| ADJUST | 조정 필요 · 조정 후 진행 | 조정 후 진행 | 정확한 CTA 도착 화면 확인 필요 |
| POSTPONE | 미루기 · 나중에 재확인 | 나중에 다시 확인 | 정확한 CTA 도착 화면 확인 필요 |
| CONNECT | 의료진 확인 필요 | 의료진에게 문의하기 | S12 |

### S09 — Recovery Record

**주요 UI**

- 이전 S08 행동과 결과
- 실제로 했음/하지 않음/조정해서 했음
- 선택 메모
- `사진 추가(선택)`
- 저장 CTA
- 사진 없이 저장 CTA

**상태 / variant**

- 사진 추가 전
- 사용자가 사진 추가를 선택한 후 자체 동의 표시
- 사진 동의 거부 후 사진 없이 기록
- 사진 동의 후 카메라/앨범 OS 권한 요청
- 권한 허용 후 사진 선택/촬영
- 권한 거부 후 사진 없이 기록
- Figma Make 코드는 문서화를 위해 여러 상태를 한 화면에 동시에 표시하므로 실제 앱에서는 상태별 조건부 UI가 필요하다.

### S10 — Recovery Journal

**주요 UI**

- 시술명과 회복 기간 컨텍스트
- `시술 당일`, DAY 1~DAY 7 선택기
- 선택한 일차의 행동 결과
- 메모
- 사진이 존재하는 경우에만 사진
- Journey Home CTA

**상태 / variant**

- 선택 일차 변경
- 기록 있음/없음
- 사진 있음/없음
- 기록이 없는 일차의 Empty State UI는 **현재 자료에서 확인 불가**다.

### S11 — ASK MALLO

**STATE A — 질문 입력**

- 시술명/현재 일차
- 질문 안내
- 생활 행동 중심 예시 질문
- 텍스트 입력
- 전송 CTA
- 내부 질문 의도 분류

**STATE B — 생활 행동 질문의 조건 부족**

- STATE B는 생활 행동 질문이면서 조건이 부족한 경우에만 진입
- 사용자 질문 말풍선
- MALLO의 간결한 명확화 질문
- 필요한 조건 선택지
- 선택 후 Protocol Matching 및 S08 이동

**STATE C — 의료 판단 질문**

- 사용자 의료 관련 질문
- AI 답변 생성 중단 안내
- MALLO가 의료 판단을 제공하지 않는다는 안내
- `의료진에게 문의하기` CTA
- S12 연결

### S12 — 의료진 상담 Mock

**주요 UI**

- 의료진 확인 필요 상태 배너
- 담당 의료진/병원 정보
- 문의 CTA
- 시술명, 현재 일차, 행동 또는 질문 내용, Journey 맥락 요약
- AI 진단이 포함되지 않는다는 안내
- 영상 상담 Mock

**상태 / variant**

- CONNECT 안내
- 의료진 문의 요청
- 영상 상담 Mock 상태
- 실제 상담 연결 기능과 완료/실패 상태는 MVP 범위 밖으로 표현되어 있으며 세부 동작은 **현재 자료에서 확인 불가**다.

---

## 5. 버튼 및 CTA 이동 관계

Figma Make 코드의 CTA 대부분에는 실제 `onClick` 라우팅이 없다. 아래 표는 첨부 흐름도와 코드의 화면 설명을 기준으로 한 목적지다.

| 출발 화면 | 버튼 / CTA | 도착 화면 또는 동작 | 확정 수준 |
|---|---|---|---|
| DERNA Home | 내 관리 기준 확인하기 | S01 | FLOW 01 이미지 기준 확정 |
| S01 STATE A | Recovery Journey 이어가기 | S04 | 확정 |
| S01 STATE B | 새 Recovery Journey 시작 | S02 | 확정 |
| S02 | 동의하고 계속 | S03 | 확정 |
| S02 | 이전 | S01 STATE B | 흐름상 해석, 실제 back 동작 확인 필요 |
| S03 | 이 시술로 시작하기 | Recovery Session 생성 후 S04 | 확정 |
| S03 | DERNA에서 확인하기 | DERNA의 시술 정보 확인 영역 | 정확한 화면 확인 필요 |
| S04 | 오늘 행동 확인하기 | S05 | 확정 |
| S04 | Today Action Plan | S05 | 확정 |
| S04 | Quick Check | S06 | 확정 |
| S04 | ASK MALLO | S11 STATE A | 확정 |
| S04 | Recovery Record | S09 | P1 선택 진입으로 해석, 실제 연결 확인 필요 |
| S04 | Recovery Journal | S10 | 기록이 있을 때만, 실제 연결 확인 필요 |
| S05 | 행동 확인하기 | S06 | 확정 |
| S05 | Journey Home으로 | S04 | 확정 |
| S05 | 각 행동의 확인 | S06 또는 행동이 선택된 S06 | 사전 선택 전달 여부 확인 필요 |
| S06 | 선택한 행동 확인하기 | 조건 충분 시 S08, 부족 시 S07 | 확정 |
| S06 | 이전 | S04 또는 S05 | 진입 출처에 따른 back 처리 확인 필요 |
| S07 | 결과 확인 | Protocol Matching 후 S08 | 확정 |
| S07 | 행동 다시 선택 | S06 | 확정 |
| S08 POSSIBLE | 다음 행동 확인 | S06으로 해석 | 실제 목적지 확인 필요 |
| S08 ADJUST | 조정 후 진행 | 현재 자료에서 확인 불가 | 확인 필요 |
| S08 POSTPONE | 나중에 다시 확인 | 현재 자료에서 확인 불가 | 확인 필요 |
| S08 CONNECT | 의료진에게 문의하기 | S12 | 확정 |
| S08 | 다른 행동 확인하기 | S06 | 코드 설명 기준 |
| S08 | Recovery Record 남기기 | S09 | 확정, 선택 기능 |
| S09 | 저장 | S10 | 확정 |
| S09 | 사진 없이 저장 | S10 | 확정 |
| S10 | Journey Home으로 | S04 | 확정 |
| S11 STATE A | 질문 전송 | 질문 분류 | 확정 |
| S11 STATE A | 생활 질문이며 조건 충분 | Protocol Matching 후 S08 | 확정사항 반영 |
| S11 STATE A | 생활 질문이며 조건 부족 | S11 STATE B | 확정사항 반영 |
| S11 STATE B | 조건 선택 | Protocol Matching 후 S08 | 확정 |
| S11 STATE C | 의료진에게 문의하기 | S12 | 확정 |
| S12 | 다른 질문하기 | S11 STATE A로 해석 | 실제 연결 확인 필요 |
| S12 | 영상 상담 요청 | Mock 요청 상태 | 실제 상담 기능 없음 |

---

## 6. 공통 컴포넌트 후보

Figma Make 코드의 컴포넌트 이름을 그대로 복사하는 것이 아니라, 역할과 상태 모델만 React Native 컴포넌트 설계 후보로 활용한다.

### 레이아웃 / 내비게이션

- `ScreenScaffold`: Safe Area, 배경, 화면 본문
- `ScreenHeader`: 뒤로가기, 중앙 제목, 우측 액션
- `ScrollableScreen`: 공통 좌우 여백과 세로 간격을 가진 스크롤 본문
- `BottomActionBar`: 하단 주·보조 CTA
- `MainTabBar`: Journey, Check, ASK, MY

### 기본 UI

- `Button`: primary, secondary, ghost, dashed / normal, small
- `Card`: 기본, muted, dashed, 강조형
- `SectionLabel`
- `Chip`: 기본, 선택, 컨텍스트, P1
- `Divider`
- `CheckboxRow`
- `RadioOption`
- `ActionRow`
- `EmptyState`

### 도메인 UI

- `RecoverySessionContext`: 시술명, 사용자 표시 일차, 날짜
- `RecoveryProgress`: 시술 당일~DAY 7 진행 표시
- `RecoverySessionCard`
- `TodayPreviewList`
- `QuickAccessGrid`
- `ActionCategorySection`
- `BehaviorTile`
- `ConditionQuestion`
- `ActionResultCard`: S08의 네 variant 공통 구조
- `ProtocolBasisCard`
- `OptionalFeatureCard`
- `DaySelector`: 시술 당일, DAY 1~DAY 7
- `RecordSummaryCard`
- `ChatBubble`
- `ChatComposer`
- `MedicalSafetyNotice`
- `PhotoConsentPanel`
- `ClinicianHandoffSummary`

### 실제 앱에 포함하지 않을 문서용 요소

- 모바일 기기 외곽을 그리는 `Phone` 프레임
- 화면 위의 ID, `from`, `to`, note 라벨
- `FlowSection`, `HFlow`, `Arrow`, `BranchArrow`
- `SYSTEM LOGIC`, `WIREFRAME NOTE`처럼 사용자에게 미노출이라고 명시된 설명 박스
- 큰 웹 캔버스에서 여러 화면을 나란히 배치하는 레이아웃

---

## 7. 디자인 토큰 후보

Figma Make 코드는 최종 비주얼 디자인이 아니라 grayscale low-fidelity 와이어프레임이다. 아래 값은 구현 참고용 후보이며 최종 브랜드 토큰으로 승인된 값은 아니다.

### 색상

| 후보 토큰 | 값 | 용도 |
|---|---|---|
| `background` | `#f2f2f2` | 와이어프레임 문서 배경 |
| `white` | `#ffffff` | 화면/카드 배경 |
| `gray50` | `#fafafa` | 옅은 보조 배경 |
| `gray100` | `#f5f5f5` | 비활성/보조 배경 |
| `gray200` | `#ebebeb` | 구분선, 진행 미완료 |
| `gray300` | `#dddddd` | 기본 border |
| `gray400` | `#cccccc` | 비활성 아이콘/텍스트 |
| `gray500` | `#aaaaaa` | 보조 텍스트 |
| `gray600` | `#888888` | 중간 강조 텍스트 |
| `gray700` | `#555555` | 본문 강조 |
| `gray800` | `#333333` | 진한 텍스트/선택 상태 |
| `gray900` | `#111111` | 제목, primary CTA |
| `borderDark` | `#bbbbbb` | 강조 border |

- DERNA Home 이미지의 노란색, 빨간색 및 MALLO 프로모션 카드 색은 Figma Make UI 토큰에 없다.
- 실제 MALLO 브랜드 컬러, semantic success/warning/danger 컬러는 **확인 필요**다.

### Typography

- 기본 폰트 후보: `Inter`
- 메타데이터/프로토콜/일차 라벨 후보: `JetBrains Mono`
- 코드상 font size 범위: `9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 22, 26, 28`
- 코드상 font weight: `400, 500, 600, 700, 800`
- 본문 line height: 약 `1.5`~`1.7`
- 큰 제목 letter spacing: 약 `-0.01em`~`-0.02em`
- 메타 라벨 letter spacing: 약 `0.07em`~`0.1em`

확인 사항:

- 웹 CSS는 Inter 400~700만 불러오지만 화면 코드에는 800이 사용된다.
- 실제 앱에서 사용할 한글 폰트와 Inter/JetBrains Mono의 정확한 weight 파일은 **확인 필요**다.

### Spacing / Radius / Border

- 화면 좌우 여백: 주로 `20`, S01 일부 `24`
- 기본 세로 gap: `6, 8, 10, 12, 14, 16`
- 큰 구간 간격: `20, 24, 28, 32`
- 카드 padding: 세로 `12`, 가로 `14`
- 일반 버튼 padding: 세로 `13`, 가로 `20`
- 작은 버튼 padding: 세로 `9`, 가로 `16`
- radius: `2, 3, 4, 6, 8, 10, 12, 20`, 원형 요소 `50%`
- border width: `1, 1.5, 2`
- 그림자와 gradient는 사용하지 않음
- 문서용 Phone 기준 크기: `375 × 812`

실제 앱에서는 `375 × 812` 고정 크기를 사용하지 않고 다양한 화면 크기와 Safe Area에 대응해야 한다.

---

## 8. 이미지 / 아이콘 / 에셋 구조

### Figma Make 코드의 현재 구조

- `src/imports`에는 IA와 사용자 흐름을 설명하는 PNG 문서 이미지가 7개 있다.
- 해당 PNG는 `App.tsx`에서 import하거나 런타임 UI에 렌더링하지 않는다.
- 흐름도 PNG는 앱 화면용 에셋이 아니라 분석·설계 문서 자료다.
- UI 아이콘은 `◎`, `⊡`, `◻`, `○`, `✓`, `△`, `✕` 같은 문자 기호와 이모지로 대체되어 있다.
- 프로필, 빈 상태, 달력, 사진, 영상 상담은 placeholder 사각형으로 표시된다.

### 전환 시 필요한 정리

- 문자 기호와 이모지는 플랫폼별 모양이 다르므로 일관된 아이콘 세트로 교체해야 한다.
- 현재 Expo 프로젝트에는 `@expo/vector-icons`, `expo-symbols`, `expo-image`가 설치되어 있으나 어떤 아이콘 체계를 표준으로 사용할지는 **확인 필요**다.
- Empty State 일러스트, 행동 아이콘, MALLO 로고, 병원/의료진 이미지의 최종 에셋은 **현재 자료에서 확인 불가**다.
- DERNA Home에 보이는 이벤트/프로모션 이미지와 MALLO 카드 이미지의 원본 에셋은 Figma Make 폴더에서 확인되지 않는다.
- 흐름도 PNG를 실제 앱 UI 에셋으로 사용해서는 안 된다.

---

## 9. React Native + Expo 전환 시 주의점

현재 MALLO frontend는 Expo SDK 54, React Native 0.81, React 19.1, Expo Router 기반이다. 이 문서는 전환 방향만 분석하며 기존 구현 코드, 라우팅 또는 컴포넌트를 수정하지 않는다.

참고 문서:

- Expo SDK 54: <https://docs.expo.dev/versions/v54.0.0/>
- Expo ImagePicker SDK 54: <https://docs.expo.dev/versions/v54.0.0/sdk/imagepicker/>
- Expo Font SDK 54: <https://docs.expo.dev/versions/v54.0.0/sdk/font/>

### 개념과 데이터로 재사용 가능한 부분

- S01–S12 화면의 정보 구조와 역할
- FLOW 01의 활성 Recovery Session 유무 분기
- 화면별 CTA 목적지와 도메인 상태
- S06 행동 종류 배열과 단일 선택 모델
- S07의 부족 조건만 질문하는 모델
- S08의 `POSSIBLE | ADJUST | POSTPONE | CONNECT` 결과 타입과 공통 정보 구조
- S09의 사진 추가 전/동의/권한/저장 상태 모델
- S11의 질문 의도 분류와 의료 안전 분기
- 색상, spacing, radius 등의 숫자형 토큰 후보
- 공통 Card, Chip, Button, Header 등의 컴포넌트 경계

### 그대로 복사할 수 없는 웹 전용 구현

| Figma Make 웹 구현 | React Native 전환 |
|---|---|
| `<div>`, `<span>` | `View`, `Text` |
| 클릭 가능한 `<div onClick>` | `Pressable`의 `onPress` |
| `overflow: auto` | `ScrollView` 또는 `FlatList` |
| CSS Grid | flex row/wrap 또는 `FlatList`의 열 구성 |
| `cursor: pointer` | 제거 |
| `padding: '12px 14px'` | `paddingVertical`, `paddingHorizontal` 숫자 값 |
| `React.CSSProperties` | `ViewStyle`, `TextStyle`, `StyleProp` |
| CSS Google Fonts import | `expo-font` 또는 앱 번들 폰트 |
| 웹 스크롤바 CSS | 네이티브에서 제거 |
| 가짜 status bar와 Phone 프레임 | 실제 Safe Area와 `expo-status-bar` |
| 여러 화면을 가로로 나열한 flow canvas | 실제 route별 단일 화면 |
| 시스템 설명용 note 박스 | 실제 사용자 UI에서 제거 |

### 레이아웃과 접근성

- 화면을 `375 × 812`로 고정하지 않는다.
- iOS/Android Safe Area, Android edge-to-edge, 키보드, 작은 화면, 큰 글자 크기를 고려해야 한다.
- 하단 고정 CTA와 탭 바가 본문을 가리지 않도록 inset을 적용해야 한다.
- ASK MALLO 입력 화면에는 키보드 회피와 스크롤 동작이 필요하다.
- 터치 요소에는 충분한 터치 영역, 접근성 label/role/state가 필요하다.
- 상태를 색상만으로 구분하지 않고 텍스트와 아이콘을 함께 사용해야 한다.

### Navigation / 상태 전달

- 현재 프로젝트는 Expo Router를 사용하므로 화면 ID를 route로 매핑할 수 있다.
- 단, 본 문서에서는 route를 생성하거나 수정하지 않는다.
- S06에서 선택한 행동, S07에서 확인한 조건, S08 결과, S09 기록까지 이어지는 상태의 저장 범위는 **확인 필요**다.
- URL param만 사용할지 전역 store 또는 서버 세션을 사용할지는 **현재 자료에서 확인 불가**다.
- S02/S03 이후 세션 생성 중 로딩·실패·재시도 UI는 자료에 없다.

### 날짜와 일차 표시

- 사용자 UI는 반드시 `시술 당일 → DAY 1 → … → DAY 7`을 사용한다.
- Figma Make 코드의 `DAY 0`, `D0`, `DAY 0–7` 문자열은 변환 과정에서 그대로 복사하지 않는다.
- 날짜 차이는 시간대, 자정 경계, 서버/기기 날짜 기준에 영향을 받으므로 Asia/Seoul 기준 여부를 포함해 계산 정책을 확정해야 한다.
- 내부 계산 값과 사용자 표시 label을 분리하는 것이 필요하지만, 내부 데이터 모델의 상세 형식은 **확인 필요**다.

### 폰트

- 웹의 `@import` 폰트는 네이티브에서 동작하지 않는다.
- `expo-font`를 통해 번들하거나 Expo 호환 Google Fonts 패키지를 검토해야 한다.
- 한글 glyph 지원, weight별 파일, Android/iOS 렌더링 차이를 확인해야 한다.

### 사진과 권한

- 현재 프로젝트에는 `expo-image`는 있으나 `expo-image-picker`는 설치되어 있지 않다.
- 사진 기능 구현 시 Expo SDK 54에 맞는 `expo-image-picker` 검토가 필요하다.
- 제품 흐름상 OS 권한 요청은 앱 시작이나 온보딩이 아니라 S09에서 사용자가 사진 추가를 선택하고 사진 수집·이용 동의를 완료한 뒤에만 수행한다.
- 권한 거부는 기록 저장을 막지 않아야 한다.
- Android에서 이미지 선택 후 Activity 복구가 필요한 경우 `getPendingResultAsync` 같은 SDK 54 동작을 검토해야 한다.
- 사진 파일 업로드, 저장 위치, 암호화, 보존 기간, 삭제 방식은 **현재 자료에서 확인 불가**다.

### 의료 안전

- MALLO는 피부 진단, 중증도 판단, 약물 추천, 치료 추천 또는 독립적인 의료 판단을 생성하지 않는다.
- Protocol Matching은 검증된 Recovery Protocol에 기반해야 한다.
- 의료적 판단이 필요한 질문은 S11 STATE C 또는 S08 CONNECT를 통해 S12로 이동한다.
- 의료진에게 전달되는 요약에는 사용자가 제공한 맥락만 포함하고 AI 진단을 포함하지 않는다.
- 응급 상황 안내 정책은 **현재 자료에서 확인 불가**다.

---

## 10. 구현 전에 추가로 확정해야 하는 사항

### FLOW 01 / DERNA 연동

- DERNA Home과 MALLO가 동일 앱의 route인지 별도 앱 간 딥링크인지
- DERNA에서 S01 진입 시 전달하는 session/user context
- 활성 Recovery Session 존재 여부를 판단하는 API와 저장소
- 최근 시술 정보의 전달 필드와 데이터 신뢰 기준
- 최근 시술이 여러 개인 경우 S03에 어느 시술을 표시하는지
- 최근 시술 정보가 없거나 누락된 경우의 처리
- S03의 `DERNA에서 확인하기`가 이동할 정확한 DERNA 화면

### Recovery Session / 날짜

- Recovery Session 생성 API와 성공/실패/중복 생성 처리
- 시술 당일 및 DAY 1~DAY 7 계산 기준 시간대
- 세션이 DAY 7 이후 어떻게 종료되는지
- 진행 중 세션이 여러 개 존재할 수 있는지
- 내부 일차 데이터 모델과 사용자 표시 label의 매핑

### 행동 확인 / Protocol Matching

- 행동별 필수 조건 정의
- 조건 충분/부족 판단 위치: 클라이언트 또는 서버
- S07에서 조건이 여러 개 부족할 때의 반복 방식
- Protocol 버전과 결과 근거 데이터 구조
- S08 ADJUST 및 POSTPONE 주 CTA의 정확한 목적지
- S05 항목 선택 시 S06에 행동이 미리 선택되어 전달되는지

### ASK MALLO

- 질문 의도 분류 방식과 실패/불확실 상태
- 생활 행동 질문에서 조건 충분 여부를 판단하는 방식
- S11 대화 기록의 저장 범위
- 의료 판단 질문 분류 기준과 검증 방식
- 사용자가 의료 질문과 생활 행동 질문을 함께 입력한 경우의 처리

### Recovery Record / Journal

- P1 기능의 실제 출시 범위
- 기록 데이터 저장 위치와 동기화 정책
- 사진 수집·이용 동의 문구 및 법무 검토
- 사진 보존 기간, 삭제, 재동의 정책
- 사진 없이 기록할 때의 Empty State
- 기록 수정/삭제 지원 여부

### 의료진 Handoff

- 실제 문의 채널: 채팅, 전화, 영상, 병원 앱 연결 등
- S03에서 병원 정보가 없을 때 S12 표시 방식
- 문의 요청 성공/실패/대기/취소 상태
- 의료진에게 전달할 데이터 범위와 사용자 동의
- Mock 이후 실제 기능의 MVP 포함 여부

### 디자인 시스템 / 에셋

- MALLO 최종 브랜드 컬러와 semantic 컬러
- 최종 한글/영문 폰트와 weight
- 아이콘 시스템
- DERNA와 MALLO 간 시각적 연결 기준
- Empty State 및 행동별 아이콘 에셋
- 로딩, 오류, 네트워크 단절, 빈 데이터 화면
- 접근성 기준과 최소 터치 영역

---

## 11. 최종 요약

- FLOW 01은 첨부 이미지 기준으로 `DERNA Home → S01 → 세션 유무 분기 → S04` 구조를 확정한다.
- 세션이 있으면 S01 STATE A에서 S04로 이동한다.
- 세션이 없으면 S01 STATE B에서 S02와 S03을 거쳐 Recovery Session을 생성한 후 S04로 이동한다.
- S03은 MALLO의 시술 정보 등록 화면이 아니라 DERNA에서 전달된 최근 시술 정보를 확인하는 화면이다.
- 사용자 UI의 회복 일차는 `시술 당일 → DAY 1 → … → DAY 7`로 표시하며 `DAY 0/D0`는 사용하지 않는다.
- S11 STATE B는 생활 행동 질문에서 조건이 부족할 때만 사용한다.
- Figma Make의 웹 DOM/CSS 코드를 복사하지 않고 화면 구조, 상태 모델, 디자인 토큰 후보만 React Native + Expo 구현에 활용해야 한다.
- 본 문서 작성 단계에서는 기존 React Native/Expo 코드, 라우팅 및 컴포넌트를 변경하지 않는다.
