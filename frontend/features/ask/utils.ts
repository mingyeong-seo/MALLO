import type { MockQuestionIntent } from './types';

export function classifyMockQuestion(question: string): MockQuestionIntent {
  const normalizedQuestion = question.replaceAll(' ', '');

  if (normalizedQuestion.includes('운동')) {
    return 'exercise-follow-up';
  }

  if (normalizedQuestion.includes('세안')) {
    return 'wash-result';
  }

  if (normalizedQuestion.includes('스킨케어')) {
    return 'skincare-result';
  }

  return 'unclassified';
}

export function formatRecoveryDay(day: number) {
  return day <= 0 ? '시술 당일' : `DAY ${day}`;
}
