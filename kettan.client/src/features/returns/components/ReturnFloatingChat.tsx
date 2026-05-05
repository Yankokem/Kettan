import { useState, useEffect, useRef } from 'react';
import { Box, Typography, IconButton, TextField, CircularProgress, Dialog, Fab, Badge, Popover } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded';
import * as signalR from '@microsoft/signalr';
import { api } from '../../../utils/api';
import { useAuthStore } from '../../../store/useAuthStore';
import { fetchReturnMessages, sendReturnMessage, type ReturnMessage } from '../../branch-operations/api';

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
              border: '2px solid',
              borderColor: isOwn ? 'rgba(255,255,255,0.2)' : 'divider',
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

export function ReturnFloatingChat({ returnId, currentUserId }: { returnId: number; currentUserId?: number }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ReturnMessage[]>([]);
  const [loading, setLoading] = useState(false); // only true on explicit initial load
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const anchorRef = useRef<HTMLButtonElement>(null);

  // Initial load effect
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        setLoading(true);
        const msgs = await fetchReturnMessages(returnId);
        if (active) {
            setMessages(msgs);
            // Scroll to bottom only if open
            if (open) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'instant' }), 100);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [returnId, open]);

  // SignalR logic
  useEffect(() => { 
    let url = typeof api.defaults.baseURL === 'string' ? api.defaults.baseURL : '';
    if (url && !url.startsWith('http')) {
        url = window.location.origin + url;
    }
    
    const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${url}/hub/returns`, {
            withCredentials: true,
            accessTokenFactory: () => useAuthStore.getState().token || ''
        })
        .withAutomaticReconnect()
        .build();

    connection.on('ReceiveMessage', (pReturnId: number, dto: ReturnMessage) => {
        if (pReturnId === returnId) {
            setMessages(prev => {
                if (prev.some(m => m.messageId === dto.messageId)) return prev;
                return [...prev, dto];
            });
            // Update unread count if chat is closed and we didn't send it
            setOpen(curOpen => {
                if (!curOpen && dto.senderUserId !== currentUserId) {
                    setUnreadCount(c => c + 1);
                } else if (curOpen) {
                    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
                }
                return curOpen;
            });
        }
    });

    connection.start()
        .then(() => connection.invoke('JoinReturnGroup', returnId))
        .catch(err => console.error('SignalR Connection Error: ', err));

    return () => {
        if (connection.state === signalR.HubConnectionState.Connected) {
            connection.invoke('LeaveReturnGroup', returnId).finally(() => void connection.stop());
        }
    };
  }, [returnId, currentUserId]);

  const handleOpen = () => {
      setOpen(true);
      setUnreadCount(0);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'instant' }), 100);
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
    if (!content.trim() && !pendingImage) return;
    try {
      setSending(true);
      let finalContent = content.trim();

      if (pendingImage) {
          setUploadingImage(true);
          const formData = new FormData();
          formData.append('file', pendingImage);
          formData.append('folder', `Returns/Messages/RET-${returnId.toString().padStart(5, '0')}`);
          
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
              alert('Failed to upload image. Sending text only if any.');
          } finally {
              setUploadingImage(false);
          }
      }

      if (finalContent) await sendReturnMessage(returnId, finalContent);
      setContent('');
      setPendingImage(null);
    } finally {
      setSending(false);
    }
  };

  return (
      <>
        {/* Floating Action Button */}
        <Box sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1200 }}>
            <Badge 
                badgeContent={unreadCount} 
                color="error" 
                overlap="rectangular" 
                anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                sx={{ '& .MuiBadge-badge': { zIndex: 99, border: '2px solid white' } }}
            >
                <Fab 
                    ref={anchorRef}
                    onClick={open ? () => setOpen(false) : handleOpen} 
                    sx={{ 
                        bgcolor: open ? '#EAE5D9' : '#6B4C2A', 
                        color: open ? '#6B4C2A' : 'white',
                        boxShadow: '0 8px 30px rgba(107, 76, 42, 0.3)',
                        '&:hover': { bgcolor: open ? '#EAE5D9' : '#543B21' },
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
            sx={{ pointerEvents: 'none', '& .MuiPopover-paper': { pointerEvents: 'auto', mt: -2, mr: 2 } }}
            slotProps={{ paper: { elevation: 8, sx: { overflow: 'visible', borderRadius: '16px 16px 4px 16px' } } }}
        >
            <Box sx={{ width: 340, height: 500, display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
                {/* Header */}
                <Box sx={{ p: 2, bgcolor: '#6B4C2A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '16px 16px 0 0' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ChatBubbleRoundedIcon sx={{ fontSize: 18 }} />
                        <Typography sx={{ fontWeight: 800, fontSize: 14 }}>Return Conversation</Typography>
                    </Box>
                </Box>

                {/* Messages Area */}
                <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'grid', gap: 1, bgcolor: '#FAFAFA' }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress size={24} sx={{ color: '#6B4C2A' }} />
                        </Box>
                    ) : messages.length === 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5 }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>No messages yet.</Typography>
                            <Typography sx={{ fontSize: 12 }}>Start the conversation below.</Typography>
                        </Box>
                    ) : (
                        messages.map((m) => {
                            const isOwn = m.senderUserId === currentUserId;
                            return (
                                <Box key={m.messageId} sx={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', mb: 1 }}>
                                    <Typography sx={{ fontSize: 10, color: 'text.secondary', mb: 0.3, px: 0.5 }}>
                                        {m.senderName} · {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Typography>
                                    <Box sx={{
                                        maxWidth: '85%', px: 1.5, py: 1,
                                        borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                        bgcolor: isOwn ? '#6B4C2A' : '#FFFFFF',
                                        color: isOwn ? '#fff' : 'text.primary',
                                        boxShadow: isOwn ? '0 4px 12px rgba(107,76,42,0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
                                        border: isOwn ? 'none' : '1px solid',
                                        borderColor: 'divider'
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
                <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', borderRadius: '0 0 4px 16px' }}>
                    {pendingImage && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.75, mb: 1, bgcolor: 'action.hover', borderRadius: 2 }}>
                            <Typography noWrap sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 600, flex: 1 }}>
                                📎 {pendingImage.name}
                            </Typography>
                            <IconButton size="small" onClick={() => setPendingImage(null)} sx={{ p: 0.5 }}>
                                <CloseRoundedIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                        </Box>
                    )}
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleImageUpload} />
                        <IconButton 
                            onClick={() => fileInputRef.current?.click()} 
                            disabled={sending || uploadingImage}
                            sx={{ color: 'text.secondary', bgcolor: 'action.hover', borderRadius: 2 }}
                        >
                            {uploadingImage ? <CircularProgress size={16} /> : <AttachFileRoundedIcon sx={{ fontSize: 18 }} />}
                        </IconButton>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Type a message..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); } }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                        <IconButton 
                            disabled={sending || (!content.trim() && !pendingImage)}
                            onClick={() => void handleSend()}
                            sx={{ color: content.trim() || pendingImage ? '#6B4C2A' : 'text.disabled' }}
                        >
                            <SendRoundedIcon />
                        </IconButton>
                    </Box>
                </Box>
            </Box>
        </Popover>

        {/* Lightbox */}
        <Dialog open={Boolean(previewImageUrl)} onClose={() => setPreviewImageUrl(null)} maxWidth="lg" PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none', overflow: 'visible', m: 2 } }}>
            <Box sx={{ position: 'relative' }}>
                <IconButton onClick={() => setPreviewImageUrl(null)} sx={{ position: 'absolute', right: -12, top: -12, bgcolor: '#fff', boxShadow: 3, '&:hover': { bgcolor: '#f5f5f5' }, zIndex: 1 }}>
                    <CloseRoundedIcon />
                </IconButton>
                {previewImageUrl && <Box component="img" src={previewImageUrl} sx={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 3, boxShadow: 24, objectFit: 'contain' }} />}
            </Box>
        </Dialog>
      </>
  );
}