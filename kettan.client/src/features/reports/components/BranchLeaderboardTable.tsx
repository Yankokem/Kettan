import { Box, Typography } from '@mui/material';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import { DataTable, type ColumnDef } from '../../../components/UI/DataTable';

interface LeaderboardItem {
  id: string;
  name: string;
  fulfillmentRate: number;
  returnRate: number;
  deliverySpeed: number;
  stockAccuracy: number;
  weightedScore: number;
  rank?: number;
}

interface LeaderboardProps {
  branches: LeaderboardItem[];
}

export function BranchLeaderboardTable({ branches }: LeaderboardProps) {
  const sorted = [...branches].sort((a, b) => b.weightedScore - a.weightedScore).map((b, i) => ({ ...b, rank: i + 1 }));

  const columns: ColumnDef<LeaderboardItem>[] = [
    {
      key: 'rank',
      label: 'Rank',
      gridWidth: '80px',
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: row.rank === 1 ? '#C9A84C' : 'text.primary' }}>
          #{row.rank}
        </Typography>
      )
    },
    {
      key: 'name',
      label: 'Branch',
      gridWidth: '2fr',
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.primary', fontWeight: 600 }}>
          {row.name}
        </Typography>
      )
    },
    {
      key: 'fulfillmentRate',
      label: 'Fulfill %',
      gridWidth: '1fr',
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: row.fulfillmentRate >= 95 ? 'success.main' : 'text.secondary', fontWeight: 500 }}>
          {row.fulfillmentRate}%
        </Typography>
      )
    },
    {
      key: 'returnRate',
      label: 'Return %',
      gridWidth: '1fr',
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: row.returnRate > 3 ? 'error.main' : 'text.secondary', fontWeight: 500 }}>
          {row.returnRate}%
        </Typography>
      )
    },
    {
      key: 'deliverySpeed',
      label: 'Speed',
      gridWidth: '1fr',
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>
          {row.deliverySpeed} hrs
        </Typography>
      )
    },
    {
      key: 'stockAccuracy',
      label: 'Accuracy',
      gridWidth: '1fr',
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>
          {row.stockAccuracy}%
        </Typography>
      )
    },
    {
      key: 'weightedScore',
      label: 'Score',
      gridWidth: '1fr',
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'primary.main' }}>
          {row.weightedScore.toFixed(1)}
        </Typography>
      )
    }
  ];

  return (
    <DataTable
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmojiEventsRoundedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          <Typography sx={{ fontSize: 16, fontWeight: 600 }}>Branch Performance Leaderboard</Typography>
        </Box>
      }
      data={sorted}
      columns={columns}
      keyExtractor={(row) => row.id}
    />
  );
}