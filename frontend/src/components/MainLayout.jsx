// frontend/src/components/MainLayout.jsx
import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Badge, Modal, Form, Input, DatePicker, InputNumber, message, Space, Typography } from 'antd';
import { UserOutlined, BellOutlined, PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { createRoom } from '../api/rooms';
import dayjs from 'dayjs';

const { Header, Content } = Layout;
const { Title } = Typography;

export default function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Highlight 'rooms' if path is /rooms
  const selectedKey = location.pathname.startsWith('/rooms') ? 'rooms' : '';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', padding: '0 24px', background: '#001529' }}>
        <div style={{ marginRight: '40px' }}>
             <Title level={4} style={{ color: 'white', margin: 0 }}>多人实时在线自习室</Title>
        </div>
        
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <Button 
                type={selectedKey === 'rooms' ? 'primary' : 'text'} 
                style={{ color: selectedKey === 'rooms' ? 'white' : 'rgba(255,255,255,0.65)', marginRight: 10 }}
                icon={<UnorderedListOutlined />}
                onClick={() => navigate('/rooms')}
            >
                房间列表
            </Button>
            <Button 
                type="dashed" 
                ghost 
                icon={<PlusOutlined />}
                onClick={() => navigate('/rooms/create')}
            >
                创建房间
            </Button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Badge dot>
                <BellOutlined style={{ color: 'white', fontSize: '20px', cursor: 'pointer' }} />
            </Badge>
            <Link to="/personal">
                <Avatar icon={<UserOutlined />} style={{ cursor: 'pointer', backgroundColor: '#87d068' }} />
            </Link>
        </div>
      </Header>
      
      <Content>
        {children}
      </Content>
    </Layout>
  );
}
