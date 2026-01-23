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
    Popconfirm,
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
    DeleteOutlined,
    StarOutlined,
    StarFilled
} from "@ant-design/icons";

import { getRoom, createPomodoro, listPomodoros, getCoins, listNotes, createNote, collectNote, addNoteComment, likeNoteComment, deleteNote, deleteNoteComment, listPersonalNotes, addPersonalNote, sharePersonalNote, updatePersonalNote, deletePersonalNote } from "../api/rooms";
import "./RoomDetailPage.css";

const Cloud = ({ style, sizeStr }) => (
    <div className="bg-cloud" style={style}>
        <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M18.5 12C18.5 12 18.5 12 18.5 12C19.8807 12 21 13.1193 21 14.5C21 15.8807 19.8807 17 18.5 17H6.5C4.567 17 3 15.433 3 13.5C3 11.567 4.567 10 6.5 10C6.73036 10 6.95476 10.027 7.17072 10.078C7.62562 7.23439 10.0886 5 13 5C16.3137 5 19 7.68629 19 11C19 11.3653 18.9669 11.7214 18.9032 12.0654C18.775 12.0229 18.6393 12 18.5 12Z" />
        </svg>
    </div>
);

const HotAirBalloon = ({ style }) => (
    <div className="bg-balloon" style={style} aria-label="hot-air-balloon" />
);

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
    
    // --- Dynamic Background Logic ---
    const [balloonVisible, setBalloonVisible] = useState(false);
    useEffect(() => {
        let timer;
        const scheduleBalloon = () => {
            // 3x frequency: 1-1.67 mins (60s - 100s)
            const delay = Math.floor(Math.random() * (100000 - 60000 + 1) + 60000);
            timer = setTimeout(() => {
                setBalloonVisible(true);
                // Hide after 60s (animation duration)
                setTimeout(() => {
                    setBalloonVisible(false);
                    scheduleBalloon();
                }, 60000);
            }, delay);
        };
        // Initial appearance ~3.3s after load (3x frequency)
        timer = setTimeout(() => {
             setBalloonVisible(true);
             setTimeout(() => {
                setBalloonVisible(false);
                scheduleBalloon();
            }, 60000);
        }, 3333);
        return () => clearTimeout(timer);
    }, []);

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
    const [notePreview, setNotePreview] = useState(null);
    const [notePreviewPosition, setNotePreviewPosition] = useState({ x: 0, y: 0 });
    const [notePreviewSize, setNotePreviewSize] = useState({ width: 520, height: 360 });
    const [notePreviewDragging, setNotePreviewDragging] = useState(false);
    const [notePreviewDragOffset, setNotePreviewDragOffset] = useState({ x: 0, y: 0 });
    const [notePreviewResizing, setNotePreviewResizing] = useState(false);
    const [notePreviewResizeDir, setNotePreviewResizeDir] = useState(null);
    const [notePreviewResizeStart, setNotePreviewResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 });
    const notePreviewRef = useRef(null);

    const getNumericUserId = useCallback(() => {
        const numericId = Number(user?.id);
        return Number.isFinite(numericId) ? numericId : null;
    }, [user?.id]);

    // Load personal notes when drawer opens
    useEffect(() => {
        const numericUserId = getNumericUserId();
        if (personalNotesOpen && numericUserId) {
            listPersonalNotes(numericUserId)
                .then((list) => setPersonalNotes(toArray(list)))
                .catch(console.error);
        }
    }, [personalNotesOpen, getNumericUserId]);

    useEffect(() => {
        if (!notePreviewDragging) return;
        const handleMove = (e) => {
            setNotePreviewPosition({
                x: e.clientX - notePreviewDragOffset.x,
                y: e.clientY - notePreviewDragOffset.y
            });
        };
        const handleUp = () => setNotePreviewDragging(false);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
        };
    }, [notePreviewDragging, notePreviewDragOffset]);

    useEffect(() => {
        if (!notePreviewResizing || !notePreviewResizeDir) return;
        const minWidth = 320;
        const minHeight = 220;
        const handleMove = (e) => {
            const dx = e.clientX - notePreviewResizeStart.x;
            const dy = e.clientY - notePreviewResizeStart.y;
            let nextWidth = notePreviewResizeStart.width;
            let nextHeight = notePreviewResizeStart.height;
            let nextLeft = notePreviewResizeStart.left;
            let nextTop = notePreviewResizeStart.top;

            if (notePreviewResizeDir.includes('e')) {
                nextWidth = Math.max(minWidth, notePreviewResizeStart.width + dx);
            }
            if (notePreviewResizeDir.includes('s')) {
                nextHeight = Math.max(minHeight, notePreviewResizeStart.height + dy);
            }
            if (notePreviewResizeDir.includes('w')) {
                nextWidth = Math.max(minWidth, notePreviewResizeStart.width - dx);
                nextLeft = notePreviewResizeStart.left + (notePreviewResizeStart.width - nextWidth);
            }
            if (notePreviewResizeDir.includes('n')) {
                nextHeight = Math.max(minHeight, notePreviewResizeStart.height - dy);
                nextTop = notePreviewResizeStart.top + (notePreviewResizeStart.height - nextHeight);
            }

            setNotePreviewSize({ width: nextWidth, height: nextHeight });
            setNotePreviewPosition({ x: nextLeft, y: nextTop });
        };
        const handleUp = () => setNotePreviewResizing(false);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
        };
    }, [notePreviewResizing, notePreviewResizeDir, notePreviewResizeStart]);

    const openNotePreview = (note) => {
        if (!note) return;
        const defaultWidth = 520;
        const defaultHeight = 360;
        const centerX = typeof window !== "undefined" ? Math.max(0, (window.innerWidth - defaultWidth) / 2) : 0;
        const centerY = typeof window !== "undefined" ? Math.max(0, (window.innerHeight - defaultHeight) / 2) : 0;
        setNotePreview(note);
        setNotePreviewSize({ width: defaultWidth, height: defaultHeight });
        setNotePreviewPosition({ x: centerX, y: centerY });
    };

    const closeNotePreview = () => setNotePreview(null);

    const handleNotePreviewMouseDown = (e) => {
        if (!notePreview) return;
        if (notePreviewResizing) return;
        if (e.button !== 0) return;
        if (e.target?.closest?.('[data-resize-handle="true"]')) return;
        e.preventDefault();
        setNotePreviewDragging(true);
        setNotePreviewDragOffset({
            x: e.clientX - notePreviewPosition.x,
            y: e.clientY - notePreviewPosition.y
        });
    };

    const handleNotePreviewResizeStart = (e, dir) => {
        e.preventDefault();
        e.stopPropagation();
        if (!notePreviewRef.current) return;
        const rect = notePreviewRef.current.getBoundingClientRect();
        setNotePreviewResizeStart({
            x: e.clientX,
            y: e.clientY,
            width: rect.width,
            height: rect.height,
            left: rect.left,
            top: rect.top
        });
        setNotePreviewResizeDir(dir);
        setNotePreviewResizing(true);
    };

    const syncNotePreviewSize = () => {
        if (!notePreviewRef.current) return;
        const rect = notePreviewRef.current.getBoundingClientRect();
        setNotePreviewSize({ width: rect.width, height: rect.height });
    };

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
    const [tasksHydrated, setTasksHydrated] = useState(false);

    const taskStorageKey = useMemo(() => {
        if (!isRoomIdValid) return null;
        return `studyroom_room_${roomId}_tasks`;
    }, [roomId, isRoomIdValid]);

    const loadTasksFromStorage = useCallback(() => {
        if (!taskStorageKey) return [];
        try {
            const raw = localStorage.getItem(taskStorageKey);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }, [taskStorageKey]);

    useEffect(() => {
        if (!taskStorageKey) return;
        setTasksHydrated(false);
        setTasks(loadTasksFromStorage());
        setTasksHydrated(true);
    }, [taskStorageKey, loadTasksFromStorage]);

    useEffect(() => {
        if (!taskStorageKey || !tasksHydrated) return;
        try {
            localStorage.setItem(taskStorageKey, JSON.stringify(toArray(tasks)));
        } catch {}
    }, [tasks, taskStorageKey, tasksHydrated]);

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

    useEffect(() => {
        refreshAll();
    }, [refreshAll]);

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

    const handleCollectNote = async (note, isCollected) => {
        if (!note) return;
        if (String(note.userId || "") === String(user?.id || "")) {
            message.warning("不能收藏自己发布的笔记");
            return;
        }
        try {
            await collectNote(roomId, note.id, user.id);
            message.success(isCollected ? "已取消收藏" : "收藏成功 +1金币");
            refreshAll();
        } catch(e) {
            refreshAll();
        }
    };

    const handleDeleteNote = async (noteId) => {
        try {
            await deleteNote(roomId, noteId, user.id);
            message.success("已删除");
            refreshAll();
            const numericUserId = getNumericUserId();
            if (numericUserId) {
                listPersonalNotes(numericUserId).then((list) => {
                    const next = toArray(list);
                    setPersonalNotes(next);
                    setNotePreview((prev) => {
                        if (!prev || prev._source !== 'personal') return prev;
                        const updated = next.find((n) => n.id === prev.id);
                        return updated ? { ...prev, isShared: updated.isShared } : prev;
                    });
                });
            }
        } catch (e) {
            message.error("删除失败");
        }
    };

    const handleDeletePersonalNote = async (noteId) => {
        const numericUserId = getNumericUserId();
        if (!numericUserId) {
            message.warning("请先登录后管理个人笔记");
            return;
        }
        try {
            await deletePersonalNote({ noteId, userId: numericUserId });
            message.success("已删除");
            listPersonalNotes(numericUserId).then((list) => setPersonalNotes(toArray(list)));
            setNotePreview((prev) => (prev && prev._source === 'personal' && prev.id === noteId ? null : prev));
        } catch (e) {
            message.error("删除失败");
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await deleteNoteComment(roomId, commentId, user.id);
            message.success("已删除");
            refreshAll();
        } catch (e) {
            message.error("删除失败");
        }
    };

    const handleAddComment = async (noteId, content) => {
        if (!content.trim()) return;
        const numericUserId = getNumericUserId();
        if (!numericUserId) {
            message.warning("请先登录后评论");
            return;
        }
        try {
            await addNoteComment(roomId, noteId, { userId: numericUserId, content });
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

    const handleSharePersonalNote = async (personalNoteId) => {
        const numericUserId = getNumericUserId();
        if (!numericUserId) {
            message.warning("请先登录后管理个人笔记");
            return;
        }
        try {
            await sharePersonalNote({ personalNoteId, roomId });
            message.success("已分享到笔记广场");
            refreshAll();
            listPersonalNotes(numericUserId).then((list) => setPersonalNotes(toArray(list)));
            setNotePreview((prev) => prev && prev._source === 'personal' && prev.id === personalNoteId ? { ...prev, isShared: true } : prev);
        } catch (e) {
            message.error("分享失败");
        }
    };

    // --- Sub-renderers ---
    const renderSidebarContent = () => {
        switch (activeSidebar) {
            case 'chat':
                return (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'Comic Sans MS' }}>
                        <Title level={5} style={{ marginBottom: 16, color: '#6A5ACD' }}>💬 房间聊天</Title>
                        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12, paddingRight: 4 }}>
                            <List
                                dataSource={toArray(chatMessages)}
                                split={false}
                                renderItem={m => (
                                    <List.Item style={{ padding: '8px 0', border: 'none' }}>
                                        <div style={{ width: '100%' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9FA8DA', marginBottom: 4 }}>
                                                <span>{m?.user?.name || '未知'}</span>
                                                <span>{m?.ts ? new Date(m.ts).toLocaleTimeString() : ''}</span>
                                            </div>
                                            <div style={{ 
                                                background: m?.user?.id === user.id ? '#B3E5FC' : '#E1BEE7', 
                                                color: m?.user?.id === user.id ? '#01579B' : '#4A148C',
                                                padding: '10px 14px', 
                                                borderRadius: '16px',
                                                borderBottomLeftRadius: m?.user?.id === user.id ? '16px' : '4px',
                                                borderBottomRightRadius: m?.user?.id === user.id ? '4px' : '16px',
                                                display: 'inline-block',
                                                maxWidth: '90%',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
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
                                style={{ borderRadius: 20, borderColor: '#CE93D8' }}
                            />
                            <Button type="primary" shape="circle" icon={<SendOutlined />} onClick={handleSendMessage} style={{ background: '#CE93D8', borderColor: '#CE93D8' }} />
                        </div>
                    </div>
                );
            case 'members':
                return (
                    <div>
                        <Title level={5} style={{ marginBottom: 16, color: '#6A5ACD' }}>👥 在线成员</Title>
                         <List
                                     dataSource={toArray(members)}
                            renderItem={m => (
                                <List.Item style={{ borderBottom: '1px dashed #E1BEE7' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                             <Space>
                                                <span style={{ fontWeight: 600, color: '#5C6BC0' }}>{m.name}</span>
                                                {m.id === user.id && <Tag color="#F48FB1" style={{ borderRadius: 10 }}>我</Tag>}
                                             </Space>
                                              <Tag color={m.status === 'focusing' ? '#A5D6A7' : 'default'} style={{ width: 'fit-content', marginTop: 4, borderRadius: 10, color: m.status === 'focusing' ? '#1B5E20' : '' }}>
                                                    {m.status === 'focusing' ? '专注中' : '休息中'}
                                              </Tag>
                                        </div>
                                        {/* Avatar on the right */}
                                        <Avatar size={36} style={{ backgroundColor: '#FFCC80', color: '#FFF', fontWeight: 'bold' }}>{m.name?.[0]?.toUpperCase()}</Avatar>
                                    </div>
                                </List.Item>
                            )}
                        />
                    </div>
                );
            case 'plants':
                return (
                    <div style={{ textAlign: 'center', paddingTop: 40, fontFamily: 'Comic Sans MS' }}>
                         <Title level={5} style={{ color: '#6A5ACD' }}>🌱 我的植物</Title>
                         <div style={{ fontSize: 80, color: '#A5D6A7', margin: '30px 0', filter: 'drop-shadow(0 4px 6px rgba(165,214,167,0.4))' }}>
                             <ExperimentOutlined />
                         </div>
                         <Text strong style={{ color: '#558B2F' }}>积累经验值: {coins?.totalCoins || 0}</Text>
                         {/* A fake progress bar */}
                         <div style={{ marginTop: 20 }}>
                             <Tag color="#80DEEA" style={{ borderRadius: 12 }}>Level 1</Tag>
                             <div style={{ height: 10, background: '#FFF9C4', borderRadius: 5, marginTop: 12, border: '1px solid #FFF59D' }}>
                                 <div style={{ width: '40%', height: '100%', background: 'linear-gradient(90deg, #A5D6A7, #66BB6A)', borderRadius: 5 }}></div>
                             </div>
                         </div>
                    </div>
                );
            case 'records':
                return (
                    <div style={{ fontFamily: 'Comic Sans MS' }}>
                        <Title level={5} style={{ marginBottom: 16, color: '#6A5ACD' }}>📊 专注记录</Title>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <div style={{ display: 'flex', gap: 16 }}>
                                <Statistic 
                                    title={<span style={{ color: '#9FA8DA', fontSize: 12 }}>累计时长</span>} 
                                    value={totalStudyTime} 
                                    suffix="min" 
                                    valueStyle={{ color: '#7E57C2', fontWeight: 'bold' }}
                                    style={{ background: '#F3E5F5', padding: '8px 16px', borderRadius: 16, flex: 1 }}
                                />
                                <Statistic 
                                    title={<span style={{ color: '#9FA8DA', fontSize: 12 }}>番茄钟数</span>} 
                                    value={completedCount} 
                                    valueStyle={{ color: '#EC407A', fontWeight: 'bold' }}
                                    style={{ background: '#F8BBD0', padding: '8px 16px', borderRadius: 16, flex: 1 }}
                                />
                            </div>
                            <Divider style={{ borderColor: '#E1BEE7' }} />
                            <Title level={5} style={{ fontSize: 14, color: '#6A5ACD' }}>最近历史</Title>
                            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                                <List
                                    size="small"
                                    dataSource={toArray(pomodoros)}
                                    renderItem={p => (
                                        <List.Item style={{ borderBottom: '1px dashed #E1BEE7' }}>
                                            <Space>
                                                <Tag color={p.result === 'SUCCESS' ? '#A5D6A7' : '#EF9A9A'} style={{ borderRadius: 8 }}>{p.result}</Tag>
                                                <span style={{ color: '#7986CB' }}>{p.durationMinutes}min</span>
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
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'Comic Sans MS' }}>
                        <Title level={5} style={{ color: '#6A5ACD' }}>📝 笔记分享</Title>
                        
                        {/* Publish Area */}
                        <div style={{ padding: '16px', background: '#E3F2FD', borderRadius: 16, marginBottom: 16, border: '2px solid #BBDEFB' }}>
                            <Input 
                                placeholder="笔记标题" 
                                style={{ marginBottom: 8, fontWeight: 'bold', borderRadius: 8, borderColor: '#90CAF9' }} 
                                value={newNoteTitle}
                                onChange={e => setNewNoteTitle(e.target.value)}
                            />
                            <Input.TextArea 
                                placeholder="记录此时此刻的想法..." 
                                rows={3} 
                                style={{ marginBottom: 8, resize: 'none', borderRadius: 8, borderColor: '#90CAF9' }}
                                value={newNoteContent}
                                onChange={e => setNewNoteContent(e.target.value)}
                            />
                            {newNoteImage && (
                                <div style={{ marginBottom: 8, position: 'relative' }}>
                                    <img src={newNoteImage} alt="preview" style={{ maxWidth: '100%', maxHeight: 100, borderRadius: 8, border: '2px solid #fff' }} />
                                    <CloseOutlined 
                                        style={{ position: 'absolute', top: 4, right: 4, padding: 4, background: 'rgba(255,255,255,0.8)', cursor: 'pointer', borderRadius: '50%' }}
                                        onClick={() => setNewNoteImage(null)}
                                    />
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={{ cursor: 'pointer', color: '#1E88E5', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <PictureOutlined style={{ fontSize: 18 }} />
                                    <span style={{fontSize: 12}}>上传图片</span>
                                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                                </label>
                                <Button type="primary" size="small" onClick={handlePublishNote} style={{ background: '#64B5F6', borderColor: '#42A5F5', borderRadius: 12 }}>发布</Button>
                            </div>
                        </div>

                        {/* Notes Feed */}
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <List
                                dataSource={toArray(notes)}
                                itemLayout="vertical"
                                renderItem={item => (
                                    <div style={{ background: '#FFF9C4', borderRadius: 16, padding: 12, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                        <NoteItem 
                                            note={item} 
                                            user={user} 
                                            onCollect={handleCollectNote} 
                                            onAddComment={handleAddComment} 
                                            onDeleteNote={handleDeleteNote}
                                            onDeleteComment={handleDeleteComment}
                                            isMacaron={true}
                                        />
                                    </div>
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
                    <div className="logo-text" style={{ fontFamily: 'Comic Sans MS', color: '#6A5ACD', fontWeight: 'bold' }}>StudyRoom</div>
                </div>
                {/* Center area removed as per visual optimization request */}
                <div className="nav-center" style={{ flex: 1 }}></div> 
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
                            style={{ backgroundColor: '#81D4FA', cursor: 'pointer' }} 
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
                    <div className="dynamic-bg-layer">
                        <Cloud sizeStr="35vw" style={{ top: '2%', animationDuration: '80s', animationDelay: '0s' }} />
                        <Cloud sizeStr="30vw" style={{ top: '15%', animationDuration: '90s', animationDelay: '-40s', opacity: 0.6 }} />
                        <Cloud sizeStr="38vw" style={{ top: '25%', animationDuration: '70s', animationDelay: '-20s', opacity: 0.7 }} />
                        
                                {balloonVisible && (
                                    <>
                                         <HotAirBalloon style={{ animationDuration: '60s' }} />
                                         <HotAirBalloon style={{ animationDuration: '75s', animationDelay: '-20s', width: '160px', height: '190px' }} />
                                    </>
                                )}
                    </div>
                    <div className="timer-container">
                        <div 
                            className={`timer-display ${pomoStatus === 'running' ? 'timer-breathing' : ''}`}
                            style={{ 
                                color: pomoStatus === 'paused' ? 'rgba(255,255,255,0.6)' : '#FFF' 
                            }}
                        >
                            {formatTime(timeLeft)}
                        </div>
                        
                        {/* Real-time Clock */}
                        <div style={{ fontSize: '16px', color: '#D3D3D3', fontWeight:600, textShadow: '0 1px 2px rgba(0,0,0,0.1)', marginTop: '-10px', marginBottom: '24px', fontFamily: 'Comic Sans MS, cursive' }}>
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
                                background: 'rgba(255, 255, 255, 0.9)', 
                                padding: '10px 20px', 
                                borderRadius: 24, 
                                cursor: 'pointer',
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 8,
                                boxShadow: '0 4px 12px rgba(165, 214, 167, 0.4)',
                                border: '2px solid #A5D6A7',
                                backdropFilter: 'blur(8px)',
                                transition: 'all 0.3s',
                                color: '#558B2F'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                         >
                             <CheckCircleOutlined style={{ color: '#558B2F' }} />
                             <span style={{ fontWeight: 700, fontFamily: 'Comic Sans MS' }}>学习任务待办</span>
                             {todoPanelOpen ? <UpOutlined style={{fontSize: 10}}/> : <DownOutlined style={{fontSize: 10}}/>}
                         </div>

                         {/* Dropdown Content */}
                         {todoPanelOpen && (
                             <div 
                                className="styled-panel"
                                style={{
                                    marginTop: 12,
                                    padding: '16px',
                                    width: 320,
                                    maxHeight: 450,
                                    overflowY: 'auto'
                                }}
                             >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 8, borderBottom: '2px dashed #C8E6C9' }}>
                                    <Text strong style={{ color: '#558B2F' }}>待完成: {toArray(tasks).filter(t => !t.done).length}</Text>
                                    <Tooltip title="添加任务">
                                        <Button 
                                            type="primary" shape="circle" size="small" icon={<PlusOutlined />} 
                                            onClick={() => setTaskModalOpen(true)}
                                            style={{ background: '#A5D6A7', borderColor: '#A5D6A7' }}
                                        />
                                    </Tooltip>
                                </div>
                                <List
                                    size="small"
                                    dataSource={toArray(tasks)}
                                    locale={{ emptyText: <div style={{color:'#9FA8DA', padding: '10px 0', textAlign: 'center'}}>暂无任务，休息一下~ ☕</div> }}
                                    renderItem={t => (
                                        <List.Item 
                                            onClick={() => toggleTask(t.id)} 
                                            style={{ 
                                                cursor: 'pointer', 
                                                padding: '8px 12px', 
                                                borderRadius: 12, 
                                                marginBottom: 8,
                                                background: t.done ? '#F1F8E9' : '#FFF',
                                                border: '1px solid #E8F5E9',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => { if(!t.done) e.currentTarget.style.background = '#F9FBE7'; }}
                                            onMouseLeave={(e) => { if(!t.done) e.currentTarget.style.background = '#FFF'; }}
                                        >
                                            <Space align="start" style={{ width: '100%' }}>
                                                <div style={{ marginTop: 4 }}>
                                                    {t.done ? <CheckCircleOutlined style={{ color: '#558B2F', fontSize: 18 }} /> : <div style={{ width: 16, height: 16, border: '2px solid #A5D6A7', borderRadius: '50%' }} />}
                                                </div>
                                                <Text delete={t.done} style={{ 
                                                    color: t.done ? '#9E9E9E' : '#424242',
                                                    fontFamily: 'Comic Sans MS',
                                                    fontWeight: t.done ? 400 : 600
                                                }}>{t.title}</Text>
                                            </Space>
                                        </List.Item>
                                    )}
                                />
                             </div>
                         )}
                         <div 
                            onClick={() => setPersonalNotesOpen(true)}
                            style={{ 
                                marginTop: 12,
                                background: 'rgba(255, 255, 255, 0.9)', 
                                padding: '10px 20px', 
                                borderRadius: 24, 
                                cursor: 'pointer',
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 8,
                                boxShadow: '0 4px 12px rgba(149, 117, 205, 0.3)',
                                border: '2px solid #CE93D8',
                                backdropFilter: 'blur(8px)',
                                transition: 'all 0.3s',
                                color: '#7B1FA2'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                         >
                             <FileTextOutlined style={{ color: '#7B1FA2' }} />
                             <span style={{ fontWeight: 700, fontFamily: 'Comic Sans MS' }}>个人笔记</span>
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
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Button
                                            type="link"
                                            size="small"
                                            style={{ padding: 0, height: 'auto', fontWeight: 600 }}
                                            onClick={() => openNotePreview(item)}
                                        >
                                            {item.title || "未命名"}
                                        </Button>
                                        <Space size="small">
                                            <Tag>{item.userId === Number(user.id) ? "我的发布" : "我的收藏"}</Tag>
                                            {item.userId === Number(user.id) ? (
                                                <Popconfirm
                                                    title="删除此笔记？"
                                                    okText="删除"
                                                    cancelText="取消"
                                                    onConfirm={() => handleDeleteNote(item.id)}
                                                >
                                                    <Button
                                                        size="small"
                                                        icon={<DeleteOutlined />}
                                                        danger
                                                    >
                                                        删除
                                                    </Button>
                                                </Popconfirm>
                                            ) : (
                                                <Button
                                                    size="small"
                                                    icon={(item.collectedByUserIds || []).includes(Number(user.id)) ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                                                    onClick={() => handleCollectNote(item, true)}
                                                >
                                                    {(item.collectedByUserIds || []).includes(Number(user.id)) ? "已收藏" : "收藏"}
                                                </Button>
                                            )}
                                        </Space>
                                    </div>
                                    <div style={{ display: 'flex', gap: 12, margin: '8px 0' }}>
                                        <div style={{ width: '70%', height: 120, overflowY: 'auto', paddingRight: 6 }}>
                                            <Paragraph style={{ fontSize: 12, margin: 0, whiteSpace: 'pre-wrap' }}>{item.content}</Paragraph>
                                        </div>
                                        <div style={{ width: '30%', maxHeight: 120, overflowY: 'auto', paddingRight: 6 }}>
                                            {(item.image || item.imageUrl) ? (
                                                <img
                                                    src={item.image || item.imageUrl}
                                                    style={{ width: '100%', borderRadius: 6 }}
                                                    alt="note"
                                                />
                                            ) : (
                                                <div style={{ fontSize: 12, color: '#999', textAlign: 'center', paddingTop: 8 }}>暂无图片</div>
                                            )}
                                        </div>
                                    </div>
                                    <Space size="small">
                                        <Button size="small" onClick={() => {
                                            navigator.clipboard.writeText(item.content);
                                            message.success("已复制内容");
                                        }}>复制内容</Button>
                                            {(item.image || item.imageUrl) && (
                                            <Button size="small" onClick={() => {
                                                 const a = document.createElement('a');
                                                 a.href = item.image || item.imageUrl;
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
                    <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', backgroundColor: '#FFF' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Title level={5} style={{ margin: 0, color: '#6A5ACD', fontFamily: 'Comic Sans MS' }}>个人笔记</Title>
                            {personalNoteMode === 'list' && (
                                <Button 
                                    type="primary" 
                                    shape="round"
                                    icon={<PlusOutlined />} 
                                    onClick={() => {
                                        setPersonalNoteDraft({ title: "", content: "", image: null });
                                        setPersonalNoteMode('create');
                                    }}
                                    style={{ background: '#A5D6A7', borderColor: '#A5D6A7' }}
                                >
                                    添加笔记
                                </Button>
                            )}
                            {personalNoteMode !== 'list' && (
                                <Button 
                                    type="text" 
                                    onClick={() => setPersonalNoteMode('list')}
                                    style={{ color: '#9FA8DA' }}
                                >
                                    返回列表
                                </Button>
                            )}
                        </div>

                        {personalNoteMode === 'list' ? (
                            <div style={{ flex: 1, overflowY: 'auto' }}>
                                <List
                                    dataSource={toArray(personalNotes)}
                                    locale={{ emptyText: <div style={{ textAlign: 'center', color: '#B0BEC5' }}>暂无个人笔记</div> }}
                                    renderItem={item => (
                                        <div style={{ marginBottom: 16, border: '2px solid #E1F5FE', background: '#F9FAFB', borderRadius: 16, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                                                <Button
                                                    type="link"
                                                    size="small"
                                                    style={{ padding: 0, height: 'auto', fontWeight: 600, fontSize: 16, color: '#5C6BC0', fontFamily: 'Comic Sans MS' }}
                                                    onClick={() => openNotePreview({ ...item, _source: 'personal' })}
                                                >
                                                    {item.title}
                                                </Button>
                                                <Space>
                                                    <Button 
                                                        size="small" 
                                                        icon={<EditOutlined style={{ color: '#64B5F6' }} />} 
                                                        onClick={() => {
                                                            setPersonalNoteDraft({ 
                                                                id: item.id, 
                                                                title: item.title, 
                                                                content: item.content, 
                                                                image: item.imageUrl 
                                                            });
                                                            setPersonalNoteMode('edit');
                                                        }}
                                                        style={{ border: 'none', background: 'transparent' }}
                                                    >
                                                    </Button>
                                                    <Button 
                                                        size="small" 
                                                        icon={<ShareAltOutlined style={{ color: '#FFB74D' }} />} 
                                                        disabled={item.isShared}
                                                        onClick={() => handleSharePersonalNote(item.id)}
                                                        style={{ border: 'none', background: 'transparent' }}
                                                    >
                                                        {item.isShared ? "已分享" : ""}
                                                    </Button>
                                                    <Popconfirm
                                                        title="删除此笔记？"
                                                        okText="删除"
                                                        cancelText="取消"
                                                        onConfirm={() => handleDeletePersonalNote(item.id)}
                                                    >
                                                        <Button
                                                            size="small"
                                                            icon={<DeleteOutlined style={{ color: '#E57373' }} />}
                                                            danger
                                                            style={{ border: 'none', background: 'transparent' }}
                                                        >
                                                        </Button>
                                                    </Popconfirm>
                                                </Space>
                                            </div>
                                            <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: '展开' }} style={{ fontSize: 13, color: '#546E7A' }}>
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
                                     const numericUserId = getNumericUserId();
                                     if (!numericUserId) {
                                         message.warning("请先登录后保存个人笔记");
                                         return;
                                     }
                                     try {
                                        if (personalNoteMode === 'create') {
                                            await addPersonalNote({
                                                userId: numericUserId,
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
                                        listPersonalNotes(numericUserId).then((list) => setPersonalNotes(toArray(list)));
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

            {notePreview && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }}>
                    <div
                        ref={notePreviewRef}
                        style={{
                            position: 'absolute',
                            left: notePreviewPosition.x,
                            top: notePreviewPosition.y,
                            width: notePreviewSize.width,
                            height: notePreviewSize.height,
                            background: '#fff',
                            borderRadius: 8,
                            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            pointerEvents: 'auto'
                        }}
                        onMouseDown={handleNotePreviewMouseDown}
                        onMouseUp={syncNotePreviewSize}
                        onMouseLeave={syncNotePreviewSize}
                    >
                        <div
                            style={{
                                padding: '8px 12px',
                                borderBottom: '1px solid #eee',
                                background: '#fafafa',
                                cursor: 'move',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}
                        >
                            <Text strong>{notePreview.title || "未命名"}</Text>
                            <Space>
                                {notePreview._source === 'personal' && (
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<ShareAltOutlined />}
                                        disabled={notePreview.isShared}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={() => handleSharePersonalNote(notePreview.id)}
                                    >
                                        {notePreview.isShared ? "已分享" : "分享"}
                                    </Button>
                                )}
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<CloseOutlined />}
                                    style={{ color: '#000' }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={closeNotePreview}
                                />
                            </Space>
                        </div>
                        <div style={{ padding: 12, overflow: 'auto', flex: 1 }}>
                            <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{notePreview.content}</Paragraph>
                            {(notePreview.image || notePreview.imageUrl) && (
                                <img
                                    src={notePreview.image || notePreview.imageUrl}
                                    style={{ maxWidth: '100%', borderRadius: 6, marginTop: 8 }}
                                    alt="note"
                                />
                            )}
                        </div>
                        <div
                            data-resize-handle="true"
                            onMouseDown={(e) => handleNotePreviewResizeStart(e, 'nw')}
                            style={{ position: 'absolute', left: 0, top: 0, width: 12, height: 12, cursor: 'nwse-resize' }}
                        />
                        <div
                            data-resize-handle="true"
                            onMouseDown={(e) => handleNotePreviewResizeStart(e, 'ne')}
                            style={{ position: 'absolute', right: 0, top: 0, width: 12, height: 12, cursor: 'nesw-resize' }}
                        />
                        <div
                            data-resize-handle="true"
                            onMouseDown={(e) => handleNotePreviewResizeStart(e, 'sw')}
                            style={{ position: 'absolute', left: 0, bottom: 0, width: 12, height: 12, cursor: 'nesw-resize' }}
                        />
                        <div
                            data-resize-handle="true"
                            onMouseDown={(e) => handleNotePreviewResizeStart(e, 'se')}
                            style={{ position: 'absolute', right: 0, bottom: 0, width: 12, height: 12, cursor: 'nwse-resize' }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
