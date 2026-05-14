import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  Select,
  Typography,
  Grid
} from '@mui/material';
import type { AxiosError } from 'axios';
import { api } from '../../utils/api';
import { useNavigate, useSearch } from '@tanstack/react-router';
import ShoppingBagRoundedIcon from '@mui/icons-material/ShoppingBagRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import TagRoundedIcon from '@mui/icons-material/TagRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';

import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';
import { TextField } from '../../components/UI/TextField';
import { LoadingOverlay } from '../../components/UI/LoadingOverlay';
import {
  fetchEligibleOrders,
  fetchEligibleOrderDetail,
  createReturnDraft,
  updateReturnDraft,
  submitReturn,
  fetchReturns,
  type ReturnEligibleOrder,
  type ReturnRecord,
} from '../branch-operations/api';
import { ReturnItemTable } from './components/ReturnItemTable';
import { useAuthStore } from '../../store/useAuthStore';

function getErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? axiosError.message ?? 'Something went wrong.';
}

const REASON_OPTIONS = [
  { value: 'Damaged', label: 'Damaged' },
  { value: 'Expired', label: 'Expired' },
  { value: 'DeliveryError', label: 'Delivery Error' },
  { value: 'QualityIssue', label: 'Quality Issue' },
];

const RESOLUTION_OPTIONS = [
  { value: 'Replaced', label: 'Replacement' },
  { value: 'Credited', label: 'Stock Return' }, // Labeled "Stock Return" instead of "Credited" for UI
];

interface ItemLine {
  itemId: number;
  itemName: string;
  itemSku: string;
  quantityDelivered: number;
  branchStock: number;
  selected: boolean;
  quantityReturned: string;
  reasonCode: string;
  notes: string;
  photoUrls: string;
  imageFiles: File[];
}

export function ReturnCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isRestricted = user?.role === 'TenantAdmin' || user?.role === 'HqManager' || user?.role === 'HqStaff' || user?.role === 'HQ Staff';

  useEffect(() => {
    if (isRestricted) {
      navigate({ to: '/returns' });
    }
  }, [isRestricted, navigate]);

  const search = useSearch({ strict: false }) as { orderId?: string };
  if (isRestricted) return null;
  const preselectedOrderId = search.orderId ? Number(search.orderId) : null;

  // Step 1 — order selection
  const [eligibleOrders, setEligibleOrders] = useState<ReturnEligibleOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<number | ''>('');
  const [, setOrderDetail] = useState<ReturnEligibleOrder | null>(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);

  // Step 2 — item lines
  const [lines, setLines] = useState<ItemLine[]>([]);
  const [nextReturnId, setNextReturnId] = useState<number | null>(null);
  const [subject, setSubject] = useState('');
  const [resolution, setResolution] = useState('Replaced');
  const [reason, setReason] = useState('');
  const [returns, setReturns] = useState<ReturnRecord[]>([]);

  // We keep resolution and reason for general context, but not photoUrls
  // since images are now per-item.

  // Draft tracking
  const [draftId] = useState<number | null>(null);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load eligible orders on mount
  useEffect(() => {
    void (async () => {
      try {
        setOrdersLoading(true);
        const [orders, returnsList] = await Promise.all([
          fetchEligibleOrders(),
          fetchReturns()
        ]);
        
        setEligibleOrders(orders);
        setReturns(returnsList);
        
        if (returnsList.length > 0) {
          const maxId = Math.max(...returnsList.map(r => r.returnId));
          setNextReturnId(maxId + 1);
        } else {
          setNextReturnId(1);
        }

        if (preselectedOrderId) {
          setSelectedOrderId(preselectedOrderId);
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setOrdersLoading(false);
      }
    })();
  }, []);

  // Load order detail whenever selectedOrderId changes
  useEffect(() => {
    if (!selectedOrderId) {
      setOrderDetail(null);
      setLines([]);
      return;
    }

    void (async () => {
      try {
        setOrderDetailLoading(true);
        const detail = await fetchEligibleOrderDetail(Number(selectedOrderId));
        setOrderDetail(detail);
        setLines(
          detail.items.map((i) => ({
            itemId: i.itemId,
            itemName: i.itemName,
            itemSku: i.itemSku,
            quantityDelivered: i.quantityDelivered,
            branchStock: i.branchStock,
            selected: false,
            quantityReturned: '',
            reasonCode: 'Damaged',
            notes: '',
            photoUrls: '',
            imageFiles: [],
          })),
        );
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setOrderDetailLoading(false);
      }
    })();
  }, [selectedOrderId]);

  const selectedLines = lines.filter((l) => l.selected);

  const toggleLine = (itemId: number) => {
    setError(null);
    setLines((prev) =>
      prev.map((l) =>
        l.itemId === itemId ? { ...l, selected: !l.selected, quantityReturned: l.selected ? '' : l.quantityReturned } : l,
      ),
    );
  };

  const updateLine = (itemId: number, field: keyof ItemLine, value: any) => {
    setError(null);
    setLines((prev) => prev.map((l) => {
      if (l.itemId === itemId) {
        if (field === 'quantityReturned') {
          const numValue = Number(value);
          const maxAllowed = Math.min(l.quantityDelivered, l.branchStock);
          if (numValue > maxAllowed) {
            setError(`Quantity for ${l.itemName} exceeds allowed amount (${maxAllowed}).`);
            return { ...l, [field]: maxAllowed.toString() };
          }
        }
        return { ...l, [field]: value };
      }
      return l;
    }));
  };

  const validateLines = (): string | null => {
    if (selectedLines.length === 0) return 'Select at least one item to return.';
    for (const line of selectedLines) {
      const qty = Number(line.quantityReturned);
      if (!Number.isFinite(qty) || qty <= 0) return `Enter a valid quantity for ${line.itemName}.`;
      if (qty > line.quantityDelivered) return `Quantity for ${line.itemName} exceeds delivered amount (${line.quantityDelivered}).`;
    }
    return null;
  };

  const buildDraftPayload = () => ({
    orderId: Number(selectedOrderId),
    subject: subject.trim() || undefined,
    resolution,
    reason: reason.trim() || undefined,
    items: selectedLines.map((l) => ({
      itemId: l.itemId,
      quantityReturned: Number(l.quantityReturned),
      reasonCode: l.reasonCode,
      notes: l.notes?.trim() || undefined,
      photoUrls: l.photoUrls?.trim() || undefined,
    })),
  });


  const handleSubmit = async () => {
    const validationError = validateLines();
    if (validationError) { setError(validationError); return; }

    try {
      setIsSaving(true);
      setError(null);

      // 1. Upload local images to Cloudinary per item
      const nextId = nextReturnId ? `RET-${nextReturnId.toString().padStart(5, '0')}` : 'Returns';
      const folderPath = `Returns/${nextId}`;
      
      for (const line of selectedLines) {
        if (line.imageFiles.length > 0) {
          const currentUrls = line.photoUrls ? line.photoUrls.split(',').filter(Boolean) : [];
          for (const file of line.imageFiles) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', folderPath);
            
            const uploadRes = await api.post('/api/uploads/image', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            const url = uploadRes.data.url || uploadRes.data.Url;
            if (url) {
              currentUrls.push(url);
            }
          }
          line.photoUrls = currentUrls.join(',');
        }
      }

      // 2. Prepare payload with final URLs
      const payload = buildDraftPayload();

      let id = draftId;
      if (id) {
        await updateReturnDraft(id, payload);
      } else {
        const draft = await createReturnDraft(payload);
        id = draft.returnId;
      }

      // 3. Final submission
      await submitReturn(id!, reason);
      navigate({ to: '/returns/$returnId', params: { returnId: String(id) } });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  // Filter eligible orders: we should clearly flag or disable those already linked to a return
  const linkedOrderIds = useMemo(() => {
    return new Set(returns.map(r => r.orderId));
  }, [returns]);

  const getReturnStatusForOrder = (orderId: number) => {
    const record = returns.find(r => r.orderId === orderId);
    return record?.status;
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <BackButton to="/returns" />
        <Box>
          <Typography sx={{ fontSize: 20, fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
            File Return Request
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 500 }}>
            Create a return request linked to a delivered order.
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Container: Configuration */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ display: 'grid', gap: 3 }}>
            <Paper 
              elevation={0} 
              sx={{ 
                borderRadius: '16px', 
                border: '1px solid', 
                borderColor: 'divider',
                background: '#FFFFFF',
                overflow: 'hidden'
              }}
            >
              <Box sx={{ p: 2, bgcolor: '#FAF7F2', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <AssignmentRoundedIcon sx={{ fontSize: 18, color: '#6B4C2A' }} />
                <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#6B4C2A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Return Configuration
                </Typography>
              </Box>
              
              <Box sx={{ p: 3 }}>
                {/* Return Reference */}
                <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <TagRoundedIcon sx={{ fontSize: 18, color: '#6B4C2A' }} />
                  <Typography sx={{ fontSize: 12, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Reference ID
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: nextReturnId ? 'rgba(107,76,42,0.05)' : 'rgba(0,0,0,0.02)',
                    border: '1px solid',
                    borderColor: nextReturnId ? 'rgba(107,76,42,0.1)' : 'rgba(0,0,0,0.05)',
                  }}
                >
                  <TagRoundedIcon sx={{ fontSize: 16, color: nextReturnId ? '#6B4C2A' : 'text.secondary' }} />
                  {nextReturnId ? (
                    <Typography sx={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: '#6B4C2A' }}>
                      RET-{nextReturnId.toString().padStart(5, '0')}
                    </Typography>
                  ) : (
                    <Typography sx={{ fontSize: 12.5, fontStyle: 'italic', color: 'text.secondary' }}>
                      Calculating...
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Order Selection */}
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <ShoppingBagRoundedIcon sx={{ fontSize: 18, color: '#6B4C2A' }} />
                  <Typography sx={{ fontSize: 12, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Linked Order
                  </Typography>
                </Box>
                {ordersLoading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, p: 1 }}>
                    <CircularProgress size={14} thickness={6} sx={{ color: '#6B4C2A' }} />
                    <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>Fetching eligible orders...</Typography>
                  </Box>
                ) : (
                  <Select
                    value={selectedOrderId}
                    onChange={(e) => setSelectedOrderId(e.target.value as number)}
                    displayEmpty
                    size="small"
                    fullWidth
                    sx={{ 
                      fontSize: 14, 
                      fontWeight: 600,
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.08)' }
                    }}
                  >
                    <MenuItem value="" disabled>
                      <em>Select a delivered order...</em>
                    </MenuItem>
                    {eligibleOrders.map((o) => {
                      const isLinked = linkedOrderIds.has(o.orderId);
                      const returnStatus = getReturnStatusForOrder(o.orderId);
                      
                      return (
                        <MenuItem 
                          key={o.orderId} 
                          value={o.orderId}
                          disabled={isLinked}
                          sx={{
                            opacity: isLinked ? 0.6 : 1,
                            '&.Mui-disabled': { color: 'text.disabled' }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: isLinked ? 'text.disabled' : '#6B4C2A' }}>
                              {o.transactionCode || `ORD-${o.orderId}`}
                            </Typography>
                            {isLinked && (
                              <Chip 
                                label={returnStatus === 'Completed' ? 'Already Returned' : 'Return Pending'} 
                                size="small" 
                                sx={{ 
                                  height: 18, 
                                  fontSize: 10, 
                                  fontWeight: 700,
                                  bgcolor: 'rgba(0,0,0,0.05)',
                                  color: 'text.secondary',
                                  ml: 1
                                }} 
                              />
                            )}
                            <Typography sx={{ fontSize: 12, color: 'text.secondary', ml: 'auto' }}>
                              {new Date(o.deliveredAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </Select>
                )}
                {orderDetailLoading && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5, pl: 1 }}>
                    <CircularProgress size={12} thickness={6} sx={{ color: '#6B4C2A' }} />
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Loading items...</Typography>
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 3, opacity: 0.6 }} />

              {/* Resolution Configuration */}
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.5 }}>
                  Subject / Title
                </Typography>
                <TextField
                  placeholder="Example: Damaged delivery from morning shift"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  fullWidth
                  slotProps={{ htmlInput: { maxLength: 80 } }}
                />
              </Box>

              {/* Resolution Configuration */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <ErrorOutlineRoundedIcon sx={{ fontSize: 18, color: '#6B4C2A' }} />
                  <Typography sx={{ fontSize: 12, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Expected Resolution
                  </Typography>
                </Box>
                <Select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  size="small"
                  fullWidth
                  sx={{ 
                    fontSize: 14, 
                    fontWeight: 600,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.08)' }
                  }}
                >
                  {RESOLUTION_OPTIONS.map((r) => (
                    <MenuItem key={r.value} value={r.value} sx={{ fontSize: 13, fontWeight: 500 }}>
                      {r.label}
                    </MenuItem>
                  ))}
                </Select>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.5 }}>
                  Additional Notes
                </Typography>
                <TextField
                  placeholder="Provide context for the return..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  multiline
                  rows={3}
                  fullWidth
                />
              </Box>
            </Box>
          </Paper>

          </Box>
        </Grid>

        {/* Right Container: Item Composer */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {error && (
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  borderRadius: '12px', 
                  bgcolor: 'rgba(239,68,68,0.05)', 
                  border: '1px solid rgba(239,68,68,0.2)',
                  display: 'flex',
                  gap: 1.5
                }}
              >
                <ErrorOutlineRoundedIcon sx={{ color: 'error.main', fontSize: 18, mt: 0.2 }} />
                <Typography sx={{ fontSize: 13, color: 'error.dark', fontWeight: 500 }}>{error}</Typography>
              </Paper>
            )}
            <Paper 
              elevation={0} 
            sx={{ 
              borderRadius: '16px', 
              border: '1px solid', 
              borderColor: 'divider',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 500
            }}
          >
            <Box sx={{ p: 2.5, bgcolor: '#FAF7F2', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Inventory2RoundedIcon sx={{ fontSize: 20, color: '#6B4C2A' }} />
                <Box>
                  <Typography sx={{ fontSize: 15, fontWeight: 800, color: '#6B4C2A' }}>Item Composer</Typography>
                  <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 500 }}>
                    {selectedOrderId 
                      ? `Items from Order ${eligibleOrders.find(o => o.orderId === selectedOrderId)?.transactionCode || `ORD-${selectedOrderId}`}` 
                      : 'Select an order to load items'}
                  </Typography>
                </Box>
              </Box>
              {selectedLines.length > 0 && (
                <Chip 
                  label={`${selectedLines.length} Selected`} 
                  size="small" 
                  sx={{ 
                    bgcolor: 'rgba(107,76,42,0.1)', 
                    color: '#6B4C2A', 
                    fontWeight: 800, 
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    border: '1px solid rgba(107,76,42,0.1)'
                  }} 
                />
              )}
            </Box>

            <Box sx={{ flex: 1, p: 2 }}>
              {!selectedOrderId ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5, py: 8 }}>
                  <ShoppingBagRoundedIcon sx={{ fontSize: 64, color: 'divider', mb: 2 }} />
                  <Typography sx={{ fontWeight: 600, color: 'text.secondary' }}>No items loaded yet</Typography>
                  <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>Please select a linked order from the left panel.</Typography>
                </Box>
              ) : lines.length === 0 && !orderDetailLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', py: 8 }}>
                  <Typography sx={{ fontWeight: 600, color: 'text.secondary' }}>This order contains no items</Typography>
                </Box>
              ) : (
                <ReturnItemTable 
                  lines={lines} 
                  onToggleLine={toggleLine} 
                  onUpdateLine={updateLine}
                  reasons={REASON_OPTIONS}
                  onError={setError}
                />
              )}
            </Box>

            <Box sx={{ p: 3, bgcolor: '#FAFAFA', borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SendRoundedIcon />}
                onClick={handleSubmit}
                disabled={!selectedOrderId || lines.filter(l => l.selected).length === 0 || isSaving}
                sx={{ 
                  bgcolor: '#6B4C2A', 
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  fontWeight: 800,
                  fontSize: 15,
                  '&:hover': { bgcolor: '#543B21' },
                  '&.Mui-disabled': { bgcolor: 'rgba(107,76,42,0.3)', color: 'rgba(255,255,255,0.7)' }
                }}
              >
                {isSaving ? 'Processing...' : 'Process Return'}
              </Button>
            </Box>
          </Paper>
          </Box>
        </Grid>
      </Grid>
      <LoadingOverlay open={isSaving} />
    </Box>
  );
}
