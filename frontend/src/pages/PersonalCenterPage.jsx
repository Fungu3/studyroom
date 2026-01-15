// frontend/src/pages/PersonalCenterPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Card, Avatar, List, Typography, Row, Col, Progress, Button, Statistic, Modal, Space, Tabs, Divider } from 'antd';
import { UserOutlined, PayCircleOutlined, BookOutlined, CalendarOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getUserInfo } from '../api/system';

const { Title, Text, Link } = Typography;

// Mock Data
const studyData = {
    total: [
        { name: 'Jan', time: 1200 }, { name: 'Feb', time: 1400 }, { name: 'Mar', time: 1350 }, { name: 'Apr', time: 1600 },
        { name: 'May', time: 1800 }, { name: 'Jun', time: 2000 }, { name: 'Jul', time: 2100 },
    ],
    month: [
        { name: 'Week 1', time: 200 }, { name: 'Week 2', time: 300 }, { name: 'Week 3', time: 250 }, { name: 'Week 4', time: 280 }
    ],
    week: [
        { name: 'Mon', time: 120 }, { name: 'Tue', time: 150 }, { name: 'Wed', time: 180 }, { name: 'Thu', time: 90 },
        { name: 'Fri', time: 240 }, { name: 'Sat', time: 300 }, { name: 'Sun', time: 200 },
    ],
    day: [
        { name: '06:00', time: 0 }, { name: '09:00', time: 45 }, { name: '12:00', time: 60 }, { name: '15:00', time: 45 },
        { name: '18:00', time: 30 }, { name: '21:00', time: 60 },
    ]
};

const planData = [
  { name: 'Completed', value: 75 },
  { name: 'Remaining', value: 25 },
];

const COLORS = ['#52c41a', '#f0f2f5'];

export default function PersonalCenterPage() {
  const [activeTab, setActiveTab] = useState('total');
    const [activeSection, setActiveSection] = useState('profile');
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
        try {
            const stored = localStorage.getItem("studyroom_user");
            if (!stored) return;
            const userObj = JSON.parse(stored);
            if (!userObj || !userObj.id) return;
            
            const data = await getUserInfo(userObj.id);
            setUserInfo(data);
        } catch(e) {
            console.error(e);
        }
    };
    fetchUser();
  }, []);

  // Days since registration
  const daysJoined = userInfo && userInfo.createdAt 
      ? Math.floor((new Date() - new Date(userInfo.createdAt)) / (1000 * 60 * 60 * 24)) 
      : 0;
  
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

  const chartItems = [
      { key: 'total', label: '总学习时长' },
      { key: 'month', label: '本月' },
      { key: 'week', label: '本周' },
      { key: 'day', label: '今天' },
  ];

  const menuItems = useMemo(() => ([
      { key: 'profile', title: '用户信息', icon: <UserOutlined /> },
      { key: 'study', title: '学习与金币', icon: <BookOutlined /> },
      { key: 'garden', title: '植物和虚拟形象', icon: <PayCircleOutlined /> },
  ]), []);

  const renderProfile = () => (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card title="基本账户信息" bordered={false}>
              <Row gutter={16} align="middle">
                  <Col span={6} style={{ textAlign: 'center' }}>
                      <Avatar size={80} icon={<UserOutlined />} />
                      <div style={{ marginTop: 12, fontSize: 16 }}>{userInfo?.username || 'Guest'}</div>
                  </Col>
                  <Col span={18}>
                      <Row gutter={[16, 16]}>
                          <Col span={12}>
                              <Statistic title="用户ID" value={userInfo?.id || '-'} prefix={<UserOutlined />} />
                          </Col>
                          <Col span={12}>
                              <Statistic title="注册天数" value={daysJoined} suffix="天" prefix={<CalendarOutlined />} />
                          </Col>
                          <Col span={12}>
                              <Statistic title="累计学习时长(分)" value={userInfo?.totalStudyTimeMinutes || 0} />
                          </Col>
                          <Col span={12}>
                              <Statistic title="当前金币" value={userInfo?.coins || 0} precision={2} prefix={<PayCircleOutlined />} valueStyle={{ color: '#faad14' }} />
                          </Col>
                      </Row>
                  </Col>
              </Row>
          </Card>
          <Card title="安全与偏好" bordered={false}>
              <Row gutter={16}>
                  <Col span={12}><Text type="secondary">邮箱</Text><div>{userInfo?.email || '未绑定'}</div></Col>
                  <Col span={12}><Text type="secondary">手机号</Text><div>{userInfo?.phone || '未绑定'}</div></Col>
              </Row>
          </Card>
      </Space>
  );

  const renderStudyAndCoins = () => (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={16}>
              <Col span={10}>
                  <Card title="相遇时光" bordered={false}>
                      <Statistic title="我们已经相遇" value={daysJoined} suffix="天" prefix={<CalendarOutlined />} valueStyle={{ color: '#1890ff' }} />
                  </Card>
              </Col>
              <Col span={14}>
                  <Card title="金币钱包" bordered={false} extra={<Space><Link onClick={showCoinRecords}>获取记录</Link> <Link>用途说明</Link></Space>}>
                       <Row gutter={16}>
                           <Col span={12}>
                               <Statistic title="当前持有" value={userInfo?.coins || 0} precision={2} prefix={<PayCircleOutlined />} valueStyle={{ color: '#faad14' }} />
                           </Col>
                           <Col span={12}>
                               <Statistic title="学习总时长(分)" value={userInfo?.totalStudyTimeMinutes || 0} />
                           </Col>
                       </Row>
                  </Card>
              </Col>
          </Row>

          <Card 
              title={<Title level={5} style={{ margin: 0 }}>学习时长统计</Title>} 
              bordered={false}
              extra={
                  <Tabs 
                      activeKey={activeTab} 
                      onChange={setActiveTab}
                      items={chartItems}
                      type="card"
                      size="small"
                      tabBarStyle={{ marginBottom: 0 }}
                  />
              }
          >
              <div style={{ height: 320, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={studyData[activeTab]} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line 
                              type="monotone" 
                              dataKey="time" 
                              name="时长 (分钟)" 
                              stroke="#1890ff" 
                              strokeWidth={2}
                              dot={{ r: 4 }}
                              activeDot={{ r: 6 }}
                          />
                      </LineChart>
                  </ResponsiveContainer>
              </div>
          </Card>

          <Row gutter={16}>
              <Col span={12}>
                   <Card title="学习计划" bordered={false}>
                      <div style={{ height: 200, display: 'flex', justifyContent: 'center' }}>
                         <ResponsiveContainer width="100%" height="100%">
                             <PieChart>
                                 <Pie data={planData} innerRadius={50} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">
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
              <Col span={12}>
                   <Card title="学习记录" bordered={false}>
                       <List
                           dataSource={[
                               { time: '2023-10-27 10:00', content: '专注 30 分钟' },
                               { time: '2023-10-27 11:00', content: '专注 45 分钟' },
                               { time: '2023-10-27 12:30', content: '专注 25 分钟' },
                           ]}
                           renderItem={item => (
                               <List.Item>
                                   <Text>{item.time}</Text>
                                   <Text type="secondary">{item.content}</Text>
                               </List.Item>
                           )}
                       />
                   </Card>
              </Col>
          </Row>
      </Space>
  );

  const renderGarden = () => (
      <div style={{ display: 'flex', gap: 24, height: '100%' }}>
          <Card title="植物系统" bordered={false} style={{ flex: 1, height: '100%' }} bodyStyle={{ height: 'calc(100% - 57px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }} extra={<Button size="small">合成</Button>}>
              <Space size="large" wrap style={{ justifyContent: 'center', width: '100%' }}>
                  <div style={{ textAlign: 'center' }}><img src="https://via.placeholder.com/64" alt="plant" /><br/><Text type="secondary">仙人掌</Text></div>
                  <div style={{ textAlign: 'center' }}><img src="https://via.placeholder.com/64" alt="plant" /><br/><Text type="secondary">多肉</Text></div>
                  <div style={{ textAlign: 'center' }}><div style={{ width: 64, height: 64, background: '#eee', borderRadius: '50%' }} /><br/><Text type="secondary" disabled>未解锁</Text></div>
                  <div style={{ textAlign: 'center' }}><div style={{ width: 64, height: 64, background: '#eee', borderRadius: '50%' }} /><br/><Text type="secondary" disabled>未解锁</Text></div>
              </Space>
          </Card>
          <Card title="虚拟形象系统" bordered={false} style={{ flex: 1, height: '100%' }} bodyStyle={{ height: 'calc(100% - 57px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }} extra={<Button type="link">去编辑</Button>}>
               <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <Avatar size={96} style={{ backgroundColor: '#fde3cf', color: '#f56a00' }}>U</Avatar>
               </div>
               <Divider style={{ margin: '0 0 16px' }} />
               <Text>形象进度 (金色头发):</Text>
               <Progress percent={26} status="active" />
          </Card>
      </div>
  );

  return (
        <div style={{ display: 'flex', height: 'calc(100vh - 64px)', width: '100%', backgroundColor: '#f0f2f5' }}>
      {/* Left Sidebar */}
      <div style={{ width: '250px', backgroundColor: '#001529', color: 'white', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '24px', textAlign: 'center', borderBottom: '1px solid #1890ff' }}>
           <Title level={4} style={{ color: 'white' }}>账户信息</Title>
           <Avatar size={64} icon={<UserOutlined />} style={{ marginBottom: 16 }} />
           <div style={{ fontSize: '16px' }}>{userInfo?.username || 'Guest'}</div>
        </div>
        <List
            dataSource={menuItems}
            renderItem={item => (
                <List.Item
                    onClick={() => setActiveSection(item.key)}
                    style={{
                        padding: '16px 24px',
                        cursor: 'pointer',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        color: activeSection === item.key ? 'white' : 'rgba(255,255,255,0.65)',
                        background: activeSection === item.key ? 'rgba(24,144,255,0.25)' : 'transparent'
                    }}
                    className="menu-item"
                >
                    <Space size="middle">
                        {item.icon}
                        <span>{item.title}</span>
                    </Space>
                </List.Item>
            )}
        />
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '24px', overflow: 'hidden' }}>
          <div style={{ height: '100%', overflowY: activeSection === 'garden' ? 'hidden' : 'auto' }}>
              {activeSection === 'profile' && renderProfile()}
              {activeSection === 'study' && renderStudyAndCoins()}
              {activeSection === 'garden' && renderGarden()}
          </div>
      </div>
    </div>
  );
}
