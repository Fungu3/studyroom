import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    Card,
    Button,
    Space,
    Tag,
    Typography,
    message,
    Divider,
    List,
    Input,
    Row,
    Col,
    Modal,
    Form,
    InputNumber,
    Avatar,
    Tooltip,
} from "antd";

import { getRoom, createPomodoro, listPomodoros, getCoins } from "../api/rooms";
import PomodoroTimer from "../components/PomodoroTimer";
import tabbleBg from "../assets/tabble.png";

const { Text } = Typography;

export default function RoomDetailPage() {
    const { id } = useParams();
    const roomId = useMemo(() => Number(id), [id]);
    const isRoomIdValid = Number.isFinite(roomId) && roomId > 0;

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
        } catch {
            // ignore
        }
        const idPart = typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        return { id: idPart, name: "游客" };
    });

    const wsRef = useRef(null);
    const [wsStatus, setWsStatus] = useState("disconnected");
    const [members, setMembers] = useState([]);
    const [chatDraft, setChatDraft] = useState("");
    const [chatMessages, setChatMessages] = useState([]);

    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [activeTaskId, setActiveTaskId] = useState(null);
    const taskTimerRef = useRef(null);
    const [taskForm] = Form.useForm();

    const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
    const [nowText, setNowText] = useState("");

    const avatarStripRef = useRef(null);

    const [room, setRoom] = useState(null);
    const [loadingRoom, setLoadingRoom] = useState(false);

    const [coins, setCoins] = useState(null);

    const [pomodoros, setPomodoros] = useState([]);
    const [loadingPomodoros, setLoadingPomodoros] = useState(false);

    const refreshRoom = async () => {
        setLoadingRoom(true);
        try {
            const data = await getRoom(roomId);
            setRoom(data);
        } catch (e) {
            console.error(e);
            message.error(`获取房间详情失败：${e.message}`);
        } finally {
            setLoadingRoom(false);
        }
    };

    const refreshCoins = async () => {
        try {
            const data = await getCoins(roomId);
            setCoins(data);
        } catch (e) {
            console.error(e);
            message.error(`获取 coins 失败：${e.message}`);
        }
    };

    const refreshPomodoros = async () => {
        setLoadingPomodoros(true);
        try {
            const data = await listPomodoros(roomId);
            setPomodoros(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            message.error(`获取 pomodoro 列表失败：${e.message}`);
        } finally {
            setLoadingPomodoros(false);
        }
    };

    useEffect(() => {
        if (!isRoomIdValid) return;
        refreshRoom();
        refreshCoins();
        refreshPomodoros();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId, isRoomIdValid]);

    useEffect(() => {
        const tick = () => {
            const now = new Date();
            const text = now.toLocaleString("zh-CN", {
                timeZone: "Asia/Shanghai",
                hour12: false,
            });
            setNowText(text);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    const persistUser = (next) => {
        setUser(next);
        try {
            localStorage.setItem("studyroom_user", JSON.stringify(next));
        } catch {
            // ignore
        }
    };

    const wsSend = (msgObj) => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            message.warning("实时连接未就绪（WS 未连接）");
            return;
        }
        ws.send(JSON.stringify(msgObj));
    };

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
            ws.send(JSON.stringify({
                type: "join",
                payload: { roomId, user },
            }));
        };

        ws.onmessage = (ev) => {
            let msgObj;
            try {
                msgObj = JSON.parse(ev.data);
            } catch {
                return;
            }
            const { type, payload } = msgObj || {};
            if (!type) return;

            if (type === "joined") {
                const effective = payload?.user;
                if (effective?.id && effective.id !== user.id) {
                    persistUser({ ...user, id: String(effective.id) });
                }
                return;
            }

            if (type === "roomMembersUpdate") {
                setMembers(Array.isArray(payload?.members) ? payload.members : []);
                return;
            }

            if (type === "chatMessage") {
                setChatMessages((prev) => {
                    const next = [...prev, payload].filter(Boolean);
                    return next.slice(-200);
                });
                return;
            }

            if (type === "timerStatus") {
                const userId = payload?.userId;
                const status = payload?.status;
                if (!userId) return;
                setMembers((prev) => prev.map((m) => (
                    m?.id === userId ? { ...m, status: status || m.status } : m
                )));
            }
        };

        ws.onclose = () => {
            setWsStatus("disconnected");
        };

        ws.onerror = () => {
            setWsStatus("disconnected");
        };

        return () => {
            try {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: "leave", payload: {} }));
                }
            } catch {
                // ignore
            }
            try {
                ws.close();
            } catch {
                // ignore
            }
            wsRef.current = null;
        };
    }, [roomId, isRoomIdValid]);

    useEffect(() => {
        if (!activeTaskId) {
            if (taskTimerRef.current) {
                clearInterval(taskTimerRef.current);
                taskTimerRef.current = null;
            }
            return;
        }

        if (taskTimerRef.current) {
            clearInterval(taskTimerRef.current);
            taskTimerRef.current = null;
        }

        taskTimerRef.current = setInterval(() => {
            setTasks((prev) => prev.map((t) => {
                if (t.id !== activeTaskId) return t;
                const baseSeconds = Number.isFinite(t.remainingSec)
                    ? t.remainingSec
                    : Math.max(1, t.minutes) * 60;
                const nextSeconds = Math.max(0, baseSeconds - 1);
                if (nextSeconds === 0) {
                    message.success(`任务「${t.title}」已到时`);
                    setActiveTaskId(null);
                    return { ...t, remainingSec: 0, status: "timeout" };
                }
                return { ...t, remainingSec: nextSeconds, status: "running" };
            }));
        }, 1000);

        return () => {
            if (taskTimerRef.current) {
                clearInterval(taskTimerRef.current);
                taskTimerRef.current = null;
            }
        };
    }, [activeTaskId]);

    const submitPomodoro = async (result) => {
        const numericUserId = Number(user?.id);
        if (!Number.isFinite(numericUserId) || numericUserId <= 0) {
            message.error("请先登录后再记录番茄钟");
            return;
        }
        try {
            const resp = await createPomodoro(roomId, { durationMinutes: 25, result, userId: numericUserId });
            message.success(`记录成功：${result}，本次 +${resp.awardedCoins || 0} coins`);
            await refreshCoins();
            await refreshPomodoros();
        } catch (e) {
            console.error(e);
            message.error(`记录失败：${e.message}`);
        }
    };

    const formatSeconds = (seconds) => {
        const safe = Math.max(0, Number(seconds) || 0);
        const mm = Math.floor(safe / 60);
        const ss = safe % 60;
        return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
    };

    const openTaskModal = () => {
        taskForm.resetFields();
        setTaskModalOpen(true);
    };

    const handleAddTask = async () => {
        const values = await taskForm.validateFields();
        const newTask = {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            title: values.title.trim(),
            minutes: values.minutes,
            status: "idle",
            remainingSec: values.minutes * 60,
        };
        setTasks((prev) => [newTask, ...prev]);
        setTaskModalOpen(false);
    };

    const startTask = (taskId) => {
        setTasks((prev) => prev.map((t) => {
            if (t.id === taskId) {
                return {
                    ...t,
                    status: "running",
                    remainingSec: Number.isFinite(t.remainingSec)
                        ? t.remainingSec
                        : Math.max(1, t.minutes) * 60,
                };
            }
            if (t.status === "running") {
                return { ...t, status: "paused" };
            }
            return t;
        }));
        setActiveTaskId(taskId);
    };

    const completeTask = (taskId) => {
        setTasks((prev) => prev.map((t) => (
            t.id === taskId
                ? { ...t, status: "completed", remainingSec: 0 }
                : t
        )));
        if (activeTaskId === taskId) setActiveTaskId(null);
        message.success("任务已完成");
    };

    const stopTask = (taskId) => {
        setTasks((prev) => prev.map((t) => (
            t.id === taskId ? { ...t, status: "paused" } : t
        )));
        if (activeTaskId === taskId) setActiveTaskId(null);
    };

    const completedTaskCount = tasks.filter((t) => t.status === "completed").length;
    const studyMinutesFromPomodoro = pomodoros.reduce((acc, item) => {
        const minutes = Number(item?.durationMinutes) || 0;
        return acc + minutes;
    }, 0);

    const avatars = members.length > 0
        ? members
        : [{ id: "local", name: user.name || "你" }];

    const transparentCardStyle = {
        background: "transparent",
        borderColor: "rgba(255, 255, 255, 0.35)",
    };

    const scrollBodyStyle = (height) => ({
        height,
        overflow: "auto",
    });

    return (
        <>
        <div
            style={{
                minHeight: "100vh",
                width: "100%",
                backgroundImage: `url(${tabbleBg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundAttachment: "fixed",
                padding: 16,
            }}
        >
        <div style={{ maxWidth: 1240, margin: "32px auto" }}>
            <Space style={{ marginBottom: 12 }}>
                <Link to="/rooms">
                    <Button>返回列表</Button>
                </Link>
                <Button onClick={() => { refreshRoom(); refreshCoins(); refreshPomodoros(); }}>
                    刷新
                </Button>
            </Space>

            <Card loading={loadingRoom} style={{ ...transparentCardStyle }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Space direction="vertical" size={4}>
                        <Text strong style={{ fontSize: 20 }}>{room?.title || "自习室"}</Text>
                        <Space wrap>
                            <Tag>{room?.subject || "未分类"}</Tag>
                            <Tag color="blue">ID: {room?.id ?? roomId}</Tag>
                        </Space>
                    </Space>
                    <Space wrap>
                        <Tag color={wsStatus === "connected" ? "green" : wsStatus === "connecting" ? "gold" : "default"}>
                            WS: {wsStatus}
                        </Tag>
                        <Tag color="blue">房间人数：{members.length}</Tag>
                    </Space>
                </div>
            </Card>

            <div style={{ height: 16 }} />

            <Row gutter={[16, 16]}>
                <Col xs={24} md={7}>
                    <Card
                        title="学习任务待办"
                        extra={<Button type="primary" onClick={openTaskModal}>+ 添加</Button>}
                        style={{ ...transparentCardStyle, height: 360 }}
                        bodyStyle={scrollBodyStyle(280)}
                    >
                        <List
                            dataSource={tasks}
                            locale={{ emptyText: "暂无任务" }}
                            renderItem={(task) => (
                                <List.Item>
                                    <Space direction="vertical" style={{ width: "100%" }}>
                                        <Space wrap>
                                            <Text strong>{task.title}</Text>
                                            <Tag>{task.minutes} 分钟</Tag>
                                            <Tag color={task.status === "completed" ? "green" : task.status === "running" ? "blue" : task.status === "timeout" ? "red" : "default"}>
                                                {task.status === "completed" ? "已完成" : task.status === "running" ? "计时中" : task.status === "timeout" ? "已到时" : task.status === "paused" ? "已暂停" : "待开始"}
                                            </Tag>
                                        </Space>
                                        <Space wrap>
                                            <Text type="secondary">剩余：{formatSeconds(task.remainingSec)}</Text>
                                        </Space>
                                        <Space wrap>
                                            <Button type="primary" disabled={task.status === "completed"} onClick={() => startTask(task.id)}>开始</Button>
                                            <Button disabled={task.status !== "running"} onClick={() => stopTask(task.id)}>暂停</Button>
                                            <Button disabled={task.status === "completed"} onClick={() => completeTask(task.id)}>完成</Button>
                                        </Space>
                                    </Space>
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>

                <Col xs={24} md={10}>
                    <Card
                        title="虚拟形象"
                        bodyStyle={{ padding: 12, ...scrollBodyStyle(240) }}
                        style={{ ...transparentCardStyle, height: 300 }}
                    >
                        <div
                            style={{
                                height: 220,
                                borderRadius: 12,
                                background: "transparent",
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                overflow: "hidden",
                            }}
                        >
                            <div style={{ position: "absolute", inset: 0, opacity: 0.35, background: "linear-gradient(135deg,#e4e9ff,#ffffff)" }} />
                            <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "0 8px", position: "relative" }}>
                                <div
                                    ref={avatarStripRef}
                                    onWheel={(e) => {
                                        e.preventDefault();
                                        const target = avatarStripRef.current;
                                        if (!target) return;
                                        target.scrollLeft += e.deltaY;
                                    }}
                                    style={{
                                        display: "flex",
                                        gap: 12,
                                        overflowX: "auto",
                                        padding: "8px 4px",
                                        scrollbarWidth: "none",
                                        flex: 1,
                                    }}
                                >
                                    {avatars.map((m) => (
                                        <Tooltip key={m.id} title={m.name}>
                                            <div style={{ textAlign: "center" }}>
                                                <Avatar size={64} style={{ backgroundColor: m.id === user.id ? "#722ed1" : "#1677ff" }}>
                                                    {String(m.name || "?").slice(0, 1).toUpperCase()}
                                                </Avatar>
                                                <div style={{ fontSize: 12, marginTop: 6 }}>{m.name || m.id}</div>
                                            </div>
                                        </Tooltip>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} md={7}>
                    <Card title="房间聊天" style={{ ...transparentCardStyle, height: 360 }} bodyStyle={scrollBodyStyle(280)}>
                        <List
                            size="small"
                            style={{ height: 200, overflow: "auto", marginBottom: 12 }}
                            dataSource={chatMessages}
                            locale={{ emptyText: "暂无消息" }}
                            renderItem={(m) => (
                                <List.Item>
                                    <Space direction="vertical" style={{ width: "100%" }}>
                                        <Space wrap>
                                            <Text strong>{m?.user?.name || "?"}</Text>
                                            <Text type="secondary">{m?.ts ? new Date(m.ts).toLocaleTimeString() : ""}</Text>
                                        </Space>
                                        <Text>{m?.content || ""}</Text>
                                    </Space>
                                </List.Item>
                            )}
                        />

                        <Space style={{ width: "100%" }}>
                            <Input
                                value={chatDraft}
                                onChange={(e) => setChatDraft(e.target.value)}
                                onPressEnter={() => {
                                    const text = chatDraft.trim();
                                    if (!text) return;
                                    wsSend({ type: "chat", payload: { roomId, content: text } });
                                    setChatDraft("");
                                }}
                                placeholder="输入消息，回车发送"
                            />
                            <Button
                                type="primary"
                                onClick={() => {
                                    const text = chatDraft.trim();
                                    if (!text) return;
                                    wsSend({ type: "chat", payload: { roomId, content: text } });
                                    setChatDraft("");
                                }}
                            >
                                发送
                            </Button>
                        </Space>
                    </Card>
                </Col>
            </Row>

            <div style={{ height: 16 }} />

            <Row gutter={[16, 16]}>
                <Col xs={24} md={7}>
                    <Card title="植物" style={{ ...transparentCardStyle, height: 240 }} bodyStyle={scrollBodyStyle(180)}>
                        <div
                            style={{
                                height: 180,
                                borderRadius: 12,
                                background: "transparent",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                position: "relative",
                            }}
                        >
                        </div>
                    </Card>
                </Col>

                <Col xs={24} md={10}>
                    <Card style={{ ...transparentCardStyle, height: 240 }} bodyStyle={scrollBodyStyle(180)}>
                        <Row gutter={[12, 12]}>
                            <Col xs={24} sm={8}>
                                <Card size="small" style={{ ...transparentCardStyle }}>
                                    <Text type="secondary">自习时长</Text>
                                    <div style={{ fontSize: 20, fontWeight: 600 }}>{studyMinutesFromPomodoro} 分钟</div>
                                </Card>
                            </Col>
                            <Col xs={24} sm={8}>
                                <Card size="small" style={{ ...transparentCardStyle }}>
                                    <Text type="secondary">完成任务</Text>
                                    <div style={{ fontSize: 20, fontWeight: 600 }}>{completedTaskCount} 个</div>
                                </Card>
                            </Col>
                            <Col xs={24} sm={8}>
                                <Card size="small" style={{ ...transparentCardStyle }}>
                                    <Text type="secondary">获得金币</Text>
                                    <div style={{ fontSize: 20, fontWeight: 600 }}>{coins?.totalCoins ?? 0}</div>
                                </Card>
                            </Col>
                        </Row>
                        <Divider style={{ margin: "12px 0" }} />
                        <Space wrap>
                            <Tag color="gold">Last: {coins?.lastTransactionAt ? String(coins.lastTransactionAt) : "-"}</Tag>
                            <Tag>任务总数：{tasks.length}</Tag>
                        </Space>
                    </Card>
                </Col>

                <Col xs={24} md={7}>
                    <Card title="时间显示与番茄钟" style={{ ...transparentCardStyle, height: 360 }} bodyStyle={scrollBodyStyle(300)}>
                        <Space direction="vertical" style={{ width: "100%" }}>
                            <Card size="small" style={{ ...transparentCardStyle }}>
                                <Text type="secondary">北京时间</Text>
                                <div style={{ fontSize: 16, fontWeight: 600 }}>{nowText || "--"}</div>
                            </Card>
                            <Card size="small" bodyStyle={{ padding: 12 }} style={{ ...transparentCardStyle }}>
                                <Space wrap align="center">
                                    <Text>番茄钟时长</Text>
                                    <InputNumber
                                        min={1}
                                        max={180}
                                        value={pomodoroMinutes}
                                        onChange={(value) => setPomodoroMinutes(value || 1)}
                                    />
                                    <Text type="secondary">分钟</Text>
                                </Space>
                                <div style={{ height: 8 }} />
                                <PomodoroTimer
                                    initialMinutes={pomodoroMinutes}
                                    onComplete={() => {
                                        message.info("计时完成：可点 SUCCESS / FAIL 记录到后端");
                                        wsSend({ type: "timerStatus", payload: { status: "idle" } });
                                    }}
                                    onStart={() => wsSend({ type: "timerStatus", payload: { status: "focusing" } })}
                                    onStop={() => wsSend({ type: "timerStatus", payload: { status: "idle" } })}
                                />
                                <Divider style={{ margin: "12px 0" }} />
                                <Space wrap>
                                    <Button type="primary" onClick={() => submitPomodoro("SUCCESS")}>
                                        完成 SUCCESS（记录 + 加币）
                                    </Button>
                                    <Button danger onClick={() => submitPomodoro("FAIL")}>
                                        失败 FAIL（仅记录）
                                    </Button>
                                </Space>
                            </Card>
                        </Space>
                    </Card>
                </Col>
            </Row>

            <div style={{ height: 16 }} />

            <Card
                title="在线成员"
                extra={<Text type="secondary">可修改昵称后刷新在线列表</Text>}
                style={{ ...transparentCardStyle, height: 320 }}
                bodyStyle={scrollBodyStyle(260)}
            >
                <Space direction="vertical" style={{ width: "100%" }}>
                    <Space wrap align="center">
                        <span>你的昵称：</span>
                        <Input
                            style={{ width: 200 }}
                            value={user.name}
                            onChange={(e) => persistUser({ ...user, name: e.target.value })}
                            onBlur={() => {
                                const trimmed = String(user.name || "").trim() || "游客";
                                const next = trimmed !== user.name ? { ...user, name: trimmed } : user;
                                if (next !== user) persistUser(next);
                                wsSend({ type: "join", payload: { roomId, user: next } });
                            }}
                            placeholder="输入昵称"
                        />
                    </Space>

                    <List
                        size="small"
                        dataSource={members}
                        locale={{ emptyText: wsStatus === "connected" ? "暂无成员" : "未连接" }}
                        renderItem={(m) => (
                            <List.Item>
                                <Space wrap>
                                    <Text strong>{m?.name || m?.id || "?"}</Text>
                                    <Tag color={m?.status === "focusing" ? "green" : "default"}>
                                        {m?.status === "focusing" ? "专注中" : "空闲"}
                                    </Tag>
                                    {m?.id === user.id ? <Tag color="purple">你</Tag> : null}
                                </Space>
                            </List.Item>
                        )}
                    />
                </Space>
            </Card>

            <div style={{ height: 16 }} />

            <Card
                title="Pomodoro 记录"
                loading={loadingPomodoros}
                style={{ ...transparentCardStyle, height: 260 }}
                bodyStyle={scrollBodyStyle(200)}
            >
                <List
                    dataSource={pomodoros}
                    locale={{ emptyText: "暂无记录" }}
                    renderItem={(p) => (
                        <List.Item>
                            <Space wrap>
                                <Tag color={p.result === "SUCCESS" ? "green" : "red"}>{p.result}</Tag>
                                <Text>duration: {p.durationMinutes}min</Text>
                                <Text type="secondary">coins: {p.awardedCoins ?? 0}</Text>
                                <Text type="secondary">at: {p.createdAt ? String(p.createdAt) : ""}</Text>
                            </Space>
                        </List.Item>
                    )}
                />
            </Card>
        </div>
        </div>

        <Modal
            title="新增学习任务"
            open={taskModalOpen}
            onCancel={() => setTaskModalOpen(false)}
            onOk={handleAddTask}
            okText="保存"
            cancelText="取消"
        >
            <Form
                layout="vertical"
                form={taskForm}
                initialValues={{ title: "", minutes: 30 }}
            >
                <Form.Item
                    label="任务名称"
                    name="title"
                    rules={[{ required: true, message: "请输入任务名称" }]}
                >
                    <Input placeholder="如：背单词" maxLength={40} />
                </Form.Item>
                <Form.Item
                    label="规定用时（分钟）"
                    name="minutes"
                    rules={[{ required: true, message: "请输入用时" }]}
                >
                    <InputNumber min={1} max={240} style={{ width: "100%" }} />
                </Form.Item>
            </Form>
        </Modal>
        </>
    );
}
