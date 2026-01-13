import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, Button, Space, Tag, Typography, message, Divider, List } from "antd";

import { getRoom, createPomodoro, listPomodoros, getCoins } from "../api/rooms";
import PomodoroTimer from "../components/PomodoroTimer";

const { Text } = Typography;

export default function RoomDetailPage() {
  const { id } = useParams();
  const roomId = useMemo(() => Number(id), [id]);

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
          onComplete={() => message.info("计时完成：可点 SUCCESS / FAIL 记录到后端")}
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
