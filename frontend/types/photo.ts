export type PhotoObservationDto = {
  dryness: string;
  redness: string;
};

export type PhotoRecordDto = {
  created_at: string;
  observation: PhotoObservationDto;
  photo_id: number;
  photo_url: string;
  session_id: string;
};

export type PhotoRecordResponseDto = {
  data: PhotoRecordDto;
  message: string | null;
  success: boolean;
};

export type PhotoObservation = {
  dryness: string;
  redness: string;
};

export type PhotoRecord = {
  createdAt: string;
  observation: PhotoObservation;
  photoId: number;
  photoUrl: string;
  sessionId: string;
};

export function isPhotoRecordDto(value: unknown): value is PhotoRecordDto {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const dto = value as Partial<PhotoRecordDto>;

  return (
    typeof dto.photo_id === 'number' &&
    typeof dto.session_id === 'string' &&
    typeof dto.photo_url === 'string' &&
    typeof dto.created_at === 'string' &&
    isPhotoObservationDto(dto.observation)
  );
}

function isPhotoObservationDto(
  value: unknown,
): value is PhotoObservationDto {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const observation = value as Partial<PhotoObservationDto>;

  return (
    typeof observation.redness === 'string' &&
    typeof observation.dryness === 'string'
  );
}
