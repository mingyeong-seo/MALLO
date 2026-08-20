import { describe, expect, it } from 'vitest';

import { quickCheckResponseSchema } from '../../api/contracts';
import { resolveQuickCheckResponse } from './quick-check-resolution';

const SESSION_ID = 'b408c168-d217-49f9-9cd2-c3c487819cc9';

function quickCheckResponse(status: 'MATCHED' | 'NO_PROTOCOL') {
  const matched = status === 'MATCHED';
  return quickCheckResponseSchema.parse({
    check_id: '96e3c3a9-0c0c-49f6-9fc5-b432bb36ea27',
    session_id: SESSION_ID,
    elapsed_day: 2,
    action: 'EXERCISE',
    context: { intensity: 'LIGHT_ACTIVITY' },
    status,
    decision: matched ? 'POSSIBLE' : null,
    guidance: matched ? '가볍게 진행해도 괜찮아요.' : null,
    next_action: null,
    protocol_ref: matched ? 'REJURAN-D2-EXERCISE-01' : null,
    created_at: '2026-08-20T17:00:00',
  });
}

describe('Quick Check response resolution', () => {
  it('returns no-protocol without inventing a result', () => {
    // Given
    const response = quickCheckResponse('NO_PROTOCOL');

    // When
    const result = resolveQuickCheckResponse(response);

    // Then
    expect(result).toEqual({ kind: 'no-protocol' });
  });

  it('maps a matched API response to the existing result model', () => {
    // Given
    const response = quickCheckResponse('MATCHED');

    // When
    const result = resolveQuickCheckResponse(response);

    // Then
    expect(result.kind).toBe('matched');
  });
});
