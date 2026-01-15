import React, { useState } from 'react';
import { Form, Input, DatePicker, InputNumber, Button, message, Typography, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../api/rooms';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function CreateRoomPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const handleCreate = async (values) => {
        setLoading(true);
        try {
            const payload = {
                title: values.name,
                subject: '自习', // Default subject
                description: `Capacity: ${values.capacity}`,
            };
    
            const res = await createRoom(payload);
            message.success("创建成功");
            if (res && res.id) {
                navigate(`/rooms/${res.id}`);
            } else {
                 navigate('/rooms');
            }
        } catch (e) {
            console.error(e);
            message.error("创建失败: " + (e.response?.data?.message || e.message));
        } finally {
            setLoading(false);
        }
      };

    return (
        <div style={{ minHeight: 'calc(100vh - 64px)', width: '100%', padding: 24, background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Card style={{ width: '100%', maxWidth: 720 }} title={<Title level={3} style={{ margin: 0 }}>创建新自习室</Title>}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreate}
                    initialValues={{ capacity: 4 }}
                >
                    <Form.Item name="name" label="房间名称" rules={[{ required: true, message: '请输入房间名称' }]}>
                        <Input placeholder="输入房间名称" size="large" />
                    </Form.Item>
                    <Form.Item name="timeRange" label="预定时间区间" rules={[{ required: true, message: '请选择时间' }]}>
                        <DatePicker.RangePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} size="large" />
                    </Form.Item>
                    <Form.Item name="capacity" label="人数上限" rules={[{ required: true, message: '请输入人数上限' }]}>
                        <InputNumber min={1} max={20} style={{ width: '100%' }} size="large" />
                    </Form.Item>

                    <Form.Item style={{ marginTop: 24 }}>
                        <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                            立即创建
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}
