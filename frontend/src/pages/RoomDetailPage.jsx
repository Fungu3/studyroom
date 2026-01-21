import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import NoteItem from "../components/NoteItem";
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
    CheckCircleOutlined,
    CloseOutlined,
    FileTextOutlined,
    PictureOutlined,
    LikeOutlined,
    LikeFilled,
    SendOutlined,
    EditOutlined,
    ShareAltOutlined,
    DeleteOutlined
} from "@ant-design/icons";

import { getRoom, createPomodoro, listPomodoros, getCoins, listNotes, createNote, collectNote, addNoteComment, likeNoteComment, listPersonalNotes, addPersonalNote, sharePersonalNote, updatePersonalNote } from "../api/rooms";
import "./RoomDetailPage.css";

const { Text, Title, Paragraph } = Typography;

const formatTime = (seconds) => {
    const safe = Math.max(0, seconds);
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const toArray = (value) => (Array.isArray(value) ? value : []);

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
    const [activeSidebar, setActiveSidebar] = useState(null); // 'chat', 'members', 'plants', 'records', 'notes'
    const [sidebarWidth, setSidebarWidth] = useState(360);
    const [isResizing, setIsResizing] = useState(false);
    const [todoPanelOpen, setTodoPanelOpen] = useState(false);

    // --- Notes State ---
    const [notes, setNotes] = useState([]);
    const [newNoteTitle, setNewNoteTitle] = useState("");
    const [newNoteContent, setNewNoteContent] = useState("");
    const [newNoteImage, setNewNoteImage] = useState(null); // Base64 or URL
    // Personal Notes Module
    const [personalNotesOpen, setPersonalNotesOpen] = useState(false);
    const [personalNoteDraft, setPersonalNoteDraft] = useState({ title: "", content: "", image: null });
    const [personalNotes, setPersonalNotes] = useState([]);
    const [personalNoteMode, setPersonalNoteMode] = useState('list'); // 'list', 'create', 'edit'

    // Load personal notes when drawer opens
    useEffect(() => {
        if (personalNotesOpen && user?.id) {
            listPersonalNotes(user.id)
                .then((list) => setPersonalNotes(toArray(list)))
                .catch(console.error);
        }
    }, [personalNotesOpen, user?.id]);

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
            const n = await listNotes(roomId);
            setNotes(Array.isArray(n) ? n : []);
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

    // --- Effects: Sidebar Resizing ---
    const startResizing = useCallback(() => setIsResizing(true), []);
    const stopResizing = useCallback(() => setIsResizing(false), []);
    const resize = useCallback((e) => {
        if (isResizing) {
            const newWidth = window.innerWidth - e.clientX;
            // Limit width betwen 250px and 800px
            if (newWidth >= 250 && newWidth <= 800) {
                setSidebarWidth(newWidth);
            }
        }
    }, [isResizing]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener("mousemove", resize);
            window.addEventListener("mouseup", stopResizing);
        }
        return () => {
             window.removeEventListener("mousemove", resize);
             window.removeEventListener("mouseup", stopResizing);
        };
    }, [isResizing, resize, stopResizing]);

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
        setTasks([newTask, ...toArray(tasks)]);
        setTaskModalOpen(false);
        taskForm.resetFields();
    };

    const toggleTask = (id) => {
        setTasks(toArray(tasks).map(t => t.id === id ? { ...t, done: !t.done } : t));
    };

    const toggleSidebar = (panel) => {
        setActiveSidebar(activeSidebar === panel ? null : panel);
    };

    // --- Notes Handlers ---
    const handlePublishNote = async () => {
        if (!newNoteTitle.trim() || !newNoteContent.trim()) {
            message.warning("请输入标题和内容");
            return;
        }
        try {
            await createNote(roomId, {
                userId: user.id,
                title: newNoteTitle,
                content: newNoteContent,
                image: newNoteImage
            });
            message.success("发布成功");
            setNewNoteTitle("");
            setNewNoteContent("");
            setNewNoteImage(null);
            refreshAll();
        } catch (e) {
            message.error("发布失败");
        }
    };

    const handleCollectNote = async (noteId) => {
        try {
            await collectNote(roomId, noteId, user.id);
            message.success("收藏成功 +1金币");
            refreshAll();
        } catch(e) {
            refreshAll();
        }
    };

    const handleAddComment = async (noteId, content) => {
        if (!content.trim()) return;
        try {
            await addNoteComment(roomId, noteId, { userId: user.id, content });
            refreshAll();
        } catch(e) {}
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => setNewNoteImage(evt.target.result);
            reader.readAsDataURL(file);
        }
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
                                dataSource={toArray(chatMessages)}
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
                                     dataSource={toArray(members)}
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
                                    dataSource={toArray(pomodoros)}
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
            case 'notes':
                return (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Title level={5}>📝 笔记分享</Title>
                        
                        {/* Publish Area */}
                        <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: 8, marginBottom: 16 }}>
                            <Input 
                                placeholder="笔记标题" 
                                style={{ marginBottom: 8, fontWeight: 'bold' }} 
                                value={newNoteTitle}
                                onChange={e => setNewNoteTitle(e.target.value)}
                            />
                            <Input.TextArea 
                                placeholder="记录此时此刻的想法..." 
                                rows={3} 
                                style={{ marginBottom: 8, resize: 'none' }}
                                value={newNoteContent}
                                onChange={e => setNewNoteContent(e.target.value)}
                            />
                            {newNoteImage && (
                                <div style={{ marginBottom: 8, position: 'relative' }}>
                                    <img src={newNoteImage} alt="preview" style={{ maxWidth: '100%', maxHeight: 100, borderRadius: 4 }} />
                                    <CloseOutlined 
                                        style={{ position: 'absolute', top: 0, right: 0, padding: 4, background: 'rgba(255,255,255,0.8)', cursor: 'pointer' }}
                                        onClick={() => setNewNoteImage(null)}
                                    />
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={{ cursor: 'pointer', color: '#1890ff', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <PictureOutlined style={{ fontSize: 18 }} />
                                    <span style={{fontSize: 12}}>上传图片</span>
                                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                                </label>
                                <Button type="primary" size="small" onClick={handlePublishNote}>发布</Button>
                            </div>
                        </div>

                        {/* Notes Feed */}
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <List
                                dataSource={toArray(notes)}
                                itemLayout="vertical"
                                renderItem={item => (
                                    <NoteItem 
                                        note={item} 
                                        user={user} 
                                        onCollect={handleCollectNote} 
                                        onAddComment={handleAddComment} 
                                    />
                                )}
                            />
                        </div>
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

                    {/* Study Tasks Dropdown (Top - Left) */}
                    <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                         <div 
                            onClick={() => setTodoPanelOpen(!todoPanelOpen)}
                            style={{ 
                                background: 'rgba(255,255,255,0.85)', 
                                padding: '8px 16px', 
                                borderRadius: 20, 
                                cursor: 'pointer',
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 8,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                backdropFilter: 'blur(4px)',
                                transition: 'all 0.3s',
                                border: '1px solid rgba(0,0,0,0.05)'
                            }}
                         >
                             <CheckCircleOutlined style={{ color: '#95B46A' }} />
                             <span style={{ fontWeight: 500, color: '#5F6368' }}>学习任务待办</span>
                             {todoPanelOpen ? <UpOutlined style={{fontSize: 10}}/> : <DownOutlined style={{fontSize: 10}}/>}
                         </div>

                         {/* Dropdown Content */}
                         {todoPanelOpen && (
                             <div 
                                style={{
                                    marginTop: 8,
                                    background: 'rgba(255,255,255,0.95)',
                                    borderRadius: 12,
                                    padding: '12px',
                                    width: 280,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    maxHeight: 400,
                                    overflowY: 'auto',
                                    border: '1px solid rgba(0,0,0,0.05)'
                                }}
                             >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px', borderBottom: '1px solid #f0f0f0', paddingBottom: 8 }}>
                                    <Text type="secondary" style={{fontSize: 12}}>待完成: {toArray(tasks).filter(t => !t.done).length}</Text>
                                    <Tooltip title="添加任务">
                                        <Button 
                                            type="text" size="small" icon={<PlusOutlined />} 
                                            onClick={() => setTaskModalOpen(true)}
                                            style={{ color: '#1890ff' }}
                                        />
                                    </Tooltip>
                                </div>
                                <List
                                    size="small"
                                    dataSource={toArray(tasks)}
                                    locale={{ emptyText: <div style={{color:'#ccc', padding: '10px 0'}}>暂无任务，休息一下~</div> }}
                                    renderItem={t => (
                                        <List.Item 
                                            onClick={() => toggleTask(t.id)} 
                                            style={{ cursor: 'pointer', padding: '8px', borderRadius: 6, transition: 'background 0.2s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <Space align="start" style={{ width: '100%' }}>
                                                <div style={{ marginTop: 4 }}>
                                                    {t.done ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <div style={{ width: 14, height: 14, border: '1px solid #ccc', borderRadius: '50%' }} />}
                                                </div>
                                                <Text delete={t.done} type={t.done ? 'secondary' : ''} style={{ lineHeight: 1.4, wordBreak: 'break-all' }}>{t.title}</Text>
                                            </Space>
                                        </List.Item>
                                    )}
                                />
                             </div>
                         )}
                         <div 
                            onClick={() => setPersonalNotesOpen(true)}
                            style={{ 
                                marginTop: 8,
                                background: 'rgba(255,255,255,0.85)', 
                                padding: '8px 16px', 
                                borderRadius: 20, 
                                cursor: 'pointer',
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 8,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                backdropFilter: 'blur(4px)',
                                transition: 'all 0.3s',
                                border: '1px solid rgba(0,0,0,0.05)'
                            }}
                         >
                             <FileTextOutlined style={{ color: '#95B46A' }} />
                             <span style={{ fontWeight: 500, color: '#5F6368' }}>个人笔记</span>
                         </div>
                    </div>
                </div>

                {/* 3. Right Sidebar */}
                <div 
                    className="right-sidebar" 
                    style={{ 
                        width: activeSidebar ? sidebarWidth : 64,
                        position: 'relative',
                        userSelect: isResizing ? 'none' : 'auto' 
                    }}
                >
                    {/* Resizing Handle */}
                    {activeSidebar && (
                        <div 
                            onMouseDown={startResizing}
                            style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: 4,
                                cursor: 'ew-resize',
                                zIndex: 100,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            className="resize-handle-hover"
                        >
                            <div style={{ width: 1, height: 20, background: '#ccc' }}></div>
                            <div style={{ width: 1, height: 20, background: '#ccc', marginLeft: 1 }}></div>
                        </div>
                    )}

                    <div className="sidebar-icons">
                         <Tooltip title="收起面板" placement="left">
                            {activeSidebar && (
                                <div className="icon-btn" onClick={() => setActiveSidebar(null)} style={{ marginBottom: 32, color: '#000' }}>
                                    <CloseOutlined />
                                </div>
                            )}
                        </Tooltip>

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
                        <Tooltip title="笔记分享" placement="left">
                            <div className={`icon-btn ${activeSidebar === 'notes' ? 'active' : ''}`} onClick={() => toggleSidebar('notes')}>
                                <FileTextOutlined />
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

            <Drawer
                title="个人笔记"
                placement="bottom"
                height="80vh"
                onClose={() => setPersonalNotesOpen(false)}
                open={personalNotesOpen}
                bodyStyle={{ padding: 0 }}
            >
                <div style={{ display: 'flex', height: '100%' }}>
                    {/* Left: My Stuff */}
                    <div style={{ width: '40%', borderRight: '1px solid #f0f0f0', padding: 24, overflowY: 'auto' }}>
                        <Title level={5}>我的收藏 & 发布</Title>
                        <List
                            dataSource={toArray(notes).filter(n => n.userId === Number(user.id) || (n.collectedByUserIds && n.collectedByUserIds.includes(Number(user.id))))}
                            renderItem={item => (
                                <div style={{ marginBottom: 16, padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text strong>{item.title}</Text>
                                        <Tag>{item.userId === Number(user.id) ? "我的发布" : "我的收藏"}</Tag>
                                    </div>
                                    <Paragraph ellipsis={{ rows: 2 }} style={{ fontSize: 12, margin: '8px 0' }}>{item.content}</Paragraph>
                                    <Space size="small">
                                        <Button size="small" onClick={() => {
                                            navigator.clipboard.writeText(item.content);
                                            message.success("已复制内容");
                                        }}>复制内容</Button>
                                        {item.image && (
                                            <Button size="small" onClick={() => {
                                                 const a = document.createElement('a');
                                                 a.href = item.image;
                                                 a.download = `note_${item.id}.png`; 
                                                 a.click();
                                            }}>下载图片</Button>
                                        )}
                                    </Space>
                                </div>
                            )}
                        />
                    </div>

                    {/* Right: Personal Notes */}
                    <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Title level={5} style={{ margin: 0 }}>个人笔记</Title>
                            {personalNoteMode === 'list' && (
                                <Button 
                                    type="text" 
                                    icon={<PlusOutlined />} 
                                    onClick={() => {
                                        setPersonalNoteDraft({ title: "", content: "", image: null });
                                        setPersonalNoteMode('create');
                                    }}
                                >
                                    添加笔记
                                </Button>
                            )}
                            {personalNoteMode !== 'list' && (
                                <Button 
                                    type="text" 
                                    onClick={() => setPersonalNoteMode('list')}
                                >
                                    返回列表
                                </Button>
                            )}
                        </div>

                        {personalNoteMode === 'list' ? (
                            <div style={{ flex: 1, overflowY: 'auto' }}>
                                <List
                                    dataSource={toArray(personalNotes)}
                                    locale={{ emptyText: '暂无个人笔记' }}
                                    renderItem={item => (
                                        <div style={{ marginBottom: 16, border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                                <Text strong style={{ fontSize: 16 }}>{item.title}</Text>
                                                <Space>
                                                    <Button 
                                                        size="small" 
                                                        icon={<EditOutlined />} 
                                                        onClick={() => {
                                                            setPersonalNoteDraft({ 
                                                                id: item.id, 
                                                                title: item.title, 
                                                                content: item.content, 
                                                                image: item.imageUrl 
                                                            });
                                                            setPersonalNoteMode('edit');
                                                        }}
                                                    >
                                                        编辑
                                                    </Button>
                                                    <Button 
                                                        size="small" 
                                                        icon={<ShareAltOutlined />} 
                                                        onClick={async () => {
                                                            try {
                                                                await sharePersonalNote({ personalNoteId: item.id, roomId });
                                                                message.success("已分享到笔记广场");
                                                                refreshAll(); // Refresh shared notes
                                                            } catch (e) {
                                                                message.error("分享失败");
                                                            }
                                                        }}
                                                    >
                                                        分享
                                                    </Button>
                                                </Space>
                                            </div>
                                            <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: '展开' }}>
                                                {item.content}
                                            </Paragraph>
                                            {item.imageUrl && (
                                                <img src={item.imageUrl} style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 4, marginTop: 8 }} alt="note" />
                                            )}
                                        </div>
                                    )}
                                />
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <Input 
                                    placeholder="笔记标题" 
                                    style={{ marginBottom: 16 }} 
                                    value={personalNoteDraft.title}
                                    onChange={e => setPersonalNoteDraft({...personalNoteDraft, title: e.target.value})}
                                />
                                <Input.TextArea 
                                    placeholder="输入笔记内容..." 
                                    style={{ flex: 1, marginBottom: 16, resize: 'none' }} 
                                    value={personalNoteDraft.content}
                                    onChange={e => setPersonalNoteDraft({...personalNoteDraft, content: e.target.value})}
                                />
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ cursor: 'pointer', color: '#1890ff', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <PictureOutlined />
                                        <span>上传图片</span>
                                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                                            const file = e.target.files[0];
                                             if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (evt) => setPersonalNoteDraft({...personalNoteDraft, image: evt.target.result});
                                                reader.readAsDataURL(file);
                                            }
                                        }} />
                                    </label>
                                    {personalNoteDraft.image && (
                                        <div style={{ marginTop: 8, position: 'relative', display: 'inline-block' }}>
                                            <img src={personalNoteDraft.image} style={{ height: 100, borderRadius: 4 }} alt="preview" />
                                            <Button 
                                                type="text" 
                                                icon={<CloseOutlined />} 
                                                size="small" 
                                                style={{ position: 'absolute', top: 0, right: 0, color: '#fff', background: 'rgba(0,0,0,0.5)' }}
                                                onClick={() => setPersonalNoteDraft({...personalNoteDraft, image: null})} 
                                            />
                                        </div>
                                    )}
                                </div>
                                <Button type="primary" size="large" onClick={async () => {
                                     if(!personalNoteDraft.title || !personalNoteDraft.content) return message.warning("请填写完整标题和内容");
                                     try {
                                        if (personalNoteMode === 'create') {
                                            await addPersonalNote({
                                                userId: user.id,
                                                title: personalNoteDraft.title,
                                                content: personalNoteDraft.content,
                                                imageUrl: personalNoteDraft.image,
                                                isShared: false
                                            });
                                            message.success("保存成功");
                                        } else {
                                            await updatePersonalNote({
                                                noteId: personalNoteDraft.id,
                                                title: personalNoteDraft.title,
                                                content: personalNoteDraft.content,
                                                imageUrl: personalNoteDraft.image
                                            });
                                            message.success("更新成功");
                                        }
                                        setPersonalNoteDraft({ title: "", content: "", image: null });
                                        setPersonalNoteMode('list');
                                        listPersonalNotes(user.id).then(setPersonalNotes);
                                     } catch(e) {
                                        console.error(e);
                                        message.error("操作失败");
                                     }
                                }}>
                                    {personalNoteMode === 'create' ? "保存笔记" : "保存修改"}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </Drawer>
        </div>
    );
}
