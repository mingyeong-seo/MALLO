import type { PhotoRecordDto } from './photo';

export type RecoveryRecordPerformedStatusDto =
  | 'DONE'
  | 'NOT_DONE'
  | 'ADJUSTED_DONE';

export type RecoveryRecordActionDto = {
  check_id: string;
  performed_status: RecoveryRecordPerformedStatusDto;
};

export type RecoveryRecordDto = {
  actions: RecoveryRecordActionDto[];
  created_at: string;
  elapsed_day: number;
  memo: string | null;
  photos: PhotoRecordDto[];
  record_id: number;
  session_id: string;
};

export type RecoveryRecordResponseDto = {
  data: RecoveryRecordDto;
  message: string | null;
  success: boolean;
};

export type TodayRecoveryRecordResponseDto = {
  data: RecoveryRecordDto | null;
  message: string | null;
  success: boolean;
};

export type RecoveryRecordListResponseDto = {
  data: RecoveryRecordDto[];
  message: string | null;
  success: boolean;
};

export type CreateRecoveryRecordRequestDto = {
  actions: RecoveryRecordActionDto[];
  elapsed_day: number;
  memo?: string;
  photo_record_ids?: number[];
};

export type UpdateRecoveryRecordRequestDto = {
  actions?: RecoveryRecordActionDto[];
  memo?: string;
  photo_record_ids?: number[];
};
