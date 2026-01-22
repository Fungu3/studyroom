// frontend/src/pages/RoomsPage.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, Tag, Typography, message, Row, Col, Badge, Skeleton } from "antd";
import { listRooms } from "../api/rooms";
import { UserOutlined, ClockCircleOutlined, CloudFilled, StarFilled, ReadFilled } from '@ant-design/icons';
import './RoomsPage.css';

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
    <div className="kawaii-page-container">
       {/* Background Decorations */}
       <div className="kawaii-decorations">
          {/* Clouds (4-6) - Large size 80-120px handled by CSS base + scaling or inline font-size */}
          <CloudFilled className="kawaii-cloud" style={{ top: '10%', left: '0%', animationDelay: '-5s', fontSize: '120px', opacity: 0.9 }} />
          <CloudFilled className="kawaii-cloud" style={{ top: '60%', left: '20%', animationDelay: '-20s', fontSize: '90px', opacity: 0.8 }} />
          <CloudFilled className="kawaii-cloud" style={{ top: '30%', left: '50%', animationDelay: '-12s', fontSize: '110px', opacity: 0.85 }} />
          <CloudFilled className="kawaii-cloud" style={{ top: '80%', left: '70%', animationDelay: '-35s', fontSize: '100px', opacity: 0.75 }} />
          <CloudFilled className="kawaii-cloud" style={{ top: '20%', left: '80%', animationDelay: '-50s', fontSize: '85px', opacity: 0.8 }} />
          <CloudFilled className="kawaii-cloud" style={{ top: '50%', left: '10%', animationDelay: '0s', fontSize: '95px', opacity: 0.85 }} />
          
          {/* Stars (5-8) - Enlarged to 20-25px, Fast Left->Right */ }
          <StarFilled className="kawaii-star" style={{ top: '15%', animationDelay: '0s', fontSize: '22px' }} />
          <StarFilled className="kawaii-star" style={{ top: '70%', animationDelay: '4s', fontSize: '20px' }} />
          <StarFilled className="kawaii-star" style={{ top: '30%', animationDelay: '8s', fontSize: '25px' }} />
          <StarFilled className="kawaii-star" style={{ top: '50%', animationDelay: '2s', fontSize: '24px' }} />
          <StarFilled className="kawaii-star" style={{ top: '85%', animationDelay: '10s', fontSize: '21px' }} />
          <StarFilled className="kawaii-star" style={{ top: '10%', animationDelay: '6s', fontSize: '23px' }} />
          <StarFilled className="kawaii-star" style={{ top: '60%', animationDelay: '12s', fontSize: '25px' }} />
          
          {/* Books - Enlarged 25-30px, Random Appear/Disappear */}
          <ReadFilled className="kawaii-book" style={{ top: '25%', left: '30%', fontSize: '28px', animationDelay: '0s' }} />
          <ReadFilled className="kawaii-book" style={{ top: '75%', left: '60%', fontSize: '30px', animationDelay: '-10s' }} />
          <ReadFilled className="kawaii-book" style={{ top: '15%', left: '85%', fontSize: '26px', animationDelay: '-20s' }} />
          <ReadFilled className="kawaii-book" style={{ top: '85%', left: '15%', fontSize: '25px', animationDelay: '-5s' }} />
          <ReadFilled className="kawaii-book" style={{ top: '50%', left: '45%', fontSize: '29px', animationDelay: '-25s' }} />
       </div>

       {loading ? (
         <Skeleton active />
       ) : (
         <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', position: 'relative', zIndex: 1 }}>
           {rooms.map(room => {
             // Extract capacity from description if present "Capacity: N"
             let maxCount = 20;
             if (room.description) {
                const capMatch = room.description.match(/Capacity:\s*(\d+)/);
                if (capMatch) {
                    maxCount = parseInt(capMatch[1], 10);
                }
             }
             
             const currentCount = Number.isFinite(Number(room?.onlineUsers))
               ? Number(room.onlineUsers)
               : 0;

             return (
               <div key={room.id} className="kawaii-card-wrapper" style={{ width: '300px', height: '320px' }}>
                 <Card
                   hoverable
                   className="kawaii-card"
                   style={{ width: '100%', height: '100%' }}
                   bodyStyle={{ height: 'calc(100% - 160px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '12px' }}
                   cover={
                     <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
                       <img alt="example" src={getRandomImage(room.id)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                       <div style={{ position: 'absolute', top: 10, left: 10 }}>
                          <Tag color="#87d068" style={{ border: 'none', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                            学习中
                          </Tag>
                       </div>
                     </div>
                   }
                   onClick={() => navigate(`/rooms/${room.id}`)}
                 >
                   <div>
                     <div className="kawaii-card-title">{room.title}</div>
                   </div>
                   
                   <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="kawaii-card-info">
                        <UserOutlined /> {currentCount} / {maxCount} 人
                      </span>
                      <span className="kawaii-card-info">
                         <ClockCircleOutlined /> 专注时刻
                      </span>
                   </div>
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
