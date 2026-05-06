import { useEffect, useState } from 'react';
import { Box, Typography, Card, LinearProgress, List, ListItem, CircularProgress, Chip } from '@mui/material';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { useNavigate } from '@tanstack/react-router';
import { fetchBranchScorecard } from '../../reports/reportsApi';

interface BranchScore {
  id: string;
  name: string;
  score: number;
  salesVolume: number;
  returnsCount: number;
}

export function BranchPerformance() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<BranchScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
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
      } finally {
        setIsLoading(false);
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
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        <EmojiEventsRoundedIcon sx={{ color: '#D97706', fontSize: 20 }} />
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary' }}>
          Branch Performance Ranking
        </Typography>
        <Chip 
          label="Last 30d" 
          size="small" 
          sx={{ 
            height: 18, 
            fontSize: 10, 
            fontWeight: 700, 
            bgcolor: 'rgba(107, 76, 42, 0.08)', 
            color: '#6B4C2A',
            ml: 'auto'
          }} 
        />
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', px: 1, mx: -1, maxHeight: 280 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={20} sx={{ color: '#6B4C2A' }} />
          </Box>
        ) : branches.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default', borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
            <TrendingUpRoundedIcon sx={{ color: 'text.disabled', fontSize: 32, mb: 1, opacity: 0.5 }} />
            <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>
              No performance data yet
            </Typography>
          </Box>
        ) : (
          <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1, py: 1 }}>
            {branches.map((branch, index) => (
              <ListItem 
                key={branch.id}
                disablePadding
                onClick={() => navigate({ to: '/branches/$branchId', params: { branchId: branch.id } })}
                sx={{ 
                  flexDirection: 'column', 
                  alignItems: 'flex-start',
                  p: 1.5,
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: 'rgba(0,0,0,0.06)',
                  bgcolor: 'background.paper',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(107, 76, 42, 0.04)',
                    borderColor: 'rgba(107, 76, 42, 0.2)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box 
                      sx={{ 
                        width: 24, 
                        height: 24, 
                        borderRadius: '50%', 
                        bgcolor: index === 0 ? '#FEF3C7' : 'rgba(107, 76, 42, 0.08)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        border: index === 0 ? '1px solid #F59E0B' : 'none'
                      }}
                    >
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: index === 0 ? '#B45309' : '#6B4C2A' }}>
                        {index + 1}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>
                      {branch.name}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6B4C2A' }}>
                    {branch.score}%
                  </Typography>
                </Box>
                
                <LinearProgress
                  variant="determinate"
                  value={branch.score}
                  sx={{
                    width: '100%',
                    height: 6,
                    borderRadius: 3,
                    bgcolor: 'rgba(0,0,0,0.04)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: index === 0 ? '#10B981' : branch.score < 50 ? '#EF4444' : '#B08B5A',
                      borderRadius: 3,
                    },
                  }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mt: 1 }}>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 600 }}>
                    Sales: {branch.salesVolume}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: branch.returnsCount > 0 ? '#EF4444' : 'text.secondary', fontWeight: 600 }}>
                    Returns: {branch.returnsCount}
                  </Typography>
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Card>
  );
}
