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

import { isApiError } from '@/services/api';
import { getTodaySession } from '@/services/session';
import { getSessionId, removeSessionId } from '@/services/session-storage';

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
  | { type: 'SET_QUICK_CHECKS'; payload: QuickCheckResult[] }
  | { type: 'SET_RECOVERY_RECORDS'; payload: RecoveryRecord[] }
  | { type: 'UPSERT_RECOVERY_RECORD'; payload: RecoveryRecord }
  | { type: 'SET_RECOVERY_SESSION'; payload: RecoverySession | null }
  | { type: 'START_SESSION_HYDRATION' }
  | { type: 'FAIL_SESSION_HYDRATION' }
  | { type: 'FINISH_SESSION_HYDRATION' };

type RecoveryFlowContextValue = RecoveryFlowState & {
  findQuickCheck: (checkId: string) => QuickCheckResult | undefined;
  findRecoveryRecord: (elapsedDay: number) => RecoveryRecord | undefined;
  retrySessionHydration: () => void;
  saveQuickCheck: (result: QuickCheckResult) => void;
  setQuickChecks: (results: QuickCheckResult[]) => void;
  setRecoveryRecords: (records: RecoveryRecord[]) => void;
  setRecoverySession: (session: RecoverySession | null) => void;
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

    case 'SET_QUICK_CHECKS':
      return {
        ...state,
        quickChecks: action.payload,
      };

    case 'SET_RECOVERY_RECORDS':
      return {
        ...state,
        recoveryRecords: action.payload,
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
      if (
        state.recoverySession?.sessionId !== action.payload?.sessionId
      ) {
        return {
          hasSessionHydrationError: false,
          isHydratingSession: false,
          quickChecks: [],
          recoveryRecords: [],
          recoverySession: action.payload,
        };
      }

      return {
        ...state,
        hasSessionHydrationError: false,
        isHydratingSession: false,
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

  const retrySessionHydration = useCallback(() => {
    const runId = hydrationRunRef.current + 1;
    hydrationRunRef.current = runId;
    dispatch({ type: 'START_SESSION_HYDRATION' });

    const hydrateSession = async () => {
      try {
        const storedSessionId = await getSessionId();

        if (hydrationRunRef.current !== runId) return;

        if (!storedSessionId) {
          dispatch({ type: 'SET_RECOVERY_SESSION', payload: null });
          return;
        }

        const session = await getTodaySession(storedSessionId);

        if (hydrationRunRef.current !== runId) return;

        if (session.status === 'COMPLETED') {
          await removeSessionId();

          if (hydrationRunRef.current !== runId) return;

          dispatch({ type: 'SET_RECOVERY_SESSION', payload: null });
          return;
        }

        dispatch({ type: 'SET_RECOVERY_SESSION', payload: session });
      } catch (error) {
        if (hydrationRunRef.current !== runId) return;

        if (isApiError(error) && error.status === 401) {
          try {
            await removeSessionId();
          } catch {
            if (hydrationRunRef.current === runId) {
              dispatch({ type: 'FAIL_SESSION_HYDRATION' });
            }
            return;
          }

          if (hydrationRunRef.current !== runId) return;

          dispatch({ type: 'SET_RECOVERY_SESSION', payload: null });
          return;
        }

        dispatch({ type: 'FAIL_SESSION_HYDRATION' });
      } finally {
        if (hydrationRunRef.current === runId) {
          dispatch({ type: 'FINISH_SESSION_HYDRATION' });
        }
      }
    };

    void hydrateSession();
  }, []);

  useEffect(() => {
    retrySessionHydration();

    return () => {
      hydrationRunRef.current += 1;
    };
  }, [retrySessionHydration]);

  const saveQuickCheck = useCallback((result: QuickCheckResult) => {
    dispatch({ type: 'SAVE_QUICK_CHECK', payload: result });
  }, []);

  const setQuickChecks = useCallback((results: QuickCheckResult[]) => {
    dispatch({ type: 'SET_QUICK_CHECKS', payload: results });
  }, []);

  const setRecoveryRecords = useCallback((records: RecoveryRecord[]) => {
    dispatch({ type: 'SET_RECOVERY_RECORDS', payload: records });
  }, []);

  const upsertRecoveryRecord = useCallback((record: RecoveryRecord) => {
    dispatch({ type: 'UPSERT_RECOVERY_RECORD', payload: record });
  }, []);

  const setRecoverySession = useCallback((session: RecoverySession | null) => {
    hydrationRunRef.current += 1;
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
      retrySessionHydration,
      saveQuickCheck,
      setQuickChecks,
      setRecoveryRecords,
      setRecoverySession,
      upsertRecoveryRecord,
    }),
    [
      findQuickCheck,
      findRecoveryRecord,
      retrySessionHydration,
      saveQuickCheck,
      setQuickChecks,
      setRecoveryRecords,
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

