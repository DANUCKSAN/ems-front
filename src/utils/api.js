import { clearAuthSession, getActiveRole, getAuthToken } from './authSession';

const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
export const API_BASE_URL = configuredBaseUrl.replace(/\/+$/, '');

const apiUrl = (path) => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

const readPayload = async (response) => {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
};

const errorMessage = (payload, response) => {
  if (typeof payload === 'string' && payload.trim()) {
    return payload.trim();
  }
  if (payload?.message) {
    return payload.message;
  }
  if (payload?.detail) {
    return payload.detail;
  }
  if (payload?.error === 'authentication_required') {
    return 'Your session has expired. Please sign in again.';
  }
  if (payload?.error === 'access_denied') {
    return 'You do not have permission to perform this action.';
  }
  if (payload?.error) {
    return String(payload.error).replaceAll('_', ' ');
  }
  return `Request failed (${response.status})`;
};

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export const apiRequest = async (path, options = {}) => {
  const { auth = true, body, headers: customHeaders = {}, ...fetchOptions } = options;
  const headers = new Headers(customHeaders);
  const token = getAuthToken();

  if (auth && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let requestBody = body;
  if (body !== undefined && body !== null && !(body instanceof FormData) && typeof body !== 'string') {
    headers.set('Content-Type', 'application/json');
    requestBody = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(apiUrl(path), {
      ...fetchOptions,
      headers,
      body: requestBody,
    });
  } catch (error) {
    throw new ApiError('The service could not be reached. Please check your connection and try again.', 0, null);
  }

  const payload = await readPayload(response);
  if (!response.ok) {
    if (response.status === 401 && auth) {
      const role = getActiveRole();
      clearAuthSession();
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { role } }));
    }
    throw new ApiError(errorMessage(payload, response), response.status, payload);
  }

  return payload;
};

export const apiGet = (path, options) => apiRequest(path, { ...options, method: 'GET' });
export const apiPost = (path, body, options) => apiRequest(path, { ...options, method: 'POST', body });
export const apiPut = (path, body, options) => apiRequest(path, { ...options, method: 'PUT', body });
export const apiPatch = (path, body, options) => apiRequest(path, { ...options, method: 'PATCH', body });
export const apiDelete = (path, options) => apiRequest(path, { ...options, method: 'DELETE' });
