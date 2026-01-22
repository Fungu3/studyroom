// frontend/src/components/MainLayout.jsx
import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Badge, Modal, Form, Input, DatePicker, InputNumber, message, Space, Typography, ConfigProvider } from 'antd';
import { UserOutlined, BellOutlined, PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { createRoom } from '../api/rooms';
import dayjs from 'dayjs';
import './MainLayout.css';

const { Header, Content } = Layout;
const { Title } = Typography;

export default function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Highlight 'rooms' if path is /rooms
  const selectedKey = location.pathname.startsWith('/rooms') ? 'rooms' : '';

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      <Header className="kawaii-header">
           <div style={{ marginRight: '40px' }}>
             <Title level={4} className="kawaii-header-title" style={{ margin: 0 }}>studyroom</Title>
           </div>
        
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <ConfigProvider wave={{ disabled: true }}>
            <Button 
            type="text"
            className={`kawaii-nav-btn ${selectedKey === 'rooms' ? 'header-nav-btn--active' : ''}`}
            style={{ marginRight: 10 }}
              icon={<UnorderedListOutlined className="kawaii-icon" />}
              onClick={() => navigate('/rooms')}
            >
              房间列表
            </Button>
            <Button 
              className="kawaii-create-btn"
              icon={<PlusOutlined style={{ color: '#fff' }} />}
              onClick={() => navigate('/rooms/create')}
            >
              创建房间
            </Button>
          </ConfigProvider>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Badge dot color="#FFB6C1">
                <BellOutlined className="kawaii-icon" style={{ cursor: 'pointer' }} />
            </Badge>
            <Link to="/personal">
                <Avatar icon={<UserOutlined />} style={{ cursor: 'pointer', backgroundColor: '#FFE8F2', color: '#555555', border: '1px solid #FFB6C1' }} />
            </Link>
        </div>
      </Header>
      
      <Content>
        {children}
      </Content>
    </Layout>
  );
}
