import type {
  RecoveryRecord,
  RecoveryRecordAction,
} from '@/features/recovery/types';
import type {
  CreateRecoveryRecordRequestDto,
  RecoveryRecordDto,
  RecoveryRecordListResponseDto,
  RecoveryRecordResponseDto,
  TodayRecoveryRecordResponseDto,
  UpdateRecoveryRecordRequestDto,
} from '@/types/record';
import { isPhotoRecordDto } from '@/types/photo';

import { ApiError, apiRequest } from './api';
import { mapPhotoRecordDto } from './photo';

export type CreateRecordInput = {
  actions: RecoveryRecordAction[];
  elapsedDay: number;
  memo?: string;
  photoRecordIds?: number[];
};

export type UpdateRecordInput = {
  actions?: RecoveryRecordAction[];
  memo?: string;
  photoRecordIds?: number[];
};

export async function createRecord(
  sessionId: string,
  input: CreateRecordInput,
) {
  const body: CreateRecoveryRecordRequestDto = {
    elapsed_day: input.elapsedDay,
    actions: input.actions.map(mapRecordActionToDto),
    ...(input.memo !== undefined ? { memo: input.memo } : {}),
    ...(input.photoRecordIds !== undefined
      ? { photo_record_ids: input.photoRecordIds }
      : {}),
  };
  const response = await apiRequest<RecoveryRecordResponseDto>(
    `/v1/sessions/${encodeURIComponent(sessionId)}/records`,
    {
      method: 'POST',
      headers: {
        'X-Session-Id': sessionId,
      },
      body: JSON.stringify(body),
    },
    [200],
  );

  return mapRecordResponse(response);
}

export async function getTodayRecord(sessionId: string) {
  const response = await apiRequest<TodayRecoveryRecordResponseDto>(
    `/v1/sessions/${encodeURIComponent(sessionId)}/records/today`,
    {
      headers: {
        'X-Session-Id': sessionId,
      },
    },
    [200],
  );

  if (!response.success) {
    throw new ApiError(
      'INVALID_RESPONSE',
      '오늘 회복 기록 응답 형식이 올바르지 않습니다.',
    );
  }

  return response.data === null ? null : mapRecordDto(response.data);
}

export async function getRecords(sessionId: string) {
  const response = await apiRequest<RecoveryRecordListResponseDto>(
    `/v1/sessions/${encodeURIComponent(sessionId)}/records`,
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
      '회복 기록 목록 응답 형식이 올바르지 않습니다.',
    );
  }

  return response.data.map(mapRecordDto);
}

export async function updateRecord(
  sessionId: string,
  recordId: number,
  input: UpdateRecordInput,
) {
  const body: UpdateRecoveryRecordRequestDto = {
    ...(input.actions !== undefined
      ? { actions: input.actions.map(mapRecordActionToDto) }
      : {}),
    ...(input.memo !== undefined ? { memo: input.memo } : {}),
    ...(input.photoRecordIds !== undefined
      ? { photo_record_ids: input.photoRecordIds }
      : {}),
  };
  const response = await apiRequest<RecoveryRecordResponseDto>(
    `/v1/sessions/${encodeURIComponent(sessionId)}/records/${encodeURIComponent(String(recordId))}`,
    {
      method: 'PATCH',
      headers: {
        'X-Session-Id': sessionId,
      },
      body: JSON.stringify(body),
    },
    [200],
  );

  return mapRecordResponse(response);
}

function mapRecordResponse(response: RecoveryRecordResponseDto) {
  if (!response.success) {
    throw new ApiError(
      'INVALID_RESPONSE',
      '회복 기록 응답 형식이 올바르지 않습니다.',
    );
  }

  return mapRecordDto(response.data);
}

function mapRecordActionToDto(action: RecoveryRecordAction) {
  return {
    check_id: action.checkId,
    performed_status: action.performedStatus,
  };
}

function mapRecordDto(value: unknown): RecoveryRecord {
  if (!isRecordDto(value)) {
    throw new ApiError(
      'INVALID_RESPONSE',
      '회복 기록 응답 형식이 올바르지 않습니다.',
    );
  }

  return {
    actions: value.actions.map((action) => ({
      checkId: action.check_id,
      performedStatus: action.performed_status,
    })),
    attachments: value.photos.map((photo) => {
      const mappedPhoto = mapPhotoRecordDto(photo);

      return {
        clientId: `server-photo-${mappedPhoto.photoId}`,
        createdAt: mappedPhoto.createdAt,
        observation: mappedPhoto.observation,
        photoId: mappedPhoto.photoId,
        photoUrl: mappedPhoto.photoUrl,
        uploadStatus: 'uploaded' as const,
      };
    }),
    createdAt: value.created_at,
    elapsedDay: value.elapsed_day,
    memo: value.memo ?? '',
    recordId: value.record_id,
    sessionId: value.session_id,
  };
}

function isRecordDto(value: unknown): value is RecoveryRecordDto {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const dto = value as Partial<RecoveryRecordDto>;

  return (
    typeof dto.record_id === 'number' &&
    typeof dto.session_id === 'string' &&
    typeof dto.elapsed_day === 'number' &&
    Array.isArray(dto.actions) &&
    dto.actions.every(isRecordActionDto) &&
    (dto.memo === null || typeof dto.memo === 'string') &&
    Array.isArray(dto.photos) &&
    dto.photos.every(isPhotoRecordDto) &&
    typeof dto.created_at === 'string'
  );
}

function isRecordActionDto(value: unknown) {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const action = value as RecoveryRecordDto['actions'][number];

  return (
    typeof action.check_id === 'string' &&
    (action.performed_status === 'DONE' ||
      action.performed_status === 'NOT_DONE' ||
      action.performed_status === 'ADJUSTED_DONE')
  );
}
