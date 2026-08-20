import { describe, expect, it } from 'vitest';

import {
  askEnvelopeSchema,
  sessionEnvelopeSchema,
} from './contracts';

describe('API wire contracts', () => {
  it('parses a snake_case session envelope when the backend response is valid', () => {
    // Given
    const payload = {
      success: true,
      data: {
        session_id: 'b408c168-d217-49f9-9cd2-c3c487819cc9',
        procedure: 'REJURAN',
        procedure_at: '2026-08-20',
        clinic_id: 'DERNA',
        status: 'ACTIVE',
        elapsed_day: 0,
        created_at: '2026-08-20T17:00:00',
      },
      message: null,
    };

    // When
    const result = sessionEnvelopeSchema.parse(payload);

    // Then
    expect(result.data.session_id).toBe(
      'b408c168-d217-49f9-9cd2-c3c487819cc9',
    );
  });

  it('rejects a camelCase ask envelope when the wire contract is wrong', () => {
    // Given
    const payload = {
      success: true,
      data: {
        interactionId: 1,
        sessionId: 'b408c168-d217-49f9-9cd2-c3c487819cc9',
        status: 'CLARIFY',
        action: 'EXERCISE',
        message: '운동 강도를 알려주세요.',
      },
      message: null,
    };

    // When
    const result = askEnvelopeSchema.safeParse(payload);

    // Then
    expect(result.success).toBe(false);
  });
});
