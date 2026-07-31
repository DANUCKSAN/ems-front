import React from 'react';
import { Alert, Button, Form, Input } from 'antd';
import {
  formatMfaExpiry,
  MFA_CODE_LENGTH,
  normalizeMfaCode,
} from '../../utils/mfaChallenge';
import './MfaVerificationStep.css';

const MfaVerificationStep = ({
  challenge,
  resendLoading,
  verificationLoading,
  onResend,
}) => {
  const expiryLabel = formatMfaExpiry(challenge?.expiresAt);

  return (
    <>
      <Alert
        className="mfa-alert"
        type="info"
        showIcon
        message={challenge?.message || 'A verification code was sent to your email.'}
        description={
          <div className="mfa-alert-content">
            <p>
              {expiryLabel
                ? `Code expires at ${expiryLabel}.`
                : 'Use the most recent code delivered to your email.'}
            </p>
            <Button
              className="mfa-resend-button"
              type="link"
              htmlType="button"
              loading={resendLoading}
              disabled={verificationLoading}
              onClick={onResend}
            >
              Resend verification code
            </Button>
          </div>
        }
      />

      <Form.Item
        name="code"
        label="Verification code"
        normalize={normalizeMfaCode}
        rules={[
          { required: true, message: 'Please enter your verification code!' },
          {
            pattern: new RegExp(`^\\d{${MFA_CODE_LENGTH}}$`),
            message: `Verification code must be ${MFA_CODE_LENGTH} digits`,
          },
        ]}
      >
        <Input
          maxLength={MFA_CODE_LENGTH}
          placeholder={`Enter ${MFA_CODE_LENGTH}-digit verification code`}
          className="mfa-code-input"
          inputMode="numeric"
          autoComplete="one-time-code"
          disabled={resendLoading || verificationLoading}
        />
      </Form.Item>
    </>
  );
};

export default MfaVerificationStep;
