import { describe, expect, it, vi } from 'vitest';

import { runSessionHydration } from './session-hydration';

describe('session hydration', () => {
  it('finishes hydration when reading stored session id fails', async () => {
    // Given
    const finish = vi.fn();
    const setSession = vi.fn();

    // When
    await runSessionHydration({
      clearSessionId: vi.fn(async () => undefined),
      finish,
      getTodaySession: vi.fn(),
      readSessionId: vi.fn(async () => {
        throw new Error('storage unavailable');
      }),
      setSession,
    });

    // Then
    expect(finish).toHaveBeenCalledOnce();
    expect(setSession).not.toHaveBeenCalled();
  });
});
