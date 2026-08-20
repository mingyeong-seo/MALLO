import { HTTPError } from 'ky';

import type { SessionWire } from '../../api/contracts';
import { mapSession } from '../../api/session-mapper';
import type { RecoverySession } from './types';

export type SessionHydrationDependencies = {
  readonly clearSessionId: () => Promise<void>;
  readonly fail: () => void;
  readonly finish: () => void;
  readonly getTodaySession: (sessionId: string) => Promise<SessionWire>;
  readonly readSessionId: () => Promise<string | null>;
  readonly setSession: (session: RecoverySession) => void;
};

export async function runSessionHydration(
  dependencies: SessionHydrationDependencies,
): Promise<void> {
  try {
    const sessionId = await dependencies.readSessionId();
    if (sessionId === null) {
      return;
    }

    const session = mapSession(await dependencies.getTodaySession(sessionId));
    dependencies.setSession(session);
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error;
    }

    if (
      error instanceof HTTPError &&
      [401, 404].includes(error.response.status)
    ) {
      await clearSessionIdBestEffort(dependencies.clearSessionId);
    } else {
      dependencies.fail();
    }
  } finally {
    dependencies.finish();
  }
}

async function clearSessionIdBestEffort(
  clearSessionId: () => Promise<void>,
): Promise<void> {
  try {
    await clearSessionId();
  } catch (error) {
    if (!(error instanceof Error)) {
      return;
    }
  }
}
