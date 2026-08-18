package com.mallo.backend.domain.record.service;

import java.util.Map;

import org.springframework.web.multipart.MultipartFile;

/**
 * 사진 분석 어댑터. MVP는 Mock/fixture로 시작하고, 실제 이미지 분석 모델이 붙으면
 * 이 인터페이스의 구현체만 교체하면 된다 (docx 11번 "Mock → 실제 AI 교체 지점" 참고).
 *
 * 반환값은 redness/dryness 같은 비의료적 관찰 필드만 담아야 한다.
 * normal/side_effect/diagnosis/need_treatment/risk_score 같은 의료 판단 필드는 절대 넣지 않는다 (MVP 문서 10번 규칙).
 */
public interface PhotoObservationAdapter {

	Map<String, Object> observe(MultipartFile photo);
}
