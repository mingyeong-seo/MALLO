import type {
  AskInput,
  AskRequestDto,
  AskResponseDto,
  AskResult,
  AskResultDto,
  AskStatus,
} from '@/types/ask';

import { ApiError, apiRequest } from './api';
import { getSessionId } from './session-storage';

export async function askMallo(
  input: AskInput,
  activeSessionId?: string,
): Promise<AskResult> {
  const sessionId = await requireSessionId(activeSessionId);
  const request: AskRequestDto = {
    question: input.question,
    photo_record_ids: input.photoRecordIds,
  };
  const response = await apiRequest<AskResponseDto>(
    '/v1/ask',
    {
      method: 'POST',
      headers: {
        'X-Session-Id': sessionId,
      },
      body: JSON.stringify(request),
    },
    [200],
  );

  if (!isAskResponseDto(response)) {
    throw new ApiError(
      'INVALID_RESPONSE',
      'ASK MALLO 응답 형식이 올바르지 않습니다.',
    );
  }

  return mapAskResult(response.data);
}

function mapAskResult(dto: AskResultDto): AskResult {
  return {
    action: dto.action,
    context: dto.context,
    createdAt: dto.created_at,
    decision: dto.decision,
    guidance: dto.guidance,
    interactionId: dto.interaction_id,
    message: dto.message,
    nextAction: dto.next_action,
    photoRecordIds: dto.photo_record_ids,
    protocolRef: dto.protocol_ref,
    sessionId: dto.session_id,
    status: dto.status,
  };
}

function isAskResponseDto(value: unknown): value is AskResponseDto {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const response = value as Partial<AskResponseDto>;

  return (
    response.success === true &&
    (response.message === null || typeof response.message === 'string') &&
    isAskResultDto(response.data)
  );
}

function isAskResultDto(value: unknown): value is AskResultDto {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const dto = value as Partial<AskResultDto>;

  if (
    typeof dto.interaction_id !== 'number' ||
    !Number.isFinite(dto.interaction_id) ||
    typeof dto.session_id !== 'string' ||
    !isAskStatus(dto.status) ||
    !(dto.action === null || isQuickCheckAction(dto.action)) ||
    !(
      dto.context === null ||
      (dto.context !== undefined && isStringRecord(dto.context))
    ) ||
    !(dto.decision === null || isQuickCheckDecision(dto.decision)) ||
    !isNullableString(dto.guidance) ||
    !isNullableString(dto.message) ||
    !isNullableString(dto.next_action) ||
    !isNullableString(dto.protocol_ref) ||
    !Array.isArray(dto.photo_record_ids) ||
    !dto.photo_record_ids.every(
      (photoId) => typeof photoId === 'number' && Number.isFinite(photoId),
    ) ||
    typeof dto.created_at !== 'string'
  ) {
    return false;
  }

  if (dto.status === 'MATCHED') {
    return (
      dto.action !== null &&
      dto.context !== null &&
      dto.decision !== null &&
      typeof dto.guidance === 'string' &&
      typeof dto.protocol_ref === 'string'
    );
  }

  if (
    dto.status === 'CLARIFY' ||
    dto.status === 'CONNECT' ||
    dto.status === 'GENERAL' ||
    dto.status === 'UNSUPPORTED'
  ) {
    return typeof dto.message === 'string' && dto.message.length > 0;
  }

  return true;
}

function isAskStatus(value: unknown): value is AskStatus {
  return (
    value === 'MATCHED' ||
    value === 'CLARIFY' ||
    value === 'CONNECT' ||
    value === 'NO_PROTOCOL' ||
    value === 'GENERAL' ||
    value === 'UNSUPPORTED'
  );
}

function isQuickCheckAction(value: unknown) {
  return (
    value === 'EXERCISE' ||
    value === 'MAKEUP' ||
    value === 'CLEANSING' ||
    value === 'SKINCARE' ||
    value === 'HEAT'
  );
}

function isQuickCheckDecision(value: unknown) {
  return (
    value === 'POSSIBLE' ||
    value === 'ADJUST' ||
    value === 'POSTPONE' ||
    value === 'CONNECT'
  );
}

function isStringRecord(value: object): value is Record<string, string> {
  return (
    !Array.isArray(value) &&
    Object.values(value).every((item) => typeof item === 'string')
  );
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
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
