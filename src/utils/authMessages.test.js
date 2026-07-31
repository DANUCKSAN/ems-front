import { ApiError } from './api';
import { getAuthErrorMessage } from './authMessages';

describe('authentication messages', () => {
  it('turns an MFA delivery failure into a clear email message', () => {
    const error = new ApiError(
      'mfa delivery unavailable',
      503,
      { error: 'mfa_delivery_unavailable' }
    );

    expect(getAuthErrorMessage(error, 'client')).toMatch(/could not send the verification email/i);
  });

  it('includes the authoritative retry delay for an early resend', () => {
    const error = new ApiError(
      'mfa resend too soon',
      429,
      { error: 'mfa_resend_too_soon' },
      42
    );

    expect(getAuthErrorMessage(error, 'host', 'resend')).toMatch(/another in 42 seconds/i);
  });

  it('does not describe the general authentication limiter as an MFA resend cooldown', () => {
    const error = new ApiError(
      'too many authentication requests',
      429,
      { error: 'too_many_authentication_requests' },
      25
    );

    const message = getAuthErrorMessage(error, 'admin', 'credentials');
    expect(message).toMatch(/too many sign-in attempts/i);
    expect(message).toMatch(/25 seconds/i);
    expect(message).not.toMatch(/code was sent/i);
  });

  it('describes an MFA-stage 401 as a rejected code rather than a bad password', () => {
    const error = new ApiError('invalid credentials', 401, { error: 'invalid_credentials' });

    expect(getAuthErrorMessage(error, 'admin', 'mfa')).toMatch(/code is incorrect or expired/i);
    expect(getAuthErrorMessage(error, 'admin', 'credentials')).toMatch(/email or password is incorrect/i);
  });
});
