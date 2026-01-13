import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, Button, Space, Tag, Typography, message, Divider, List, Input } from "antd";

import { getRoom, createPomodoro, listPomodoros, getCoins } from "../api/rooms";
import PomodoroTimer from "../components/PomodoroTimer";

const { Text } = Typography;

export default function RoomDetailPage() {
  const { id } = useParams();
  const roomId = useMemo(() => Number(id), [id]);

  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("studyroom_user");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          return {
            id: String(parsed.id || ""),
            name: String(parsed.name || "").trim() || "游客",
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

  const [room, setRoom] = useState(null);
  const [loadingRoom, setLoadingRoom] = useState(false);

  const [coins, setCoins] = useState(null);
  const [loadingCoins, setLoadingCoins] = useState(false);

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
    setLoadingCoins(true);
    try {
      const data = await getCoins(roomId);
      setCoins(data);
    } catch (e) {
      console.error(e);
      message.error(`获取 coins 失败：${e.message}`);
    } finally {
      setLoadingCoins(false);
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
    refreshRoom();
    refreshCoins();
    refreshPomodoros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const submitPomodoro = async (result) => {
    try {
      const resp = await createPomodoro(roomId, { durationMinutes: 25, result });
      message.success(`记录成功：${result}，本次 +${resp.awardedCoins || 0} coins`);
      await refreshCoins();
      await refreshPomodoros();
    } catch (e) {
      console.error(e);
      message.error(`记录失败：${e.message}`);
    }
  };

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
    const scheme = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${scheme}://${window.location.host}/ws`;

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
        return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <Space style={{ marginBottom: 12 }}>
        <Link to="/rooms">
          <Button>返回列表</Button>
        </Link>
        <Button onClick={() => { refreshRoom(); refreshCoins(); refreshPomodoros(); }}>
          刷新
        </Button>
      </Space>

      <Card title={`房间详情（GET /api/rooms/${roomId}）`} loading={loadingRoom}>
        {room ? (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Space wrap>
              <Text strong style={{ fontSize: 18 }}>{room.title}</Text>
              <Tag>{room.subject}</Tag>
              <Tag color="blue">ID: {room.id}</Tag>
            </Space>
            <Text type="secondary">{room.description || "（无描述）"}</Text>
            <Text type="secondary">创建时间：{room.createdAt ? String(room.createdAt) : ""}</Text>
          </Space>
        ) : (
          <Text type="secondary">房间不存在或加载失败</Text>
        )}
      </Card>

      <div style={{ height: 16 }} />

      <Card
        title="实时在线（WebSocket /ws）"
        extra={
          <Space wrap>
            <Tag color={wsStatus === "connected" ? "green" : wsStatus === "connecting" ? "gold" : "default"}>
              WS: {wsStatus}
            </Tag>
            <Tag color="blue">在线：{members.length}</Tag>
          </Space>
        }
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
        title="Coins（GET /api/rooms/{id}/coins）"
        loading={loadingCoins}
        extra={
          coins ? (
            <Space wrap>
              <Tag color="gold">Total: {coins.totalCoins ?? 0}</Tag>
              <Tag>Last: {coins.lastTransactionAt ? String(coins.lastTransactionAt) : "-"}</Tag>
            </Space>
          ) : null
        }
      >
        <Text type="secondary">完成一次 SUCCESS 默认 +5 coins（MVP 规则写死）。</Text>
      </Card>

      <div style={{ height: 16 }} />

      <Card title="番茄钟（前端计时 + 后端记录）">
        <PomodoroTimer
          initialMinutes={25}
          onComplete={() => {
            message.info("计时完成：可点 SUCCESS / FAIL 记录到后端");
            wsSend({ type: "timerStatus", payload: { status: "idle" } });
          }}
          onStart={() => wsSend({ type: "timerStatus", payload: { status: "focusing" } })}
          onStop={() => wsSend({ type: "timerStatus", payload: { status: "idle" } })}
        />
        <Divider />
        <Space wrap>
          <Button type="primary" onClick={() => submitPomodoro("SUCCESS")}>
            完成 SUCCESS（记录 + 加币）
          </Button>
          <Button danger onClick={() => submitPomodoro("FAIL")}>
            失败 FAIL（仅记录）
          </Button>
        </Space>
      </Card>

      <div style={{ height: 16 }} />

      <Card
        title="房间聊天（WebSocket）"
        extra={<Text type="secondary">轻量 MVP：不存库，刷新会丢</Text>}
      >
        <List
          size="small"
          style={{ maxHeight: 240, overflow: "auto", marginBottom: 12 }}
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

      <div style={{ height: 16 }} />

      <Card title="Pomodoro 记录（GET /api/rooms/{id}/pomodoros）" loading={loadingPomodoros}>
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
  );
}
