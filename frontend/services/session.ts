import { ApiError, apiRequest } from './api';
import type { RecoverySession } from '@/features/recovery/types';
import type {
  CreateSessionInput,
  SessionDto,
  SessionResponseDto,
} from '@/types/session';

export async function createSession(input: CreateSessionInput) {
  const response = await apiRequest<SessionResponseDto>(
    '/v1/sessions',
    {
      method: 'POST',
      body: JSON.stringify({
        clinic_id: input.clinicId,
        procedure: input.procedure,
        procedure_at: input.procedureAt,
      }),
    },
    [201],
  );

  return mapSessionResponse(response);
}

export async function getTodaySession(sessionId: string) {
  const response = await apiRequest<SessionResponseDto>(
    '/v1/sessions/today',
    {
      headers: {
        'X-Session-Id': sessionId,
      },
    },
    [200],
  );

  return mapSessionResponse(response);
}

function mapSessionResponse(response: SessionResponseDto) {
  if (!response.success || !isSessionDto(response.data)) {
    throw new ApiError('INVALID_RESPONSE', '세션 응답 형식이 올바르지 않습니다.');
  }

  return mapSessionDto(response.data);
}

function mapSessionDto(dto: SessionDto): RecoverySession {
  return {
    clinicId: dto.clinic_id,
    createdAt: dto.created_at,
    elapsedDay: dto.elapsed_day,
    procedureDate: dto.procedure_at,
    procedureName: dto.procedure,
    sessionId: dto.session_id,
    status: dto.status,
  };
}

function isSessionDto(value: unknown): value is SessionDto {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const dto = value as Partial<SessionDto>;

  return (
    typeof dto.session_id === 'string' &&
    typeof dto.procedure === 'string' &&
    typeof dto.procedure_at === 'string' &&
    typeof dto.clinic_id === 'string' &&
    typeof dto.elapsed_day === 'number' &&
    typeof dto.created_at === 'string' &&
    (dto.status === 'ACTIVE' || dto.status === 'COMPLETED')
  );
}
