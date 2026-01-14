// frontend/src/pages/RegisterPage.jsx
import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Typography, Space, message } from 'antd';
import { UserOutlined, LockOutlined, ReadOutlined, LaptopOutlined, CoffeeOutlined, EditOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';

const { Title } = Typography;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submittable, setSubmittable] = useState(false);

  // Watch all values to control button state
  const values = Form.useWatch([], form);

  useEffect(() => {
    form
      .validateFields({ validateOnly: true })
      .then(
        () => setSubmittable(true),
        () => setSubmittable(false),
      );
  }, [values, form]);

  const onFinish = (values) => {
    console.log('Register values:', values);
    // Simulate registration
    message.success("注册成功！即将跳转至登录页");
    setTimeout(() => {
        navigate('/login');
    }, 3000);
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #1890ff 0%, #001529 100%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '60%',
        maxWidth: '900px',
        minWidth: '600px',
        backgroundColor: 'rgba(24, 144, 255, 0.8)',
        borderRadius: '16px',
        display: 'flex',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        position: 'relative'
      }}>
         <div style={{ position: 'absolute', top: 20, right: 30, zIndex: 1 }}>
          <Title level={3} style={{ color: 'white', margin: 0 }}>多人实时在线自习室 - 注册</Title>
        </div>

        {/* Left Side */}
        <div style={{
          width: '40%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px',
          color: 'white'
        }}>
          <Space direction="vertical" size="large" align="center">
            <ReadOutlined style={{ fontSize: '64px', opacity: 0.9 }} />
             <Space>
                <LaptopOutlined style={{ fontSize: '32px', opacity: 0.8 }} />
                <EditOutlined style={{ fontSize: '32px', opacity: 0.8 }} />
             </Space>
            <CoffeeOutlined style={{ fontSize: '32px', opacity: 0.7 }} />
          </Space>
        </div>

        {/* Right Side: Form */}
        <div style={{
          width: '60%',
          padding: '80px 40px 40px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <Card bordered={false} style={{ width: '100%', borderRadius: '8px' }}>
             <Form
               form={form}
               name="register"
               onFinish={onFinish}
               size="large"
               layout="vertical"
             >
               <Form.Item
                 name="username"
                 rules={[
                     { required: true, message: '请输入用户名' },
                     { min: 2, max: 12, message: '用户名需 2-12 位' },
                     { pattern: /^[a-zA-Z0-9\u4e00-\u9fa5]+$/, message: '用户名不含特殊字符' }
                 ]}
               >
                 <Input prefix={<UserOutlined />} placeholder="设置用户名" />
               </Form.Item>

               <Form.Item
                 name="password"
                 rules={[
                     { required: true, message: '请输入密码' },
                     { min: 6, message: '密码至少 6 位' }
                 ]}
               >
                 <Input.Password prefix={<LockOutlined />} placeholder="设置密码（至少 6 位）" />
               </Form.Item>

               <Form.Item
                 name="confirm"
                 dependencies={['password']}
                 hasFeedback
                 rules={[
                   { required: true, message: '请确认密码' },
                   ({ getFieldValue }) => ({
                     validator(_, value) {
                       if (!value || getFieldValue('password') === value) {
                         return Promise.resolve();
                       }
                       return Promise.reject(new Error('两次密码输入不一致'));
                     },
                   }),
                 ]}
               >
                 <Input.Password prefix={<SafetyCertificateOutlined />} placeholder="确认密码" />
               </Form.Item>

               <Form.Item>
                 <Button 
                    type="primary" 
                    htmlType="submit" 
                    block 
                    style={{ backgroundColor: '#1890ff' }}
                    disabled={!submittable}
                 >
                   注册
                 </Button>
               </Form.Item>
               
               <div style={{ textAlign: 'center' }}>
                  <Link to="/login" style={{ color: '#8c8c8c' }}>已有账号？点击登录</Link>
               </div>
             </Form>
          </Card>
        </div>
      </div>
    </div>
  );
}
