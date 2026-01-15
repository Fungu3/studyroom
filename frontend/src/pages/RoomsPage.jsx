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
    <div style={{ padding: '24px' }}>
       {loading ? (
         <Skeleton active />
       ) : (
         <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
           {rooms.map(room => {
             // Extract capacity from description if present "Capacity: N"
             let maxCount = 20;
             if (room.description) {
                const capMatch = room.description.match(/Capacity:\s*(\d+)/);
                if (capMatch) {
                    maxCount = parseInt(capMatch[1], 10);
                }
             }
             
             const currentCount = 0; // Backend doesn't support yet

             return (
               <div key={room.id} style={{ width: '300px', height: '320px' }}>
                 <Card
                   hoverable
                   style={{ width: '100%', height: '100%' }}
                   bodyStyle={{ height: 'calc(100% - 160px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                   cover={
                     <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
                       <img alt="example" src={getRandomImage(room.id)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                       <div style={{ position: 'absolute', top: 10, left: 10 }}>
                          <Tag color="success">
                            学习中
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
                              专注时刻
                           </Text>
                        </div>
                      </div>
                    }
                   />
                 </Card>
               </div>
             );
           })}
           {rooms.length === 0 && !loading && (
               <div style={{ width: '100%', textAlign: 'center', marginTop: 50 }}>
                   <Text type="secondary">暂无房间，点击上方“创建房间”开始吧</Text>
               </div>
           )}
         </div>
       )}
    </div>
  );
}
