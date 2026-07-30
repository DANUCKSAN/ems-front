export const AUTH_SESSION_DURATION_MS = 60 * 60 * 1000;
export const AUTH_TOKEN_KEY = 'authAccessToken';
const SESSION_EXPIRES_AT_KEY = 'authSessionExpiresAt';
const ROLE_STORAGE_KEYS = {
  user: 'user',
  host: 'host',
  admin: 'admin',
};

const parseStoredProfile = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch (error) {
    return null;
  }
};

export const startAuthSession = (serverExpiresAt) => {
  const parsedExpiry = serverExpiresAt ? new Date(serverExpiresAt).getTime() : NaN;
  const expiresAt = Number.isFinite(parsedExpiry)
    ? parsedExpiry
    : Date.now() + AUTH_SESSION_DURATION_MS;
  localStorage.setItem(SESSION_EXPIRES_AT_KEY, String(expiresAt));
  return expiresAt;
};

export const saveAuthSession = (session, expectedRole) => {
  if (!session?.accessToken || !session?.principal) {
    throw new Error('The server returned an invalid authentication session.');
  }

  const principalRole = String(session.principal.type || expectedRole || '').toLowerCase();
  const role = principalRole === 'user' ? 'user' : principalRole;
  if (!ROLE_STORAGE_KEYS[role] || (expectedRole && role !== expectedRole)) {
    throw new Error('The authenticated account role did not match this login page.');
  }

  Object.values(ROLE_STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  const profile = {
    ...(session.profile || {}),
    ...session.principal,
    role,
  };
  localStorage.setItem(AUTH_TOKEN_KEY, session.accessToken);
  localStorage.setItem(ROLE_STORAGE_KEYS[role], JSON.stringify(profile));
  localStorage.setItem('loggedIn', 'true');
  startAuthSession(session.expiresAt);
  window.dispatchEvent(new Event('storage'));
  return profile;
};

export const getAuthSessionTimeRemaining = () => {
  const expiresAt = Number(localStorage.getItem(SESSION_EXPIRES_AT_KEY));
 
  if (!expiresAt) {
    return null;
  }

  return expiresAt - Date.now();
};

export const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

export const getActiveRole = () =>
  Object.entries(ROLE_STORAGE_KEYS).find(([, key]) => parseStoredProfile(key))?.[0] || null;

export const getRoleProfile = (role) =>
  ROLE_STORAGE_KEYS[role] ? parseStoredProfile(ROLE_STORAGE_KEYS[role]) : null;

export const hasActiveLogin = () =>
  Boolean(getAuthToken() && getActiveRole());

export const hasRole = (role) => {
  const remaining = getAuthSessionTimeRemaining();
  return Boolean(getAuthToken() && getRoleProfile(role) && remaining !== null && remaining > 0);
};

export const clearAuthSession = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('host');
  localStorage.removeItem('admin');
  localStorage.removeItem('loggedIn');
  localStorage.removeItem('redirectAfterLogin');
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(SESSION_EXPIRES_AT_KEY);
};
