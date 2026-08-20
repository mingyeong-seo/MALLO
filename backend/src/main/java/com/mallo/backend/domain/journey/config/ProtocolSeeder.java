package com.mallo.backend.domain.journey.config;

import java.util.List;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.mallo.backend.domain.journey.entity.ActionType;
import com.mallo.backend.domain.journey.entity.DecisionType;
import com.mallo.backend.domain.journey.entity.Protocol;
import com.mallo.backend.domain.journey.repository.ProtocolRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REJURAN 초기 집중 관리(DAY 1~7)/경과 관리(DAY 8~) Protocol seed.
 * PRD Appendix D(DERNA 리쥬란 주의사항), Appendix A(샘플 스키마) 기준.
 * 병원이 검수한 실제 데이터가 아니라 해커톤 데모용 fixture이며, protocol 테이블이 비어있을 때만 채운다.
 *
 * 2026-08-19 전면 재작성: FE·BE 공통 연동 기준 문서(섹션 4)가 확정한 Action/Context 값
 * (EXERCISE.intensity / MAKEUP.friction / CLEANSING.method / SKINCARE.product_type /
 * HEAT.heat_type)에 맞춰 conditions 키·값 체계를 갱신했다.
 *
 * 2026-08-20 day 0(시술 당일) 보강: EXERCISE·HEAT에만 day 0용 규칙이 없어서 시술 당일 세션에서
 * 두 action은 조건값과 무관하게 무조건 NO_PROTOCOL이 나가던 문제(FE QA 보고)를 고쳤다. MAKEUP/
 * CLEANSING/SKINCARE는 이미 day 0 규칙이 있어서 정상이었음 — EXERCISE/HEAT만 dayStart가 1부터라
 * 빠진 것. 병원 검수 없이 백엔드 판단으로 추가했으므로 실제 검수 단계에서 재확인 필요.
 *
 * 각 규칙 옆 주석 표기:
 *  - [문서 근거] : Appendix D 원문 또는 FE 협의 내용에 직접 명시된 값 (그대로 반영)
 *  - [백엔드 판단] : RECOVERY_PROTOCOL_DECISION_MATRIX_DERNA_FINAL 원문이 따로 없어서, 시술 후
 *    스킨케어에서 통용되는 일반 상식(자극 성분·마찰·발한 활동 회피 등) 선에서 백엔드가 정한 값.
 *    MVP 단계라 의학적 근거 수준까지는 요구되지 않는다고 팀 확인받음(2026-08-19) — 실제 병원 검수를
 *    받는 단계가 오면 그때 교체.
 */
@Slf4j
@Component
@Profile("!test")
@RequiredArgsConstructor
public class ProtocolSeeder implements ApplicationRunner {

	private static final String REJURAN = "REJURAN";
	private static final String VERSION = "rejuran-v4";

	private final ProtocolRepository protocolRepository;

	@Override
	public void run(ApplicationArguments args) {
		if (protocolRepository.count() > 0) {
			log.info("Protocol 테이블에 이미 데이터가 있어 seed를 건너뜁니다.");
			return;
		}
		List<Protocol> data = seedData();
		protocolRepository.saveAll(data);
		log.info("REJURAN Protocol seed {}건 저장 완료", data.size());
	}

	private List<Protocol> seedData() {
		return List.of(
				// ===== 화장 (MAKEUP) =====
				// [문서 근거] "가벼운 세안과 화장은 다음날부터 가능" → 당일은 friction 조건과 무관하게 보류
				Protocol.builder()
						.procedure(REJURAN).dayStart(0).dayEnd(0)
						.action(ActionType.MAKEUP)
						.decision(DecisionType.POSTPONE)
						.guidance("시술 당일은 화장을 피하고 다음날부터 가볍게 시작하세요.")
						.version(VERSION)
						.build(),
				// [문서 근거] 기본값(friction 조건 없음) — "시술 부위를 강하게 문지르지 않도록"
				Protocol.builder()
						.procedure(REJURAN).dayStart(1).dayEnd(null)
						.action(ActionType.MAKEUP)
						.decision(DecisionType.POSSIBLE)
						.guidance("가벼운 화장이 가능합니다. 시술 부위를 강하게 문지르지 마세요.")
						.version(VERSION)
						.build(),
				Protocol.builder()
						.procedure(REJURAN).dayStart(1).dayEnd(null)
						.action(ActionType.MAKEUP)
						.conditions("{\"friction\":\"GENTLE\"}")
						.decision(DecisionType.POSSIBLE)
						.guidance("가벼운 터치의 화장은 가능합니다. 시술 부위는 두드리듯 부드럽게 발라주세요.")
						.version(VERSION)
						.build(),
				// [백엔드 판단] 마찰이 있는 화장(파운데이션 브러시/스펀지 등)은 문지름 자체를 줄이라는
				// 취지에 맞춰 ADJUST. 완전 금지할 정도는 아니고 도구/압력만 조절하면 되는 수준으로 판단.
				Protocol.builder()
						.procedure(REJURAN).dayStart(1).dayEnd(null)
						.action(ActionType.MAKEUP)
						.conditions("{\"friction\":\"FRICTION\"}")
						.decision(DecisionType.ADJUST)
						.guidance("문지르는 힘이 강한 화장(파운데이션 브러시/스펀지 등)은 최소화하고, 시술 부위는 가볍게 두드리듯 발라주세요.")
						.version(VERSION)
						.build(),

				// ===== 세안 (CLEANSING) =====
				// [문서 근거] "가벼운 세안과 화장은 다음날부터 가능" → 당일은 보류로 정정
				// (이전 seed의 ADJUST는 팀 검토에서 지적된 오류, POSTPONE으로 수정)
				Protocol.builder()
						.procedure(REJURAN).dayStart(0).dayEnd(0)
						.action(ActionType.CLEANSING)
						.decision(DecisionType.POSTPONE)
						.guidance("시술 당일 세안은 피하고 다음날부터 미온수로 가볍게 시작하세요.")
						.version(VERSION)
						.build(),
				// [문서 근거] 기본값(method 조건 없음)
				Protocol.builder()
						.procedure(REJURAN).dayStart(1).dayEnd(null)
						.action(ActionType.CLEANSING)
						.decision(DecisionType.POSSIBLE)
						.guidance("가벼운 세안이 가능합니다. 시술 부위를 강하게 문지르지 마세요.")
						.version(VERSION)
						.build(),
				Protocol.builder()
						.procedure(REJURAN).dayStart(1).dayEnd(null)
						.action(ActionType.CLEANSING)
						.conditions("{\"method\":\"GENTLE\"}")
						.decision(DecisionType.POSSIBLE)
						.guidance("손으로 부드럽게 세안하는 정도는 가능합니다.")
						.version(VERSION)
						.build(),
				// [백엔드 판단] 문지르는 세안(클렌징 브러시 등)은 강도 조절 권고 — MAKEUP.friction과 동일 논리.
				Protocol.builder()
						.procedure(REJURAN).dayStart(1).dayEnd(null)
						.action(ActionType.CLEANSING)
						.conditions("{\"method\":\"FRICTION\"}")
						.decision(DecisionType.ADJUST)
						.guidance("클렌징 브러시 등 문지르는 세안 도구 사용은 자제하고 손으로 부드럽게 세안하세요.")
						.version(VERSION)
						.build(),
				// [문서 근거] 각질 제거(스크럽) 성격이라 SKINCARE.SCRUB과 동일하게 "최소 1주일 피하도록" 적용
				Protocol.builder()
						.procedure(REJURAN).dayStart(1).dayEnd(7)
						.action(ActionType.CLEANSING)
						.conditions("{\"method\":\"EXFOLIATING\"}")
						.decision(DecisionType.POSTPONE)
						.guidance("각질 제거(스크럽) 세안은 최소 1주일 피해주세요.")
						.version(VERSION)
						.build(),

				// ===== 스킨케어 (SKINCARE) =====
				// [문서 근거] 기본값(product_type 조건 없음) — "수분 크림과 재생 크림을 충분히"
				Protocol.builder()
						.procedure(REJURAN).dayStart(0).dayEnd(null)
						.action(ActionType.SKINCARE)
						.decision(DecisionType.POSSIBLE)
						.guidance("수분 크림과 재생 크림을 충분히 사용하고, 외출 시 SPF 30 이상 자외선 차단제를 꼼꼼히 발라주세요.")
						.version(VERSION)
						.build(),
				// [문서 근거] "보습·재생: ... 충분히 사용하도록"
				Protocol.builder()
						.procedure(REJURAN).dayStart(0).dayEnd(null)
						.action(ActionType.SKINCARE)
						.conditions("{\"product_type\":\"MOISTURIZING\"}")
						.decision(DecisionType.POSSIBLE)
						.guidance("수분 크림과 재생 크림은 충분히 사용해주세요.")
						.version(VERSION)
						.build(),
				// [문서 근거] "외출 시 SPF 30 이상의 자외선 차단제를 꼼꼼히"
				Protocol.builder()
						.procedure(REJURAN).dayStart(0).dayEnd(null)
						.action(ActionType.SKINCARE)
						.conditions("{\"product_type\":\"SUNSCREEN\"}")
						.decision(DecisionType.POSSIBLE)
						.guidance("외출 시 SPF 30 이상 자외선 차단제를 꼼꼼히 발라주세요.")
						.version(VERSION)
						.build(),
				// [문서 근거] 필드명 productType → product_type 정정, 값은 기존 유지("스크럽 제품... 최소 1주일")
				Protocol.builder()
						.procedure(REJURAN).dayStart(1).dayEnd(7)
						.action(ActionType.SKINCARE)
						.conditions("{\"product_type\":\"SCRUB\"}")
						.decision(DecisionType.POSTPONE)
						.guidance("스크럽 제품 사용은 최소 1주일 피해주세요.")
						.version(VERSION)
						.build(),
				// [백엔드 판단] AHA/BHA 화학적 각질제거도 스크럽과 같은 각질제거 계열로 보고 동일 규칙 적용
				// (시술 후 화학적 필링 계열 자극 성분을 1~2주 피하라는 건 일반적인 시술 후 스킨케어 상식).
				Protocol.builder()
						.procedure(REJURAN).dayStart(1).dayEnd(7)
						.action(ActionType.SKINCARE)
						.conditions("{\"product_type\":\"AHA_BHA\"}")
						.decision(DecisionType.POSTPONE)
						.guidance("AHA/BHA 등 각질 제거 성분은 최소 1주일 피해주세요.")
						.version(VERSION)
						.build(),
				// [백엔드 판단] 레티노이드는 자극·광과민성이 있는 활성 성분이라 스크럽과 동일하게 1주일 보류
				// (시술 후 레티노이드 중단 권고는 일반적인 시술 후 스킨케어 상식).
				Protocol.builder()
						.procedure(REJURAN).dayStart(1).dayEnd(7)
						.action(ActionType.SKINCARE)
						.conditions("{\"product_type\":\"RETINOID\"}")
						.decision(DecisionType.POSTPONE)
						.guidance("레티노이드 성분은 자극이 있을 수 있어 최소 1주일 피해주세요.")
						.version(VERSION)
						.build(),
				// [백엔드 판단] 기타 활성 성분은 니아신아마이드처럼 순한 것부터 고농도 비타민C처럼 자극적인 것까지
				// 다양해서 일괄 POSSIBLE/POSTPONE 대신 ADJUST(소량 시험 사용)로 보수적으로 처리.
				Protocol.builder()
						.procedure(REJURAN).dayStart(0).dayEnd(7)
						.action(ActionType.SKINCARE)
						.conditions("{\"product_type\":\"OTHER_ACTIVE\"}")
						.decision(DecisionType.ADJUST)
						.guidance("활성 성분이 포함된 제품은 소량만 시험 사용하고, 자극이 느껴지면 바로 중단하세요.")
						.version(VERSION)
						.build(),

				// ===== 열 자극 (HEAT) =====
				// [문서 근거] "사우나, 찜질방 등 열을 발생시키는 활동... 최소 1주일 피하도록"
				// — 사우나(SAUNA_STEAM)/찜질방·반신욕(HOT_BATH_SHOWER) 구분 없이 동일 규칙이라 조건 없이 적용.
				// [백엔드 판단] 2026-08-20: dayStart를 1→0으로 확장 — 시술 당일(elapsedDay=0)에 규칙이
				// 아예 없어서 HEAT 질문이 무조건 NO_PROTOCOL로 새는 문제 발견. "최소 1주일 피하도록"이라는
				// 문서 근거가 시술 당일을 배제할 이유가 없어 같은 문구·같은 행을 day 0까지 그대로 확장.
				Protocol.builder()
						.procedure(REJURAN).dayStart(0).dayEnd(7)
						.action(ActionType.HEAT)
						.decision(DecisionType.POSTPONE)
						.guidance("사우나, 찜질방 등 열을 발생시키는 활동은 최소 1주일 피해주세요.")
						.version(VERSION)
						.build(),
				// DAY8 이후는 팀 협의 결과 TBD(=결론 없음) → 규칙을 두지 않아 NO_PROTOCOL로 응답한다.
				// (이전 seed엔 무조건 POSSIBLE로 있었으나, FE·BE 공통 연동 기준 문서에서 TBD로 확인되어 제거)

				// ===== 운동 (EXERCISE) =====
				// [백엔드 판단] 2026-08-20: 시술 당일(elapsedDay=0)용 규칙이 없어서 intensity 값과 무관하게
				// 항상 NO_PROTOCOL로 새는 문제 발견(FE QA 보고). MAKEUP/CLEANSING과 동일하게 "당일은 강도
				// 구분 없이 보류, 다음날부터 강도별 판단" 패턴으로 통일 — 시술 직후 운동을 권할 근거가 없고,
				// 시술 부위 안정이 우선이라는 게 일반적인 시술 후 상식이라 무조건 POSTPONE으로 판단.
				Protocol.builder()
						.procedure(REJURAN).dayStart(0).dayEnd(0)
						.action(ActionType.EXERCISE)
						.decision(DecisionType.POSTPONE)
						.guidance("시술 당일은 강도와 관계없이 운동을 피하고 몸을 안정시켜 주세요. 다음날부터 강도에 따라 가능합니다.")
						.version(VERSION)
						.build(),
				// [문서 근거] 이평강님이 Figma에서 확인: 고강도 = 오늘 미루기(POSTPONE)
				Protocol.builder()
						.procedure(REJURAN).dayStart(1).dayEnd(7)
						.action(ActionType.EXERCISE)
						.conditions("{\"intensity\":\"INTENSE_ACTIVITY\"}")
						.decision(DecisionType.POSTPONE)
						.guidance("고강도 운동은 최소 1주일 피해주세요.")
						.nextAction("{\"type\":\"VIEW_ALTERNATIVE\",\"label\":\"저강도 대안 보기\"}")
						.version(VERSION)
						.build(),
				// [백엔드 판단] LIGHT_ACTIVITY와 INTENSE_ACTIVITY 사이 중간 단계. 땀이 나는 활동은
				// 시술 부위 위생·자극 관리가 필요하다는 게 일반적인 시술 후 상식이라 ADJUST로 판단.
				Protocol.builder()
						.procedure(REJURAN).dayStart(1).dayEnd(7)
						.action(ActionType.EXERCISE)
						.conditions("{\"intensity\":\"SWEAT_ACTIVITY\"}")
						.decision(DecisionType.ADJUST)
						.guidance("땀이 나는 정도의 운동은 강도를 조절하고, 땀이 많이 나면 시술 부위를 바로 씻어주세요.")
						.version(VERSION)
						.build(),
				// [문서 근거] 기존 LIGHT 안내 유지, 값만 LIGHT → LIGHT_ACTIVITY로 정정
				Protocol.builder()
						.procedure(REJURAN).dayStart(1).dayEnd(7)
						.action(ActionType.EXERCISE)
						.conditions("{\"intensity\":\"LIGHT_ACTIVITY\"}")
						.decision(DecisionType.POSSIBLE)
						.guidance("가벼운 강도의 운동은 가능합니다. 땀이 많이 나면 시술 부위를 바로 씻어주세요.")
						.version(VERSION)
						.build()
				// DAY8 이후는 HEAT와 동일하게 TBD → 규칙 없음(NO_PROTOCOL).
				// (이전 seed엔 무조건 POSSIBLE로 있었으나 제거)
		);
	}
}
