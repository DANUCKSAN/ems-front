// Customer account registration.
import React from "react";
import {
  Button,
  Checkbox,
  Form,
  Input,
  Select,
  message,
  Tooltip
} from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import "./Register.css";
import logo from "../../../assets/logo.svg";
import { apiPost } from "../../../utils/api";

const { Option } = Select;

const Register = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    const { confirm, agreement, ...dataToSend } = values;

    try {
      await apiPost("/api/users/register", dataToSend, { auth: false });
      message.success("Account created successfully. You can now log in.");
      form.resetFields();
      setTimeout(() => navigate("/login"), 1200);
    } catch (error) {
      message.error(error.message || "Registration failed. Please try again.");
    }
  };

  const prefixSelector = (
    <Form.Item name="prefix" noStyle initialValue="61">
      <Select style={{ width: 70 }}>
        <Option value="61">+61</Option>
        <Option value="64">+64</Option>
        <Option value="94">+94</Option>
      </Select>
    </Form.Item>
  );

  return (
    <div className="register-container">
      <div className="register-left">
        <img src={logo} alt="Logo" className="register-logo" />
        <h2>Welcome to EventHub</h2>
        <p>Create your account to discover approved events, reserve tickets, and manage bookings.</p>
      </div>

      <div className="register-form-container">
        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          scrollToFirstError
          layout="vertical"
        >
          <Form.Item
            name="firstName"
            label="First Name"
            rules={[
              { required: true, message: "Please input your first name" },
              { pattern: /^[A-Za-z]+$/, message: "First name must contain only letters" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="lastName"
            label="Last Name"
            rules={[
              { required: true, message: "Please input your last name" },
              { pattern: /^[A-Za-z]+$/, message: "Last name must contain only letters" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="E-mail"
            rules={[
              { required: true, message: "Please input your email!" },
              { type: "email", message: "Invalid email format" },
            ]}
          >
            <Input />
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
            hasFeedback
            rules={[
              { required: true, message: "Please input your password!" },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{10,72}$/,
                message: "Password must be 10-72 characters and include upper, lower, number, and special character",
              },
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            name="confirm"
            label="Confirm Password"
            dependencies={["password"]}
            hasFeedback
            rules={[
              { required: true, message: "Please confirm your password!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match!"));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            name="nickname"
            label="Nickname"
            tooltip="What do you want others to call you?"
            rules={[
              { required: true, message: "Please input your nickname!", whitespace: true },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone Number"
            rules={[{ required: true, message: "Please input your phone number!" }]}
          >
            <Input addonBefore={prefixSelector} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="gender"
            label="Gender"
            rules={[{ required: true, message: "Please select gender!" }]}
          >
            <Select placeholder="Select your gender">
              <Option value="male">Male</Option>
              <Option value="female">Female</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="agreement"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value
                    ? Promise.resolve()
                    : Promise.reject(new Error("You must accept the agreement")),
              },
            ]}
          >
            <Checkbox>
              I have read and accept the <a href="/terms" target="_blank" rel="noreferrer">terms of service</a>
            </Checkbox>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Register
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Register;
