import { vi } from 'vitest';
import { API_BASE_URL, apiGet, apiPost, ApiError } from './api';
import { getAuthToken, saveAuthSession } from './authSession';

const jsonResponse = (status, payload, headers = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: new Headers(headers),
  text: vi.fn().mockResolvedValue(payload === null ? '' : JSON.stringify(payload)),
});

describe('API client', () => {
  beforeEach(() => {
    localStorage.clear();
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('adds the bearer token and serializes JSON request bodies', async () => {
    saveAuthSession(
      {
        accessToken: 'signed-token',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        principal: { id: 7, type: 'USER' },
      },
      'user'
    );
    fetch.mockResolvedValue(jsonResponse(201, { id: 42 }));

    await expect(apiPost('/api/bookings', { eventId: 12 })).resolves.toEqual({ id: 42 });

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/api/bookings`);
    expect(options.method).toBe('POST');
    expect(options.headers.get('Authorization')).toBe('Bearer signed-token');
    expect(options.headers.get('Content-Type')).toBe('application/json');
    expect(options.body).toBe(JSON.stringify({ eventId: 12 }));
  });

  it('clears an invalid session and publishes the affected role on HTTP 401', async () => {
    saveAuthSession(
      {
        accessToken: 'expired-token',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        principal: { id: 4, type: 'HOST' },
      },
      'host'
    );
    const unauthorizedListener = vi.fn();
    window.addEventListener('auth:unauthorized', unauthorizedListener);
    fetch.mockResolvedValue(jsonResponse(401, { error: 'authentication_required' }));

    await expect(apiGet('/api/host/dashboard')).rejects.toEqual(expect.objectContaining({
      name: 'ApiError',
      status: 401,
      message: 'Your session has expired. Please sign in again.',
    }));

    expect(getAuthToken()).toBeNull();
    expect(unauthorizedListener).toHaveBeenCalledTimes(1);
    expect(unauthorizedListener.mock.calls[0][0].detail).toEqual({ role: 'host' });
    window.removeEventListener('auth:unauthorized', unauthorizedListener);
  });

  it('wraps network failures in a stable user-facing ApiError', async () => {
    fetch.mockRejectedValue(new TypeError('offline'));

    await expect(apiGet('/api/events', { auth: false })).rejects.toEqual(expect.objectContaining({
      name: 'ApiError',
      status: 0,
      message: 'The service could not be reached. Please check your connection and try again.',
    }));
    await expect(apiGet('/api/events', { auth: false })).rejects.toBeInstanceOf(ApiError);
  });

  it('preserves the server retry delay on an MFA cooldown response', async () => {
    fetch.mockResolvedValue(jsonResponse(
      429,
      { error: 'mfa_resend_too_soon' },
      { 'Retry-After': '37' }
    ));

    await expect(apiPost('/api/login', {}, { auth: false })).rejects.toEqual(
      expect.objectContaining({
        status: 429,
        retryAfterSeconds: 37,
        payload: { error: 'mfa_resend_too_soon' },
      })
    );
  });
});
