import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { z } from 'zod';

const SESSION_STORAGE_KEY = 'mallo_session_id';
const sessionIdSchema = z.string().uuid();

export async function readSessionId(): Promise<string | null> {
  const stored =
    Platform.OS === 'web'
      ? globalThis.localStorage?.getItem(SESSION_STORAGE_KEY) ?? null
      : await SecureStore.getItemAsync(SESSION_STORAGE_KEY);

  const parsed = sessionIdSchema.safeParse(stored);
  return parsed.success ? parsed.data : null;
}

export async function saveSessionId(sessionId: string): Promise<void> {
  const validSessionId = sessionIdSchema.parse(sessionId);

  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(SESSION_STORAGE_KEY, validSessionId);
    return;
  }

  await SecureStore.setItemAsync(SESSION_STORAGE_KEY, validSessionId);
}

export async function clearSessionId(): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
}
