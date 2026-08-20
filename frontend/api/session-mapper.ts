import type { SessionWire } from './contracts';
import type { RecoverySession } from '../features/recovery/types';

export function mapSession(response: SessionWire): RecoverySession {
  return {
    elapsedDay: response.elapsed_day,
    phase: response.status === 'ACTIVE' ? '초기 집중 관리' : '회복 완료',
    procedureDate: response.procedure_at.replaceAll('-', '.'),
    procedureName: response.procedure,
    sessionId: response.session_id,
  };
}
