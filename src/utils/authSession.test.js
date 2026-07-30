import {
  AUTH_TOKEN_KEY,
  clearAuthSession,
  getActiveRole,
  getAuthToken,
  getRoleProfile,
  hasActiveLogin,
  hasRole,
  saveAuthSession,
} from './authSession';

describe('authSession', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores one validated role session and exposes its active profile', () => {
    localStorage.setItem('host', JSON.stringify({ id: 99 }));

    const profile = saveAuthSession(
      {
        accessToken: 'signed-token',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        principal: { id: 7, type: 'USER', email: 'attendee@example.com' },
        profile: { firstName: 'Avery' },
      },
      'user'
    );

    expect(profile).toEqual(expect.objectContaining({
      id: 7,
      role: 'user',
      firstName: 'Avery',
    }));
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe('signed-token');
    expect(localStorage.getItem('host')).toBeNull();
    expect(getAuthToken()).toBe('signed-token');
    expect(getActiveRole()).toBe('user');
    expect(getRoleProfile('user')).toEqual(profile);
    expect(hasActiveLogin()).toBe(true);
    expect(hasRole('user')).toBe(true);
    expect(hasRole('host')).toBe(false);
  });

  it('rejects a session issued for a different login role', () => {
    expect(() => saveAuthSession(
      {
        accessToken: 'host-token',
        principal: { id: 3, type: 'HOST' },
      },
      'user'
    )).toThrow('role did not match');

    expect(getAuthToken()).toBeNull();
    expect(getActiveRole()).toBeNull();
  });

  it('clears all authentication state', () => {
    saveAuthSession(
      {
        accessToken: 'admin-token',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        principal: { id: 1, type: 'ADMIN' },
      },
      'admin'
    );
    localStorage.setItem('redirectAfterLogin', '/admin-dashboard');

    clearAuthSession();

    expect(getAuthToken()).toBeNull();
    expect(getActiveRole()).toBeNull();
    expect(localStorage.getItem('loggedIn')).toBeNull();
    expect(localStorage.getItem('redirectAfterLogin')).toBeNull();
    expect(hasActiveLogin()).toBe(false);
  });
});
