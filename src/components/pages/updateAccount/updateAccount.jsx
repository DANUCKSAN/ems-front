import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Select, message, Card } from 'antd';
import './UpdateAccount.css';
import logo from '../../../assets/logo.svg';
import { apiPut } from '../../../utils/api';


const { Option } = Select;

const UpdateAccount = () => {
  const [form] = Form.useForm();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUser(storedUser);
      form.setFieldsValue(storedUser); // populate form
    }
  }, [form]);

  const onFinish = async (values) => {
    try {
      const { firstName, lastName, nickname, phone, gender } = values;
      const updatedUser = await apiPut(`/api/users/${user.id}`, {
        firstName,
        lastName,
        nickname,
        phone,
        gender,
      });
      message.success('Account updated successfully!');
      localStorage.setItem('user', JSON.stringify({ ...user, ...updatedUser }));
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      message.error(error.message || 'Failed to update account.');
    }
  };

  return (
    <div className="update-account-container">
      <div className="update-account-left">
        <h1>Update Your Profile</h1>
        <p>
          Keep your information up to date to ensure you get the best personalized experience.
          Your name and contact details help us serve you better.
        </p>
        <img src={logo} alt="Update Illustration" className="update-image" />

      </div>

      <div className="update-account-right">
        <Card
          title="Update Account"
          bordered={false}
          style={{ width: '100%', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
        >
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>

            <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              extra="Email changes require a separate verification process."
            >
              <Input disabled />
            </Form.Item>

            <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
              <Input />
            </Form.Item>

            <Form.Item name="nickname" label="Nickname" rules={[{ required: true }]}>
              <Input />
            </Form.Item>

            <Form.Item name="gender" label="Gender" rules={[{ required: true }]}>
              <Select placeholder="Select gender">
                <Option value="male">Male</Option>
                <Option value="female">Female</Option>
                <Option value="other">Other</Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Update
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default UpdateAccount;
