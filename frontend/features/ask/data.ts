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

export type GeneralRecoveryResult = {
  description: string;
  title: string;
};

export function getGeneralRecoveryResult(
  question: string,
): GeneralRecoveryResult {
  const normalized = question.replaceAll(' ', '');

  if (normalized.includes('붉은기') || normalized.includes('홍조')) {
    return {
      title: '붉은기는 회복 과정에서 경과를 함께 확인해요',
      description:
        '정확한 지속 기간은 개인차가 있어 한 시점으로 단정하지 않아요. 현재 Recovery Journey의 DAY와 검수된 Recovery Protocol 범위에서 경과를 확인하고, 상태가 심해지거나 새로운 증상이 생기면 의료진 확인 단계로 연결해요.',
    };
  }

  if (normalized.includes('건조')) {
    return {
      title: '건조함은 현재 회복 단계에 맞춰 관리해요',
      description:
        '회복 중 느끼는 건조함은 현재 DAY와 관리 방법을 함께 확인하는 것이 중요해요. MALLO는 검수된 Recovery Protocol 범위에서 보습과 자극을 줄이는 관리 정보를 안내해요.',
    };
  }

  if (normalized.includes('각질')) {
    return {
      title: '각질 변화는 자극을 줄이며 경과를 확인해요',
      description:
        '현재 회복 단계에서는 임의로 각질을 제거하기보다 Recovery Protocol 범위에서 자극을 줄이는 관리 방법을 확인하도록 안내해요.',
    };
  }

  if (normalized.includes('붓기')) {
    return {
      title: '붓기는 현재 회복 단계와 함께 확인해요',
      description:
        'MALLO는 현재 Recovery Journey의 DAY를 기준으로 검수된 Recovery Protocol 범위의 일반 회복 정보를 안내해요. 개인 피부 상태에 대한 판단이 필요하면 의료진 확인 단계로 연결해요.',
    };
  }

  if (normalized.includes('엠보')) {
    return {
      title: '시술 후 피부 변화는 DAY 기준으로 확인해요',
      description:
        '현재 회복 단계에서 확인할 수 있는 일반적인 관리 정보만 안내해요. 개별 피부 상태를 진단하거나 정상 여부를 판단하지는 않아요.',
    };
  }

  return {
    title: '현재 회복 단계에서 확인할 수 있는 정보를 안내해요',
    description:
      'MALLO는 현재 Recovery Journey의 DAY와 검수된 Recovery Protocol 범위에서 일반 회복 정보를 안내해요. 개인 피부 상태 판단이나 의료적 판단이 필요한 내용은 의료진 확인 단계로 연결해요.',
  };
}
