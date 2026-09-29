import * as Keychain from 'react-native-keychain';
import {
  DEFAULT_API_URL,
  onSessionExpired,
  listAll,
  login,
  logout,
  request,
  restoreSession,
} from '../src/api';
const mockFetch = jest.fn();
beforeEach(async () => {
  globalThis.fetch = mockFetch;
  mockFetch.mockReset();
  await logout();
  onSessionExpired(() => {});
});
function response(data: unknown, status = 200) {
  return { ok: status < 400, status, json: async () => data };
}
test('persists token in keychain and authenticates requests', async () => {
  mockFetch.mockResolvedValueOnce(
    response({
      success: true,
      data: {
        token: 'private-token',
        user: { name: 'Owner', email: 'owner@example.com' },
      },
    }),
  );
  await login(' owner@example.com ', 'password123');
  expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
    'session',
    expect.stringContaining('private-token'),
    expect.objectContaining({ service: 'com.chirageyecare.session' }),
  );
  mockFetch.mockResolvedValueOnce(response({ success: true, data: [] }));
  await request('/patients');
  expect(mockFetch.mock.calls[1][1].headers.Authorization).toBe(
    'Bearer private-token',
  );
});
test('success envelopes without data support changing password', async () => {
  mockFetch.mockResolvedValue(
    response({ success: true, message: 'Password changed successfully' }),
  );
  await expect(
    request('/auth/change-password', 'POST', {}),
  ).resolves.toBeUndefined();
});
test('loads every page rather than silently dropping records after the first page', async () => {
  mockFetch
    .mockResolvedValueOnce(
      response({
        success: true,
        data: Array.from({ length: 100 }, (_, i) => i),
      }),
    )
    .mockResolvedValueOnce(response({ success: true, data: [100] }));
  expect(await listAll('/patients?search=Jane')).toHaveLength(101);
  expect(mockFetch.mock.calls[1][0]).toBe(
    `${DEFAULT_API_URL}/patients?search=Jane&limit=100&page=2`,
  );
});
test('expires authenticated sessions and exposes backend field errors', async () => {
  const expired = jest.fn();
  onSessionExpired(expired);
  (Keychain.getGenericPassword as jest.Mock).mockResolvedValueOnce({
    password: JSON.stringify({
      token: 'expired',
      user: { name: 'Owner' },
      baseUrl: DEFAULT_API_URL,
    }),
  });
  await restoreSession();
  mockFetch.mockResolvedValue(
    response({ success: false, message: 'Token expired' }, 401),
  );
  await expect(request('/patients')).rejects.toThrow('Token expired');
  expect(expired).toHaveBeenCalled();
  mockFetch.mockResolvedValue(
    response(
      {
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'age', message: 'Too high' }],
      },
      400,
    ),
  );
  await expect(request('/patients', 'POST', {})).rejects.toThrow(
    'age: Too high',
  );
});
test('discards sessions saved for a different backend', async () => {
  (Keychain.getGenericPassword as jest.Mock).mockResolvedValueOnce({
    password: JSON.stringify({
      token: 'old-token',
      user: { name: 'Owner' },
      baseUrl: 'http://localhost:4000/api/v1',
    }),
  });
  expect(await restoreSession()).toBeNull();
  mockFetch.mockResolvedValueOnce(response({ success: true, data: [] }));
  await request('/patients');
  expect(mockFetch.mock.calls[0][0]).toBe(`${DEFAULT_API_URL}/patients`);
  expect(mockFetch.mock.calls[0][1].headers.Authorization).toBeUndefined();
});
