import type { RecoverySession } from './types';

export const MOCK_RECOVERY_SESSION: RecoverySession = {
  elapsedDay: 1,
  phase: '초기 집중 관리',
  procedureDate: '2026.08.15',
  procedureName: 'REJURAN',
  sessionId: 'mock-session-rejuran-20260815',
};

export function formatElapsedDay(elapsedDay: number) {
  return `DAY ${Math.max(elapsedDay, 0) + 1}`;
}

export function getElapsedDayDescription(elapsedDay: number) {
  return elapsedDay <= 0 ? '시술 당일' : `시술 후 ${elapsedDay}일차`;
}
