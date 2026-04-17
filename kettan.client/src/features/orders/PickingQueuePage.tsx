import { useMemo, useState } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import CheckBoxRoundedIcon from '@mui/icons-material/CheckBoxRounded';
import { useNavigate } from '@tanstack/react-router';

import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { Button } from '../../components/UI/Button';
import { SearchInput } from '../../components/UI/SearchInput';
import { StatCard } from '../../components/UI/StatCard';

type PickingStatus = 'Approved' | 'Picking' | 'Packed';

interface PickingQueueRow {
  id: string;
  branch: string;
  requestedAt: string;
  itemsCount: number;
  priority: 'Normal' | 'Urgent';
  picker?: string;
  status: PickingStatus;
}

const INITIAL_ROWS: PickingQueueRow[] = [
  { id: 'ORD-9011', branch: 'Downtown Main', requestedAt: '2026-04-17T08:15:00Z', itemsCount: 12, priority: 'Urgent', status: 'Approved' },
  { id: 'ORD-9010', branch: 'Airport Express', requestedAt: '2026-04-17T07:20:00Z', itemsCount: 8, priority: 'Normal', picker: 'Ana Reyes', status: 'Picking' },
  { id: 'ORD-9009', branch: 'Uptown Station', requestedAt: '2026-04-16T16:50:00Z', itemsCount: 19, priority: 'Normal', status: 'Approved' },
  { id: 'ORD-9008', branch: 'Westside Market', requestedAt: '2026-04-16T13:10:00Z', itemsCount: 6, priority: 'Urgent', picker: 'Mark Lim', status: 'Picking' },
  { id: 'ORD-9007', branch: 'North Point', requestedAt: '2026-04-16T10:40:00Z', itemsCount: 10, priority: 'Normal', picker: 'Ana Reyes', status: 'Packed' },
];

function statusChipStyle(status: PickingStatus) {
  if (status === 'Approved') {
    return { color: '#2563EB', bg: 'rgba(37,99,235,0.12)' };
  }

  if (status === 'Picking') {
    return { color: '#B45309', bg: 'rgba(180,83,9,0.12)' };
  }

  return { color: '#047857', bg: 'rgba(4,120,87,0.12)' };
}

export function PickingQueuePage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState(INITIAL_ROWS);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return rows;
    }

    return rows.filter((row) => {
      return (
        row.id.toLowerCase().includes(query) ||
        row.branch.toLowerCase().includes(query) ||
        row.status.toLowerCase().includes(query) ||
        (row.picker ?? '').toLowerCase().includes(query)
      );
    });
  }, [rows, searchQuery]);

  const moveToPicking = (orderId: string) => {
    setRows((previous) =>
      previous.map((row) =>
        row.id === orderId ? { ...row, status: 'Picking', picker: row.picker ?? 'Assigned HQ Staff' } : row,
      ),
    );
  };

  const markPacked = (orderId: string) => {
    setRows((previous) =>
      previous.map((row) => (row.id === orderId ? { ...row, status: 'Packed' } : row)),
    );
  };

  const columns: ColumnDef<PickingQueueRow>[] = [
    {
      key: 'id',
      label: 'Order',
      width: 120,
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6B4C2A', fontFamily: 'monospace' }}>
          {row.id}
        </Typography>
      ),
    },
    {
      key: 'branch',
      label: 'Branch',
      render: (row) => <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>{row.branch}</Typography>,
    },
    {
      key: 'itemsCount',
      label: 'Items',
      width: 90,
      sortable: true,
      align: 'center',
      render: (row) => <Typography sx={{ fontSize: 13 }}>{row.itemsCount}</Typography>,
    },
    {
      key: 'priority',
      label: 'Priority',
      width: 110,
      render: (row) => (
        <Chip
          label={row.priority}
          size="small"
          sx={{
            fontSize: 11,
            fontWeight: 700,
            bgcolor: row.priority === 'Urgent' ? 'rgba(185,28,28,0.1)' : 'rgba(84,107,63,0.12)',
            color: row.priority === 'Urgent' ? '#B91C1C' : '#546B3F',
            border: `1px solid ${row.priority === 'Urgent' ? 'rgba(185,28,28,0.24)' : 'rgba(84,107,63,0.28)'}`,
          }}
        />
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: 120,
      render: (row) => {
        const style = statusChipStyle(row.status);
        return (
          <Chip
            label={row.status}
            size="small"
            sx={{
              fontSize: 11.5,
              fontWeight: 700,
              bgcolor: style.bg,
              color: style.color,
              border: `1px solid ${style.color}2b`,
            }}
          />
        );
      },
    },
    {
      key: 'requestedAt',
      label: 'Requested',
      width: 120,
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
          {new Date(row.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Typography>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: 260,
      align: 'right',
      render: (row) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.8 }}>
          <Button
            size="small"
            variant="outlined"
            sx={{ height: 32, px: 1.4 }}
            onClick={() => navigate({ to: '/orders/$orderId', params: { orderId: row.id } })}
          >
            View
          </Button>
          <Button
            size="small"
            variant="outlined"
            sx={{ height: 32, px: 1.4 }}
            disabled={row.status !== 'Approved'}
            onClick={() => moveToPicking(row.id)}
          >
            Start Picking
          </Button>
          <Button
            size="small"
            sx={{ height: 32, px: 1.4 }}
            disabled={row.status !== 'Picking'}
            onClick={() => markPacked(row.id)}
          >
            Mark Packed
          </Button>
        </Box>
      ),
    },
  ];

  const approvedCount = rows.filter((row) => row.status === 'Approved').length;
  const pickingCount = rows.filter((row) => row.status === 'Picking').length;
  const packedCount = rows.filter((row) => row.status === 'Packed').length;

  return (
    <Box sx={{ pb: 3, pt: 1 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 3 }}>
          <StatCard
            label="Awaiting Picker"
            value={approvedCount}
            icon={<PendingActionsRoundedIcon />}
            trend="up"
            trendValue="+2"
            accentClass="stat-accent-gold"
            iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
          />
          <StatCard
            label="Currently Picking"
            value={pickingCount}
            icon={<Inventory2RoundedIcon />}
            trend="up"
            trendValue="+1"
            accentClass="stat-accent-brown"
            iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
          />
          <StatCard
            label="Packed This Queue"
            value={packedCount}
            icon={<CheckBoxRoundedIcon />}
            trend="up"
            trendValue="+3"
            accentClass="stat-accent-sage"
            iconBg="linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)"
          />
        </Box>
      </Box>

      <DataTable
        title="Picking and Packing Queue"
        data={filteredRows}
        columns={columns}
        keyExtractor={(row) => row.id}
        emptyMessage="No orders in this queue."
        toolbar={
          <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center', flexWrap: 'wrap' }}>
            <SearchInput
              placeholder="Search order, branch, picker..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              sx={{ minWidth: 280, maxWidth: 420 }}
            />
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
              Queue demo: approve in Orders, then process here.
            </Typography>
          </Box>
        }
      />
    </Box>
  );
}
