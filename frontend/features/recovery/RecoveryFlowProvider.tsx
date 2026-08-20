import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
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
  hasSessionHydrationError: boolean;
  isHydratingSession: boolean;
  quickChecks: QuickCheckResult[];
  recoveryRecords: RecoveryRecord[];
  recoverySession: RecoverySession | null;
};

type RecoveryFlowAction =
  | { type: 'SAVE_QUICK_CHECK'; payload: QuickCheckResult }
  | { type: 'UPSERT_RECOVERY_RECORD'; payload: RecoveryRecord }
  | { type: 'SET_RECOVERY_SESSION'; payload: RecoverySession | null }
  | { type: 'START_SESSION_HYDRATION' }
  | { type: 'FAIL_SESSION_HYDRATION' }
  | { type: 'FINISH_SESSION_HYDRATION' };

type RecoveryFlowContextValue = RecoveryFlowState & {
  findQuickCheck: (checkId: string) => QuickCheckResult | undefined;
  findRecoveryRecord: (elapsedDay: number) => RecoveryRecord | undefined;
  retrySessionHydration: () => void;
  activateRecoverySession: (session: RecoverySession) => Promise<void>;
  clearRecoverySession: () => Promise<void>;
  saveQuickCheck: (result: QuickCheckResult) => void;
  upsertRecoveryRecord: (record: RecoveryRecord) => void;
};

const initialState: RecoveryFlowState = {
  hasSessionHydrationError: false,
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
        hasSessionHydrationError: false,
        recoverySession: action.payload,
      };

    case 'START_SESSION_HYDRATION':
      return {
        ...state,
        hasSessionHydrationError: false,
        isHydratingSession: true,
      };

    case 'FAIL_SESSION_HYDRATION':
      return {
        ...state,
        hasSessionHydrationError: true,
        recoverySession: null,
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
  const hydrationRunRef = useRef(0);

  const saveQuickCheck = useCallback((result: QuickCheckResult) => {
    dispatch({ type: 'SAVE_QUICK_CHECK', payload: result });
  }, []);

  const upsertRecoveryRecord = useCallback((record: RecoveryRecord) => {
    dispatch({ type: 'UPSERT_RECOVERY_RECORD', payload: record });
  }, []);

  const retrySessionHydration = useCallback(() => {
    const runId = hydrationRunRef.current + 1;
    hydrationRunRef.current = runId;
    dispatch({ type: 'START_SESSION_HYDRATION' });
    void runSessionHydration({
      clearSessionId,
      fail: () => {
        if (hydrationRunRef.current === runId) {
          dispatch({ type: 'FAIL_SESSION_HYDRATION' });
        }
      },
      finish: () => {
        if (hydrationRunRef.current === runId) {
          dispatch({ type: 'FINISH_SESSION_HYDRATION' });
        }
      },
      getTodaySession,
      readSessionId,
      setSession: (session) => {
        if (hydrationRunRef.current === runId) {
          dispatch({ type: 'SET_RECOVERY_SESSION', payload: session });
        }
      },
    });
  }, []);

  useEffect(() => {
    retrySessionHydration();

    return () => {
      hydrationRunRef.current += 1;
    };
  }, [retrySessionHydration]);

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
      retrySessionHydration,
      saveQuickCheck,
      upsertRecoveryRecord,
    }),
    [
      activateRecoverySession,
      clearRecoverySession,
      findQuickCheck,
      findRecoveryRecord,
      retrySessionHydration,
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
