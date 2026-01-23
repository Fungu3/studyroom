// frontend/src/pages/PersonalCenterPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Card, Avatar, List, Typography, Row, Col, Progress, Button, Statistic, Modal, Space, Tabs, Divider } from 'antd';
import { UserOutlined, PayCircleOutlined, BookOutlined, CalendarOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getUserInfo } from '../api/system';
import './PersonalCenterPage.css';

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
          <Card title="基本账户信息" bordered={false} className="cute-card">
              <Row gutter={16} align="middle">
                  <Col span={6} style={{ textAlign: 'center' }}>
                      <div className="cute-avatar-wrapper">
                        <Avatar size={80} icon={<UserOutlined />} className="cute-profile-avatar" style={{ backgroundColor: '#E3F4FF', color: '#555555' }} />
                      </div>
                      <div style={{ marginTop: 12, fontSize: 16, fontWeight: 'bold', color: '#555555' }}>{userInfo?.username || 'Guest'}</div>
                  </Col>
                  <Col span={18}>
                      <Row gutter={[16, 16]}>
                          <Col span={12}>
                              <Statistic className="cute-stat-val cute-stat-title" title="用户ID" value={userInfo?.id || '-'} prefix={<UserOutlined />} />
                          </Col>
                          <Col span={12}>
                              <Statistic className="cute-stat-val cute-stat-title" title="注册天数" value={daysJoined} suffix="天" prefix={<CalendarOutlined />} />
                          </Col>
                          <Col span={12}>
                              <Statistic className="cute-stat-val cute-stat-title" title="累计学习时长(分)" value={userInfo?.totalStudyTimeMinutes || 0} />
                          </Col>
                          <Col span={12}>
                              {/* Coin specific class added */}
                              <Statistic className="cute-stat-coin cute-stat-title" title="当前金币" value={userInfo?.coins || 0} precision={2} prefix={<PayCircleOutlined />} />
                          </Col>
                      </Row>
                  </Col>
              </Row>
          </Card>
          <Card title="安全与偏好" bordered={false} className="cute-card">
              <Row gutter={16}>
                  <Col span={12}><Text className="cute-text">邮箱</Text><div className="cute-text-aux" style={{ fontSize: 16 }}>{userInfo?.email || '未绑定'}</div></Col>
                  <Col span={12}><Text className="cute-text">手机号</Text><div className="cute-text-aux" style={{ fontSize: 16 }}>{userInfo?.phone || '未绑定'}</div></Col>
              </Row>
          </Card>
      </Space>
  );

  const renderStudyAndCoins = () => (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={16}>
              <Col span={10}>
                  <Card title="相遇时光" bordered={false} className="cute-card">
                      <Statistic className="cute-stat-val cute-stat-title" title="我们已经相遇" value={daysJoined} suffix="天" prefix={<CalendarOutlined />} />
                  </Card>
              </Col>
              <Col span={14}>
                  <Card title="金币钱包" bordered={false} className="cute-card" extra={<Space><Link onClick={showCoinRecords} className="cute-text">获取记录</Link> <Link className="cute-text">用途说明</Link></Space>}>
                       <Row gutter={16}>
                           <Col span={12}>
                               {/* Coin specific class added */}
                               <Statistic className="cute-stat-coin cute-stat-title" title="当前持有" value={userInfo?.coins || 0} precision={2} prefix={<PayCircleOutlined />} />
                           </Col>
                           <Col span={12}>
                               <Statistic className="cute-stat-val cute-stat-title" title="学习总时长(分)" value={userInfo?.totalStudyTimeMinutes || 0} />
                           </Col>
                       </Row>
                  </Card>
              </Col>
          </Row>

          <Card 
              title={<span className="card-custom-title">学习时长统计</span>} 
              bordered={false}
              className="cute-card"
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
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8FFF2" />
                          <XAxis dataKey="name" stroke="#555555" />
                          <YAxis stroke="#555555" />
                          <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                          <Legend />
                          <Line 
                              type="monotone" 
                              dataKey="time" 
                              name="时长 (分钟)" 
                              stroke="#87CEFA" 
                              strokeWidth={3}
                              dot={{ r: 4, fill: '#87CEFA' }}
                              activeDot={{ r: 6, fill: '#FFB6C1' }}
                          />
                      </LineChart>
                  </ResponsiveContainer>
              </div>
          </Card>

          <Row gutter={16}>
              <Col span={12}>
                   <Card title="学习计划" bordered={false} className="cute-card">
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
                      <div style={{ textAlign: 'center', color: '#555555' }}>计划完成率: <span style={{ color: '#FAAD14', fontWeight: 'bold', fontSize: '18px' }}>75%</span></div>
                   </Card>
              </Col>
              <Col span={12}>
                   <Card title="学习记录" bordered={false} className="cute-card">
                       <List
                           dataSource={[
                               { time: '2023-10-27 10:00', content: '专注 30 分钟' },
                               { time: '2023-10-27 11:00', content: '专注 45 分钟' },
                               { time: '2023-10-27 12:30', content: '专注 25 分钟' },
                           ]}
                           renderItem={item => (
                               <List.Item className="cute-list-item">
                                   <Text className="cute-text">{item.time}</Text>
                                   <Text className="cute-text" type="secondary">{item.content}</Text>
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
          <Card title="植物系统" bordered={false} className="cute-card" style={{ flex: 1, height: '100%' }} bodyStyle={{ height: 'calc(100% - 57px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }} extra={<Button size="small">合成</Button>}>
              <Space size="large" wrap style={{ justifyContent: 'center', width: '100%' }}>
                  <div style={{ textAlign: 'center' }}><img src="/plant-cactus.png" alt="仙人掌" style={{borderRadius: '50%', border: '2px solid #E8FFF2'}} /><br/><Text className="cute-text">仙人掌</Text></div>
                  <div style={{ textAlign: 'center' }}><img src="/plant-succulent.png" alt="多肉" style={{borderRadius: '50%', border: '2px solid #E8FFF2'}} /><br/><Text className="cute-text">多肉</Text></div>
                  <div style={{ textAlign: 'center' }}><div style={{ width: 64, height: 64, background: '#F0F0F0', borderRadius: '50%', border: '2px dashed #E8FFF2' }} /><br/><Text className="cute-text" disabled>未解锁</Text></div>
                  <div style={{ textAlign: 'center' }}><div style={{ width: 64, height: 64, background: '#F0F0F0', borderRadius: '50%', border: '2px dashed #E8FFF2' }} /><br/><Text className="cute-text" disabled>未解锁</Text></div>
              </Space>
          </Card>
        <Card title="虚拟形象系统" bordered={false} className="cute-card" style={{ flex: 1, height: '100%' }} bodyStyle={{ height: 'calc(100% - 57px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} extra={<Button type="link">去编辑</Button>}>
            <div style={{ width: '100%', height: '92%', borderRadius: 16, overflow: 'hidden', background: '#E3F4FF' }}>
                  <img
                      src="/virtual-avatar.png"
                      alt="virtual-avatar"
                      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  />
               </div>
               <div style={{ marginTop: 8 }}>
                   <Text className="cute-text">形象进度 (金色头发):</Text>
                   <Progress percent={60} status="active" strokeColor="#FFFACD" trailColor="#E3F4FF" />
               </div>
          </Card>
      </div>
  );

  return (
    <div className="cute-page-container">
      {/* Floating Background Elements */}
      <div className="floating-elements-container">
          <div className="float-item cloud large" style={{ top: '15%', left: '-10%', animationDelay: '0s' }}></div>
          <div className="float-item cloud medium" style={{ top: '65%', left: '110%', animationDelay: '-20s', animationDuration: '70s' }}></div>
          <div className="float-item cloud large" style={{ top: '35%', left: '120%', animationDelay: '-40s' }}></div>
          <div className="float-item cloud medium" style={{ top: '85%', left: '-20%', animationDelay: '-10s', animationDuration: '80s' }}></div>
          <div className="float-item rainbow" style={{ bottom: '5%', right: '5%', transform: 'scale(0.8) rotate(-5deg)', animationDelay: '-20s' }}></div>
      </div>

      {/* Left Sidebar */}
      <div className="cute-sidebar">
        <div className="cute-sidebar-header">
             <div className="cute-avatar-wrapper">
                <Avatar size={64} icon={<UserOutlined />} className="cute-profile-avatar" style={{ backgroundColor: '#E3F4FF', color: '#555555' }} />
             </div>
             <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#555555' }}>{userInfo?.username || 'Guest'}</div>
        </div>
        <List
            dataSource={menuItems}
            split={false}
            renderItem={item => (
                <div 
                    className={`cute-nav-item ${activeSection === item.key ? 'active' : ''}`}
                    onClick={() => setActiveSection(item.key)}
                >
                    {item.icon}
                    <span>{item.title}</span>
                </div>
            )}
        />
      </div>

      {/* Main Content */}
      <div className="cute-main-content">
          <div style={{ height: '100%', overflowY: activeSection === 'garden' ? 'hidden' : 'auto', paddingRight: 8 }}>
              {activeSection === 'profile' && renderProfile()}
              {activeSection === 'study' && renderStudyAndCoins()}
              {activeSection === 'garden' && renderGarden()}
          </div>
      </div>
    </div>
  );
}
