import { ACTION_LABELS, CONDITION_CONFIGS } from '@/features/check/data';
import type {
  QuickCheckDecision,
  QuickCheckResult,
} from '@/features/recovery/types';
import type {
  CheckDto,
  CheckListResponseDto,
  CheckResponseDto,
  CreateCheckInput,
} from '@/types/check';

import { ApiError, apiRequest } from './api';
import { getSessionId } from './session-storage';

export type CheckApiResult =
  | { status: 'MATCHED'; result: QuickCheckResult }
  | {
      status: 'NO_PROTOCOL';
      result: null;
      checkId: string;
      decision: null;
      guidance: null;
      nextAction: null;
      protocolRef: null;
    };

const DECISION_HEADLINES: Record<QuickCheckDecision, string> = {
  POSSIBLE: '가볍게 진행할 수 있어요',
  ADJUST: '조절해서 진행해요',
  POSTPONE: '오늘은 미루는 게 좋아요',
  CONNECT: '의료진의 확인이 필요해요',
};

export async function createCheck(
  input: CreateCheckInput,
  activeSessionId?: string,
) {
  if (!isActionContext(input.action, input.context)) {
    throw new ApiError(
      'INVALID_RESPONSE',
      'Quick Check 조건 형식이 올바르지 않습니다.',
    );
  }

  const sessionId = await requireSessionId(activeSessionId);
  const response = await apiRequest<CheckResponseDto>(
    '/v1/checks',
    {
      method: 'POST',
      headers: {
        'X-Session-Id': sessionId,
      },
      body: JSON.stringify({
        action: input.action,
        context: input.context,
      }),
    },
    [201],
  );

  return mapCheckResponse(response);
}

export async function getTodayChecks(activeSessionId?: string) {
  const sessionId = await requireSessionId(activeSessionId);
  const response = await apiRequest<CheckListResponseDto>(
    '/v1/checks/today',
    {
      headers: {
        'X-Session-Id': sessionId,
      },
    },
    [200],
  );

  if (!response.success || !Array.isArray(response.data)) {
    throw new ApiError(
      'INVALID_RESPONSE',
      'Quick Check 목록 응답 형식이 올바르지 않습니다.',
    );
  }

  return response.data.map(mapCheckDto);
}

export async function getCheckById(
  checkId: string,
  activeSessionId?: string,
) {
  const sessionId = await requireSessionId(activeSessionId);
  const response = await apiRequest<CheckResponseDto>(
    `/v1/checks/${encodeURIComponent(checkId)}`,
    {
      headers: {
        'X-Session-Id': sessionId,
      },
    },
    [200],
  );

  return mapCheckResponse(response);
}

function mapCheckResponse(response: CheckResponseDto) {
  if (!response.success) {
    throw new ApiError(
      'INVALID_RESPONSE',
      'Quick Check 응답 형식이 올바르지 않습니다.',
    );
  }

  return mapCheckDto(response.data);
}

function mapCheckDto(value: unknown): CheckApiResult {
  if (!isCheckDto(value)) {
    throw new ApiError(
      'INVALID_RESPONSE',
      'Quick Check 응답 형식이 올바르지 않습니다.',
    );
  }

  if (value.status === 'NO_PROTOCOL') {
    if (
      value.decision !== null ||
      value.guidance !== null ||
      value.next_action !== null ||
      value.protocol_ref !== null
    ) {
      throw new ApiError(
        'INVALID_RESPONSE',
        'NO_PROTOCOL 응답 형식이 올바르지 않습니다.',
      );
    }

    return {
      status: 'NO_PROTOCOL',
      result: null,
      checkId: value.check_id,
      decision: null,
      guidance: null,
      nextAction: null,
      protocolRef: null,
    };
  }

  if (
    !isQuickCheckDecision(value.decision) ||
    typeof value.guidance !== 'string' ||
    typeof value.protocol_ref !== 'string'
  ) {
    throw new ApiError(
      'INVALID_RESPONSE',
      'MATCHED 응답 형식이 올바르지 않습니다.',
    );
  }

  const config = CONDITION_CONFIGS[value.action];
  const contextValue = value.context[config.contextKey];
  const contextLabel =
    config.options.find((option) => option.value === contextValue)?.label ??
    contextValue ?? ACTION_LABELS[value.action];

  return {
    status: 'MATCHED',
    result: {
      action: value.action,
      checkId: value.check_id,
      context: value.context,
      contextLabel,
      createdAt: value.created_at,
      decision: value.decision,
      elapsedDay: value.elapsed_day,
      headline: DECISION_HEADLINES[value.decision],
      nextAction: value.next_action,
      protocolRefs: [value.protocol_ref],
      protocolVersion: '',
      reason: value.guidance,
    },
  };
}

function isCheckDto(value: unknown): value is CheckDto {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const dto = value as Partial<CheckDto>;

  return (
    typeof dto.check_id === 'string' &&
    typeof dto.session_id === 'string' &&
    typeof dto.elapsed_day === 'number' &&
    isQuickCheckAction(dto.action) &&
    isContext(dto.context) &&
    isActionContext(dto.action, dto.context) &&
    (dto.status === 'MATCHED' || dto.status === 'NO_PROTOCOL') &&
    (dto.decision === null || isQuickCheckDecision(dto.decision)) &&
    (dto.guidance === null || typeof dto.guidance === 'string') &&
    (dto.next_action === null || isNextAction(dto.next_action)) &&
    (dto.protocol_ref === null || typeof dto.protocol_ref === 'string') &&
    typeof dto.created_at === 'string'
  );
}

function isQuickCheckAction(
  value: unknown,
): value is CheckDto['action'] {
  return (
    value === 'EXERCISE' ||
    value === 'MAKEUP' ||
    value === 'CLEANSING' ||
    value === 'SKINCARE' ||
    value === 'HEAT'
  );
}

function isQuickCheckDecision(
  value: unknown,
): value is QuickCheckDecision {
  return (
    value === 'POSSIBLE' ||
    value === 'ADJUST' ||
    value === 'POSTPONE' ||
    value === 'CONNECT'
  );
}

function isContext(value: unknown): value is Record<string, string> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((item) => typeof item === 'string')
  );
}

function isActionContext(
  action: CheckDto['action'],
  context: Record<string, string>,
) {
  const config = CONDITION_CONFIGS[action];
  const contextKeys = Object.keys(context);

  return (
    contextKeys.length === 1 &&
    contextKeys[0] === config.contextKey &&
    config.options.some(
      (option) => option.value === context[config.contextKey],
    )
  );
}

function isNextAction(value: unknown) {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof value.type === 'string' &&
    'label' in value &&
    typeof value.label === 'string'
  );
}

async function requireSessionId(activeSessionId?: string) {
  const sessionId = activeSessionId ?? (await getSessionId());

  if (!sessionId) {
    throw new ApiError('HTTP', '활성 Recovery Session이 없습니다.', {
      status: 401,
    });
  }

  return sessionId;
}
