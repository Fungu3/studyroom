import { useState } from "react";
import { Avatar, Button, Input, List, Typography, Tooltip, message, Popconfirm } from "antd";
import { 
    MessageOutlined, 
    StarOutlined, 
    StarFilled,
    UserAddOutlined,
    DeleteOutlined
} from "@ant-design/icons";

const { Text, Paragraph } = Typography;

export default function NoteItem({ note, user, onCollect, onAddComment, onDeleteNote, onDeleteComment, isMacaron }) {
    const [commentsExpanded, setCommentsExpanded] = useState(false);
    const [commentInput, setCommentInput] = useState("");

    const isCollected = note.collectedByUserIds && note.collectedByUserIds.includes(Number(user.id));
    const comments = note.comments || [];
    const displayName = note.username || "Unknown";
    const avatarSrc = note.userAvatar || (note.userId ? `https://api.dicebear.com/7.x/notionists/svg?seed=${note.userId}` : undefined);
    const isSelf = String(note.userId || "") === String(user?.id || "");
    const imageSrc = note.imageUrl || note.image;

    const handleComment = () => {
        if (!commentInput.trim()) return;
        onAddComment(note.id, commentInput);
        setCommentInput("");
    };

    return (
        <div style={{ marginBottom: 16, borderBottom: '2px dashed #B2DFDB', paddingBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text strong style={{ fontSize: 14, color: '#5C6BC0', fontFamily: 'Comic Sans MS' }}>{note.title}</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Avatar size={24} src={avatarSrc} style={{ backgroundColor: '#FFCC80', fontSize: 12 }}>
                        {displayName?.[0]?.toUpperCase()}
                    </Avatar>
                    <Text type="secondary" style={{ fontSize: 11, color: '#9FA8DA' }}>{displayName}</Text>
                    <Button
                        type="text"
                        size="small"
                        icon={<UserAddOutlined />}
                        disabled={isSelf}
                        onClick={() => message.success(`已向 ${displayName} 发送好友申请`)}
                        style={{ fontSize: 11, padding: 0, color: '#81C784' }}
                    >
                        加好友
                    </Button>
                    {isSelf && (
                        <Popconfirm
                            title="删除此笔记？"
                            okText="删除"
                            cancelText="取消"
                            onConfirm={() => onDeleteNote?.(note.id)}
                        >
                            <Button type="text" size="small" icon={<DeleteOutlined />} style={{ fontSize: 11, padding: 0, color: '#E57373' }}>
                                删除
                            </Button>
                        </Popconfirm>
                    )}
                </div>
            </div>

            <div style={{ maxHeight: 220, minHeight: 120, overflowY: 'auto', paddingRight: 4 }}>
                <Paragraph style={{ marginBottom: 8, fontSize: 13, color: '#546E7A', fontFamily: 'Comic Sans MS' }}>
                    {note.content}
                </Paragraph>

                {imageSrc && (
                    <div style={{ marginBottom: 8 }}>
                        <img src={imageSrc} style={{ maxWidth: '100%', borderRadius: 8, border: '2px solid #FFF' }} alt="note" />
                    </div>
                )}

                {commentsExpanded && (
                    <div style={{ marginTop: 12, background: 'rgba(255,255,255,0.6)', padding: 8, borderRadius: 12, border: '1px solid #E1F5FE' }}>
                        <List
                            size="small"
                            dataSource={comments}
                            locale={{ emptyText: '暂无评论' }}
                            renderItem={c => (
                                <List.Item style={{ padding: '4px 0', border: 'none' }}>
                                    <div style={{ width: '100%' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text strong style={{ fontSize: 11, color: '#7986CB' }}>{c.username}</Text>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Text type="secondary" style={{ fontSize: 10 }}>{(c.createdAt || c.createTime) ? new Date(c.createdAt || c.createTime).toLocaleDateString() : ''}</Text>
                                                {String(c.userId || "") === String(user?.id || "") && (
                                                    <Popconfirm
                                                        title="删除这条评论？"
                                                        okText="删除"
                                                        cancelText="取消"
                                                        onConfirm={() => onDeleteComment?.(c.id)}
                                                    >
                                                        <Button type="text" size="small" icon={<DeleteOutlined />} style={{ fontSize: 10, padding: 0, color: '#E57373' }}>
                                                            删除
                                                        </Button>
                                                    </Popconfirm>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: 12, color: '#37474F' }}>{c.content}</div>
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
                                style={{ borderRadius: 12, borderColor: '#BDBDBD' }}
                            />
                            <Button type="primary" size="small" onClick={handleComment} style={{ borderRadius: 12, background: '#90CAF9', borderColor: '#90CAF9' }}>发送</Button>
                        </div>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button 
                    type="text" 
                    size="small" 
                    icon={<MessageOutlined style={{ color: '#AB47BC' }} />} 
                    style={{ fontSize: 12, color: '#AB47BC' }}
                    onClick={() => setCommentsExpanded(!commentsExpanded)}
                >
                    评论 ({comments.length})
                </Button>
                
                <Tooltip title={isCollected ? "已收藏" : "收藏 (作者得1金币)"}>
                    <Button 
                        type="text" 
                        size="small" 
                        icon={isCollected ? <StarFilled style={{color: '#FFCA28'}} /> : <StarOutlined style={{ color: '#FFCA28' }} />} 
                        onClick={() => onCollect?.(note, isCollected)}
                        disabled={isSelf}
                        style={{ color: '#FFA000' }}
                    >
                        {note.collectedByUserIds?.length || 0}
                    </Button>
                </Tooltip>
            </div>
        </div>
    );
}
