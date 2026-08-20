import type { RecoverySessionStatus } from '@/features/recovery/types';

export type CreateSessionInput = {
  clinicId: string;
  procedure: string;
  procedureAt: string;
};

export type SessionDto = {
  clinic_id: string;
  created_at: string;
  elapsed_day: number;
  procedure: string;
  procedure_at: string;
  session_id: string;
  status: RecoverySessionStatus;
};

export type SessionResponseDto = {
  data: SessionDto;
  message: string;
  success: boolean;
};
