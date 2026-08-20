import type {
  QuickCheckAction,
  QuickCheckContext,
  QuickCheckDecision,
} from '@/features/recovery/types';

export type CheckStatus = 'MATCHED' | 'NO_PROTOCOL';

export type CreateCheckInput = {
  action: QuickCheckAction;
  context: QuickCheckContext;
};

export type CheckNextActionDto = {
  label: string;
  type: string;
};

export type CheckDto = {
  action: QuickCheckAction;
  check_id: string;
  context: Record<string, string>;
  created_at: string;
  decision: QuickCheckDecision | null;
  elapsed_day: number;
  guidance: string | null;
  next_action: CheckNextActionDto | null;
  protocol_ref: string | null;
  session_id: string;
  status: CheckStatus;
};

export type CheckResponseDto = {
  data: CheckDto;
  message: string;
  success: boolean;
};

export type CheckListResponseDto = {
  data: CheckDto[];
  message: string;
  success: boolean;
};
