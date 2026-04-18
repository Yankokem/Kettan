import { Box, Card, Chip, Divider, Grid, Typography } from '@mui/material';
import { useParams } from '@tanstack/react-router';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import StickyNote2RoundedIcon from '@mui/icons-material/StickyNote2Rounded';
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AssignmentReturnRoundedIcon from '@mui/icons-material/AssignmentReturnRounded';
import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded';

import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';
import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { OrderFulfillmentStepper } from '../orders/components/OrderFulfillmentStepper';

// ─── Status color map ──────────────────────────────────────────────
const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  Draft:             { color: '#64748B', bg: 'rgba(100,116,139,0.12)' },
  AutoDrafted:       { color: '#7C3AED', bg: 'rgba(124,58,237,0.12)' },
  PendingApproval:   { color: '#B45309', bg: 'rgba(180,83,9,0.12)' },
  Approved:          { color: '#047857', bg: 'rgba(4,120,87,0.12)' },
  PartiallyApproved: { color: '#D97706', bg: 'rgba(217,119,6,0.12)' },
  Rejected:          { color: '#B91C1C', bg: 'rgba(185,28,28,0.10)' },
  // Order-side statuses (shown after approval creates an order)
  Processing:        { color: '#6B4C2A', bg: 'rgba(107,76,42,0.12)' },
  Picking:           { color: '#7C3AED', bg: 'rgba(124,58,237,0.12)' },
  Packed:            { color: '#0891B2', bg: 'rgba(8,145,178,0.12)' },
  Dispatched:        { color: '#546B3F', bg: 'rgba(84,107,63,0.12)' },
  InTransit:         { color: '#0D9488', bg: 'rgba(13,148,136,0.12)' },
  Delivered:         { color: '#047857', bg: 'rgba(4,120,87,0.12)' },
  Returned:          { color: '#9333EA', bg: 'rgba(147,51,234,0.12)' },
};

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    AutoDrafted: 'Auto-Drafted',
    PendingApproval: 'Pending Approval',
    PartiallyApproved: 'Partially Approved',
    InTransit: 'In Transit',
  };
  return labels[status] || status;
}

// ─── Mock data ─────────────────────────────────────────────────────
interface RequestItem {
  id: string;
  name: string;
  sku: string;
  qtyRequested: number;
  qtyApproved: number | null;
  fulfillmentStatus: 'Pending' | 'Filled' | 'Partial' | 'Unfilled';
}

interface TimelineEntry {
  status: string;
  timestamp: string;
  actor: string;
  remarks?: string;
}

const MOCK_STATUS: string = 'Approved';
const MOCK_LINKED_ORDER = 'ORD-8894';

const MOCK_ITEMS: RequestItem[] = [
  { id: '1', name: 'Arabica Coffee Beans (Medium Roast) - 5kg',  sku: 'CF-ARB-MR-5KG',  qtyRequested: 4,  qtyApproved: 4,    fulfillmentStatus: 'Filled' },
  { id: '2', name: 'Almond Milk - 1L Carton',                    sku: 'MLK-ALM-1L',      qtyRequested: 24, qtyApproved: 10,   fulfillmentStatus: 'Partial' },
  { id: '3', name: 'Vanilla Syrup - 750ml Bottle',               sku: 'SYR-VAN-750',     qtyRequested: 6,  qtyApproved: 0,    fulfillmentStatus: 'Unfilled' },
  { id: '4', name: 'Paper Cups (12oz) - Box of 500',             sku: 'PKG-CUP-12-500',  qtyRequested: 2,  qtyApproved: 2,    fulfillmentStatus: 'Filled' },
  { id: '5', name: 'Matcha Powder (Premium) - 1kg',              sku: 'TEA-MAT-PRM-1KG', qtyRequested: 3,  qtyApproved: null, fulfillmentStatus: 'Pending' },
];

const MOCK_TIMELINE: TimelineEntry[] = [
  { status: 'Draft',            timestamp: '2026-04-04T08:30:00Z', actor: 'Maria Santos',          remarks: 'Request created manually' },
  { status: 'PendingApproval',  timestamp: '2026-04-04T09:15:00Z', actor: 'Maria Santos',          remarks: 'Submitted to HQ for review' },
  { status: 'Approved',         timestamp: '2026-04-05T10:20:00Z', actor: 'John Cruz (HQ Manager)', remarks: 'Approved with partial fulfillment for Almond Milk due to low HQ stock' },
];

// ─── Columns ───────────────────────────────────────────────────────
const ITEM_COLUMNS: ColumnDef<RequestItem>[] = [
  {
    key: 'name',
    label: 'Item',
    render: (row) => (
      <Box>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>{row.name}</Typography>
        <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontFamily: 'monospace' }}>{row.sku}</Typography>
      </Box>
    ),
  },
  {
    key: 'qtyRequested',
    label: 'Requested',
    width: 100,
    align: 'center',
    render: (row) => (
      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{row.qtyRequested}</Typography>
    ),
  },
  {
    key: 'qtyApproved',
    label: 'Approved',
    width: 100,
    align: 'center',
    render: (row) => {
      if (row.qtyApproved === null) return <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>—</Typography>;
      const isShort = row.qtyApproved < row.qtyRequested;
      return (
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: isShort ? '#B45309' : 'text.primary' }}>
          {row.qtyApproved}
        </Typography>
      );
    },
  },
  {
    key: 'fulfillmentStatus',
    label: 'Status',
    width: 120,
    render: (row) => {
      const map: Record<string, { color: string; bg: string }> = {
        Pending:  { color: '#64748B', bg: 'rgba(100,116,139,0.12)' },
        Filled:   { color: '#047857', bg: 'rgba(4,120,87,0.12)' },
        Partial:  { color: '#B45309', bg: 'rgba(180,83,9,0.12)' },
        Unfilled: { color: '#B91C1C', bg: 'rgba(185,28,28,0.10)' },
      };
      const s = map[row.fulfillmentStatus] || map.Pending;
      return (
        <Chip
          label={row.fulfillmentStatus}
          size="small"
          sx={{ fontSize: 11, fontWeight: 700, bgcolor: s.bg, color: s.color, border: `1px solid ${s.color}28` }}
        />
      );
    },
  },
];

// ─── Detail field helper ───────────────────────────────────────────
function DetailField({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
        {icon}
        <Typography
          sx={{
            fontSize: 11.5,
            color: 'text.secondary',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {label}
        </Typography>
      </Box>
      <Box sx={{ ml: 3.5 }}>{children}</Box>
    </Box>
  );
}

// ─── Supply Request Detail Page ────────────────────────────────────
export function SupplyRequestDetailPage() {
  const { requestId } = useParams({ strict: false });
  const displayId = requestId ? `SR-${requestId.padStart(5, '0')}` : 'SR-00042';

  // In production these would come from API — using mock data for now
  const status = MOCK_STATUS;
  const stColor = STATUS_COLORS[status] || STATUS_COLORS.Draft;

  const isDraft = status === 'Draft' || status === 'AutoDrafted';
  const isDelivered = status === 'Delivered';
  const showStepper = status !== 'Draft' && status !== 'AutoDrafted' && status !== 'Rejected';

  return (
    <Box sx={{ pb: 4, pt: 1 }}>
      {/* ── Header ──────────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <BackButton to="/supply-requests" />
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', fontFamily: 'monospace' }}>
                {displayId}
              </Typography>
              <Chip
                label={statusLabel(status)}
                icon={status === 'PendingApproval' ? <AccessTimeFilledRoundedIcon sx={{ fontSize: 14 }} /> : undefined}
                size="small"
                sx={{
                  fontSize: 12,
                  fontWeight: 600,
                  bgcolor: stColor.bg,
                  color: stColor.color,
                  border: `1px solid ${stColor.color}28`,
                }}
              />
            </Box>
            <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }}>
              Submitted by <strong>Maria Santos</strong> on Apr 04, 2026
            </Typography>
          </Box>
        </Box>

        {/* Contextual actions */}
        <Box sx={{ display: 'flex', gap: 1.5, pt: 0.5 }}>
          {isDraft && (
            <>
              <Button variant="outlined" startIcon={<EditRoundedIcon />}>
                Edit Draft
              </Button>
              <Button startIcon={<SendRoundedIcon />}>
                Submit to HQ
              </Button>
            </>
          )}
          {isDelivered && (
            <>
              <Button startIcon={<CheckCircleRoundedIcon />}>
                Confirm Delivery
              </Button>
              <Button variant="outlined" startIcon={<AssignmentReturnRoundedIcon />} sx={{ color: '#B45309', borderColor: '#B45309' }}>
                File Return
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* ── Stepper ─────────────────────────────────────── */}
      {showStepper && <OrderFulfillmentStepper status={status} />}

      {/* ── Content grid ────────────────────────────────── */}
      <Grid container spacing={3}>
        {/* Left: Request Details Panel */}
        <Grid size={{ xs: 12, md: 3.5 }}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2.5, bgcolor: '#f8fafc', borderBottom: '1px solid', borderColor: 'divider' }}>
              <DescriptionRoundedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              <Typography sx={{ fontSize: 16, fontWeight: 600 }}>Request Details</Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', p: 2.5, gap: 2.5 }}>
              <DetailField icon={<StorefrontRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />} label="Branch">
                <Typography sx={{ fontSize: 14, fontWeight: 500 }}>Downtown Main</Typography>
              </DetailField>

              <DetailField icon={<PriorityHighRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />} label="Priority">
                <Chip label="Normal" size="small" sx={{ fontSize: 11.5, fontWeight: 600 }} />
              </DetailField>

              <DetailField icon={<CategoryRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />} label="Request Type">
                <Typography sx={{ fontSize: 14, fontWeight: 500 }}>Manual Internal Request</Typography>
              </DetailField>

              <DetailField icon={<ScheduleRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />} label="Dispatch Window">
                <Typography sx={{ fontSize: 14, fontWeight: 500 }}>Next Business Day</Typography>
              </DetailField>

              <DetailField icon={<EventRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />} label="Submitted">
                <Typography sx={{ fontSize: 14, fontWeight: 500 }}>Apr 04, 2026 — 9:15 AM</Typography>
              </DetailField>

              <DetailField icon={<PersonOutlineRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />} label="Requested By">
                <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                  Maria Santos
                  <Typography component="span" sx={{ fontSize: 13, color: 'text.disabled', ml: 0.5 }}>(Branch Manager)</Typography>
                </Typography>
              </DetailField>

              <DetailField icon={<InfoRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />} label="Status">
                <Chip
                  label={statusLabel(status)}
                  size="small"
                  sx={{ fontSize: 12, fontWeight: 600, bgcolor: stColor.bg, color: stColor.color, border: `1px solid ${stColor.color}28` }}
                />
              </DetailField>

              {/* Linked Order — only visible after approval */}
              {MOCK_LINKED_ORDER && (
                <DetailField icon={<LinkRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />} label="Linked Order">
                  <Chip
                    label={MOCK_LINKED_ORDER}
                    size="small"
                    clickable
                    sx={{
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      fontSize: 12,
                      bgcolor: 'rgba(37,99,235,0.1)',
                      color: '#2563EB',
                      border: '1px solid rgba(37,99,235,0.25)',
                      '&:hover': { bgcolor: 'rgba(37,99,235,0.18)' },
                    }}
                  />
                </DetailField>
              )}

              {/* Notes */}
              <Box sx={{ bgcolor: 'rgba(241,245,249,0.6)', p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <StickyNote2RoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Notes
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.5, color: '#334155' }}>
                  Prioritize milk and cups for weekend volume. Partial fulfillment is acceptable for syrups — we have some remaining stock.
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Right: Items Table + Timeline */}
        <Grid size={{ xs: 12, md: 8.5 }}>
          {/* Items table */}
          <DataTable
            title="Requested Items"
            data={MOCK_ITEMS}
            columns={ITEM_COLUMNS}
            keyExtractor={(row) => row.id}
            defaultRowsPerPage={10}
            rowsPerPageOptions={[10, 25]}
          />

          {/* Status Timeline */}
          <Card elevation={0} sx={{ mt: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2.5, bgcolor: '#f8fafc', borderBottom: '1px solid', borderColor: 'divider' }}>
              <AccessTimeFilledRoundedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              <Typography sx={{ fontSize: 16, fontWeight: 600 }}>Status Timeline</Typography>
            </Box>

            <Box sx={{ p: 2.5 }}>
              {MOCK_TIMELINE.map((entry, idx) => {
                const ec = STATUS_COLORS[entry.status] || STATUS_COLORS.Draft;
                const isLast = idx === MOCK_TIMELINE.length - 1;
                return (
                  <Box key={idx} sx={{ display: 'flex', gap: 2, mb: isLast ? 0 : 2.5, position: 'relative' }}>
                    {/* Vertical line */}
                    {!isLast && (
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 11,
                          top: 28,
                          bottom: -20,
                          width: 2,
                          bgcolor: 'divider',
                        }}
                      />
                    )}
                    {/* Dot */}
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        bgcolor: ec.bg,
                        border: `2px solid ${ec.color}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        mt: 0.25,
                      }}
                    >
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: ec.color }} />
                    </Box>
                    {/* Content */}
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={statusLabel(entry.status)}
                          size="small"
                          sx={{
                            fontSize: 11,
                            fontWeight: 700,
                            bgcolor: ec.bg,
                            color: ec.color,
                            border: `1px solid ${ec.color}28`,
                          }}
                        />
                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                          {new Date(entry.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary', mt: 0.4 }}>
                        {entry.actor}
                      </Typography>
                      {entry.remarks && (
                        <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.25, lineHeight: 1.5 }}>
                          {entry.remarks}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 0 }} />
    </Box>
  );
}
