package com.mallo.backend.domain.interaction.service;

import java.util.Locale;
import java.util.Set;

final class AskScopePolicy {

	private static final Set<String> CLEAR_OUT_OF_SCOPE_KEYWORDS =
			Set.of("메뉴", "레시피", "야식", "맛집", "날씨", "기온", "미세먼지", "우산", "비 와", "뉴스", "주식", "주가",
					"환율", "비트코인", "계산", "더하기", "곱하기", "번역", "숙제", "코드", "이야기", "아재개그",
					"노래", "영화", "넷플릭스", "여행", "호텔", "항공권", "카페", "데이트", "축구", "야구",
					"손흥민", "경기 결과", "올림픽", "게임", "로또", "운세", "사주", "mbti", "대통령", "수도", "몇 시",
					"날짜", "역사", "옷 추천", "노트북", "선물", "택배", "배고파", "1+1", "운동화", "화장실",
					"팩트", "물가", "잠실", "밤나무", "멍청", "가격", "최저가", "쇼핑", "학원", "이름 어때",
					"한자 뜻", "단어 뜻", "weather", "menu", "stock", "news", "bitcoin", "translate", "joke",
					"movie", "song", "restaurant", "travel", "hotel", "code", "help", "hello", "system prompt",
					"developer message", "ignore previous", "return action", "return general", "regardless of my question",
					"dinner", "시스템 프롬프트", "개발자 메시지", "분류하지 말고", "天気", "メニュー", "ニュース", "株価");

	private static final Set<String> EXPLICIT_RECOVERY_SCOPE_KEYWORDS =
			Set.of("회복", "시술", "리쥬란", "운동", "헬스", "러닝", "산책", "조깅", "요가", "필라테스",
					"스트레칭", "웨이트", "유산소", "세안", "클렌징", "화장", "메이크업", "스킨케어", "선크림",
					"레티놀", "보습", "사우나", "찜질방", "목욕", "반신욕", "마스크팩", "붓기", "멍", "통증",
					"열감", "음주", "exercise", "workout", "cleansing", "makeup", "skincare", "sauna", "recovery");

	private static final Set<String> SUPPORTED_SHORT_INPUTS =
			Set.of("운동", "헬스", "러닝", "산책", "조깅", "요가", "세안", "화장", "팩", "물", "잠", "술", "멍",
					"회복", "붓기", "통증", "열감", "목욕", "보습", "고강도", "가볍게", "웨이트", "물세안",
					"클렌징", "선크림", "반신욕", "run", "gym");

	private static final Set<String> RECOVERY_CONTEXT_KEYWORDS = Set.of("회복", "시술 후", "리쥬란 후", "리쥬란 하고");
	private static final Set<String> FOOD_KEYWORDS = Set.of("메뉴", "음식", "식사", "먹을", "먹어");
	private static final Set<String> SCOPE_REJECTION_KEYWORDS =
			Set.of("말고", "아니고", "아니야", "무관", "상관없이", "됐고", "그만하고", "관계가 없", "하지 말아");

	private AskScopePolicy() {
	}

	static boolean isClearlyUnsupported(String question) {
		String normalizedQuestion = question.strip().toLowerCase(Locale.ROOT);
		if (isExplicitRecoveryFoodQuestion(normalizedQuestion)) {
			return false;
		}
		int recoveryScopeIndex = lastIndexOfAny(normalizedQuestion, EXPLICIT_RECOVERY_SCOPE_KEYWORDS);
		int outOfScopeIndex = lastIndexOfAny(normalizedQuestion, CLEAR_OUT_OF_SCOPE_KEYWORDS);
		if (outOfScopeIndex >= recoveryScopeIndex && outOfScopeIndex >= 0) {
			return true;
		}
		if (recoveryScopeIndex >= 0) {
			return false;
		}
		String compact = normalizedQuestion.replaceAll("[^\\p{L}\\p{N}]", "").replaceAll("[ㅋㅎㅠㅜ]", "");
		int characterCount = compact.codePointCount(0, compact.length());
		return characterCount <= 3 && !SUPPORTED_SHORT_INPUTS.contains(compact);
	}

	private static int lastIndexOfAny(String question, Set<String> keywords) {
		return keywords.stream().mapToInt(question::lastIndexOf).max().orElse(-1);
	}

	private static boolean isExplicitRecoveryFoodQuestion(String question) {
		return lastIndexOfAny(question, RECOVERY_CONTEXT_KEYWORDS) >= 0
				&& lastIndexOfAny(question, FOOD_KEYWORDS) >= 0
				&& lastIndexOfAny(question, SCOPE_REJECTION_KEYWORDS) < 0;
	}
}
