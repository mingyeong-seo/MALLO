import type {
  AskResponseWire,
  QuickCheckResponseWire,
} from '../../api/contracts';
import { CONDITION_CONFIGS } from '../check/data';
import type {
  QuickCheckDecision,
  QuickCheckResult,
} from '../recovery/types';

const HEADLINES: Readonly<Record<QuickCheckDecision, string>> = {
  POSSIBLE: '오늘은 진행할 수 있어요',
  ADJUST: '조절해서 진행해요',
  POSTPONE: '오늘은 미루는 게 좋아요',
  CONNECT: '의료진의 확인이 필요해요',
};

function contextLabel(
  action: QuickCheckResult['action'],
  context: Readonly<Record<string, string>>,
): string {
  const config = CONDITION_CONFIGS[action];
  const selected = context[config.contextKey];
  return config.options.find((option) => option.value === selected)?.label ?? '';
}

export function mapMatchedAskToQuickCheck(
  response: AskResponseWire,
  elapsedDay: number,
): QuickCheckResult {
  if (
    response.status !== 'MATCHED' ||
    response.action === null ||
    response.context === null ||
    response.decision === null ||
    response.guidance === null ||
    response.protocol_ref === null
  ) {
    throw new InvalidMatchedResponseError(response.status);
  }

  return {
    action: response.action,
    checkId: `ask-${response.interaction_id}`,
    context: response.context,
    contextLabel: contextLabel(response.action, response.context),
    createdAt: response.created_at,
    decision: response.decision,
    elapsedDay,
    headline: HEADLINES[response.decision],
    nextAction: response.next_action,
    protocolRefs: [response.protocol_ref],
    protocolVersion: null,
    reason: response.guidance,
  };
}

export function mapMatchedCheckToQuickCheck(
  response: QuickCheckResponseWire,
): QuickCheckResult {
  if (
    response.status !== 'MATCHED' ||
    response.decision === null ||
    response.guidance === null ||
    response.protocol_ref === null
  ) {
    throw new InvalidMatchedResponseError(response.status);
  }

  return {
    action: response.action,
    checkId: response.check_id,
    context: response.context,
    contextLabel: contextLabel(response.action, response.context),
    createdAt: response.created_at,
    decision: response.decision,
    elapsedDay: response.elapsed_day,
    headline: HEADLINES[response.decision],
    nextAction: response.next_action,
    protocolRefs: [response.protocol_ref],
    protocolVersion: null,
    reason: response.guidance,
  };
}

export class InvalidMatchedResponseError extends Error {
  readonly status: string;

  constructor(status: string) {
    super(`Invalid matched response: ${status}`);
    this.name = 'InvalidMatchedResponseError';
    this.status = status;
  }
}
