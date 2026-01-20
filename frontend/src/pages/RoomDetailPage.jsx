import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import {
    Avatar,
    Button,
    List,
    Input,
    message,
    Modal,
    Typography,
    Tooltip,
    Badge,
    Popover,
    Drawer,
    Statistic,
    Space,
    Tag,
    Form,
    InputNumber,
    Divider
} from "antd";
import {
    UserOutlined,
    ArrowLeftOutlined,
    MessageOutlined,
    TeamOutlined,
    ExperimentOutlined,
    BarChartOutlined,
    PlayCircleFilled,
    PauseCircleFilled,
    ReloadOutlined,
    PlusOutlined,
    UpOutlined,
    DownOutlined,
    SettingOutlined,
    CheckCircleOutlined
} from "@ant-design/icons";

import { getRoom, createPomodoro, listPomodoros, getCoins } from "../api/rooms";
import "./RoomDetailPage.css";

const { Text, Title } = Typography;

const formatTime = (seconds) => {
    const safe = Math.max(0, seconds);
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export default function RoomDetailPage() {
    const { id } = useParams();
    const roomId = useMemo(() => Number(id), [id]);
    const isRoomIdValid = Number.isFinite(roomId) && roomId > 0;

    // --- User State ---
    const [user, setUser] = useState(() => {
        try {
            const raw = localStorage.getItem("studyroom_user");
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === "object") {
                    return {
                        id: String(parsed.id || ""),
                        name: String(parsed.username || parsed.name || "").trim() || "游客",
                    };
                }
            }
        } catch {}
        const idPart = typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        return { id: idPart, name: "游客" };
    });

    const persistUser = (next) => {
        setUser(next);
        try {
            localStorage.setItem("studyroom_user", JSON.stringify(next));
        } catch {}
    };

    // --- Room Data State ---
    const [room, setRoom] = useState(null);
    const [members, setMembers] = useState([]);
    const [coins, setCoins] = useState(null);
    const [pomodoros, setPomodoros] = useState([]);
    
    // --- UI State ---
    const [currentTime, setCurrentTime] = useState(new Date());
    const [activeSidebar, setActiveSidebar] = useState(null); // 'chat', 'members', 'plants', 'records'
    const [todoPanelOpen, setTodoPanelOpen] = useState(false);

    // --- Pomodoro State ---
    const [pomoStatus, setPomoStatus] = useState("idle"); // idle, running, paused
    const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [completedCount, setCompletedCount] = useState(0);
    const [totalStudyTime, setTotalStudyTime] = useState(0);
    const timerRef = useRef(null);

    // --- Task/Todo State ---
    const [tasks, setTasks] = useState([]);
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [taskForm] = Form.useForm();

    // --- Chat State ---
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");

    // --- WebSocket ---
    const wsRef = useRef(null);
    const [wsStatus, setWsStatus] = useState("disconnected");

    const wsSend = (msgObj) => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        ws.send(JSON.stringify(msgObj));
    };

    // --- Effects: Data Loading ---
    const refreshAll = useCallback(async () => {
        if (!isRoomIdValid) return;
        try {
            const r = await getRoom(roomId);
            setRoom(r);
            const c = await getCoins(roomId);
            setCoins(c);
            const p = await listPomodoros(roomId);
            setPomodoros(Array.isArray(p) ? p : []);
        } catch (e) {
            console.error(e);
        }
    }, [roomId, isRoomIdValid]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Recalculate local stats from pomodoros
    useEffect(() => {
        const completed = pomodoros.filter(p => p.result === 'SUCCESS');
        setCompletedCount(completed.length);
        const mins = completed.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
        setTotalStudyTime(mins);
    }, [pomodoros]);

    // --- Effects: WebSocket ---
    useEffect(() => {
        if (!isRoomIdValid) return;

        const scheme = window.location.protocol === "https:" ? "wss" : "ws";
        const wsBaseEnv = (import.meta.env.VITE_WS_BASE || import.meta.env.VITE_API_BASE || "").trim();
        const normalizedBase = wsBaseEnv.replace(/\/+$/, "");
        const wsBase = normalizedBase
            ? normalizedBase.replace(/^https:/i, "wss:").replace(/^http:/i, "ws:")
            : `${scheme}://${window.location.host}`;
        const wsUrl = `${wsBase}/ws`;

        setWsStatus("connecting");
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            setWsStatus("connected");
            ws.send(JSON.stringify({ type: "join", payload: { roomId, user } }));
        };

        ws.onmessage = (ev) => {
            let msgObj;
            try { msgObj = JSON.parse(ev.data); } catch { return; }
            const { type, payload } = msgObj || {};
            if (!type) return;

            if (type === "joined") {
                if (payload?.user?.id && payload.user.id !== user.id) {
                    persistUser({ ...user, id: String(payload.user.id) });
                }
            } else if (type === "roomMembersUpdate") {
                setMembers(Array.isArray(payload?.members) ? payload.members : []);
            } else if (type === "chatMessage") {
                setChatMessages((prev) => [...prev, payload].slice(-200));
            } else if (type === "timerStatus") {
                const { userId, status } = payload || {};
                if (userId) {
                    setMembers(prev => prev.map(m => m.id === userId ? { ...m, status } : m));
                }
            }
        };

        ws.onclose = () => setWsStatus("disconnected");
        ws.onerror = () => setWsStatus("disconnected");

        return () => {
            if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "leave", payload: {} }));
            ws.close();
            wsRef.current = null;
        };
    }, [roomId, isRoomIdValid]); // eslint-disable-line

    // --- Effects: Timer ---
    useEffect(() => {
        if (pomoStatus === "running") {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        handleCompleteTimer();
                        return pomodoroMinutes * 60;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [pomoStatus, pomodoroMinutes]);

    const handleCompleteTimer = () => {
        setPomoStatus("idle");
        wsSend({ type: "timerStatus", payload: { status: "idle" } });
        
        // Auto-submit SUCCESS? Or ask user? The requirement implies "Controls" but let's just log it.
        // For immersive mode, let's just complete it and show message.
        message.success("专注周期结束！");
        createPomodoro(roomId, { durationMinutes: pomodoroMinutes, result: "SUCCESS", userId: Number(user.id) })
            .then(() => refreshAll())
            .catch(e => console.error(e));
    };

    const toggleTimer = () => {
        if (pomoStatus === "running") {
            setPomoStatus("paused");
            wsSend({ type: "timerStatus", payload: { status: "idle" } }); // or paused
        } else {
            setPomoStatus("running");
            wsSend({ type: "timerStatus", payload: { status: "focusing" } });
        }
    };

    const resetTimer = () => {
        setPomoStatus("idle");
        setTimeLeft(pomodoroMinutes * 60);
        wsSend({ type: "timerStatus", payload: { status: "idle" } });
    };

    // --- Actions ---
    const handleSendMessage = () => {
        const text = chatInput.trim();
        if (!text) return;
        wsSend({ type: "chat", payload: { roomId, content: text } });
        setChatInput("");
    };

    const handleAddTask = async () => {
        const values = await taskForm.validateFields();
        const newTask = {
            id: Date.now(),
            title: values.title,
            done: false
        };
        setTasks([newTask, ...tasks]);
        setTaskModalOpen(false);
        taskForm.resetFields();
    };

    const toggleTask = (id) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
    };

    const toggleSidebar = (panel) => {
        setActiveSidebar(activeSidebar === panel ? null : panel);
    };

    // --- Sub-renderers ---
    const renderSidebarContent = () => {
        switch (activeSidebar) {
            case 'chat':
                return (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Title level={5} style={{ marginBottom: 16 }}>💬 房间聊天</Title>
                        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12 }}>
                            <List
                                dataSource={chatMessages}
                                split={false}
                                renderItem={m => (
                                    <List.Item style={{ padding: '8px 0', border: 'none' }}>
                                        <div style={{ width: '100%' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#999', marginBottom: 4 }}>
                                                <span>{m?.user?.name || '未知'}</span>
                                                <span>{m?.ts ? new Date(m.ts).toLocaleTimeString() : ''}</span>
                                            </div>
                                            <div style={{ 
                                                background: m?.user?.id === user.id ? '#E6F7FF' : '#F5F5F5', 
                                                padding: '8px 12px', 
                                                borderRadius: 8,
                                                display: 'inline-block' 
                                            }}>
                                                {m?.content}
                                            </div>
                                        </div>
                                    </List.Item>
                                )}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <Input 
                                value={chatInput} 
                                onChange={e => setChatInput(e.target.value)} 
                                onPressEnter={handleSendMessage}
                                placeholder="说点什么..." 
                            />
                            <Button type="primary" icon={<MessageOutlined />} onClick={handleSendMessage} />
                        </div>
                    </div>
                );
            case 'members':
                return (
                    <div>
                        <Title level={5} style={{ marginBottom: 16 }}>👥 在线成员</Title>
                         <List
                            dataSource={members}
                            renderItem={m => (
                                <List.Item>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                             <Space>
                                                <span style={{ fontWeight: 500 }}>{m.name}</span>
                                                {m.id === user.id && <Tag color="purple">我</Tag>}
                                             </Space>
                                              <Tag color={m.status === 'focusing' ? 'green' : 'default'} style={{ width: 'fit-content', marginTop: 4 }}>
                                                    {m.status === 'focusing' ? '专注中' : '休息中'}
                                              </Tag>
                                        </div>
                                        {/* Avatar on the right */}
                                        <Avatar size={32} style={{ backgroundColor: '#93A9D1' }}>{m.name?.[0]?.toUpperCase()}</Avatar>
                                    </div>
                                </List.Item>
                            )}
                        />
                    </div>
                );
            case 'plants':
                return (
                    <div style={{ textAlign: 'center', paddingTop: 40 }}>
                         <Title level={5}>🌱 我的植物</Title>
                         <div style={{ fontSize: 80, color: '#95B46A', margin: '30px 0' }}>
                             <ExperimentOutlined />
                         </div>
                         <Text>积累经验值: {coins?.totalCoins || 0}</Text>
                         {/* A fake progress bar */}
                         <div style={{ marginTop: 20 }}>
                             <Tag color="cyan">Level 1</Tag>
                             <div style={{ height: 6, background: '#eee', borderRadius: 3, marginTop: 8 }}>
                                 <div style={{ width: '40%', height: '100%', background: '#95B46A', borderRadius: 3 }}></div>
                             </div>
                         </div>
                    </div>
                );
            case 'records':
                return (
                    <div>
                        <Title level={5} style={{ marginBottom: 16 }}>📊 专注记录</Title>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Statistic title="累计时长" value={totalStudyTime} suffix="min" />
                            <Statistic title="番茄钟数" value={completedCount} />
                            <Divider />
                            <Title level={5} style={{ fontSize: 14 }}>最近历史</Title>
                            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                                <List
                                    size="small"
                                    dataSource={pomodoros}
                                    renderItem={p => (
                                        <List.Item>
                                            <Space>
                                                <Tag color={p.result === 'SUCCESS' ? 'green' : 'red'}>{p.result}</Tag>
                                                <span>{p.durationMinutes}min</span>
                                            </Space>
                                        </List.Item>
                                    )}
                                />
                            </div>
                        </Space>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="room-page">
            {/* 1. Top Navigation */}
            <header className="top-nav">
                <div className="nav-left">
                    <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()} />
                    <div className="logo-text">StudyRoom</div>
                </div>
                <div className="nav-center">
                    <div className="room-title">{room?.title || "自习室"}</div>
                    <div className="online-count">
                        <Badge status="success" /> {members.length} 人在线
                    </div>
                </div>
                <div className="nav-right">
                    <Popover 
                        trigger="click"
                        placement="bottomRight"
                        title="个人设置"
                        content={
                            <div style={{ width: 200 }}>
                                <Form layout="vertical">
                                    <Form.Item label="昵称">
                                        <Input 
                                            value={user.name} 
                                            onChange={e => persistUser({...user, name: e.target.value})} 
                                            onBlur={() => wsSend({ type: "join", payload: { roomId, user } })}
                                        />
                                    </Form.Item>
                                </Form>
                                <Divider style={{ margin: '8px 0' }} />
                                <Text type="secondary" style={{ fontSize: 12 }}>ID: {user.id}</Text>
                            </div>
                        }
                    >
                        <Avatar 
                            style={{ backgroundColor: '#93A9D1', cursor: 'pointer' }} 
                            src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.id}`}
                        >
                            {user.name?.[0]}
                        </Avatar>
                    </Popover>
                </div>
            </header>

            {/* 2. Main Visual Area */}
            <main className="main-area">
                <div className="immersive-zone">
                    <div className="timer-container">
                        <div 
                            className={`timer-display ${pomoStatus === 'running' ? 'timer-breathing' : ''}`}
                            style={{ 
                                color: pomoStatus === 'paused' ? '#ccc' : 'var(--morandi-text-primary)' 
                            }}
                        >
                            {formatTime(timeLeft)}
                        </div>
                        
                        {/* Real-time Clock */}
                        <div style={{ fontSize: '14px', color: '#999', marginTop: '-10px', marginBottom: '24px' }}>
                             北京时间 {currentTime.toLocaleTimeString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' })}
                        </div>

                        {/* Controls */}
                        <div className="timer-controls" style={{ marginBottom: '32px', display: 'flex', gap: '24px', justifyContent: 'center', alignItems: 'center' }}>
                            <Tooltip title="重置">
                                <Button shape="circle" icon={<ReloadOutlined />} onClick={resetTimer} size="large" className="btn-reset" />
                            </Tooltip>
                            
                            <Tooltip title={pomoStatus === 'paused' ? "继续" : "开始"}>
                                 <button 
                                    className={`control-btn-circle btn-start`}
                                    onClick={() => { if(pomoStatus !== 'running') toggleTimer(); }}
                                    style={{ 
                                        opacity: pomoStatus === 'running' ? 0.5 : 1, 
                                        cursor: pomoStatus === 'running' ? 'not-allowed' : 'pointer',
                                        filter: pomoStatus === 'running' ? 'grayscale(100%)' : 'none'
                                    }}
                                    disabled={pomoStatus === 'running'}
                                >
                                    <PlayCircleFilled />
                                </button>
                            </Tooltip>

                             <Tooltip title="暂停">
                                 <button 
                                    className={`control-btn-circle btn-pause`}
                                    onClick={() => { if(pomoStatus === 'running') toggleTimer(); }}
                                    style={{ 
                                        opacity: pomoStatus !== 'running' ? 0.5 : 1, 
                                        cursor: pomoStatus !== 'running' ? 'not-allowed' : 'pointer',
                                        filter: pomoStatus !== 'running' ? 'grayscale(100%)' : 'none'
                                    }}
                                    disabled={pomoStatus !== 'running'}
                                >
                                    <PauseCircleFilled />
                                </button>
                            </Tooltip>
                        </div>

                        <div className="study-stats">
                            <div className="stat-item">
                                <div className="stat-value">{completedCount}</div>
                                <div className="stat-label">番茄钟</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-value">{totalStudyTime}m</div>
                                <div className="stat-label">专注时长</div>
                            </div>
                        </div>
                    </div>

                    {/* Collapsible Todo Panel */}
                    {todoPanelOpen ? (
                        <div className="todo-panel">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <Text strong>待办列表 ({tasks.filter(t => !t.done).length})</Text>
                                <Button type="text" size="small" icon={<DownOutlined />} onClick={() => setTodoPanelOpen(false)} />
                            </div>
                            <List
                                size="small"
                                dataSource={tasks}
                                renderItem={t => (
                                    <List.Item onClick={() => toggleTask(t.id)} style={{ cursor: 'pointer' }}>
                                        <Space>
                                            {t.done ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <div style={{ width: 14, height: 14, border: '1px solid #ccc', borderRadius: '50%' }} />}
                                            <Text delete={t.done} type={t.done ? 'secondary' : ''}>{t.title}</Text>
                                        </Space>
                                    </List.Item>
                                )}
                            />
                            {tasks.length === 0 && <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>暂无任务</div>}
                        </div>
                    ) : (
                        <div className="todo-drawer-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                            <div onClick={() => setTodoPanelOpen(true)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <UpOutlined /> 学习任务待办
                            </div>
                            <Tooltip title="添加任务">
                                <Button 
                                    type="text" 
                                    size="small" 
                                    shape="circle"
                                    icon={<PlusOutlined />} 
                                    onClick={(e) => { e.stopPropagation(); setTaskModalOpen(true); }}
                                    style={{ border: '1px solid #eee' }}
                                />
                            </Tooltip>
                        </div>
                    )}
                </div>

                {/* 3. Right Sidebar */}
                <div className="right-sidebar" style={{ width: activeSidebar ? 360 : 64 }}>
                    <div className="sidebar-icons">
                        <Tooltip title="聊天" placement="left">
                            <div className={`icon-btn ${activeSidebar === 'chat' ? 'active' : ''}`} onClick={() => toggleSidebar('chat')}>
                                <MessageOutlined />
                            </div>
                        </Tooltip>
                        <Tooltip title="在线成员" placement="left">
                            <div className={`icon-btn ${activeSidebar === 'members' ? 'active' : ''}`} onClick={() => toggleSidebar('members')}>
                                <TeamOutlined />
                            </div>
                        </Tooltip>
                        <Tooltip title="植物" placement="left">
                            <div className={`icon-btn ${activeSidebar === 'plants' ? 'active' : ''}`} onClick={() => toggleSidebar('plants')}>
                                <ExperimentOutlined />
                            </div>
                        </Tooltip>
                        <Tooltip title="记录" placement="left">
                            <div className={`icon-btn ${activeSidebar === 'records' ? 'active' : ''}`} onClick={() => toggleSidebar('records')}>
                                <BarChartOutlined />
                            </div>
                        </Tooltip>
                    </div>
                    {/* Content Area */}
                    <div className={`sidebar-content ${activeSidebar ? 'visible' : ''}`} style={{ display: activeSidebar ? 'block' : 'none' }}>
                        {renderSidebarContent()}
                    </div>
                </div>
            </main>
            
            {/* Task Create Modal */}
            <Modal
                title="新增学习任务"
                open={taskModalOpen}
                onCancel={() => setTaskModalOpen(false)}
                onOk={handleAddTask}
                okText="添加"
                cancelText="取消"
            >
                <Form form={taskForm}>
                    <Form.Item name="title" rules={[{ required: true, message: '请输入任务内容' }]}>
                        <Input placeholder="例如：背诵 50 个英语单词" autoFocus />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
