package com.mallo.backend.domain.record.service;

import java.util.Map;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

/**
 * 고정 fixture를 반환하는 Mock 구현체. 실제 이미지 분석 없이 항상 같은 결과를 돌려준다.
 */
@Component
public class MockPhotoObservationAdapter implements PhotoObservationAdapter {

	@Override
	public Map<String, Object> observe(MultipartFile photo) {
		return Map.of(
				"redness", "LOW",
				"dryness", "MEDIUM"
		);
	}
}
