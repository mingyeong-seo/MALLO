import type { ConditionConfig } from './types';
import type { QuickCheckAction } from '@/features/recovery/types';

export const ACTION_LABELS: Record<QuickCheckAction, string> = {
  EXERCISE: '운동',
  MAKEUP: '화장',
  CLEANSING: '세안',
  SKINCARE: '스킨케어',
  HEAT: '열 자극',
};

export const CONDITION_CONFIGS: Record<QuickCheckAction, ConditionConfig> = {
  EXERCISE: {
    action: 'EXERCISE',
    actionLabel: ACTION_LABELS.EXERCISE,
    contextKey: 'intensity',
    question: '오늘 하려는 운동 강도는 어느 정도인가요?',
    guide: '운동 강도와 땀·열 발생 정도를 기준으로 확인해요.',
    options: [
      {
        label: '가벼운 활동',
        description: '산책, 스트레칭처럼 땀이 나지 않는 수준',
        value: 'LIGHT_ACTIVITY',
      },
      {
        label: '땀이 날 정도의 운동',
        description: '조깅, 헬스처럼 땀이 나고 숨이 차는 수준',
        value: 'SWEAT_ACTIVITY',
      },
      {
        label: '격렬한 운동',
        description: 'HIIT, 고강도 PT처럼 강도가 높은 운동',
        value: 'INTENSE_ACTIVITY',
      },
    ],
  },
  MAKEUP: {
    action: 'MAKEUP',
    actionLabel: ACTION_LABELS.MAKEUP,
    contextKey: 'friction',
    question: '화장하거나 지울 때 자극은 어느 정도인가요?',
    guide: '피부에 가해지는 마찰 정도를 기준으로 확인해요.',
    options: [
      {
        label: '자극이 적은 방식',
        description: '가볍게 바르고 부드럽게 지우는 방식',
        value: 'GENTLE',
      },
      {
        label: '마찰이 큰 방식',
        description: '피부를 반복적으로 문지르는 방식',
        value: 'FRICTION',
      },
      {
        label: '잘 모르겠어요',
        description: '제품이나 제거 방법의 자극 정도를 판단하기 어려움',
        value: 'UNKNOWN',
      },
    ],
  },
  CLEANSING: {
    action: 'CLEANSING',
    actionLabel: ACTION_LABELS.CLEANSING,
    contextKey: 'method',
    question: '어떤 방법으로 세안하려고 하나요?',
    guide: '세안할 때의 마찰과 각질 제거 여부를 확인해요.',
    options: [
      {
        label: '부드러운 세안',
        description: '미온수로 피부를 문지르지 않고 가볍게 세안',
        value: 'GENTLE',
      },
      {
        label: '강한 마찰을 동반한 세안',
        description: '피부를 반복적으로 문지르는 세안',
        value: 'FRICTION',
      },
      {
        label: '스크럽·각질 제거',
        description: '스크럽 제품이나 물리적 각질 제거를 함께 사용',
        value: 'EXFOLIATING',
      },
    ],
  },
  SKINCARE: {
    action: 'SKINCARE',
    actionLabel: ACTION_LABELS.SKINCARE,
    contextKey: 'product_type',
    question: '어떤 스킨케어 제품을 사용하려고 하나요?',
    guide: '제품 종류와 성분을 기준으로 확인해요.',
    options: [
      {
        label: '보습·재생 제품',
        description: '보습제 또는 재생크림',
        value: 'MOISTURIZING',
      },
      {
        label: '자외선 차단제',
        description: 'SPF 30 이상의 자외선 차단제',
        value: 'SUNSCREEN',
      },
      {
        label: '레티놀·레티노이드',
        description: '레티놀 또는 레티노이드 성분 제품',
        value: 'RETINOID',
      },
      {
        label: 'AHA·BHA',
        description: 'AHA 또는 BHA 성분 제품',
        value: 'AHA_BHA',
      },
      {
        label: '스크럽',
        description: '물리적 각질 제거 제품',
        value: 'SCRUB',
      },
      {
        label: '그 외 활성 성분',
        description: '위 항목에 해당하지 않는 활성 성분 제품',
        value: 'OTHER_ACTIVE',
      },
    ],
  },
  HEAT: {
    action: 'HEAT',
    actionLabel: ACTION_LABELS.HEAT,
    contextKey: 'heat_type',
    question: '어떤 열 자극을 확인하려고 하나요?',
    guide: '열 자극의 종류를 기준으로 확인해요.',
    options: [
      {
        label: '사우나·찜질방',
        description: '사우나, 찜질방, 증기룸 이용',
        value: 'SAUNA_STEAM',
      },
      {
        label: '뜨거운 목욕·샤워',
        description: '뜨거운 물에 오래 노출되는 목욕이나 샤워',
        value: 'HOT_BATH_SHOWER',
      },
    ],
  },
};

export function isQuickCheckAction(value: string): value is QuickCheckAction {
  return value in CONDITION_CONFIGS;
}

