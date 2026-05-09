import { useState, useEffect, useRef } from 'react';
import { Box, Typography, IconButton, TextField, CircularProgress, Dialog, Fab, Badge, Popover, alpha } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded';
import * as signalR from '@microsoft/signalr';
import { api } from '../../../utils/api';
import { useAuthStore } from '../../../store/useAuthStore';
import { 
    fetchReturnMessages, 
    sendReturnMessage, 
    fetchOrderMessages, 
    sendOrderMessage,
    type ReturnMessage,
    type OrderMessage
} from '../../branch-operations/api';

// --- Types ---
type ChatContextType = 'order' | 'return';

interface SharedMessage {
    messageId: number;
    content: string;
    senderUserId: number;
    senderName: string;
    senderRole: string;
    sentAt: string;
}

interface SharedFloatingChatProps {
    contextType: ChatContextType;
    id: number | null;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

// --- Helper Component for Message Markdown Rendering ---
function MessageContent({ content, onImageClick, isOwn }: { content: string; onImageClick: (url: string) => void; isOwn: boolean }) {
    const imgRegex = /!\[(.*?)\]\((.*?)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = imgRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
            parts.push({ type: 'text', value: content.substring(lastIndex, match.index) });
        }
        parts.push({ type: 'image', alt: match[1], url: match[2] });
        lastIndex = imgRegex.lastIndex;
    }

    if (lastIndex < content.length) {
        parts.push({ type: 'text', value: content.substring(lastIndex) });
    }

    return (
        <Box sx={{ display: 'grid', gap: 0.8 }}>
            {parts.map((p, i) => {
                if (p.type === 'text') {
                    return (
                        <Typography 
                            key={i} 
                            sx={{ fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.5 }}
                        >
                            {p.value}
                        </Typography>
                    );
                }
                return (
                    <Box
                        key={i}
                        onClick={() => onImageClick(p.url!)}
                        sx={{
                            width: '100%',
                            maxWidth: 240,
                            borderRadius: 2,
                            overflow: 'hidden',
                            cursor: 'pointer',
                            border: '1px solid',
                            borderColor: isOwn ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                            '&:hover': { opacity: 0.9 }
                        }}
                    >
                        <Box component="img" src={p.url} alt={p.alt} sx={{ width: '100%', height: 'auto', display: 'block' }} />
                    </Box>
                );
            })}
        </Box>
    );
}

const POLL_INTERVAL_MS = 10000; // 10s fallback polling

export function SharedFloatingChat({ contextType, id, open: externalOpen, onOpenChange }: SharedFloatingChatProps) {
    const { user, token } = useAuthStore();
    const currentUserId = Number(user?.id);
    
    const [internalOpen, setInternalOpen] = useState(false);
    const open = externalOpen !== undefined ? externalOpen : internalOpen;
    
    const setOpen = (newOpen: boolean) => {
        if (onOpenChange) onOpenChange(newOpen);
        setInternalOpen(newOpen);
    };
    const [messages, setMessages] = useState<SharedMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState('');
    const [sending, setSending] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [pendingImage, setPendingImage] = useState<File | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    
    const bottomRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const anchorRef = useRef<HTMLButtonElement>(null);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior }), 100);
    };

    // --- Message Fetcher ---
    const loadMessages = async (silent = false) => {
        if (!id) return;
        try {
            if (!silent) setLoading(true);
            let data: SharedMessage[] = [];
            if (contextType === 'return') {
                data = await fetchReturnMessages(id);
            } else {
                data = await fetchOrderMessages(id);
            }
            
            setMessages(prev => {
                const hasNew = data.length > prev.length;
                if (hasNew) {
                    if (!open) {
                        // Check if the new message is from someone else
                        const newMsgs = data.filter(m => !prev.some(pm => pm.messageId === m.messageId));
                        if (newMsgs.some(m => m.senderUserId !== currentUserId)) {
                            setUnreadCount(c => c + newMsgs.filter(m => m.senderUserId !== currentUserId).length);
                        }
                    } else {
                        scrollToBottom();
                    }
                }
                return data;
            });
        } catch (err) {
            console.error('Failed to load messages:', err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // --- Initial Load & Polling Fallback ---
    useEffect(() => {
        if (!id) return;
        void loadMessages(false);
        
        // Polling fallback
        pollingRef.current = setInterval(() => void loadMessages(true), POLL_INTERVAL_MS);
        
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [id, contextType]);

    // --- SignalR Real-time Sync ---
    useEffect(() => {
        if (!id || !token) return;

        const hubUrl = contextType === 'return' ? '/hub/returns' : '/hub/workflow';
        let url = typeof api.defaults.baseURL === 'string' ? api.defaults.baseURL : '';
        if (url && !url.startsWith('http')) {
            url = window.location.origin + url;
        }

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${url}${hubUrl}`, {
                withCredentials: true,
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect()
            .build();

        // Listen for message events
        // Returns use 'ReceiveMessage'
        // Orders/Workflow usually use 'ReceiveStatusUpdate' which triggers a refresh
        if (contextType === 'return') {
            connection.on('ReceiveMessage', (pId: number, dto: ReturnMessage) => {
                if (pId === id) {
                    setMessages(prev => {
                        if (prev.some(m => m.messageId === dto.messageId)) return prev;
                        if (!open && dto.senderUserId !== currentUserId) setUnreadCount(c => c + 1);
                        if (open) scrollToBottom();
                        return [...prev, dto];
                    });
                }
            });
        } else {
            connection.on('ReceiveStatusUpdate', () => {
                // For orders, status updates often come with messages or trigger a need to refresh
                void loadMessages(true);
            });
            // Some backend versions might have ReceiveOrderMessage
            connection.on('ReceiveOrderMessage', (pId: number, dto: OrderMessage) => {
                if (pId === id) {
                    setMessages(prev => {
                        if (prev.some(m => m.messageId === dto.messageId)) return prev;
                        if (!open && dto.senderUserId !== currentUserId) setUnreadCount(c => c + 1);
                        if (open) scrollToBottom();
                        return [...prev, dto];
                    });
                }
            });
        }

        connection.start()
            .then(() => {
                const groupName = contextType === 'return' ? 'JoinReturnGroup' : 'JoinOrdersList';
                void connection.invoke(groupName, id);
            })
            .catch(err => console.error('SignalR Chat Error: ', err));

        return () => {
            if (connection.state === signalR.HubConnectionState.Connected) {
                const leaveGroupName = contextType === 'return' ? 'LeaveReturnGroup' : 'LeaveGroup';
                const leaveArg = contextType === 'return' ? id : `Order_${id}`;
                void connection.invoke(leaveGroupName, leaveArg).finally(() => void connection.stop());
            }
        };
    }, [id, contextType, token]);

    const handleOpen = () => {
        setOpen(true);
        setUnreadCount(0);
        scrollToBottom('instant');
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {  
            alert('File size must be less than 10MB.');
            return;
        }

        setPendingImage(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSend = async () => {
        if (!id || (!content.trim() && !pendingImage)) return;
        try {
            setSending(true);
            let finalContent = content.trim();

            if (pendingImage) {
                setUploadingImage(true);
                const formData = new FormData();
                formData.append('file', pendingImage);
                const folderId = contextType === 'return' ? `RET-${id.toString().padStart(5, '0')}` : `ORD-${id.toString().padStart(5, '0')}`;
                formData.append('folder', `${contextType === 'return' ? 'Returns' : 'Orders'}/Messages/${folderId}`);
                
                try {
                    const uploadRes = await api.post('/api/uploads/image', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    const imgUrl = uploadRes.data.url || uploadRes.data.Url;
                    if (imgUrl) {
                        finalContent = finalContent + (finalContent ? '\n' : '') + `![${pendingImage.name}](${imgUrl})`;
                    }
                } catch (err) {
                    console.error('Image upload failed', err);
                    alert('Failed to upload image. Sending text only.');
                } finally {
                    setUploadingImage(false);
                }
            }

            if (finalContent) {
                if (contextType === 'return') {
                    await sendReturnMessage(id, finalContent);
                } else {
                    await sendOrderMessage(id, { content: finalContent });
                }
                setContent('');
                setPendingImage(null);
                void loadMessages(true);
            }
        } finally {
            setSending(false);
        }
    };

    if (!id) return null;

    return (
        <>
            {/* Floating Action Button */}
            <Box sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1200 }}>
                <Badge 
                    badgeContent={unreadCount} 
                    color="error" 
                    overlap="circular" 
                    showZero={false}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    sx={{ 
                        '& .MuiBadge-badge': { 
                            zIndex: 1301, 
                            border: '2px solid white',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                            transform: 'translate(40%, -40%)', // Pushed even further
                        } 
                    }}
                >
                    <Fab 
                        ref={anchorRef}
                        onClick={open ? () => setOpen(false) : handleOpen} 
                        sx={{ 
                            bgcolor: open ? '#FFFFFF' : '#C9A84C', 
                            color: open ? '#C9A84C' : 'white',
                            zIndex: 1300,
                            border: open ? '1px solid' : 'none',
                            borderColor: 'rgba(201,168,76,0.3)',
                            boxShadow: open ? '0 4px 20px rgba(0,0,0,0.1)' : '0 8px 30px rgba(201, 168, 76, 0.4)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': { 
                                bgcolor: open ? '#FDFCFB' : '#B8963D',
                                transform: 'scale(1.05)'
                            },
                            width: 60, height: 60
                        }}
                    >
                        {open ? <CloseRoundedIcon /> : <ChatBubbleRoundedIcon />}
                    </Fab>
                </Badge>
            </Box>

            {/* Chat Widget Popover */}
            <Popover
                open={open}
                anchorEl={anchorRef.current}
                onClose={() => setOpen(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                disableEnforceFocus
                disableAutoFocus
                sx={{ 
                    pointerEvents: 'none', 
                    '& .MuiPopover-paper': { 
                        pointerEvents: 'auto', 
                        mt: -2, mr: 0,
                        overflow: 'visible',
                        borderRadius: '24px 24px 8px 24px',
                        boxShadow: '0 20px 50px rgba(107, 76, 42, 0.15)',
                    } 
                }}
            >
                <Box sx={{ width: 360, height: 520, display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', borderRadius: 'inherit', overflow: 'hidden' }}>
                    {/* Header */}
                    <Box sx={{ 
                        p: 2, 
                        bgcolor: '#FFFFFF', 
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ 
                                width: 36, height: 36, borderRadius: '12px', 
                                bgcolor: 'rgba(201, 168, 76, 0.12)', 
                                color: '#C9A84C',
                                display: 'flex', alignItems: 'center', justifyContent: 'center' 
                            }}>
                                <ChatBubbleRoundedIcon sx={{ fontSize: 18 }} />
                            </Box>
                            <Box>
                                <Typography sx={{ fontWeight: 800, fontSize: 14, color: '#6B4C2A', letterSpacing: '-0.01em' }}>
                                    {contextType === 'return' ? 'Return Discussion' : 'Order Discussion'}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#4ade80' }} />
                                    <Typography sx={{ fontSize: 10, color: 'text.secondary', fontWeight: 700 }}>Online</Typography>
                                </Box>
                            </Box>
                        </Box>
                        <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'text.secondary' }}>
                            <CloseRoundedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>

                    {/* Messages Area */}
                    <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'grid', gap: 1.5, bgcolor: '#FDFCFB' }}>
                        {loading && messages.length === 0 ? (
                            <Box sx={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 1 }}>
                                <CircularProgress size={24} sx={{ color: '#C9A84C' }} />
                                <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 600 }}>Syncing messages...</Typography>
                            </Box>
                        ) : messages.length === 0 ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.4, px: 4, textAlign: 'center' }}>
                                <ChatBubbleRoundedIcon sx={{ fontSize: 40, mb: 1, color: '#6B4C2A' }} />
                                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6B4C2A' }}>No messages yet.</Typography>
                                <Typography sx={{ fontSize: 11, mt: 0.5 }}>Ask a question or provide an update to start the conversation.</Typography>
                            </Box>
                        ) : (
                            messages.map((m) => {
                                const isOwn = m.senderUserId === currentUserId;
                                const isHq = ['TenantAdmin', 'HqManager', 'HqStaff'].includes(m.senderRole);
                                return (
                                    <Box key={m.messageId} sx={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                                        <Typography sx={{ fontSize: 10, color: 'text.secondary', mb: 0.5, px: 0.5, fontWeight: 600 }}>
                                            {m.senderName} ({m.senderRole}) · {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Typography>
                                        <Box sx={{
                                            maxWidth: '85%', px: 1.8, py: 1.2,
                                            borderRadius: isOwn ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                            bgcolor: isOwn ? '#6B4C2A' : '#FFFFFF',
                                            color: isOwn ? '#FFFFFF' : 'text.primary',
                                            boxShadow: isOwn ? '0 8px 20px rgba(107, 76, 42, 0.15)' : '0 2px 8px rgba(0,0,0,0.05)',
                                            border: isOwn ? 'none' : '1px solid',
                                            borderColor: 'divider',
                                            position: 'relative'
                                        }}>
                                            <MessageContent content={m.content} onImageClick={setPreviewImageUrl} isOwn={isOwn} />
                                        </Box>
                                    </Box>
                                );
                            })
                        )}
                        <div ref={bottomRef} style={{ height: 1 }} />
                    </Box>

                    {/* Input Area */}
                    <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        {pendingImage && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, mb: 1.5, bgcolor: '#FDFCFB', border: '1px dashed', borderColor: '#C9A84C', borderRadius: 2 }}>
                                <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: '#F4F1EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <AttachFileRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />
                                </Box>
                                <Typography noWrap sx={{ fontSize: 11, color: '#6B4C2A', fontWeight: 700, flex: 1 }}>
                                    {pendingImage.name}
                                </Typography>
                                <IconButton size="small" onClick={() => setPendingImage(null)} sx={{ p: 0.5, bgcolor: 'rgba(0,0,0,0.05)' }}>
                                    <CloseRoundedIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                            </Box>
                        )}
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                            <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleImageUpload} />
                            <IconButton 
                                onClick={() => fileInputRef.current?.click()} 
                                disabled={sending || uploadingImage}
                                sx={{ 
                                    color: '#6B4C2A', 
                                    bgcolor: '#F4F1EA', 
                                    borderRadius: '12px',
                                    '&:hover': { bgcolor: '#EAE5D9' }
                                }}
                            >
                                {uploadingImage ? <CircularProgress size={20} color="inherit" /> : <AttachFileRoundedIcon sx={{ fontSize: 20 }} />}
                            </IconButton>
                            <TextField
                                fullWidth
                                multiline
                                maxRows={4}
                                placeholder="Type a message..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                onKeyDown={(e) => { 
                                    if (e.key === 'Enter' && !e.shiftKey) { 
                                        e.preventDefault(); 
                                        void handleSend(); 
                                    } 
                                }}
                                sx={{ 
                                    '& .MuiOutlinedInput-root': { 
                                        borderRadius: '12px',
                                        bgcolor: '#FDFCFB',
                                        fontSize: 13,
                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#C9A84C' },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#C9A84C' }
                                    } 
                                }}
                            />
                            <IconButton 
                                disabled={sending || (!content.trim() && !pendingImage)}
                                onClick={() => void handleSend()}
                                sx={{ 
                                    color: 'white', 
                                    bgcolor: content.trim() || pendingImage ? '#C9A84C' : '#EAE5D9',
                                    borderRadius: '12px',
                                    '&:hover': { bgcolor: '#B8963D' },
                                    '&.Mui-disabled': { bgcolor: '#F4F1EA', color: 'rgba(0,0,0,0.12)' }
                                }}
                            >
                                {sending ? <CircularProgress size={20} color="inherit" /> : <SendRoundedIcon sx={{ fontSize: 20 }} />}
                            </IconButton>
                        </Box>
                    </Box>
                </Box>
            </Popover>

            {/* Lightbox */}
            <Dialog 
                open={Boolean(previewImageUrl)} 
                onClose={() => setPreviewImageUrl(null)} 
                maxWidth="lg" 
                PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none', overflow: 'visible', m: 2 } }}
            >
                <Box sx={{ position: 'relative' }}>
                    <IconButton 
                        onClick={() => setPreviewImageUrl(null)} 
                        sx={{ position: 'absolute', right: -12, top: -12, bgcolor: '#fff', boxShadow: 3, '&:hover': { bgcolor: '#f5f5f5' }, zIndex: 1 }}
                    >
                        <CloseRoundedIcon />
                    </IconButton>
                    {previewImageUrl && <Box component="img" src={previewImageUrl} sx={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 3, boxShadow: 24, objectFit: 'contain' }} />}
                </Box>
            </Dialog>

            <style>{`
                @keyframes pulse-dot {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.5); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </>
    );
}
