export type QuickCheckAction =
  | 'EXERCISE'
  | 'MAKEUP'
  | 'CLEANSING'
  | 'SKINCARE'
  | 'HEAT';

export type QuickCheckDecision = 'POSSIBLE' | 'ADJUST' | 'POSTPONE' | 'CONNECT';

export type QuickCheckContext = Record<string, string>;

export type QuickCheckResult = {
  action: QuickCheckAction;
  checkId: string;
  context: QuickCheckContext;
  contextLabel: string;
  createdAt: string;
  decision: QuickCheckDecision;
  elapsedDay: number;
  headline: string;
  nextAction: {
    label: string;
    type: string;
  } | null;
  protocolRefs: string[];
  protocolVersion: string | null;
  reason: string;
};

export type RecoverySession = {
  elapsedDay: number;
  phase: string;
  procedureDate: string;
  procedureName: string;
  sessionId: string;
};

export type RecoveryRecordStatus = 'DONE' | 'ADJUSTED' | 'SKIPPED';

export type RecoveryRecordPerformedStatus = 'DONE' | 'NOT_DONE';

export type RecoveryRecordAction = {
  checkId: string;
  performedStatus: RecoveryRecordPerformedStatus;
};

export type RecoveryRecord = {
  actions: RecoveryRecordAction[];
  attachments: string[];
  elapsedDay: number;
  id: string;
  memo: string;

  /**
   * 기존 Mock 구조와의 호환을 위해 남겨둔 필드입니다.
   * 신규 S09/S10에서는 actions를 사용합니다.
   */
  quickCheckId?: string;
  status?: RecoveryRecordStatus;

  updatedAt: string;
};
