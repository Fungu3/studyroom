import { useState } from "react";
import { Button, Input, List, Typography, Tooltip } from "antd";
import { 
    MessageOutlined, 
    StarOutlined, 
    StarFilled 
} from "@ant-design/icons";

const { Text, Paragraph } = Typography;

export default function NoteItem({ note, user, onCollect, onAddComment }) {
    const [commentsExpanded, setCommentsExpanded] = useState(false);
    const [commentInput, setCommentInput] = useState("");

    const isCollected = note.collectedByUserIds && note.collectedByUserIds.includes(Number(user.id));
    const comments = note.comments || [];

    const handleComment = () => {
        if (!commentInput.trim()) return;
        onAddComment(note.id, commentInput);
        setCommentInput("");
    };

    return (
        <div style={{ marginBottom: 16, borderBottom: '1px solid #eee', paddingBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text strong style={{ fontSize: 13 }}>{note.title}</Text>
                <Text type="secondary" style={{ fontSize: 10 }}>{note.username || "Unknown"}</Text>
            </div>
            
            <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: '展开' }} style={{ marginBottom: 8, fontSize: 13, color: '#333' }}>
                {note.content}
            </Paragraph>
            
            {note.image && (
                <div style={{ marginBottom: 8 }}>
                    <img src={note.image} style={{ maxWidth: '100%', borderRadius: 4 }} alt="note" />
                </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button 
                    type="text" 
                    size="small" 
                    icon={<MessageOutlined />} 
                    style={{ fontSize: 12 }}
                    onClick={() => setCommentsExpanded(!commentsExpanded)}
                >
                    评论 ({comments.length})
                </Button>
                
                <Tooltip title={isCollected ? "已收藏" : "收藏 (作者得1金币)"}>
                    <Button 
                        type="text" 
                        size="small" 
                        icon={isCollected ? <StarFilled style={{color: '#faad14'}} /> : <StarOutlined />} 
                        onClick={() => onCollect(note.id)}
                    >
                        {note.collectedByUserIds?.length || 0}
                    </Button>
                </Tooltip>
            </div>

            {commentsExpanded && (
                <div style={{ marginTop: 12, background: '#fafafa', padding: 8, borderRadius: 4 }}>
                    <List
                        size="small"
                        dataSource={comments}
                        locale={{ emptyText: '暂无评论' }}
                        renderItem={c => (
                            <List.Item style={{ padding: '4px 0', border: 'none' }}>
                                <div style={{ width: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text type="secondary" style={{ fontSize: 11 }}>{c.username}</Text>
                                        <Text type="secondary" style={{ fontSize: 10 }}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}</Text>
                                    </div>
                                    <div style={{ fontSize: 12 }}>{c.content}</div>
                                </div>
                            </List.Item>
                        )}
                    />
                    <div style={{ display: 'flex', marginTop: 8, gap: 8 }}>
                        <Input 
                            size="small" 
                            placeholder="写下你的评论..." 
                            value={commentInput} 
                            onChange={e => setCommentInput(e.target.value)}
                            onPressEnter={handleComment}
                        />
                        <Button type="primary" size="small" onClick={handleComment}>发送</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
