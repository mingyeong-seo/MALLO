import { Platform } from 'react-native';

import type {
  PhotoRecord,
  PhotoRecordDto,
  PhotoRecordResponseDto,
} from '@/types/photo';
import { isPhotoRecordDto } from '@/types/photo';

import { ApiError, apiRequest, resolveApiUrl } from './api';

export type PhotoUploadSource = {
  file?: File;
  fileName?: string;
  localUri?: string;
  mimeType?: string;
};

export async function uploadSessionPhoto(
  sessionId: string,
  source: PhotoUploadSource,
) {
  const body = new FormData();
  await appendPhoto(body, source);

  const response = await apiRequest<PhotoRecordResponseDto>(
    `/v1/sessions/${encodeURIComponent(sessionId)}/photos`,
    {
      method: 'POST',
      headers: {
        'X-Session-Id': sessionId,
      },
      body,
    },
    [200],
  );

  if (!response.success || !isPhotoRecordDto(response.data)) {
    throw new ApiError(
      'INVALID_RESPONSE',
      '사진 업로드 응답 형식이 올바르지 않습니다.',
    );
  }

  return mapPhotoRecordDto(response.data);
}

export function mapPhotoRecordDto(value: PhotoRecordDto): PhotoRecord {
  return {
    createdAt: value.created_at,
    observation: {
      dryness: value.observation.dryness,
      redness: value.observation.redness,
    },
    photoId: value.photo_id,
    photoUrl: resolveApiUrl(value.photo_url),
    sessionId: value.session_id,
  };
}

async function appendPhoto(body: FormData, source: PhotoUploadSource) {
  const fileName = source.fileName ?? 'recovery-photo.jpg';

  if (Platform.OS === 'web') {
    if (source.file) {
      body.append('photo', source.file, fileName);
      return;
    }

    if (!source.localUri) {
      throw new ApiError('INVALID_RESPONSE', '업로드할 사진을 찾지 못했어요.');
    }

    try {
      const response = await fetch(source.localUri);
      const blob = await response.blob();
      body.append('photo', blob, fileName);
      return;
    } catch (error) {
      throw new ApiError('NETWORK', '업로드할 사진을 준비하지 못했어요.', {
        cause: error,
      });
    }
  }

  if (!source.localUri) {
    throw new ApiError('INVALID_RESPONSE', '업로드할 사진을 찾지 못했어요.');
  }

  body.append(
    'photo',
    {
      name: fileName,
      type: source.mimeType ?? inferMimeType(fileName),
      uri: source.localUri,
    } as unknown as Blob,
  );
}

function inferMimeType(fileName: string) {
  const normalized = fileName.toLowerCase();

  if (normalized.endsWith('.png')) {
    return 'image/png';
  }

  if (normalized.endsWith('.webp')) {
    return 'image/webp';
  }

  return 'image/jpeg';
}
