const roleLabels = {
  client: 'attendee',
  host: 'host',
  admin: 'admin',
};

export const getAuthErrorMessage = (error, role = 'client', stage = 'credentials') => {
  const rawMessage = typeof error === 'string' ? error : error?.message;
  const message = rawMessage?.trim();
  const lowerMessage = (message || '').toLowerCase();
  const errorCode = typeof error === 'object' && error?.payload?.error
    ? String(error.payload.error).toLowerCase()
    : '';
  const roleLabel = roleLabels[role] || 'account';

  if (!message) {
    return `We could not sign in to this ${roleLabel} account. Please try again.`;
  }

  if (lowerMessage.includes('failed to fetch') || lowerMessage.includes('network')) {
    return 'The server could not be reached. Please check that the backend is running and try again.';
  }

  if (errorCode === 'mfa_delivery_unavailable') {
    return 'We could not send the verification email. Please try again shortly or contact support if the problem continues.';
  }

  if (errorCode === 'mfa_resend_too_soon') {
    const retryAfterSeconds = Number(error?.retryAfterSeconds);
    return Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
      ? `A code was sent recently. You can request another in ${Math.ceil(retryAfterSeconds)} seconds.`
      : 'A code was sent recently. Please wait before requesting another.';
  }

  if (errorCode === 'too_many_authentication_requests' || error?.status === 429) {
    const retryAfterSeconds = Number(error?.retryAfterSeconds);
    return Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
      ? `Too many sign-in attempts. Please try again in ${Math.ceil(retryAfterSeconds)} seconds.`
      : 'Too many sign-in attempts. Please wait and try again.';
  }

  if (
    stage === 'mfa' &&
    (errorCode === 'invalid_credentials' || error?.status === 400 || error?.status === 401)
  ) {
    return 'The verification code is incorrect or expired. Please use the most recent code and try again.';
  }

  if (lowerMessage.includes('incomplete mfa challenge')) {
    return 'We could not start email verification. Please try signing in again.';
  }

  if (lowerMessage.includes('pending')) {
    return role === 'host'
      ? 'Your host account is still waiting for admin approval.'
      : 'This account is still waiting for approval.';
  }

  if (lowerMessage.includes('rejected')) {
    return role === 'host'
      ? 'This host account was rejected by the admin.'
      : 'This account was rejected by the admin.';
  }

  if (lowerMessage.includes('blocked')) {
    return 'This account has been blocked by the admin.';
  }

  if (lowerMessage.includes('verification') || lowerMessage.includes('code') || lowerMessage.includes('challenge')) {
    return 'The verification code is incorrect or expired. Please check the code and try again.';
  }

  if (
    lowerMessage.includes('not found') ||
    lowerMessage.includes('invalid') ||
    lowerMessage.includes('credential') ||
    lowerMessage.includes('password')
  ) {
    return `The ${roleLabel} email or password is incorrect. Please check your details and try again.`;
  }

  return message;
};
