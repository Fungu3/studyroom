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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Highlight 'rooms' if path is /rooms
  const selectedKey = location.pathname.startsWith('/rooms') ? 'rooms' : '';

  const showCreateModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleCreate = async (values) => {
    setLoading(true);
    try {
        // Values need formatting? 
        // Backend likely expects Date objects or ISO strings.
        // Let's assume the API handles it or valid JSON.
        // Based on existing RoomsPage:
        // const start = values.timeRange?.[0];
        // const end = values.timeRange?.[1];
        // payload: { name, capacity, startTime, endTime }
        
        const payload = {
            title: values.name,
            subject: '自习', // Default subject
            description: `Capacity: ${values.capacity}`,
            // We can't save start/end time in backend yet, so ignoring or putting in desc
        };

        const res = await createRoom(payload);
        message.success("创建成功");
        setIsModalOpen(false);
        form.resetFields();
        if (res && res.id) {
            navigate(`/rooms/${res.id}`);
        } else {
             // Fallback if no ID returned, just go to list
             navigate('/rooms');
             window.location.reload(); // Force refresh if list
        }
    } catch (e) {
        console.error(e);
        message.error("创建失败: " + (e.response?.data?.message || e.message));
    } finally {
        setLoading(false);
    }
  };

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
                onClick={showCreateModal}
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

      <Modal
        title="创建自习室"
        open={isModalOpen}
        onOk={form.submit}
        onCancel={handleCancel}
        confirmLoading={loading}
      >
        <Form
            form={form}
            layout="vertical"
            onFinish={handleCreate}
            initialValues={{ capacity: 4 }}
        >
            <Form.Item name="name" label="房间名称" rules={[{ required: true, message: '请输入房间名称' }]}>
                <Input placeholder="输入房间名称" />
            </Form.Item>
            <Form.Item name="timeRange" label="预定时间区间" rules={[{ required: true, message: '请选择时间' }]}>
                <DatePicker.RangePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="capacity" label="人数上限" rules={[{ required: true, message: '请输入人数上限' }]}>
                <InputNumber min={1} max={20} style={{ width: '100%' }} />
            </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
