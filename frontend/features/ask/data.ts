import type { FollowUpOption, RecoveryContext } from './types';

export const MOCK_RECOVERY_CONTEXT: RecoveryContext = {
  procedureName: 'REJURAN',
  recoveryDay: 1,
};

export const EXAMPLE_QUESTIONS = [
  '오늘 운동해도 될까?',
  '세안해도 될까?',
  '스킨케어는 어떻게 해야 할까?',
] as const;

export const EXERCISE_OPTIONS: FollowUpOption[] = [
  {
    label: '가벼운 활동',
    description: '산책, 스트레칭',
    condition: '가벼운 활동',
    decision: 'POSSIBLE',
  },
  {
    label: '중간 강도',
    description: '조깅, 헬스',
    condition: '중간 강도',
    decision: 'ADJUST',
  },
  {
    label: '고강도 운동',
    condition: '고강도 운동',
    decision: 'POSTPONE',
  },
];
