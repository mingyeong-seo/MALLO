import { describe, expect, it } from 'vitest';

import {
  InvalidStoredSessionIdError,
  parseStoredSessionId,
} from './session-id';

describe('stored session id', () => {
  it('returns null when no session id is stored', () => {
    // Given
    const stored = null;

    // When
    const result = parseStoredSessionId(stored);

    // Then
    expect(result).toBeNull();
  });

  it('throws an explicit error when the stored value is malformed', () => {
    // Given
    const stored = 'not-a-session-uuid';

    // When
    const parse = () => parseStoredSessionId(stored);

    // Then
    expect(parse).toThrow(InvalidStoredSessionIdError);
  });
});
