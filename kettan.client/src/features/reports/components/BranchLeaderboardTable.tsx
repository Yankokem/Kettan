import { Box, Typography } from '@mui/material';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import { KettanTable, type KettanColumnDef } from '../../../components/UI/KettanTable';

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

  const columns: KettanColumnDef<LeaderboardItem>[] = [
    {
      key: 'rank',
      label: 'Rank',
      width: 80,
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: row.rank === 1 ? '#C9A84C' : 'text.primary' }}>
          #{row.rank}
        </Typography>
      )
    },
    {
      key: 'name',
      label: 'Branch',
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.primary', fontWeight: 600 }}>
          {row.name}
        </Typography>
      )
    },
    {
      key: 'fulfillmentRate',
      label: 'Fulfill %',
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: row.fulfillmentRate >= 95 ? 'success.main' : 'text.secondary', fontWeight: 500 }}>
          {row.fulfillmentRate}%
        </Typography>
      )
    },
    {
      key: 'returnRate',
      label: 'Return %',
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: row.returnRate > 3 ? 'error.main' : 'text.secondary', fontWeight: 500 }}>
          {row.returnRate}%
        </Typography>
      )
    },
    {
      key: 'deliverySpeed',
      label: 'Speed (hrs)',
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>
          {row.deliverySpeed} hrs
        </Typography>
      )
    },
    {
      key: 'stockAccuracy',
      label: 'Accuracy',
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>
          {row.stockAccuracy}%
        </Typography>
      )
    },
    {
      key: 'weightedScore',
      label: 'Score',
      sortable: true,
      align: 'right',
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'primary.main' }}>
          {row.weightedScore.toFixed(1)}
        </Typography>
      )
    }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, px: 0.5 }}>
        <EmojiEventsRoundedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary', letterSpacing: '-0.01em' }}>Branch Performance Leaderboard</Typography>
      </Box>
      <KettanTable
        data={sorted}
        columns={columns}
        keyExtractor={(row) => row.id}
        defaultRowsPerPage={10}
        rowsPerPageOptions={[10, 25, 50]}
      />
    </Box>
  );
}