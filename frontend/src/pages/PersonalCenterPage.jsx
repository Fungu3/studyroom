// frontend/src/pages/PersonalCenterPage.jsx
import React from 'react';
import { Card, Avatar, List, Typography, Row, Col, Progress, Button, Statistic, Modal, Space } from 'antd';
import { UserOutlined, PayCircleOutlined, BookOutlined, TrophyOutlined, ScheduleOutlined } from '@ant-design/icons';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const { Title, Text, Link } = Typography;

// Mock Data
const totalStudyData = [
  { name: 'Mon', time: 120, count: 4 },
  { name: 'Tue', time: 150, count: 5 },
  { name: 'Wed', time: 180, count: 6 },
  { name: 'Thu', time: 90, count: 3 },
  { name: 'Fri', time: 240, count: 8 },
  { name: 'Sat', time: 300, count: 10 },
  { name: 'Sun', time: 200, count: 7 },
];

const planData = [
  { name: 'Completed', value: 75 },
  { name: 'Remaining', value: 25 },
];

const COLORS = ['#52c41a', '#f0f2f5'];

export default function PersonalCenterPage() {
  
  const showCoinRecords = () => {
      Modal.info({
          title: '金币获取记录',
          content: (
              <List
                dataSource={[
                    { time: '2023-10-27 10:00', source: '专注 30 分钟', change: '+5' },
                    { time: '2023-10-27 11:00', source: '专注 30 分钟', change: '+5' },
                ]}
                renderItem={item => (
                    <List.Item>
                        <Text>{item.time}</Text> <Text>{item.source}</Text> <Text type="success">{item.change}</Text>
                    </List.Item>
                )}
              />
          )
      });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100%', backgroundColor: '#f0f2f5' }}>
      {/* Left Sidebar */}
      <div style={{ width: '250px', backgroundColor: '#001529', color: 'white', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '24px', textAlign: 'center', borderBottom: '1px solid #1890ff' }}>
           <Title level={4} style={{ color: 'white' }}>账户信息</Title>
           <Avatar size={64} icon={<UserOutlined />} style={{ marginBottom: 16 }} />
           <div style={{ fontSize: '16px' }}>MyUser</div>
        </div>
        <List
            dataSource={[
                { title: '用户信息', icon: <UserOutlined /> },
                { title: '创建的自习室', icon: <BookOutlined /> },
                { title: '标记的自习室', icon: <TrophyOutlined /> },
                { title: '学习记录', icon: <ScheduleOutlined /> },
            ]}
            renderItem={item => (
                <List.Item style={{ padding: '16px 24px', color: 'rgba(255,255,255,0.65)', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.1)' }} className="menu-item">
                    <Space size="middle">
                        {item.icon}
                        <span>{item.title}</span>
                    </Space>
                </List.Item>
            )}
        />
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
         <Space direction="vertical" size="large" style={{ width: '100%' }}>
            
            {/* Row 1: User / Coin System */}
            <Row gutter={16}>
                <Col span={10}>
                    <Card title="用户系统" bordered={false}>
                        <Statistic title="当前金币" value={36} prefix={<PayCircleOutlined />} valueStyle={{ color: '#faad14' }} />
                    </Card>
                </Col>
                <Col span={14}>
                    <Card title="金币系统" bordered={false} extra={<Space><Link onClick={showCoinRecords}>获取记录</Link> <Link>用途说明</Link></Space>}>
                        <Statistic title="总金币" value={190.09} precision={2} />
                    </Card>
                </Col>
            </Row>

            {/* Row 2: Study Data */}
            <Row gutter={16}>
                <Col span={8}>
                    <Card title="总学习时长趋势" bordered={false}>
                        <div style={{ height: 200 }}>
                           <ResponsiveContainer width="100%" height="100%">
                               <LineChart data={totalStudyData}>
                                   <CartesianGrid strokeDasharray="3 3" />
                                   <XAxis dataKey="name" />
                                   <YAxis />
                                   <Tooltip />
                                   <Line type="monotone" dataKey="time" stroke="#1890ff" />
                               </LineChart>
                           </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
                <Col span={8}>
                    <Card title="每日/每周统计" bordered={false}>
                         <div style={{ height: 200 }}>
                           <ResponsiveContainer width="100%" height="100%">
                               <BarChart data={totalStudyData}>
                                   <CartesianGrid strokeDasharray="3 3" />
                                   <XAxis dataKey="name" />
                                   <YAxis />
                                   <Tooltip />
                                   <Bar dataKey="count" fill="#52c41a" />
                               </BarChart>
                           </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
                <Col span={8}>
                     <Card title="学习记录" bordered={false}>
                        <div style={{ height: 200 }}>
                           <ResponsiveContainer width="100%" height="100%">
                               <LineChart data={totalStudyData}>
                                   <CartesianGrid strokeDasharray="3 3" />
                                   <XAxis dataKey="name" />
                                   <YAxis />
                                   <Tooltip />
                                   <Line type="monotone" dataKey="time" stroke="#faad14" />
                               </LineChart>
                           </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Row 3: Growth System */}
            <Row gutter={16}>
                <Col span={8}>
                     <Card title="学习计划" bordered={false}>
                        <div style={{ height: 180, display: 'flex', justifyContent: 'center' }}>
                           <ResponsiveContainer width="100%" height="100%">
                               <PieChart>
                                   <Pie data={planData} innerRadius={40} outerRadius={70} fill="#8884d8" paddingAngle={5} dataKey="value">
                                       {planData.map((entry, index) => (
                                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                       ))}
                                   </Pie>
                                   <Tooltip />
                               </PieChart>
                           </ResponsiveContainer>
                        </div>
                        <div style={{ textAlign: 'center' }}>计划完成率: 75%</div>
                    </Card>
                </Col> 
                <Col span={8}>
                    <Card title="虚拟形象系统" bordered={false} extra={<Button type="link">去编辑</Button>}>
                         <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <Avatar size={64} style={{ backgroundColor: '#fde3cf', color: '#f56a00' }}>U</Avatar>
                         </div>
                         <Text>形象进度 (金色头发):</Text>
                         <Progress percent={26} status="active" />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card title="植物系统" bordered={false} extra={<Button size="small">合成</Button>}>
                        <Space size="large" wrap style={{ justifyContent: 'center', width: '100%' }}>
                            <div style={{ textAlign: 'center' }}><img src="https://via.placeholder.com/40" alt="plant" /><br/><Text type="secondary">仙人掌</Text></div>
                            <div style={{ textAlign: 'center' }}><img src="https://via.placeholder.com/40" alt="plant" /><br/><Text type="secondary">多肉</Text></div>
                            <div style={{ textAlign: 'center' }}><div style={{ width: 40, height: 40, background: '#eee', borderRadius: '50%' }} /><br/><Text type="secondary" disabled>未解锁</Text></div>
                            <div style={{ textAlign: 'center' }}><div style={{ width: 40, height: 40, background: '#eee', borderRadius: '50%' }} /><br/><Text type="secondary" disabled>未解锁</Text></div>
                        </Space>
                    </Card>
                </Col>
            </Row>
         </Space>
      </div>
    </div>
  );
}
