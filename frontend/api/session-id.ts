import { z } from 'zod';

const sessionIdSchema = z.string().uuid();

export function parseStoredSessionId(stored: string | null): string | null {
  if (stored === null) {
    return null;
  }

  const parsed = sessionIdSchema.safeParse(stored);
  if (!parsed.success) {
    throw new InvalidStoredSessionIdError();
  }
  return parsed.data;
}

export function parseSessionId(sessionId: string): string {
  return sessionIdSchema.parse(sessionId);
}

export class InvalidStoredSessionIdError extends Error {
  constructor() {
    super('Stored session id is malformed');
    this.name = 'InvalidStoredSessionIdError';
  }
}
