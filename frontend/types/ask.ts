import type {
  QuickCheckAction,
  QuickCheckDecision,
} from '@/features/recovery/types';

export type AskStatus =
  | 'MATCHED'
  | 'CLARIFY'
  | 'CONNECT'
  | 'NO_PROTOCOL'
  | 'GENERAL'
  | 'UNSUPPORTED';

export type AskRequestDto = {
  photo_record_ids: number[];
  question: string;
};

export type AskResultDto = {
  action: QuickCheckAction | null;
  context: Record<string, string> | null;
  created_at: string;
  decision: QuickCheckDecision | null;
  guidance: string | null;
  interaction_id: number;
  message: string | null;
  next_action: string | null;
  photo_record_ids: number[];
  protocol_ref: string | null;
  session_id: string;
  status: AskStatus;
};

export type AskResponseDto = {
  data: AskResultDto;
  message: string | null;
  success: boolean;
};

export type AskInput = {
  photoRecordIds: number[];
  question: string;
};

export type AskResult = {
  action: QuickCheckAction | null;
  context: Record<string, string> | null;
  createdAt: string;
  decision: QuickCheckDecision | null;
  guidance: string | null;
  interactionId: number;
  message: string | null;
  nextAction: string | null;
  photoRecordIds: number[];
  protocolRef: string | null;
  sessionId: string;
  status: AskStatus;
};
