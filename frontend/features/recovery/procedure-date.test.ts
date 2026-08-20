import { describe, expect, it } from 'vitest';

import { getDemoProcedureDate } from './procedure-date';

describe('demo procedure date', () => {
  it('returns local calendar day minus two across a year boundary', () => {
    // Given
    const localNow = new Date(2026, 0, 1, 0, 30);

    // When
    const result = getDemoProcedureDate(localNow);

    // Then
    expect(result).toBe('2025-12-30');
  });
});
