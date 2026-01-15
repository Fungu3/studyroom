// frontend/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, Space, message } from 'antd';
import { UserOutlined, LockOutlined, ReadOutlined, LaptopOutlined, CoffeeOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import classroomBg from '../assets/classroom.png';
import { login } from '../api/system';

const { Title, Text } = Typography;

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
        const user = await login(values);
        localStorage.setItem("studyroom_user", JSON.stringify(user));
        message.success("登录成功");
        navigate('/rooms');
    } catch (e) {
        message.error("登录失败: " + (e.response?.message || "用户名或密码错误"));
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'relative',
      height: '100vh',
      width: '100vw',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden'
    }}>
      {/* Background Image with Blur */}
      <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: `url(${classroomBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(8px)',
          zIndex: 0,
      }} />
      <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.2)',
          zIndex: 1,
      }} />

      <div style={{
        width: '60%',
        maxWidth: '900px',
        minWidth: '600px',
        backgroundColor: 'rgba(24, 144, 255, 0.85)', // Blue semi-transparent
        borderRadius: '16px',
        display: 'flex',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        zIndex: 2
      }}>
        {/* Title Top Right (Overlaid or part of layout, sticking to layout for simplicity) */}
        <div style={{ position: 'absolute', top: 20, right: 30, zIndex: 1 }}>
          <Title level={3} style={{ color: 'white', margin: 0 }}>多人实时在线自习室</Title>
        </div>

        {/* Left Side: Icons */}
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
            <LaptopOutlined style={{ fontSize: '48px', opacity: 0.8 }} />
            <CoffeeOutlined style={{ fontSize: '32px', opacity: 0.7 }} />
          </Space>
        </div>

        {/* Right Side: Login Form */}
        <div style={{
          width: '60%',
          padding: '80px 40px 40px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <Card bordered={false} style={{ width: '100%', borderRadius: '8px' }}>
             <Form
               name="login"
               onFinish={onFinish}
               size="large"
             >
               <Form.Item
                 name="username"
                 rules={[{ required: true, message: '请输入用户名!' }]}
               >
                 <Input prefix={<UserOutlined />} placeholder="用户名" />
               </Form.Item>

               <Form.Item
                 name="password"
                 rules={[{ required: true, message: '请输入密码!' }]}
               >
                 <Input.Password prefix={<LockOutlined />} placeholder="密码" />
               </Form.Item>

               <Form.Item>
                 <Button type="primary" htmlType="submit" block style={{ backgroundColor: '#1890ff' }}>
                   登录
                 </Button>
               </Form.Item>
               
               <div style={{ textAlign: 'right' }}>
                  <Link to="/register" style={{ color: '#1890ff' }}>注册</Link>
               </div>
             </Form>
          </Card>
        </div>
      </div>
    </div>
  );
}
