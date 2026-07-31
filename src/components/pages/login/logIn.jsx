// Customer sign-in and MFA verification.
import React, { useState } from 'react';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input, message } from 'antd';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Login.css';

import logoImage from '../../../assets/logo.svg';
import MfaVerificationStep from '../../auth/MfaVerificationStep';
import { getAuthErrorMessage } from '../../../utils/authMessages';
import { saveAuthSession } from '../../../utils/authSession';
import { apiPost } from '../../../utils/api';
import { assertMfaChallenge } from '../../../utils/mfaChallenge';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [challenge, setChallenge] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [authError, setAuthError] = useState('');

  // Get redirect path if coming from an event
  const onFinish = async (values) => {
    const loginCredentials = {
      email: values.email.trim(),
      password: values.password,
    };
    setLoading(true);
    setAuthError('');
    try {
      const data = assertMfaChallenge(
        await apiPost('/api/login', loginCredentials, { auth: false })
      );
      setChallenge(data);
      setCredentials(loginCredentials);
      form.setFieldValue('code', undefined);
      message.success(data.message || 'Verification code sent');
    } catch (error) {
      const friendlyMessage = getAuthErrorMessage(error, 'client');
      setAuthError(friendlyMessage);
      message.error(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const resendMfa = async () => {
    if (!credentials) {
      setChallenge(null);
      setAuthError('Please enter your email and password again.');
      return;
    }

    setResendLoading(true);
    setAuthError('');
    try {
      const data = assertMfaChallenge(
        await apiPost('/api/login', credentials, { auth: false })
      );
      setChallenge(data);
      form.setFieldValue('code', undefined);
      message.success(data.message || 'A new verification code was sent');
    } catch (error) {
      const friendlyMessage = getAuthErrorMessage(error, 'client', 'resend');
      setAuthError(friendlyMessage);
      message.error(friendlyMessage);
    } finally {
      setResendLoading(false);
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
      setCredentials(null);
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
      const friendlyMessage = getAuthErrorMessage(error, 'client', 'mfa');
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
          form={form}
          name="login"
          onFinish={challenge ? verifyMfa : onFinish}
          className="login-form"
        >
          <h2 className="login-form-title">{challenge ? 'Verify your sign-in' : 'Attendee sign in'}</h2>
          <p className="login-form-subtitle">
            {challenge
              ? `Enter the code sent to ${challenge.maskedEmail || 'your email address'}.`
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

          {!challenge ? (
            <>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please input your Email!' },
                  { type: 'email', message: 'Enter a valid email address' },
                ]}
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
            <MfaVerificationStep
              challenge={challenge}
              resendLoading={resendLoading}
              verificationLoading={mfaLoading}
              onResend={resendMfa}
            />
          )}

          <Form.Item>
            <Button
              block
              type="primary"
              htmlType="submit"
              loading={challenge ? mfaLoading : loading}
              disabled={Boolean(challenge && resendLoading)}
            >
              {challenge ? 'Verify Code' : 'Continue to Verification'}
            </Button>
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              {challenge ? (
                <button
                  type="button"
                  className="login-link-button"
                  disabled={resendLoading || mfaLoading}
                  onClick={() => {
                    setChallenge(null);
                    setCredentials(null);
                    setAuthError('');
                    form.resetFields();
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
