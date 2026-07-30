// Customer sign-in and MFA verification.
import React, { useState } from 'react';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input, message } from 'antd';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Login.css';

import logoImage from '../../../assets/logo.svg';
import { getAuthErrorMessage } from '../../../utils/authMessages';
import { saveAuthSession } from '../../../utils/authSession';
import { apiPost } from '../../../utils/api';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [challenge, setChallenge] = useState(null);
  const [email, setEmail] = useState('');
  const [authError, setAuthError] = useState('');

  // Get redirect path if coming from an event
  const onFinish = async (values) => {
    setLoading(true);
    setAuthError('');
    try {
      const data = await apiPost('/api/login', values, { auth: false });
      setChallenge(data);
      setEmail(values.email);
      message.success(data.message || 'Verification code sent');
    } catch (error) {
      const friendlyMessage = getAuthErrorMessage(error, 'client');
      setAuthError(friendlyMessage);
      message.error(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const verifyMfa = async ({ code }) => {
    setMfaLoading(true);
    setAuthError('');
    try {
      const data = await apiPost(
        '/api/login/verify-mfa',
        {
          challengeId: challenge?.challengeId,
          code,
        },
        { auth: false }
      );
      saveAuthSession(data, 'user');
      message.success('Login successful');

      const requestedRedirect = localStorage.getItem('redirectAfterLogin') || location.state?.redirectTo;
      const redirectAfterLogin = /^\/(?!\/)/.test(requestedRedirect || '') ? requestedRedirect : null;
      localStorage.removeItem('redirectAfterLogin');
      if (redirectAfterLogin) {
        navigate(redirectAfterLogin, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (error) {
      const friendlyMessage = getAuthErrorMessage(error, 'client');
      setAuthError(friendlyMessage);
      message.error(friendlyMessage);
    } finally {
      setMfaLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <img src={logoImage} alt="Logo" className="login-logo" />
        <h1>Welcome to EventHub</h1>
        <p>
          Discover events, manage your bookings, and keep every confirmation in one secure place.
        </p>
      </div>
      <div className="login-right">
        <Form
          name="login"
          onFinish={challenge ? verifyMfa : onFinish}
          className="login-form"
        >
          <h2 className="login-form-title">{challenge ? 'Verify your sign-in' : 'Attendee sign in'}</h2>
          <p className="login-form-subtitle">
            {challenge
              ? `Enter the code sent to ${challenge.maskedEmail || email}.`
              : 'Sign in with your password, then confirm the one-time code.'}
          </p>

          {authError && (
            <Alert
              className="auth-error-alert"
              type="error"
              showIcon
              message={authError}
            />
          )}

          {challenge && (
            <Alert
              className="mfa-alert"
              type="info"
              showIcon
              message={challenge.message}
              description={
                <div className="mfa-alert-content">
                  <p>Code expires at {new Date(challenge.expiresAt).toLocaleTimeString()}.</p>
                </div>
              }
            />
          )}

          {!challenge ? (
            <>
              <Form.Item
                name="email"
                label="Email"
                rules={[{ required: true, message: 'Please input your Email!' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="Email" autoComplete="email" />
              </Form.Item>

              <Form.Item
                name="password"
                label="Password"
                rules={[{ required: true, message: 'Please input your Password!' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Password" autoComplete="current-password" />
              </Form.Item>
            </>
          ) : (
            <Form.Item
              name="code"
              label="Verification code"
              rules={[
                { required: true, message: 'Please enter your verification code!' },
                { len: 6, message: 'Verification code must be 6 digits' },
              ]}
            >
              <Input
                maxLength={6}
                placeholder="Enter 6-digit verification code"
                className="mfa-code-input"
                inputMode="numeric"
                autoComplete="one-time-code"
              />
            </Form.Item>
          )}

          <Form.Item>
            <Button block type="primary" htmlType="submit" loading={challenge ? mfaLoading : loading}>
              {challenge ? 'Verify Code' : 'Continue to Verification'}
            </Button>
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              {challenge ? (
                <button
                  type="button"
                  className="login-link-button"
                  onClick={() => {
                    setChallenge(null);
                    setEmail('');
                    setAuthError('');
                  }}
                >
                  Use a different email
                </button>
              ) : (
                <>
                  or <Link to="/register">Create an account</Link>
                </>
              )}
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Login;
