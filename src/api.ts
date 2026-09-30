import * as Keychain from 'react-native-keychain';

export const DEFAULT_API_URL = 'https://chirag-eye-care.onrender.com/api/v1';
const service = 'com.chirageyecare.session';
export type Session = {
  token: string;
  user: { name: string; email: string };
  baseUrl: string;
};
let session: Session | null = null;
const baseUrl = DEFAULT_API_URL;
let onExpired = () => {};
export function onSessionExpired(handler: () => void) {
  onExpired = handler;
}
export async function restoreSession() {
  const stored = await Keychain.getGenericPassword({ service });
  if (!stored) return null;
  const value = JSON.parse(stored.password) as Session;
  if (value.baseUrl !== DEFAULT_API_URL) {
    await logout();
    return null;
  }
  session = value;
  return value;
}
export async function logout() {
  session = null;
  await Keychain.resetGenericPassword({ service });
}
export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}
export async function request<T>(
  path: string,
  method = 'GET',
  body?: unknown,
): Promise<T> {
  const requestSession = session;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(requestSession ? { Authorization: `Bearer ${requestSession.token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const payload = await response.json().catch(() => null);
    if (session !== requestSession) {
      throw new ApiError('Account changed. Please retry in the current account.', 409);
    }
    if (!response.ok || payload?.success === false) {
      if (response.status === 401 && session) {
        session = null;
        onExpired();
        await Keychain.resetGenericPassword({ service });
      }
      const details = Array.isArray(payload?.errors)
        ? payload.errors
            .map(
              (e: { field?: string; message: string }) =>
                `${e.field || ''}: ${e.message}`,
            )
            .join('\n')
        : '';
      throw new ApiError(
        [payload?.message || `Request failed (${response.status})`, details]
          .filter(Boolean)
          .join('\n'),
        response.status,
      );
    }
    if (!payload || payload.success !== true)
      throw new Error(
        'The server returned an unexpected response. Please try again later.',
      );
    return payload.data as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError')
      throw new Error('Connection timed out. Please retry.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
export async function login(email: string, password: string) {
  const result = await request<Omit<Session, 'baseUrl'>>(
    '/auth/login',
    'POST',
    { email: email.trim(), password },
  );
  const next = { ...result, baseUrl };
  await Keychain.setGenericPassword('session', JSON.stringify(next), {
    service,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  session = next;
  return next;
}
export async function listAll<T>(path: string): Promise<T[]> {
  const listSession = session;
  const result: T[] = [];
  for (let page = 1; ; page++) {
    const rows = await request<T[]>(
      `${path}${path.includes('?') ? '&' : '?'}limit=100&page=${page}`,
    );
    if (session !== listSession) throw new ApiError('Account changed. Please reload.', 409);
    result.push(...rows);
    if (rows.length < 100) return result;
  }
}
