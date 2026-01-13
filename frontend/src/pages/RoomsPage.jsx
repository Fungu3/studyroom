import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Form, Input, Button, message, List, Tag, Space, Badge } from "antd";
import { listRooms, createRoom } from "../api/rooms";
import { health } from "../api/system";

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [creating, setCreating] = useState(false);

  // null = 检测中，true = 在线，false = 离线
  const [backendOk, setBackendOk] = useState(null);

  const checkBackend = async () => {
    try {
      await health();
      setBackendOk(true);
    } catch (e) {
      setBackendOk(false);
    }
  };

  const fetchRooms = async () => {
    setLoadingList(true);
    try {
      const data = await listRooms();
      setRooms(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      message.error(`获取房间列表失败：${e.message || "请确认后端 8080 已启动"}`);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    checkBackend();
    fetchRooms();
  }, []);

  const onFinish = async (values) => {
    setCreating(true);
    try {
      await createRoom(values);
      message.success("创建成功");
      await fetchRooms();
    } catch (e) {
      console.error(e);
      message.error(`创建失败：${e.message || "请检查后端校验/日志"}`);
      checkBackend();
    } finally {
      setCreating(false);
    }
  };

  const backendText = backendOk === null ? "检测中..." : backendOk ? "在线（8080）" : "离线（8080）";
  const backendBadgeStatus = backendOk === null ? "processing" : backendOk ? "success" : "error";

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>Studyroom 虚拟自习室</h1>
        <Badge status={backendBadgeStatus} text={`后端状态：${backendText}`} />
        <Button size="small" onClick={checkBackend}>
          重新检测
        </Button>
      </div>

      <Card title="创建自习室（POST /api/rooms）">
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="房间标题 title"
            name="title"
            rules={[
              { required: true, message: "请输入标题" },
              { max: 50, message: "标题最多 50 个字符" },
            ]}
          >
            <Input placeholder="例如：离散数学期末复习自习室" />
          </Form.Item>

          <Form.Item
            label="科目 subject"
            name="subject"
            rules={[
              { required: true, message: "请输入科目" },
              { max: 30, message: "科目最多 30 个字符" },
            ]}
          >
            <Input placeholder="例如：离散数学 / 操作系统 / LeetCode" />
          </Form.Item>

          <Form.Item
            label="描述 description"
            name="description"
            rules={[{ max: 200, message: "描述最多 200 个字符" }]}
          >
            <Input.TextArea rows={3} placeholder="例如：每天2个番茄钟，互相答疑，完成任务得积分" />
          </Form.Item>

          <Space>
            <Button type="primary" htmlType="submit" loading={creating}>
              创建
            </Button>
            <Button onClick={fetchRooms} loading={loadingList}>
              刷新列表
            </Button>
          </Space>
        </Form>
      </Card>

      <div style={{ height: 16 }} />

      <Card title={`房间列表（${rooms.length}）`} extra={<span style={{ color: "#888" }}>GET /api/rooms</span>}>
        <List
          loading={loadingList}
          dataSource={rooms}
          locale={{ emptyText: "暂无房间，先创建一个吧" }}
          renderItem={(r) => (
            <List.Item
              actions={[
                <Link key="enter" to={`/rooms/${r.id}`}>
                  进入
                </Link>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <span>{r.title}</span>
                    <Tag>{r.subject}</Tag>
                  </Space>
                }
                description={r.description || "（无描述）"}
              />
              <div style={{ color: "#888" }}>{r.createdAt ? String(r.createdAt) : ""}</div>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
