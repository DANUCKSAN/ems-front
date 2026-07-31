import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Login from './login/logIn';
import HostLogin from './hostLogin/hostLogin';
import AdminLogin from './admin-login/AdminLogin';
import { apiPost } from '../../utils/api';
import { saveAuthSession } from '../../utils/authSession';

vi.mock('../../utils/api', () => ({
  apiPost: vi.fn(),
}));

vi.mock('../../utils/authSession', () => ({
  saveAuthSession: vi.fn(),
}));

const firstChallenge = {
  challengeId: 'challenge-1',
  expiresAt: '2026-07-31T03:04:05',
  maskedEmail: 'd***y@delivery.test',
  message: 'A verification code was sent to your email.',
};

const resentChallenge = {
  ...firstChallenge,
  challengeId: 'challenge-2',
  maskedEmail: 'r***d@delivery.test',
};

const session = {
  accessToken: 'signed-access-token',
  expiresAt: '2026-07-31T04:04:05Z',
  principal: { id: 7, type: 'USER' },
};

const cases = [
  {
    name: 'attendee',
    Component: Login,
    loginPath: '/api/login',
    verifyPath: '/api/login/verify-mfa',
    role: 'user',
    emailPlaceholder: 'Email',
    verifyButton: /verify code/i,
  },
  {
    name: 'host',
    Component: HostLogin,
    loginPath: '/api/hosts/login',
    verifyPath: '/api/hosts/login/verify-mfa',
    role: 'host',
    emailPlaceholder: 'Email',
    verifyButton: /verify code/i,
  },
  {
    name: 'admin',
    Component: AdminLogin,
    loginPath: '/api/admin/login',
    verifyPath: '/api/admin/login/verify-mfa',
    role: 'admin',
    emailPlaceholder: 'Admin email',
    verifyButton: /verify and continue/i,
  },
];

describe.each(cases)('$name MFA login', ({
  Component,
  loginPath,
  verifyPath,
  role,
  emailPlaceholder,
  verifyButton,
}) => {
  beforeEach(() => {
    localStorage.clear();
    apiPost.mockReset();
    saveAuthSession.mockReset();

    let loginRequests = 0;
    apiPost.mockImplementation((path) => {
      if (path === verifyPath) {
        return Promise.resolve({
          ...session,
          principal: { ...session.principal, type: role.toUpperCase() },
        });
      }

      loginRequests += 1;
      return Promise.resolve(loginRequests === 1 ? firstChallenge : resentChallenge);
    });
  });

  it('starts, resends, and verifies MFA using the latest challenge', async () => {
    render(
      <MemoryRouter>
        <Component />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(emailPlaceholder), {
      target: { value: 'person@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'correct-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /continue to verification/i }));

    await waitFor(() => expect(apiPost).toHaveBeenCalledWith(
      loginPath,
      { email: 'person@example.com', password: 'correct-password' },
      { auth: false }
    ));
    expect(await screen.findByText(/d\*\*\*y@delivery\.test/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /resend verification code/i }));

    await waitFor(() => expect(apiPost).toHaveBeenCalledTimes(2));
    expect(apiPost).toHaveBeenLastCalledWith(
      loginPath,
      { email: 'person@example.com', password: 'correct-password' },
      { auth: false }
    );
    expect(await screen.findByText(/r\*\*\*d@delivery\.test/)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Enter 6-digit verification code'), {
      target: { value: '12a3-456' },
    });
    fireEvent.click(screen.getByRole('button', { name: verifyButton }));

    await waitFor(() => expect(apiPost).toHaveBeenCalledWith(
      verifyPath,
      { challengeId: 'challenge-2', code: '123456' },
      { auth: false }
    ));
    expect(saveAuthSession).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'signed-access-token' }),
      role
    );
  });

  it('disables code verification while a resend request is pending', async () => {
    render(
      <MemoryRouter>
        <Component />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(emailPlaceholder), {
      target: { value: 'person@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'correct-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /continue to verification/i }));

    const codeInput = await screen.findByPlaceholderText('Enter 6-digit verification code');
    let resolveResend;
    apiPost.mockReturnValueOnce(new Promise((resolve) => {
      resolveResend = resolve;
    }));

    fireEvent.click(screen.getByRole('button', { name: /resend verification code/i }));

    await waitFor(() => {
      expect(codeInput).toBeDisabled();
      expect(screen.getByRole('button', { name: verifyButton })).toBeDisabled();
    });

    resolveResend(resentChallenge);
    await waitFor(() => {
      expect(codeInput).toBeEnabled();
      expect(screen.getByRole('button', { name: verifyButton })).toBeEnabled();
    });
  });
});
