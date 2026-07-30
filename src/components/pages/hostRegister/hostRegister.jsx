// Host account registration.
import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, DatePicker, Select, message, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import './HostRegister.css';
import logo from '../../../assets/logo.svg';
import { apiPost } from '../../../utils/api';

const { Option } = Select;

const HostRegister = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    const { agreement, confirmPassword, ...registrationValues } = values;
    const payload = {
      ...registrationValues,
      dateOfBirth: values.dateOfBirth.format('YYYY-MM-DD'),
    };

    try {
      await apiPost('/api/hosts/register', payload, { auth: false });
      message.success('Host account created. You can sign in after an administrator approves it.');
      setTimeout(() => navigate('/host-login'), 1600);
    } catch (error) {
      message.error(error.message || 'Host registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const disabledDate = (current) => {
    return current && current > dayjs().subtract(18, 'years').endOf('day');
  };

  return (
    <div className="register-container">
      <div className="register-left">
        <img src={logo} alt="Logo" className="register-logo" />
        <h2>Become a Host</h2>
        <p>
          Join our platform and start managing your own events across Music, Business, Education, and Sports.
          Your audience awaits!
        </p>
      </div>

      <div className="register-form-container">
        <Form layout="vertical" onFinish={onFinish} style={{ width: '100%' }}>
          <Form.Item
            name="firstName"
            label="First Name"
            rules={[
              { required: true, message: 'First name is required' },
              { pattern: /^[A-Za-z]+$/, message: 'First name must contain only letters' },
            ]}
          >
            <Input placeholder="First Name" />
          </Form.Item>

          <Form.Item
            name="lastName"
            label="Last Name"
            rules={[
              { required: true, message: 'Last name is required' },
              { pattern: /^[A-Za-z]+$/, message: 'Last name must contain only letters' },
            ]}
          >
            <Input placeholder="Last Name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Email is required' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="mobileNumber"
            label="Mobile Number"
            rules={[{ required: true, message: 'Mobile number is required' }]}
          >
            <Input placeholder="Mobile Number" />
          </Form.Item>

          <Form.Item
            name="dateOfBirth"
            label={
              <span>
                Date of Birth&nbsp;
                <Tooltip title="Host must be at least 18 years old">
                  <InfoCircleOutlined />
                </Tooltip>
              </span>
            }
            rules={[{ required: true, message: 'Please select your date of birth' }]}
          >
            <DatePicker style={{ width: '100%' }} disabledDate={disabledDate} />
          </Form.Item>

          <Form.Item
            name="eventCategory"
            label="Event Category"
            rules={[{ required: true, message: 'Please select an event category' }]}
          >
            <Select placeholder="Select event category">
              <Option value="music">Music</Option>
              <Option value="business">Business</Option>
              <Option value="educational">Educational</Option>
              <Option value="sports">Sports</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="password"
            label={
              <span>
                Password&nbsp;
                <Tooltip
                  title={
                    <>
                      • Between 10 and 72 characters<br />
                      • 1 uppercase (A-Z), 1 lowercase (a-z)<br />
                      • 1 number (0-9), 1 special character (!@#$...)
                    </>
                  }
                >
                  <InfoCircleOutlined />
                </Tooltip>
              </span>
            }
            rules={[
              { required: true, message: 'Password is required' },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{10,72}$/,
                message: 'Password must be 10-72 characters and include upper, lower, number, and special character',
              },
            ]}
            hasFeedback
          >
            <Input.Password placeholder="Password" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: 'Please confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const password = getFieldValue('password');
                  if (!value || password === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirm Password" />
          </Form.Item>

          <Form.Item
            name="agreement"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) => value
                  ? Promise.resolve()
                  : Promise.reject(new Error('You must accept the terms of service')),
              },
            ]}
          >
            <Checkbox>
              I have read and accept the <Link to="/terms">terms of service</Link>
            </Checkbox>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Register
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default HostRegister;
