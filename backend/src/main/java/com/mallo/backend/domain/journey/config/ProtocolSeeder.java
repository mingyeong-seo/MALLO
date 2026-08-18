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
 */
@Slf4j
@Component
@Profile("!test")
@RequiredArgsConstructor
public class ProtocolSeeder implements ApplicationRunner {

	private static final String REJURAN = "REJURAN";
	private static final String VERSION = "rejuran-v1";

	private final ProtocolRepository protocolRepository;

	@Override
	public void run(ApplicationArguments args) {
		if (protocolRepository.count() > 0) {
			log.info("Protocol 테이블에 이미 데이터가 있어 seed를 건너뜁니다.");
			return;
		}
		protocolRepository.saveAll(seedData());
		log.info("REJURAN Protocol seed {}건 저장 완료", seedData().size());
	}

	private List<Protocol> seedData() {
		return List.of(
				// 화장: 시술 당일은 피하고 다음날부터 가능
				Protocol.builder()
						.procedure(REJURAN).dayStart(0).dayEnd(0)
						.action(ActionType.MAKEUP)
						.decision(DecisionType.POSTPONE)
						.guidance("시술 당일은 화장을 피하고 다음날부터 가볍게 시작하세요.")
						.version(VERSION)
						.build(),
				Protocol.builder()
						.procedure(REJURAN).dayStart(1).dayEnd(null)
						.action(ActionType.MAKEUP)
						.decision(DecisionType.POSSIBLE)
						.guidance("가벼운 화장이 가능합니다. 시술 부위를 강하게 문지르지 마세요.")
						.version(VERSION)
						.build(),

				// 세안: 시술 당일은 미온수로 가볍게, 다음날부터 일반 세안 가능
				Protocol.builder()
						.procedure(REJURAN).dayStart(0).dayEnd(0)
						.action(ActionType.CLEANSING)
						.decision(DecisionType.ADJUST)
						.guidance("미온수로 가볍게 세안하고 시술 부위를 문지르지 마세요.")
						.version(VERSION)
						.build(),
				Protocol.builder()
						.procedure(REJURAN).dayStart(1).dayEnd(null)
						.action(ActionType.CLEANSING)
						.decision(DecisionType.POSSIBLE)
						.guidance("가벼운 세안이 가능합니다. 시술 부위를 강하게 문지르지 마세요.")
						.version(VERSION)
						.build(),

				// 스킨케어: 보습/재생 크림 + 자외선 차단은 항상 권장, 스크럽 제품만 1주일 제외
				Protocol.builder()
						.procedure(REJURAN).dayStart(0).dayEnd(null)
						.action(ActionType.SKINCARE)
						.decision(DecisionType.POSSIBLE)
						.guidance("수분 크림과 재생 크림을 충분히 사용하고, 외출 시 SPF 30 이상 자외선 차단제를 꼼꼼히 발라주세요.")
						.version(VERSION)
						.build(),
				Protocol.builder()
						.procedure(REJURAN).dayStart(1).dayEnd(7)
						.action(ActionType.SKINCARE)
						.conditions("{\"productType\":\"SCRUB\"}")
						.decision(DecisionType.POSTPONE)
						.guidance("스크럽 제품 사용은 최소 1주일 피해주세요.")
						.version(VERSION)
						.build(),

				// 열 자극(사우나/찜질방): DAY1~7 금지, DAY8부터 가능
				Protocol.builder()
						.procedure(REJURAN).dayStart(1).dayEnd(7)
						.action(ActionType.HEAT)
						.decision(DecisionType.POSTPONE)
						.guidance("사우나, 찜질방 등 열을 발생시키는 활동은 최소 1주일 피해주세요.")
						.version(VERSION)
						.build(),
				Protocol.builder()
						.procedure(REJURAN).dayStart(8).dayEnd(null)
						.action(ActionType.HEAT)
						.decision(DecisionType.POSSIBLE)
						.guidance("이제 사우나, 찜질방 등 열 자극 활동을 다시 시작하셔도 됩니다.")
						.version(VERSION)
						.build(),

				// 운동: 강도(High/Light)로 갈리고, DAY8 이후엔 제한 없음
				Protocol.builder()
						.procedure(REJURAN).dayStart(1).dayEnd(7)
						.action(ActionType.EXERCISE)
						.conditions("{\"intensity\":\"HIGH\"}")
						.decision(DecisionType.ADJUST)
						.guidance("격한 운동과 과도한 열 자극을 피하고 가벼운 강도로 진행하세요.")
						.nextAction("{\"type\":\"VIEW_ALTERNATIVE\",\"label\":\"저강도 대안 보기\"}")
						.version(VERSION)
						.build(),
				Protocol.builder()
						.procedure(REJURAN).dayStart(1).dayEnd(7)
						.action(ActionType.EXERCISE)
						.conditions("{\"intensity\":\"LIGHT\"}")
						.decision(DecisionType.POSSIBLE)
						.guidance("가벼운 강도의 운동은 가능합니다. 땀이 많이 나면 시술 부위를 바로 씻어주세요.")
						.version(VERSION)
						.build(),
				Protocol.builder()
						.procedure(REJURAN).dayStart(8).dayEnd(null)
						.action(ActionType.EXERCISE)
						.decision(DecisionType.POSSIBLE)
						.guidance("이제 운동 강도 제한 없이 진행하셔도 됩니다.")
						.version(VERSION)
						.build()
		);
	}
}
