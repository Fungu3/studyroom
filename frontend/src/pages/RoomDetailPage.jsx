// frontend/src/pages/RoomDetailPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Card, Button, Space, Tag, Typography, message, List, Input, Row, Col, Tabs, Avatar, Badge, Switch, Tooltip, Modal, Statistic } from "antd";
import { UserOutlined, ClockCircleOutlined, TrophyOutlined, CloseOutlined, SendOutlined, InfoCircleOutlined, SettingOutlined } from '@ant-design/icons';

import { getRoom, createPomodoro, listPomodoros, getCoins } from "../api/rooms";
import PomodoroTimer from "../components/PomodoroTimer";

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

export default function RoomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const roomId = useMemo(() => Number(id), [id]);

  // User State
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("studyroom_user");
      if (raw) return JSON.parse(raw);
    } catch {}
    const idPart = Date.now().toString(36);
    return { id: idPart, name: "Guest" + idPart.slice(-4) };
  });

  // Room Data
  const [room, setRoom] = useState(null);
  const [loadingRoom, setLoadingRoom] = useState(false);
  
  // WS State
  const wsRef = useRef(null);
  const [wsStatus, setWsStatus] = useState("disconnected");
  const [members, setMembers] = useState([]);
  const [chatDraft, setChatDraft] = useState("");
  const [chatMessages, setChatMessages] = useState([]);

  // Pomodoro & Coins
  const [coins, setCoins] = useState(null);
  const [pomodoros, setPomodoros] = useState([]);

  useEffect(() => {
    fetchRoomData();
    // eslint-disable-next-line
  }, [roomId]);

  const fetchRoomData = async () => {
    setLoadingRoom(true);
    try {
      const data = await getRoom(roomId);
      setRoom(data);
      const c = await getCoins(roomId);
      setCoins(c);
      const p = await listPomodoros(roomId);
      setPomodoros(Array.isArray(p) ? p : []);
    } catch (e) {
      console.error(e);
      // message.error("Failed to load room data");
    } finally {
      setLoadingRoom(false);
    }
  };

  // WebSocket Logic
  useEffect(() => {
    const scheme = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${scheme}://${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus("connected");
      ws.send(JSON.stringify({ type: "join", payload: { roomId, user } }));
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (!msg.type) return;

        if (msg.type === "chatMessage") {
           setChatMessages(prev => [...prev, msg.payload].slice(-100));
        } else if (msg.type === "roomMembersUpdate") {
           setMembers(msg.payload.members || []);
        } else if (msg.type === "timerStatus") {
           // Update member status locally
           const { userId, status } = msg.payload;
           setMembers(prev => prev.map(m => m.id === userId ? { ...m, status } : m));
        }
      } catch (e) {
        console.error("WS Parse error", e);
      }
    };

    ws.onclose = () => setWsStatus("disconnected");

    return () => {
      if (ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, [roomId, user]);

  const sendMessage = () => {
      if (!chatDraft.trim()) return;
      wsRef.current?.send(JSON.stringify({ type: "chat", payload: { roomId, content: chatDraft } }));
      setChatDraft("");
  };

  const updateStatus = (status) => {
      wsRef.current?.send(JSON.stringify({ type: "timerStatus", payload: { status } }));
  };

  const handleExit = () => {
      Modal.confirm({
          title: '确认离开？',
          content: '中途退出将扣除 50% 金币奖励 (模拟)',
          onOk: () => navigate('/rooms')
      });
  };

  // Visual Round Table Layout
  const renderVisualTable = () => {
      const radius = 180;
      const centerX = 250;
      const centerY = 250;
      const angleStep = (2 * Math.PI) / (Math.max(members.length, 1) + (members.length === 0 ? 1 : 0));

      return (
          <div style={{ position: 'relative', width: 500, height: 500, margin: '0 auto', background: 'url(https://img.freepik.com/free-photo/empty-classroom-interior-with-wooden-desks_23-2148895066.jpg)', backgroundSize: 'cover', borderRadius: '16px', overflow:'hidden' }}>
              {/* Overlay */}
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
              
              {/* Table */}
              <div style={{ 
                  position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                  width: 250, height: 250, borderRadius: '50%', backgroundColor: '#8c5e26', border: '8px solid #5e3c17',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                  <div style={{ color: 'white', textAlign: 'center' }}>
                      <Title level={4} style={{ color: 'white', margin: 0 }}>Room {roomId}</Title>
                      <Text style={{ color: '#ddd' }}>{room?.subject}</Text>
                  </div>
              </div>

              {/* Members */}
              {members.map((member, index) => {
                  const angle = index * angleStep;
                  const x = centerX + radius * Math.cos(angle) - 32; // 32 is half width
                  const y = centerY + radius * Math.sin(angle) - 32;
                  
                  return (
                      <div key={member.id} style={{ position: 'absolute', left: x, top: y, textAlign: 'center' }}>
                          <Tooltip title={`${member.name} (${member.status || 'idle'})`}>
                                <Badge dot color={member.status === 'focusing' ? 'green' : 'gold'}>
                                    <Avatar size={64} style={{ backgroundColor: member.status === 'focusing' ? '#52c41a' : '#faad14' }} icon={<UserOutlined />} />
                                </Badge>
                          </Tooltip>
                          <div style={{ background: 'rgba(0,0,0,0.6)', borderRadius: 4, padding: '2px 4px', marginTop: 4 }}>
                              <Text style={{ color: 'white', fontSize: 12 }}>{member.name}</Text>
                          </div>
                      </div>
                  );
              })}
          </div>
      );
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header - Minimal for immersive feel */}
        <div style={{ padding: '0 24px', height: 64, background: '#001529', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <Space>
                 <Title level={4} style={{ color: 'white', margin: 0 }}>{room?.title || 'Loading...'}</Title>
                 <Tag>{room?.subject || ' 自习 '}</Tag>
             </Space>
             <Space>
                 <Button type="text" icon={<SettingOutlined />} style={{ color: 'white' }}>更多</Button>
                 <Button type="primary" danger icon={<CloseOutlined />} onClick={handleExit}>关闭</Button>
             </Space>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: 16, background: '#f0f2f5' }}>
            
            {/* Left: Info & Chat */}
            <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 16 }}>
                 <Card style={{ flex: 1, display: 'flex', flexDirection: 'column' }} bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 12 }}>
                    <Tabs defaultActiveKey="1" items={[
                        { key: '1', label: '聊天', children: (
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12 }}>
                                    <List
                                        size="small"
                                        dataSource={chatMessages}
                                        renderItem={msg => (
                                            <List.Item style={{ padding: '8px 0', border: 'none' }}>
                                                <div style={{ width: '100%' }}>
                                                     <Text type="secondary" style={{ fontSize: 10 }}>{msg.user?.name}</Text>
                                                     <div style={{ background: '#e6f7ff', padding: '8px 12px', borderRadius: 8, display: 'inline-block', maxWidth: '80%' }}>
                                                         {msg.content}
                                                     </div>
                                                </div>
                                            </List.Item>
                                        )}
                                    />
                                </div>
                                <Space.Compact style={{ width: '100%' }}>
                                    <Input value={chatDraft} onChange={e => setChatDraft(e.target.value)} onPressEnter={sendMessage} placeholder="说点什么..." />
                                    <Button type="primary" icon={<SendOutlined />} onClick={sendMessage} />
                                </Space.Compact>
                            </div>
                        )},
                        { key: '2', label: '信息', children: (
                            <Space direction="vertical">
                                <Text>ID: {roomId}</Text>
                                <Text>创建时间: {room?.createdAt}</Text>
                                <Text>描述: {room?.description}</Text>
                                <Divider style={{ margin: '12px 0' }} />
                                <Statistic title="在线人数" value={members.length} />
                                <Statistic title="累计金币" value={coins?.totalCoins || 0} precision={2} />
                            </Space>
                        )}
                    ]} />
                 </Card>
            </div>

            {/* Center: Visual Table */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                 {renderVisualTable()}
            </div>

            {/* Right: Collaboration */}
            <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 16 }}>
                 <Card title="番茄钟" extra={<Switch checkedChildren="专注" unCheckedChildren="休息" onChange={checked => updateStatus(checked ? 'focusing' : 'idle')} />}>
                      <PomodoroTimer 
                          initialMinutes={25} 
                          onStart={() => updateStatus('focusing')}
                          onStop={() => updateStatus('idle')}
                          onComplete={() => {
                              message.success("专注完成！金币 +5");
                              createPomodoro(roomId, { durationMinutes: 25, result: 'SUCCESS' })
                                  .then(() => {
                                      getCoins(roomId).then(setCoins);
                                      listPomodoros(roomId).then(p => setPomodoros(Array.isArray(p) ? p : []));
                                  })
                                  .catch(console.error);
                              updateStatus('idle');
                          }}
                      />
                 </Card>

                 <Card title="成员列表" style={{ flex: 1, overflowY: 'auto' }}>
                      <List
                          itemLayout="horizontal"
                          dataSource={members}
                          renderItem={item => (
                              <List.Item>
                                  <List.Item.Meta
                                      avatar={<Avatar style={{ backgroundColor: item.status === 'focusing' ? '#52c41a' : '#ccc' }} icon={<UserOutlined />} />}
                                      title={item.name}
                                      description={item.status === 'focusing' ? '专注中...' : '休息中'}
                                  />
                              </List.Item>
                          )}
                      />
                 </Card>

                 <Card size="small" title={<Space><TrophyOutlined /><span>专注榜</span></Space>}>
                      {/* Mock Ranking */}
                      <List
                          size="small"
                          dataSource={members.slice(0, 5)} // Mock sorting
                          renderItem={(item, i) => (
                              <List.Item>
                                  <Space>
                                      <Badge count={i+1} style={{ backgroundColor: i < 3 ? '#f5222d' : '#ccc' }} /> 
                                      {item.name}
                                  </Space>
                                  <Text type="secondary">2h 30m</Text>
                              </List.Item>
                          )}
                      />
                 </Card>
            </div>
        </div>
    </div>
  );
}
