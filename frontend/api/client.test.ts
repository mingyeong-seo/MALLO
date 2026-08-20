import { afterEach, describe, expect, it, vi } from 'vitest';

const VALID_SESSION_ID = 'b408c168-d217-49f9-9cd2-c3c487819cc9';

type CapturedRequest = {
  readonly body: unknown;
  readonly headers: Headers;
  readonly method: string;
  readonly url: string;
};

function sessionEnvelope() {
  return {
    success: true,
    data: {
      session_id: VALID_SESSION_ID,
      procedure: 'REJURAN',
      procedure_at: '2026-08-20',
      clinic_id: 'DERNA',
      status: 'ACTIVE',
      elapsed_day: 0,
      created_at: '2026-08-20T17:00:00',
    },
    message: null,
  };
}

function askEnvelope() {
  return {
    success: true,
    data: {
      interaction_id: 1,
      session_id: VALID_SESSION_ID,
      status: 'CLARIFY',
      action: 'EXERCISE',
      context: null,
      decision: null,
      guidance: null,
      message: '운동 강도를 알려주세요.',
      next_action: null,
      protocol_ref: null,
      photo_record_ids: [],
      created_at: '2026-08-20T17:00:00',
    },
    message: null,
  };
}

function quickCheckEnvelope() {
  return {
    success: true,
    data: {
      check_id: '96e3c3a9-0c0c-49f6-9fc5-b432bb36ea27',
      session_id: VALID_SESSION_ID,
      elapsed_day: 2,
      action: 'EXERCISE',
      context: { intensity: 'INTENSE_ACTIVITY' },
      status: 'MATCHED',
      decision: 'POSTPONE',
      guidance: '오늘은 미뤄주세요.',
      next_action: null,
      protocol_ref: 'REJURAN-D2-EXERCISE-03',
      created_at: '2026-08-20T17:00:00',
    },
    message: null,
  };
}

function mockJsonResponse(
  payload: unknown,
): { requests: CapturedRequest[]; fetchMock: ReturnType<typeof vi.fn> } {
  const requests: CapturedRequest[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const bodyText = await request.clone().text();
    requests.push({
      body: bodyText ? JSON.parse(bodyText) : null,
      headers: request.headers,
      method: request.method,
      url: request.url,
    });

    return new Response(JSON.stringify(payload), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    });
  });

  vi.stubGlobal('fetch', fetchMock);

  return { fetchMock, requests };
}

describe('AI API client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
  });

  it('creates a recovery session against the production Spring API by default', async () => {
    // Given
    const { requests } = mockJsonResponse(sessionEnvelope());
    const { createSession } = await import('./client');

    // When
    await createSession({
      procedure: 'REJURAN',
      procedure_at: '2026-08-20',
      clinic_id: 'DERNA',
    });

    // Then
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      body: {
        procedure: 'REJURAN',
        procedure_at: '2026-08-20',
        clinic_id: 'DERNA',
      },
      method: 'POST',
      url: 'https://mallo-api.site/v1/sessions',
    });
    expect(requests[0].headers.get('authorization')).toBeNull();
  });

  it('uses the production Spring API when the Expo env value is blank', async () => {
    // Given
    process.env.EXPO_PUBLIC_API_BASE_URL = '';
    const { requests } = mockJsonResponse(sessionEnvelope());
    const { createSession } = await import('./client');

    // When
    await createSession({
      procedure: 'REJURAN',
      procedure_at: '2026-08-20',
      clinic_id: 'DERNA',
    });

    // Then
    expect(requests[0].url).toBe('https://mallo-api.site/v1/sessions');
  });

  it('sends ASK questions through Spring with the recovery session header only', async () => {
    // Given
    const { requests } = mockJsonResponse(askEnvelope());
    const { askMallo } = await import('./client');

    // When
    await askMallo(VALID_SESSION_ID, {
      question: '오늘 운동해도 될까요?',
      photo_record_ids: [],
    });

    // Then
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      body: {
        question: '오늘 운동해도 될까요?',
        photo_record_ids: [],
      },
      method: 'POST',
      url: 'https://mallo-api.site/v1/ask',
    });
    expect(requests[0].headers.get('x-session-id')).toBe(VALID_SESSION_ID);
    expect(requests[0].headers.get('authorization')).toBeNull();
  });

  it('sends Quick Check context through Spring with the session header', async () => {
    // Given
    const { requests } = mockJsonResponse(quickCheckEnvelope());
    const { createQuickCheck } = await import('./client');

    // When
    await createQuickCheck(VALID_SESSION_ID, {
      action: 'EXERCISE',
      context: { intensity: 'INTENSE_ACTIVITY' },
    });

    // Then
    expect(requests[0]).toMatchObject({
      body: {
        action: 'EXERCISE',
        context: { intensity: 'INTENSE_ACTIVITY' },
      },
      method: 'POST',
      url: 'https://mallo-api.site/v1/checks',
    });
    expect(requests[0].headers.get('x-session-id')).toBe(VALID_SESSION_ID);
    expect(requests[0].headers.get('authorization')).toBeNull();
  });
});
