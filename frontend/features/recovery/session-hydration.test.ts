import { describe, expect, it, vi } from 'vitest';
import ky, { HTTPError } from 'ky';

import { runSessionHydration } from './session-hydration';

describe('session hydration', () => {
  it('finishes hydration when reading stored session id fails', async () => {
    // Given
    const clearSessionId = vi.fn(async () => undefined);
    const fail = vi.fn();
    const finish = vi.fn();
    const setSession = vi.fn();

    // When
    await runSessionHydration({
      clearSessionId,
      fail,
      finish,
      getTodaySession: vi.fn(),
      readSessionId: vi.fn(async () => {
        throw new Error('storage unavailable');
      }),
      setSession,
    });

    // Then
    expect(finish).toHaveBeenCalledOnce();
    expect(fail).toHaveBeenCalledOnce();
    expect(clearSessionId).not.toHaveBeenCalled();
    expect(setSession).not.toHaveBeenCalled();
  });

  it('finishes without leaking a rejection when invalid-session cleanup fails', async () => {
    // Given
    const finish = vi.fn();
    const fail = vi.fn();
    const setSession = vi.fn();
    const unauthorized = await createUnauthorizedError();

    // When
    const hydration = runSessionHydration({
      clearSessionId: vi.fn(async () => {
        throw new Error('secure storage unavailable');
      }),
      fail,
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
    expect(fail).not.toHaveBeenCalled();
    expect(setSession).not.toHaveBeenCalled();
  });

  it('reports retryable HTTP 500 without clearing the stored session id', async () => {
    // Given
    const clearSessionId = vi.fn(async () => undefined);
    const fail = vi.fn();
    const finish = vi.fn();
    const serverError = await createHttpError(500);

    // When
    await runSessionHydration({
      clearSessionId,
      fail,
      finish,
      getTodaySession: vi.fn(async () => {
        throw serverError;
      }),
      readSessionId: vi.fn(async () =>
        'b408c168-d217-49f9-9cd2-c3c487819cc9',
      ),
      setSession: vi.fn(),
    });

    // Then
    expect(fail).toHaveBeenCalledOnce();
    expect(clearSessionId).not.toHaveBeenCalled();
    expect(finish).toHaveBeenCalledOnce();
  });

  it('restores the session when hydration succeeds after a retryable failure', async () => {
    // Given
    const fail = vi.fn();
    const finish = vi.fn();
    const setSession = vi.fn();
    const getTodaySession = vi
      .fn()
      .mockRejectedValueOnce(new Error('network unavailable'))
      .mockResolvedValueOnce(sessionWire());
    const dependencies = {
      clearSessionId: vi.fn(async () => undefined),
      fail,
      finish,
      getTodaySession,
      readSessionId: vi.fn(async () =>
        'b408c168-d217-49f9-9cd2-c3c487819cc9',
      ),
      setSession,
    };

    // When
    await runSessionHydration(dependencies);
    await runSessionHydration(dependencies);

    // Then
    expect(fail).toHaveBeenCalledOnce();
    expect(finish).toHaveBeenCalledTimes(2);
    expect(setSession).toHaveBeenCalledOnce();
  });
});

async function createUnauthorizedError(): Promise<HTTPError> {
  return createHttpError(401);
}

async function createHttpError(status: number): Promise<HTTPError> {
  try {
    await ky.get('https://mallo-api.site/v1/sessions/today', {
      fetch: async () => new Response(null, { status }),
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

function sessionWire() {
  return {
    session_id: 'b408c168-d217-49f9-9cd2-c3c487819cc9',
    procedure: 'REJURAN',
    procedure_at: '2026-08-18',
    clinic_id: 'clinic_001',
    status: 'ACTIVE' as const,
    elapsed_day: 2,
    created_at: '2026-08-20T17:00:00',
  };
}

class ExpectedUnauthorizedError extends Error {
  constructor() {
    super('Expected an unauthorized HTTP error');
    this.name = 'ExpectedUnauthorizedError';
  }
}
