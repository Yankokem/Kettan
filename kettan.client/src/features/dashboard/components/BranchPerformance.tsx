import { useEffect, useState } from 'react';
import { Box, Typography, Card, LinearProgress } from '@mui/material';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import { fetchBranchScorecard } from '../../reports/reportsApi';

interface BranchScore {
  id: string;
  name: string;
  score: number;
  salesVolume: number;
  returnsCount: number;
}

export function BranchPerformance() {
  const [branches, setBranches] = useState<BranchScore[]>([]);

  useEffect(() => {
    const load = async () => {
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 30);

      try {
        const rows = await fetchBranchScorecard(startDate.toISOString(), endDate.toISOString());
        setBranches(
          rows
            .map((row) => ({
              id: String(row.branchId),
              name: row.branchName,
              score: row.scorePercentage,
              salesVolume: row.salesVolume,
              returnsCount: row.returnsCount,
            }))
            .sort((left, right) => right.score - left.score),
        );
      } catch {
        setBranches([]);
      }
    };

    void load();
  }, []);

  return (
    <Card
      elevation={0}
      sx={{
        p: 2.5,
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '14px',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, gap: 1 }}>
        <EmojiEventsRoundedIcon sx={{ color: '#D97706', fontSize: 20 }} />
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary' }}>
          Branch Performance Ranking
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {branches.length === 0 ? (
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>
            No branch scorecard data is available yet.
          </Typography>
        ) : branches.map((branch, index) => (
          <Box key={branch.id}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography sx={{ fontSize: 13.5, fontWeight: 500, color: 'text.primary' }}>
                <Typography component="span" sx={{ color: 'text.secondary', mr: 1 }}>
                  #{index + 1}
                </Typography>
                {branch.name}
              </Typography>
              <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: '#6B4C2A' }}>
                {branch.score} pts
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={branch.score}
              sx={{
                height: 6,
                borderRadius: '14px',
                bgcolor: 'divider',
                '& .MuiLinearProgress-bar': {
                  bgcolor: index === 0 ? '#16A34A' : branch.score < 80 ? '#DC2626' : '#6B4C2A',
                  borderRadius: '14px',
                },
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>
                Sales volume: {branch.salesVolume.toLocaleString()}
              </Typography>
              <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>
                Returns: {branch.returnsCount.toLocaleString()}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Card>
  );
}
