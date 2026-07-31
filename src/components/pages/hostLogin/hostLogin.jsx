// Host sign-in and MFA verification.
import React, { useState } from 'react';
import { Alert, Form, Input, Button, message } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import './HostLogin.css';
import logo from '../../../assets/logo.svg';
import MfaVerificationStep from '../../auth/MfaVerificationStep';
import { getAuthErrorMessage } from '../../../utils/authMessages';
import { saveAuthSession } from '../../../utils/authSession';
import { apiPost } from '../../../utils/api';
import { assertMfaChallenge } from '../../../utils/mfaChallenge';

const HostLogin = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [challenge, setChallenge] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [authError, setAuthError] = useState('');
  const navigate = useNavigate();

  const onFinish = async ({ email, password }) => {
    const loginCredentials = { email: email.trim(), password };
    setLoading(true);
    setAuthError('');
    try {
      const data = assertMfaChallenge(
        await apiPost('/api/hosts/login', loginCredentials, { auth: false })
      );
      setChallenge(data);
      setCredentials(loginCredentials);
      form.setFieldValue('code', undefined);
      message.success(data.message || 'Verification code sent');
    } catch (error) {
      const friendlyMessage = getAuthErrorMessage(error, 'host');
      setAuthError(friendlyMessage);
      message.error(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const resendMfa = async () => {
    if (!credentials) {
      setChallenge(null);
      setAuthError('Please enter your host email and password again.');
      return;
    }

    setResendLoading(true);
    setAuthError('');
    try {
      const data = assertMfaChallenge(
        await apiPost('/api/hosts/login', credentials, { auth: false })
      );
      setChallenge(data);
      form.setFieldValue('code', undefined);
      message.success(data.message || 'A new verification code was sent');
    } catch (error) {
      const friendlyMessage = getAuthErrorMessage(error, 'host', 'resend');
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
        '/api/hosts/login/verify-mfa',
        {
          challengeId: challenge?.challengeId,
          code,
        },
        { auth: false }
      );
      message.success('Login successful!');
      saveAuthSession(data, 'host');
      setCredentials(null);
      navigate('/dashboard');
    } catch (error) {
      const friendlyMessage = getAuthErrorMessage(error, 'host', 'mfa');
      setAuthError(friendlyMessage);
      message.error(friendlyMessage);
    } finally {
      setMfaLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-left">
        <img src={logo} alt="Logo" className="login-logo" />
        <h1>Welcome, Host!</h1>
        <p>Access your dashboard, manage events, and connect with your audience.</p>
      </div>

      <div className="login-right">
        <Form
          form={form}
          name="host-login"
          onFinish={challenge ? verifyMfa : onFinish}
          layout="vertical"
          className="login-form"
        >
          <h2>{challenge ? 'Verify Host Login' : 'Host Login'}</h2>
          <p className="host-login-subtitle">
            {challenge
              ? `Enter the verification code sent to ${challenge.maskedEmail || 'your email address'}.`
              : 'Use your password first, then confirm the one-time email code.'}
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
                  { required: true, message: 'Please enter your email!' },
                  { type: 'email', message: 'Enter a valid email address' },
                ]}
              >
                <Input placeholder="Email" autoComplete="email" />
              </Form.Item>

              <Form.Item
                name="password"
                label="Password"
                rules={[{ required: true, message: 'Please enter your password!' }]}
              >
                <Input.Password placeholder="Password" autoComplete="current-password" />
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
              type="primary"
              htmlType="submit"
              loading={challenge ? mfaLoading : loading}
              disabled={Boolean(challenge && resendLoading)}
              block
            >
              {challenge ? 'Verify Code' : 'Continue to Verification'}
            </Button>
            <div className="register-link">
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
                  Use a different host account
                </button>
              ) : (
                <>
                  Need an account? <Link to="/host-register">Register as Host</Link>
                </>
              )}
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default HostLogin;
