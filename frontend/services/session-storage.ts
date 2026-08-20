import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SESSION_ID_STORAGE_KEY = 'mallo.session_id';
const PHOTO_CONSENT_STORAGE_KEY_PREFIX = 'mallo.photo_consent.';
const NOTIFICATION_READ_STORAGE_KEY_PREFIX = 'mallo.notification_read.';

function getPhotoConsentStorageKey(sessionId: string) {
  return `${PHOTO_CONSENT_STORAGE_KEY_PREFIX}${sessionId}`;
}

function getNotificationReadStorageKey(
  sessionId: string,
  notificationId: string,
) {
  return `${NOTIFICATION_READ_STORAGE_KEY_PREFIX}${sessionId}.${notificationId}`;
}

export async function getSessionId() {
  if (Platform.OS === 'web') {
    return typeof window === 'undefined'
      ? null
      : window.localStorage.getItem(SESSION_ID_STORAGE_KEY);
  }

  return SecureStore.getItemAsync(SESSION_ID_STORAGE_KEY);
}

export async function setSessionId(sessionId: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SESSION_ID_STORAGE_KEY, sessionId);
    }
    return;
  }

  await SecureStore.setItemAsync(SESSION_ID_STORAGE_KEY, sessionId);
}

export async function removeSessionId() {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(SESSION_ID_STORAGE_KEY);
    }
    return;
  }

  await SecureStore.deleteItemAsync(SESSION_ID_STORAGE_KEY);
}

export async function getPhotoConsent(sessionId: string) {
  const storageKey = getPhotoConsentStorageKey(sessionId);

  if (Platform.OS === 'web') {
    return (
      typeof window !== 'undefined' &&
      window.localStorage.getItem(storageKey) === 'true'
    );
  }

  return (await SecureStore.getItemAsync(storageKey)) === 'true';
}

export async function setPhotoConsent(sessionId: string) {
  const storageKey = getPhotoConsentStorageKey(sessionId);

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, 'true');
    }
    return;
  }

  await SecureStore.setItemAsync(storageKey, 'true');
}

export async function getNotificationRead(
  sessionId: string,
  notificationId: string,
) {
  const storageKey = getNotificationReadStorageKey(sessionId, notificationId);

  if (Platform.OS === 'web') {
    return (
      typeof window !== 'undefined' &&
      window.localStorage.getItem(storageKey) === 'true'
    );
  }

  return (await SecureStore.getItemAsync(storageKey)) === 'true';
}

export async function setNotificationRead(
  sessionId: string,
  notificationId: string,
) {
  const storageKey = getNotificationReadStorageKey(sessionId, notificationId);

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, 'true');
    }
    return;
  }

  await SecureStore.setItemAsync(storageKey, 'true');
}
