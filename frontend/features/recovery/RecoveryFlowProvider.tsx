import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';

import { getTodaySession } from '@/api/client';
import {
  clearSessionId,
  readSessionId,
  saveSessionId,
} from '@/api/session-storage';
import { runSessionHydration } from './session-hydration';
import type {
  QuickCheckResult,
  RecoveryRecord,
  RecoverySession,
} from './types';

type RecoveryFlowState = {
  isHydratingSession: boolean;
  quickChecks: QuickCheckResult[];
  recoveryRecords: RecoveryRecord[];
  recoverySession: RecoverySession | null;
};

type RecoveryFlowAction =
  | { type: 'SAVE_QUICK_CHECK'; payload: QuickCheckResult }
  | { type: 'UPSERT_RECOVERY_RECORD'; payload: RecoveryRecord }
  | { type: 'SET_RECOVERY_SESSION'; payload: RecoverySession | null }
  | { type: 'FINISH_SESSION_HYDRATION' };

type RecoveryFlowContextValue = RecoveryFlowState & {
  findQuickCheck: (checkId: string) => QuickCheckResult | undefined;
  findRecoveryRecord: (elapsedDay: number) => RecoveryRecord | undefined;
  activateRecoverySession: (session: RecoverySession) => Promise<void>;
  clearRecoverySession: () => Promise<void>;
  saveQuickCheck: (result: QuickCheckResult) => void;
  upsertRecoveryRecord: (record: RecoveryRecord) => void;
};

const initialState: RecoveryFlowState = {
  isHydratingSession: true,
  quickChecks: [],
  recoveryRecords: [],
  recoverySession: null,
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

    case 'FINISH_SESSION_HYDRATION':
      return {
        ...state,
        isHydratingSession: false,
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

  useEffect(() => {
    let isActive = true;

    void runSessionHydration({
      clearSessionId,
      finish: () => {
        if (isActive) {
          dispatch({ type: 'FINISH_SESSION_HYDRATION' });
        }
      },
      getTodaySession,
      readSessionId,
      setSession: (session) => {
        if (isActive) {
          dispatch({ type: 'SET_RECOVERY_SESSION', payload: session });
        }
      },
    });

    return () => {
      isActive = false;
    };
  }, []);

  const activateRecoverySession = useCallback(
    async (session: RecoverySession) => {
      await saveSessionId(session.sessionId);
      dispatch({ type: 'SET_RECOVERY_SESSION', payload: session });
    },
    [],
  );

  const clearRecoverySession = useCallback(async () => {
    await clearSessionId();
    dispatch({ type: 'SET_RECOVERY_SESSION', payload: null });
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
      activateRecoverySession,
      clearRecoverySession,
      findQuickCheck,
      findRecoveryRecord,
      saveQuickCheck,
      upsertRecoveryRecord,
    }),
    [
      activateRecoverySession,
      clearRecoverySession,
      findQuickCheck,
      findRecoveryRecord,
      saveQuickCheck,
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
