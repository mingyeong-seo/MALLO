import ky from 'ky';

import {
  askEnvelopeSchema,
  quickCheckEnvelopeSchema,
  sessionEnvelopeSchema,
  type AskInput,
  type AskResponseWire,
  type CreateSessionInput,
  type QuickCheckInput,
  type QuickCheckResponseWire,
  type SessionWire,
} from './contracts';

const DEFAULT_API_BASE_URL = 'https://mallo-api.site';
const SESSION_HEADER = 'X-Session-Id';

const api = ky.create({
  prefix: process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  retry: 0,
  timeout: 10_000,
  headers: {
    Accept: 'application/json',
  },
});

export async function createSession(
  input: CreateSessionInput,
): Promise<SessionWire> {
  const payload = await api.post('v1/sessions', { json: input }).json();
  return sessionEnvelopeSchema.parse(payload).data;
}

export async function getTodaySession(
  sessionId: string,
): Promise<SessionWire> {
  const payload = await api
    .get('v1/sessions/today', {
      headers: { [SESSION_HEADER]: sessionId },
    })
    .json();
  return sessionEnvelopeSchema.parse(payload).data;
}

export async function askMallo(
  sessionId: string,
  input: AskInput,
): Promise<AskResponseWire> {
  const payload = await api
    .post('v1/ask', {
      headers: { [SESSION_HEADER]: sessionId },
      json: input,
    })
    .json();
  return askEnvelopeSchema.parse(payload).data;
}

export async function createQuickCheck(
  sessionId: string,
  input: QuickCheckInput,
): Promise<QuickCheckResponseWire> {
  const payload = await api
    .post('v1/checks', {
      headers: { [SESSION_HEADER]: sessionId },
      json: input,
    })
    .json();
  return quickCheckEnvelopeSchema.parse(payload).data;
}
