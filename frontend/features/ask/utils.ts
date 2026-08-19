import type { MockQuestionIntent } from './types';
import type { QuickCheckAction } from '@/features/recovery/types';

export type ExplicitMockContext = {
  action: QuickCheckAction;
  value: string;
};

export function classifyMockQuestion(question: string): MockQuestionIntent {
  const normalizedQuestion = question.replaceAll(' ', '');

  if (
    normalizedQuestion.includes('부작용') ||
    normalizedQuestion.includes('진물') ||
    normalizedQuestion.includes('물집') ||
    normalizedQuestion.includes('심한통증')
  ) {
    return 'medical-connect';
  }

  if (normalizedQuestion.includes('오류테스트')) {
    return 'mock-error';
  }

  if (normalizedQuestion.includes('운동')) {
    return 'exercise-follow-up';
  }

  if (normalizedQuestion.includes('세안')) {
    return 'wash-follow-up';
  }

  if (normalizedQuestion.includes('스킨케어')) {
    return 'skincare-follow-up';
  }

  if (normalizedQuestion.includes('화장')) {
    return 'makeup-follow-up';
  }

  if (
    normalizedQuestion.includes('사우나') ||
    normalizedQuestion.includes('찜질') ||
    normalizedQuestion.includes('뜨거운목욕') ||
    normalizedQuestion.includes('열자극')
  ) {
    return 'heat-follow-up';
  }

  if (
    normalizedQuestion.includes('회복') ||
    normalizedQuestion.includes('관리') ||
    normalizedQuestion.includes('주의') ||
    normalizedQuestion.includes('붉은기') ||
    normalizedQuestion.includes('홍조') ||
    normalizedQuestion.includes('건조') ||
    normalizedQuestion.includes('각질') ||
    normalizedQuestion.includes('붓기') ||
    normalizedQuestion.includes('엠보')
  ) {
    return 'general-result';
  }

  return 'unsupported-question';
}

/** UI/Flow 확인용으로 질문에 조건이 명시된 일부 표현만 해석합니다. */
export function getExplicitMockContext(
  question: string,
): ExplicitMockContext | null {
  const value = question.replaceAll(' ', '');

  if (value.includes('고강도') || value.includes('격렬한운동')) {
    return { action: 'EXERCISE', value: 'INTENSE_ACTIVITY' };
  }
  if (value.includes('부드럽게세안') || value.includes('가볍게세안')) {
    return { action: 'CLEANSING', value: 'GENTLE' };
  }
  if (value.includes('보습제') || value.includes('재생크림')) {
    return { action: 'SKINCARE', value: 'MOISTURIZING' };
  }
  if (value.includes('자외선차단제') || value.includes('선크림')) {
    return { action: 'SKINCARE', value: 'SUNSCREEN' };
  }
  if (value.includes('사우나') || value.includes('찜질방')) {
    return { action: 'HEAT', value: 'SAUNA_STEAM' };
  }

  return null;
}

export function formatRecoveryDay(day: number) {
  return day <= 0 ? '시술 당일' : `DAY ${day}`;
}
