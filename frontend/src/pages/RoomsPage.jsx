// frontend/src/pages/RoomsPage.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, Tag, Typography, message, Row, Col, Badge, Skeleton } from "antd";
import { listRooms } from "../api/rooms";
import { UserOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Meta } = Card;
const { Text } = Typography;

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const data = await listRooms();
      setRooms(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      message.error(`获取房间列表失败：${e.message || "请确认后端服务"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const getRandomImage = (id) => `https://picsum.photos/seed/${id}/300/160`;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
       {loading ? (
         <Skeleton active />
       ) : (
         <Row gutter={[24, 24]}>
           {rooms.map(room => {
             // Mock Status & Capacity
             const isLearning = Math.random() > 0.3;
             const currentCount = Math.floor(Math.random() * 10);
             const maxCount = 20;

             return (
               <Col xs={24} sm={12} md={8} lg={6} key={room.id}>
                 <Card
                   hoverable
                   cover={
                     <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
                       <img alt="example" src={getRandomImage(room.id)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                       <div style={{ position: 'absolute', top: 10, left: 10 }}>
                          <Tag color={isLearning ? "success" : "error"}>
                            {isLearning ? "学习中" : "未开始"}
                          </Tag>
                       </div>
                     </div>
                   }
                   onClick={() => navigate(`/rooms/${room.id}`)}
                 >
                   <Meta
                    title={room.title}
                    description={
                      <div>
                        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                           <Text type="secondary" style={{ fontSize: 12 }}>
                             <UserOutlined /> {currentCount} / {maxCount}
                           </Text>
                           <Text type="secondary" style={{ fontSize: 12 }}>
                              {isLearning ? "专注时刻" : "休息中"}
                           </Text>
                        </div>
                      </div>
                    }
                   />
                 </Card>
               </Col>
             );
           })}
           {rooms.length === 0 && !loading && (
               <div style={{ width: '100%', textAlign: 'center', marginTop: 50 }}>
                   <Text type="secondary">暂无房间，点击上方“创建房间”开始吧</Text>
               </div>
           )}
         </Row>
       )}
    </div>
  );
}
