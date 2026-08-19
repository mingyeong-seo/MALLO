import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from 'react';

import { MOCK_RECOVERY_SESSION } from './mock-data';
import type {
  QuickCheckResult,
  RecoveryRecord,
  RecoverySession,
} from './types';

type RecoveryFlowState = {
  quickChecks: QuickCheckResult[];
  recoveryRecords: RecoveryRecord[];
  recoverySession: RecoverySession | null;
};

type RecoveryFlowAction =
  | { type: 'SAVE_QUICK_CHECK'; payload: QuickCheckResult }
  | { type: 'UPSERT_RECOVERY_RECORD'; payload: RecoveryRecord }
  | { type: 'SET_RECOVERY_SESSION'; payload: RecoverySession | null };

type RecoveryFlowContextValue = RecoveryFlowState & {
  findQuickCheck: (checkId: string) => QuickCheckResult | undefined;
  findRecoveryRecord: (elapsedDay: number) => RecoveryRecord | undefined;
  saveQuickCheck: (result: QuickCheckResult) => void;
  setRecoverySession: (session: RecoverySession | null) => void;
  upsertRecoveryRecord: (record: RecoveryRecord) => void;
};

const initialState: RecoveryFlowState = {
  quickChecks: [],
  recoveryRecords: [],
  recoverySession: MOCK_RECOVERY_SESSION,
};

const RecoveryFlowContext = createContext<RecoveryFlowContextValue | null>(
  null,
);

function recoveryFlowReducer(
  state: RecoveryFlowState,
  action: RecoveryFlowAction,
): RecoveryFlowState {
  switch (action.type) {
    case 'SAVE_QUICK_CHECK':
      return {
        ...state,
        quickChecks: [
          action.payload,
          ...state.quickChecks.filter(
            (result) => result.checkId !== action.payload.checkId,
          ),
        ],
      };

    case 'UPSERT_RECOVERY_RECORD':
      return {
        ...state,
        recoveryRecords: [
          action.payload,
          ...state.recoveryRecords.filter(
            (record) => record.elapsedDay !== action.payload.elapsedDay,
          ),
        ],
      };

    case 'SET_RECOVERY_SESSION':
      return {
        ...state,
        recoverySession: action.payload,
      };
  }
}

export function RecoveryFlowProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(recoveryFlowReducer, initialState);

  const saveQuickCheck = useCallback((result: QuickCheckResult) => {
    dispatch({ type: 'SAVE_QUICK_CHECK', payload: result });
  }, []);

  const upsertRecoveryRecord = useCallback((record: RecoveryRecord) => {
    dispatch({ type: 'UPSERT_RECOVERY_RECORD', payload: record });
  }, []);

  const setRecoverySession = useCallback((session: RecoverySession | null) => {
    dispatch({ type: 'SET_RECOVERY_SESSION', payload: session });
  }, []);

  const findQuickCheck = useCallback(
    (checkId: string) =>
      state.quickChecks.find((result) => result.checkId === checkId),
    [state.quickChecks],
  );

  const findRecoveryRecord = useCallback(
    (elapsedDay: number) =>
      state.recoveryRecords.find((record) => record.elapsedDay === elapsedDay),
    [state.recoveryRecords],
  );

  const value = useMemo(
    () => ({
      ...state,
      findQuickCheck,
      findRecoveryRecord,
      saveQuickCheck,
      setRecoverySession,
      upsertRecoveryRecord,
    }),
    [
      findQuickCheck,
      findRecoveryRecord,
      saveQuickCheck,
      setRecoverySession,
      state,
      upsertRecoveryRecord,
    ],
  );

  return (
    <RecoveryFlowContext.Provider value={value}>
      {children}
    </RecoveryFlowContext.Provider>
  );
}

export function useRecoveryFlow() {
  const value = useContext(RecoveryFlowContext);

  if (!value) {
    throw new Error('useRecoveryFlow must be used inside RecoveryFlowProvider');
  }

  return value;
}

