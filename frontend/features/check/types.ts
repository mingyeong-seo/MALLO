import type {
  QuickCheckAction,
  QuickCheckContext,
  QuickCheckResult,
} from '@/features/recovery/types';

export type ConditionOption = {
  description: string;
  label: string;
  value: string;
};

export type ConditionConfig = {
  action: QuickCheckAction;
  actionLabel: string;
  contextKey: string;
  guide: string;
  options: ConditionOption[];
  question: string;
};

export type MockQuickCheckRequest = {
  action: QuickCheckAction;
  context: QuickCheckContext;
  elapsedDay: number;
  simulateError?: boolean;
};

export type MockQuickCheckResponse =
  | { status: 'MATCHED'; result: QuickCheckResult }
  | {
      status: 'NO_PROTOCOL';
      result: null;
      decision: null;
      guidance: null;
      nextAction: null;
      protocolRef: null;
    };
