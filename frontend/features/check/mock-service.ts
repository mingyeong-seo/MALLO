import { ACTION_LABELS, CONDITION_CONFIGS } from './data';
import type { MockQuickCheckRequest, MockQuickCheckResponse } from './types';
import type {
  QuickCheckDecision,
  QuickCheckResult,
} from '@/features/recovery/types';

type FixtureDecision = Exclude<QuickCheckDecision, 'CONNECT'>;

type MockUiFlowFixture = {
  action: MockQuickCheckRequest['action'];
  contextValue: string;
  decision: FixtureDecision;
  elapsedDayMax?: number;
  elapsedDayMin?: number;
  headline: string;
  reason: string;
};

/**
 * UI/Flow 검증 전용 fixture입니다.
 * 실제 Recovery Protocol Engine이나 의료 Rule 구현이 아닙니다.
 * 아래에 명시되지 않은 조합은 NO_PROTOCOL로 반환합니다.
 */
const MOCK_UI_FLOW_FIXTURES: MockUiFlowFixture[] = [
  {
    action: 'CLEANSING',
    contextValue: 'GENTLE',
    elapsedDayMax: 0,
    decision: 'POSTPONE',
    headline: '오늘은 가벼운 세안을 미루는 게 좋아요.',
    reason: '시술 당일에는 피부에 물과 마찰이 닿는 행동을 미루도록 안내해요.',
  },
  {
    action: 'CLEANSING',
    contextValue: 'GENTLE',
    elapsedDayMin: 1,
    decision: 'POSSIBLE',
    headline: '자극을 줄여 가볍게 세안할 수 있어요.',
    reason:
      '현재 회복 단계에서는 피부를 문지르지 않는 부드러운 세안을 안내해요.',
  },
  {
    action: 'CLEANSING',
    contextValue: 'FRICTION',
    elapsedDayMax: 6,
    decision: 'POSTPONE',
    headline: '강한 마찰을 동반한 세안은 미루는 게 좋아요.',
    reason:
      '회복 기간에는 시술 부위를 강하게 문지르는 행동을 피하도록 안내해요.',
  },
  {
    action: 'CLEANSING',
    contextValue: 'EXFOLIATING',
    elapsedDayMax: 6,
    decision: 'POSTPONE',
    headline: '스크럽은 오늘 미루는 게 좋아요.',
    reason:
      '스크럽과 물리적 각질 제거는 회복 중 자극이 될 수 있어 피하도록 안내해요.',
  },
  {
    action: 'MAKEUP',
    contextValue: 'GENTLE',
    elapsedDayMax: 0,
    decision: 'POSTPONE',
    headline: '오늘은 가벼운 화장을 미루는 게 좋아요.',
    reason: '시술 당일에는 화장과 제거 과정의 자극을 피하도록 안내해요.',
  },
  {
    action: 'MAKEUP',
    contextValue: 'GENTLE',
    elapsedDayMin: 1,
    decision: 'POSSIBLE',
    headline: '자극을 줄여 가볍게 화장할 수 있어요.',
    reason: '현재 회복 단계에서는 피부 마찰을 줄이는 가벼운 방법을 안내해요.',
  },
  {
    action: 'MAKEUP',
    contextValue: 'FRICTION',
    elapsedDayMax: 0,
    decision: 'POSTPONE',
    headline: '마찰이 큰 화장은 오늘 미루는 게 좋아요.',
    reason:
      '시술 당일에는 피부를 반복적으로 문지르는 방법을 피하도록 안내해요.',
  },
  {
    action: 'SKINCARE',
    contextValue: 'MOISTURIZING',
    decision: 'POSSIBLE',
    headline: '보습·재생 제품을 가볍게 사용할 수 있어요.',
    reason:
      '현재 회복 단계에서는 피부가 건조해지지 않도록 보습 관리를 안내해요.',
  },
  {
    action: 'SKINCARE',
    contextValue: 'SUNSCREEN',
    decision: 'POSSIBLE',
    headline: '자외선 차단제를 사용할 수 있어요.',
    reason: '외출할 때는 SPF 30 이상의 자외선 차단 사용을 안내해요.',
  },
  {
    action: 'SKINCARE',
    contextValue: 'SCRUB',
    elapsedDayMax: 6,
    decision: 'POSTPONE',
    headline: '스크럽 제품은 오늘 미루는 게 좋아요.',
    reason: '회복 중에는 물리적 각질 제거로 인한 자극을 피하도록 안내해요.',
  },
  {
    action: 'EXERCISE',
    contextValue: 'INTENSE_ACTIVITY',
    elapsedDayMax: 6,
    decision: 'POSTPONE',
    headline: '격렬한 운동은 오늘 미루는 게 좋아요.',
    reason: '회복 기간에는 격렬한 운동과 과도한 열 발생을 피하도록 안내해요.',
  },
  {
    action: 'HEAT',
    contextValue: 'SAUNA_STEAM',
    elapsedDayMax: 6,
    decision: 'POSTPONE',
    headline: '사우나·찜질방은 오늘 미루는 게 좋아요.',
    reason: '회복 기간에는 사우나와 찜질방의 강한 열 자극을 피하도록 안내해요.',
  },
];

export class MockQuickCheckError extends Error {}

export async function requestMockQuickCheck(
  request: MockQuickCheckRequest,
): Promise<MockQuickCheckResponse> {
  await delay(850);

  if (request.simulateError) {
    throw new MockQuickCheckError('Mock Quick Check request failed');
  }

  const contextValue = Object.values(request.context)[0];
  const fixture = MOCK_UI_FLOW_FIXTURES.find(
    (candidate) =>
      candidate.action === request.action &&
      candidate.contextValue === contextValue &&
      (candidate.elapsedDayMin === undefined ||
        request.elapsedDay >= candidate.elapsedDayMin) &&
      (candidate.elapsedDayMax === undefined ||
        request.elapsedDay <= candidate.elapsedDayMax),
  );

  if (!fixture) {
    return {
      status: 'NO_PROTOCOL',
      result: null,
      decision: null,
      guidance: null,
      nextAction: null,
      protocolRef: null,
    };
  }

  return {
    status: 'MATCHED',
    result: createMockResult(request, fixture),
  };
}

function createMockResult(
  request: MockQuickCheckRequest,
  fixture: MockUiFlowFixture,
): QuickCheckResult {
  const config = CONDITION_CONFIGS[request.action];
  const contextValue = Object.values(request.context)[0];
  const contextLabel =
    config.options.find((option) => option.value === contextValue)?.label ??
    contextValue;

  return {
    action: request.action,
    checkId: `mock-check-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    context: request.context,
    contextLabel,
    createdAt: new Date().toISOString(),
    decision: fixture.decision,
    elapsedDay: request.elapsedDay,
    headline: fixture.headline,
    reason: fixture.reason,
    protocolRefs: [
      `Recovery Protocol · ${ACTION_LABELS[request.action]} 기준`,
      'Recovery Protocol · 현재 회복 단계 기준',
    ],
    protocolVersion: 'mock-v0.1',
    nextAction: getNextAction(fixture.decision),
  };
}

function getNextAction(decision: FixtureDecision) {
  switch (decision) {
    case 'POSSIBLE':
      return { type: 'BACK_TO_PLAN', label: '확인' };
    case 'ADJUST':
      return { type: 'BACK_TO_PLAN', label: '확인' };
    case 'POSTPONE':
      return { type: 'BACK_TO_PLAN', label: '확인' };
  }
}

function delay(duration: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, duration));
}
