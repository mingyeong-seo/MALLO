import { describe, expect, it, vi } from 'vitest';
import ky, { HTTPError } from 'ky';

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

  it('finishes without leaking a rejection when invalid-session cleanup fails', async () => {
    // Given
    const finish = vi.fn();
    const setSession = vi.fn();
    const unauthorized = await createUnauthorizedError();

    // When
    const hydration = runSessionHydration({
      clearSessionId: vi.fn(async () => {
        throw new Error('secure storage unavailable');
      }),
      finish,
      getTodaySession: vi.fn(async () => {
        throw unauthorized;
      }),
      readSessionId: vi.fn(async () =>
        'b408c168-d217-49f9-9cd2-c3c487819cc9',
      ),
      setSession,
    });

    // Then
    await expect(hydration).resolves.toBeUndefined();
    expect(finish).toHaveBeenCalledOnce();
    expect(setSession).not.toHaveBeenCalled();
  });
});

async function createUnauthorizedError(): Promise<HTTPError> {
  try {
    await ky.get('https://mallo-api.site/v1/sessions/today', {
      fetch: async () => new Response(null, { status: 401 }),
      retry: 0,
    });
  } catch (error) {
    if (error instanceof HTTPError) {
      return error;
    }
    throw error;
  }

  throw new ExpectedUnauthorizedError();
}

class ExpectedUnauthorizedError extends Error {
  constructor() {
    super('Expected an unauthorized HTTP error');
    this.name = 'ExpectedUnauthorizedError';
  }
}
