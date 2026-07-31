import React, { useState } from 'react';
import { Alert, Button, Form, Input, message } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import '../login/Login.css';
import './AdminLogin.css';
import logo from '../../../assets/logo.svg';
import MfaVerificationStep from '../../auth/MfaVerificationStep';
import { getAuthErrorMessage } from '../../../utils/authMessages';
import { saveAuthSession } from '../../../utils/authSession';
import { apiPost } from '../../../utils/api';
import { assertMfaChallenge } from '../../../utils/mfaChallenge';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [authError, setAuthError] = useState('');

  const startLogin = async (values) => {
    const loginCredentials = {
      email: values.email.trim(),
      password: values.password,
    };
    setLoading(true);
    setAuthError('');
    try {
      const payload = assertMfaChallenge(
        await apiPost('/api/admin/login', loginCredentials, { auth: false })
      );
      setChallenge(payload);
      setCredentials(loginCredentials);
      form.setFieldValue('code', undefined);
      message.success(payload.message || 'Verification code sent');
    } catch (error) {
      const friendlyMessage = getAuthErrorMessage(error, 'admin');
      setAuthError(friendlyMessage);
      message.error(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const resendMfa = async () => {
    if (!credentials) {
      setChallenge(null);
      setAuthError('Please enter your admin email and password again.');
      return;
    }

    setResendLoading(true);
    setAuthError('');
    try {
      const payload = assertMfaChallenge(
        await apiPost('/api/admin/login', credentials, { auth: false })
      );
      setChallenge(payload);
      form.setFieldValue('code', undefined);
      message.success(payload.message || 'A new verification code was sent');
    } catch (error) {
      const friendlyMessage = getAuthErrorMessage(error, 'admin', 'resend');
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
      const payload = await apiPost(
        '/api/admin/login/verify-mfa',
        {
          challengeId: challenge?.challengeId,
          code,
        },
        { auth: false }
      );
      saveAuthSession(payload, 'admin');
      setCredentials(null);
      message.success('Admin login successful');
      navigate('/admin-dashboard');
    } catch (error) {
      const friendlyMessage = getAuthErrorMessage(error, 'admin', 'mfa');
      setAuthError(friendlyMessage);
      message.error(friendlyMessage);
    } finally {
      setMfaLoading(false);
    }
  };

  return (
    <div className="login-container admin-login-page">
      <div className="login-left admin-login-left">
        <img src={logo} alt="Logo" className="login-logo" />
        <h1>Admin Control Access</h1>
        <p>Review and approve users, hosts, and newly created events from one secure workspace.</p>
      </div>

      <div className="login-right">
        <Form
          form={form}
          name="admin-login"
          className="login-form"
          onFinish={challenge ? verifyMfa : startLogin}
        >
          <h2 className="login-form-title">{challenge ? 'Verify Admin Login' : 'Admin Login'}</h2>
          <p className="login-form-subtitle">
            {challenge
              ? `Enter the verification code sent to ${challenge.maskedEmail || 'your email address'}.`
              : 'Sign in with your admin account, then confirm the one-time verification code.'}
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
                rules={[
                  { required: true, message: 'Please input admin email!' },
                  { type: 'email', message: 'Enter a valid email address' },
                ]}
              >
                <Input prefix={<UserOutlined />} placeholder="Admin email" autoComplete="email" />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: 'Please input admin password!' }]}
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
              type="primary"
              htmlType="submit"
              block
              loading={challenge ? mfaLoading : loading}
              disabled={Boolean(challenge && resendLoading)}
            >
              {challenge ? 'Verify and Continue' : 'Continue to Verification'}
            </Button>
            <div className="admin-auth-link-row">
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
                  Use a different admin account
                </button>
              ) : 'Administrator accounts are provisioned by the platform owner.'}
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default AdminLogin;
