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
  protocolVersion: string;
  reason: string;
};

export type RecoverySessionStatus = 'ACTIVE' | 'COMPLETED';

export type RecoverySession = {
  clinicId?: string | null;
  createdAt?: string;
  elapsedDay: number;
  phase?: string;
  procedureDate: string;
  procedureName: string;
  sessionId: string;
  status: RecoverySessionStatus;
};

export type RecoveryRecordPerformedStatus =
  | 'DONE'
  | 'NOT_DONE'
  | 'ADJUSTED_DONE';

export type RecoveryRecordAction = {
  checkId: string;
  performedStatus: RecoveryRecordPerformedStatus;
};

export type PhotoUploadStatus =
  | 'local'
  | 'uploading'
  | 'uploaded'
  | 'error';

export type PhotoAttachment = {
  clientId: string;
  createdAt?: string;
  fileName?: string;
  fileSize?: number;
  height?: number;
  localUri?: string;
  mimeType?: string;
  observation?: {
    dryness: string;
    redness: string;
  };
  photoId?: number;
  photoUrl?: string;
  uploadStatus: PhotoUploadStatus;
  width?: number;
};

export type RecoveryRecord = {
  actions: RecoveryRecordAction[];
  attachments: PhotoAttachment[];
  createdAt: string;
  elapsedDay: number;
  memo: string;
  recordId: number;
  sessionId: string;
};
