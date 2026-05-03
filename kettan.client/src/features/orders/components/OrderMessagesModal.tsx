import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  TextField,
  IconButton,
  Avatar,
  CircularProgress,
  alpha,
  Divider,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import { fetchOrderMessages, sendOrderMessage, type OrderMessage } from '../../branch-operations/api';
import { useAuthStore } from '../../../store/useAuthStore';

interface OrderMessagesModalProps {
  open: boolean;
  onClose: () => void;
  orderId: number | null;
}

const POLL_INTERVAL_MS = 8000; // poll every 8 seconds while modal is open

export function OrderMessagesModal({ open, onClose, orderId }: OrderMessagesModalProps) {
  const { user } = useAuthStore();
  const currentUserId = Number(user?.id);

  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isInitialLoad = useRef(true);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const loadMessages = async (silent = false) => {
    if (!orderId) return;
    try {
      if (!silent) setLoading(true);
      setError(null);
      const data = await fetchOrderMessages(orderId);
      setMessages(prev => {
        // Only scroll to bottom if new messages came in or this is first load
        const hasNew = data.length > prev.length;
        if (hasNew || isInitialLoad.current) {
          isInitialLoad.current = false;
          // Scroll after state update
          setTimeout(scrollToBottom, 50);
        }
        return data;
      });
    } catch (err: any) {
      // On silent poll don't overwrite user-visible error with poll failures
      if (!silent) {
        setError(err.response?.data?.message || 'Failed to load messages.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Start/stop polling based on open state
  useEffect(() => {
    if (open && orderId) {
      isInitialLoad.current = true;
      void loadMessages(false);

      pollTimerRef.current = setInterval(() => {
        void loadMessages(true);
      }, POLL_INTERVAL_MS);
    } else {
      setMessages([]);
      setNewMessage('');
      setError(null);
      isInitialLoad.current = true;
    }

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [open, orderId]);

  const handleSend = async () => {
    if (!orderId || !newMessage.trim()) return;
    try {
      setSending(true);
      setError(null);
      const msg = await sendOrderMessage(orderId, { content: newMessage.trim() });
      setMessages(prev => [...prev, msg]);
      setNewMessage('');
      setTimeout(scrollToBottom, 50);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  let lastDate = '';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { height: '80vh', display: 'flex', flexDirection: 'column' } }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
            Order Discussion
          </Typography>
          {/* Subtle live indicator */}
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: '#22c55e',
              boxShadow: '0 0 0 2px rgba(34,197,94,0.3)',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.4 },
              },
            }}
          />
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          bgcolor: '#f8fafc',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <CircularProgress size={32} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Typography color="error" variant="body2">{error}</Typography>
          </Box>
        ) : (
          <Box
            ref={scrollRef}
            sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}
          >
            {messages.length === 0 ? (
              <Box sx={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No messages yet. Start the conversation!
                </Typography>
              </Box>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderUserId === currentUserId;
                const isHqRole = ['TenantAdmin', 'HqManager', 'HqStaff'].includes(msg.senderRole);
                const msgDate = formatDate(msg.sentAt);
                const showDate = msgDate !== lastDate;
                if (showDate) lastDate = msgDate;

                return (
                  <Box key={msg.messageId} sx={{ display: 'flex', flexDirection: 'column' }}>
                    {showDate && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            bgcolor: alpha('#94a3b8', 0.15),
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 4,
                            color: 'text.secondary',
                            fontWeight: 600,
                          }}
                        >
                          {msgDate}
                        </Typography>
                      </Box>
                    )}
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 1.5,
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                      }}
                    >
                      {!isMe && (
                        <Avatar
                          sx={{
                            width: 28,
                            height: 28,
                            bgcolor: isHqRole ? '#0369a1' : '#b45309',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            flexShrink: 0,
                            alignSelf: 'flex-end',
                          }}
                        >
                          {msg.senderName.substring(0, 1).toUpperCase()}
                        </Avatar>
                      )}
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMe ? 'flex-end' : 'flex-start',
                        }}
                      >
                        {!isMe && (
                          <Typography
                            variant="caption"
                            sx={{ ml: 0.5, mb: 0.25, color: 'text.secondary', fontWeight: 600 }}
                          >
                            {msg.senderName}{isHqRole ? ' (HQ)' : ''}
                          </Typography>
                        )}
                        <Box
                          sx={{
                            px: 2,
                            py: 1.25,
                            borderRadius: 2,
                            borderBottomRightRadius: isMe ? 4 : 16,
                            borderBottomLeftRadius: !isMe ? 4 : 16,
                            bgcolor: isMe ? '#2563eb' : '#ffffff',
                            color: isMe ? '#ffffff' : 'text.primary',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            border: isMe ? 'none' : '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.5 }}
                          >
                            {msg.content}
                          </Typography>
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{ mt: 0.5, color: 'text.secondary', fontSize: '0.65rem' }}
                        >
                          {formatTime(msg.sentAt)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>
        )}
      </DialogContent>

      <Divider />
      <DialogActions sx={{ p: 2, bgcolor: 'background.paper' }}>
        {error && !loading && (
          <Typography variant="caption" color="error" sx={{ flex: 1, pl: 0.5 }}>
            {error}
          </Typography>
        )}
        <Box sx={{ display: 'flex', width: '100%', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            placeholder="Type your message..."
            multiline
            maxRows={4}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            disabled={loading || sending}
            sx={{
              '& .MuiInputBase-root': {
                borderRadius: 3,
                bgcolor: '#f8fafc',
                '&:hover': { bgcolor: '#f1f5f9' },
                '&.Mui-focused': { bgcolor: '#ffffff' },
              },
            }}
          />
          <IconButton
            color="primary"
            onClick={() => void handleSend()}
            disabled={!newMessage.trim() || sending}
            sx={{
              bgcolor: newMessage.trim() ? alpha('#2563eb', 0.1) : 'transparent',
              mb: 0.5,
              '&:hover': { bgcolor: alpha('#2563eb', 0.2) },
            }}
          >
            {sending ? <CircularProgress size={24} /> : <SendRoundedIcon />}
          </IconButton>
        </Box>
      </DialogActions>
    </Dialog>
  );
}